import { db } from "@/lib/db";
import { scrapingLogs, scrapingSessions } from "@/lib/db/schema";
import { eq, desc, gt } from "drizzle-orm";

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

  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      let lastLogId = 0;

      const sendEvent = (data: any) => {
        controller.enqueue(
          encoder.encode(`data: ${JSON.stringify(data)}\n\n`)
        );
      };

      // Poll for updates every 2 seconds
      const intervalId = setInterval(async () => {
        try {
          // Get new logs since last check
          const newLogs = await db
            .select()
            .from(scrapingLogs)
            .where(
              eq(scrapingLogs.sessionId, sessionId)
            )
            .orderBy(desc(scrapingLogs.timestamp))
            .limit(10);

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
              clearInterval(intervalId);
              controller.close();
            }
          }
        } catch (error) {
          console.error('SSE streaming error:', error);
          clearInterval(intervalId);
          controller.close();
        }
      }, 2000); // Poll every 2 seconds

      // Clean up on connection close
      request.signal.addEventListener('abort', () => {
        clearInterval(intervalId);
        controller.close();
      });
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    },
  });
}
