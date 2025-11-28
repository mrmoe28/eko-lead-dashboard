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

    const prompt = `You are a creative animation designer specializing in modern, tech-forward background animations.

Design a cool, subtle background animation for a hero section with the following requirements:
1. Modern, abstract particle system or flowing elements
2. Blue/cyan/purple color scheme matching tech/AI theme
3. Subtle and elegant - should not distract from text content
4. Smooth, continuous animations
5. Professional and sophisticated aesthetic
6. Works well as a background element with reduced opacity

Provide specific design recommendations including:
- Animation type (particles, waves, flowing gradients, etc.)
- Color palette with specific hex/rgb values
- Animation speed and timing
- Visual effects (glow, blur, connections between elements)
- Particle/object count and behavior

Keep the response concise and actionable with specific technical details.`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const designSuggestions = response.text();

    return NextResponse.json({ 
      suggestions: designSuggestions,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error generating animation design:', error);
    return NextResponse.json(
      { error: 'Failed to generate design suggestions' },
      { status: 500 }
    );
  }
}

