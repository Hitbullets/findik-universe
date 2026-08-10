# Supabase beta setup

1. Create a Supabase project and enable email magic-link authentication.
2. Set the Site URL to the production Vercel URL; add local and preview URLs as redirect URLs.
3. Run `supabase/migrations/20260810_initial_beta.sql` in the SQL editor or through the Supabase CLI.
4. Add `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` from `.env.example` locally and in Vercel.
5. Confirm Row Level Security remains enabled on every public table.

The app runs without these variables in device-local mode. Authentication, cross-device backup and remote feedback are deliberately unavailable until the project is configured.
