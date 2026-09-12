const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const {JSDOM}=require('jsdom'), vm=require('node:vm');
const root=path.resolve(__dirname,'..');
function page(file='index.html',search='',saved={}){
 const dom=new JSDOM(fs.readFileSync(path.join(root,file),'utf8'),{url:'https://example.test/av-motors/'+file+search,runScripts:'outside-only',pretendToBeVisual:true});
 const w=dom.window;w.HTMLElement.prototype.scrollIntoView=function(){};
 // JSDOM has no top-layer layout. These stand-ins test application events only.
 w.HTMLDialogElement.prototype.showModal=function(){this.open=true;};
 w.HTMLDialogElement.prototype.close=function(){this.open=false;this.dispatchEvent(new w.Event('close'));};
 for(const [k,v]of Object.entries(saved))w.localStorage.setItem(k,JSON.stringify(v));
 for(const script of w.document.querySelectorAll('script[src]'))new vm.Script(fs.readFileSync(path.join(root,script.getAttribute('src')),'utf8'),{filename:script.getAttribute('src')}).runInContext(dom.getInternalVMContext());
 const q=s=>w.document.querySelector(s),all=s=>[...w.document.querySelectorAll(s)];
 const change=(s,value)=>{q(s).value=value;q(s).dispatchEvent(new w.Event('change',{bubbles:true}));};
 const submit=s=>q(s).dispatchEvent(new w.Event('submit',{bubbles:true,cancelable:true}));
 return {dom,w,q,all,change,submit,close:()=>dom.window.close()};
}
test('catalog journey: search → sort → filter → product → restored results',()=>{
 const a=page();a.q('#q').value='8973';a.submit('#search');assert.equal(a.all('.product').length,1);
 a.change('#sort','cheap');assert.equal(a.all('.product').length,1);
 a.q('[data-category="service"]').click();a.change('[data-field="type"]','Олива');
 assert.equal(a.all('.product').length,1);assert.ok(!a.q('#facets').textContent.includes('Паливний'));
 const link=new URL(a.q('.product h3 a').href),b=page('product.html',link.search);
 assert.match(b.q('h1').textContent,/Top Tec/);
 const back=new URL(b.q('#backToCatalog').href),c=page('index.html',back.search);
 assert.equal(c.q('#q').value,'8973');assert.equal(c.q('#sort').value,'cheap');assert.equal(c.all('.product').length,1);
 assert.equal(c.q('[data-field="type"]').value,'Олива');[a,b,c].forEach(x=>x.close());
});
test('empty search can reset all conditions; pagination adds unique products',()=>{
 const a=page('index.html','?q=nonexistent');assert.equal(a.all('.product').length,0);
 a.q('[data-reset="all"]').click();assert.equal(a.all('.product').length,12);
 a.q('#loadMore').click();assert.equal(a.all('.product').length,24);
 a.q('#loadMore').click();assert.equal(a.all('.product').length,28);assert.equal(a.q('#loadMore').hidden,true);
 assert.equal(new Set(a.all('.product h3 a').map(x=>x.href)).size,28);a.close();
});
test('cart handles quantity, reload, removal and legacy stale entries',()=>{
 const a=page('index.html','',{'av-cart3':[{id:999,qty:3},{id:1,qty:2}]});
 assert.equal(a.q('[data-cart-count]').textContent,'2');
 a.q('[data-add="1"]').click();assert.equal(a.q('[data-cart-count]').textContent,'3');
 a.q('[data-qty="1"][data-delta="-1"]').click();assert.equal(a.q('[data-cart-count]').textContent,'2');
 assert.equal(a.q('#cartTotal').textContent.replace(/\s/g,''),'4780₴');
 const saved=JSON.parse(a.w.localStorage.getItem('av-cart3'));const b=page('product.html','?id=1',{'av-cart3':saved});
 assert.equal(b.q('[data-cart-count]').textContent,'2');b.q('[data-remove="1"]').click();assert.equal(b.q('#checkoutOpen').disabled,true);a.close();b.close();
});
test('vehicle fields depend on make; saving does not change catalog fitment',()=>{
 const a=page();a.q('[data-open-car]').click();a.change('#make','Land Rover');
 assert.ok(a.q('#model').textContent.includes('Range Rover Sport'));
 a.change('#model','Range Rover Sport');a.q('#year').value='2018';a.q('#engine').value='3.0';a.submit('#vehicleForm');
 assert.match(a.q('[data-car-summary]').textContent,/Land Rover Range Rover Sport/);assert.equal(a.all('.product').length,12);
 a.q('[data-open-car]').click();a.change('#make','Toyota');assert.equal(a.q('#model').value,'');assert.ok(!a.q('#model').textContent.includes('Range Rover'));
 a.close();
});
test('draft validates phone and VIN, includes delivery and never reports sent',()=>{
 const a=page();a.q('[data-add="1"]').click();a.q('[data-open-cart]').click();a.q('#checkoutOpen').click();
 a.q('#customerName').value='Тест';a.q('#phone').value='123';a.submit('#checkoutForm');assert.match(a.q('#checkoutError').textContent,/номер/);
 a.q('#phone').value='+380501234567';a.change('#delivery','post');assert.equal(a.q('#city').required,true);a.q('#city').value='Одеса';a.q('#branch').value='12';
 a.q('#orderVin').value='123';a.submit('#checkoutForm');assert.match(a.q('#checkoutError').textContent,/VIN/);
 a.q('#orderVin').value='';a.submit('#checkoutForm');assert.equal(a.q('#orderPreview').hidden,false);assert.match(a.q('#requestText').value,/Нова пошта, Одеса, 12/);assert.match(a.q('#requestText').value,/НЕ ПІДТВЕРДЖЕНЕ/);
 assert.ok(!a.w.localStorage.getItem('av-cart3').includes('38050'));a.close();
});
test('a missing part can be requested without adding an unrelated product',()=>{
 const a=page();a.q('[data-open-request]').click();a.q('#customerName').value='Тест';a.q('#phone').value='0501234567';a.submit('#checkoutForm');assert.match(a.q('#checkoutError').textContent,/Опишіть/);
 a.q('#orderComment').value='Потрібна прокладка';a.submit('#checkoutForm');assert.match(a.q('#requestText').value,/Потрібна прокладка/);a.close();
});
test('invalid product is a useful not-found view, not a different product',()=>{
 const a=page('product.html','?id=999');assert.match(a.q('h1').textContent,/не знайдено/);assert.equal(a.all('[data-add]').length,0);a.close();
});
test('theme is shared, toggles both ways and arbitrary stored input is escaped',()=>{
 const a=page('index.html','?q=%3Cimg%20src%3Dx%20onerror%3Dalert(1)%3E');a.q('[data-theme-toggle]').click();assert.equal(a.w.document.documentElement.dataset.theme,'light');
 assert.equal(a.w.localStorage.getItem('av-theme'),'light');a.q('[data-theme-toggle]').click();assert.equal(a.w.document.documentElement.dataset.theme,'dark');
 assert.equal(a.all('#selectedFilters img').length,0);a.close();
});
