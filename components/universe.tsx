"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { adventures, getAdventure } from "@/lib/adventures";
import { draftAdventure } from "@/lib/adventure-studio";
import { completeAdventure, levelFor, loadProgress, persistProgress } from "@/lib/progress";
import { backupProgress, restoreProgress } from "@/lib/cloud";
import { sendMagicLink, supabase } from "@/lib/supabase";
import type { Adventure, AdventureDraft, Progress } from "@/lib/types";
import { stories } from "@/lib/content/stories";
import { reduceProgress } from "@/lib/progress-reducer";
import { loadProgressV3, persistProgressV3 } from "@/lib/progress";
import { migrateV2ToV3 } from "@/lib/progress-schema";
import { applyCompletion } from "@/lib/progress-reducer";
import type { StoryDefinition } from "@/lib/content/types";

function greeting() {
  const hour = new Date().getHours();
  if (hour < 6) return ["Gece gezgini!", "Fındık biraz uykulu ama seni gördü."];
  if (hour < 12) return ["Günaydın!", "Fındık seni bekliyordu."];
  if (hour < 18) return ["Macera vakti!", "Bugün dünya biraz daha büyük görünüyor."];
  return ["İyi akşamlar!", "Fındık günün son macerasına hazır."];
}

export function Universe() {
  const [progress, setProgress] = useState<Progress | null>(null);
  const [progressV3, setProgressV3] = useState(() => loadProgressV3());
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
  const [storyOpen, setStoryOpen] = useState<StoryDefinition | null>(null);
  const [storyNode, setStoryNode] = useState("start");
  const [storyDone, setStoryDone] = useState(false);
  const [activePanel, setActivePanel] = useState<"home" | "adventures" | "stories" | "album" | "vault" | "world">("home");
  const [characterMood, setCharacterMood] = useState<"idle" | "look" | "alert" | "tongue" | "sleepy">("idle");
  const [title, subtitle] = useMemo(greeting, []);

  useEffect(() => {
    setProgress(loadProgress());
    navigator.serviceWorker?.register("/sw.js");
    supabase?.auth.getUser().then(({ data }) => setAccount(data.user?.email ?? null));
  }, []);

  function update(next: Progress) { setProgress(next); persistProgress(next); }
  function legacyView(next: typeof progressV3): Progress {
    const allowed = new Set(["tram", "bike", "cafe", "park", "night"]);
    return { version: 2, xp: next.xp, boops: next.boops, completed: Object.values(next.completions).map((entry) => entry.content.id).filter((id): id is Progress["completed"][number] => allowed.has(id)), memories: next.memories.filter((memory) => allowed.has(memory.id)) as Progress["memories"], wardrobe: next.wardrobe.unlocked };
  }
  function beginStory(story: StoryDefinition) { setStoryOpen(story); setStoryNode(story.startNodeId); setStoryDone(false); }
  function chooseStory(next: string) {
    if (!storyOpen) return;
    setStoryNode(next);
    const node = storyOpen.nodes.find((item) => item.id === next);
    if (node?.ending && !storyDone) {
      const v3 = reduceProgress(loadProgressV3(), { type: "CONTENT_COMPLETED", input: { content: { type: "story", id: storyOpen.id, version: storyOpen.version }, reward: storyOpen.reward } });
      setProgressV3(v3); persistProgressV3(v3); setProgress(legacyView(v3));
      setStoryDone(true);
      setNotice(storyOpen.reward.memoryCaption || "Yeni bir anı albüme eklendi.");
    }
  }
  function boop() {
    if (!progress) return;
    update({ ...progress, boops: progress.boops + 1 });
    setNotice(["Burnuma mı dokundun?", "Küçük patiler. Büyük planlar.", "Tamam, hazırım!"].sort(() => Math.random() - .5)[0]);
    setCharacterMood("tongue");
    window.setTimeout(() => setCharacterMood("idle"), 900);
  }
  function begin(adventure: Adventure) { setActive(adventure); setChoice(null); }
  function resolveChoice(index: number) {
    if (!active || !progress) return;
    setChoice(index);
    if (index === active.correctChoice) {
      const next = completeAdventure(progress, active);
      update(next);
      const nextV3 = applyCompletion(progressV3, { content: { type: "adventure", id: active.id, version: 1 }, reward: { id: `legacy-${active.id}`, xp: active.reward.xp, stickerText: active.reward.stickerText, memoryId: active.id, memoryCaption: active.reward.memory } });
      setProgressV3(nextV3); persistProgressV3(nextV3);
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
  async function backup() { const result = await backupProgress(progressV3); setAuthNotice(result.error || "Bu cihazdaki ilerleme hesabına yedeklendi."); }
  async function restore() { if (!window.confirm("Buluttaki ilerleme bu cihazdaki mevcut ilerlemenin üzerine yazılacak. Devam edilsin mi?")) return; const result = await restoreProgress(); if (result.progress) { setProgressV3(result.progress); persistProgressV3(result.progress); setProgress(legacyView(result.progress)); setAuthNotice("Hesabındaki ilerleme bu cihaza getirildi."); } else setAuthNotice(result.error || "Yedek bulunamadı."); }

  if (!progress) return <main className="loading">Fındık dünyasını hazırlıyor…</main>;
  const xpInLevel = progress.xp % 100;

  return <main className="app-shell">
    <header className="topbar">
      <div><span className="eyebrow">FINDIK UNIVERSE · BETA</span><h1>{title}</h1><p>{subtitle}</p></div>
      <button className="level-button" onClick={() => setSettingsOpen(true)} aria-label="Profil ve ayarlar">S<span>{levelFor(progress.xp)}</span></button>
    </header>

    <section className="world" aria-label="Fındık'ın evi">
      <div className="scene-detail sun" aria-hidden>☀</div><div className="scene-detail tram" aria-hidden>▤</div><div className="scene-detail park" aria-hidden>✦</div>
      <button className={`character-placeholder mood-${characterMood}`} onClick={boop} aria-label="Fındık'a dokun">
        <img src="/assets/character/findik-idle-front-v01.png" alt="" className="character-art" />
        <span className="character-tongue" aria-hidden="true" />
        <span className="attention-mark" aria-hidden="true">!</span>
        <span className="asset-note">CANDIDATE V01</span>
      </button>
      <p className="speech" aria-live="polite">{notice}</p>
      <p className="asset-disclosure">Fındık idle asset · Onay öncesi candidate v01</p>
    </section>

    <section className="progress-card" aria-label="İlerleme"><div><b>{xpInLevel} / 100 XP</b><small>Bir sonraki seviyeye</small></div><div className="meter"><i style={{ width: `${xpInLevel}%` }} /></div></section>

    <nav className="universe-nav" aria-label="Fındık dünyası bölümleri">{([['home','Ev','⌂'],['adventures','Macera','✦'],['stories','Hikâye','◌'],['album','Albüm','▣'],['vault','Kasa','◇'],['world','Harita','⌖']] as const).map(([id,label,icon]) => <button key={id} className={activePanel === id ? "active" : ""} onClick={() => setActivePanel(id)}><span>{icon}</span>{label}</button>)}</nav>

    {activePanel === "adventures" && <section className="screen-panel" id="adventures"><SectionHead label="BUGÜN" title="Maceraya çık" aside={`${progress.completed.length}/5 tamamlandı`} />
      <div className="adventure-rail">{adventures.map((adventure) => <button key={adventure.id} onClick={() => begin(adventure)} className={`adventure-card ${adventure.tone} ${progress.completed.includes(adventure.id) ? "done" : ""}`}><span className="eyebrow">{adventure.place}</span><strong>{adventure.title}</strong><p>{adventure.hook}</p>{progress.completed.includes(adventure.id) && <em>✓ Tamamlandı</em>}</button>)}</div>
    </section>}

    {activePanel === "album" && <section className="screen-panel" id="album"><SectionHead label="HATIRALAR" title="Fındık'ın Albümü" />
      <div className="album-grid">{progress.memories.length ? progress.memories.map((memory) => { const adventure = adventures.find((item) => item.id === memory.id); return <article key={memory.id} className="memory"><div className={`memory-art ${adventure?.tone || "park"}`}>F</div><b>{adventure?.title || "Fındık anısı"}</b><small>{new Intl.DateTimeFormat("tr-TR", { day: "numeric", month: "long" }).format(new Date(memory.completedAt))} · {memory.caption}</small></article>; }) : <p className="empty">İlk maceranı tamamladığında hatıran burada yaşayacak.</p>}</div>
    </section>}

    {activePanel === "vault" && <section className="screen-panel" id="vault"><SectionHead label="KOLEKSİYON" title="Sticker Kasası" aside={`${progress.completed.length}/5 açık`} /><figure style={{ margin: "0 0 8px", padding: "6px", borderRadius: "18px", background: "#fffaf4" }}><img src="/assets/stickers/findik-adventure-sticker-sheet-v01.png" alt="Fındık'ın tramvay, bisiklet, kafe, park, gece, balon ve tepki stickerları" style={{ display: "block", width: "100%", maxHeight: "180px", objectFit: "contain", borderRadius: "14px" }} /><figcaption style={{ marginTop: "4px", textAlign: "center", fontSize: "10px", color: "#7e6d63", fontWeight: 800 }}>Macera ve deneyim stickerları</figcaption></figure>
      <div className="sticker-grid">{adventures.map((adventure) => <div key={adventure.id} className={`sticker ${progress.completed.includes(adventure.id) ? "" : "locked"}`}><span>{progress.completed.includes(adventure.id) ? adventure.reward.stickerText : "Kilitli"}</span><small>{adventure.place}</small></div>)}</div>
    </section>}

    {activePanel === "world" && <section className="screen-panel" id="world"><SectionHead label="DÜNYA" title="Açılacak yerler" />
      <div className="map-grid">{["Ev", "Tramvay", "Bisiklet", "Kafe", "Park", "Gece Bahçesi"].map((place, index) => <div key={place} className={index <= progress.completed.length ? "map-place" : "map-place locked"}>{place}</div>)}</div>
    </section>}

    {activePanel === "stories" && <section className="screen-panel" id="stories"><SectionHead label="HİKÂYELER" title="Bir hikâyeye uğra" /><div className="adventure-rail">{stories.map((story) => <button key={story.id} className="adventure-card park" onClick={() => beginStory(story)}><span className="eyebrow">HİKÂYE</span><strong>{story.title}</strong><p>{story.reward.memoryCaption}</p></button>)}</div></section>}
    {activePanel === "home" && <section className="home-infographic screen-panel"><div className="home-stat"><b>{progress.completed.length}/5</b><span>macera tamamlandı</span></div><div className="home-stat"><b>{progress.memories.length}</b><span>anı albümde</span></div><div className="home-stat"><b>{progress.boops}</b><span>burun dokunuşu</span></div><button className="secondary" onClick={() => setCharacterMood("alert")}>Fındık dikkat kesilsin</button><button className="secondary" onClick={() => setCharacterMood("look")}>Fındık etrafa baksın</button></section>}
    <div className="actions"><button className="secondary" onClick={() => setStudioOpen(true)}>Fındık bugün ne yapsın?</button><button className="secondary" onClick={() => setSettingsOpen(true)}>Ayarlar ve beta notu</button></div>

    {active && <Dialog title={active.title} onClose={() => setActive(null)}><span className="eyebrow">{active.place}</span><p>{active.story}</p><h2>{active.task}</h2><div className="choices">{active.choices.map((label, index) => <button key={label} className={choice === index ? (index === active.correctChoice ? "correct" : "wrong") : ""} disabled={choice !== null && choice === active.correctChoice} onClick={() => resolveChoice(index)}>{label}</button>)}</div>{choice !== null && <p className={choice === active.correctChoice ? "success" : "try-again"}>{choice === active.correctChoice ? `Görev tamam! +${active.reward.xp} XP ve “${active.reward.stickerText}” açıldı.` : "Bu koltuk Fındık için biraz fazla hareketli. Bir daha dene."}</p>}<button className="primary" onClick={() => setActive(null)}>{choice === active.correctChoice ? "Anıya dön" : "Maceraya dön"}</button></Dialog>}

    {settingsOpen && <Dialog title="Profil ve ayarlar" onClose={() => setSettingsOpen(false)}><p>{account ? `${account} ile giriş yaptın.` : "İlerleme şu an cihazında güvenle saklanıyor."}</p>{account ? <div className="account-actions"><button className="primary" onClick={backup}>Bu cihazdaki ilerlemeyi yedekle</button><button className="secondary" onClick={restore}>Hesaptaki ilerlemeyi getir</button></div> : <form onSubmit={signIn} className="form"><label>E-posta ile devam et<input type="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="sen@ornek.com" required /></label><button className="primary" type="submit">Sihirli bağlantı gönder</button></form>}<p className="fine-print">Yedekleme açık onayınla çalışır. Reklam, streak veya satış yok.</p>{authNotice && <p className="notice">{authNotice}</p>}<form onSubmit={submitFeedback} className="form"><label>Beta notun<textarea value={feedback} onChange={(event) => setFeedback(event.target.value)} placeholder="Fındık'ın hangi anı daha tatlı olsun?" maxLength={500} /></label><button className="secondary" type="submit">Notu gönder</button></form>{feedbackNotice && <p className="notice">{feedbackNotice}</p>}<button className="text-button" onClick={() => update({ version: 2, xp: 0, completed: [], boops: 0, memories: [], wardrobe: [] })}>Bu cihazdaki ilerlemeyi sıfırla</button></Dialog>}

    {studioOpen && <Dialog title="Adventure Studio · taslak" onClose={() => setStudioOpen(false)}><p>Fikirler taslaktır; Fındık'ın kanonik maceralarının yerine geçmez.</p><form onSubmit={(event) => { event.preventDefault(); setDraft(draftAdventure(idea)); }} className="form"><label>Fındık bugün ne yapsın?<input value={idea} onChange={(event) => setIdea(event.target.value)} placeholder="ör. sahilde uçurtma uçursun" /></label><button className="primary" type="submit">Taslak oluştur</button></form>{draft ? <article className="draft"><span className="eyebrow">ONAY BEKLİYOR</span><h2>{draft.title}</h2><ol>{draft.scenes.map((scene) => <li key={scene}>{scene}</li>)}</ol><p><b>Etkileşim:</b> {draft.interaction}</p><p><b>Ödül:</b> {draft.reward}</p><button className="secondary" onClick={() => setDraft(null)}>Taslağı sil</button></article> : idea && <p className="try-again">Bu fikir kurallara uymuyor ya da biraz daha ayrıntı istiyor.</p>}</Dialog>}
    {storyOpen && <Dialog title={storyOpen.title} onClose={() => setStoryOpen(null)}><p>{storyOpen.nodes.find((node) => node.id === storyNode)?.text}</p>{!storyDone && storyOpen.nodes.find((node) => node.id === storyNode)?.choices?.map((item) => <button className="secondary" key={item.next} onClick={() => chooseStory(item.next)}>{item.label}</button>)}{storyDone && <p className="success">Hikâye tamamlandı. Anı albüme eklendi ve +{storyOpen.reward.xp} XP kazanıldı.</p>}<button className="primary" onClick={() => setStoryOpen(null)}>Dünyaya dön</button></Dialog>}
  </main>;
}

function SectionHead({ label, title, aside }: { label: string; title: string; aside?: string }) { return <div className="section-head"><div><span className="eyebrow">{label}</span><h2>{title}</h2></div>{aside && <small>{aside}</small>}</div>; }
function Dialog({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  const dialogRef = useRef<HTMLElement>(null);
  const restoreRef = useRef<HTMLElement | null>(null);
  useEffect(() => {
    restoreRef.current = document.activeElement as HTMLElement;
    dialogRef.current?.focus();
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") { event.preventDefault(); onClose(); return; }
      if (event.key !== "Tab" || !dialogRef.current) return;
      const focusable = Array.from(dialogRef.current.querySelectorAll<HTMLElement>("button, input, textarea, select, [href], [tabindex]:not([tabindex='-1'])")).filter((element) => !element.hasAttribute("disabled"));
      if (!focusable.length) return;
      const first = focusable[0]; const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
    };
    document.addEventListener("keydown", onKeyDown);
    return () => { document.removeEventListener("keydown", onKeyDown); restoreRef.current?.focus(); };
  }, [onClose]);
  return <div className="dialog-backdrop" role="presentation" onMouseDown={onClose}><section ref={dialogRef} className="dialog" role="dialog" aria-modal="true" aria-label={title} tabIndex={-1} onMouseDown={(event) => event.stopPropagation()}><button className="close" onClick={onClose} aria-label="Kapat">×</button>{children}</section></div>;
}
