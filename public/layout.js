export function overlaps(a,b){return a.x<b.x+b.w&&a.x+a.w>b.x&&a.y<b.y+b.h&&a.y+a.h>b.y;}

// Nome fica colado acima da cabeça. Se o lugar estiver ocupado, some: nunca é empurrado para longe do dono.
export function placeNameTag(anchor, w, h, obstacles, bounds) {
 const minX=bounds.minX??10,maxX=bounds.maxX??bounds.width-10;
 const box={x:Math.max(minX,Math.min(maxX-w,anchor.x-w/2)),y:anchor.y-h-4,w,h};
 if(box.y<bounds.minY||box.y+h>bounds.maxY||obstacles.some(o=>overlaps(box,o)))return null;
 return box;
}

export function placeProjectedBubble(anchor, w, h, obstacles, placed, bounds) {
 const margin = bounds.minX??10,right=bounds.maxX??bounds.width-10,step = Math.max(12, bounds.width * .025);
 if(w>right-margin)return null;
 for (let row = 0; row < 32; row++) {
  const y = anchor.y - h - 12 - row * step;
  if (y < bounds.minY) break;
  for (const dx of [0, -w * .65, w * .65, -w * 1.15, w * 1.15]) {
   const box = {x: Math.max(margin, Math.min(right - w, anchor.x - w / 2 + dx)), y, w, h};
   const padded={x:box.x-4,y:box.y-4,w:w+8,h:h+8};
   if (y + h <= bounds.maxY && !obstacles.some(o => overlaps(padded, o)) && !placed.some(o => overlaps(padded, o))) return box;
  }
 }
 return null;
}
