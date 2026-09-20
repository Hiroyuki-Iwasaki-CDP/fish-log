export const dateTime = (s: string) => new Intl.DateTimeFormat('ja-JP', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(s));
export const dateOnly = (s: string) => new Intl.DateTimeFormat('ja-JP', { month: 'long', day: 'numeric', weekday: 'short' }).format(new Date(s));
export const timeOnly = (s: string) => new Intl.DateTimeFormat('ja-JP', { hour: '2-digit', minute: '2-digit' }).format(new Date(s));
export const tideLabel = (s: string | null) => s === 'rising' ? '上げ潮' : s === 'falling' ? '下げ潮' : s === 'slack' ? '潮止まり' : '未取得';
