"use client";

import { supabase } from "./supabase";
import type { Progress } from "./types";

export async function backupProgress(progress: Progress) {
  if (!supabase) return { error: "Supabase henüz yapılandırılmadı." };
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Önce giriş yapmalısın." };
  const { error } = await supabase.from("progress").upsert({ user_id: user.id, version: progress.version, xp: progress.xp, completed: progress.completed, boops: progress.boops, wardrobe: progress.wardrobe, updated_at: new Date().toISOString() });
  if (error) return { error: error.message };
  const memories = progress.memories.map((memory) => ({ user_id: user.id, adventure_id: memory.id, completed_at: memory.completedAt, caption: memory.caption }));
  if (memories.length) {
    const { error: memoryError } = await supabase.from("memories").upsert(memories, { onConflict: "user_id,adventure_id" });
    if (memoryError) return { error: memoryError.message };
  }
  return { error: null };
}

export async function restoreProgress(): Promise<{ progress: Progress | null; error: string | null }> {
  if (!supabase) return { progress: null, error: "Supabase henüz yapılandırılmadı." };
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { progress: null, error: "Önce giriş yapmalısın." };
  const [{ data: stored, error }, { data: memories, error: memoryError }] = await Promise.all([
    supabase.from("progress").select("version,xp,completed,boops,wardrobe").eq("user_id", user.id).maybeSingle(),
    supabase.from("memories").select("adventure_id,completed_at,caption").eq("user_id", user.id).order("completed_at", { ascending: false }),
  ]);
  if (error || memoryError) return { progress: null, error: error?.message || memoryError?.message || "Yedek okunamadı." };
  if (!stored) return { progress: null, error: "Bu hesapta henüz yedek yok." };
  return { progress: { version: 2, xp: stored.xp, completed: stored.completed, boops: stored.boops, wardrobe: stored.wardrobe, memories: (memories || []).map((memory) => ({ id: memory.adventure_id, completedAt: memory.completed_at, caption: memory.caption })) as Progress["memories"] }, error: null };
}
