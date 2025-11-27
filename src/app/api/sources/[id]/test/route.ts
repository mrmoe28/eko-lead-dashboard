import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { leadSources } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

export const dynamic = 'force-dynamic';

// POST - Test a lead source
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Update last tested timestamp
    await db
      .update(leadSources)
      .set({
        lastTestedAt: new Date(),
        status: 'testing',
        updatedAt: new Date(),
      })
      .where(eq(leadSources.id, parseInt(id)));

    // TODO: Implement actual testing logic
    // This could scrape the URL or process the file to generate test leads

    return NextResponse.json({ success: true, message: 'Test started' });
  } catch (error) {
    console.error('Error testing lead source:', error);
    return NextResponse.json({ error: 'Failed to test source' }, { status: 500 });
  }
}
