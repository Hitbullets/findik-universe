"use client";

import { useEffect, useMemo, useState } from "react";
import { adventures, getAdventure } from "@/lib/adventures";
import { draftAdventure } from "@/lib/adventure-studio";
import { completeAdventure, levelFor, loadProgress, persistProgress } from "@/lib/progress";
import { backupProgress, restoreProgress } from "@/lib/cloud";
import { sendMagicLink, supabase } from "@/lib/supabase";
import type { Adventure, AdventureDraft, Progress } from "@/lib/types";

function greeting() {
  const hour = new Date().getHours();
  if (hour < 6) return ["Gece gezgini!", "Fındık biraz uykulu ama seni gördü."];
  if (hour < 12) return ["Günaydın!", "Fındık seni bekliyordu."];
  if (hour < 18) return ["Macera vakti!", "Bugün dünya biraz daha büyük görünüyor."];
  return ["İyi akşamlar!", "Fındık günün son macerasına hazır."];
}

export function Universe() {
  const [progress, setProgress] = useState<Progress | null>(null);
  const [active, setActive] = useState<Adventure | null>(null);
  const [choice, setChoice] = useState<number | null>(null);
  const [notice, setNotice] = useState("Sonunda geldin. Bugün nereye gidiyoruz?");
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [studioOpen, setStudioOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [authNotice, setAuthNotice] = useState("");
  const [idea, setIdea] = useState("");
  const [draft, setDraft] = useState<AdventureDraft | null>(null);
  const [feedback, setFeedback] = useState("");
  const [feedbackNotice, setFeedbackNotice] = useState("");
  const [account, setAccount] = useState<string | null>(null);
  const [title, subtitle] = useMemo(greeting, []);

  useEffect(() => {
    setProgress(loadProgress());
    navigator.serviceWorker?.register("/sw.js");
    supabase?.auth.getUser().then(({ data }) => setAccount(data.user?.email ?? null));
  }, []);

  function update(next: Progress) { setProgress(next); persistProgress(next); }
  function boop() {
    if (!progress) return;
    update({ ...progress, boops: progress.boops + 1 });
    setNotice(["Burnuma mı dokundun?", "Küçük patiler. Büyük planlar.", "Tamam, hazırım!"].sort(() => Math.random() - .5)[0]);
  }
  function begin(adventure: Adventure) { setActive(adventure); setChoice(null); }
  function resolveChoice(index: number) {
    if (!active || !progress) return;
    setChoice(index);
    if (index === active.correctChoice) {
      const next = completeAdventure(progress, active);
      update(next);
      setNotice(active.reward.memory);
    }
  }
  async function signIn(event: React.FormEvent) {
    event.preventDefault();
    const result = await sendMagicLink(email);
    setAuthNotice(result.error || "Bağlantı e-postana gönderildi.");
  }
  async function submitFeedback(event: React.FormEvent) {
    event.preventDefault();
    if (!feedback.trim()) return;
    if (supabase && account) await supabase.from("feedback").insert({ body: feedback.trim(), app_version: "0.2.0" });
    setFeedback(""); setFeedbackNotice("Teşekkürler. Fındık notunu okudu.");
  }
  async function backup() { if (!progress) return; const result = await backupProgress(progress); setAuthNotice(result.error || "Bu cihazdaki ilerleme hesabına yedeklendi."); }
  async function restore() { const result = await restoreProgress(); if (result.progress) { update(result.progress); setAuthNotice("Hesabındaki ilerleme bu cihaza getirildi."); } else setAuthNotice(result.error || "Yedek bulunamadı."); }

  if (!progress) return <main className="loading">Fındık dünyasını hazırlıyor…</main>;
  const xpInLevel = progress.xp % 100;

  return <main className="app-shell">
    <header className="topbar">
      <div><span className="eyebrow">FINDIK UNIVERSE · BETA</span><h1>{title}</h1><p>{subtitle}</p></div>
      <button className="level-button" onClick={() => setSettingsOpen(true)} aria-label="Profil ve ayarlar">S<span>{levelFor(progress.xp)}</span></button>
    </header>

    <section className="world" aria-label="Fındık'ın evi">
      <div className="scene-detail sun" aria-hidden>☀</div><div className="scene-detail tram" aria-hidden>▤</div><div className="scene-detail park" aria-hidden>✦</div>
      <button className="character-placeholder" onClick={boop} aria-label="Fındık'a dokun">
        <span className="asset-note">ASSET BEKLİYOR</span><span className="leaf">⌁</span><span className="findik-mark">F</span><span className="overalls" />
      </button>
      <p className="speech" aria-live="polite">{notice}</p>
      <p className="asset-disclosure">Geçici karakter işareti · Orijinal sticker onayı bekleniyor</p>
    </section>

    <section className="progress-card" aria-label="İlerleme"><div><b>{xpInLevel} / 100 XP</b><small>Bir sonraki seviyeye</small></div><div className="meter"><i style={{ width: `${xpInLevel}%` }} /></div></section>

    <section id="adventures"><SectionHead label="BUGÜN" title="Maceraya çık" aside={`${progress.completed.length}/5 tamamlandı`} />
      <div className="adventure-rail">{adventures.map((adventure) => <button key={adventure.id} onClick={() => begin(adventure)} className={`adventure-card ${adventure.tone} ${progress.completed.includes(adventure.id) ? "done" : ""}`}><span className="eyebrow">{adventure.place}</span><strong>{adventure.title}</strong><p>{adventure.hook}</p>{progress.completed.includes(adventure.id) && <em>✓ Tamamlandı</em>}</button>)}</div>
    </section>

    <section id="album"><SectionHead label="HATIRALAR" title="Fındık'ın Albümü" />
      <div className="album-grid">{progress.memories.length ? progress.memories.map((memory) => <article key={memory.id} className="memory"><div className={`memory-art ${getAdventure(memory.id).tone}`}>F</div><b>{getAdventure(memory.id).title}</b><small>{new Intl.DateTimeFormat("tr-TR", { day: "numeric", month: "long" }).format(new Date(memory.completedAt))} · {memory.caption}</small></article>) : <p className="empty">İlk maceranı tamamladığında hatıran burada yaşayacak.</p>}</div>
    </section>

    <section id="vault"><SectionHead label="KOLEKSİYON" title="Sticker Kasası" aside={`${progress.completed.length}/5 açık`} />
      <div className="sticker-grid">{adventures.map((adventure) => <div key={adventure.id} className={`sticker ${progress.completed.includes(adventure.id) ? "" : "locked"}`}><span>{progress.completed.includes(adventure.id) ? adventure.reward.stickerText : "Kilitli"}</span><small>{adventure.place}</small></div>)}</div>
    </section>

    <section id="world"><SectionHead label="DÜNYA" title="Açılacak yerler" />
      <div className="map-grid">{["Ev", "Tramvay", "Bisiklet", "Kafe", "Park", "Gece Bahçesi"].map((place, index) => <div key={place} className={index <= progress.completed.length ? "map-place" : "map-place locked"}>{place}</div>)}</div>
    </section>

    <div className="actions"><button className="secondary" onClick={() => setStudioOpen(true)}>Fındık bugün ne yapsın?</button><button className="secondary" onClick={() => setSettingsOpen(true)}>Ayarlar ve beta notu</button></div>

    {active && <Dialog title={active.title} onClose={() => setActive(null)}><span className="eyebrow">{active.place}</span><p>{active.story}</p><h2>{active.task}</h2><div className="choices">{active.choices.map((label, index) => <button key={label} className={choice === index ? (index === active.correctChoice ? "correct" : "wrong") : ""} disabled={choice !== null && choice === active.correctChoice} onClick={() => resolveChoice(index)}>{label}</button>)}</div>{choice !== null && <p className={choice === active.correctChoice ? "success" : "try-again"}>{choice === active.correctChoice ? `Görev tamam! +${active.reward.xp} XP ve “${active.reward.stickerText}” açıldı.` : "Bu koltuk Fındık için biraz fazla hareketli. Bir daha dene."}</p>}<button className="primary" onClick={() => setActive(null)}>{choice === active.correctChoice ? "Anıya dön" : "Maceraya dön"}</button></Dialog>}

    {settingsOpen && <Dialog title="Profil ve ayarlar" onClose={() => setSettingsOpen(false)}><p>{account ? `${account} ile giriş yaptın.` : "İlerleme şu an cihazında güvenle saklanıyor."}</p>{account ? <div className="account-actions"><button className="primary" onClick={backup}>Bu cihazdaki ilerlemeyi yedekle</button><button className="secondary" onClick={restore}>Hesaptaki ilerlemeyi getir</button></div> : <form onSubmit={signIn} className="form"><label>E-posta ile devam et<input type="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="sen@ornek.com" required /></label><button className="primary" type="submit">Sihirli bağlantı gönder</button></form>}<p className="fine-print">Yedekleme açık onayınla çalışır. Reklam, streak veya satış yok.</p>{authNotice && <p className="notice">{authNotice}</p>}<form onSubmit={submitFeedback} className="form"><label>Beta notun<textarea value={feedback} onChange={(event) => setFeedback(event.target.value)} placeholder="Fındık'ın hangi anı daha tatlı olsun?" maxLength={500} /></label><button className="secondary" type="submit">Notu gönder</button></form>{feedbackNotice && <p className="notice">{feedbackNotice}</p>}<button className="text-button" onClick={() => update({ version: 2, xp: 0, completed: [], boops: 0, memories: [], wardrobe: [] })}>Bu cihazdaki ilerlemeyi sıfırla</button></Dialog>}

    {studioOpen && <Dialog title="Adventure Studio · taslak" onClose={() => setStudioOpen(false)}><p>Fikirler taslaktır; Fındık'ın kanonik maceralarının yerine geçmez.</p><form onSubmit={(event) => { event.preventDefault(); setDraft(draftAdventure(idea)); }} className="form"><label>Fındık bugün ne yapsın?<input value={idea} onChange={(event) => setIdea(event.target.value)} placeholder="ör. sahilde uçurtma uçursun" /></label><button className="primary" type="submit">Taslak oluştur</button></form>{draft ? <article className="draft"><span className="eyebrow">ONAY BEKLİYOR</span><h2>{draft.title}</h2><ol>{draft.scenes.map((scene) => <li key={scene}>{scene}</li>)}</ol><p><b>Etkileşim:</b> {draft.interaction}</p><p><b>Ödül:</b> {draft.reward}</p><button className="secondary" onClick={() => setDraft(null)}>Taslağı sil</button></article> : idea && <p className="try-again">Bu fikir kurallara uymuyor ya da biraz daha ayrıntı istiyor.</p>}</Dialog>}
  </main>;
}

function SectionHead({ label, title, aside }: { label: string; title: string; aside?: string }) { return <div className="section-head"><div><span className="eyebrow">{label}</span><h2>{title}</h2></div>{aside && <small>{aside}</small>}</div>; }
function Dialog({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) { return <div className="dialog-backdrop" role="presentation" onMouseDown={onClose}><section className="dialog" role="dialog" aria-modal="true" aria-label={title} onMouseDown={(event) => event.stopPropagation()}><button className="close" onClick={onClose} aria-label="Kapat">×</button>{children}</section></div>; }
