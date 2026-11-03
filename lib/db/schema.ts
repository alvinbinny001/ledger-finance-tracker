import {
  boolean,
  date,
  index,
  integer,
  pgTable,
  serial,
  text,
  timestamp,
  uniqueIndex,
} from 'drizzle-orm/pg-core'

export const user = pgTable('user', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  email: text('email').notNull().unique(),
  emailVerified: boolean('emailVerified').notNull().default(false),
  image: text('image'),
  createdAt: timestamp('createdAt').notNull().defaultNow(),
  updatedAt: timestamp('updatedAt').notNull().defaultNow(),
})

export const session = pgTable('session', {
  id: text('id').primaryKey(),
  expiresAt: timestamp('expiresAt').notNull(),
  token: text('token').notNull().unique(),
  createdAt: timestamp('createdAt').notNull().defaultNow(),
  updatedAt: timestamp('updatedAt').notNull().defaultNow(),
  ipAddress: text('ipAddress'),
  userAgent: text('userAgent'),
  userId: text('userId')
    .notNull()
    .references(() => user.id, { onDelete: 'cascade' }),
})

export const account = pgTable('account', {
  id: text('id').primaryKey(),
  accountId: text('accountId').notNull(),
  providerId: text('providerId').notNull(),
  userId: text('userId')
    .notNull()
    .references(() => user.id, { onDelete: 'cascade' }),
  accessToken: text('accessToken'),
  refreshToken: text('refreshToken'),
  idToken: text('idToken'),
  accessTokenExpiresAt: timestamp('accessTokenExpiresAt'),
  refreshTokenExpiresAt: timestamp('refreshTokenExpiresAt'),
  scope: text('scope'),
  password: text('password'),
  createdAt: timestamp('createdAt').notNull().defaultNow(),
  updatedAt: timestamp('updatedAt').notNull().defaultNow(),
})

export const verification = pgTable('verification', {
  id: text('id').primaryKey(),
  identifier: text('identifier').notNull(),
  value: text('value').notNull(),
  expiresAt: timestamp('expiresAt').notNull(),
  createdAt: timestamp('createdAt').defaultNow(),
  updatedAt: timestamp('updatedAt').defaultNow(),
})

// Amount, category and note live inside `payload`, encrypted with AES-256-GCM.
export const transactions = pgTable('transactions', {
  id: serial('id').primaryKey(),
  userId: text('userId').notNull(),
  type: text('type').notNull(),
  payload: text('payload').notNull(),
  occurredAt: date('occurredAt').notNull(),
  createdAt: timestamp('createdAt').notNull().defaultNow(),
}, (table) => [index('transactions_user_occurred_idx').on(table.userId, table.occurredAt)])

export const budgets = pgTable(
  'budgets',
  {
    id: serial('id').primaryKey(),
    userId: text('userId')
      .notNull()
      .references(() => user.id, { onDelete: 'cascade' }),
    category: text('category').notNull(),
    month: text('month').notNull(),
    payload: text('payload').notNull(),
    createdAt: timestamp('createdAt').notNull().defaultNow(),
    updatedAt: timestamp('updatedAt').notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex('budgets_user_category_month_idx').on(
      table.userId,
      table.category,
      table.month,
    ),
  ],
)

export const recurringTransactions = pgTable(
  'recurring_transactions',
  {
    id: serial('id').primaryKey(),
    userId: text('userId')
      .notNull()
      .references(() => user.id, { onDelete: 'cascade' }),
    type: text('type').notNull(),
    category: text('category').notNull(),
    payload: text('payload').notNull(),
    dayOfMonth: integer('dayOfMonth').notNull(),
    nextRunDate: date('nextRunDate').notNull(),
    active: boolean('active').notNull().default(true),
    createdAt: timestamp('createdAt').notNull().defaultNow(),
  },
  (table) => [index('recurring_transactions_due_idx').on(table.active, table.nextRunDate)],
)

export type TransactionRow = typeof transactions.$inferSelect
