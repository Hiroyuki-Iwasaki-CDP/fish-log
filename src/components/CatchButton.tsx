'use client';
import Link from 'next/link';
import { Plus } from 'lucide-react';
export function CatchButton({ large = false }: { large?: boolean }) { return <Link href="/catch/new" onClick={() => sessionStorage.setItem('fish-log-caught-at', new Date().toISOString())} className={large ? 'hero-catch-button' : 'primary-button'}><Plus size={large ? 26 : 18}/>釣れた！</Link>; }
