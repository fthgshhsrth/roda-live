export const BAND = Object.freeze([
 {id:'accordion',label:'Sanfona',icon:'🪗',position:[-5.4,.56,-10]},
 {id:'gramophone',label:'Vitrola',icon:'📀',position:[-2.7,.56,-10]},
 {id:'drums',label:'Bateria',icon:'🥁',position:[0,.56,-10]},
 {id:'harmonica',label:'Gaita',icon:'🎵',position:[2.7,.56,-10]},
 {id:'saxophone',label:'Saxofone',icon:'🎷',position:[5.4,.56,-10]}
]);
export function partyRole(state,id){
 if(!id)return null;
 if(state.couple?.groomId===id)return {kind:'groom',label:'Noivo',icon:'🤵'};
 if(state.couple?.brideId===id)return {kind:'bride',label:'Noiva',icon:'👰'};
 if(state.stage?.djId===id)return {kind:'dj',label:'DJ',icon:'🎧'};
 const slot=state.stage?.bandIds?.indexOf(id)??-1;
 return slot>=0?{kind:'band',slot,...BAND[slot]}:null;
}
export function sceneCast(state,demo=[]){
 const find=id=>state.people.find(p=>p.id===id);
 const staff=(id,slot,props)=>({...find(id),id:id||'@stage:'+slot,name:find(id)?.name||props.roleLabel,
   donor:!!id,stageResident:true,...props});
 const dancers=(state.people.length?state.people:demo).filter(p=>!partyRole(state,p.id)).map(p=>({...p,donor:!p.demo}));
 return [...dancers,
   staff(state.couple?.brideId,'bride',{stageRole:'bride',weddingRole:'bride',roleLabel:'Noiva · Rosa 10',icon:'👰',position:[-.72,.55,0]}),
   staff(state.couple?.groomId,'groom',{stageRole:'groom',weddingRole:'groom',roleLabel:'Noivo · Coração',icon:'🤵',position:[.72,.55,0]}),
   ...BAND.map((instrument,i)=>staff(state.stage?.bandIds?.[i],'band-'+i,{stageRole:'band',instrument:instrument.id,
     roleLabel:instrument.label,icon:instrument.icon,position:instrument.position})),
   staff(state.stage?.djId,'dj',{stageRole:'dj',instrument:'dj',roleLabel:'DJ · Boné',icon:'🎧',position:[8.6,.4,-5.8]})];
}
