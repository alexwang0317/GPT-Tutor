// pages/api/explain.js

import OpenAI from 'openai';

export default async function handler(req, res) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed. Use POST.' });
  }

  const { text } = req.body;

  if (!text) {
    return res.status(400).json({ error: 'Missing "text" in request body.' });
  }

  // Initialize the OpenAI client with configuration
  const openai = new OpenAI();  // apiKey will be automatically read from process.env.OPENAI_API_KEY

  try {
    // Make the API call to OpenAI
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

    // Extract the assistant's reply
    const explanation = completion.choices[0].message.content;

    return res.status(200).json({ explanation });
  } catch (error) {
    console.error('Error fetching explanation:', error.response?.data || error.message);
    return res.status(500).json({ error: 'An error occurred while fetching the explanation.' });
  }
}
