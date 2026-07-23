export function hue(s){ let h=0; for(const c of String(s||'?')) h=(h*31+c.charCodeAt(0))%360; return h }
export const money = (n) => '$' + Number(n || 0).toLocaleString()
