// pages/api/explain.js
import OpenAI from 'openai';

export default async function handler(req, res) {
  const { text } = req.body;

  const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  });

  try {
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini', // 
      messages: [
        { role: 'system', content: 'You are an assistant that explains text for academic setting and hopes to provide a thorough explanation.' },
        { role: 'user', content: `Please explain the following text in simple and digestable terms, use analogies and examples to help the user understand:\n\n"${text}"` },
      ],
    });

    const explanation = completion.choices[0].message.content;
    res.status(200).json({ explanation });
  } catch (error) {
    console.error('Error fetching explanation:', error);
    res.status(500).json({ error: 'An error occurred while fetching the explanation.' });
  }
}
