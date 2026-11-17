export const giftActions = {join:'Entrar na festa',marry:'Ser o noivo',bride:'Ser a noiva',band:'Entrar na banda',dj:'Ser DJ',reset:'Reiniciar a festa'};
const normalize = value => String(value ?? '').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^\p{L}\p{N}]+/gu,' ').trim();
const aliases = value => String(value || '').split(',').map(normalize).filter(Boolean);
export function sanitizeGifts(raw) {
 const gifts = Array.isArray(raw) ? raw : raw?.gifts;
 if (!Array.isArray(gifts)) throw Error('O TikTok não retornou um catálogo válido.');
 return [...new Map(gifts.map(g => {
  const image = g.image?.url_list?.[0] || g.image?.urlList?.[0] || g.image || '';
  return {id:String(g.id),name:String(g.name || '').slice(0,100),coins:Number(g.diamond_count ?? g.diamondCount ?? g.coins),
   image:typeof image === 'string' && /^https:\/\//i.test(image) ? image : ''};
 }).filter(g => /^\d+$/.test(g.id) && g.name && Number.isInteger(g.coins) && g.coins > 0).map(g => [g.id,g])).values()];
}
export function resolveGiftCatalog(rules, gifts = [], status = 'offline') {
 return rules.filter(r => giftActions[r.effect]).map(r => {
  const ids = String(r.ids || '').split(',').map(s => s.trim()).filter(Boolean), names = aliases(r.names);
  const priced = gifts.filter(g => r.coins == null || g.coins === Number(r.coins));
  const selected = priced.filter(g => ids.includes(g.id));
  const candidates = selected.length ? selected : priced.filter(g => names.includes(normalize(g.name)));
  const gift = status === 'ready' && candidates.length === 1 ? candidates[0] : null;
  return {effect:r.effect,action:giftActions[r.effect],icon:r.icon,
   name:gift?.name || String(r.names || r.label).split(',')[0],coins:gift?.coins ?? r.coins,
   id:gift?.id || '',image:gift?.image || '',status:gift?'verified':status==='ready'?(candidates.length?'ambiguous':'unavailable'):'pending'};
 });
}
export function catalogRules(rules, cards) {
 return cards.filter(g => g.status === 'verified').map(g => ({...rules.find(r => r.effect === g.effect),
  names:g.name,ids:g.id,coins:g.coins,catalogBound:true}));
}
export function renderGiftCatalog(container, cards) {
 container.replaceChildren(...cards.map(g => {
  const card = document.createElement('div');card.className = 'gift-item ' + g.status;card.dataset.effect = g.effect;
  const icon = document.createElement('span');icon.className = 'gift-icon';icon.textContent = g.icon;
  if (g.image) {const img = document.createElement('img');img.src = g.image;img.alt = '';img.referrerPolicy='no-referrer';img.onerror=()=>img.remove();icon.append(img);}
  const info = document.createElement('div'),action = document.createElement('strong'),name = document.createElement('span'),price = document.createElement('small');
  action.textContent = g.action;name.textContent = g.name;
  const coins=g.coins+' '+(g.coins===1?'moeda':'moedas');
  price.textContent = g.status === 'verified' ? coins : g.status === 'unavailable' ? 'Indisponível nesta live' : g.status === 'ambiguous' ? 'Selecionar no painel' : (g.coins == null ? 'A confirmar' : coins + ' · confirmar');
  info.append(action,name,price);card.append(icon,info);return card;
 }));
}
