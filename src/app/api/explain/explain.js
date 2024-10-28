// pages/api/explain.js
import { Configuration, OpenAIApi } from 'openai';

export default async function handler(req, res) {
  const { text } = req.body;

  const configuration = new Configuration({
    apiKey: process.env.OPENAI_API_KEY,
  });
  const openai = new OpenAIApi(configuration);

  try {
    const completion = await openai.createChatCompletion({
      model: 'gpt-4o-mini', // Use 'gpt-4' if you have access
      messages: [
        { role: 'system', content: 'You are an assistant that explains text for academic setting and hopes to provide a thorough explanation.' },
        { role: 'user', content: `Please explain the following text in simple and digestable terms, use analogies and examples to help the user understand:\n\n"${text}"` },
      ],
    });

    const explanation = completion.data.choices[0].message.content;
    res.status(200).json({ explanation });
  } catch (error) {
    console.error('Error fetching explanation:', error);
    res.status(500).json({ error: 'An error occurred while fetching the explanation.' });
  }
}