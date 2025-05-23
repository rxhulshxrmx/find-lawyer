import { GoogleGenerativeAI } from '@google/generative-ai';
import { StreamingTextResponse, GoogleGenerativeAIStream } from 'ai';

interface SearchResult {
  content: string;
  similarity: number;
  metadata?: Record<string, unknown>;
}

// Initialize the Google Generative AI client
const genAI = new GoogleGenerativeAI(process.env.GOOGLE_GENERATIVE_AI_API_KEY || '');

export const runtime = 'edge';

function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }
  return typeof error === 'string' ? error : 'Unknown error';
}

export async function POST(req: Request) {
  console.log('Chat API called');
  
  try {
    const { messages } = await req.json();
    console.log('Received messages:', JSON.stringify(messages, null, 2));
    
    const lastMessage = messages[messages.length - 1];
    if (!lastMessage?.content) {
      throw new Error('No message content provided');
    }

    console.log('Searching for lawyers with query:', lastMessage.content);
    
    // Search for relevant lawyers
    const searchUrl = new URL('/api/search', process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000');
    const searchResponse = await fetch(searchUrl.toString(), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query: lastMessage.content }),
    });

    console.log('Search response status:', searchResponse.status);
    
    if (!searchResponse.ok) {
      const errorText = await searchResponse.text();
      console.error('Search API error:', errorText);
      throw new Error(`Search API returned ${searchResponse.status}: ${errorText}`);
    }

    const searchData = await searchResponse.json() as { results?: SearchResult[] };
    console.log('Search results count:', searchData.results?.length || 0);
    
    const relevantContent = searchData.results || [];
    
    if (relevantContent.length === 0) {
      console.log('No relevant content found for query:', lastMessage.content);
      const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });
      const result = await model.generateContentStream({
        contents: [{
          role: 'user',
          parts: [{ 
            text: 'No lawyers found matching your criteria. Please try a different search query.' 
          }]
        }],
      });
      return new StreamingTextResponse(GoogleGenerativeAIStream(result));
    }

    // Format lawyer information
    const lawyerInfo = relevantContent.map(result => {
      try {
        const lawyer = typeof result.content === 'string' ? JSON.parse(result.content) : result.content;
        return `
Name: ${lawyer.Name || 'N/A'}
Location: ${lawyer.Location || 'N/A'}
Experience: ${lawyer.Experience || 'N/A'} years
Languages: ${lawyer.Languages || 'N/A'}
Practice Areas: ${lawyer['Practice Areas'] || lawyer.practiceAreas || 'N/A'}
About: ${lawyer.About || lawyer.about || 'N/A'}
Court: ${lawyer.Court || lawyer.court || 'N/A'}
Profile: ${lawyer['Profile Link'] || lawyer.profileLink || 'N/A'}
-------------------`;
      } catch (e) {
        console.error('Error parsing lawyer data:', e);
        return `Error: Could not parse lawyer information`;
      }
    }).join('\n\n');

    console.log('Generated lawyer info:', lawyerInfo.substring(0, 500) + '...');

    // Create a prompt that instructs Gemini to format the response nicely
    const prompt = `Based on the following lawyer information, provide a helpful response to: "${lastMessage.content}"

Lawyer Information:
${lawyerInfo}

Format the response in a clear, structured way with all relevant details about the lawyers that match the query.`;

    console.log('Sending prompt to Gemini...');
    
    try {
      const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });
      const result = await model.generateContentStream({
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
      });

      console.log('Received response from Gemini');
      return new StreamingTextResponse(GoogleGenerativeAIStream(result));
    } catch (geminiError) {
      console.error('Error calling Gemini API:', geminiError);
      throw new Error(`Failed to generate response: ${getErrorMessage(geminiError)}`);
    }
  } catch (error) {
    console.error('Error in chat API:', error);
    const errorMessage = getErrorMessage(error);
    
    try {
      const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });
      const result = await model.generateContentStream({
        contents: [{
          role: 'user',
          parts: [{ 
            text: `I'm sorry, but I encountered an error: ${errorMessage}. Please try again or rephrase your question.` 
          }]
        }],
      });
      return new StreamingTextResponse(GoogleGenerativeAIStream(result));
    } catch (fallbackError) {
      console.error('Fallback error handler failed:', fallbackError);
      return new Response(
        JSON.stringify({ error: 'An unexpected error occurred', details: errorMessage }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }
  }
}