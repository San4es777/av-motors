'use strict';
let vinController=null,decodedVehicle=null,vinRequestVersion=0;
function clearVinResult(){vinRequestVersion++;vinController?.abort();decodedVehicle=null;$('#vinResult').hidden=true;$('#vinDecode').disabled=false;$('#vinDecode').textContent='Розшифрувати VIN';}
$('#vin').addEventListener('input',clearVinResult);
$('#vehicleDialog').addEventListener('close',clearVinResult);
document.addEventListener('click',e=>{if(e.target.closest('[data-open-car]'))clearVinResult();});
$('#vinDecode').onclick=async()=>{
 clearVinResult();const version=vinRequestVersion,vin=$('#vin').value.trim().toUpperCase();
 if(!Core.validVin(vin)){$('#vehicleError').textContent='Введіть 17 символів VIN без I, O, Q.';$('#vin').focus();return;}
 $('#vehicleError').textContent='';$('#vinDecode').disabled=true;$('#vinDecode').textContent='Перевіряємо…';
 vinController=new AbortController();const controller=vinController;let timedOut=false;
 const timer=setTimeout(()=>{timedOut=true;controller.abort();},12000);
 try{
  const v=await window.AVVin.decode(vin,$('#year').value,{signal:controller.signal});
  if(version!==vinRequestVersion)return;
  decodedVehicle=v;const fields=[['Марка',v.make],['Модель',v.model],['Модельний рік',v.year],['Об’єм двигуна, л',v.engine],['Пальне',v.fuel],['Кузов',v.body]].filter(([,value])=>value);
  $('#vinResult').innerHTML=`<b>${v.complete?'Автомобіль розпізнано':'Отримано неповні дані'}</b><dl class="specs">${fields.map(([k,value])=>`<div><dt>${esc(k)}</dt><dd>${esc(value)}</dd></div>`).join('')}</dl><p class="muted">${v.complete?'Перевірте результат перед збереженням. Модельний рік може відрізнятися від року випуску.':'Для цього VIN дані неповні або є зауваження сервісу. Заповніть авто вручну; це не доводить, що VIN недійсний.'} Розшифровка не підтверджує сумісність деталей і не є перевіркою історії авто.</p>${v.complete?'<button class="secondary" id="applyVin" type="button">Підставити дані в форму</button>':''}`;
  $('#vinResult').hidden=false;
  if(v.complete)$('#applyVin').onclick=()=>{
   const known=Object.keys(MODELS).find(k=>Core.normalize(k)===Core.normalize(v.make));
   if(!known){$('#vehicleError').textContent='Марки немає в поточному довіднику. Дані розшифровки можна перенести до коментаря заявки.';return;}
   $('#make').value=known;const model=MODELS[known].find(x=>Core.normalize(x)===Core.normalize(v.model))||v.model;renderModels(model);
   if(!Array.from($('#year').options).some(o=>o.value===v.year)){const o=document.createElement('option');o.value=o.textContent=v.year;$('#year').append(o);}
   $('#year').value=v.year;$('#engine').value=[v.engine?v.engine+' л':'',v.fuel].filter(Boolean).join(' · ');
   $('#vehicleError').textContent='';notify('Дані підставлено. Перевірте модифікацію та натисніть «Зберегти авто».');
  };
 }catch(error){
  if(version!==vinRequestVersion)return;
  $('#vehicleError').textContent=timedOut?'Сервіс не відповів вчасно. Спробуйте пізніше або заповніть авто вручну.':error.message==='RATE_LIMIT'?'Сервіс тимчасово обмежив запити. Спробуйте пізніше.':'Не вдалося отримати дані. Заповніть авто вручну — пошук і кошик продовжують працювати.';
 }finally{clearTimeout(timer);if(version===vinRequestVersion){$('#vinDecode').disabled=false;$('#vinDecode').textContent='Розшифрувати VIN';}}
};
