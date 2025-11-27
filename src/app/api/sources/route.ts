import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { leadSources } from '@/lib/db/schema';
import { desc } from 'drizzle-orm';

export const dynamic = 'force-dynamic';

// GET - Fetch all lead sources
export async function GET() {
  try {
    const sources = await db
      .select()
      .from(leadSources)
      .orderBy(desc(leadSources.createdAt));

    return NextResponse.json({ sources });
  } catch (error) {
    console.error('Error fetching lead sources:', error);
    return NextResponse.json({ error: 'Failed to fetch sources' }, { status: 500 });
  }
}

// POST - Create new lead source
export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const name = formData.get('name') as string;
    const type = formData.get('type') as 'url' | 'file';
    const url = formData.get('url') as string | null;
    const file = formData.get('file') as File | null;

    if (!name || !type) {
      return NextResponse.json(
        { error: 'Name and type are required' },
        { status: 400 }
      );
    }

    const newSource: any = {
      name,
      type,
      status: 'testing',
    };

    if (type === 'url' && url) {
      newSource.url = url;
    } else if (type === 'file' && file) {
      newSource.fileName = file.name;
      // TODO: Store file in cloud storage and save the URL
    }

    const [source] = await db
      .insert(leadSources)
      .values(newSource)
      .returning();

    return NextResponse.json({ source });
  } catch (error) {
    console.error('Error creating lead source:', error);
    return NextResponse.json({ error: 'Failed to create source' }, { status: 500 });
  }
}
