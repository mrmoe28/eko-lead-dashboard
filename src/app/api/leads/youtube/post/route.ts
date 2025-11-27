import { NextRequest, NextResponse } from 'next/server';
import { google } from 'googleapis';
import { readFileSync } from 'fs';
import { join } from 'path';
import { db } from '@/lib/db';
import { contactedLeads } from '@/lib/db/schema';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { commentId, replyText, leadName, priority, intent, videoUrl } = body;

    if (!commentId || !replyText) {
      return NextResponse.json(
        { error: 'Comment ID and reply text are required' },
        { status: 400 }
      );
    }

    // Load OAuth credentials
    const oauthPath = join(process.cwd(), 'youtube-oauth.json');
    const tokenPath = join(process.cwd(), 'youtube-token.json');

    let credentials;
    let token;

    try {
      credentials = JSON.parse(readFileSync(oauthPath, 'utf-8'));
      token = JSON.parse(readFileSync(tokenPath, 'utf-8'));
    } catch (error) {
      console.error('Error loading OAuth files:', error);
      return NextResponse.json(
        { error: 'YouTube OAuth not configured. Please set up authentication.' },
        { status: 500 }
      );
    }

    // Initialize YouTube API
    const oauth2Client = new google.auth.OAuth2(
      credentials.installed.client_id,
      credentials.installed.client_secret,
      credentials.installed.redirect_uris[0]
    );

    oauth2Client.setCredentials(token);

    const youtube = google.youtube({
      version: 'v3',
      auth: oauth2Client,
    });

    // Extract comment ID from URL if it's a full URL
    let actualCommentId = commentId;
    if (commentId.includes('lc=')) {
      const match = commentId.match(/lc=([^&]+)/);
      if (match) {
        actualCommentId = match[1];
      }
    }

    // Post the reply to YouTube
    const response = await youtube.comments.insert({
      part: ['snippet'],
      requestBody: {
        snippet: {
          parentId: actualCommentId,
          textOriginal: replyText,
        },
      },
    });

    // Save to contacted_leads table
    await db.insert(contactedLeads).values({
      commentId: actualCommentId,
      leadName: leadName || 'Unknown',
      priority: priority || 'Unknown',
      intent: intent || 'Unknown',
      replyText,
      videoUrl: videoUrl || '',
    });

    const youtubeReplyUrl = `${videoUrl}`;

    return NextResponse.json({
      success: true,
      youtubeUrl: youtubeReplyUrl,
      commentId: response.data.id,
    });

  } catch (error: any) {
    console.error('Error posting YouTube reply:', error);

    // Handle specific YouTube API errors
    if (error.code === 403) {
      return NextResponse.json(
        { error: 'YouTube API quota exceeded or permission denied' },
        { status: 403 }
      );
    }

    if (error.code === 400) {
      return NextResponse.json(
        { error: 'Invalid comment ID or the comment may be disabled' },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: error.message || 'Failed to post YouTube reply' },
      { status: 500 }
    );
  }
}
