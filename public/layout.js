export function overlaps(a,b){return a.x<b.x+b.w&&a.x+a.w>b.x&&a.y<b.y+b.h&&a.y+a.h>b.y;}

export function placeProjectedBubble(anchor, w, h, obstacles, placed, bounds) {
 const margin = 10, step = Math.max(12, bounds.width * .025);
 for (let row = 0; row < 32; row++) {
  const y = anchor.y - h - 12 - row * step;
  if (y < bounds.minY) break;
  for (const dx of [0, -w * .65, w * .65, -w * 1.15, w * 1.15]) {
   const box = {x: Math.max(margin, Math.min(bounds.width - w - margin, anchor.x - w / 2 + dx)), y, w, h};
   if (y + h <= bounds.maxY && !obstacles.some(o => overlaps(box, o)) && !placed.some(o => overlaps(box, o))) return box;
  }
 }
 return null;
}
