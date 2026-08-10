/* eslint-disable react/no-unescaped-entities */
"use client";

import { useEffect, useId, useRef, useState } from "react";
import { draftAdventure } from "@/lib/adventure-studio";
import { authoredAdventures } from "@/lib/content/adventures";
import { stories } from "@/lib/content/stories";
import type { AdventureDefinition, StoryDefinition } from "@/lib/content/types";
import { loadProgressFromStorage, loadProgressV3, levelFor, persistProgressV3, resetProgressV3 } from "@/lib/progress";
import { reduceProgress } from "@/lib/progress-reducer";
import { isInternalBeta, isProductionAdventure, type UniversePanel } from "@/lib/release-profile";
import { PWA_STATUS_EVENT, requestPwaUpdate, type PwaStatus } from "@/lib/pwa-lifecycle";
import type { AdventureDraft, ProgressV3 } from "@/lib/types";

const tram = authoredAdventures.find((item) => item.id === "tram")!;
const productionAdventures = authoredAdventures.filter((item) => isProductionAdventure(item.id));

function greeting(): [string, string] {
  const hour = new Date().getHours();
  if (hour < 6) return ["Gece gezgini!", "Fındık biraz uykulu ama seni gördü."];
  if (hour < 12) return ["Günaydın!", "Fındık seni bekliyordu."];
  if (hour < 18) return ["Macera vakti!", "Bugün dünya biraz daha büyük görünüyor."];
  return ["İyi akşamlar!", "Fındık günün son macerasına hazır."];
}

function completed(progress: ProgressV3, adventure: AdventureDefinition) {
  return Boolean(progress.completions[`adventure:${adventure.id}:v${adventure.version}`]);
}

export function Universe() {
  const [progress, setProgress] = useState(loadProgressV3);
  const [hydrated, setHydrated] = useState(false);
  const [active, setActive] = useState<AdventureDefinition | null>(null);
  const [choice, setChoice] = useState<number | null>(null);
  const [notice, setNotice] = useState("Sonunda geldin. Bugün nereye gidiyoruz?");
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [studioOpen, setStudioOpen] = useState(false);
  const [idea, setIdea] = useState("");
  const [draft, setDraft] = useState<AdventureDraft | null>(null);
  const [storyOpen, setStoryOpen] = useState<StoryDefinition | null>(null);
  const [storyNode, setStoryNode] = useState("start");
  const [storyDone, setStoryDone] = useState(false);
  const [activePanel, setActivePanel] = useState<UniversePanel>("home");
  const [characterMood, setCharacterMood] = useState<"idle" | "look" | "alert" | "tongue">("idle");
  const [pwaStatus, setPwaStatus] = useState<PwaStatus>("registering");
  const [[title, subtitle]] = useState<[string, string]>(() => greeting());

  useEffect(() => {
    const hydrationFrame = window.requestAnimationFrame(() => {
      setProgress(loadProgressFromStorage());
      setHydrated(true);
    });
    const onPwaStatus = (event: Event) => setPwaStatus((event as CustomEvent<{ status: PwaStatus }>).detail.status);
    window.addEventListener(PWA_STATUS_EVENT, onPwaStatus);
    return () => { window.cancelAnimationFrame(hydrationFrame); window.removeEventListener(PWA_STATUS_EVENT, onPwaStatus); };
  }, []);

  function commit(next: ProgressV3) {
    setProgress(next);
    const result = persistProgressV3(next);
    if (!result.ok) setNotice("İlerleme bu cihazda kaydedilemedi. Depolama iznini kontrol et.");
  }

  function boop() {
    commit(reduceProgress(progress, { type: "CHARACTER_BOOPED" }));
    setNotice(["Burnuma mı dokundun?", "Küçük patiler. Büyük planlar.", "Tamam, hazırım!"][progress.boops % 3]);
    setCharacterMood("tongue");
    window.setTimeout(() => setCharacterMood("idle"), 900);
  }

  function resolveChoice(index: number) {
    if (!active?.presentation) return;
    setChoice(index);
    if (index !== active.presentation.correctChoice) return;
    commit(reduceProgress(progress, { type: "CONTENT_COMPLETED", input: { content: { type: "adventure", id: active.id, version: active.version }, reward: active.reward } }));
    setNotice(active.reward.memoryCaption ?? "Tramvay anısı albüme eklendi.");
  }

  function enterStory(story: StoryDefinition, nodeId: string) {
    setStoryNode(nodeId);
    const node = story.nodes.find((item) => item.id === nodeId);
    if (node?.ending) {
      commit(reduceProgress(progress, { type: "CONTENT_COMPLETED", input: { content: { type: "story", id: story.id, version: story.version }, reward: story.reward } }));
      setStoryDone(true);
    }
  }

  function confirmReset() {
    if (!window.confirm("Bu cihazdaki tüm ilerleme, anı ve ödüller silinecek. Devam edilsin mi?")) return;
    const { progress: blank, result } = resetProgressV3();
    setProgress(blank);
    setNotice(result.ok ? "Bu cihazdaki ilerleme sıfırlandı." : "İlerleme sıfırlanamadı.");
  }

  if (!hydrated) return <main className="loading" aria-busy="true" aria-live="polite">Fındık dünyasını hazırlıyor…</main>;

  const xpInLevel = progress.xp % 100;
  const tramDone = completed(progress, tram);
  const navItems: Array<[UniversePanel, string, string]> = [["home", "Ev", "⌂"], ["adventures", "Tramvay", "✦"], ["album", "Albüm", "▣"], ["vault", "Kasa", "◇"]];
  if (isInternalBeta) navItems.push(["stories", "Hikâye", "◌"], ["world", "Harita", "⌖"]);

  return <main className="app-shell" aria-busy={!hydrated}>
    <header className="topbar"><div><span className="eyebrow">FINDIK UNIVERSE · LOCAL BETA</span><h1>{title}</h1><p>{subtitle}</p></div><button className="level-button" onClick={() => setSettingsOpen(true)} aria-label="Yerel ayarlar">S<span>{levelFor(progress.xp)}</span></button></header>

    {pwaStatus === "update-available" && <aside className="update-banner" role="status"><span>Fındık için yeni bir sürüm hazır.</span><button onClick={() => void requestPwaUpdate()}>Şimdi güncelle</button></aside>}
    {pwaStatus === "error" && <p className="notice" role="status">Çevrimdışı kurulum hazırlanamadı; uygulama çevrimiçi çalışmaya devam ediyor.</p>}

    <section className="world" aria-label="Fındık'ın evi"><div className="scene-detail sun" aria-hidden>☀</div><div className="scene-detail tram" aria-hidden>▤</div><div className="scene-detail park" aria-hidden>✦</div><button className={`character-placeholder mood-${characterMood}`} onClick={boop} aria-label="Fındık'a dokun"><img src="/assets/character/findik-idle-front-v01.png" alt="" className="character-art" /><span className="character-tongue" aria-hidden="true" /><span className="attention-mark" aria-hidden="true">!</span></button><p className="speech" aria-live="polite">{notice}</p><p className="asset-disclosure">Onay bekleyen candidate karakter görseli</p></section>

    <section className="progress-card" aria-label="İlerleme"><div><b>{xpInLevel} / 100 XP</b><small>Bir sonraki seviyeye</small></div><div className="meter" role="progressbar" aria-label="Bir sonraki seviyeye ilerleme" aria-valuenow={xpInLevel} aria-valuemin={0} aria-valuemax={100}><i style={{ width: `${xpInLevel}%` }} /></div></section>
    <nav className="universe-nav" aria-label="Fındık dünyası bölümleri">{navItems.map(([id, label, icon]) => <button key={id} aria-current={activePanel === id ? "page" : undefined} className={activePanel === id ? "active" : ""} onClick={() => setActivePanel(id)}><span aria-hidden>{icon}</span>{label}</button>)}</nav>

    {activePanel === "home" && <section className="home-infographic screen-panel" aria-labelledby="home-title"><h2 id="home-title" className="sr-only">Fındık'ın evi</h2><div className="home-stat"><b>{tramDone ? 1 : 0}/1</b><span>macera tamamlandı</span></div><div className="home-stat"><b>{progress.memories.length}</b><span>anı albümde</span></div><div className="home-stat"><b>{progress.boops}</b><span>burun dokunuşu</span></div><button className="secondary" onClick={() => setCharacterMood("alert")}>Fındık dikkat kesilsin</button><button className="secondary" onClick={() => setCharacterMood("look")}>Fındık etrafa baksın</button></section>}
    {activePanel === "adventures" && <section className="screen-panel" aria-labelledby="adventure-title"><SectionHead id="adventure-title" label="BUGÜN" title="Tramvay Macerası" aside={tramDone ? "Tamamlandı" : "Hazır"} /><div className="adventure-rail">{productionAdventures.map((adventure) => <button key={adventure.id} onClick={() => { setActive(adventure); setChoice(null); }} className={`adventure-card ${adventure.presentation?.tone ?? "tram"} ${completed(progress, adventure) ? "done" : ""}`}><span className="eyebrow">TRAMVAY DURAĞI</span><strong>{adventure.title}</strong><p>{adventure.presentation?.hook}</p>{completed(progress, adventure) && <em>✓ Tamamlandı · yeniden oynanabilir</em>}</button>)}</div></section>}
    {activePanel === "album" && <section className="screen-panel" aria-labelledby="album-title"><SectionHead id="album-title" label="HATIRALAR" title="Fındık'ın Albümü" /><div className="album-grid">{progress.memories.length ? progress.memories.map((memory) => <article key={memory.id} className="memory"><div className="memory-art tram">F</div><b>{memory.id === "tram" ? tram.title : "Fındık anısı"}</b><small>{new Intl.DateTimeFormat("tr-TR", { day: "numeric", month: "long" }).format(new Date(memory.completedAt))} · {memory.caption}</small></article>) : <p className="empty">Tramvay Macerası'nı tamamladığında hatıran burada yaşayacak.</p>}</div></section>}
    {activePanel === "vault" && <section className="screen-panel" aria-labelledby="vault-title"><SectionHead id="vault-title" label="KOLEKSİYON" title="Sticker Kasası" aside={tramDone ? "1/1 açık" : "0/1 açık"} /><figure className="sticker-sheet"><img src="/assets/stickers/findik-adventure-sticker-sheet-v01.png" alt="Onay bekleyen Fındık sticker sayfası" /><figcaption>Candidate sticker sayfası · sahip onayı bekliyor</figcaption></figure><div className="sticker-grid"><div className={`sticker ${tramDone ? "" : "locked"}`} aria-disabled={!tramDone}><span>{tramDone ? tram.reward.stickerText : "Kilitli"}</span><small>{tramDone ? "Tramvay ödülü" : "Tramvay Macerası ile açılır"}</small></div></div></section>}

    {isInternalBeta && activePanel === "stories" && <section className="screen-panel"><SectionHead label="INTERNAL BETA" title="Hikâyeler" /><div className="adventure-rail">{stories.map((story) => <button key={story.id} className="adventure-card park" onClick={() => { setStoryOpen(story); setStoryDone(false); enterStory(story, story.startNodeId); }}><strong>{story.title}</strong></button>)}</div></section>}
    {isInternalBeta && activePanel === "world" && <section className="screen-panel"><SectionHead label="INTERNAL BETA" title="Harita" /><p className="empty">Harita ilk teslim kapsamında değildir.</p></section>}
    <div className="actions">{isInternalBeta && <button className="secondary" onClick={() => setStudioOpen(true)}>Adventure Studio</button>}<button className="secondary" onClick={() => setSettingsOpen(true)}>Yerel ayarlar</button></div>

    {active?.presentation && <Dialog title={active.title} onClose={() => setActive(null)}><span className="eyebrow">TRAMVAY DURAĞI</span><p>{active.beats[0]?.text}</p><h3>{active.presentation.task}</h3><div className="choices">{active.presentation.choices.map((label, index) => <button key={label} className={choice === index ? (index === active.presentation!.correctChoice ? "correct" : "wrong") : ""} disabled={choice !== null && choice === active.presentation!.correctChoice} onClick={() => resolveChoice(index)}>{label}</button>)}</div>{choice !== null && <p className={choice === active.presentation.correctChoice ? "success" : "try-again"}>{choice === active.presentation.correctChoice ? `Görev tamam! +${active.reward.xp} XP ve “${active.reward.stickerText}” açıldı.` : "Bu koltuk uygun değil. Bir daha dene."}</p>}<button className="primary" onClick={() => setActive(null)}>{choice === active.presentation.correctChoice ? "Anıya dön" : "Maceraya dön"}</button></Dialog>}
    {settingsOpen && <Dialog title="Yerel ayarlar" onClose={() => setSettingsOpen(false)}><p>İlerleme yalnız bu cihazda saklanır. Hesap, bulut yedekleme ve uzaktan feedback bu teslimde kapalıdır.</p><button className="text-button" onClick={confirmReset}>Bu cihazdaki ilerlemeyi sıfırla</button></Dialog>}
    {isInternalBeta && studioOpen && <Dialog title="Adventure Studio · internal beta" onClose={() => setStudioOpen(false)}><form onSubmit={(event) => { event.preventDefault(); setDraft(draftAdventure(idea)); }} className="form"><label>Fikir<input value={idea} onChange={(event) => setIdea(event.target.value)} /></label><button className="primary" type="submit">Taslak oluştur</button></form>{draft && <article><h3>{draft.title}</h3><button className="secondary" onClick={() => setDraft(null)}>Taslağı sil</button></article>}</Dialog>}
    {isInternalBeta && storyOpen && <Dialog title={storyOpen.title} onClose={() => setStoryOpen(null)}><p>{storyOpen.nodes.find((node) => node.id === storyNode)?.text}</p>{!storyDone && storyOpen.nodes.find((node) => node.id === storyNode)?.choices?.map((item) => <button className="secondary" key={item.next} onClick={() => enterStory(storyOpen, item.next)}>{item.label}</button>)}{storyDone && <p className="success">Hikâye tamamlandı.</p>}</Dialog>}
  </main>;
}

function SectionHead({ id, label, title, aside }: { id?: string; label: string; title: string; aside?: string }) { return <div className="section-head"><div><span className="eyebrow">{label}</span><h2 id={id}>{title}</h2></div>{aside && <small>{aside}</small>}</div>; }

function Dialog({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  const dialogRef = useRef<HTMLElement>(null);
  const restoreRef = useRef<HTMLElement | null>(null);
  const onCloseRef = useRef(onClose);
  const titleId = useId();
  useEffect(() => { onCloseRef.current = onClose; }, [onClose]);
  useEffect(() => {
    restoreRef.current = document.activeElement as HTMLElement;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    dialogRef.current?.focus();
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") { event.preventDefault(); onCloseRef.current(); return; }
      if (event.key !== "Tab" || !dialogRef.current) return;
      const focusable = Array.from(dialogRef.current.querySelectorAll<HTMLElement>("button, input, textarea, select, [href], [tabindex]:not([tabindex='-1'])")).filter((element) => !element.hasAttribute("disabled"));
      if (!focusable.length) return;
      const first = focusable[0]; const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
    };
    document.addEventListener("keydown", onKeyDown);
    return () => { document.body.style.overflow = previousOverflow; document.removeEventListener("keydown", onKeyDown); restoreRef.current?.focus(); };
  }, []);
  return <div className="dialog-backdrop" role="presentation" onMouseDown={() => onCloseRef.current()}><section ref={dialogRef} className="dialog" role="dialog" aria-modal="true" aria-labelledby={titleId} tabIndex={-1} onMouseDown={(event) => event.stopPropagation()}><button className="close" onClick={() => onCloseRef.current()} aria-label="Kapat">×</button><h2 id={titleId}>{title}</h2>{children}</section></div>;
}
