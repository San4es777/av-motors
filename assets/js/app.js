'use strict';
let state=Core.stateFrom(location.search), view=storage.get('av-view-v2','grid');
if(!['grid','list'].includes(view))view='grid';
const fieldNames={type:'Тип товару',brand:'Виробник',parameter:'Параметр',volume:'Об’єм',capacity:'Ємність',approval:'Допуск автовиробника',standard:'Стандарт API / ACEA',diameter:'Діаметр',api:'Стандарт API',acea:'Стандарт ACEA',height:'Висота',width:'Ширина',thickness:'Товщина',brakeSystem:'Гальмівна система',discType:'Конструкція диска'};
const detailKeys=['parameter','volume','capacity','approval','standard','diameter','api','acea','height','width','thickness','brakeSystem','discType'];
function chooseType(value){state.type=value;state.brand='all';detailKeys.forEach(k=>state[k]='all');state.limit=12;}
function typeState(value){return {...Core.defaults,cat:state.cat,q:state.q,min:state.min,max:state.max,type:value};}
function syncURL(){const q=Core.query(state);history.replaceState(null,'',location.pathname+(q?'?'+q:'')+location.hash);}
function field(label,key,values) {
 if(!values.length&&state[key]==='all')return '';
 const selected=key==='brand'?state[key].split('|'):[state[key]];
 for(const v of selected)if(v!=='all'&&!values.includes(v))values=[v,...values];
 const count=v=>Core.filter(PRODUCTS,key==='type'?typeState(v):{...state,[key]:v}).length;
 if(key==='brand')return `<fieldset class="brand-facet"><legend>${esc(label)}</legend><div class="brand-options">${values.map(v=>`<label class="check-option"><input type="checkbox" data-brand="${esc(v)}" ${selected.includes(v)?'checked':''} ${!count(v)&&!selected.includes(v)?'disabled':''}><span>${esc(v)}</span><small>${count(v)}</small></label>`).join('')}</div></fieldset>`;
 return `<label class="field">${esc(label)}<select data-field="${key}" aria-label="${esc(label)}"><option value="all">Усі</option>${values.map(v=>`<option value="${esc(v)}" ${state[key]===v?'selected':''} ${!count(v)&&state[key]!==v?'disabled':''}>${esc(v)} (${count(v)})</option>`).join('')}</select></label>`;
}
function renderFilters() {
 const type=state.type;
 const parameterNames={'Олива':'В’язкість SAE','Фільтр':'Вид фільтра','АКБ':'Технологія','Лампа':'Цоколь','Рідина':'Специфікація','Свічка':'Тип електрода','Хімія':'Призначення','Догляд':'Призначення'};
 const schema={'Олива':['parameter','volume','approval','api','acea'],'Фільтр':['parameter','diameter','height'],'АКБ':['parameter','capacity'],'Колодки':['brakeSystem','width','height','thickness'],'Диск':['discType','diameter','thickness','height'],'Рідина':['parameter','volume'],'Лампа':['parameter'],'Свічка':['parameter'],'Хімія':['parameter','volume'],'Догляд':['parameter','volume']};
 const keys=['type','brand',...(schema[type]||[])];if(state.standard!=='all')keys.push('standard');
 $('#facets').innerHTML=keys.map(k=>field(k==='parameter'?(parameterNames[type]||'Різновид'):fieldNames[k],k,Core.options(PRODUCTS,{...Core.defaults,cat:state.cat,type:k==='type'?'all':state.type},k))).join('');
 $('#facets').querySelectorAll('select').forEach(el=>el.onchange=()=>{
 const k=el.dataset.field;state[k]=el.value;
 if(k==='type')chooseType(el.value);
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
 for(const k of ['type','brand','parameter','volume','capacity','approval','standard','diameter','api','acea','height','width','thickness','brakeSystem','discType'])if(state[k]!=='all')items.push([k,(fieldNames[k]||k)+': '+state[k].replaceAll('|',', ')]);
 if(state.min!==''||state.max!=='')items.push(['price',`Ціна: ${state.min||'0'}–${state.max||'∞'} ₴`]);
 $('#selectedFilters').innerHTML=items.map(([key,label])=>`<button class="chip" data-reset="${key}" aria-label="Прибрати ${esc(label)}">${esc(label)} <span aria-hidden="true">×</span></button>`).join('');
 $('#resetAll').hidden=!items.length;
 $('#filterCount').textContent=items.length?` (${items.length})`:'';
}
function render(){
 const result=Core.filter(PRODUCTS,state);
 $('#products').className='products '+view;
 const withoutPrice=Core.filter(PRODUCTS,{...state,min:'',max:''}).length;
 const globalMatches=state.q?Core.filter(PRODUCTS,{...Core.defaults,q:state.q}).length:0;
 $('#products').innerHTML=result.length?result.slice(0,state.limit).map(p=>productMarkup(p,Core.query(state))).join(''):`<div class="empty"><h3>За цими умовами товарів немає</h3><p>Змініть умови пошуку або підготуйте запит на потрібну деталь.</p>${withoutPrice?`<button class="primary" data-reset="price">Прибрати ціну — ${withoutPrice} товарів</button>`:''}${globalMatches?`<button class="secondary" data-search-all>Шукати в усьому каталозі</button><p class="muted">За цим запитом у повному каталозі: ${globalMatches}.</p>`:''}<button class="secondary" data-reset="all">Скинути фільтри й пошук</button><button class="secondary" data-open-request>Підготувати запит на деталь</button></div>`;
 $('#showFilterResults').textContent=`Показати товари (${result.length})`;
 $('#resultInfo').textContent=`${result.length} товарів · демо-каталог`;
 $('#catalogTitle').textContent=state.q?'Результати пошуку':state.cat==='all'?'Каталог товарів':CATEGORIES.find(c=>c.id===state.cat)?.name||'Каталог';
 $('#q').value=state.q;$('#sort').value=state.sort;
 $('#loadMore').hidden=state.limit>=result.length;
 $('#loadMore').textContent=`Показати ще ${Math.min(12,Math.max(0,result.length-state.limit))}`;
 $('#shownCount').textContent=result.length?`Показано ${Math.min(state.limit,result.length)} з ${result.length}`:'';
 document.querySelectorAll('[data-view]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.view===view)));
 renderCategories();renderFilters();renderSelected();renderSubcategories();renderCoverage();syncURL();
}
function reset(key){
 if(key==='all'){state={...Core.defaults};}
 else if(key==='cat'){state.cat='all';chooseType('all');}
 else if(key==='type'){chooseType('all');}
 else if(key==='price'){state.min=state.max='';}
 else state[key]=Core.defaults[key];
 $('#priceError').textContent='';state.limit=12;render();
}
document.addEventListener('click',e=>{
 const b=e.target.closest('button,a');if(!b)return;
 if(b.matches('[data-category]')){e.preventDefault();state.cat=b.dataset.category;chooseType('all');state.limit=12;render();document.querySelector(`[data-category="${b.dataset.category}"]`)?.focus({preventScroll:true});}
 if(b.matches('[data-subtype]')){chooseType(b.dataset.subtype);render();$('#subcategories').querySelectorAll('button').forEach(x=>{if(x.dataset.subtype===state.type)x.focus({preventScroll:true});});}
 if(b.matches('[data-search-all]')){state={...Core.defaults,q:state.q};render();}
 if(b.matches('[data-reset]'))reset(b.dataset.reset);
 if(b.matches('[data-view]')){view=b.dataset.view;storage.set('av-view-v2',view);render();}
});
$('#search').onsubmit=e=>{e.preventDefault();state.q=$('#q').value.trim();state.limit=12;render();$('#catalog').scrollIntoView({behavior:'smooth'});};
$('#sort').onchange=e=>{state.sort=e.target.value;render();};
$('#priceForm').onsubmit=e=>{e.preventDefault();const min=$('#minPrice').value,max=$('#maxPrice').value;if(min!==''&&max!==''&&Number(min)>Number(max)){$('#priceError').textContent='Мінімальна ціна не може перевищувати максимальну.';return;}$('#priceError').textContent='';state.min=min;state.max=max;state.limit=12;render();};
$('#loadMore').onclick=()=>{const firstNew=state.limit;state.limit+=12;render();$('#products').querySelectorAll('.product h3 a')[firstNew]?.focus({preventScroll:true});};
$('#resetAll').onclick=()=>reset('all');
$('#filterToggle').onclick=()=>{const open=$('#filterToggle').getAttribute('aria-expanded')!=='true';$('#filterToggle').setAttribute('aria-expanded',String(open));$('#filterPanel').classList.toggle('expanded',open);};
window.addEventListener('popstate',()=>{state=Core.stateFrom(location.search);render();});
render();

$('#showFilterResults').onclick=()=>{$('#filterToggle').setAttribute('aria-expanded','false');$('#filterPanel').classList.remove('expanded');$('#products').focus({preventScroll:true});$('#products').scrollIntoView({behavior:'smooth',block:'start'});};

function renderSubcategories(){
 const host=$('#subcategories');host.hidden=state.cat==='all';
 const values=Core.options(PRODUCTS,{...Core.defaults,cat:state.cat},'type');
 host.innerHTML=values.map(v=>`<button class="subtype ${state.type===v?'selected':''}" data-subtype="${esc(v)}" aria-pressed="${state.type===v}">${esc(v)} <small>${Core.filter(PRODUCTS,typeState(v)).length}</small></button>`).join('');
}
function renderCoverage(){
 const selected=detailKeys.filter(k=>state[k]!=='all');
 const base={...state};selected.forEach(k=>base[k]='all');
 const missing=(p,k)=>!p[k]||(Array.isArray(p[k])&&!p[k].length);
 const unknown=selected.length?Core.filter(PRODUCTS,base).filter(p=>selected.some(k=>missing(p,k))&&selected.every(k=>missing(p,k)||(Array.isArray(p[k])?p[k].includes(state[k]):p[k]===state[k]))).length:0;
 $('#coverageNote').hidden=!unknown;
 $('#coverageNote').textContent=unknown?`У ${unknown} інших товарів частину вибраних характеристик не заповнено. Вони не включені до підтверджених збігів; це не означає несумісність. Підготуйте запит для уточнення.`:'';
}
