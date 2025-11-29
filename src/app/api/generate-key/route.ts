import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const { service_name, description } = await request.json();

    // Generate secure API key
    const generateApiKey = (service: string) => {
      const prefix = `eko_${service.toLowerCase()}`;
      const randomBytes = Array.from(crypto.getRandomValues(new Uint8Array(32)));
      const hexKey = randomBytes.map(b => b.toString(16).padStart(2, '0')).join('');
      return `${prefix}_sk_${hexKey}`;
    };

    const apiKey = generateApiKey(service_name);
    
    console.log(`Generated API key for ${service_name}: ${apiKey}`);

    return NextResponse.json({
      success: true,
      api_key: apiKey,
      service_name,
      description,
      generated_at: new Date().toISOString(),
      message: `API key generated for ${service_name}`
    });

  } catch (error) {
    console.error('API key generation error:', error);
    return NextResponse.json(
      { error: "Failed to generate API key" },
      { status: 500 }
    );
  }
}