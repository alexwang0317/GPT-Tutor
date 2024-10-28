// app/api/explain/route.js
import { NextResponse } from 'next/server';
import { Configuration, OpenAIApi } from 'openai';

export async function POST(req) {
  const { text } = await req.json();

  const configuration = new Configuration({
    apiKey: process.env.OPENAI_API_KEY,
  });
  const openai = new OpenAIApi(configuration);

  try {
    const completion = await openai.createChatCompletion({
      model: 'gpt-4o-mini', 
      messages: [
        { role: 'system', content: 'You are an assistant that explains text for academic setting and hopes to provide a thorough explanation.' },
        { role: 'user', content: `Please explain the following text in simple and digestable terms, use analogies and examples to help the user understand:\n\n"${text}"` },
      ],
    });

    const explanation = completion.data.choices[0].message.content;
    return NextResponse.json({ explanation });
  } catch (error) {
    console.error('Error fetching explanation:', error);
    return NextResponse.json({ error: 'An error occurred while fetching the explanation.' }, { status: 500 });
  }
}