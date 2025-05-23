import { GoogleGenerativeAI } from '@google/generative-ai';
import { StreamingTextResponse, GoogleGenerativeAIStream } from 'ai';
import { findRelevantContent } from '@/lib/ai/embedding';

interface SearchResult {
  content: string;
  similarity: number;
  metadata?: Record<string, unknown>;
}

// Initialize the Google Generative AI client
const genAI = new GoogleGenerativeAI(process.env.GOOGLE_GENERATIVE_AI_API_KEY || '');

function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }
  return typeof error === 'string' ? error : 'Unknown error';
}

// Add OPTIONS handler for CORS
export async function OPTIONS() {
  return new Response(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization, Accept',
      'Access-Control-Max-Age': '86400'
    }
  });
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
    
    try {
      // Search for relevant lawyers directly
      const results = await findRelevantContent(lastMessage.content);
      console.log('Search results count:', results.length);
      
      if (results.length === 0) {
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
      const lawyerInfo = results.map(result => {
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
        return new StreamingTextResponse(GoogleGenerativeAIStream(result), {
          headers: {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type, Authorization, Accept'
          }
        });
      } catch (geminiError) {
        console.error('Error calling Gemini API:', geminiError);
        throw new Error(`Failed to generate response: ${getErrorMessage(geminiError)}`);
      }
    } catch (searchError) {
      console.error('Search error:', searchError);
      throw new Error(`Search failed: ${getErrorMessage(searchError)}`);
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
        { 
          status: 500, 
          headers: { 
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type, Authorization, Accept'
          } 
        }
      );
    }
  }
}