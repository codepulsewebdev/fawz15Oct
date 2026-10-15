(function(){
'use strict';
const excluded=new Set(['','index.html','login.html','admin.html','demo_cart.html','change-password.html','reset-password.html']);
const page=location.pathname.split('/').pop().toLowerCase();if(excluded.has(page))return;
async function init(){
  let manifest;try{const response=await fetch('product-manifest.json');if(!response.ok)return;manifest=await response.json()}catch{return}
  const products=(manifest.products||manifest||[]).map(p=>({id:p.product_id||p.id,name:p.name||p.product_name||p.product_id,category:p.category||p.page_title||'Uncategorised',page:p.page||''}));if(!products.length)return;
  const host=document.createElement('section');host.className='fawz-catalogue-tools';host.setAttribute('aria-label','Catalogue search');host.innerHTML='<div class="fawz-catalogue-controls"><input type="search" aria-label="Search catalogue" placeholder="Search all products, sizes, colours and variants"><select aria-label="Filter catalogue category"><option value="">All categories</option></select></div><div class="fawz-search-results"></div>';
  const input=host.querySelector('input'),select=host.querySelector('select'),results=host.querySelector('.fawz-search-results');[...new Set(products.map(p=>p.category))].sort((a,b)=>a.localeCompare(b)).forEach(category=>select.add(new Option(category,category)));
  function render(){const q=input.value.trim().toLowerCase(),category=select.value;if(!q&&!category){results.classList.remove('open');results.textContent='';return}const matches=products.filter(p=>(!category||p.category===category)&&(!q||`${p.name} ${p.id} ${p.category}`.toLowerCase().includes(q))).slice(0,100);results.textContent='';results.classList.add('open');if(!matches.length){const empty=document.createElement('div');empty.className='fawz-search-empty';empty.textContent='No matching products found.';results.append(empty);return}matches.forEach(product=>{const link=document.createElement('a');link.className='fawz-search-result';link.href=`${product.page}?product=${encodeURIComponent(product.id)}`;const strong=document.createElement('strong'),small=document.createElement('small');strong.textContent=product.name;small.textContent=`${product.category} · ${product.id}`;link.append(strong,small);results.append(link)})}
  input.addEventListener('input',render);select.addEventListener('change',render);const anchor=document.querySelector('header,.header,nav,.navbar');(anchor?.parentNode||document.body).insertBefore(host,anchor?.nextSibling||document.body.firstChild);
  const wanted=new URLSearchParams(location.search).get('product');if(wanted){const target=document.querySelector(`[data-product-id="${CSS.escape(wanted)}"]`);if(target){target.scrollIntoView({behavior:'smooth',block:'center'});setTimeout(()=>target.click(),250)}}
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
})();
