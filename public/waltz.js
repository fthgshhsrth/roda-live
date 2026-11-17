export const DANCE_BPM=144;
export function waltzPose(time,variant=0) {
 const beat=time*Math.PI*2*(DANCE_BPM/60),phase=beat/4,offset=variant*Math.PI/4;
 return {phase,rise:(1-Math.cos(beat+offset))*.06,sway:Math.sin(beat*.5+offset)*.11,
  forward:Math.sin(phase+offset)*.1,side:Math.sin(beat*.5+offset)*.12,turn:Math.sin(phase+offset)*.3,
  shoulder:Math.sin(beat+offset)*.055,hips:Math.sin(beat*.5+offset)*.11,step:Math.sin(beat+offset)*.4};
}
export function soloWeddingPose(time,role){
 const pose=waltzPose(time,role==='bride'?1:4),side=role==='bride'?-1:1;
 return {x:side*1.3+pose.side*.25,z:.35+pose.forward*.25,rotation:pose.turn};
}
