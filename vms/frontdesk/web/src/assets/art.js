// deterministic gradient per room, so cards look distinct without image assets
export function grad(seed) {
  let h = 0; for (const c of String(seed)) h = (h * 33 + c.charCodeAt(0)) % 360
  const h2 = (h + 40) % 360
  return `linear-gradient(135deg, hsl(${h} 55% 42%), hsl(${h2} 60% 55%))`
}
export const money = (n) => '$' + Number(n || 0).toLocaleString()
