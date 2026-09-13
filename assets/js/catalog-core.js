/* Pure catalog logic, shared by the browser and regression tests. */
(function(root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.AVCore = api;
})(typeof window !== 'undefined' ? window : globalThis, function() {
  const normalize = value => String(value || '').normalize('NFKC').toLocaleLowerCase('uk-UA').replace(/[^\p{L}\p{N}]/gu, '');
  const escape = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const defaults = {cat:'all',type:'all',brand:'all',parameter:'all',volume:'all',capacity:'all',approval:'all',standard:'all',diameter:'all',api:'all',acea:'all',height:'all',width:'all',thickness:'all',brakeSystem:'all',discType:'all',q:'',min:'',max:'',sort:'popular',limit:12};
  function stateFrom(search) {
    const params = new URLSearchParams(search), state = {...defaults};
    for (const k of Object.keys(defaults)) if (params.has(k)) state[k] = params.get(k);
    // Keep existing product-page search URLs compatible.
    state.limit = Math.min(240, Math.max(12, Number(state.limit) || 12));
    for (const k of ['min','max']) if (state[k] !== '' && (!Number.isFinite(Number(state[k])) || Number(state[k]) < 0)) state[k] = '';
    return state;
  }
  function query(state) {
    const params = new URLSearchParams();
    for (const k of Object.keys(defaults)) if (String(state[k] ?? defaults[k]) !== String(defaults[k])) params.set(k, state[k]);
    return params.toString();
  }
  function enrich(product) {
    const p = {...product};
    p.categories = p.categories || [p.cat];
    p.parameter = p.facet === p.type ? '' : p.facet;
    const specs=p.specifications||{};
    for(const [key,label] of Object.entries({height:'Висота',width:'Ширина',thickness:'Товщина',brakeSystem:'Гальмівна система',discType:'Тип диска'}))p[key]=specs[label]||'';
    p.standard = (p.approvals || []).filter(v => /^(ACEA|API) /.test(v));
    p.api = p.standard.filter(v=>v.startsWith('API '));
    p.acea = p.standard.filter(v=>v.startsWith('ACEA '));
    p.approval = (p.approvals || []).filter(v => !/^(ACEA|API) /.test(v));
    const volume = p.name.match(/(\d+(?:[.,]\d+)?)\s*(мл|L|л)(?=\s|$|[^\p{L}])/iu);
    p.volume = volume ? `${volume[1]} ${volume[2].toLowerCase() === 'мл' ? 'мл' : 'л'}` : '';
    const capacity = p.name.match(/(\d+)\s*Ah/i);
    p.capacity = capacity ? `${capacity[1]} А·год` : '';
    if (p.type === 'Свічка') p.parameter = 'Іридієва';
    if (p.type === 'Рідина' && p.name.includes('DOT 4')) p.parameter = 'DOT 4';
    return p;
  }
  // Conservative term aliases; article numbers are never corrected fuzzily.
  const aliases = {
    'масло':'олива','масла':'олива','масел':'олива','оливи':'олива',
    'фильтр':'фільтр','фильтры':'фільтр','фільтри':'фільтр',
    'масляный':'масляний','воздушный':'повітряний','топливный':'паливний',
    'аккумулятор':'акб','аккумуляторы':'акб','акумулятор':'акб','акумулятори':'акб',
    'свеча':'свічка','свечи':'свічка','свічки':'свічка','зажигания':'запалювання',
    'тормозные':'гальмівні','тормозной':'гальмівний','колодка':'колодки',
    'амортизаторы':'амортизатор','амортизатори':'амортизатор','ремень':'ремінь',
    'бош':'bosch','брембо':'brembo','кастрол':'castrol','мотюль':'motul','мотуль':'motul',
    'ликви':'liqui','лікві':'liqui','моли':'moly','молі':'moly','манн':'mann'
  };
  const searchTerm = value => {const word=normalize(value);return aliases[word]||word;};
  function filter(products, state, ignore = '') {
    const words = String(state.q || '').trim().split(/\s+/).map(searchTerm).filter(Boolean);
    let result = products.filter(p => {
      const haystack = normalize([p.name,p.brand,p.sku,p.type,p.parameter,p.volume,p.capacity,...(p.approvals||[]),...Object.values(p.specifications||{}),...(p.oem || [])].join(' '));
      return words.every(w => haystack.includes(w)) &&
        ['cat','type','brand','parameter','volume','capacity','approval','standard','diameter','api','acea','height','width','thickness','brakeSystem','discType'].every(k => ignore === k || !state[k] || state[k] === 'all' || (k === 'cat' ? (p.categories||[p.cat]).includes(state[k]) : k === 'brand' ? state[k].split('|').includes(p[k]) : Array.isArray(p[k]) ? p[k].includes(state[k]) : p[k] === state[k])) &&
        (ignore === 'price' || state.min === '' || p.price >= Number(state.min)) &&
        (ignore === 'price' || state.max === '' || p.price <= Number(state.max));
    });
    const sorts = {cheap:(a,b)=>a.price-b.price,expensive:(a,b)=>b.price-a.price,brand:(a,b)=>a.brand.localeCompare(b.brand)};
    if (sorts[state.sort]) result.sort(sorts[state.sort]);
    return result;
  }
  function options(products, state, field) {
    return [...new Set(filter(products, {...state,limit:240}, field).flatMap(p=>p[field]||[]).filter(Boolean))].sort((a,b)=>a.localeCompare(b,'uk',{numeric:true}));
  }
  function cleanCart(value, products) {
    if (!Array.isArray(value)) return [];
    const result = new Map();
    for (const row of value) {
      if (!row || !products.some(p=>p.id===Number(row.id))) continue;
      const qty = Math.floor(Number(row.qty));
      if (!Number.isFinite(qty) || qty < 1) continue;
      result.set(Number(row.id), Math.min(99,(result.get(Number(row.id))||0)+qty));
    }
    return [...result].map(([id,qty])=>({id,qty}));
  }
  const validVin = vin => /^[A-HJ-NPR-Z0-9]{17}$/.test(String(vin).trim().toUpperCase());
  return {normalize,escape,defaults,stateFrom,query,enrich,filter,options,cleanCart,validVin};
});
