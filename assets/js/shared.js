'use strict';
const Core = window.AVCore, esc = Core.escape;
const PRODUCTS = window.AV_PRODUCTS.map(Core.enrich), CATEGORIES = window.AV_CATEGORIES;
const $ = s => document.querySelector(s), money = n => n.toLocaleString('uk-UA') + ' ₴';
const storage = {
  get(key, fallback) { try { const v=localStorage.getItem(key); return v===null?fallback:JSON.parse(v); } catch { return fallback; } },
  set(key,value) { try {localStorage.setItem(key,JSON.stringify(value));} catch {} }
};
let cart = Core.cleanCart(storage.get('av-cart3',[]),PRODUCTS);
let lastDialogTrigger;
function openDialog(id) { const d=document.getElementById(id); lastDialogTrigger=document.activeElement; if(!d.open)d.showModal(); document.body.classList.add('modal-open'); }
function closeDialog(d) { d.close(); }
function notify(message) { const active=document.querySelector('dialog[open]'); if(active){let status=active.querySelector('.dialog-status');if(!status){status=document.createElement('p');status.className='dialog-status muted';status.setAttribute('role','status');active.append(status);}status.textContent=message;return;} const e=$('#toast'); e.textContent=message; e.classList.add('show'); clearTimeout(notify.timer); notify.timer=setTimeout(()=>e.classList.remove('show'),3500); }
function renderCart() {
  const count=cart.reduce((sum,x)=>sum+x.qty,0), total=cart.reduce((sum,x)=>sum+PRODUCTS.find(p=>p.id===x.id).price*x.qty,0);
  document.querySelectorAll('[data-cart-count]').forEach(e=>e.textContent=count);
  $('#cartTotal').textContent=money(total);
  $('#cartRows').innerHTML=cart.length?cart.map(x=>{const p=PRODUCTS.find(p=>p.id===x.id);return `<div class="cart-row"><a class="cart-product" href="product.html?id=${p.id}"><span class="cart-thumb">${imageMarkup(p)}</span><span class="cart-product-copy"><small>${esc(p.brand)}</small><strong>${esc(p.name)}</strong><span>${money(p.price)} / шт.</span></span></a><div class="quantity"><button data-qty="${p.id}" data-delta="-1" aria-label="Зменшити кількість ${esc(p.name)}" ${x.qty===1?'disabled':''}>−</button><span aria-label="Кількість">${x.qty}</span><button data-qty="${p.id}" data-delta="1" aria-label="Збільшити кількість ${esc(p.name)}" ${x.qty===99?'disabled':''}>+</button></div><b>${money(p.price*x.qty)}</b><button class="text-button" data-remove="${p.id}" aria-label="Видалити ${esc(p.name)}">Видалити</button></div>`}).join(''):'<div class="empty"><h3>Кошик поки порожній</h3><p>Додайте потрібні товари з каталогу.</p><button class="primary" data-close>Продовжити покупки</button></div>';
  $('#checkoutOpen').disabled=!cart.length;
}
function saveCart() { storage.set('av-cart3',cart); renderCart(); }
function addToCart(id) { if(!PRODUCTS.some(p=>p.id===id))return; const row=cart.find(x=>x.id===id); if(row){if(row.qty>=99)return notify('Максимум 99 одиниць у чернетці');row.qty++;}else cart.push({id,qty:1}); saveCart(); notify('Товар додано до кошика'); }
function imageMarkup(p) { return p.image ? `<img src="${esc(p.image)}" alt="${esc(p.brand+' '+p.name)}" loading="lazy" width="320" height="240">` : `${icon(p.type)}<span class="image-caption">Ілюстрація категорії</span>`; }
function productMarkup(p, returnQuery='') {
  const href=`product.html?id=${p.id}${returnQuery?'&return='+encodeURIComponent(returnQuery):''}`;
  return `<article class="product"><a class="product-visual" href="${esc(href)}" aria-label="Переглянути ${esc(p.name)}">${imageMarkup(p)}</a><div class="product-info"><span class="brandname">${esc(p.brand)}</span><h3><a href="${esc(href)}">${esc(p.name)}</a></h3><span class="sku">Арт. ${esc(p.sku)}</span><p class="product-spec">${[p.parameter,p.volume,p.capacity].filter(Boolean).map(esc).join(' · ')}</p><span class="availability">Наявність уточнюється</span></div><div class="product-purchase"><strong>${money(p.price)}</strong><small>демо-ціна</small><button class="primary" data-add="${p.id}" aria-label="Додати ${esc(p.name)} у кошик">У кошик <span aria-hidden="true">+</span></button></div></article>`;
}
function theme(value) {
  const next=value==='light'?'light':'dark'; document.documentElement.dataset.theme=next;
  try{localStorage.setItem('av-theme',next);}catch{}
  document.querySelectorAll('[data-theme-toggle]').forEach(b=>{b.innerHTML=uiIcon(next==='light'?'moon':'sun');b.setAttribute('aria-label',next==='light'?'Увімкнути темну тему':'Увімкнути світлу тему');});
}
let initialTheme='dark';try{initialTheme=localStorage.getItem('av-theme')||'dark';}catch{}theme(initialTheme);
const MODELS = {
 'Land Rover':['Range Rover','Range Rover Sport','Range Rover Velar','Range Rover Evoque','Discovery','Discovery Sport','Defender','Freelander'],
 'Jaguar':['XE','XF','XJ','F-PACE','E-PACE','I-PACE','F-TYPE'],
 'BMW':['1 Series','3 Series','5 Series','7 Series','X1','X3','X5','X6'],
 'Mercedes-Benz':['A-Class','C-Class','E-Class','S-Class','GLA','GLC','GLE','G-Class'],
 'Volkswagen':['Golf','Passat','Polo','Tiguan','Touareg','Transporter'],
 'Audi':['A3','A4','A6','Q3','Q5','Q7'],
 'Toyota':['Corolla','Camry','RAV4','Land Cruiser','Yaris','Prius'],
 'Lexus':['ES','IS','LS','NX','RX','GX','LX'],
 'Skoda':['Fabia','Octavia','Superb','Karoq','Kodiaq'],
 'Ford':['Fiesta','Focus','Mondeo','Kuga','Transit'],
 'Renault':['Clio','Megane','Scenic','Duster','Kangoo'],
 'Nissan':['Micra','Qashqai','X-Trail','Juke','Leaf'],
 'Hyundai':['i30','Elantra','Sonata','Tucson','Santa Fe'],
 'Kia':['Ceed','Sportage','Sorento','Rio'],
 'Peugeot':['208','308','3008','5008','Partner'],
 'Opel':['Astra','Corsa','Insignia','Zafira']
};
function renderModels(value='') {
  const options=MODELS[$('#make').value]||[];
  $('#model').innerHTML='<option value="">Оберіть модель</option>'+options.map(x=>`<option>${esc(x)}</option>`).join('')+'<option value="other">Інша модель</option>';
  $('#model').disabled=!$('#make').value;
  $('#model').value=options.includes(value)?value:value?'other':'';
  $('#otherModelField').hidden=$('#model').value!=='other';
  $('#otherModel').required=$('#model').value==='other';
  $('#otherModel').value=options.includes(value)?'':value;
}
function vehicle() { const c=storage.get('av-car',null); return c&&typeof c==='object'?c:null; }
function renderVehicle() {
  const c=vehicle();
  document.querySelectorAll('[data-car-summary]').forEach(e=>e.textContent=c?`${c.make} ${c.model} · ${c.year}`:'Додати авто для запиту на підбір');
  $('#removeCar').hidden=!c;
}
function fillVehicle() {
  const c=vehicle();$('#make').value=c?.make||'';renderModels(c?.model||'');$('#year').value=c?.year||'';$('#engine').value=c?.engine||'';$('#vin').value='';$('#vehicleError').textContent='';
}
$('#make').innerHTML='<option value="">Оберіть марку</option>'+Object.keys(MODELS).map(x=>`<option>${esc(x)}</option>`).join('');
$('#year').innerHTML='<option value="">Рік випуску</option>'+Array.from({length:new Date().getFullYear()-1979},(_,i)=>new Date().getFullYear()-i).map(y=>`<option>${y}</option>`).join('');
$('#make').onchange=()=>renderModels();
$('#model').onchange=()=>{ $('#otherModelField').hidden=$('#model').value!=='other';$('#otherModel').required=$('#model').value==='other'; };
$('#vehicleForm').onsubmit=e=>{
 e.preventDefault();const vin=$('#vin').value.trim().toUpperCase();
 if(vin&&!Core.validVin(vin)){ $('#vehicleError').textContent='VIN має містити 17 латинських літер і цифр, без I, O та Q.';$('#vin').focus();return;}
 const c={make:$('#make').value,model:$('#model').value==='other'?$('#otherModel').value.trim():$('#model').value,year:$('#year').value,engine:$('#engine').value.trim()};
 if(!c.model)return;
 storage.set('av-car',c);renderVehicle();closeDialog($('#vehicleDialog'));notify('Авто збережено для підготовки заявки. Сумісність ще не підтверджена.');
};
$('#removeCar').onclick=()=>{storage.set('av-car',null);fillVehicle();renderVehicle();notify('Авто видалено');};
function contactsMarkup() {
 const c=window.AV_CONFIG;
 const links=[['Telegram',c.telegram,/^https:\/\/t\.me\//],['Viber',c.viber,/^viber:\/\/chat\?number=/],['WhatsApp',c.whatsapp,/^https:\/\/wa\.me\//]].filter(([,url,re])=>typeof url==='string'&&re.test(url));
 if(c.phone && /^\+?[\d\s()-]+$/.test(c.phone)) links.push(['Зателефонувати','tel:'+c.phone.replace(/[^\d+]/g,'')]);
 document.querySelectorAll('[data-contact-links]').forEach(e=>e.innerHTML=links.length?links.map(([name,url])=>`<a class="secondary" href="${esc(url)}">${name}</a>`).join(''):'<p class="muted">Контакти продавця ще не додані. Збережіть список товарів у кошику — його можна скопіювати.</p>');
 document.querySelectorAll('[data-hours]').forEach(e=>e.textContent=c.hours||'Графік роботи уточнюється');
}
let requestOnly=false, returnToCheckout=false;
function renderOrderVehicle(){const c=vehicle();$('#orderVehicleSummary').textContent=c?`${c.make} ${c.model} · ${c.year}${c.engine?' · '+c.engine:''}`:'Авто не додано. Якщо потрібна перевірка сумісності, вкажіть його або VIN нижче.';}
function invalidateDraft(){ $('#orderPreview').hidden=true;$('#requestText').value=''; }
$('#checkoutForm').addEventListener('input',invalidateDraft);
$('#checkoutForm').addEventListener('change',invalidateDraft);
$('#editOrderVehicle').onclick=()=>{returnToCheckout=true;closeDialog($('#checkoutDialog'));fillVehicle();openDialog('vehicleDialog');};
$('#vehicleDialog').addEventListener('close',()=>{if(returnToCheckout){returnToCheckout=false;renderOrderVehicle();invalidateDraft();openDialog('checkoutDialog');$('#editOrderVehicle').focus();}});
$('#downloadRequest').onclick=()=>{if($('#orderPreview').hidden||!$('#requestText').value)return;const url=URL.createObjectURL(new Blob(['\ufeff'+$('#requestText').value],{type:'text/plain;charset=utf-8'}));const a=document.createElement('a');a.href=url;a.download='AV-Motors-request.txt';document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),1000);notify('Чернетку збережено у файл. Заявка ще не відправлена.');};
function openCheckout(allowEmpty=false) {
 renderOrderVehicle();requestOnly=allowEmpty; if(!cart.length&&!requestOnly)return;closeDialog($('#cartDialog'));$('#orderPreview').hidden=true;$('#checkoutError').textContent='';$('#orderLines').innerHTML=cart.map(x=>{const p=PRODUCTS.find(p=>p.id===x.id);return `<div class="row"><span>${esc(p.name)} × ${x.qty}</span><b>${money(p.price*x.qty)}</b></div>`;}).join('');
 $('#orderTotal').textContent=money(cart.reduce((s,x)=>s+PRODUCTS.find(p=>p.id===x.id).price*x.qty,0));openDialog('checkoutDialog');
}
$('#delivery').onchange=()=>{const ship=$('#delivery').value==='post';$('#shippingFields').hidden=!ship;$('#city').required=ship;$('#branch').required=ship;};
$('#checkoutForm').onsubmit=e=>{
 e.preventDefault();const phone=$('#phone').value.replace(/[^\d]/g,'');
 if(!/^(?:380\d{9}|0\d{9})$/.test(phone)){ $('#checkoutError').textContent='Введіть український номер: +380 та 9 цифр або 0 та 9 цифр.';$('#phone').focus();return;}
 if(!cart.length&&!$('#orderComment').value.trim()){$('#checkoutError').textContent='Опишіть, яку деталь потрібно знайти.';$('#orderComment').focus();return;}
 const c=vehicle(), vin=$('#orderVin').value.trim().toUpperCase();
 if(vin&&!Core.validVin(vin)){ $('#checkoutError').textContent='Перевірте формат VIN: 17 символів без I, O, Q.';$('#orderVin').focus();return;}
 const lines=['ЗАПИТ AV MOTORS — НЕ ПІДТВЕРДЖЕНЕ ЗАМОВЛЕННЯ',...cart.map(x=>{const p=PRODUCTS.find(p=>p.id===x.id);return `${p.brand} ${p.name} | Арт. ${p.sku} | ${x.qty} шт. | ${money(p.price*x.qty)} (демо)`;}),`Орієнтовна сума: ${$('#orderTotal').textContent} (демо, без доставки)`,`Ім’я: ${$('#customerName').value.trim()}`,`Телефон: ${$('#phone').value.trim()}`,`Отримання: ${$('#delivery').value==='post'?'Нова пошта, '+$('#city').value.trim()+', '+$('#branch').value.trim():'Самовивіз, Одеса, вул. Одарія'}`,c?`Авто: ${c.make} ${c.model} ${c.year} ${c.engine||''}`:'',vin?`VIN: ${vin}`:'',$('#orderComment').value.trim(), 'Прошу підтвердити ціну, наявність, сумісність, оплату та строк доставки.'].filter(Boolean);
 $('#requestText').value=lines.join('\n');$('#checkoutError').textContent='';$('#orderPreview').hidden=false;$('#requestText').focus();
};
$('#copyRequest').onclick=async()=>{try{await navigator.clipboard.writeText($('#requestText').value);notify('Текст скопійовано. Заявка ще не відправлена.');}catch{$('#requestText').focus();$('#requestText').select();notify('Виділіть та скопіюйте текст вручну.');}};
document.addEventListener('click',e=>{
 const b=e.target.closest('button,a');if(!b)return;
 if(b.matches('[data-theme-toggle]'))theme(document.documentElement.dataset.theme==='dark'?'light':'dark');
 if(b.matches('[data-add]'))addToCart(Number(b.dataset.add));
 if(b.matches('[data-open-cart]')){renderCart();openDialog('cartDialog');}
 if(b.matches('[data-open-request]'))openCheckout(true);
 if(b.matches('[data-open-car]')){fillVehicle();openDialog('vehicleDialog');}
 if(b.matches('[data-close]'))closeDialog(b.closest('dialog'));
 if(b.matches('[data-qty]')){const row=cart.find(x=>x.id===Number(b.dataset.qty));if(row)row.qty=Math.min(99,Math.max(1,row.qty+Number(b.dataset.delta)));saveCart();}
 if(b.matches('[data-remove]')){cart=cart.filter(x=>x.id!==Number(b.dataset.remove));saveCart();}
});
document.querySelectorAll('dialog').forEach(d=>{
 d.addEventListener('click',e=>{if(e.target===d){const r=d.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)d.close();}});
 d.addEventListener('close',()=>{if(!document.querySelector('dialog[open]')){document.body.classList.remove('modal-open');lastDialogTrigger?.focus();}});
});
$('#checkoutOpen').onclick=()=>openCheckout(false);
window.addEventListener('storage',e=>{if(e.key==='av-cart3'){cart=Core.cleanCart(storage.get('av-cart3',[]),PRODUCTS);renderCart();}});
renderCart();renderVehicle();contactsMarkup();

document.querySelectorAll('[data-ui-icon]').forEach(el=>el.innerHTML=uiIcon(el.dataset.uiIcon));
