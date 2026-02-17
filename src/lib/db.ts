import { supabase, setUserContext } from './supabase';

export async function upsertUser(userId: number): Promise<void> {
  await setUserContext(userId);
  const { error } = await supabase.from('users').upsert({ id: userId }, { onConflict: 'id' });
  if (error) throw error;
}

import { MoodEntry } from "@/types/mood";

export async function saveMoodLog(userId: number, log: MoodEntry) {
  await setUserContext(userId);
  const { error } = await supabase
    .from('mood_logs')
    .insert({
      user_id: userId,
      logged_at: log.timestamp,
      mood: log.mood,
      intensity: log.intensity,
      factors: log.factors,
      tobacco_urge: log.tobaccoUrge,
      notes: log.notes
    });
  if (error) throw error;
}

export async function getMoodLogs(userId: number): Promise<MoodEntry[]> {
  await setUserContext(userId);
  const { data, error } = await supabase
    .from('mood_logs')
    .select('*')
    .eq('user_id', userId)
    .order('logged_at', { ascending: false });
  if (error) throw error;
  return data.map(d => ({
    id: d.id,
    timestamp: d.logged_at,
    mood: d.mood,
    intensity: d.intensity,
    factors: d.factors,
    tobaccoUrge: d.tobacco_urge,
    notes: d.notes
  }));
}

export async function deleteMoodLog(userId: number, id: string) {
  await setUserContext(userId);
  const { error } = await supabase
    .from('mood_logs')
    .delete()
    .eq('id', id)
    .eq('user_id', userId);
  if (error) throw error;
}
