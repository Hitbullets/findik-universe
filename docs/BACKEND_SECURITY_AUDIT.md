# Fındık Universe — Backend & Security Audit

**Tarih:** 10 Ağustos 2026  
**Kapsam:** Aktif Next.js uygulaması, browser Supabase client, SQL migration, local persistence, PWA service worker, deployment headers ve production dependencies.  
**Yöntem:** Salt-okunur kaynak incelemesi, SQL/RLS incelemesi, secret pattern taraması ve `npm audit --omit=dev`.  
**Sonuç:** Klasik server backend/API bulunmuyor. Uygulama local-first çalışıyor; cloud özellikleri browser’dan Supabase anon key ile çağrılıyor.

## Yönetici özeti

- Production dependency audit sonucu: **0 known vulnerability**.
- Supabase RLS (Row Level Security) temel kullanıcı izolasyonunu sağlıyor.
- Ancak ilerleme bütünlüğü browser tarafından belirlenebilir; kullanıcı kendi XP/completion/wardrobe verisini değiştirebilir. Bu, kişisel uygulama için integrity riski; rekabetçi veya ödüllü ürün için kabul edilemez.
- Aktif v3 local progress ile mevcut v2 cloud backup/restore sözleşmesi uyumsuz. Story progress’i yedeklenmeyebilir veya restore sonrası kaybolabilir.
- Service worker aynı-origin GET yanıtlarını genel cache’e alıyor; gelecekte özel/authenticated response eklenirse veri sızıntısı riski var.
- Security headers (CSP, HSTS, frame policy, Referrer-Policy, Permissions-Policy) tanımlı değil.
- Supabase auth/feedback çağrılarında uygulama katmanı rate limit, abuse telemetry veya payload hardening yok.

## Mimari ve güven sınırı

### Mevcut backend yüzeyi

| Yüzey | Durum | Güven sınırı |
|---|---|---|
| Next.js route/API | Yok | Server-side authorization yok |
| Supabase Auth | Magic link | Browser client üzerinden |
| Supabase DB | `progress`, `memories`, `feedback`, `profiles` | RLS politikalarına bağlı |
| Local storage | Aktif ana ilerleme | Kullanıcı tarafından tamamen değiştirilebilir |
| Service worker | `/public/sw.js` | Aynı-origin GET cache’i |

`NEXT_PUBLIC_SUPABASE_URL` ve `NEXT_PUBLIC_SUPABASE_ANON_KEY` browser’a açılması beklenen public değerlerdir; service-role key veya secret bulunmadı. `.env.example` değerleri boş ve secret taraması temizdir.

## Bulgular

### SEC-01 — Client-authoritative progress integrity (High, bağlama bağlı)

**Kanıt:** `lib/progress.ts`, `lib/progress-reducer.ts`, `components/universe.tsx` ve `lib/cloud.ts`. XP, completion, memory ve wardrobe browser state/localStorage’dan gelir; Supabase’e client tarafından yazılır.

**Etkisi:** Kullanıcı localStorage’ı veya Supabase payload’ını değiştirerek XP/completion/reward oluşturabilir. Şu an server-side ekonomik değer olmadığı için doğrudan finansal etki yok; ileride paylaşılabilir rozet, rekabet veya ücretli değer eklenirse kritik hale gelir.

**Öneri:** Kişisel-first kapsamda local-first kalabilir; fakat ürün bunu “verified progress” olarak sunmamalı. Rekabet/ödül eklenecekse completion event server-side Edge Function/route üzerinden doğrulanmalı, reward hesaplanmalı ve istemci yalnız render state’i almalı.

### SEC-02 — v2/v3 cloud data mismatch (High)

**Kanıt:** `lib/cloud.ts` yalnız v2 `Progress` alanlarını (`completed`, `memories`, `wardrobe`) yazar. Yeni Story akışı `persistProgressV3()` ile aynı localStorage anahtarına v3 yazar. Supabase SQL ise yalnız beş adventure id’sini kabul eder.

**Etkisi:** Story completion’ları backup’a dahil olmayabilir; restore eski v2 state’i döndürerek v3 progress’i ezebilir. Bu bir veri bütünlüğü ve kullanıcı güveni problemidir.

**Öneri:** Cloud işlemleri v3 parser/serializer ile version-gated olmalı. Yeni SQL migration eklenmeden v3 backup/restore butonu v3 state’te açık hata vermeli; sessiz veri kaybı olmamalı. Restore öncesi açık overwrite onayı ve local export önerilmeli.

### SEC-03 — RLS integrity abuse (Medium)

**Kanıt:** `progress` ve `memories` tablolarında kullanıcı kendi satırında `for all` update/delete yapabilir; `progress.completed`, `xp`, `wardrobe` JSONB alanları içerik doğrulamasına tabi değil.

**Etkisi:** Kullanıcılar birbirlerinin verisini okuyamaz; fakat kendi verilerini sahteleyebilir. Kişisel uygulamada gizlilik korunur, doğrulanabilir ilerleme korunmaz.

**Öneri:** Kullanım alanı kişisel kaldığı sürece risk kabul kararı dokümante edilmeli. Verified progress gerekirse client’ın `for all` yazma yetkisi kaldırılıp server-side function + dar RLS politikaları kullanılmalı.

### SEC-04 — Generic service-worker cache isolation missing (Medium)

**Kanıt:** `public/sw.js` aynı-origin tüm GET yanıtlarını cache’e koyuyor ve başarısız isteklerde `/` döndürüyor.

**Etkisi:** Gelecekte authenticated/private route veya kullanıcıya özel response eklenirse response ortak cache’e girebilir. API/JSON isteğine HTML fallback dönmesi ayrıca uygulama hatasını maskeleyebilir.

**Öneri:** Cache yalnız açıkça listelenen public app-shell ve immutable asset URL’leriyle sınırlandırılmalı. `/api`, auth callback ve `Cache-Control: private/no-store` yanıtları cache dışı bırakılmalı. Navigation fallback yalnız document request’lerinde uygulanmalı. Cache version/update davranışı test edilmeli.

### SEC-05 — Missing browser security headers (Medium)

**Kanıt:** `vercel.json` yalnız clean URL, service worker cache-control ve manifest content-type tanımlar; CSP, HSTS, `X-Frame-Options`/frame-ancestors, `Referrer-Policy`, `Permissions-Policy` yok.

**Etkisi:** XSS etkisi, clickjacking, referrer sızıntısı ve gereksiz browser capability yüzeyi artar. Şu an inline script yok; yine de security baseline eksik.

**Öneri:** Önce report-only CSP ile kaynaklar ölçülmeli, sonra enforce edilmeli. En az `frame-ancestors 'none'`, `Referrer-Policy: strict-origin-when-cross-origin`, `Permissions-Policy` deny-by-default ve production HTTPS HSTS eklenmeli. CSP’de Supabase auth origin’i açıkça allowlist edilmeli.

### SEC-06 — Auth and feedback abuse controls missing (Medium)

**Kanıt:** `sendMagicLink()` ve feedback insert browser’dan çağrılıyor; UI max 500 karakter koyuyor ancak server-side rate limit, abuse counter veya moderation pipeline yok.

**Etkisi:** Magic-link spam, feedback spam ve Supabase quota tüketimi mümkün. DB check constraint uzunluğu sınırlar fakat hacmi sınırlamaz.

**Öneri:** Supabase Auth provider rate limits + CAPTCHA/turnstile gereksinimi değerlendirilmelidir. Feedback için per-user/IP rate limit, duplicate cooldown ve admin review yolu eklenmeli. Bu denetim remote Supabase ayarlarının yapıldığını doğrulamaz.

### SEC-07 — Restore payload validation and overwrite risk (Medium)

**Kanıt:** `restoreProgress()` dönen DB JSON alanlarını `Progress` olarak cast ediyor; runtime schema validation yok. Restore local state’i doğrudan overwrite ediyor.

**Etkisi:** Bozuk veya beklenmedik DB payload’ı UI crash/yanlış state üretebilir. Kullanıcı yerel ilerlemesini fark etmeden kaybedebilir.

**Öneri:** `normalizeProgress()` cloud response üzerinde de kullanılmalı; version, numeric bounds, id allowlist ve caption length validate edilmeli. Restore öncesi local snapshot, preview ve explicit confirmation eklenmeli.

### SEC-08 — Redirect URL governance needs verification (Low/Medium)

**Kanıt:** `sendMagicLink()` `window.location.origin` değerini `emailRedirectTo` olarak gönderiyor.

**Etkisi:** Supabase dashboard redirect allowlist gevşek yapılandırılırsa preview/local origin’leri auth akışına dahil olabilir. Bu kod tek başına açık redirect sağlamaz; remote allowlist doğrulanmadı.

**Öneri:** Production/preview/local URL’lerini Supabase Auth allowlist’inde açıkça ayır; wildcard kullanma. Production’da beklenmeyen origin için auth çağrısını engelle.

## Olumlu kontroller

- Supabase service-role key veya secret hard-code edilmemiş.
- RLS tüm public tablolarda etkinleştiriliyor.
- Kullanıcı satır erişimi `auth.uid()` ile sınırlandırılmış.
- Feedback body SQL constraint ile 1–500 karakter aralığında.
- Magic-link kullanılıyor; parola saklama yok.
- `npm audit --omit=dev` production bağımlılıklarında açık raporlamadı.
- Supabase env yokken cloud devre dışı kalıyor; core local-first davranış korunuyor.
- `dangerouslySetInnerHTML`, `eval` ve manual HTML injection aktif Next.js kodunda bulunmadı.

## Öncelikli düzeltme sırası

1. SEC-02: v3 cloud version gate, schema/migration ve restore validation.
2. SEC-04: service worker cache isolation.
3. SEC-05: security headers ve CSP report-only → enforce.
4. SEC-07: strict cloud/local payload validation + restore preview.
5. SEC-06/08: Supabase rate limits, redirect allowlist ve abuse controls.
6. SEC-01/03: verified progress gereksinimi doğarsa server-authoritative reward modeline geçiş.

## Doğrulanamayan / kullanıcı veya platform erişimi gerektiren kontroller

- Supabase projesinin gerçek RLS durumunun remote ortamda çalıştırılması.
- Supabase Auth redirect allowlist ve provider rate-limit ayarları.
- Production HTTPS/HSTS ve gerçek response headers.
- Vercel deployment, preview protection ve environment secret configuration.
- Gerçek iPhone service-worker cache/update davranışı.
- Dış penetrasyon testi, abuse yük testi ve account enumeration testi.

## Security acceptance criteria

- V3 Story progress’i v2 cloud endpoint’ine sessizce yazılmaz veya kaybolmaz.
- Restore bozuk payload’ı kabul etmez ve local state’i onaysız overwrite etmez.
- Service worker authenticated/API yanıtlarını cache’lemez.
- Production response’larında güvenlik başlıkları kanıtlıdır.
- Auth/feedback abuse sınırları remote ayarlarda doğrulanmıştır.
- Verified progress gerekmeyen kişisel beta kapsamı açıkça belgelenmiş; kullanıcıya sahte güvenlik/ilerleme garantisi verilmemiştir.
