// Presentation pickers — pure deterministic functions of the view identity (never of the vulns), so
// appearance is reproducible and can't fingerprint a bug. Skins/widgets/layouts are real files under
// web/src/{skins,widgets,layouts}.
import { SKIN_NAMES } from '../skins'
import { WIDGET_NAMES } from '../widgets'
import { LAYOUTS } from '../layouts'
function fnv(s){ let h=2166136261>>>0; s=String(s); for(let i=0;i<s.length;i++){h^=s.charCodeAt(i); h=Math.imul(h,16777619)} return h>>>0 }
const key = (v)=> (v.app||'')+'|'+(v.id||'')+'|'+(v.slug||'')+'|'+(v.uiVariant||0)
export function pickSkin(v){ return SKIN_NAMES[fnv('skin:'+key(v)) % SKIN_NAMES.length] }
export function pickWidget(v){ return WIDGET_NAMES[fnv('wid:'+key(v)) % WIDGET_NAMES.length] }
export function pickLayoutComp(v){ return LAYOUTS[(Math.abs(Number(v.uiVariant)||0) + fnv('lay:'+key(v))) % LAYOUTS.length] }
