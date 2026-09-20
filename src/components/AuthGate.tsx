'use client';
import { useState } from 'react';
import { useData } from '@/lib/store';
import { Fish, ArrowRight } from 'lucide-react';
export function AuthGate({ children }: { children: React.ReactNode }) {
  const { demo, user, loading, signIn, error } = useData();
  const [email, setEmail] = useState(''); const [message, setMessage] = useState('');
  if (loading) return <div className="center-screen">読み込み中…</div>;
  if (demo || user) return <>{children}</>;
  return <main className="auth-screen"><div className="brand-mark"><Fish size={30}/></div><span className="eyebrow">YOUR PRIVATE FISHING JOURNAL</span><h1>FISH LOG</h1><p>釣れた瞬間を、データにする。</p><form onSubmit={async e => { e.preventDefault(); try { await signIn(email); setMessage('ログインリンクをメールに送信しました。'); } catch (error) { setMessage(error instanceof Error ? error.message : '送信できませんでした'); } }}><label htmlFor="email">メールアドレス</label><input id="email" type="email" required value={email} onChange={e => setEmail(e.target.value)} placeholder="you@example.com"/><button className="primary-button" type="submit">ログインリンクを送る <ArrowRight size={18}/></button></form>{(message || error) && <p className="form-note">{message || error}</p>}</main>;
}
