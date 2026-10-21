const fs=require('fs'),vm=require('vm');
const path=require('path');const root=path.resolve(__dirname,'..');let pages={};
const fake=()=>{const o={style:{},dataset:{},classList:{add(){},remove(){},toggle(){}},children:[],options:[],value:'1',textContent:'',innerHTML:'',addEventListener(){},appendChild(){},append(){},setAttribute(){},getAttribute(){return ''},querySelector(){return fake()},querySelectorAll(){return []},replaceChildren(){},getClientRects(){return [1]},add(){}};return o};
for(const page of fs.readdirSync(root).filter(n=>n.endsWith('.html'))){
 const html=fs.readFileSync(root+'/'+page,'utf8');if(!html.includes('productModal')&&!html.includes('handleAddToCart'))continue;
 const c={CSS:{escape:s=>s},document:{getElementById:()=>fake(),querySelector:()=>fake(),querySelectorAll:()=>[],createElement:()=>fake(),addEventListener(){},body:fake()},localStorage:{getItem:()=>null,setItem(){}},sessionStorage:{getItem:()=>null},window:{addEventListener(){},FawzSite:{},location:{}},console:{log(){},warn(){},error(){}},setTimeout(){},setInterval(){},MutationObserver:class{observe(){}},getFirebasePrice:()=>0,alert(){},location:{},addEventListener(){},Option: function(){},Image:function(){}};vm.createContext(c);
 const vars=new Set(),errors=[];
 for(const m of html.matchAll(/<script\b[^>]*>([\s\S]*?)<\/script>/g)){
 for(const v of m[1].matchAll(/\b(?:const|let|var)\s+([A-Za-z_$][\w$]*)\s*=/g))vars.add(v[1]);
 try{vm.runInContext(m[1],c,{timeout:1500})}catch(e){errors.push(e.message)}
 }
 const data={};for(const name of vars)try{const value=vm.runInContext(name,c);if(value&&typeof value==='object')data[name]=JSON.parse(JSON.stringify(value))}catch{}
 pages[page]={data,errors};
}
const manifest=JSON.parse(fs.readFileSync(root+'/product-manifest.json'));
const moved={'machineAccessories.html':'machine-accessories.html','sewingThread.html':'sewing-threads.html','patternPaper.html':'pattern-paper.html'};
const records=new Map(manifest.products.map(p=>[p.product_id,{...p,page:moved[p.page]||p.page}]));
const expected=new Map(),stats={};
const aliases={'hook-loop.html':'hookAndLoop.html','sewing-threads.html':'sewingThread.html','curtain-accessories.html':'curtain.html','brooches.html':'broach.html','eyelets-tools.html':'eyeletsAndPlier.html','machine accessories.html':'machine-accessories.html','pattern-paper.html':'patternPaper.html'};
for(const [alias,target] of Object.entries(aliases))if(!fs.existsSync(root+'/'+target))delete aliases[alias];
const slug=s=>String(s).toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'');
const clean=s=>String(s).replace(/\s+/g,'').replace(/[\/\.-]/g,'').toLowerCase();
const packingContext={window:{},document:{getElementById:()=>null}};vm.createContext(packingContext);vm.runInContext(fs.readFileSync(root+'/fawz-packing-info.js','utf8'),packingContext);
function add(page,id,name,group={},choice='',product={}){
 if(!id||!name||String(id).includes('${'))return;
 page=aliases[page]||page;
 const pageTitle=manifest.products.find(p=>p.page===page)?.page_title||page.replace('.html','');
 const resolved=packingContext.window.FawzPackingInfo.resolve({page:page==='machine-accessories.html'?'machineAccessories.html':page,id,title:group.title||group.name||name,choice,category:group.category||''});
 let packing=resolved?packingContext.window.FawzPackingInfo.displayText(resolved):product.packSize||product.packInfo||group.packInfo||'';
 if(page==='allPins.html'){
  const html=fs.readFileSync(root+'/'+page,'utf8');
  const m=html.match(/const safetyPinPackingText = (\{[\s\S]*?\n\});/);
  const map=vm.runInNewContext('('+m[1]+')');if(map[id])packing=map[id];
 }
 const entry={product_id:id,name,category:group.category||pageTitle,page,page_title:pageTitle,source:'audited storefront variant',group:group.title||group.name||name,variant:choice,packing};
 const old=records.get(id);records.set(id,{...old,...entry});expected.set(id,entry);
 (stats[page]??=new Set()).add(id);
}
function combos(fields,cb,values={}){
 if(!fields.length){cb(values);return}
 const [[key,options],...tail]=fields;for(const value of options?.length?options:[''])combos(tail,cb,{...values,[key]:value});
}
for(const [raw,{data:d,errors}] of Object.entries(pages)){
 if(aliases[raw])continue;
 if(errors.length)throw Error(raw+': '+errors.join('; '));
 function walk(o,parent={}){
  if(!o||typeof o!=='object')return;
  const meta=(o.title||o.name)&&!o.productId?{...parent,...o}:parent;
  if(o.productId){
   const label=o.name||o.title||parent.title||parent.name;
   const variant=o.name&&label!==(parent.title||parent.name)?o.name:[o.size,o.color,o.option,o.model].filter(Boolean).join(' · ');
   const name=parent.title&&o.name&&!o.name.toLowerCase().includes(parent.title.toLowerCase())?parent.title+' — '+o.name:label;
   add(raw,o.productId,name,parent,variant,o);
  }
  for(const v of Object.values(o))if(v&&typeof v==='object')if(Array.isArray(v))v.forEach(x=>walk(x,meta));else walk(v,meta);
 }
 walk(d);
 if(raw==='buckles.html'){const html=fs.readFileSync(root+'/'+raw,'utf8');for(const m of html.matchAll(/selectOption\(this, '([^']+)', '(gold|silver)'\)/g))add(raw,'fancy-buckle-'+m[2]+'-'+m[1].toLowerCase().replace(/\s+/g,'-'),'Fancy Buckle '+m[2]+' — '+m[1],{title:'Fancy Buckles '+m[2],category:'Buckles'},m[1]);}

 if(raw==='buttons.html')for(const [key,g] of Object.entries(d.buttonCatalog)){
  const emit=v=>{const values=g.type==='flat'?[v.option]:g.structure.map(k=>v[k]);add(raw,(g.productIdBase||'btn-'+key)+'-'+values.map(clean).join('-'),g.title+' — '+values.join(' — '),g,values.join(' | '))};
  if(g.type==='flat')combos([['option',g.options]],emit);
  else{
   function expand(i,v){if(i===g.structure.length)return emit(v);const key=g.structure[i],opts=g.data[key];for(const x of Array.isArray(opts)?opts:opts[v.style])expand(i+1,{...v,[key]:x})}expand(0,{});
  }
 }
 if(raw==='elastics.html')for(const g of Object.values(d.productGroups)){
  const base=g.title.toLowerCase().replace(/\s+/g,'-');
  if(g.type==='single-list')for(const o of g.options)add(raw,o.name.toLowerCase().replace(/\s+/g,'-'),g.title+' — '+o.name,g,o.name);
  else combos([['format',g.formats||['']],['size',g.sizes||g.cords||['']],['color',g.colors]],v=>{
   const parts=[v.format,v.size,v.color].filter(Boolean);add(raw,base+'-'+parts.join('-').toLowerCase(),g.title+' — '+parts.join(' — '),g,parts.join(' | '));
  });
 }
 if(raw==='toggles.html')for(const g of Object.values(d.productGroups))combos([['color',g.colors.map(x=>x.name)],['pack',g.packs]],v=>add(raw,`${g.title}-${v.color}-${v.pack}`.toLowerCase().replace(/[^a-z0-9]/g,'-'),`${g.title} — ${v.color} — Pack of ${v.pack}`,g,`${v.color} | ${v.pack}`));
 if(raw==='tassels.html'||raw==='yarn.html')for(const g of Object.values(d.productGroups))for(const size of g.sizes)for(const c of g.colorsBySize?.[size]||g.colors){const color=c.name;const id=raw==='yarn.html'?`wool-4ply-${size.replace(/[^a-zA-Z0-9]/g,'').toLowerCase()}-${color.replace(/[^a-zA-Z0-9]/g,'').toLowerCase()}`:`tassel-${size.replace(' ','')}-${color}`.toLowerCase();add(raw,id,`${g.title} — ${size} — ${color}`,g,`${size} | ${color}`)}
 if(raw==='sizwLabels.html')for(const g of d.categories)combos([['colour',g.colourOptions||['']],['size',g.sizeOptions]],v=>add(raw,[g.productIdBase,v.colour&&slug(v.colour),slug(v.size)].filter(Boolean).join('-'),g.name+' — '+[v.colour,v.size].filter(Boolean).join(' — '),g,[v.colour,v.size].filter(Boolean).join(' | ')));
 if(raw==='plasticFastners.html')for(const g of [...d.productsBlack,...d.productsColor])combos([['size',g.sizes],['color',g.colors]],v=>add(raw,`${g.name}-${v.size}-${v.color}`.replace(/\s+/g,''),`${g.name} — ${v.size} — ${v.color}`,g,`${v.size} | ${v.color}`));
 if(raw==='satin-ribbons.html')for(const g of d.products)combos([['size',g.sizes],['color',g.colors]],v=>add(raw,slug(`${g.name}-${v.size}-${v.color}`),`${g.name} — ${v.size} — ${v.color}`,g,`${v.size} | ${v.color}`));
 if(raw==='zips.html')for(const cat of d.ZIP_CATEGORIES)for(const g of cat.products)combos([['size',g.sizes],['color',g.colors||['']],['pack',g.packaging||['']]],v=>add(raw,slug([g.id,v.size,v.color,v.pack].filter(Boolean).join('-')),g.name+' — '+[v.size,v.color,v.pack].filter(Boolean).join(' — '),{...g,category:cat.title},[v.size,v.color,v.pack].filter(Boolean).join(' | ')));
 if(['sewingThread.html','sewing-threads.html'].includes(raw))for(const g of d.categories)for(const size of g.sizeOptions||['']){
  const colors=g.colorOptions||(g.productId==='high-tenacity-thread'?(size==='9 Ply'?d.highTenacity9PlyColors:['Black']):d.cottonAndConeCodes);
  for(const color of colors)add(raw,slug([g.productId,size,color].filter(Boolean).join('-')),g.name+' — '+[size,color].filter(Boolean).join(' — '),g,[size,color].filter(Boolean).join(' | '));
 }
 if(raw==='trimmings.html')for(const g of d.categories){
  const types=g.types?Object.entries(g.types):[['',g]];
  for(const [type,t]of types)combos([['size',t.sizes||t.sizeOptions||['']],['color',t.colors||g.patterns||['']]],v=>add(raw,g.productId+(v.size?'-'+v.size.replace(/\s/g,''):'')+(v.color?'-'+v.color:''),g.name+' — '+[type,v.size,v.color].filter(Boolean).join(' — '),g,[type,v.size,v.color].filter(Boolean).join(' | ')));
 }
 if(['rulers.html','bridal.html','knittingAndCrochet.html','suit&dresscovers.html'].includes(raw)){
  const list=d.products||[...(d.knittingProducts||[]),...(d.crochetProducts||[]),...(d.crossStitchProducts||[])];
  for(const g of list)for(const v of g.variants?.length?g.variants:[null]){
   const name=g.name+(v?' — '+v.name:'');const id=raw==='rulers.html'||raw==='bridal.html'?g.name.replace(/\s/g,'')+(v?'-'+v.name.replace(/\s/g,''):''):slug(name);
   add(raw,id,name,g,v?.name||'');
  }
 }
 if(raw==='feathers.html')for(const g of d.products)add(raw,g.id,g.name,g,'');
 if(raw==='sewingNotions.html')for(const [key,list]of Object.entries(d))if(key.endsWith('Products')&&Array.isArray(list))for(const g of list){
  if(g.hasColorSize||g.hasColorMaterial){combos([['color',g.colors],['size',g.hasColorSize?g.sizes:['']],['material',g.hasColorMaterial?g.materials:['']]],v=>{const vals=[v.color,v.size,v.material].filter(Boolean);add(raw,g.id+(vals.length?'-'+vals.join('-'):''),g.name+' — '+vals.join(' — '),g,vals.join(' | '))});}
  else for(const v of g.variants?.length?g.variants:[null])add(raw,g.id+(v?'-'+v.name.replace(/\s/g,''):''),g.name+(v?' — '+v.name:''),g,v?.name||'');
 }
}
// Match literal identifiers too, retaining legacy price keys and image-backed entries.
for(const page of fs.readdirSync(root).filter(n=>n.endsWith('.html'))){if(aliases[page])continue;const html=fs.readFileSync(root+'/'+page,'utf8');for(const m of html.matchAll(/data-product-id=["']([^"']+)["']/g)){if(!records.has(m[1]))add(page,m[1],m[1].replace(/-/g,' '));}}
const products=[...records.values()].filter(p=>!p.product_id.includes('${')).sort((a,b)=>a.page.localeCompare(b.page)||a.name.localeCompare(b.name));
manifest.products=products;manifest.count=products.length;manifest.page_count=new Set(products.map(p=>p.page)).size;manifest.generated_at=new Date().toISOString();
manifest.audit={checked_pages:Object.keys(pages).filter(p=>!aliases[p]).length,expected_product_ids:expected.size,missing_product_ids:[...expected.keys()].filter(id=>!records.has(id)),counts_by_page:Object.fromEntries(Object.entries(stats).map(([p,s])=>[p,s.size]))};
fs.writeFileSync(root+'/product-manifest.json',JSON.stringify(manifest,null,2)+'\n');
fs.writeFileSync(root+'/product-catalog.json',JSON.stringify(products.map(p=>({id:p.product_id,name:p.name,category:p.category,page:p.page,group:p.group||'',variant:p.variant||'',packing:p.packing||''})),null,2)+'\n');
console.log(JSON.stringify({total:products.length,audited:expected.size,pages:manifest.audit.checked_pages,missing:manifest.audit.missing_product_ids},null,2));
