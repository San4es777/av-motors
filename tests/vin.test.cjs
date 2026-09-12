const test=require('node:test'),assert=require('node:assert/strict'),Vin=require('../assets/js/vin-service.js');
const publicFormatExample='SALWA2KF0GA123456'; // Synthetic format fixture; never sent to the live service.
test('VIN URL is fixed to NHTSA, validates locally and includes selected year',()=>{
 assert.match(Vin.url(publicFormatExample,'2016'),/^https:\/\/vpic.nhtsa.dot.gov\/api\/vehicles\/DecodeVinValues\//);
 assert.ok(Vin.url(publicFormatExample,'2016').includes('modelyear=2016'));
 assert.throws(()=>Vin.url('INVALID'),/INVALID_VIN/);
});
test('NHTSA partial decode must not be reported as complete',()=>{
 const result=Vin.parse({Results:[{Make:'BMW',Model:'X3',ModelYear:'2011',ErrorCode:'6'}]});
 assert.equal(result.complete,false);assert.equal(result.make,'BMW');
});
test('complete basic decode requires zero error and make/model/year',()=>{
 assert.equal(Vin.parse({Results:[{Make:'BMW',Model:'X3',ModelYear:'2011',ErrorCode:'0'}]}).complete,true);
 assert.equal(Vin.parse({Results:[{Make:'BMW',ErrorCode:'0'}]}).complete,false);
 assert.equal(Vin.parse({Results:[{Make:'BMW',Model:'X3',ModelYear:'2011',ErrorCode:'0, 6'}]}).complete,false);
});
test('network adapter omits credentials and accepts an abort signal',async()=>{
 const controller=new AbortController();let options;
 const result=await Vin.decode(publicFormatExample,'2016',{signal:controller.signal,fetcher:async(u,o)=>{options=o;return{ok:true,json:async()=>({Results:[{Make:'LAND ROVER',Model:'Range Rover Sport',ModelYear:'2016',ErrorCode:'0'}]})};}});
 assert.equal(result.complete,true);assert.equal(options.credentials,'omit');assert.equal(options.referrerPolicy,'no-referrer');assert.equal(options.signal,controller.signal);
});
test('rate limits, invalid payload and offline errors remain actionable',async()=>{
 await assert.rejects(Vin.decode(publicFormatExample,'',{fetcher:async()=>({ok:false,status:429})}),/RATE_LIMIT/);
 await assert.rejects(Vin.decode(publicFormatExample,'',{fetcher:async()=>({ok:true,json:async()=>({Results:[]})})}),/BAD_RESPONSE/);
 await assert.rejects(Vin.decode(publicFormatExample,'',{fetcher:async()=>{throw new Error('OFFLINE')}}),/OFFLINE/);
});
