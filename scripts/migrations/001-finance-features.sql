CREATE INDEX IF NOT EXISTS transactions_user_occurred_idx
  ON transactions ("userId", "occurredAt");

CREATE TABLE IF NOT EXISTS budgets (
  id SERIAL PRIMARY KEY,
  "userId" TEXT NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
  category TEXT NOT NULL,
  month TEXT NOT NULL,
  payload TEXT NOT NULL,
  "createdAt" TIMESTAMP NOT NULL DEFAULT NOW(),
  "updatedAt" TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS budgets_user_category_month_idx
  ON budgets ("userId", category, month);

CREATE TABLE IF NOT EXISTS recurring_transactions (
  id SERIAL PRIMARY KEY,
  "userId" TEXT NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  category TEXT NOT NULL,
  payload TEXT NOT NULL,
  "dayOfMonth" INTEGER NOT NULL CHECK ("dayOfMonth" BETWEEN 1 AND 31),
  "nextRunDate" DATE NOT NULL,
  active BOOLEAN NOT NULL DEFAULT TRUE,
  "createdAt" TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS recurring_transactions_due_idx
  ON recurring_transactions (active, "nextRunDate");
