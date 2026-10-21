import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import {orderDetails} from '../netlify/functions/_order-details.mjs';
import {INTERNAL_STAFF,provisionStaff} from '../netlify/functions/_staff.mjs';
const read=n=>fs.readFileSync(new URL('../'+n,import.meta.url),'utf8');
const clean=(x,max)=>String(x??'').replace(/[<>]/g,'').trim().slice(0,max);
const staff={id:'rep-1',displayName:'Ismail',email:'staff@example.test',role:'staff'};
test('orders keep the correct customer and authenticated staff identity',()=>{
 const a=orderDetails(staff,{customer:{name:'Customer A',address:'Address A',phone:'0111234567'},submittedBy:{name:'Forged'}},clean),b=orderDetails(staff,{customer:{name:'Customer B',address:'Address B',phone:'0821234567'}},clean);
 assert.equal(a.customerName,'Customer A');assert.equal(b.customerName,'Customer B');assert.deepEqual(a.submittedBy,b.submittedBy);assert.equal(a.submittedBy.id,'rep-1');assert.equal(a.submittedBy.name,'Ismail');
 assert.throws(()=>orderDetails(staff,{customer:{name:'Missing phone'}},clean),/customer name/);
 assert.throws(()=>orderDetails(staff,{customer:{name:'A',address:'B',phone:'C',email:'bad'}},clean),/email/);
 assert.equal(orderDetails({...staff,role:'approved_user',address:'Saved address',phone:'Saved phone'},{customer:{name:'Forged'}},clean).customerName,'Ismail');
});
test('seven accounts are provisioned and retries preserve passwords and admins',async()=>{
 const users=new Map(),profiles=new Map(),passwords=new Set();let creations=0,updates=0;
 const auth={async getUserByEmail(email){if(!users.has(email))throw Object.assign(Error(),{code:'auth/user-not-found'});return users.get(email)},async createUser(data){passwords.add(data.password);const user={uid:'u'+(++creations),...data};users.set(data.email,user);return user},async updateUser(){updates++}};
 const db={collection(){
  return {doc(id){
   return {async get(){return {data:()=>profiles.get(id)}},async set(data){profiles.set(id,{...profiles.get(id),...data})}};
  }};
 }};

 const args={auth,db,FieldValue:{serverTimestamp:()=>1},createdBy:'admin'};await provisionStaff(args);assert.equal(creations,7);assert.equal(passwords.size,1);assert.ok([...passwords][0].length>=8);assert.deepEqual([...users.keys()],INTERNAL_STAFF.map(s=>s.email));for(const p of profiles.values()){assert.equal(p.role,'staff');assert.equal(p.approved,true)}
 profiles.get('u1').role='admin';await provisionStaff(args);assert.equal(creations,7);assert.equal(updates,0);assert.equal(profiles.get('u1').role,'admin');
});
class Node{
 constructor(){this.value='';this.children=[];this.style={};this.dataset={};this.hidden=false;this.classList={toggle(){},add(){}};this.listeners={};this.elements={namedItem:n=>this[n]};for(const n of ['role','address','phone','password'])this[n]={value:n==='role'?'approved_user':''}}
 set textContent(v){this.text=String(v);this.children=[]}get textContent(){return this.text||''}
 append(...xs){this.children.push(...xs)}replaceChildren(...xs){this.children=xs}addEventListener(n,fn){this.listeners[n]=fn}setAttribute(){}focus(){}reportValidity(){return true}querySelector(){return this.children.find(n=>n.tag==='a')||new Node()}querySelectorAll(){return []}
}
test('all catalogue entries can be reached in admin, searched and selected',async()=>{
 const manifest=JSON.parse(read('product-manifest.json')),elements={},at=id=>elements[id]??=new Node();
 const c={document:{getElementById:at,querySelectorAll:()=>[],querySelector:()=>null,createElement:tag=>Object.assign(new Node(),{tag}),createTextNode:s=>s},history:{replaceState(){}},location:{hash:'#products'},sessionStorage:{getItem:()=>''},Option:function(label,value){this.label=label;this.value=value},fetch:async url=>({ok:true,json:async()=>url.includes('manifest')?manifest:{users:[],orders:[],prices:{},settings:{}}}),setTimeout,console};vm.createContext(c);vm.runInContext(read('admin.js'),c);await new Promise(resolve=>setImmediate(resolve));
 const found=new Set();while(true){for(const row of at('productList').children){const detail=row.children[1]?.textContent;if(detail)found.add(detail.split(' · ').at(-1))}if(at('nextProducts').disabled)break;at('nextProducts').onclick()}
 assert.equal(found.size,manifest.products.length);for(const p of manifest.products)assert.ok(found.has(p.product_id),p.product_id);
 at('productSearch').value='glass-crystal-48mm-box';at('productSearch').listeners.input();assert.equal(at('productList').children.length,1);at('productList').children[0].onclick();assert.ok(at('priceEditor').children.some(n=>n.className==='product-facts'));
 at('productSearch').value='no-such-product-987';at('productSearch').listeners.input();assert.match(at('productList').children[0].textContent,/No products match/);
});
test('checkout clears customer details after success and retains them on failure',async()=>{
 const script=[...read('demo_cart.html').matchAll(/<script\b[^>]*>([\s\S]*?)<\/script>/g)].find(m=>m[1].includes('function loadCartTable'))[1];
 const nodes={},get=id=>nodes[id]??=new Node(),events={},cart=[{product:'Pins',productId:'pins',qty:2}],calls=[];let store={cart:JSON.stringify(cart)},fail=false;
 const c={document:{getElementById:get,createElement:()=>new Node(),addEventListener:(n,fn)=>events[n]=fn},addEventListener:(n,fn)=>events[n]=fn,localStorage:{getItem:k=>store[k]||null,setItem:(k,v)=>store[k]=v,removeItem:k=>delete store[k]},window:{FawzSite:{auth:{getCustomer:()=>staff},orders:{submit:async(items,details)=>{calls.push({items,details});if(fail)throw Error('Please retry');return{orderNumber:'FAWZ-TEST'}}}}},setTimeout,alert(){}};c.window.FawzCartNotice={show(){}};vm.createContext(c);vm.runInContext(script,c);
 events['fawz:site-ready']({detail:{authenticated:true,user:staff}});assert.equal(get('custName').readOnly,false);assert.equal(get('custName').value,'');assert.equal(get('repName').value,'Ismail');await vm.runInContext('submitOrder()',c);assert.equal(calls.length,0);
 for(const[id,value]of Object.entries({custName:'Customer A',custAddr1:'Address A',custTel:'0111234567'}))get(id).value=value;
 await vm.runInContext('submitOrder()',c);assert.equal(calls[0].details.customer.name,'Customer A');assert.equal(get('custName').value,'');assert.equal(store.cart,undefined);
 store.cart=JSON.stringify(cart);fail=true;for(const[id,value]of Object.entries({custName:'Customer B',custAddr1:'Address B',custTel:'0821234567'}))get(id).value=value;
 await vm.runInContext('submitOrder()',c);assert.equal(get('custName').value,'Customer B');assert.ok(store.cart);assert.match(get('orderStatus').textContent,/retry/);
});
test('cart notice reuses one small block and dismisses automatically',()=>{
 const body=new Node(),timers=new Map();let id=0;const c={document:{body,createElement:tag=>Object.assign(new Node(),{tag}),querySelectorAll:()=>[]},window:{},localStorage:{getItem:()=> '[]'},setTimeout:fn=>{timers.set(++id,fn);return id},clearTimeout:n=>timers.delete(n)};vm.createContext(c);vm.runInContext(read('fawz-cart-notice.js'),c);c.window.FawzCartNotice.show('Added to cart: Pins');assert.equal(body.children.length,1);assert.equal(body.children[0].hidden,false);c.window.FawzCartNotice.show('Added to cart: Rulers');assert.equal(body.children.length,1);assert.equal(timers.size,1);[...timers.values()][0]();assert.equal(body.children[0].hidden,true);
});
