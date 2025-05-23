import { NextResponse } from 'next/server';
import { findRelevantContent } from '@/lib/ai/embedding';

function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }
  return typeof error === 'string' ? error : 'Unknown error';
}

export async function POST(req: Request) {
  console.log('Search API called');
  
  try {
    const { query } = await req.json();
    
    if (!query || typeof query !== 'string') {
      console.error('Invalid query:', query);
      return NextResponse.json(
        { error: 'Query is required and must be a string' },
        { status: 400 }
      );
    }
    
    console.log('Searching for query:', query);
    const results = await findRelevantContent(query);
    console.log(`Found ${results.length} results`);
    
    if (results.length > 0) {
      console.log('Sample result:', {
        id: results[0].id,
        similarity: results[0].similarity,
        content: typeof results[0].content === 'string' ? 
          results[0].content.substring(0, 100) + '...' : 
          'Object content'
      });
    }
    
    return NextResponse.json({ results });
  } catch (error) {
    const errorMessage = getErrorMessage(error);
    console.error('Search error:', errorMessage, '\nFull error:', error);
    
    return NextResponse.json(
      { 
        error: 'Failed to search lawyers',
        details: process.env.NODE_ENV === 'development' ? errorMessage : undefined 
      },
      { status: 500 }
    );
  }
}