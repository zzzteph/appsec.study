// skin registry — 16 Material palettes, applied per page as CSS variables (decoupled from vulns).
import indigo from './indigo.js'
import teal from './teal.js'
import rose from './rose.js'
import amber from './amber.js'
import slate from './slate.js'
import emerald from './emerald.js'
import violet from './violet.js'
import crimson from './crimson.js'
import ocean from './ocean.js'
import forest from './forest.js'
import sunset from './sunset.js'
import mono from './mono.js'
import midnight from './midnight.js'
import coral from './coral.js'
import steel from './steel.js'
import lime from './lime.js'
export const SKINS = { indigo, teal, rose, amber, slate, emerald, violet, crimson, ocean, forest, sunset, mono, midnight, coral, steel, lime }
export const SKIN_NAMES = Object.keys(SKINS)
export function skinVars(name) { const s = SKINS[name] || SKINS.indigo; return s.vars }
