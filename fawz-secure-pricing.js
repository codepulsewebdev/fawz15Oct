(function(){
'use strict';
let currentId='',currentPrice=null,cache=new Map(),loading=new Map();

function addUniformStyle(){
  if(document.getElementById('fawz-secure-price-style'))return;
  const style=document.createElement('style');style.id='fawz-secure-price-style';
  style.textContent='.fawz-secure-price{display:block!important;width:100%;box-sizing:border-box;margin:12px 0 18px;padding:14px 16px;border:1px solid #efc5c8;border-radius:12px;background:#fff5f5;color:#b50914;font:800 22px/1.2 Arial,sans-serif;text-align:left}.fawz-secure-price[hidden],.fawz-secure-price[aria-hidden="true"]{display:none!important}.fawz-secure-price[data-state="loading"]{color:#666;background:#f7f7f7;border-color:#ddd}';
  document.head.appendChild(style);
}
function modalHost(){
  const modal=document.querySelector('#productModal');
  return modal?.querySelector('.modal-right,.modal-details,.product-details,.modal-content')||null;
}
function ensurePriceElement(){
  addUniformStyle();
  let element=document.querySelector('#productModal [data-current-price],#productModal .firebase-price,#productModal .modal-price,#productModal #price');
  if(!element){
    const host=modalHost();if(!host)return null;
    element=document.createElement('div');element.className='firebase-price fawz-secure-price';element.dataset.currentPrice='';element.setAttribute('aria-live','polite');
  }
  const host=modalHost(),qty=host?.querySelector('#qty,input[name="quantity"],.qty-input');
  let anchor=qty;if(qty?.previousElementSibling?.tagName==='LABEL')anchor=qty.previousElementSibling;
  if(host&&element.parentElement===host&&anchor!==element)host.insertBefore(element,anchor||host.querySelector('.btn-add,[onclick*="addToCart"]')||null);
  element.classList.add('fawz-secure-price');element.hidden=false;element.removeAttribute('aria-hidden');
  return element;
}
function priceElements(){const element=ensurePriceElement();return element?[element]:[]}
function show(price){
  currentPrice=price;
  window.fawzCurrentUnitPrice=price;
  priceElements().forEach(element=>{
    element.dataset.state=price==null?'unavailable':'ready';
    element.hidden=price==null;
    element.setAttribute('aria-hidden',String(price==null));
    element.textContent=price==null?'':`R ${Number(price).toFixed(2)}`;
  });
}
function validId(value){value=String(value||'').trim();return /^[A-Za-z0-9._-]{1,180}$/.test(value)?value:''}
function domId(){
  const explicit=document.querySelector('#modalProductId,[data-current-product-id]');
  if(explicit){const value=explicit.dataset.currentProductId||explicit.textContent;const clean=validId(value);if(clean)return clean}
  const active=document.querySelector('.product-card.active[data-product-id],[data-product-id][aria-selected="true"],select option:checked[data-product-id]');
  return validId(active?.dataset?.productId);
}
async function fetchPrice(id){
  id=validId(id);if(!id)return null;
  if(cache.has(id))return cache.get(id);
  if(loading.has(id))return loading.get(id);
  const task=window.FawzSite.pricing.getPrice(id).then(price=>{cache.set(id,price);return price}).finally(()=>loading.delete(id));
  loading.set(id,task);return task;
}
async function selectProduct(id){
  id=validId(id);if(!id)return;
  ensurePriceElement();
  if(id===currentId&&currentPrice!==null){show(currentPrice);return}
  currentId=id;window.fawzCurrentProductId=id;
  const element=ensurePriceElement();if(element){element.hidden=true;element.dataset.state='loading';element.textContent=''}
  try{const price=await fetchPrice(id);if(currentId===id)show(price)}catch{if(currentId===id)show(null)}
}
window.fawzSelectSecureProduct=selectProduct;
window.fawzShowPriceFor=selectProduct;
try{
  let selectedId=validId(window.fawzCurrentProductId);
  Object.defineProperty(window,'fawzCurrentProductId',{configurable:true,get:()=>selectedId,set:value=>{
    selectedId=validId(value);
    if(selectedId&&selectedId!==currentId)queueMicrotask(()=>selectProduct(selectedId));
  }});
  if(selectedId)queueMicrotask(()=>selectProduct(selectedId));
}catch{}
window.getFirebasePrice=function(id){
  id=validId(id);
  if(id){selectProduct(id);if(cache.has(id))return cache.get(id)}
  return 0;
};
async function refresh(){
  const id=validId(window.fawzCurrentProductId)||domId();
  if(id)await selectProduct(id);
}
function patchLatestCart(){
  let cart;try{cart=JSON.parse(localStorage.getItem('cart')||'[]')}catch{return}
  if(!Array.isArray(cart)||!cart.length)return;
  const item=cart[cart.length-1],id=validId(item.productId||currentId);
  if(!id)return;
  selectProduct(id).then(()=>{if(currentPrice==null)return;item.productId=id;item.price=currentPrice;item.unitPrice=currentPrice;item.unit_price=currentPrice;const qty=Number(item.qty||item.quantity||1);item.total=currentPrice*(Number.isFinite(qty)&&qty>0?qty:1);localStorage.setItem('cart',JSON.stringify(cart))});
}
addEventListener('fawz:site-ready',event=>{
  if(!event.detail.authenticated)return;
  addUniformStyle();
  const element=ensurePriceElement();
  if(element&&!currentId){element.hidden=true;element.dataset.state='loading';element.textContent=''}
  setInterval(refresh,300);
  document.addEventListener('change',()=>setTimeout(refresh,0),true);
  document.addEventListener('click',event=>{
    const button=event.target.closest('.btn-add,[onclick*="addToCart"]');
    if(!button){setTimeout(refresh,0);return}
    setTimeout(patchLatestCart,0);
  },true);
});
})();
