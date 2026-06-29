# Family Tree Management System

A collaborative platform for managing family genealogy, built with **Next.js** and **Supabase**.

For full project documentation, see [docs/README.md](docs/README.md).

## Prerequisites

- Node.js 20+
- [pnpm](https://pnpm.io/)
- [Supabase CLI](https://supabase.com/docs/guides/cli) (for local database)

## Getting Started

1. Install dependencies:

```bash
pnpm install
```

2. Copy environment variables:

```bash
cp .env.example .env.local
```

3. Start Supabase locally and apply migrations:

```bash
pnpm db:start
pnpm db:reset
```

Copy the `anon key` and API URL from `supabase status` into `.env.local`.

4. Start the development server:

```bash
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000).

## Scripts

| Command         | Description                             |
| --------------- | --------------------------------------- |
| `pnpm dev`      | Start Next.js dev server                |
| `pnpm build`    | Production build                        |
| `pnpm lint`     | Run ESLint                              |
| `pnpm db:start` | Start local Supabase                    |
| `pnpm db:stop`  | Stop local Supabase                     |
| `pnpm db:reset` | Reset DB and run migrations             |
| `pnpm db:types` | Regenerate TypeScript types from schema |

## Project Structure

```text
src/
├── app/              # Next.js App Router
├── components/       # UI and shared components
├── features/         # Feature modules (by domain)
├── hooks/            # Custom React hooks
├── lib/              # Utilities and Supabase clients
├── providers/        # React context providers
└── types/            # Shared TypeScript types

supabase/
├── migrations/       # Database migrations
├── functions/        # Edge functions
└── seed.sql          # Seed data
```

## License

MIT
