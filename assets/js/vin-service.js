/* NHTSA vPIC integration: vehicle identification only, never parts fitment. */
(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else root.AVVin=api;})(typeof window!=='undefined'?window:globalThis,function(){
 const endpoint='https://vpic.nhtsa.dot.gov/api/vehicles/DecodeVinValues/';
 function url(vin,year=''){
  const normalized=String(vin).trim().toUpperCase();
  if(!/^[A-HJ-NPR-Z0-9]{17}$/.test(normalized))throw new Error('INVALID_VIN');
  const u=new URL(endpoint+normalized);u.searchParams.set('format','json');
  if(/^\d{4}$/.test(String(year))&&Number(year)>=1980&&Number(year)<=new Date().getFullYear()+1)u.searchParams.set('modelyear',year);
  return u.href;
 }
 function parse(payload){
  const data=payload?.Results?.[0];if(!data||typeof data!=='object')throw new Error('BAD_RESPONSE');
  const clean=k=>typeof data[k]==='string'?data[k].trim():'';
  const codes=clean('ErrorCode').split(',').map(s=>s.trim()).filter(Boolean);
  return {make:clean('Make'),model:clean('Model'),year:clean('ModelYear'),engine:clean('DisplacementL'),fuel:clean('FuelTypePrimary'),body:clean('BodyClass'),codes,
   complete:codes.length>0&&codes.every(c=>c==='0')&&!!clean('Make')&&!!clean('Model')&&!!clean('ModelYear')};
 }
 async function decode(vin,year='',options={}){
  const fetcher=options.fetcher||fetch;
  const response=await fetcher(url(vin,year),{method:'GET',signal:options.signal,credentials:'omit',referrerPolicy:'no-referrer',cache:'no-store'});
  if(!response.ok)throw new Error(response.status===429?'RATE_LIMIT':'SERVICE_UNAVAILABLE');
  return parse(await response.json());
 }
 return {url,parse,decode};
});
