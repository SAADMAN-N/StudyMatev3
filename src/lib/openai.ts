import OpenAI from 'openai';

export const generateAIResponse = async (messages: { role: 'user' | 'assistant' | 'system', content: string }[], apiKey: string) => {
  const openai = new OpenAI({
    apiKey: apiKey,
    dangerouslyAllowBrowser: true
  });

  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "system",
          content: "You are a knowledgeable and patient tutor. Your goal is to help students understand complex topics by breaking them down into simpler concepts. Always encourage critical thinking and provide examples when relevant. If you're not sure about something, admit it and suggest reliable sources for further reading."
        },
        ...messages
      ],
      temperature: 0.7,
      max_tokens: 500,
    });

    return completion.choices[0].message.content;
  } catch (error: any) {
    console.error('OpenAI API Error:', error);
    throw new Error(error.message || 'Failed to communicate with OpenAI');
  }
};
