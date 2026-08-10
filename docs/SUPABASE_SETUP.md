# Supabase beta kurulumu — teslim dışı

> Bu entegrasyon local-first ilk teslimde kapalıdır. Aşağıdaki adımlar gelecekteki internal-beta hesabı içindir ve production teslim talimatı değildir.

1. Create a Supabase project and enable email magic-link authentication.
2. Set the Site URL to the production Vercel URL; add local and preview URLs as redirect URLs.
3. Migration'ları Supabase CLI ile sırayla uygula: `20260810_initial_beta.sql`, `20260810_progress_v3.sql`, `20260810_security_hardening.sql`.
4. Add `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` from `.env.example` locally and in Vercel.
5. Confirm Row Level Security remains enabled on every public table.

Uygulama bu değişkenler olmadan cihaz-yerel modda çalışır. İlk teslimde kimlik doğrulama, cihazlar arası yedekleme ve uzaktan feedback bilerek devre dışıdır. Gelecekte açılmadan önce iki kullanıcılı RLS izolasyonu, magic-link callback ve migration geçmişi canlı ortamda doğrulanmalıdır.
