# Fındık Universe — Genel Audit

**Tarih:** 10 Ağustos 2026  
**Kapsam:** aktif Next.js uygulaması; runtime/UI, navigation, erişilebilirlik, PWA, local/cloud veri bütünlüğü, content/reward, mobile layout ve test boşlukları.  
**Yöntem:** salt-okunur kaynak incelemesi, `npm.cmd run build`, `npm.cmd audit --omit=dev`, route/tree/config taraması. `CLAUDE.md` değiştirilmedi.

## Sonuç özeti

Audit sırasında production build **başarısız** oldu: `components/universe.tsx:116` satırında `string` değerleri `AdventureId` bekleyen `getAdventure()` çağrılarına veriliyor (`TS2345`). Dependency audit 0 vulnerability raporladı. Uygulama tek client-rendered ana ekrana sahip; server API/backend yok, Supabase browser client isteğe bağlı.

## Bulgular

### GEN-01 — Build/typecheck kırık (Critical)

**Kanıt:** `npm.cmd run build`; `components/universe.tsx:116`; `lib/types.ts` (`AdventureId`), `lib/adventures.ts` (`getAdventure(id: AdventureId)`). Album render’ında `memory.id` string olarak geçiriliyor.  
**Etkisi:** Production build ve deployment bloke.  
**Öneri:** Album modelini content-agnostic yapıp `getAdventure` yerine catalog memory metadata selector kullanın veya id’yi allowlist ile daraltın; `any` cast kullanmayın. Build ve typecheck gate’i tekrar çalıştırın.

### GEN-02 — V2/V3 state çift yazma ve Story UI desync (High)

**Kanıt:** `lib/progress.ts` aynı localStorage key’inde v2/v3 okur; `Universe.chooseStory()` yalnız `persistProgressV3(v3)` çağırır; görünür `progress` state v2 olarak kalır. `lib/cloud.ts:restoreProgress()` v3’ü tekrar v2’ye çevirir.  
**Etkisi:** Story reward/XP albümde veya progress bar’da görünmeyebilir; sonraki v2 yazımı Story verisini silebilir.  
**Öneri:** Tek canonical v3 store + adapter ile UI state’i v3’e taşıyın; legacy adventure selector’larını v3’den türetin. Restore sonucu v3 döndürmeli.

### GEN-03 — Story graph ve catalog validation runtime’da çağrılmıyor (High)

**Kanıt:** `lib/content/catalog.ts` `validateCatalog` tanımlı fakat `app/page.tsx`, `components/universe.tsx` veya build scriptinde çağrı yok. Story node `next` referansları ve start/ending reachability doğrulanmıyor.  
**Etkisi:** Eksik node veya dead-end içerik kullanıcı akışında sessizce kilitlenebilir.  
**Öneri:** Unit test/build-time validator ekleyin; invalid catalog deploy’u bloklasın, runtime’da authored fallback gösterilsin.

### GEN-04 — Dialog erişilebilirliği eksik (High)

**Kanıt:** `components/universe.tsx:Dialog`; `role=dialog` var ancak `aria-labelledby`, focus trap, Escape handler, açan elemana focus dönüşü ve body scroll lock yok.  
**Etkisi:** Keyboard/screen-reader kullanıcıları modal dışına çıkabilir; focus sayfada kaybolabilir.  
**Öneri:** Stable title id + `aria-labelledby`, initial focus, Tab döngüsü, Escape ve cleanup ekleyin; component test yazın.

### GEN-05 — Primary navigation semantik değil (Medium)

**Kanıt:** `components/universe.tsx` bölümleri id taşıyor (`adventures`, `album`, `vault`, `world`, `stories`) fakat görünür nav/link sistemi yok.  
**Etkisi:** Uzun tek sayfada keşfedilebilirlik ve keyboard navigation zayıf.  
**Öneri:** Landmark’lar (`nav`, `main`, `section`), skip link ve anchor navigation ekleyin; mevcut görsel dili koruyun.

### GEN-06 — Mobile overflow doğrulanmamış ve yatay rail keyboard erişimi zayıf (Medium)

**Kanıt:** `components/universe.tsx` yatay `.adventure-rail`; `app/globals.css` `overflow:auto`; 375/430 px browser ölçümü için test yok.  
**Etkisi:** Beklenmeyen page-level horizontal overflow veya touch/keyboard erişim regresyonu olabilir.  
**Öneri:** Playwright/mobile smoke testiyle `scrollWidth === clientWidth` ölçün; rail için visible scroll affordance ve keyboard focus doğrulayın.

### GEN-07 — PWA cache kapsamı geniş, HTML fallback hata maskeleyebilir (Medium)

**Kanıt:** `public/sw.js` aynı-origin `/api` ve `/auth` hariç tüm GET’leri cache’ler; navigation olmayan isteklerde `Response.error()`, navigation’da `/` fallback’i var.  
**Etkisi:** Gelecekte private route/JSON yanıtı cache’e girebilir; stale shell gerçek runtime hatasını gizleyebilir.  
**Öneri:** Explicit public asset allowlist, `Cache-Control: private/no-store` bypass, yalnız `request.mode === navigate` fallback ve cache update testi ekleyin.

### GEN-08 — Security headers baseline mevcut ama HSTS/CSP deploy kanıtı yok (Medium)

**Kanıt:** `vercel.json` CSP, frame, referrer, permissions ve nosniff içeriyor; HSTS yok. Local kaynak incelemesi production response header’larını kanıtlamaz.  
**Etkisi:** HTTPS zorlaması ve gerçek deployment güvenlik durumu doğrulanmamış.  
**Öneri:** Production HTTPS üzerinde HSTS (yalnız domain hazırsa) ekleyin; preview/production response header smoke test yapın.

### GEN-09 — Client-authoritative progress ve reward integrity (Medium, kapsam bağlı)

**Kanıt:** `lib/progress-reducer.ts`, `lib/progress.ts`, `lib/cloud.ts`; XP/completion/reward localStorage ve browser payload’ından geliyor.  
**Etkisi:** Kullanıcı kendi ilerlemesini değiştirebilir; şu an finansal/rekabetçi değer yok.  
**Öneri:** Beta’da “verified progress” iddiası yapmayın. Rekabet/ödül gelirse server-authoritative event/reward endpoint ve dar RLS politikaları tasarlayın.

### GEN-10 — Feedback/auth abuse ve telemetry test edilmemiş (Medium)

**Kanıt:** `components/universe.tsx` feedback insert ve `sendMagicLink`; UI maxLength var, uygulama katmanında cooldown/rate limit yok. Remote Supabase Auth ayarları doğrulanamadı.  
**Etkisi:** Spam/quota tüketimi ve operasyonel görünürlük riski.  
**Öneri:** Provider rate limit, per-user cooldown, moderation/review yolu ve failed-action telemetry ekleyin; remote ayarları kanıtlayın.

### GEN-11 — Canon/asset governance enforced değil (Medium)

**Kanıt:** `public/assets/character/findik-idle-front-v01.png` UI’da “CANDIDATE V01” olarak gösteriliyor; `docs/ASSET_MANIFEST.md` approval metadata’sı runtime tarafından kontrol edilmiyor. Story’ler doğrudan authored TS içinde.  
**Etkisi:** Onaysız karakter/wardrobe/sticker içeriği production’a çıkabilir.  
**Öneri:** Catalog/asset validator’da approval/provenance durumunu zorunlu kılın; candidate asset’i açıkça beta ile sınırlayın.

### GEN-12 — Test altyapısı ve release kanıtı yok (High)

**Kanıt:** `package.json` içinde test scripti/dependency yok; build dışında unit/component/E2E/PWA testleri bulunmuyor. Fiziksel iPhone, offline reload, Supabase RLS/redirect, 375/430 overflow doğrulaması unavailable.  
**Etkisi:** Migration, duplicate reward, accessibility ve mobile regresyonları otomatik yakalanamaz.  
**Öneri:** Dependency eklemeden önce minimal reducer/catalog testleri; ardından browser smoke + mobile viewport testleri. Build/typecheck, lint (Next 16 `next lint` deprecated) ve unavailable kontrolleri ayrı raporlayın.

## Pozitif kontroller

- `npm.cmd audit --omit=dev`: 0 vulnerability.
- Service-role secret kodda bulunmadı; Supabase anon key browser için beklenen public yapılandırmadır.
- `dangerouslySetInnerHTML`/`eval` aktif app kodunda bulunmadı.
- RLS migration’larında `auth.uid()` tabanlı kullanıcı izolasyonu mevcut (remote uygulanma durumu doğrulanamadı).
- Reduced-motion CSS kuralı mevcut.

## Öncelikli düzeltme sırası

1. GEN-01 build/type error.
2. GEN-02 canonical v3 state ve restore/UI synchronization.
3. GEN-03 catalog/story validator + tests.
4. GEN-04 dialog accessibility.
5. GEN-12 minimal automated test/release gates.
6. GEN-07 PWA cache isolation ve GEN-08 production headers.
7. GEN-05/06 navigation-mobile QA.
8. GEN-09/10/11 ürün kapsamına göre integrity, abuse ve asset governance.

## Doğrulanamayan kontroller

Production/Vercel response headers, remote Supabase migration/RLS/Auth allowlist/rate limits, gerçek offline cache güncellemesi, fiziksel iPhone install/safe-area ve dış penetrasyon/abuse testleri bu audit ortamında kanıtlanamadı.
