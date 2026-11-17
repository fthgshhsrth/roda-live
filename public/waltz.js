// A shared slow 3/4 clock marks the steps without making dancers jump.
export const DANCE_BPM=72;
export function waltzPose(time) {
 const beat=time*Math.PI*2*(DANCE_BPM/60),phase=beat/3;
 return {phase,rise:(1-Math.cos(phase))*.028+(1-Math.cos(beat))*.012,sway:Math.sin(phase)*.065,
  forward:Math.sin(phase)*.16,side:Math.sin(phase*2)*.075,turn:time*.085+Math.sin(phase)*.025,
  shoulder:Math.sin(beat)*.025,hips:Math.sin(phase)*.045,step:Math.sin(beat)*Math.abs(Math.sin(beat))*.19};
}
export function coupleWaltzPose(time,role){
 const pose=waltzPose(time),side=role==='bride'?-1:1;
 return {x:side*.58*Math.cos(pose.turn)+pose.side*.4,z:-side*.58*Math.sin(pose.turn)+pose.forward*.3,
  rotation:pose.turn-side*Math.PI/2};
}
export function floorWaltzPosition(index,count,radius,time) {
 const pose=waltzPose(time),pair=Math.floor(index/2),pairs=Math.ceil(count/2);
 const angle=pair/pairs*Math.PI*2+time*.055;
 const solo=index===count-1&&count%2===1,turn=pose.turn+(index%2)*Math.PI;
 const reach=solo?0:.58;
 return {x:Math.sin(angle)*(radius+pose.forward)+Math.cos(turn)*reach+pose.side,
  z:Math.cos(angle)*(radius+pose.forward)+Math.sin(turn)*reach,rotation:-turn-Math.PI/2};
}
