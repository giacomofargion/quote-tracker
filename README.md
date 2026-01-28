# QuoteReality

A full-stack web app for freelancers to track quoted projects and measure their **real hourly rate** against a target. Built to help independent contractors see whether fixed-price quotes are paying off and to run their business with data, not guesswork.

---

## Features

- **Project management** — Create projects with client name, quote amount, and target hourly rate. Target hours are derived automatically from quote ÷ rate.
- **Time tracking** — Built-in start/stop timer per project, plus manual time entry (date + duration) for sessions logged elsewhere.
- **Effective rate** — Per-project calculation of actual £/hr (quote ÷ hours worked). Dashboard and project views show whether you’re above, at, or below target.
- **Dashboard** — Search and filter by name/client, filter by status (active/completed), sort by name, client, quote amount, effective rate, or date.
- **Settings** — Default target hourly rate and currency (GBP, USD, EUR) with optional JSON/CSV export for backup or analysis.
- **Auth & data** — Sign up / sign in via Clerk; project and session data stored in Neon (serverless Postgres) and scoped per user.

---

## Tech stack

| Layer                  | Technology                                               |
| ---------------------- | -------------------------------------------------------- |
| **Framework**          | Next.js 16 (App Router), React 19                        |
| **Language**           | TypeScript                                               |
| **Styling**            | Tailwind CSS v4, PostCSS                                 |
| **Auth**               | Clerk                                                    |
| **Database**           | Neon (serverless PostgreSQL)                             |
| **State**              | Zustand (client state), React state for forms            |
| **Forms & validation** | React Hook Form, Zod                                     |
| **UI**                 | Radix UI primitives, custom components, Framer Motion    |
| **Charts**             | Recharts                                                 |
| **Utilities**          | date-fns, clsx, tailwind-merge, class-variance-authority |
| **Analytics**          | Vercel Analytics                                         |

---
