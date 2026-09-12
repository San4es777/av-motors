const test=require('node:test'), assert=require('node:assert/strict'), fs=require('node:fs'),vm=require('node:vm');
const Core=require('../assets/js/catalog-core.js');
const context={window:{}};vm.runInNewContext(fs.readFileSync(require.resolve('../assets/js/data.js'),'utf8'),context);
const products=Array.from(context.window.AV_PRODUCTS,Core.enrich), base={...Core.defaults};
test('search survives sorting and intersects category and manufacturer',()=>{
 let state={...base,q:'8973'};
 assert.deepEqual(Core.filter(products,state).map(p=>p.id),[1]);
 assert.deepEqual(Core.filter(products,{...state,sort:'cheap'}).map(p=>p.id),[1]);
 assert.equal(Core.filter(products,{...state,cat:'brakes'}).length,0);
 assert.equal(Core.filter(products,{...state,brand:'CASTROL'}).length,0);
});
test('article search tolerates spaces, dots and hyphens',()=>{
 assert.deepEqual(Core.filter(products,{...base,q:'HU 7019 Z'}).map(p=>p.id),[2]);
 assert.deepEqual(Core.filter(products,{...base,q:'09.A200.11'}).map(p=>p.id),[6]);
});
test('oil facets contain neither filters nor spark plugs; volume is independent',()=>{
 let state={...base,cat:'service',type:'Олива'};
 assert.deepEqual(Core.options(products,state,'parameter'),['5W-30']);
 assert.deepEqual(Core.options(products,state,'volume'),['4 л','5 л']);
 assert.deepEqual(Core.filter(products,{...state,volume:'4 л'}).map(p=>p.id),[15]);
 assert.equal(products.find(p=>p.id===13).volume,'500 мл');
});
test('battery chemistry and capacity combine',()=>{
 const result=Core.filter(products,{...base,type:'АКБ',parameter:'AGM',capacity:'70 А·год'});
 assert.deepEqual(result.map(p=>p.id),[11]);
});
test('URL roundtrip retains query, filters, ordering and page size',()=>{
 const state={...base,q:'фільтр & масло',cat:'service',type:'Фільтр',min:'100',max:'2000',sort:'cheap',limit:24};
 assert.deepEqual(Core.stateFrom(Core.query(state)),state);
 assert.equal(Core.stateFrom('limit=-10&min=NaN&max=-5').limit,12);
 assert.equal(Core.stateFrom('min=NaN').min,'');
});
test('price bounds and pagination do not duplicate results',()=>{
 const result=Core.filter(products,{...base,min:'500',max:'1000',sort:'cheap'});
 assert.ok(result.length>0);assert.ok(result.every(p=>p.price>=500&&p.price<=1000));
 assert.equal(new Set(result.map(p=>p.id)).size,result.length);
});
test('cart migration drops stale IDs and invalid quantities, coalesces duplicates',()=>{
 assert.deepEqual(Core.cleanCart([{id:1,qty:2},{id:1,qty:3},{id:999,qty:1},{id:2,qty:-3},null,{id:3,qty:1000}],products),[{id:1,qty:5},{id:3,qty:99}]);
 assert.deepEqual(Core.cleanCart({},products),[]);
});
test('VIN checks format only and rejects I O Q',()=>{
 assert.equal(Core.validVin('SALWA2KF0GA123456'),true);
 assert.equal(Core.validVin('SALWA2KFOGA123456'),false);
 assert.equal(Core.validVin('123'),false);
});
test('stored or query data is escaped before HTML rendering',()=>{
 assert.equal(Core.escape('<img src=x onerror="alert(1)">'), '&lt;img src=x onerror=&quot;alert(1)&quot;&gt;');
});
