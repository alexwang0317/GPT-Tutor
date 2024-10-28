import OpenAI from 'openai';
import { NextResponse } from 'next/server';

// Initialize the OpenAI client only when needed to avoid potential issues with environment variables
export async function POST(request) {
  try {
    // Validate environment variable
    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json(
        { error: 'OpenAI API key is not configured' },
        { status: 500 }
      );
    }

    // Initialize the OpenAI client inside the handler
    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });

    // Parse the request body
    const body = await request.json();
    const { text } = body;

    // Validate the required field
    if (!text) {
      return NextResponse.json(
        { error: 'Missing "text" in request body' },
        { status: 400 }
      );
    }

    // Make the API call using the new v4 syntax
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: 'You are an assistant that explains text for an academic setting and aims to provide thorough explanations.',
        },
        {
          role: 'user',
          content: `Please explain the following text in simple and digestible terms, using analogies and examples to help the user understand:\n\n"${text}"`,
        },
      ],
    });

    // Return the explanation
    return NextResponse.json({ 
      explanation: completion.choices[0].message.content 
    });
    
  } catch (error) {
    console.error('Error in /api/explain:', error);
    return NextResponse.json(
      { error: 'An error occurred while fetching the explanation' },
      { status: 500 }
    );
  }
}