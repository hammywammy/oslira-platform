# Oslira – AI Lead Analysis Platform

Oslira is a modular, secure, and production-ready **AI-driven lead analysis and outreach platform**.  
It enables businesses to analyze social media leads, generate insights, and manage outreach—all while providing **credit-based billing, multi-tenant CRM support, and enterprise-grade dashboards**.  

---

## 🚀 Quick Start

### Prerequisites
- Node.js ≥ 18  
- npm or pnpm package manager  
- Supabase project (with Postgres + RLS enabled)  
- Cloudflare account (for Workers + R2 storage)  
- Netlify account (for frontend hosting)  

### Environment Setup
Add the following environment variables (see `/env.example`):  
```bash
# Supabase
SUPABASE_URL=<your-supabase-url>
SUPABASE_ANON_KEY=<public-anon-key>
SUPABASE_SERVICE_ROLE=<service-role-key>

# Stripe
STRIPE_SECRET_KEY=<stripe-secret>
STRIPE_WEBHOOK_SECRET=<stripe-webhook-secret>
STRIPE_PUBLISHABLE_KEY=<stripe-pub-key>

# External APIs
APIFY_API_TOKEN=<apify-token>
CLAUDE_API_KEY=<anthropic-api-key>
OPENAI_API_KEY=<openai-api-key>

# Platform
WORKER_URL=<cloudflare-worker-endpoint>
PUBLIC_SITE_URL=http://localhost:3000
ENV=development
Local Development
bash
Copy
Edit
# Install dependencies
npm install

# Start Netlify frontend
netlify dev

# Start Cloudflare Worker locally
npx wrangler dev
🏗️ Architecture
Tech Stack (Simplified)
Frontend: Vanilla JS + Tailwind (Netlify hosted)

Backend: Cloudflare Workers (Hono framework)

Database: Supabase Postgres with Row-Level Security (RLS)

AI Engines: OpenAI (GPT-4o/5), Anthropic (Claude)

Integrations: Stripe (billing), Apify (scraping), Cloudflare R2 (media storage)

Key Components
Supabase: Stores users, leads, analyses, credit balances, and transactions.

Cloudflare Worker: Orchestrates scraping, AI analysis, credit deduction, and database writes.

Netlify Frontend: CRM dashboard, lead uploads, analytics visualization.

Stripe: Credit packs & subscription billing.

AI Models:

GPT-4o / GPT-5 → Lead scoring, analysis

Claude Sonnet → Outreach message generation

Configuration Flow
scss
Copy
Edit
[Frontend UI] 
    ↓ (requests)
[Cloudflare Worker] 
    ↓ (Supabase client + APIs)
[Supabase DB] ←→ [Stripe] ←→ [AI APIs] ←→ [Apify Scrapers]
⚙️ Development
Project Structure
bash
Copy
Edit
/public              # Frontend HTML/JS (Netlify)
/modules             # Analytics & CRM UI modules
/services            # Secure service classes (Claude, Supabase, Stripe)
/config              # Config & constants
/workers             # Cloudflare Worker code (Hono endpoints)
/sql                 # Supabase migrations, policies
Adding Features
Define schema changes in /sql

Add Worker endpoint under /workers

Create frontend module in /modules

Wire into analytics.js or CRM flow

Add tests + logging hooks

Testing
Unit tests with Vitest/Jest (modules + Workers)

Integration tests with Supabase local dev + Netlify dev

End-to-end: Manual flows → signup → upload leads → analysis → CRM results

🚢 Deployment
Cloudflare Workers
bash
Copy
Edit
# Build & deploy Workers
npx wrangler publish
Endpoints

/ai/analyze → AI lead analysis

/credits/check → Credit balance

/data/write → Supabase insertions

Netlify Frontend
Connect repo → set env vars in Netlify dashboard

Automatic deploys on push to main

Database Setup (Supabase)
Run SQL migrations in /sql

Enable RLS policies (user_id = auth.uid())

Verify tables:

users

business_profiles

leads

lead_analyses

credit_transactions

subscriptions

payments
