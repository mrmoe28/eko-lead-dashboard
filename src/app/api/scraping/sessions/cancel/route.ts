import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { scrapingSessions } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (id) {
      // Cancel specific session
      await db
        .delete(scrapingSessions)
        .where(eq(scrapingSessions.id, parseInt(id)));

      return NextResponse.json({
        success: true,
        message: `Session #${id} cancelled`,
      });
    } else {
      // Cancel all pending sessions
      await db
        .delete(scrapingSessions)
        .where(eq(scrapingSessions.status, "pending"));

      return NextResponse.json({
        success: true,
        message: "All pending sessions cancelled",
      });
    }
  } catch (error) {
    console.error("Error cancelling sessions:", error);
    return NextResponse.json(
      { error: "Failed to cancel sessions" },
      { status: 500 }
    );
  }
}
