// app/api/explain/route.js
import { NextResponse } from 'next/server';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(request) {
  try {
    const { text } = await request.json();

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",  // or "gpt-3.5-turbo" depending on your needs
      messages: [
        {
          role: "user",
          content: `
Please explain the following text in simple and digestable terms, use analogies and examples to help the user understand:\n\n"${text}"`
        }
      ],
    });

    const explanation = completion.choices[0].message.content;
    return NextResponse.json({ explanation });
  } catch (error) {
    console.error('Error fetching explanation:', error);
    return NextResponse.json({ error: 'An error occurred while fetching the explanation.' }, { status: 500 });
  }
}
