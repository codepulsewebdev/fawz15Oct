(function(){
 'use strict';
 let timer,box,title,detail;
 function create(){
  if(box)return;
  box=document.createElement('aside');box.className='fawz-cart-notice';box.hidden=true;box.setAttribute('role','status');box.setAttribute('aria-live','polite');box.setAttribute('aria-atomic','true');
  const icon=document.createElement('span');icon.className='fawz-cart-notice-icon';icon.textContent='✓';icon.setAttribute('aria-hidden','true');
  const text=document.createElement('div');title=document.createElement('strong');detail=document.createElement('p');text.append(title,detail);
  const link=document.createElement('a');link.href='demo_cart.html';link.textContent='View cart';box.append(icon,text,link);document.body.append(box);
 }
 function show(message,options={}){
  create();clearTimeout(timer);title.textContent=options.title||'Added to cart';
  detail.textContent=String(message||'').replace(/^(?:✓\s*)?(?:success:\s*)?added(?:\s+to\s+cart)?\s*:?\s*/i,'').split(/\n(?:Price|Total):/i)[0].replace(/\s+/g,' ').trim().slice(0,200);
  box.querySelector('a').hidden=Boolean(options.title);box.hidden=false;
  // Repeated additions reuse one small notice and restart its dismissal timer.
  timer=setTimeout(()=>{box.hidden=true},3200);
  try{const cart=JSON.parse(window.FawzCart.getItem('cart')||'[]');document.querySelectorAll('#cartBadge,.cart-badge').forEach(b=>{b.textContent=cart.length;b.classList.toggle('visible',cart.length>0)})}catch{}
 }
 window.FawzCartNotice={show};
})();
