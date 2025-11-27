import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

export const dynamic = 'force-dynamic';

const CONTACT_INFO = {
  name: 'Moe',
  company: 'EKO SOLAR',
  phone: '404-551-6532',
  email: 'ekosolarize@gmail.com',
  website: 'www.ekosolarpros.com',
};

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { leadMessage, priority, intent, location, leadName } = body;

    if (!leadMessage) {
      return NextResponse.json({ error: 'Lead message is required' }, { status: 400 });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: 'GEMINI_API_KEY not configured' }, { status: 500 });
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });

    const prompt = `You are Moe from EKO SOLAR, a friendly solar expert helping people with solar panel questions.

LEAD DETAILS:
- Name: ${leadName || 'User'}
- Location: ${location || 'Georgia'}
- Priority: ${priority || 'Hot'}
- Intent: ${intent || 'Unknown'}
- Their Comment: "${leadMessage}"

CONTACT INFO:
- Name: ${CONTACT_INFO.name}
- Company: ${CONTACT_INFO.company}
- Phone: ${CONTACT_INFO.phone}
- Email: ${CONTACT_INFO.email}
- Website: ${CONTACT_INFO.website}

INSTRUCTIONS:
1. Write a helpful, friendly YouTube comment reply addressing their specific question/concern
2. Show genuine expertise and empathy
3. Keep it conversational and casual (like a real YouTube comment)
4. End with your contact info naturally
5. Maximum 150 words
6. Be specific to their issue - don't give generic advice
7. Use their name if available

Generate only the reply text, nothing else.`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const reply = response.text();

    return NextResponse.json({ reply });

  } catch (error) {
    console.error('Error generating YouTube reply:', error);
    return NextResponse.json(
      { error: 'Failed to generate reply' },
      { status: 500 }
    );
  }
}
