// app/api/explain/route.js

import OpenAI from 'openai';
import { NextResponse } from 'next/server';

// Initialize the OpenAI client with the new v4 syntax
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(request) {
  try {
    const { text } = await request.json();
    
    if (!process.env.OPENAI_API_KEY) {
      console.error('OpenAI API key is missing');
      return NextResponse.json(
        { error: 'OpenAI API key is not configured' },
        { status: 500 }
      );
    }

    // Make the API call using the new v4 syntax
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini', // Updated model name
      messages: [
        {
          role: 'user',
          content: `Please explain the following text in simple and digestible terms, using analogies and examples to help the user understand:\n\n"${text}"`,
        },
      ],
    });

    const explanation = completion.choices[0].message.content;
    return NextResponse.json({ explanation });
  } catch (error) {
    console.error('Error fetching explanation:', error);
    return NextResponse.json(
      { error: 'An error occurred while fetching the explanation.' },
      { status: 500 }
    );
  }
}
