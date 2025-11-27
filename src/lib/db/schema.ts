import {
  pgTable,
  text,
  integer,
  timestamp,
  serial,
  boolean,
} from 'drizzle-orm/pg-core';

// Scraping Sessions - Track each scraping run
export const scrapingSessions = pgTable('scraping_sessions', {
  id: serial('id').primaryKey(),
  location: text('location').notNull(),
  status: text('status').notNull(), // 'running', 'completed', 'failed'
  totalLeadsFound: integer('total_leads_found').default(0).notNull(),
  sourcesScraped: text('sources_scraped').array(), // Array of source names
  startedAt: timestamp('started_at').defaultNow().notNull(),
  completedAt: timestamp('completed_at'),
  errorMessage: text('error_message'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Scraping Logs - Real-time scraping activity
export const scrapingLogs = pgTable('scraping_logs', {
  id: serial('id').primaryKey(),
  sessionId: integer('session_id').notNull(),
  source: text('source').notNull(), // 'Reddit', 'Facebook', etc.
  message: text('message').notNull(),
  leadCount: integer('lead_count').default(0).notNull(),
  status: text('status').notNull(), // 'processing', 'success', 'error'
  timestamp: timestamp('timestamp').defaultNow().notNull(),
});

// Enhanced Leads Table
export const leads = pgTable('leads', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  location: text('location').notNull(),
  score: integer('score').notNull(),
  priority: text('priority').notNull(), // 'urgent', 'high', 'medium'
  source: text('source').notNull(), // 'Nextdoor', 'HomeAdvisor', etc.
  phone: text('phone'),
  email: text('email'),
  request: text('request').notNull(),
  whyHot: text('why_hot'),
  actionRequired: text('action_required'),
  postedTime: text('posted_time'),
  profileUrl: text('profile_url'),
  originalPostUrl: text('original_post_url'),
  revenueMin: integer('revenue_min'),
  revenueMax: integer('revenue_max'),
  autoSubmitted: integer('auto_submitted').default(0), // 0 or 1 (boolean)
  // New fields for scraper integration
  sessionId: integer('session_id'),
  address: text('address'),
  systemSize: text('system_size'),
  permitNumber: text('permit_number'),
  message: text('message'),
  intent: text('intent'),
  scrapedAt: timestamp('scraped_at'),
  // YouTube reply fields
  youtubeReplyText: text('youtube_reply_text'),
  youtubeReplyStatus: text('youtube_reply_status').default('pending'), // 'pending', 'approved', 'posted', 'skipped'
  youtubePostedAt: timestamp('youtube_posted_at'),
  youtubeCommentId: text('youtube_comment_id'), // ID of the comment we replied to
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Contacted Leads - Track all leads we've contacted on YouTube
export const contactedLeads = pgTable('contacted_leads', {
  id: serial('id').primaryKey(),
  commentId: text('comment_id').unique().notNull(),
  leadName: text('lead_name'),
  priority: text('priority'),
  intent: text('intent'),
  replyText: text('reply_text').notNull(),
  videoUrl: text('video_url'),
  contactedAt: timestamp('contacted_at').defaultNow().notNull(),
});

// Type exports
export type ScrapingSession = typeof scrapingSessions.$inferSelect;
export type NewScrapingSession = typeof scrapingSessions.$inferInsert;

export type ScrapingLog = typeof scrapingLogs.$inferSelect;
export type NewScrapingLog = typeof scrapingLogs.$inferInsert;

export type Lead = typeof leads.$inferSelect;
export type NewLead = typeof leads.$inferInsert;

export type ContactedLead = typeof contactedLeads.$inferSelect;
export type NewContactedLead = typeof contactedLeads.$inferInsert;
