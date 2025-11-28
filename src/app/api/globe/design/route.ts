import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: 'GEMINI_API_KEY not configured' }, { status: 500 });
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash-exp' });

    const prompt = `You are a UI/UX designer specializing in data visualizations and interactive globes.

Design a world globe animation component with the following requirements:
1. A 3D-style globe showing countries
2. Animated light beams jumping between major countries
3. Modern, sleek design with blue/cyan/purple color scheme
4. Smooth animations with great circle paths (curved routes)
5. Glowing effects on countries and light beams
6. Professional, tech-forward aesthetic

Provide design suggestions including:
- Color palette recommendations
- Animation timing suggestions
- Visual effects recommendations
- Country selection for connections
- Any additional visual enhancements

Keep the response concise and actionable.`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const designSuggestions = response.text();

    return NextResponse.json({ 
      suggestions: designSuggestions,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error generating design suggestions:', error);
    return NextResponse.json(
      { error: 'Failed to generate design suggestions' },
      { status: 500 }
    );
  }
}

