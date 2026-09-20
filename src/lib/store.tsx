'use client';
import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { createClient, type SupabaseClient, type User } from '@supabase/supabase-js';
import type { Catch, Data, Session, Spot } from './types';
const demo = !process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const client: SupabaseClient | null = demo ? null : createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, { auth: { persistSession: true, autoRefreshToken: true } });
const EMPTY: Data = { spots: [], sessions: [], catches: [] };
const KEY = 'fish-log-demo-v1';
type Api = { data: Data; loading: boolean; demo: boolean; user: User | null; error: string | null; refresh: () => Promise<void>; signIn: (email: string) => Promise<void>; signOut: () => Promise<void>; saveCatch: (item: Catch, photo?: File | null) => Promise<void>; saveSession: (item: Session) => Promise<void>; saveSpot: (item: Spot) => Promise<void>; removeSpot: (id: string) => Promise<void>; photoUrl: (path: string) => Promise<string | null> };
const Context = createContext<Api | null>(null);
function readDemo(): Data { try { return JSON.parse(localStorage.getItem(KEY) || 'null') || EMPTY; } catch { return EMPTY; } }
function storeDemo(data: Data) { localStorage.setItem(KEY, JSON.stringify(data)); }
export function DataProvider({ children }: { children: React.ReactNode }) {
  const [data, setData] = useState<Data>(EMPTY);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<User | null>(null);
  const [error, setError] = useState<string | null>(null);
  const refresh = useCallback(async () => {
    if (demo) { setData(readDemo()); setLoading(false); return; }
    const session = await client!.auth.getUser();
    setUser(session.data.user);
    if (!session.data.user) { setData(EMPTY); setLoading(false); return; }
    const [spots, sessions, catches] = await Promise.all([client!.from('spots').select('*').order('created_at', { ascending: false }), client!.from('fishing_sessions').select('*').order('started_at', { ascending: false }), client!.from('catches').select('*').order('caught_at', { ascending: false })]);
    const failure = spots.error || sessions.error || catches.error;
    if (failure) setError(failure.message); else { setError(null); setData({ spots: spots.data as Spot[], sessions: sessions.data as Session[], catches: catches.data as Catch[] }); }
    setLoading(false);
  }, []);
  useEffect(() => { queueMicrotask(refresh); if (!client) return; const { data: subscription } = client.auth.onAuthStateChange(() => { setTimeout(refresh, 0); }); return () => subscription.subscription.unsubscribe(); }, [refresh]);
  const signIn = async (email: string) => { const { error } = await client!.auth.signInWithOtp({ email, options: { emailRedirectTo: window.location.origin } }); if (error) throw error; };
  const signOut = async () => { await client?.auth.signOut(); setUser(null); setData(EMPTY); };
  const saveCatch = async (item: Catch, photo?: File | null) => {
    if (demo) {
      let photo_path: string | null = null;
      if (photo) {
        try {
          photo_path = await new Promise<string>((resolve, reject) => {
            const image = new Image(); const url = URL.createObjectURL(photo);
            image.onload = () => { const scale = Math.min(1, 1200 / Math.max(image.width, image.height)); const canvas = document.createElement('canvas'); canvas.width = Math.round(image.width * scale); canvas.height = Math.round(image.height * scale); canvas.getContext('2d')!.drawImage(image, 0, 0, canvas.width, canvas.height); URL.revokeObjectURL(url); resolve(canvas.toDataURL('image/jpeg', .72)); };
            image.onerror = () => { URL.revokeObjectURL(url); reject(new Error('画像を読み込めません')); }; image.src = url;
          });
        } catch { item.snapshot.warnings.push('写真を保存できませんでした'); }
      }
      const next = { ...data, catches: [{ ...item, photo_path }, ...data.catches] };
      try { storeDemo(next); } catch { const withoutPhoto = { ...item, photo_path: null }; storeDemo({ ...data, catches: [withoutPhoto, ...data.catches] }); next.catches[0] = withoutPhoto; }
      setData(next); return;
    }
    if (!user) throw new Error('ログインが必要です');
    const { error } = await client!.from('catches').insert({ ...item, user_id: user.id });
    if (error) throw error;
    if (photo) {
      const photo_path = `${user.id}/${item.id}/${crypto.randomUUID()}-${photo.name.replace(/[^a-zA-Z0-9._-]/g, '')}`;
      const upload = await client!.storage.from('catch-photos').upload(photo_path, photo, { contentType: photo.type, upsert: false });
      if (!upload.error) await client!.from('catches').update({ photo_path }).eq('id', item.id);
    }
    await refresh();
  };
  const saveSession = async (item: Session) => {
    if (demo) { const next = { ...data, sessions: [item, ...data.sessions.filter(x => x.id !== item.id)] }; storeDemo(next); setData(next); return; }
    const { error } = await client!.from('fishing_sessions').upsert({ ...item, user_id: user!.id }); if (error) throw error; await refresh();
  };
  const saveSpot = async (item: Spot) => {
    if (demo) { const next = { ...data, spots: [item, ...data.spots.filter(x => x.id !== item.id)] }; storeDemo(next); setData(next); return; }
    const { error } = await client!.from('spots').upsert({ ...item, user_id: user!.id }); if (error) throw error; await refresh();
  };
  const removeSpot = async (id: string) => {
    if (demo) { const next = { ...data, spots: data.spots.filter(x => x.id !== id) }; storeDemo(next); setData(next); return; }
    const { error } = await client!.from('spots').delete().eq('id', id); if (error) throw error; await refresh();
  };
  const photoUrl = useCallback(async (path: string) => { if (demo) return path; const { data } = await client!.storage.from('catch-photos').createSignedUrl(path, 3600); return data?.signedUrl || null; }, []);
  const value: Api = { data, loading, demo, user, error, refresh, signIn, signOut, saveCatch, saveSession, saveSpot, removeSpot, photoUrl };
  return <Context.Provider value={value}>{children}</Context.Provider>;
}
export function useData() { const value = useContext(Context); if (!value) throw new Error('DataProvider missing'); return value; }
