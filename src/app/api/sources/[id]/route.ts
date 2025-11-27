import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { leadSources } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

export const dynamic = 'force-dynamic';

// PATCH - Update lead source status
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { status } = body;

    if (!status) {
      return NextResponse.json({ error: 'Status is required' }, { status: 400 });
    }

    await db
      .update(leadSources)
      .set({ status, updatedAt: new Date() })
      .where(eq(leadSources.id, parseInt(id)));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error updating lead source:', error);
    return NextResponse.json({ error: 'Failed to update source' }, { status: 500 });
  }
}

// DELETE - Delete lead source
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    await db.delete(leadSources).where(eq(leadSources.id, parseInt(id)));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting lead source:', error);
    return NextResponse.json({ error: 'Failed to delete source' }, { status: 500 });
  }
}
