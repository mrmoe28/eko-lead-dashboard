import { db } from "@/lib/db";
import { scrapingLogs, scrapingSessions } from "@/lib/db/schema";
import { eq, desc } from "drizzle-orm";

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const sessionId = parseInt(id);

  if (isNaN(sessionId)) {
    return new Response("Invalid session ID", { status: 400 });
  }

  // Check if session exists first
  const [existingSession] = await db
    .select()
    .from(scrapingSessions)
    .where(eq(scrapingSessions.id, sessionId))
    .limit(1);

  if (!existingSession) {
    return new Response("Session not found", { status: 404 });
  }

  // Don't stream for already completed/failed sessions
  if (existingSession.status === 'completed' || existingSession.status === 'failed') {
    return new Response("Session already finished", { status: 410 });
  }

  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      let lastLogId = 0;
      let isClosing = false;

      const sendEvent = (data: object) => {
        if (isClosing) return;
        try {
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify(data)}\n\n`)
          );
        } catch (e) {
          // Controller may be closed, ignore
        }
      };

      const closeStream = (intervalId: NodeJS.Timeout) => {
        if (isClosing) return;
        isClosing = true;
        clearInterval(intervalId);
        try {
          controller.close();
        } catch (e) {
          // Already closed, ignore
        }
      };

      // Send initial connection acknowledgment
      sendEvent({
        type: 'connected',
        data: { sessionId, timestamp: new Date().toISOString() },
      });

      // Poll for updates every 2 seconds
      const intervalId = setInterval(async () => {
        if (isClosing) return;
        
        try {
          // Get new logs since last check
          const newLogs = await db
            .select()
            .from(scrapingLogs)
            .where(
              eq(scrapingLogs.sessionId, sessionId)
            )
            .orderBy(desc(scrapingLogs.timestamp))
            .limit(20);

          if (newLogs.length > 0) {
            // Filter logs newer than last sent
            const logsToSend = newLogs.filter(log => log.id > lastLogId);

            if (logsToSend.length > 0) {
              lastLogId = Math.max(...logsToSend.map(l => l.id));

              sendEvent({
                type: 'logs',
                data: logsToSend.reverse(), // Reverse to show chronological order
              });
            }
          }

          // Get session status
          const [session] = await db
            .select()
            .from(scrapingSessions)
            .where(eq(scrapingSessions.id, sessionId))
            .limit(1);

          if (session) {
            sendEvent({
              type: 'session',
              data: session,
            });

            // Stop streaming if session is completed or failed
            if (session.status === 'completed' || session.status === 'failed') {
              closeStream(intervalId);
            }
          } else {
            // Session was deleted
            closeStream(intervalId);
          }
        } catch (error) {
          console.error('SSE streaming error:', error);
          closeStream(intervalId);
        }
      }, 2000); // Poll every 2 seconds

      // Clean up on connection close
      request.signal.addEventListener('abort', () => {
        closeStream(intervalId);
      });
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      'Connection': 'keep-alive',
      'X-Accel-Buffering': 'no', // Disable nginx buffering
    },
  });
}
