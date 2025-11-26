import {
  pgTable,
  text,
  integer,
  timestamp,
  serial,
} from 'drizzle-orm/pg-core';

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
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export type Lead = typeof leads.$inferSelect;
export type NewLead = typeof leads.$inferInsert;
