import OpenAI from 'openai';

export const describeImageWithAI = async (imageBuffer) => {
  // This function assumes you have access to OpenAI's GPT-4 Vision or similar API
  // For Google Gemini Vision, use their SDK
  const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4-vision-preview',
      messages: [
        {
          role: 'user',
          content: [
            { type: 'text', text: 'Describe the content and context of this image for document analysis.' },
            { type: 'image', image: imageBuffer }
          ]
        }
      ],
      max_tokens: 256
    });
    return response.choices[0].message.content;
  } catch (e) {
    console.error('Image description AI error:', e.message);
    return '';
  }
};
