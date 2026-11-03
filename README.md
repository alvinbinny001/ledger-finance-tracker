# Ledger

Ledger is a personal finance tracker for recording income and expenses, reviewing spending, and seeing account balances in Indian rupees (INR). The production site is [ledger-finance-psi.vercel.app](https://ledger-finance-psi.vercel.app).

## What it does

- Lets users create an account, sign in, and manage their password.
- Records income and expenses with dates, categories, and optional notes.
- Shows the balance, income and expenses, category breakdown, and recent monthly cashflow.
- Supports monthly category budgets with spending progress.
- Imports bank statement CSVs with an editable preview and duplicate checks.
- Schedules recurring monthly transactions.
- Exports transaction CSVs and annual summaries.
- Stores transaction details encrypted in PostgreSQL.
- Provides a responsive interface for mobile and desktop.

Password reset pages are available, but reset and password-change notification emails require Resend configuration. Until a verified sender and Resend API key are configured, users will not receive these emails.

## Tools and services

- **Next.js 16 and React 19** for the web app and server-side actions.
- **TypeScript** for typed application code.
- **Tailwind CSS 4** for styling.
- **Better Auth** for email/password authentication and sessions.
- **Neon PostgreSQL**, **Drizzle ORM**, and **node-postgres (`pg`)** for database access.
- **AES-256-GCM** and Node.js crypto for encrypting transaction payloads.
- **Recharts** for dashboard charts.
- **Motion**, **Lucide**, and **Sonner** for animation, icons, and notifications.
- **Vercel** for hosting and **Vercel Analytics** for production analytics.
- **Resend** is the email provider used by the password recovery implementation; it is optional until email delivery is enabled.

## How the app is put together

- `app/` contains the Next.js routes, pages, and transaction server actions.
- `components/` contains the landing page, authentication forms, dashboard, and shared UI.
- `lib/auth.ts` configures Better Auth; `lib/email.ts` sends email through Resend.
- `lib/db/` contains the PostgreSQL connection and Drizzle schema.
- `lib/crypto.ts` encrypts and decrypts transaction payloads.
- `lib/finance.ts` contains currency formatting and dashboard calculations.
- `scripts/init-db.mjs` creates the database tables if they do not already exist.
- `public/` contains the Ledger browser icon and other static assets.

Transaction amounts, categories, and notes are encrypted together in the database. The user ID, transaction type, and date are stored separately and are not encrypted by this payload encryption. Budget limits and recurring amounts/notes are encrypted too. The CSV import reads the bank file in the browser; only the reviewed transaction rows are sent to the app. This project has not been represented as an independently audited security product.

## Run locally

### Requirements

- Node.js 20.9 or newer.
- Corepack and pnpm (the project specifies pnpm 12.3.4).
- A PostgreSQL database. A Neon database works for local development too.

### Setup

1. Open PowerShell in this project folder.
2. Install dependencies:

   ```powershell
   corepack pnpm install
   ```

3. Create a local environment file if you do not already have one:

   ```powershell
   Copy-Item .env.example .env.local
   ```

4. Edit `.env.local` and replace the example values with your own database URL and generated secrets. Do not commit `.env.local` or share its contents.
5. Create the database tables:

   ```powershell
   corepack pnpm db:init
   ```

   The database user needs permission to create tables. `db:init` prefers `DATABASE_URL_POOLED`, then falls back to `DATABASE_URL`.

6. Start the development server:

   ```powershell
   corepack pnpm dev
   ```

7. Open [http://localhost:3000](http://localhost:3000).

Create an account from the sign-up page, then add transactions from the dashboard.

### Environment variables

| Variable | Required | Purpose |
|---|---|---|
| `DATABASE_URL` | Yes | PostgreSQL connection string. Used if a pooled connection string is not configured. |
| `DATABASE_URL_POOLED` | Recommended | Pooled PostgreSQL connection string. The app and initializer prefer this when set, which is appropriate for serverless deployments. |
| `BETTER_AUTH_SECRET` | Yes | Secret used by Better Auth. Generate a unique, random value and keep it private. |
| `BETTER_AUTH_URL` | Local development | Base URL for the app, such as `http://localhost:3000`. Vercel deployments can derive the URL if this is omitted. |
| `ENCRYPTION_KEY` | Strongly recommended | Separate, stable secret for transaction encryption. It must be at least 32 characters. Do not rotate it after data has been encrypted unless you have a migration plan. |
| `RESEND_API_KEY` | Only for email delivery | Secret API key from Resend. |
| `AUTH_EMAIL_FROM` | Only for email delivery | Sender address on a domain verified with Resend, for example `Ledger <passwords@mail.example.com>`. |
| `CRON_SECRET` | For recurring transactions | Random secret used by Vercel Cron to authorize the scheduled monthly transaction job. |

Generate random secrets locally with Node.js:

```powershell
node -e "console.log(require('crypto').randomBytes(32).toString('base64url'))"
```

Run this separately for `BETTER_AUTH_SECRET` and `ENCRYPTION_KEY`, and store each value in a password manager or the appropriate environment-variable settings. Never commit secrets.

`ENCRYPTION_KEY` should be kept separate from `BETTER_AUTH_SECRET`. The application has a fallback to the auth secret if the encryption key is absent; configuring a dedicated encryption key avoids coupling encrypted transaction data to auth-secret rotation. If existing data was encrypted using the fallback, changing the effective encryption key will prevent that data from being decrypted.

### First sign-in after inactivity

The first request after a quiet period can take longer because a serverless function may start cold and Neon may resume a suspended compute instance. A pooled connection, module-level connection reuse, and keeping the Vercel function region near the Neon database reduce avoidable connection and network delay. They cannot eliminate cold starts without keeping compute warm, which can add cost. This app shows a longer-wait status rather than silently appearing unresponsive.

## Password recovery email setup

The password reset flow uses Resend. For real delivery:

1. Own a domain (the Vercel-provided `vercel.app` site address is not a domain you control for sending email).
2. Add the domain or a subdomain in the [Resend Domains dashboard](https://resend.com/domains).
3. Add the DNS records Resend provides at the domain's DNS provider and wait until Resend verifies the domain.
4. Create an API key in the [Resend API Keys dashboard](https://resend.com/api-keys).
5. Add `RESEND_API_KEY` and `AUTH_EMAIL_FROM` to the Vercel project's Production environment variables. The sender address must use the verified domain.
6. Deploy again so the new environment variables are included:

   ```powershell
   npx vercel --prod
   ```

Reset links expire after 30 minutes. Password reset revokes sessions. A password change requires the current password and offers to revoke other sessions.

## Database migration and recurring transactions

The app's database schema includes tables for encrypted monthly budgets and recurring rules. To initialize a local database, `corepack pnpm db:init` creates the base tables and applies the idempotent migration in `scripts/migrations/001-finance-features.sql`.

For an existing production database, apply that SQL once in the Neon SQL Editor before deploying code that uses the new dashboard features. The migration only adds an index and new tables; it does not delete or rewrite existing transactions.

To enable recurring transactions in production:

1. Generate a random secret using the Node.js command above.
2. Add it as `CRON_SECRET` in the Ledger Vercel project's Production environment variables.
3. Ensure the repository's `main` branch is connected to that same Vercel project and deploy after the variable and `vercel.json` are in place.

Vercel calls the scheduled endpoint daily. It writes due transactions using an atomic database transaction and advances each rule's next date, so retries do not duplicate an occurrence. Scheduled dates use India Standard Time and days 29–31 fall on the last day in shorter months.

## Deploy to Vercel

The app is already deployed at [ledger-finance-psi.vercel.app](https://ledger-finance-psi.vercel.app).

For a new deployment, install the Vercel CLI if needed, sign in, and run these commands from the project directory:

```powershell
npx vercel
npx vercel --prod
```

Configure production variables in **Vercel → Ledger → Settings → Environment Variables**. Changes to environment variables take effect only in new deployments. At minimum, configure the database connection, Better Auth secret, and a stable encryption key; add the Resend variables when email delivery is ready.

Keep the production `ENCRYPTION_KEY` stable. Replacing it without re-encrypting existing transaction records can make those records unreadable.

## Checks

Run the TypeScript check and production build before deployment:

```powershell
corepack pnpm exec tsc --noEmit
corepack pnpm build
```

There is no automated test script currently configured in `package.json`.

## Important files

- `.env.example` lists local environment-variable names and placeholders.
- `.env.local` is for local secrets and is ignored by Git; never include it in a commit.
- `package.json` lists dependencies and commands.
- `pnpm-lock.yaml` locks dependency versions; use `corepack pnpm install` to install them.
