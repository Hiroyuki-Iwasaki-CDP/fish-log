'use client';
import { useEffect, useState } from 'react';
import { Fish } from 'lucide-react';
import { useData } from '@/lib/store';
export function Photo({ path, className = '' }: { path: string | null; className?: string }) { const { photoUrl } = useData(); const [url, setUrl] = useState<string | null>(null); useEffect(() => { let active = true; if (path) photoUrl(path).then(value => { if (active) setUrl(value); }); return () => { active = false; }; }, [path, photoUrl]); return <div className={`photo ${className}`}>{url ? /* eslint-disable-next-line @next/next/no-img-element */
<img src={url} alt="釣果写真"/> : <div className="photo-placeholder"><Fish size={38}/></div>}</div>; }
