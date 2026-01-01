import OpenAI from 'openai';

export const describeImageWithAI = async (imageBuffer) => {
  console.log('🤖 Starting AI image analysis, buffer size:', imageBuffer.length);

  // This function assumes you have access to OpenAI's GPT-4 Vision or similar API
  // For Google Gemini Vision, use their SDK
  const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

  if (!process.env.OPENAI_API_KEY) {
    console.error('❌ OpenAI API key not found');
    return 'OpenAI API key not configured';
  }

  try {
    // Convert buffer to base64
    const base64Image = imageBuffer.toString('base64');

    // Check if image is too large for OpenAI (they have a 20MB limit for base64)
    const maxSizeBytes = 20 * 1024 * 1024; // 20MB
    if (base64Image.length > maxSizeBytes) {
      console.log('📸 Image too large for OpenAI, skipping analysis');
      return `Image too large for analysis (${Math.round(base64Image.length / 1024 / 1024)}MB). OpenAI limit is 20MB.`;
    }

    console.log('📸 Sending image to OpenAI for analysis, base64 length:', base64Image.length, 'bytes');

    const response = await openai.chat.completions.create({
      model: 'gpt-4o', // Updated to current GPT-4 Vision model
      messages: [
        {
          role: 'user',
          content: [
            { type: 'text', text: 'Describe the content and context of this image for document analysis. Be detailed and specific about what you see, including any text, charts, diagrams, or visual elements.' },
            {
              type: 'image_url',
              image_url: {
                url: `data:image/png;base64,${base64Image}`
              }
            }
          ]
        }
      ],
      max_tokens: 300
    });

    const description = response.choices[0].message.content;
    console.log('✅ AI analysis completed, response length:', description.length);
    return description;

  } catch (e) {
    console.error('❌ Image description AI error:', e.message);
    console.error('❌ Error details:', e);
    return `Failed to analyze image: ${e.message}`;
  }
};
