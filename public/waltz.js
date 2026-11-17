// One shared 3/4 clock keeps the floor and the couple on the same step.
export function waltzPose(time) {
 const phase=time*Math.PI*2*(90/60)/3;
 return {phase,rise:(1-Math.cos(phase))*.035,sway:Math.sin(phase)*.045,
  forward:Math.sin(phase)*.13,side:Math.sin(phase*2)*.06,turn:time*.14};
}
export function floorWaltzPosition(index,count,radius,time) {
 const pose=waltzPose(time),pair=Math.floor(index/2),pairs=Math.ceil(count/2);
 const angle=pair/pairs*Math.PI*2+time*.055;
 const solo=index===count-1&&count%2===1,turn=pose.turn+(index%2)*Math.PI;
 const reach=solo?0:.58;
 return {x:Math.sin(angle)*(radius+pose.forward)+Math.cos(turn)*reach+pose.side,
  z:Math.cos(angle)*(radius+pose.forward)+Math.sin(turn)*reach,rotation:-turn-Math.PI/2};
}
