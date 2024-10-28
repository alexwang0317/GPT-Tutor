// app/api/explain/route.js

import { Configuration, OpenAIApi } from 'openai';
import { NextResponse } from 'next/server';

// Initialize the OpenAI client
const configuration = new Configuration({
  apiKey: process.env.OPENAI_API_KEY,
});
const openai = new OpenAIApi(configuration);

export async function POST(request) {
  try {
    const { text } = await request.json();

    // Make the API call to OpenAI
    const completion = await openai.createChatCompletion({
      model: 'gpt-4o-mini', // or 'gpt-4' if you have access
      messages: [
        {
          role: 'user',
          content: `Please explain the following text in simple and digestible terms, using analogies and examples to help the user understand:\n\n"${text}"`,
        },
      ],
    });

    const explanation = completion.data.choices[0].message.content;
    return NextResponse.json({ explanation });
  } catch (error) {
    console.error('Error fetching explanation:', error);
    return NextResponse.json(
      { error: 'An error occurred while fetching the explanation.' },
      { status: 500 }
    );
  }
}