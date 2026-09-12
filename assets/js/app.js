'use strict';
let state=Core.stateFrom(location.search), view=storage.get('av-view-v2','grid');
if(!['grid','list'].includes(view))view='grid';
const fieldNames={type:'Тип товару',brand:'Виробник',parameter:'Параметр',volume:'Об’єм',capacity:'Ємність',approval:'Допуск автовиробника',standard:'Стандарт API / ACEA',diameter:'Діаметр'};
function syncURL(){const q=Core.query(state);history.replaceState(null,'',location.pathname+(q?'?'+q:'')+location.hash);}
function field(label,key,values) {
 if(!values.length&&state[key]==='all')return '';
 const selected=key==='brand'?state[key].split('|'):[state[key]];
 for(const v of selected)if(v!=='all'&&!values.includes(v))values=[v,...values];
 const count=v=>Core.filter(PRODUCTS,key==='type'?{...Core.defaults,cat:state.cat,type:v,q:state.q}:{...state,[key]:v}).length;
 if(key==='brand')return `<fieldset class="brand-facet"><legend>${esc(label)}</legend><div class="brand-options">${values.map(v=>`<label class="check-option"><input type="checkbox" data-brand="${esc(v)}" ${selected.includes(v)?'checked':''} ${!count(v)&&!selected.includes(v)?'disabled':''}><span>${esc(v)}</span><small>${count(v)}</small></label>`).join('')}</div></fieldset>`;
 return `<label class="field">${esc(label)}<select data-field="${key}" aria-label="${esc(label)}"><option value="all">Усі</option>${values.map(v=>`<option value="${esc(v)}" ${state[key]===v?'selected':''} ${!count(v)&&state[key]!==v?'disabled':''}>${esc(v)} (${count(v)})</option>`).join('')}</select></label>`;
}
function renderFilters() {
 const type=state.type;
 const parameterNames={'Олива':'В’язкість SAE','Фільтр':'Вид фільтра','АКБ':'Технологія','Лампа':'Цоколь','Рідина':'Специфікація','Свічка':'Тип електрода','Хімія':'Призначення','Догляд':'Призначення'};
 const keys=['type','brand'];if(type!=='all')keys.push('parameter','volume','capacity','approval','standard','diameter');
 $('#facets').innerHTML=keys.map(k=>field(k==='parameter'?(parameterNames[type]||'Різновид'):fieldNames[k],k,Core.options(PRODUCTS,{...Core.defaults,cat:state.cat,type:k==='type'?'all':state.type},k))).join('');
 $('#facets').querySelectorAll('select').forEach(el=>el.onchange=()=>{
 const k=el.dataset.field;state[k]=el.value;
 if(k==='type'){state.brand=state.parameter=state.volume=state.capacity=state.approval=state.standard=state.diameter='all';}
 state.limit=12;render();$('#facets').querySelector(`[data-field="${k}"]`)?.focus();
 });
 $('#facets').querySelectorAll('[data-brand]').forEach(el=>el.onchange=()=>{const values=[...$('#facets').querySelectorAll('[data-brand]:checked')].map(x=>x.dataset.brand);state.brand=values.join('|')||'all';state.limit=12;render();$('#facets').querySelectorAll('[data-brand]').forEach(x=>{if(x.dataset.brand===el.dataset.brand)x.focus();});});
 $('#minPrice').value=state.min;$('#maxPrice').value=state.max;
 $('#filterNote').textContent=type==='Олива'?'Допуск виробника авто перевіряють окремо: однакова в’язкість не підтверджує сумісність.':type==='all'?'Оберіть тип товару, щоб побачити його спеціальні параметри.':'Показані лише параметри з демонстраційного каталогу. Точні характеристики потрібно підтвердити.';
}
function renderCategories(){
 $('#cats').innerHTML=CATEGORIES.map(c=>`<button class="category ${state.cat===c.id?'selected':''}" data-category="${c.id}" aria-pressed="${state.cat===c.id}"><span class="cat-icon">${categoryIcon(c.id)}</span><span><b>${c.id==='all'?'Усі товари':esc(c.name)}</b><small>${c.id==='all'?'Повний каталог':esc(c.desc)}</small></span></button>`).join('');
}
function renderSelected(){
 const items=[];
 if(state.q)items.push(['q','Пошук: '+state.q]);
 if(state.cat!=='all')items.push(['cat',CATEGORIES.find(c=>c.id===state.cat)?.name||state.cat]);
 for(const k of ['type','brand','parameter','volume','capacity','approval','standard','diameter'])if(state[k]!=='all')items.push([k,state[k].replaceAll('|',', ')]);
 if(state.min!==''||state.max!=='')items.push(['price',`Ціна: ${state.min||'0'}–${state.max||'∞'} ₴`]);
 $('#selectedFilters').innerHTML=items.map(([key,label])=>`<button class="chip" data-reset="${key}" aria-label="Прибрати ${esc(label)}">${esc(label)} <span aria-hidden="true">×</span></button>`).join('');
 $('#resetAll').hidden=!items.length;
 $('#filterCount').textContent=items.length?` (${items.length})`:'';
}
function render(){
 const result=Core.filter(PRODUCTS,state);
 $('#products').className='products '+view;
 $('#products').innerHTML=result.length?result.slice(0,state.limit).map(p=>productMarkup(p,Core.query(state))).join(''):`<div class="empty"><h3>За цими умовами товарів немає</h3><p>Спробуйте прибрати один фільтр або перевірте артикул. Відсутність у демо-каталозі не означає, що товар неможливо замовити.</p><button class="primary" data-reset="all">Скинути фільтри й пошук</button><button class="secondary" data-open-request>Підготувати запит на деталь</button></div>`;
 $('#showFilterResults').textContent=`Показати товари (${result.length})`;
 $('#resultInfo').textContent=`${result.length} товарів · демо-каталог`;
 $('#catalogTitle').textContent=state.q?'Результати пошуку':state.cat==='all'?'Каталог товарів':CATEGORIES.find(c=>c.id===state.cat)?.name||'Каталог';
 $('#q').value=state.q;$('#sort').value=state.sort;
 $('#loadMore').hidden=state.limit>=result.length;
 $('#loadMore').textContent=`Показати ще ${Math.min(12,Math.max(0,result.length-state.limit))}`;
 $('#shownCount').textContent=result.length?`Показано ${Math.min(state.limit,result.length)} з ${result.length}`:'';
 document.querySelectorAll('[data-view]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.view===view)));
 renderCategories();renderFilters();renderSelected();syncURL();
}
function reset(key){
 if(key==='all'){state={...Core.defaults};}
 else if(key==='cat'){state.cat=state.type=state.brand=state.parameter=state.volume=state.capacity=state.approval=state.standard=state.diameter='all';}
 else if(key==='type'){state.type=state.parameter=state.volume=state.capacity=state.approval=state.standard=state.diameter='all';}
 else if(key==='price'){state.min=state.max='';}
 else state[key]=Core.defaults[key];
 state.limit=12;render();
}
document.addEventListener('click',e=>{
 const b=e.target.closest('button,a');if(!b)return;
 if(b.matches('[data-category]')){e.preventDefault();state.cat=b.dataset.category;state.type=state.brand=state.parameter=state.volume=state.capacity=state.approval=state.standard=state.diameter='all';state.limit=12;render();}
 if(b.matches('[data-reset]'))reset(b.dataset.reset);
 if(b.matches('[data-view]')){view=b.dataset.view;storage.set('av-view-v2',view);render();}
});
$('#search').onsubmit=e=>{e.preventDefault();state.q=$('#q').value.trim();state.limit=12;render();$('#catalog').scrollIntoView({behavior:'smooth'});};
$('#sort').onchange=e=>{state.sort=e.target.value;render();};
$('#priceForm').onsubmit=e=>{e.preventDefault();const min=$('#minPrice').value,max=$('#maxPrice').value;if(min!==''&&max!==''&&Number(min)>Number(max)){$('#priceError').textContent='Мінімальна ціна не може перевищувати максимальну.';return;}$('#priceError').textContent='';state.min=min;state.max=max;state.limit=12;render();};
$('#loadMore').onclick=()=>{state.limit+=12;render();};
$('#resetAll').onclick=()=>reset('all');
$('#filterToggle').onclick=()=>{const open=$('#filterToggle').getAttribute('aria-expanded')!=='true';$('#filterToggle').setAttribute('aria-expanded',String(open));$('#filterPanel').classList.toggle('expanded',open);};
window.addEventListener('popstate',()=>{state=Core.stateFrom(location.search);render();});
render();

$('#showFilterResults').onclick=()=>{$('#filterToggle').setAttribute('aria-expanded','false');$('#filterPanel').classList.remove('expanded');$('#products').focus({preventScroll:true});$('#products').scrollIntoView({behavior:'smooth',block:'start'});};
