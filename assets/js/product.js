'use strict';
const params=new URLSearchParams(location.search), product=PRODUCTS.find(p=>p.id===Number(params.get('id')));
// Rebuild the return route from allowed catalog fields; never accept an arbitrary URL.
const returnQuery=Core.query(Core.stateFrom(params.get('return')||''));
const returnURL='index.html'+(returnQuery?'?'+returnQuery:'')+'#catalog';
$('#backToCatalog').href=returnURL;
if(!product){
 document.title='Товар не знайдено — AV Motors';
 $('#productPage').innerHTML='<div class="empty"><h1>Товар не знайдено</h1><p>Посилання застаріло або товар відсутній у каталозі.</p><a class="primary" href="index.html#catalog">Перейти до каталогу</a></div>';
}else{
 const p=product;
 document.title=`${p.brand} ${p.name} — AV Motors`;
 document.querySelector('meta[name="description"]').content=`${p.brand} ${p.name}, артикул ${p.sku}. Характеристики та запит на підбір в AV Motors, Одеса. Демонстраційна пропозиція.`;
 $('#productCrumb').textContent=p.name;
 const description=p.description||{
 'Олива':'Звірте в’язкість, допуск виробника автомобіля та необхідний об’єм за сервісною документацією. Схожа назва оливи не гарантує відповідність вашому двигуну.',
 'Фільтр':'Для замовлення потрібні точна модифікація автомобіля та артикул. Перед покупкою потрібно звірити конструкцію й розміри фільтра.',
 'АКБ':'Перед замовленням звірте технологію акумулятора, ємність, розміри корпусу, полярність та вимоги автомобіля.',
 'Лампа':'Перевірте цоколь і вимоги штатної фари. Комплектацію упаковки потрібно уточнити перед замовленням.'
 }[p.type]||'Перед замовленням потрібно підтвердити артикул, комплектацію, характеристики та застосування товару. За потреби додайте дані автомобіля до запиту.';
 const specs=[['Виробник',p.brand],['Артикул',p.sku],['Тип',p.type],['Параметр',p.parameter],['Об’єм',p.volume],['Ємність',p.capacity],['Стан','Новий'],['Наявність','Потребує підтвердження'],...(p.approvals?.length?[['Специфікації / допуски',p.approvals.join(', ')]]:[]),...Object.entries(p.specifications||{})].filter(([,v])=>v);
 const related=PRODUCTS.filter(x=>x.type===p.type&&x.id!==p.id).slice(0,3);
 $('#productPage').innerHTML=`<div class="product-layout"><div class="gallery"><div class="product-visual">${imageMarkup(p)}</div><p class="muted">${p.image?'Фото з каталогу виробника. Упаковка та комплектація можуть відрізнятися.':'Зображення схематичне. Фото конкретного товару ще не додане.'}</p></div><article class="product-detail"><span class="ey">${esc(p.brand)}</span><h1>${esc(p.name)}</h1><p class="sku">Артикул ${esc(p.sku)}</p><div class="detail-price">${money(p.price)} <small>демо-ціна</small></div><div class="notice"><b>Ціна та наявність потребують підтвердження</b><p>${esc(p.fit)}. Вибір авто не є підтвердженням сумісності.</p></div><div class="product-actions"><button class="primary" data-add="${p.id}">Додати у кошик +</button><button class="secondary" data-open-car>Додати моє авто</button></div><div class="delivery-note"><b>Одеса · доставка по Україні</b><p>Самовивіз на вул. Одарія або Нова пошта. Строк, вартість доставки й спосіб оплати потрібно погодити з продавцем.</p></div><nav class="detail-nav" aria-label="Розділи товару"><a href="#description">Опис</a><a href="#specifications">Характеристики</a><a href="#similar">Схожі товари</a></nav><section id="description"><h2>Про товар</h2><p>${esc(description)}</p></section><section id="specifications"><h2>Характеристики</h2>${p.source?`<p><a class="text-link" href="${esc(p.source)}" target="_blank" rel="noopener">Джерело: каталог виробника ↗</a></p>`:''}<dl class="specs">${specs.map(([k,v])=>`<div><dt>${esc(k)}</dt><dd>${esc(v)}</dd></div>`).join('')}</dl></section><details><summary>Як перевірити сумісність?</summary><p>Підготуйте VIN, рік, двигун та артикул потрібної деталі. Автоматична база сумісності ще не підключена. Підтвердження продавця потрібне до оплати.</p></details><details><summary>Доставка та повернення</summary><p>Вартість і строки доставки, гарантію та умови повернення потрібно уточнити у продавця до підтвердження замовлення. Ця демонстрація не приймає оплату.</p></details></article></div><section id="similar" class="section"><div class="section-heading"><div><span class="ey">ПРОДОВЖИТИ ВИБІР</span><h2>Інші товари цього типу</h2></div><a class="text-link" href="${esc(returnURL)}">Назад до результатів ↗</a></div><p class="muted">Це товари для порівняння, а не підтверджені взаємозамінні аналоги.</p><div class="products grid">${related.length?related.map(x=>productMarkup(x,returnQuery)).join(''):'<p>Інших товарів цього типу в демо-каталозі поки немає.</p>'}</div></section>`;
}
