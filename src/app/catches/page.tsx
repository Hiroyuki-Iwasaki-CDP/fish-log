'use client';
import { useMemo, useState } from 'react';
import Link from 'next/link';
import { ChevronRight, Fish, Search } from 'lucide-react';
import { useData } from '@/lib/store';
import { Photo } from '@/components/Photo';
import { CatchButton } from '@/components/CatchButton';
import { dateOnly, timeOnly } from '@/components/format';
export default function Catches() { const { data } = useData(); const [query, setQuery] = useState(''); const list = useMemo(() => [...data.catches].filter(c => `${c.species} ${c.note} ${c.snapshot.spot_name || ''}`.toLowerCase().includes(query.toLowerCase())).sort((a,b) => b.caught_at.localeCompare(a.caught_at)), [data.catches, query]); return <><div className="page-heading"><div><div className="page-kicker">THE JOURNAL <span>— 釣果一覧</span></div><h1>釣果の記録</h1><p>一匹ずつ、あの日の記憶を。</p></div><CatchButton/></div><div className="filter-bar"><Search size={18}/><input aria-label="釣果を検索" value={query} onChange={e => setQuery(e.target.value)} placeholder="魚種、場所、メモで検索"/><span>{list.length} 件</span></div>{list.length ? <div className="catch-grid">{list.map(c => <Link className="catch-card" href={`/catches/${c.id}`} key={c.id}><Photo path={c.photo_path}/><div className="catch-card-body"><small>{dateOnly(c.caught_at)} · {timeOnly(c.caught_at)}</small><h2>{c.species}</h2><p>{c.snapshot.spot_name || '場所未設定'} · {c.length_cm ? `${c.length_cm} cm` : `${c.count}匹`}</p><span>詳細を見る <ChevronRight size={16}/></span></div></Link>)}</div> : <div className="panel empty-state large"><Fish size={38}/><strong>{query ? '一致する釣果がありません' : 'まだ釣果がありません'}</strong><p>{query ? '検索語を変えてみてください。' : '最初の一匹を記録しましょう。'}</p></div>}</>; }
