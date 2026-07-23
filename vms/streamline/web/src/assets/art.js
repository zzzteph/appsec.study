// tiny deterministic avatar color from a name
export function hue(name){ let h=0; for(const c of (name||'?')) h=(h*31+c.charCodeAt(0))%360; return h }
export function initials(name){ const p=(name||'?').trim().split(/\s+/); return ((p[0]||'?')[0]+((p[1]||'')[0]||'')).toUpperCase() }
