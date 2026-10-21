(function(){
'use strict';
const activeKey='fawz_active_account';
let owner=null;
// The old shared cart has no trustworthy owner. Never assign it to an account.
localStorage.removeItem('cart');
function allowed(){return owner&&localStorage.getItem(activeKey)===owner}
function key(){return 'fawz_cart:'+encodeURIComponent(owner)}
function refresh(){
 let cart=[];try{cart=JSON.parse(API.getItem('cart')||'[]')}catch{}
 document.querySelectorAll('#cartBadge,.cart-badge').forEach(b=>{b.textContent=Array.isArray(cart)?cart.length:0;b.classList.toggle('visible',Array.isArray(cart)&&cart.length>0)});
 if(typeof window.loadCartTable==='function')window.loadCartTable();
}
const API=window.FawzCart={
 getOwner:()=>allowed()?owner:null,
 getItem:()=>allowed()?localStorage.getItem(key()):null,
 setItem:(_name,value)=>{if(!allowed())throw new Error('Your account session changed. Please reload and sign in again.');localStorage.setItem(key(),value)},
 removeItem:()=>{if(allowed())localStorage.removeItem(key())},
 activate(user){owner=user?.id?String(user.id):null;localStorage.removeItem('cart');if(owner)localStorage.setItem(activeKey,owner);else localStorage.removeItem(activeKey);refresh()},
 deactivate(){owner=null;localStorage.removeItem('cart');localStorage.removeItem(activeKey);refresh()}
};
window.addEventListener('storage',event=>{
 if(event.key===activeKey&&owner&&event.newValue!==owner){owner=null;refresh();window.location.replace('login.html');}
 else if(allowed()&&event.key===key())refresh();
});
window.addEventListener('pageshow',event=>{if(event.persisted)window.location.reload()});
})();
