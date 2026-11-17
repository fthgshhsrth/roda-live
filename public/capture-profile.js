export function captureProfile(width,height,{high=true,preview=false,dpr=1}={}) {
 const portrait = width < height, targetWidth = portrait ? 1080 : 1920;
 const ratio = preview || !high ? 1 : Math.min(3,Math.max(dpr,targetWidth / width),4096 / Math.max(width,height));
 return {ratio,fps:preview?24:high?60:30,shadowSize:high&&!preview?2048:512};
}
