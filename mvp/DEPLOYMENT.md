# GymPlate MVP Deployment

## Vercel

Import `agbd69/gymplate-demo` into Vercel and set:

- Root Directory: `mvp`
- Framework Preset: Next.js
- Install Command: `pnpm install --frozen-lockfile`
- Build Command: `pnpm run build`

Optional environment variables:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `OPENAI_API_KEY`

Without Supabase variables, the app works in local-only mode. Without `OPENAI_API_KEY`, meal parsing uses the built-in rules fallback.

## Supabase

Run these files in Supabase SQL Editor:

```text
supabase/schema.sql
supabase/seed-open-data.sql
```

In Supabase Auth, enable Email provider and add the Vercel production URL to Redirect URLs.

## CLI Deploy

After logging in locally:

```bash
cd mvp
pnpm dlx vercel@latest
pnpm dlx vercel@latest deploy --prod
```

The current repository token does not include the GitHub `workflow` scope, so automated GitHub Actions deployment is intentionally not committed yet.
