export function overlaps(a,b){return a.x<b.x+b.w&&a.x+a.w>b.x&&a.y<b.y+b.h&&a.y+a.h>b.y;}
export function placeBubble(anchor,w,h,obstacles,placed){
 for(let row=0;row<27;row++){const y=anchor.head-35-h-row*20;for(const dx of [0,-225,225,-450,450]){const b={x:Math.max(28,Math.min(1080-w-28,anchor.x-w/2+dx)),y,w,h};if(b.y>390&&b.y+b.h<1530&&!obstacles.some(o=>overlaps(b,o))&&!placed.some(o=>overlaps(b,o)))return b;}}return null;
}