import {
  pgTable,
  text,
  integer,
  timestamp,
  serial,
  boolean,
  real,
} from 'drizzle-orm/pg-core';

// Scraping Sessions - Track each scraping run
export const scrapingSessions = pgTable('scraping_sessions', {
  id: serial('id').primaryKey(),
  location: text('location').notNull(),
  status: text('status').notNull(), // 'pending', 'running', 'completed', 'failed'
  totalLeadsFound: integer('total_leads_found').default(0).notNull(),
  sourcesScraped: text('sources_scraped').array(), // Array of source names
  startedAt: timestamp('started_at').defaultNow().notNull(),
  completedAt: timestamp('completed_at'),
  errorMessage: text('error_message'),
  workerId: text('worker_id'), // Worker that processed this job
  proxyUsed: text('proxy_used'), // Proxy URL used
  retryCount: integer('retry_count').default(0).notNull(),
  timeoutAt: timestamp('timeout_at'), // Job timeout
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

// Lead Sources - Track and test different lead sources
export const leadSources = pgTable('lead_sources', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  type: text('type').notNull(), // 'url', 'file', 'manual'
  url: text('url'),
  fileName: text('file_name'),
  status: text('status').notNull().default('active'), // 'active', 'testing', 'paused', 'archived'
  totalLeads: integer('total_leads').default(0).notNull(),
  qualityScore: integer('quality_score').default(0), // 0-100
  conversionRate: integer('conversion_rate').default(0), // percentage
  avgLeadScore: integer('avg_lead_score').default(0),
  lastTestedAt: timestamp('last_tested_at'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Lead Source Analytics - Detailed analytics per source
export const leadSourceAnalytics = pgTable('lead_source_analytics', {
  id: serial('id').primaryKey(),
  sourceId: integer('source_id').notNull(),
  date: timestamp('date').notNull(),
  leadsGenerated: integer('leads_generated').default(0).notNull(),
  hotLeads: integer('hot_leads').default(0).notNull(),
  warmLeads: integer('warm_leads').default(0).notNull(),
  coldLeads: integer('cold_leads').default(0).notNull(),
  avgResponseTime: integer('avg_response_time'), // in minutes
  conversionCount: integer('conversion_count').default(0).notNull(),
  revenue: integer('revenue').default(0), // in cents
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// Worker Instances - Track worker processes
export const workerInstances = pgTable('worker_instances', {
  id: serial('id').primaryKey(),
  workerId: text('worker_id').unique().notNull(),
  status: text('status').notNull(), // 'running', 'idle', 'crashed', 'stopped'
  lastHeartbeat: timestamp('last_heartbeat'),
  jobsProcessed: integer('jobs_processed').default(0).notNull(),
  errorsCount: integer('errors_count').default(0).notNull(),
  currentJobId: integer('current_job_id'),
  startedAt: timestamp('started_at').defaultNow().notNull(),
  stoppedAt: timestamp('stopped_at'),
});

// Proxy Pool - Manage rotating proxies
export const proxyPool = pgTable('proxy_pool', {
  id: serial('id').primaryKey(),
  proxyUrl: text('proxy_url').unique().notNull(),
  status: text('status').notNull(), // 'active', 'failed', 'testing'
  successRate: real('success_rate').default(0),
  avgResponseTime: integer('avg_response_time'), // in ms
  lastUsed: timestamp('last_used'),
  lastHealthCheck: timestamp('last_health_check'),
  failuresCount: integer('failures_count').default(0).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// Scraper Metrics - Time-series metrics per source
export const scraperMetrics = pgTable('scraper_metrics', {
  id: serial('id').primaryKey(),
  source: text('source').notNull(),
  timestamp: timestamp('timestamp').defaultNow().notNull(),
  requestsCount: integer('requests_count').default(0).notNull(),
  successCount: integer('success_count').default(0).notNull(),
  errorCount: integer('error_count').default(0).notNull(),
  avgResponseTime: integer('avg_response_time'), // in ms
  leadsFound: integer('leads_found').default(0).notNull(),
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

export type LeadSource = typeof leadSources.$inferSelect;
export type NewLeadSource = typeof leadSources.$inferInsert;

export type LeadSourceAnalytic = typeof leadSourceAnalytics.$inferSelect;
export type NewLeadSourceAnalytic = typeof leadSourceAnalytics.$inferInsert;

export type WorkerInstance = typeof workerInstances.$inferSelect;
export type NewWorkerInstance = typeof workerInstances.$inferInsert;

export type ProxyPool = typeof proxyPool.$inferSelect;
export type NewProxyPool = typeof proxyPool.$inferInsert;

export type ScraperMetric = typeof scraperMetrics.$inferSelect;
export type NewScraperMetric = typeof scraperMetrics.$inferInsert;
