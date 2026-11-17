import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {createHash} from 'node:crypto';
import assert from 'node:assert/strict';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const files=[];
function collect(dir){for(const item of fs.readdirSync(path.join(root,dir),{withFileTypes:true})){
 const file=(dir?dir+'/':'')+item.name;
 if(item.isFile()&&/\.(?:mjs|js)$/.test(file))files.push(file);
}}
collect('');collect('public');collect('scripts');files.sort();
const nodes=files.map(file=>{
 const text=fs.readFileSync(path.join(root,file),'utf8');
 const imports=[...text.matchAll(/\b(?:import|export)\s+(?:[^'";\n]*?\sfrom\s*)?['"]([^'"]+)['"]/g),...text.matchAll(/\bimport\(\s*['"]([^'"]+)['"]\s*\)/g)].map(match=>match[1]);
 const dependencies=[...new Set(imports.map(specifier=>specifier.startsWith('.')?path.posix.normalize(path.posix.join(path.posix.dirname(file),specifier)):specifier.startsWith('/vendor/three/')?'three':specifier))];
 for(const dependency of dependencies)if(dependency.startsWith('.')||files.includes(dependency)||dependency.endsWith('.js')&&!dependency.startsWith('/'))assert.ok(fs.existsSync(path.join(root,dependency)),'Import ausente: '+file+' → '+dependency);
 return {file,sha256:createHash('sha256').update(text).digest('hex'),exports:[...text.matchAll(/\bexport\s+(?:async\s+)?(?:function|class|const)\s+(\w+)/g)].map(match=>match[1]),dependencies};
});
assert.ok(nodes.length>0);
const target=path.join(root,'docs/context-map.json'),output=JSON.stringify({kind:'static-esm-imports',nodes},null,2)+'\n';
if(process.argv.includes('--check')){assert.equal(fs.readFileSync(target,'utf8'),output,'Grafo desatualizado; execute npm run context');console.log('Grafo atualizado: '+nodes.length+' módulos');}
else{
 fs.mkdirSync(path.dirname(target),{recursive:true});fs.writeFileSync(target,output);
 const ids=new Map(nodes.map((node,i)=>[node.file,'n'+i]));
 const diagram=['graph LR',...nodes.map(node=>'  '+ids.get(node.file)+'["'+node.file+'"]')];
 for(const node of nodes)for(const dependency of node.dependencies)if(ids.has(dependency))diagram.push('  '+ids.get(node.file)+' --> '+ids.get(dependency));
 fs.writeFileSync(path.join(root,'docs/context-map.md'),'# Mapa de contexto\n\nÍndice estático de imports e exports; evita reler o projeto inteiro. Gere novamente após mudar módulos.\n\n```mermaid\n'+diagram.join('\n')+'\n```\n\nFluxos principais: presentes → server.js → wheel.js → party.js → public/party-layout.js; visual → scene3d.js → roach.js/instruments.js/backstage.js; câmera → camera-director.js.\n');
 console.log('Grafo gerado: '+nodes.length+' módulos; '+nodes.reduce((n,node)=>n+node.dependencies.length,0)+' imports');
}
