
const categoryData=[
["Frutta e verdura","🍎","#dff5df"],["Carne","🥩","#fde3e3"],["Pesce","🐟","#e0f0ff"],["Latticini e uova","🥛","#e3f4ff"],["Pane e prodotti da forno","🥖","#fff0d7"],["Pasta, riso e cereali","🍝","#fff1c7"],["Surgelati","❄️","#e7f3ff"],["Bevande","🥤","#e7f8ed"],["Dispensa","🛒","#fff5d2"],["Dolci e snack","🍪","#f9e7f5"],["Igiene personale","🧴","#eee7ff"],["Casa e pulizia","🧽","#e8eefb"],["Altro","•","#edf0ee"]];
const markets=[
["Iperal","#f28c18","IPERAL","white"],["Bennet","#e51b23","BENNET","white"],
["Sigma","#e51b23","sigma","white"],
["Esselunga","#e30613","esselunga","white"],["Conad","#e30613","CONAD","white"],
["Coop","#d71920","coop","white"],["Carrefour","#0050a4","Carrefour","blue"],
["Lidl","#0050aa","LIDL","blue"],["ALDI","#0752a2","ALDI","blue"],
["Eurospin","#008b45","EUROSPIN","white"],
];
function visibleMarkets(){const hidden=new Set((db.deletedMarkets||[]).map(n=>String(n).toLowerCase()));const base=markets.filter(m=>!hidden.has(m[0].toLowerCase()));const custom=(db.customMarkets||[]).filter(m=>!hidden.has(String(m.name).toLowerCase())).map(m=>[m.name,m.color||'#20b94b',m.logo||'',m.kind||'custom']);return [...base,...custom]}
const unitsList=["nr","pz","kg","g","l","ml"];
function allCategories(){return [...categoryData.filter(c=>!(db.hiddenCategories||[]).includes(c[0])).map(c=>[(db.categoryRenames||{})[c[0]]||c[0],c[1],c[2],c[0]]),...db.customCategories.map(c=>[c.name,c.icon||"•",c.color||"#edf0ee",c.name])] }
let db;
try{db=JSON.parse(localStorage.getItem("spesaFacilePro")||'{"lists":[{"id":"main","name":"Spesa settimanale","items":[]}],"active":"main","recent":[],"favorites":[]}')}catch(e){db={lists:[{id:"main",name:"Spesa settimanale",items:[]}],active:"main",recent:[],favorites:[]};}
db.favorites=Array.isArray(db.favorites)?db.favorites:[]; db.recent=Array.isArray(db.recent)?db.recent:[]; db.hiddenCategories=Array.isArray(db.hiddenCategories)?db.hiddenCategories:[]; db.categoryRenames=(db.categoryRenames&&typeof db.categoryRenames==='object')?db.categoryRenames:{}; db.lastProductSettings=db.lastProductSettings||{qty:1,unit:'nr',category:''}; db.lastMarket=db.lastMarket||db.active; db.customCategories=Array.isArray(db.customCategories)?db.customCategories:[]; db.storeMode=!!db.storeMode; db.cards=Array.isArray(db.cards)?db.cards:[]; db.productFavorites=Array.isArray(db.productFavorites)?db.productFavorites:[]; db.history=Array.isArray(db.history)?db.history:[]; db.recurring=Array.isArray(db.recurring)?db.recurring:[]; db.budget=Number.isFinite(+db.budget)?+db.budget:0; db.theme='light'; document.body.dataset.theme='light';
db.customMarkets=Array.isArray(db.customMarkets)?db.customMarkets:[];
db.deletedMarkets=Array.isArray(db.deletedMarkets)?db.deletedMarkets:[];
db.customMarketLogos=(db.customMarketLogos&&typeof db.customMarketLogos==='object')?db.customMarketLogos:{};
// Remove the temporary supermarket requested for deletion.
const _removeTempMarket="L'ANGOLO DELLA FRUTTA";
db.customMarkets=db.customMarkets.filter(m=>String(m.name||'').toUpperCase()!==_removeTempMarket);
db.deletedMarkets=db.deletedMarkets.filter(n=>String(n).toUpperCase()!==_removeTempMarket);
db.lists=db.lists.filter(l=>String(l.name||'').toUpperCase()!==_removeTempMarket);
db.favorites=db.favorites.filter(n=>String(n).toUpperCase()!==_removeTempMarket);
db.productFavorites=db.productFavorites.filter(f=>String(f.marketName||'').toUpperCase()!==_removeTempMarket);
db.cards=db.cards.filter(c=>String(c.name||'').toUpperCase()!==_removeTempMarket);
db.lists=Array.isArray(db.lists)?db.lists:[];
db.lists=db.lists.map((l,i)=>({id:l?.id||(`list_${i}_${Date.now()}`),name:String(l?.name||"Supermercato"),items:Array.isArray(l?.items)?l.items.map((x,j)=>({...x,id:x?.id||(`item_${i}_${j}_${Date.now()}`),name:String(x?.name||"Prodotto"),qty:x?.qty??1,unit:x?.unit||"nr",category:x?.category||"Altro",done:!!x?.done,order:x?.order??j,price:Number.isFinite(+x?.price)?+x.price:0})):[],categoryOrder:Array.isArray(l?.categoryOrder)?l.categoryOrder:[]}));
if(!db.lists.length){db.lists=[{id:"main",name:"Spesa settimanale",items:[]}];db.active="main";}
// Dalla v22 Ipercoop e MD non fanno più parte dei supermercati disponibili.
db.lists=db.lists.filter(l=>!['ipercoop','md'].includes(String(l.name||'').toLowerCase()));
const predefinedNames=new Set(markets.map(m=>m[0].toLowerCase()));
db.lists=db.lists.filter(l=>!predefinedNames.has(String(l.name||'').toLowerCase()) || (l.items||[]).length>0);
db.favorites=(db.favorites||[]).filter(n=>!['ipercoop','md'].includes(String(n).toLowerCase()));
db.cards=(db.cards||[]).filter(c=>!['ipercoop','md'].includes(String(c.name||'').toLowerCase()));
db.productFavorites=(db.productFavorites||[]).filter(p=>!['ipercoop','md'].includes(String(p.marketName||'').toLowerCase()));
if(!db.active||!db.lists.some(x=>x.id===db.active)) db.active=db.lists[0].id;
save();

let currentTab="shop",editing=null,editingListId=null,lastToggle=null,hideDone=false,pendingCompleteId=null;
let pendingCompleteAction=null;
function completeMarket(listId){
 const l=db.lists.find(x=>x.id===listId); if(!l||!l.items.length)return;
 const purchased=l.items.filter(x=>x.done), left=l.items.filter(x=>!x.done); pendingCompleteId=listId; pendingCompleteAction=null;
 document.getElementById('completeText').innerHTML=`<div class="complete-summary"><b>${fmtQty(purchased.reduce((s,x)=>s+counterUnits(x),0))}</b> acquistati · <b>${fmtQty(left.reduce((s,x)=>s+counterUnits(x),0))}</b> da acquistare</div><p>${left.length?'Cosa vuoi fare con i prodotti non acquistati?':'Tutti i prodotti risultano acquistati.'}</p><div class="cm-actions"><button class="cm-ok" onclick="chooseCompleteAction(true)">Mantieni i non<br>acquistati</button>${left.length?'<button class="cm-danger" onclick="chooseCompleteAction(false)">Completa e rimuovi</button>':''}<button class="cm-cancel" onclick="closeCompleteModal()">Annulla</button></div>`;
 document.getElementById('completeModal').classList.add('show');
}
function chooseCompleteAction(keepLeft){
 pendingCompleteAction=keepLeft;
 const text=keepLeft?`<b>Mantieni i non acquistati</b><p>I prodotti non acquistati rimarranno<br>nella lista. Vuoi procedere?</p>`:`<b>Completa e rimuovi</b><p>Tutti i prodotti saranno rimossi<br>dalla lista. Vuoi procedere?</p>`;
 document.getElementById('completeText').innerHTML=`${text}<div class="cm-actions"><button class="cm-ok" onclick="confirmComplete()">Conferma</button><button class="cm-cancel" onclick="closeCompleteModal()">Annulla</button></div>`;
}
function closeCompleteModal(){pendingCompleteId=null;pendingCompleteAction=null;document.getElementById('completeModal').classList.remove('show')}
function confirmComplete(){
 const listId=pendingCompleteId,keepLeft=pendingCompleteAction,l=db.lists.find(x=>x.id===listId); if(!l||!l.items.length){closeCompleteModal();return}
 const beforeItems=JSON.parse(JSON.stringify(l.items)); const historyEntry={id:'hist_'+Date.now()+'_'+Math.random().toString(36).slice(2),name:l.name,market:l.name,date:new Date().toLocaleString('it-IT',{dateStyle:'medium',timeStyle:'short'}),count:beforeItems.length,items:JSON.parse(JSON.stringify(beforeItems))};
 if(!db.history)db.history=[]; db.history.unshift(historyEntry); db.history=db.history.slice(0,30); l.items=keepLeft?l.items.filter(x=>!x.done):[]; save(); haptic('success'); closeCompleteModal(); render();
 toast(keepLeft?'Spesa completata. I non acquistati sono rimasti nella lista.':'Spesa completata!','Annulla',()=>{const target=db.lists.find(x=>x.id===listId);if(!target)return;target.items=beforeItems;const hi=db.history.findIndex(h=>h.id===historyEntry.id);if(hi>=0)db.history.splice(hi,1);db.active=listId;save();render();haptic('success')});
}

const $=id=>document.getElementById(id);
const mainEl=$("main"), titleEl=$("title"), subtitleEl=$("subtitle"), menuTitleEl=$("menuTitle"), statsEl=$("stats"),
      searchEl=$("search"), sheetEl=$("sheet"), sheetTitleEl=$("sheetTitle"),
      nameEl=$("name"), qtyEl=$("qty"), priceEl=$("price"), unitsEl=$("units"),
      categoryEl=$("category"), marketSelect=$("marketSelect"), quickEl=null, toastEl=$("toast"),
      toastMsgEl=$("toastMsg"), toastUndoEl=$("toastUndo");
function save(){localStorage.setItem("spesaFacilePro",JSON.stringify(db))}
function L(){return db.lists.find(x=>x.id===db.active)||db.lists[0]}
function setTab(t){
 currentTab=t;
 document.querySelector(".app").classList.remove("store-mode-active"); document.body.classList.remove("store-mode-body");
 document.querySelectorAll(".navbtn").forEach((b,i)=>b.classList.toggle("active",["shop","markets","products","history"][i]===t));
 document.querySelector(".add").style.display=(t==="shop")?"block":"none";
 applyStoreMode();
 render();
}
function floatingAction(){openAdd()}
function toggleStoreMode(){db.storeMode=!db.storeMode;save();applyStoreMode();render()}
function applyStoreMode(){const active=db.storeMode&&currentTab==="shop";document.querySelector(".app").classList.toggle("store-mode-active",active);document.body.classList.toggle("store-mode-body",active);document.getElementById("bottomnav").style.display=active?"none":"";document.getElementById("floatingAdd").style.display="none"}
function captureShopViewState(){if(currentTab!=="shop")return window.__shopViewState||null;const state={markets:{},cats:{}};document.querySelectorAll(".photo-market-section").forEach(sec=>{const body=sec.querySelector(".photo-market-body");if(!body)return;const id=body.id.replace("body_","");state.markets[id]=body.style.display!=="none";body.querySelectorAll(".photo-category-body").forEach(b=>{state.cats[b.id]=b.style.display!=="none"});});return state;}
function restoreShopViewState(){const state=window.__shopViewState;if(!state)return;Object.entries(state.markets||{}).forEach(([id,open])=>{const b=document.getElementById("body_"+id);const sec=b?.closest(".photo-market-section");if(b){b.style.display=open?"block":"none";if(sec)sec.classList.toggle("market-collapsed",!open);}});Object.entries(state.cats||{}).forEach(([id,open])=>{const b=document.getElementById(id),c=document.getElementById(id+"_chev");if(b){b.style.display=open?"block":"none";if(c)c.textContent=open?"−":"+";}});}
function render(){if(currentTab==="shop"){window.__shopViewState=captureShopViewState();shop();restoreShopViewState();}else if(currentTab==="markets")lists();else if(currentTab==="products")products();else history()}
function marketRemaining(){
 return db.lists.filter(l=>l.items.some(x=>!x.done));
}
function shop(){
 titleEl.textContent="Spesa"; subtitleEl.textContent=""; menuTitleEl.textContent="Spesa";
 const all=db.lists.flatMap(l=>l.items||[]);
 const left=all.filter(x=>!x.done).reduce((s,x)=>s+counterUnits(x),0),done=all.filter(x=>x.done).reduce((s,x)=>s+counterUnits(x),0);
 statsEl.innerHTML=`<div class="stat"><b>${fmtQty(left)}</b><span>da acquistare</span></div><div class="stat"><b>${fmtQty(done)}</b><span>acquistati</span></div>`;
 document.getElementById("shopTools").innerHTML=db.storeMode?``:`<button class="add-inline" onclick="floatingAction()">AGGIUNGI</button><button class="store-mode-btn" onclick="toggleStoreMode()">🛒 MODALITÀ SPESA</button>`;
 mainEl.classList.toggle("store-mode",db.storeMode);
 document.querySelector(".app").classList.toggle("store-mode-active",db.storeMode && currentTab==="shop");
 applyStoreMode();
 const lists=db.lists.filter(l=>(l.items||[]).length);
 if(!lists.length){mainEl.innerHTML=(db.storeMode?`<div class="store-mode-controls"><button class="store-exit-top" onclick="toggleStoreMode()">🛒 ESCI DALLA MODALITÀ SPESA</button></div>`:'')+'<div class="empty">Nessun prodotto da acquistare.<br>Premi “Aggiungi prodotto” per iniziare.</div>';return;}
 let out=db.storeMode?`<div class="store-mode-controls"><button class="store-exit-top" onclick="toggleStoreMode()">🛒 ESCI DALLA MODALITÀ SPESA</button></div>`:''; if(!db.storeMode){const sug=getSmartSuggestions();if(sug.length)out+=`<div class="smart-suggest"><h3>Potresti aver dimenticato</h3>${sug.map(p=>`<button class="smart-chip" onclick="addSuggested(${JSON.stringify(p.name)},${JSON.stringify(p.marketId||'')})">＋ ${esc(p.name)}</button>`).join('')}</div>`;const total=all.filter(x=>!x.done).reduce((s,x)=>s+(+x.price||0)*(+x.qty||0),0);if(db.budget>0)out+=`<div class="budget-card"><b>€${total.toFixed(2).replace('.',',')} / €${(+db.budget).toFixed(2).replace('.',',')}</b><small>${total>=db.budget?'Budget raggiunto':`Restano €${Math.max(0,db.budget-total).toFixed(2).replace('.',',')}`}</small></div>`} out+='<div class="shopping-list-scroll">';
 lists.forEach(l=>{
   const marketDef=markets.find(m=>m[0].toLowerCase()===l.name.toLowerCase());
   const marketColor=marketDef?marketDef[1]:"#20b94b";
   const groups={}; l.items.forEach(x=>{const cat=x.category||"Altro";if(!groups[cat])groups[cat]=[];groups[cat].push(x)});
   const savedCats=Array.isArray(l.categoryOrder)?l.categoryOrder:[]; const cats=[...savedCats.filter(c=>groups[c]),...Object.keys(groups).filter(c=>!savedCats.includes(c)).sort((a,b)=>a.localeCompare(b))];
   const marketAsset=logoAsset(l.name); const marketLogoClass=['Esselunga','Eurospin'].includes(l.name)?' blue-logo':''; out+=`<section class="photo-market-section"><div class="photo-market-head" style="background:${marketColor}"><div class="photo-market-logo ${marketLogoClass}"><img src="${marketAsset}" alt="${esc(l.name)}"></div><div class="photo-market-title">${esc(l.name.toUpperCase())}</div><div class="market-head-actions"><button type="button" title="Chiudi tutte le categorie" aria-label="Chiudi tutte le categorie" onclick="event.stopPropagation();setAllCategories('${l.id}',false)">−</button><button type="button" title="Apri tutte le categorie" aria-label="Apri tutte le categorie" onclick="event.stopPropagation();setAllCategories('${l.id}',true)">+</button><button type="button" class="market-open-btn" title="Apri o chiudi elenco" aria-label="Apri o chiudi elenco supermercato" onclick="event.stopPropagation();toggleMarketSection('${l.id}')">⌄</button></div></div><div class="photo-market-body" id="body_${l.id}">`;
   cats.forEach((cat,ci)=>{
     const catId=`cat_${l.id}_${ci}`; const cdef=allCategories().find(c=>c[0]===cat)||[cat,"•","#edf0ee"];
     const catItems=groups[cat]; const catLeft=catItems.filter(x=>!x.done).reduce((s,x)=>s+counterUnits(x),0); const catDone=catItems.filter(x=>x.done).reduce((s,x)=>s+counterUnits(x),0); const catComplete=catLeft===0 && catItems.length>0; out+=`<div class="photo-category ${catComplete?'complete-cat':''}" data-drag="category" data-list="${esc(l.id)}" data-cat="${esc(cat)}" style="--category-bg:${cdef[2]}"><button class="photo-category-head" style="--category-bg:${cdef[2]};background-color:${cdef[2]} !important" onclick="toggleCategory('${catId}')"><span class="cat-label"><i style="background:${cdef[2]}">${cdef[1]}</i><em>${esc(cat)}</em></span><small class="cat-status">${catComplete?'✓ Completata':`${fmtQty(catLeft)} da acquistare · ${fmtQty(catDone)} acquistati`}</small><b id="${catId}_chev">+</b></button><div class="photo-category-body" id="${catId}" style="display:none">`;
     groups[cat].slice().sort((a,b)=>(a.order??0)-(b.order??0)).forEach(x=>{
       out+=`<div class="photo-product ${x.done?'checked':''}" data-drag="product" data-list="${esc(l.id)}" data-cat="${esc(cat)}" data-id="${esc(x.id)}" onclick="editItemFromList('${l.id}','${x.id}')"><button class="photo-check ${x.done?'done':''}" onclick="event.stopPropagation();toggleItemInList('${l.id}','${x.id}')">${x.done?'✓':''}</button><div class="product-name">${esc(x.name)}${x.price?`<span class="price-small">€${(+x.price).toFixed(2).replace('.',',')}</span>`:''}</div><div class="qty-control small"><button onclick="event.stopPropagation();changeItemQty('${l.id}','${x.id}',-1)">−</button><input class="qty-inline" inputmode="decimal" type="number" min="0" step="${decimalUnit(x.unit)?'0.1':'1'}" value="${esc(x.qty)}" onclick="event.stopPropagation()" onchange="setItemQty('${l.id}','${x.id}',this.value)"><button onclick="event.stopPropagation();changeItemQty('${l.id}','${x.id}',1)">＋</button></div><div class="product-unit">${esc(x.unit)}</div><button class="photo-del" onclick="event.stopPropagation();deleteItemFromList('${l.id}','${x.id}')">×</button></div>`;
     });
     out+=`</div></div>`;
   });
   out+=`<div class="complete-wrap"><button class="complete" onclick="completeMarket('${l.id}')"><img src="./logo-spesa-facile.jpeg" alt=""> <span>Spesa completata</span></button></div></div></section>`;
 });

 out+='</div>';
 mainEl.innerHTML=out; bindDragAndDrop();
}
function toggleCategory(id){const b=document.getElementById(id),c=document.getElementById(id+'_chev');if(!b)return;const open=b.style.display!=="none";b.style.display=open?"none":"block";if(c)c.textContent=open?"−":"+"}

function setMarketOpen(id,open){const b=document.getElementById('body_'+id);const sec=b?.closest('.photo-market-section');if(!b)return;b.style.display=open?'block':'none';if(sec)sec.classList.toggle('market-collapsed',!open);const btn=sec?.querySelector('.market-open-btn');if(btn){btn.textContent=open?'⌄':'›';btn.title=open?'Chiudi elenco supermercato':'Apri elenco supermercato';btn.setAttribute('aria-label',open?'Chiudi elenco supermercato':'Apri elenco supermercato')}}
function toggleMarketSection(id){const b=document.getElementById('body_'+id);if(!b)return;setMarketOpen(id,b.style.display==='none')}
function setAllCategories(listId,open){const body=document.getElementById('body_'+listId);if(!body)return;body.querySelectorAll('.photo-category-body').forEach((el)=>{el.style.display=open?'block':'none'});body.querySelectorAll('.photo-category-head b').forEach((el)=>{el.textContent=open?'−':'+'});}
function toggleItemInList(listId,itemId){const l=db.lists.find(x=>x.id===listId),x=l?.items.find(x=>x.id===itemId);if(!x)return;const scrollEl=document.querySelector('.shopping-list-scroll');const scrollTop=scrollEl?scrollEl.scrollTop:0;const category=x.category||"Altro";x.done=!x.done;lastToggle={listId,itemId};save();haptic(x.done?"success":"light");render();requestAnimationFrame(()=>{const next=document.querySelector('.shopping-list-scroll');if(next)next.scrollTop=scrollTop;const current=db.lists.find(v=>v.id===listId);const items=current?.items.filter(v=>(v.category||"Altro")===category)||[];if(x.done&&items.length&&items.every(v=>v.done)){const body=document.getElementById('body_'+listId);const heads=body?.querySelectorAll('.photo-category');heads?.forEach(sec=>{if(sec.dataset.cat===category){const catBody=sec.querySelector('.photo-category-body');const sign=sec.querySelector('.photo-category-head b');if(catBody)catBody.style.display='none';if(sign)sign.textContent='+';}});}});toast(x.done?"Aggiunto al carrello!":"Tolto dal carrello",x.done?"Togli dalla spesa":"Chiudi",()=>undo())}
function editItemFromList(listId,itemId){db.active=listId;const x=db.lists.find(l=>l.id===listId)?.items.find(x=>x.id===itemId);if(!x)return;editing=itemId;editingListId=listId;const addAnotherBtn=document.querySelector(".add-another");if(addAnotherBtn)addAnotherBtn.style.display="none";sheetTitleEl.textContent="Modifica prodotto";document.getElementById("confirmProductBtn")&&(document.getElementById("confirmProductBtn").textContent="MODIFICA");fillMarkets(listId,true);marketSelect.value=listId;marketSelect.disabled=true;nameEl.value=x.name;qtyEl.value=x.qty;recurringSetting=((db.recurring||[]).find(r=>r.marketId===listId&&r.name.toLowerCase()===x.name.toLowerCase())||{}).frequency||"";setUnits(x.unit);fillCats(x.category||"");updateFavoriteButton();fillQuick();sheetEl.classList.add("show")}
function deleteItemFromList(listId,itemId){const l=db.lists.find(x=>x.id===listId);if(!l)return;const idx=l.items.findIndex(x=>x.id===itemId);if(idx<0)return;const removed=JSON.parse(JSON.stringify(l.items[idx]));l.items.splice(idx,1);save();haptic('delete');render();toast(`${removed.name} eliminato`,'Annulla',()=>{const target=db.lists.find(x=>x.id===listId);if(!target)return;const insertAt=Math.max(0,Math.min(idx,target.items.length));if(target.items.some(x=>x.id===removed.id))return;target.items.splice(insertAt,0,removed);target.items.sort((a,b)=>(a.order??0)-(b.order??0));save();render();toast(`${removed.name} ripristinato`,'OK')})}
function lists(){
 titleEl.textContent="Supermercati"; subtitleEl.textContent=""; menuTitleEl.textContent="Supermercati"; statsEl.innerHTML=""; document.getElementById("shopTools").innerHTML="";
 const visible=visibleMarkets(); const favSet=new Set(db.favorites||[]);
 const ordered=[...visible].sort((a,b)=>(favSet.has(b[0])-favSet.has(a[0]))||a[0].localeCompare(b[0]));
 let out='<div class="markets-page-intro"><h2>Supermercati</h2><p>Tessera e liste della spesa</p></div><div class="market-list">';
 ordered.forEach(([n,c,logo,kind])=>{
   const l=db.lists.find(x=>x.name.toLowerCase()===n.toLowerCase()), count=l?l.items.filter(x=>!x.done).reduce((s,x)=>s+counterUnits(x),0):0, fav=favSet.has(n), asset=logoAsset(n);
   const logoClass=['Esselunga','Eurospin'].includes(n)?' blue-bg':'';
   const action=l?`<button class="market-action" onclick="event.stopPropagation();selectMarket('${esc(n)}')">Lista spesa</button>`:`<button class="market-action" onclick="event.stopPropagation();createMarketListAndAdd('${esc(n)}')">Crea lista</button>`;
   out+=`<div class="market-row photo-market-row" data-market="${esc(n)}" style="background:${c}"><button type="button" class="market-photo-logo${logoClass}" title="Sostituisci logo" onclick="event.stopPropagation();replaceMarketLogo('${esc(n)}')">${asset?`<img src="${asset}" alt="${esc(n)}">`:'<span>🏪</span>'}</button><div class="market-row-main"><strong>${esc(n.toUpperCase())}</strong><small>${count?fmtQty(count)+" quantità da acquistare":l?'Lista vuota':'Nessuna lista'}</small><div class="market-actions"><button class="market-action" onclick="event.stopPropagation();toggleMarketCard('${esc(n)}')">Tessera</button>${action}</div></div><button class="favorite-star ${fav?'':'off'}" title="Preferito" onclick="event.stopPropagation();toggleFavorite('${esc(n)}')">${fav?'★':'☆'}</button><button type="button" class="market-trash" title="Elimina supermercato" aria-label="Elimina ${esc(n)}" onclick="event.stopPropagation();deleteMarket('${esc(n)}')">🗑</button></div>`;
 });
 out+='</div><div class="new-market-row" onclick="newMarket()"><span>＋</span><strong>Nuovo supermercato</strong><b>›</b></div>'; mainEl.innerHTML=out;
}
function createMarketListAndAdd(name){
 let l=db.lists.find(x=>x.name.toLowerCase()===name.toLowerCase());
 if(!l){l={id:'market_'+name.toLowerCase().replace(/[^a-z0-9]+/g,'_')+'_'+Date.now(),name:name,items:[],categoryOrder:[]};db.lists.push(l)}
 db.active=l.id;db.lastMarket=l.id;save();openAdd();fillMarkets(l.id,false);marketSelect.value=l.id;document.querySelectorAll('.market-choice').forEach(b=>b.classList.toggle('selected',b.getAttribute('onclick')?.includes("'"+l.id+"'")));
}

function toggleFavorite(n){
 const i=db.favorites.indexOf(n);
 if(i>=0)db.favorites.splice(i,1);else db.favorites.push(n);
 save();haptic();render();
}

function syncProductFavorite(marketId,o){
 db.productFavorites=db.productFavorites||[];
 const key=(p)=>String(p.marketId)===String(marketId)&&String(p.name||'').toLowerCase()===String(o.name||'').toLowerCase();
 const idx=db.productFavorites.findIndex(key);
 if(favoriteProductState){
   const l=db.lists.find(x=>String(x.id)===String(marketId));
   const f={marketId,marketName:l?.name||'',name:o.name,qty:String(o.unit).toLowerCase()==='nr'?1:o.qty,unit:o.unit,category:o.category||''};
   if(idx>=0) db.productFavorites[idx]=f; else db.productFavorites.push(f);
 } else if(idx>=0) db.productFavorites.splice(idx,1);
}
let favoriteProductState=false;
function updateFavoriteButton(){
 const marketId=editingListId||marketSelect.value;
 const n=nameEl.value.trim();
 const found=!!n&&(db.productFavorites||[]).some(p=>String(p.marketId)===String(marketId)&&String(p.name||'').toLowerCase()===n.toLowerCase());
 favoriteProductState=found;
 const b=document.getElementById('favoriteProductBtn');
 if(b){b.classList.toggle('on',found);b.innerHTML=found?'★':'☆';b.setAttribute('aria-label',found?'Nei miei prodotti':'Salva tra i miei prodotti');b.title=found?'Rimuovi dai miei prodotti':'Salva tra i miei prodotti'}
}
function toggleProductFavorite(){
 if(favoriteProductState){
   const n=nameEl.value.trim();
   if(!confirm(`Rimuovere "${n||'questo prodotto'}" dai preferiti?`)) return;
 }
 favoriteProductState=!favoriteProductState;
 haptic();
 const b=document.getElementById('favoriteProductBtn');
 if(b){b.classList.toggle('on',favoriteProductState);b.innerHTML=favoriteProductState?'★':'☆';b.setAttribute('aria-label',favoriteProductState?'Nei miei prodotti':'Salva tra i miei prodotti');b.title=favoriteProductState?'Rimuovi dai miei prodotti':'Salva tra i miei prodotti'}
}
function addFavoriteProduct(i){
 const p=db.productFavorites[i]; if(!p)return;
 const l=db.lists.find(x=>String(x.id)===String(p.marketId)); if(!l)return;
 const qty=Math.max(0,+p.qty||1);
 const existing=l.items.find(x=>String(x.name||'').toLowerCase()===String(p.name||'').toLowerCase()&&!x.done);
 if(existing){existing.qty=normalizeQty((+existing.qty||0)+qty,existing.unit||p.unit||'nr');existing.unit=p.unit||existing.unit||'nr';existing.category=p.category||existing.category||'Altro';}
 else l.items.push({id:Date.now().toString()+Math.random().toString(36).slice(2),name:p.name,qty,unit:p.unit||"nr",category:p.category||"Altro",done:false,order:l.items.length,price:0});
 db.active=l.id;db.lastMarket=l.id;save();haptic('success');toast(`${p.name} aggiunto a ${l.name}`,'OK');
}
function fmtQty(n){return Number.isInteger(n)?String(n):n.toFixed(1).replace(/\.0$/,'')}

function encodeCode128B(value){
 const patterns=["11011001100","11001101100","11001100110","10010011000","10010001100","10001001100","10011001000","10011000100","10001100100","11001001000","11001000100","11000100100","10110011100","10011011100","10011001110","10111001100","10011101100","10011100110","11001110010","11001011100","11001001110","11011100100","11001110100","11101101110","11101001100","11100101100","11100100110","11101100100","11100110100","11100110010","11011011000","11011000110","11000110110","10100011000","10001011000","10001000110","10110001000","10001101000","10001100010","11010001000","11000101000","11000100010","10110111000","10110001110","10001101110","10111011000","10111000110","10001110110","11101110110","11010001110","11000101110","11011101000","11011100010","11011101110","11101011000","11101000110","11100010110","11101101000","11101100010","11100011010","11101111010","11001000010","11110001010","10100110000","10100001100","10010110000","10010000110","10000101100","10000100110","10110010000","10110000100","10011010000","10011000010","10000110100","10000110010","11000010010","11001010000","11110111010","11000010100","10001111010","10100111100","10010111100","10010011110","10111100100","10011110100","10011110010","11110100100","11110010100","11110010010","11011011110","11011110110","11110110110","10101111000","10100011110","10001011110","10111101000","10111100010","11110101000","11110100010","10111011110","10111101110","11101011110","11110101110","11010000100","11010010000","11010011100","11000111010"];
 const text=String(value||'').replace(/[^\x20-\x7E]/g,'');
 const vals=[...text].map(ch=>ch.charCodeAt(0)-32);
 let checksum=104; vals.forEach((v,i)=>checksum+=v*(i+1)); checksum%=103;
 const modules='0000000000'+patterns[104]+vals.map(v=>patterns[v]).join('')+patterns[checksum]+patterns[106]+'11'+'0000000000';
 return {modules,text,checksum};
}
function drawBarcodes(){document.querySelectorAll('svg.barcode[data-code]').forEach(svg=>{const {modules,text}=encodeCode128B(svg.dataset.code||'');const w=modules.length;svg.setAttribute('viewBox',`0 0 ${w} 100`);svg.setAttribute('preserveAspectRatio','none');svg.innerHTML='';let i=0;while(i<w){if(modules[i]==='1'){let j=i+1;while(j<w&&modules[j]==='1')j++;const r=document.createElementNS('http://www.w3.org/2000/svg','rect');r.setAttribute('x',i);r.setAttribute('y','4');r.setAttribute('width',j-i);r.setAttribute('height','68');r.setAttribute('fill','#000');svg.appendChild(r);i=j}else i++;}const t=document.createElementNS('http://www.w3.org/2000/svg','text');t.setAttribute('x',w/2);t.setAttribute('y','91');t.setAttribute('text-anchor','middle');t.setAttribute('font-family','Arial, sans-serif');t.setAttribute('font-size','10');t.setAttribute('fill','#111');t.textContent=text;svg.appendChild(t);});}

function toggleMarketCard(name){
 const id='market-card-'+name.toLowerCase().replace(/[^a-z0-9]+/g,'-'); const existing=document.getElementById(id);document.querySelectorAll('.loyalty-panel').forEach(x=>{if(x.id!==id)x.remove()});
 if(existing){existing.remove();return}
 const row=[...document.querySelectorAll('.photo-market-row')].find(r=>r.getAttribute('data-market')===name); if(!row)return;
 const l=db.lists.find(x=>x.name.toLowerCase()===name.toLowerCase()); const card=(db.cards||[]).find(c=>c.marketId===l?.id);
 const panel=document.createElement('div');panel.className='loyalty-panel';panel.id=id;panel.innerHTML=`<div class="loyalty-head"><div><b>Tessera fedeltà</b><small>${esc(name.toUpperCase())}</small></div><button onclick="event.stopPropagation();toggleMarketCard('${esc(name)}')">×</button></div><div class="manual-loyalty"><input id="card_${esc(name).replace(/[^a-zA-Z0-9]/g,'_')}" inputmode="numeric" placeholder="Numero carta" value="${esc(card?.number||'')}"><button onclick="saveMarketCard('${esc(name)}')">Genera</button></div><div class="scan-actions"><button class="greenbtn" onclick="scanMarketCard('${esc(name)}')">📷 Scansiona</button></div>${card?.number?`<div class="generated-card"><div class="generated-number">${esc(card.number)}</div><svg class="barcode" data-code="${esc(card.number)}"></svg></div>`:''}`;
 row.insertAdjacentElement('afterend',panel);drawBarcodes();
}
function saveMarketCard(name){const l=db.lists.find(x=>x.name.toLowerCase()===name.toLowerCase());if(!l)return;const id='card_'+name.replace(/[^a-zA-Z0-9]/g,'_'),input=document.getElementById(id);const n=(input?.value||'').replace(/\s+/g,'').trim();if(!n){alert('Inserisci il numero della tessera.');return}if(!/^[\x20-\x7E]+$/.test(n)){alert('Il numero contiene caratteri non supportati.');return}db.cards=db.cards||[];const old=db.cards.find(c=>c.marketId===l.id);if(old)old.number=n;else db.cards.push({marketId:l.id,name:'Carta fedeltà',number:n});save();haptic('success');toggleMarketCard(name);toggleMarketCard(name)}
async function scanMarketCard(name){
 const id='card_'+name.replace(/[^a-zA-Z0-9]/g,'_'),input=document.getElementById(id); if(!navigator.mediaDevices?.getUserMedia){alert('Fotocamera non disponibile. Inserisci il numero manualmente.');return}
 try{const stream=await navigator.mediaDevices.getUserMedia({video:{facingMode:{ideal:'environment'}}});const video=document.createElement('video');video.setAttribute('playsinline','');video.autoplay=true;video.srcObject=stream;const panel=document.getElementById('market-card-'+name.toLowerCase().replace(/[^a-z0-9]+/g,'-'));const box=document.createElement('div');box.className='camera';box.innerHTML='<div style="color:#fff;font-weight:800;padding:6px">Inquadra il codice a barre</div>';box.prepend(video);panel.appendChild(box);await video.play();if('BarcodeDetector' in window){const det=new BarcodeDetector();const loop=async()=>{if(!video.srcObject)return;try{const codes=await det.detect(video);if(codes[0]?.rawValue){input.value=codes[0].rawValue;stream.getTracks().forEach(t=>t.stop());box.remove();saveMarketCard(name);return}}catch(e){}requestAnimationFrame(loop)};loop()}else alert('Scansione automatica non supportata da questo browser. Inserisci il numero manualmente.')}catch(e){alert('Impossibile accedere alla fotocamera. Usa HTTPS e consenti l’accesso alla fotocamera.')}
}

function toggleHistoryFavorite(historyIndex,itemIndex,btn){const h=db.history?.[historyIndex],p=h?.items?.[itemIndex];if(!h||!p)return;const marketName=h.market||h.name||'';let l=db.lists.find(x=>x.name.toLowerCase()===String(marketName).toLowerCase());if(!l) l=db.lists.find(x=>x.id===db.lastMarket)||db.lists[0];if(!l)return;db.productFavorites=db.productFavorites||[];const idx=db.productFavorites.findIndex(f=>String(f.marketId)===String(l.id)&&String(f.name).toLowerCase()===String(p.name).toLowerCase());if(idx>=0){db.productFavorites.splice(idx,1);if(btn){btn.classList.remove('active');btn.textContent='☆';btn.title='Aggiungi ai miei prodotti';btn.setAttribute('aria-label','Aggiungi ai miei prodotti')}toast(`${p.name} rimosso dai preferiti`,'OK')}else{db.productFavorites.push({marketId:l.id,marketName:l.name,name:p.name,qty:(p.unit||'nr').toLowerCase()==='nr'?1:(p.qty||1),unit:p.unit||'nr',category:p.category||''});if(btn){btn.classList.add('active');btn.textContent='★';btn.title='Nei miei prodotti';btn.setAttribute('aria-label','Nei miei prodotti')}toast(`${p.name} aggiunto ai preferiti`,'OK')}save();haptic('light');} 
function deleteHistory(i){db.history.splice(i,1);save();render()}function repeatHistory(historyIndex,onlyPurchased){
 const h=db.history?.[historyIndex]; if(!h||!Array.isArray(h.items)||!h.items.length)return;
 const marketName=String(h.market||h.name||'Supermercato');
 let l=db.lists.find(x=>x.name.toLowerCase()===marketName.toLowerCase());
 if(!l){l={id:'market_'+marketName.toLowerCase().replace(/[^a-z0-9]+/g,'_')+'_'+Date.now(),name:marketName,items:[],categoryOrder:[]};db.lists.push(l)}
 const source=h.items.filter(x=>!onlyPurchased||x.done);
 if(!source.length){toast('Nessun prodotto acquistato in questa spesa','OK');return}
 const base=Date.now();
 l.items=source.map((x,i)=>({...JSON.parse(JSON.stringify(x)),id:'repeat_'+base+'_'+i,done:false,order:i}));
 db.active=l.id;db.lastMarket=l.id;save();setTab('shop');toast(onlyPurchased?'Lista ricreata con i soli prodotti acquistati':'Lista ricreata dalla spesa passata','OK');
}
function newMarket(){
 const raw=prompt("Nome del nuovo supermercato"); if(!raw?.trim())return; const n=raw.trim().toUpperCase();
 if(visibleMarkets().some(m=>m[0].toLowerCase()===n.toLowerCase())){selectMarket(n);return}
 const id='market_'+n.toLowerCase().replace(/[^a-z0-9]+/g,'_')+'_'+Date.now();
 db.customMarkets.push({name:n,color:'#20b94b',logo:''});
 db.lists.push({id,name:n,items:[],categoryOrder:[]}); db.active=id; db.lastMarket=id; save();
 render(); setTimeout(()=>replaceMarketLogo(n,true),80);
}
function deleteMarket(name){
 const n=String(name||'').trim(); if(!n)return;
 if(!confirm(`Vuoi eliminare il supermercato "${n.toUpperCase()}"?\nLa lista, la tessera e i preferiti associati verranno eliminati.`))return;
 const ids=db.lists.filter(l=>l.name.toLowerCase()===n.toLowerCase()).map(l=>l.id);
 db.lists=db.lists.filter(l=>l.name.toLowerCase()!==n.toLowerCase());
 db.favorites=db.favorites.filter(x=>x.toLowerCase()!==n.toLowerCase());
 db.cards=db.cards.filter(c=>!ids.includes(c.marketId));
 db.productFavorites=db.productFavorites.filter(f=>!ids.includes(f.marketId));
 db.recurring=db.recurring.filter(r=>!ids.includes(r.marketId));
 db.customMarkets=db.customMarkets.filter(m=>String(m.name).toLowerCase()!==n.toLowerCase());
 db.deletedMarkets=db.deletedMarkets||[]; if(!markets.some(m=>m[0].toLowerCase()===n.toLowerCase())){}else if(!db.deletedMarkets.some(x=>String(x).toLowerCase()===n.toLowerCase()))db.deletedMarkets.push(n);
 if(db.active&&ids.includes(db.active))db.active=db.lists[0]?.id||''; if(db.lastMarket&&ids.includes(db.lastMarket))db.lastMarket=db.lists[0]?.id||'';
 save(); render(); toast(`${n.toUpperCase()} eliminato`,'OK');
}
function replaceMarketLogo(name,fromCreation=false){
 const n=String(name||'').trim(); if(!n)return;
 const input=document.createElement('input'); input.type='file'; input.accept='image/*'; input.style.display='none'; document.body.appendChild(input);
 input.onchange=()=>{const f=input.files?.[0];if(!f){input.remove();return}const r=new FileReader();r.onload=()=>{db.customMarketLogos=db.customMarketLogos||{};db.customMarketLogos[n.toLowerCase()]=r.result;const cm=db.customMarkets.find(m=>String(m.name).toLowerCase()===n.toLowerCase());if(cm)cm.logo=r.result;save();input.remove();render();toast('Logo sostituito','OK')};r.readAsDataURL(f)}; input.click();
}
function logoAsset(name){const key=String(name||'').toLowerCase();if(db.customMarketLogos?.[key])return db.customMarketLogos[key];const map={"bennet":"./bennet.png","aldi":"./aldi.png","carrefour":"./carrefour.png","conad":"./conad.png","coop":"./coop.png","esselunga":"./esselunga_blue.png","eurospin":"./eurospin.png","iperal":"./iperal.png","sigma":"./sigma.png","lidl":"./lidl.svg"};return map[key]||""}
function productEmoji(name,cat){const n=name.toLowerCase();const map=[[/pasta|penne|spaghetti/,'🍝'],[/pane/,'🥖'],[/latte|yogurt|formaggio|mozzarella/,'🥛'],[/pomodor/,'🍅'],[/banana/,'🍌'],[/mela/,'🍎'],[/carne|pollo|manzo|maiale/,'🥩'],[/acqua|bibita|cola|succo/,'🥤'],[/uova/,'🥚'],[/biscott|dolce|cioccol/,'🍪'],[/detersiv|sapone|shampoo/,'🧴']];for(const [r,e] of map)if(r.test(n))return e;const c=allCategories().find(x=>x[0]===cat);return c?c[1]:'🛒'}
function changeQty(delta){qtyEl.value=Math.max(0,(+qtyEl.value||0)+delta)}
function changeItemQty(listId,itemId,delta){const l=db.lists.find(x=>x.id===listId),x=l?.items.find(x=>x.id===itemId);if(!x)return;x.qty=Math.max(0,(+x.qty||0)+delta);save();render()}

function preferredMarketId(){
 const fav=(db.favorites||[]).find(n=>visibleMarkets().some(m=>m[0].toLowerCase()===String(n).toLowerCase()));
 if(fav){const l=db.lists.find(x=>x.name.toLowerCase()===String(fav).toLowerCase());if(l)return l.id}
 return '';
}
let marketPickerOpen=false;
function ensureMarketList(name){let l=db.lists.find(x=>x.name.toLowerCase()===String(name).toLowerCase());if(!l){l={id:'market_'+String(name).toLowerCase().replace(/[^a-z0-9]+/g,'_')+'_'+Date.now(),name:String(name).toUpperCase(),items:[],categoryOrder:[]};db.lists.push(l);save()}return l}
function fillMarkets(selected,disabled=false){
 const preferred=preferredMarketId();
 const chosen=selected||preferred;
 marketSelect.innerHTML=db.lists.map(l=>`<option value="${esc(l.id)}">${esc(l.name.toUpperCase())}</option>`).join('');
 marketSelect.disabled=disabled;
 if(chosen)marketSelect.value=chosen;
 const picker=document.getElementById('marketPicker'); if(!picker)return;
 const current=db.lists.find(l=>l.id===marketSelect.value)||null;
 const currentName=current?.name||'';
 const hasSelection=!!currentName;
 picker.innerHTML=`<div class="preferred-market-row">
   <button type="button" class="preferred-market-main ${hasSelection?'has-selection':'no-selection'}" onclick="event.stopPropagation();${disabled?'':'toggleMarketChoices()'}">
     ${hasSelection?`<span class="preferred-market-logo"><img src="${logoAsset(currentName)}" alt="${esc(currentName)}"></span>`:'<span class="preferred-market-logo placeholder-logo">🏪</span>'}
     <span><small>SUPERMERCATO</small><strong>${hasSelection?esc(currentName.toUpperCase()):'SELEZIONA SUPERMERCATO'}</strong></span>
   </button>
   ${disabled?'':'<button type="button" class="market-change-btn" onclick="event.stopPropagation();toggleMarketChoices()">CAMBIA</button>'}
 </div>
 <div class="market-choice-grid ${marketPickerOpen?'open':''}" id="marketChoiceGrid">${markets.map(m=>{const l=db.lists.find(x=>x.name.toLowerCase()===m[0].toLowerCase());return `<button type="button" class="market-choice compact ${l&&l.id===marketSelect.value?'selected':''}" onclick="pickMarketByName('${esc(m[0])}')"><img src="${logoAsset(m[0])}" alt="${esc(m[0])}"><span>${esc(m[0].toUpperCase())}</span></button>`}).join('')}</div>`;
}
function toggleMarketChoices(){marketPickerOpen=!marketPickerOpen;fillMarkets(marketSelect.value,marketSelect.disabled)}
function pickMarketByName(name){const l=ensureMarketList(name);marketSelect.value=l.id;marketPickerOpen=false;fillMarkets(l.id,marketSelect.disabled);updateFavoriteButton();}
function pickMarket(id){if(!id)return;marketSelect.value=id;marketPickerOpen=false;fillMarkets(id,marketSelect.disabled);updateFavoriteButton();}
function openAdd(){
 marketPickerOpen=false;
 editing=null;editingListId=null;
 const addAnotherBtn=document.querySelector(".add-another"); if(addAnotherBtn)addAnotherBtn.style.display="block";
 sheetTitleEl.textContent="Aggiungi prodotto";document.getElementById("confirmProductBtn")&&(document.getElementById("confirmProductBtn").textContent="AGGIUNGI");fillMarkets((db.favorites||[]).length?preferredMarketId():'',false);nameEl.value="";recurringSetting="";document.getElementById("recurringOptions")&&(document.getElementById("recurringOptions").style.display="none");const lp=db.lastProductSettings||{qty:1,unit:"nr",category:""};qtyEl.value=lp.qty??1;setUnits(lp.unit||"nr");fillCats(lp.category||"");updateFavoriteButton();fillQuick();sheetEl.classList.add("show");setTimeout(()=>nameEl.focus(),100);
}
function editItem(id){
 const l=L(),x=l.items.find(x=>x.id===id);if(!x)return;editing=id;editingListId=l.id;
 const addAnotherBtn=document.querySelector(".add-another"); if(addAnotherBtn)addAnotherBtn.style.display="none";
 sheetTitleEl.textContent="Modifica prodotto";document.getElementById("confirmProductBtn")&&(document.getElementById("confirmProductBtn").textContent="MODIFICA");fillMarkets(l.id,true);nameEl.value=x.name;qtyEl.value=x.qty;recurringSetting=((db.recurring||[]).find(r=>r.marketId===l.id&&r.name.toLowerCase()===x.name.toLowerCase())||{}).frequency||"";setUnits(x.unit);fillCats(x.category||"");updateFavoriteButton();fillQuick();sheetEl.classList.add("show");
}
function setUnits(sel){unitsEl.innerHTML=unitsList.map(u=>`<button type="button" class="unit ${u===sel?"on":""}" onclick="setUnits('${u}')">${u}</button>`).join("")}
function updateCategoryPreview(){const el=document.getElementById('categoryIconPreview');if(!el)return;const c=allCategories().find(x=>x[0]===categoryEl.value)||['','•','#edf0ee'];el.textContent=c[1]||'•';el.style.background=c[2]||'#edf0ee';}
function fillCats(sel){categoryEl.innerHTML='<option value="">Nessuna categoria</option>'+allCategories().map(c=>`<option value="${esc(c[0])}" ${c[0]===sel?"selected":""}>${esc(c[1])} ${esc(c[0])}</option>`).join('');updateCategoryPreview()}
function fillQuick(){if(quickEl)quickEl.innerHTML=''}
function closeSheet(){marketPickerOpen=false;sheetEl.classList.remove("show");marketSelect.disabled=false}
function saveItem(keepOpen=false){
 const n=nameEl.value.trim();if(!n){nameEl.focus();return}
 const listId=editingListId||marketSelect.value;const l=db.lists.find(x=>x.id===listId);if(!l)return;
 const wasEditing=!!editing;const old=editing?l.items.find(x=>x.id===editing):null;
 const unit=document.querySelector(".unit.on")?.textContent||"nr";
 const o={id:editing||Date.now().toString(),name:n,qty:Math.max(0,+qtyEl.value||1),unit,category:categoryEl.value,done:old?.done||false,order:old?.order??l.items.length};
 if(editing){const i=l.items.findIndex(x=>x.id===editing);if(i<0)return;l.items[i]=o}
 else {const duplicate=l.items.find(x=>x.name.toLowerCase()===n.toLowerCase()&&!x.done);if(duplicate){duplicate.qty=Math.max(0,(+duplicate.qty||0)+(+o.qty||0));duplicate.unit=o.unit;duplicate.category=o.category||duplicate.category}else l.items.push(o)}
 db.active=l.id;db.lastMarket=l.id;db.recent=[n,...db.recent.filter(x=>x.toLowerCase()!==n.toLowerCase())].slice(0,30);db.lastProductSettings={qty:o.qty,unit:o.unit,category:o.category||''};syncProductFavorite(l.id,o);save();haptic();
 if(keepOpen&&!wasEditing){const previousMarketId=l.id;const previousCategory=o.category||'';const previousUnit=o.unit||'nr';editing=null;editingListId=null;sheetTitleEl.textContent="Aggiungi prodotto";document.getElementById("confirmProductBtn")&&(document.getElementById("confirmProductBtn").textContent="AGGIUNGI");marketSelect.disabled=false;nameEl.value="";marketPickerOpen=false;fillMarkets(previousMarketId,false);marketSelect.value=previousMarketId;fillCats(previousCategory);qtyEl.value=1;setUnits(previousUnit);recurringSetting='';const ro=document.getElementById('recurringOptions');if(ro)ro.style.display='none';updateFavoriteButton();fillQuick();render();toast(`✓ ${n} aggiunto`,'OK');setTimeout(()=>nameEl.focus(),80);return}
 closeSheet();toast(`✓ ${n} ${wasEditing?'modificato':'aggiunto'} a ${l.name.toUpperCase()}`,'OK');render();
}
function toggleItem(id){const l=L(),x=l.items.find(x=>x.id===id);if(!x)return;x.done=!x.done;lastToggle={listId:l.id,itemId:id};save();render();toast(x.done?"Aggiunto al carrello!":"Tolto dal carrello",x.done?"Togli dalla spesa":"Riporta nella spesa")}
function haptic(kind='light'){try{if(!('vibrate' in navigator))return;const pattern=kind==='success'?[12,25,18]:kind==='delete'?[8,18,8]:12;navigator.vibrate(pattern)}catch(e){}}
let lastUndoAction=null;
function runUndo(){if(typeof lastUndoAction==='function'){const fn=lastUndoAction;lastUndoAction=null;fn();haptic('success')}}
function toast(msg,action,undoFn=null){lastUndoAction=undoFn;toastMsgEl.textContent=msg;toastUndoEl.textContent=action||'Annulla';document.querySelector('.toast').classList.add('show');clearTimeout(window.tt);window.tt=setTimeout(()=>{document.querySelector('.toast').classList.remove('show');lastUndoAction=null},2800)}
function undo(){if(!lastToggle)return;const l=db.lists.find(x=>x.id===lastToggle.listId),x=l?.items.find(x=>x.id===lastToggle.itemId);if(x){x.done=!x.done;save();render();toast(x.done?"Aggiunto al carrello!":"Tolto dalla spesa",x.done?"Togli dalla spesa":"Riporta nella spesa")}}
function deleteItem(id){const l=L();l.items=l.items.filter(x=>x.id!==id);save();render()}
function selectList(id){db.active=id;save();setTab("shop")}
function selectMarket(n){let l=db.lists.find(x=>x.name.toLowerCase()===n.toLowerCase());if(!l){l={id:Date.now().toString(),name:n.toUpperCase(),items:[]};db.lists.push(l)}db.active=l.id;save();setTab("shop")}
function deleteList(id){if(db.lists.length===1)return;if(!confirm("Eliminare questa lista?"))return;db.lists=db.lists.filter(x=>x.id!==id);if(db.active===id)db.active=db.lists[0].id;save();render()}
function quick(n){openAdd();nameEl.value=n}
function esc(x){return String(x).replace(/[&<>"']/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[m]))}

function bindDragAndDrop(){
 document.querySelectorAll('[data-drag]').forEach(el=>{
  const target=el.dataset.drag==='category'?el.querySelector('.photo-category-head'):el;
  if(!target)return; let timer=null,dragging=false;
  const clear=()=>{if(timer){clearTimeout(timer);timer=null}};
  const ignored=e=>!!e.target.closest('button:not(.photo-category-head),input,select,textarea');
  const start=e=>{if(ignored(e))return; clear(); timer=setTimeout(()=>{dragging=true;el.classList.add('dragging');haptic();try{target.setPointerCapture(e.pointerId)}catch(_){}},350)};
  const move=e=>{if(!dragging)return;e.preventDefault();e.stopPropagation();const selector=el.dataset.drag==='category'?'.photo-category[data-drag="category"]':'.photo-product[data-drag="product"]';const under=document.elementFromPoint(e.clientX,e.clientY)?.closest(selector);if(!under||under===el||under.dataset.list!==el.dataset.list)return;if(el.dataset.drag==='product'&&under.dataset.cat!==el.dataset.cat)return;const r=under.getBoundingClientRect();under.parentNode.insertBefore(el,e.clientY<r.top+r.height/2?under:under.nextSibling)};
  const end=e=>{clear();if(!dragging)return;dragging=false;el.classList.remove('dragging');saveDragOrder(el);save();haptic('success');try{target.releasePointerCapture(e.pointerId)}catch(_){}render()};
  target.addEventListener('pointerdown',start,{passive:false});target.addEventListener('pointermove',move,{passive:false});target.addEventListener('pointerup',end);target.addEventListener('pointercancel',end);target.addEventListener('pointerleave',e=>{if(!dragging)clear()});
 });
}
function saveDragOrder(el){const listId=el.dataset.list,l=db.lists.find(x=>x.id===listId);if(!l)return;if(el.dataset.drag==='product'){const cat=el.dataset.cat;const body=el.parentElement;[...body.querySelectorAll(':scope > .photo-product')].forEach((node,i)=>{const x=l.items.find(it=>it.id===node.dataset.id);if(x)x.order=i})}else{const body=el.parentElement;const names=[...body.querySelectorAll(':scope > .photo-category')].map(n=>n.dataset.cat);l.categoryOrder=names;}}


// ---- V15 enhancements ----
let wakeLock=null;
async function requestWakeLock(){try{if('wakeLock' in navigator){wakeLock=await navigator.wakeLock.request('screen');wakeLock.addEventListener?.('release',()=>{wakeLock=null});}}catch(e){}}
async function releaseWakeLock(){try{await wakeLock?.release();}catch(e){}wakeLock=null}
function toggleStoreMode(){db.storeMode=!db.storeMode;save();if(db.storeMode)requestWakeLock();else releaseWakeLock();applyStoreMode();render()}
function applyStoreMode(){const active=db.storeMode&&currentTab==='shop';document.querySelector('.app').classList.toggle('store-mode-active',active);document.body.classList.toggle('store-mode-body',active);document.getElementById('bottomnav').style.display=active?'none':'';document.getElementById('floatingAdd').style.display='none';if(active)requestWakeLock();else releaseWakeLock()}
window.addEventListener('visibilitychange',()=>{if(document.visibilityState==='visible'&&db.storeMode&&currentTab==='shop')requestWakeLock()});
function decimalUnit(u){return ['kg','g','l','ml'].includes(String(u).toLowerCase())}
function qtyStepForItem(x){return decimalUnit(x.unit)?0.1:1}
function normalizeQty(v,unit){const n=Math.max(0,Number(v)||0);return decimalUnit(unit)?Math.round(n*10)/10:Math.round(n)}
function changeQty(delta){const unit=document.querySelector('.unit.on')?.textContent||'nr';qtyEl.value=normalizeQty((+qtyEl.value||0)+delta*(decimalUnit(unit)?0.1:1),unit);updateQtyInputStep()}
function updateQtyInputStep(){if(qtyEl)qtyEl.step=decimalUnit(document.querySelector('.unit.on')?.textContent||'nr')?'0.1':'1'}
function setUnits(sel){unitsEl.innerHTML=unitsList.map(u=>`<button type="button" class="unit ${u===sel?'on':''}" onclick="setUnits('${u}')">${u}</button>`).join('');updateQtyInputStep()}
function changeItemQty(listId,itemId,delta){const l=db.lists.find(x=>x.id===listId),x=l?.items.find(x=>x.id===itemId);if(!x)return;const scrollEl=document.querySelector('.shopping-list-scroll');const scrollTop=scrollEl?scrollEl.scrollTop:0;x.qty=normalizeQty((+x.qty||0)+delta*qtyStepForItem(x),x.unit);save();render();requestAnimationFrame(()=>{const next=document.querySelector('.shopping-list-scroll');if(next)next.scrollTop=scrollTop;});}
function counterUnits(x){const u=String(x?.unit||'nr').toLowerCase().trim();return ['nr','pz','conf','confezione','confezioni'].includes(u)?Math.max(0,Number(x?.qty)||0):1} function statsQty(){const all=db.lists.flatMap(l=>l.items||[]);return {left:all.filter(x=>!x.done).reduce((s,x)=>s+counterUnits(x),0),done:all.filter(x=>x.done).reduce((s,x)=>s+counterUnits(x),0),total:all.reduce((s,x)=>s+counterUnits(x),0)}}
function exportData(){const payload={app:'Spesa Facile',version:32,exportedAt:new Date().toISOString(),data:db};const blob=new Blob([JSON.stringify(payload,null,2)],{type:'application/json'});const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download='spesa-facile-backup-'+new Date().toISOString().slice(0,10)+'.json';a.click();setTimeout(()=>URL.revokeObjectURL(a.href),1000)}
function importData(e){const f=e.target.files?.[0];if(!f)return;const r=new FileReader();r.onload=()=>{try{const payload=JSON.parse(r.result);const d=payload.data||payload;if(!d||!Array.isArray(d.lists))throw new Error('Formato non valido');if(!confirm('Sostituire i dati attuali con il backup selezionato?'))return;db=d;db.lists=Array.isArray(db.lists)?db.lists:[];db.history=Array.isArray(db.history)?db.history:[]; db.theme='light'; document.body.dataset.theme='light';db.customCategories=Array.isArray(db.customCategories)?db.customCategories:[];db.hiddenCategories=Array.isArray(db.hiddenCategories)?db.hiddenCategories:[];db.categoryRenames=(db.categoryRenames&&typeof db.categoryRenames==='object')?db.categoryRenames:{};db.productFavorites=Array.isArray(db.productFavorites)?db.productFavorites:[];db.recurring=Array.isArray(db.recurring)?db.recurring:[];db.budget=Number.isFinite(+db.budget)?+db.budget:0;db.favorites=Array.isArray(db.favorites)?db.favorites:[];db.cards=Array.isArray(db.cards)?db.cards:[];db.active=db.active&&db.lists.some(x=>x.id===db.active)?db.active:db.lists[0]?.id;db.theme='light';document.body.dataset.theme='light';save();closeSettings();render();alert('Backup importato correttamente.')}catch(err){alert('File di backup non valido.')}finally{e.target.value=''}};r.readAsText(f)}
function setTheme(theme){db.theme=theme==='dark'?'dark':'light';document.body.dataset.theme=db.theme;save();updateThemeButtons()}
function updateThemeButtons(){document.getElementById('themeLightBtn')?.classList.toggle('active',db.theme==='light');document.getElementById('themeDarkBtn')?.classList.toggle('active',db.theme==='dark')}
function openSettings(){updateThemeButtons();const b=document.getElementById('budgetInput');if(b)b.value=db.budget||'';document.getElementById('settingsModal').classList.add('show')}
function closeSettings(){document.getElementById('settingsModal').classList.remove('show')}
function manageCategories(){renderCategoryManager();document.getElementById('categoryModal').classList.add('show')}
function categoryBaseFor(name){return categoryData.find(c=>c[0]===name||((db.categoryRenames||{})[c[0]]===name))||null;}
function renderCategoryManager(){const box=document.getElementById('categoryManagerList');const all=allCategories();box.innerHTML=all.map(c=>`<div class="category-manager-row"><span class="cm-icon" style="background:${c[2]}">${c[1]}</span><span class="cm-name">${esc(c[0])}</span><button class="cm-edit" onclick="editAnyCategory('${esc(c[0])}')">RINOMINA</button><button class="cm-delete" onclick="deleteAnyCategory('${esc(c[0])}')">ELIMINA</button></div>`).join('')}
function addCustomCategory(){const name=prompt('Nome nuova categoria');if(!name?.trim())return;const n=name.trim();if(allCategories().some(c=>c[0].toLowerCase()===n.toLowerCase())){alert('Esiste già una categoria con questo nome.');return}const icon=prompt('Icona/emoji (facoltativa)','•')||'•';const color=prompt('Colore HEX (facoltativo)','#edf0ee')||'#edf0ee';db.customCategories.push({name:n,icon,color:/^#[0-9a-f]{6}$/i.test(color)?color:'#edf0ee'});save();renderCategoryManager();fillCats(n)}
function editAnyCategory(oldName){const custom=db.customCategories.find(x=>x.name===oldName);const base=categoryBaseFor(oldName);const name=prompt('Nuovo nome della categoria',oldName);if(!name?.trim()||name.trim()===oldName)return;const n=name.trim();if(allCategories().some(c=>c[0].toLowerCase()===n.toLowerCase()&&c[0].toLowerCase()!==oldName.toLowerCase())){alert('Esiste già una categoria con questo nome.');return}db.lists.forEach(l=>(l.items||[]).forEach(x=>{if(x.category===oldName)x.category=n}));db.lists.forEach(l=>{if(Array.isArray(l.categoryOrder))l.categoryOrder=l.categoryOrder.map(c=>c===oldName?n:c)});if(custom)custom.name=n;else if(base){db.categoryRenames=db.categoryRenames||{};db.categoryRenames[base[0]]=n;}save();renderCategoryManager();fillCats(n);render()}
function deleteAnyCategory(name){if(name==='Altro'){alert('La categoria Altro non può essere eliminata.');return}if(!confirm(`Eliminare la categoria "${name}"? I prodotti verranno spostati in "Altro".`))return;const custom=db.customCategories.find(x=>x.name===name);const base=categoryBaseFor(name);db.lists.forEach(l=>(l.items||[]).forEach(x=>{if(x.category===name)x.category='Altro'}));db.lists.forEach(l=>{if(Array.isArray(l.categoryOrder))l.categoryOrder=l.categoryOrder.filter(c=>c!==name)});if(custom)db.customCategories=db.customCategories.filter(x=>x.name!==name);else if(base){db.hiddenCategories=db.hiddenCategories||[];if(!db.hiddenCategories.includes(base[0]))db.hiddenCategories.push(base[0]);if(db.categoryRenames)delete db.categoryRenames[base[0]];}save();renderCategoryManager();fillCats('Altro');render()}
function closeCategoryManager(){document.getElementById('categoryModal').classList.remove('show')}
function addCategory(){addCustomCategory()}
function saveItem(keepOpen=false){
 const n=nameEl.value.trim();if(!n){nameEl.focus();return}
 const listId=editingListId||marketSelect.value;const l=db.lists.find(x=>x.id===listId);if(!l)return;
 const wasEditing=!!editing;const old=editing?l.items.find(x=>x.id===editing):null;
 const unit=document.querySelector('.unit.on')?.textContent||'nr';const price=0;
 const o={id:editing||Date.now().toString(),name:n,qty:normalizeQty(qtyEl.value,unit),unit,category:categoryEl.value,done:old?.done||false,order:old?.order??l.items.length,price};
 if(editing){const i=l.items.findIndex(x=>x.id===editing);if(i<0)return;l.items[i]=o}
 else {const duplicate=l.items.find(x=>x.name.toLowerCase()===n.toLowerCase()&&!x.done);if(duplicate){duplicate.qty=normalizeQty((+duplicate.qty||0)+(+o.qty||0),unit);duplicate.unit=unit;duplicate.category=o.category||duplicate.category;duplicate.price=0}else l.items.push(o)}
 db.active=l.id;db.lastMarket=l.id;db.recent=[n,...db.recent.filter(x=>x.toLowerCase()!==n.toLowerCase())].slice(0,30);db.lastProductSettings={qty:o.qty,unit:o.unit,category:o.category||''};syncProductFavorite(l.id,o);updateRecurringForProduct(l.id,o);save();haptic();
 if(keepOpen&&!wasEditing){const previousMarketId=l.id;const previousCategory=o.category||'';editing=null;editingListId=null;sheetTitleEl.textContent='Aggiungi prodotto';document.getElementById('confirmProductBtn')&&(document.getElementById('confirmProductBtn').textContent='AGGIUNGI');marketSelect.disabled=false;nameEl.value='';marketPickerOpen=false;fillMarkets(previousMarketId,false);marketSelect.value=previousMarketId;fillCats(previousCategory);qtyEl.value=1;setUnits(o.unit||'nr');recurringSetting='';const ro=document.getElementById('recurringOptions');if(ro)ro.style.display='none';updateFavoriteButton();fillQuick();render();toast(`✓ ${n} aggiunto`,'OK');setTimeout(()=>nameEl.focus(),80);return}
 closeSheet();toast(`✓ ${n} ${wasEditing?'modificato':'aggiunto'} a ${l.name.toUpperCase()}`,'OK');render()
}let recurringSetting='';
function toggleRecurringSetting(){const el=document.getElementById('recurringOptions');if(recurringSetting){recurringSetting='';document.querySelectorAll('.recurring-options button').forEach(b=>b.classList.remove('on'));document.getElementById('recurringBtn').innerHTML='↻ &nbsp; Prodotto ricorrente';if(el)el.style.display='none'}else if(el)el.style.display='grid'}
function setRecurring(v){recurringSetting=v;document.querySelectorAll('.recurring-options button').forEach(b=>b.classList.toggle('on',b.getAttribute('onclick')?.includes(`'${v}'`)));document.getElementById('recurringBtn').innerHTML='↻ &nbsp; Ricorrente: '+({weekly:'settimanale',biweekly:'ogni 2 settimane',monthly:'mensile'}[v])}
function updateRecurringForProduct(marketId,o){db.recurring=db.recurring||[];const idx=db.recurring.findIndex(r=>r.marketId===marketId&&r.name.toLowerCase()===o.name.toLowerCase());if(recurringSetting){const r={marketId,name:o.name,qty:o.qty,unit:o.unit,category:o.category||'Altro',frequency:recurringSetting};if(idx>=0)db.recurring[idx]=r;else db.recurring.push(r)}else if(idx>=0)db.recurring.splice(idx,1)}
function setItemQty(listId,itemId,value){const l=db.lists.find(x=>x.id===listId),x=l?.items.find(x=>x.id===itemId);if(!x)return;const scrollEl=document.querySelector('.shopping-list-scroll');const scrollTop=scrollEl?scrollEl.scrollTop:0;x.qty=normalizeQty(value,x.unit);save();render();requestAnimationFrame(()=>{const next=document.querySelector('.shopping-list-scroll');if(next)next.scrollTop=scrollTop;});}
function getSmartSuggestions(){const current=new Set(db.lists.flatMap(l=>l.items||[]).filter(x=>!x.done).map(x=>x.name.toLowerCase())),counts={};(db.history||[]).forEach(h=>(h.items||[]).forEach(p=>{if(p.done){const k=p.name.toLowerCase();counts[k] ||= {name:p.name,marketId:(db.lists.find(l=>l.name.toLowerCase()===String(h.market||'').toLowerCase())||{}).id||db.lastMarket,count:0};counts[k].count++}}));return Object.values(counts).filter(x=>x.count>=2&&!current.has(x.name.toLowerCase())).sort((a,b)=>b.count-a.count).slice(0,5)}
function addSuggested(name,marketId){const l=db.lists.find(x=>x.id===marketId)||db.lists.find(x=>x.id===db.lastMarket)||db.lists[0];if(!l)return;const ex=l.items.find(x=>x.name.toLowerCase()===name.toLowerCase()&&!x.done);if(ex)ex.qty=normalizeQty((+ex.qty||0)+1,ex.unit);else l.items.push({id:Date.now().toString()+Math.random(),name,qty:1,unit:'nr',category:'Altro',done:false,order:l.items.length,price:0});db.active=l.id;save();render();toast(`${name} aggiunto`,'OK')}
function addRecurringProduct(name,marketId){const r=(db.recurring||[]).find(x=>x.marketId===marketId&&x.name.toLowerCase()===name.toLowerCase());if(!r)return;const l=db.lists.find(x=>x.id===marketId)||db.lists[0];if(!l)return;l.items.push({id:Date.now().toString()+Math.random(),name:r.name,qty:r.qty||1,unit:r.unit||'nr',category:r.category||'Altro',done:false,order:l.items.length,price:0});db.active=l.id;save();setTab('shop');toast(`${name} aggiunto`,'OK')}
async function shareCurrentList(){const l=L();if(!l)return;const text=`Spesa Facile - ${l.name}\n`+(l.items||[]).map(p=>`${p.done?'✓':'□'} ${p.name} — ${p.qty} ${p.unit}`).join('\n');try{if(navigator.share)await navigator.share({title:`Lista ${l.name}`,text});else if(navigator.clipboard){await navigator.clipboard.writeText(text);toast('Lista copiata negli appunti','OK')}}catch(e){}}
function setBudget(v){db.budget=Math.max(0,Number(v)||0);save();const b=document.getElementById('budgetInput');if(b)b.value=db.budget||'';render();toast(db.budget?`Budget impostato a €${db.budget.toFixed(2)}`:'Budget rimosso','OK')}
let productsSearch='';
function products(){titleEl.textContent='I miei prodotti';subtitleEl.textContent='';menuTitleEl.textContent='I miei prodotti';statsEl.innerHTML='';document.getElementById('shopTools').innerHTML='';mainEl.innerHTML=`<div class="products-toolbar"><input class="products-search" id="productsSearch" value="${esc(productsSearch)}" placeholder="Cerca nei miei prodotti" enterkeyhint="search" autocomplete="off" autocorrect="off" spellcheck="false" oninput="productsSearch=this.value;renderProductsResults()"></div><div id="productsResults"></div>`;renderProductsResults()}
function myProductMeasure(p){
 const u=String(p?.unit||'nr').toLowerCase();
 const label={nr:'nr',pz:'pz',l:'lt',ml:'ml',g:'gr',kg:'kg'}[u]||u;
 const q=fmtQty(Math.max(0,+p?.qty||1));
 return `${label}. ${q}`;
}
function renderProductsResults(){const box=document.getElementById('productsResults');if(!box)return;const q=productsSearch.trim().toLowerCase();const favs=(db.productFavorites||[]).map((p,i)=>({...p,_i:i})).filter(p=>!q||p.name.toLowerCase().includes(q)||(p.category||'').toLowerCase().includes(q));if(!favs.length){box.innerHTML='<div class="empty">Nessun prodotto salvato nei preferiti.</div>';return}const grouped={};favs.forEach(p=>{const marketName=(db.lists.find(l=>l.id===p.marketId)?.name)||p.marketName||'Supermercato';(grouped[marketName] ||= []).push(p)});let out='';Object.entries(grouped).forEach(([marketName,items],mi)=>{const def=markets.find(m=>m[0].toLowerCase()===marketName.toLowerCase());const color=def?.[1]||'#20b94b';const marketId='myp_market_'+mi+'_'+String(marketName).replace(/[^a-z0-9]+/gi,'_');const groups={};items.forEach(p=>(groups[p.category||'Altro'] ||= []).push(p));out+=`<section class="favorite-market-section my-products-market" id="${marketId}_section"><div class="favorite-market-head my-products-market-head" style="--market-color:${color};"><div class="my-products-market-title"><img src="${logoAsset(marketName)}" alt="${esc(marketName)}"><strong>${esc(marketName.toUpperCase())}</strong></div><div class="my-products-market-actions"><button type="button" title="Chiudi tutte le categorie" aria-label="Chiudi tutte le categorie" onclick="setAllMyProductCategories('${marketId}',false,event)">−</button><button type="button" title="Apri tutte le categorie" aria-label="Apri tutte le categorie" onclick="setAllMyProductCategories('${marketId}',true,event)">+</button><button type="button" class="my-products-market-open" title="Apri o chiudi elenco" aria-label="Apri o chiudi elenco supermercato" onclick="event.stopPropagation();toggleMyProductsMarket('${marketId}')">⌄</button></div></div><div class="my-products-market-body" id="${marketId}_body">`;Object.entries(groups).sort((a,b)=>a[0].localeCompare(b[0])).forEach(([cat,products])=>{const cdef=allCategories().find(c=>c[0]===cat)||[cat,'•','#edf0ee'];const safe=marketId+'_cat_'+String(cat).replace(/[^a-z0-9]+/gi,'_');out+=`<div class="my-products-category"><button class="my-products-category-head" onclick="toggleMyProductsCategory('${safe}',event)"><span><i style="background:${cdef[2]}">${cdef[1]}</i>${esc(cat)}</span><b id="${safe}_sign">−</b></button><div id="${safe}" class="my-products-category-body">`;products.sort((a,b)=>a.name.localeCompare(b.name)).forEach(p=>{out+=`<div class="my-product-row"><div class="my-product-name"><b>${esc(p.name)}</b><small>${myProductMeasure(p)}</small></div><button class="my-product-fav" title="Rimuovi dai preferiti" aria-label="Rimuovi ${esc(p.name)} dai preferiti" onclick="event.stopPropagation();removeFavoriteFromMyProducts(${p._i})">★</button><button class="my-product-add" onclick="event.stopPropagation();addFavoriteProduct(${p._i})">AGGIUNGI</button></div>`});out+='</div></div>'});out+='</div></section>'});box.innerHTML=out}
function toggleMyProductsMarket(id){const body=document.getElementById(id+'_body'),section=document.getElementById(id+'_section'),btn=section?.querySelector('.my-products-market-open');if(!body)return;const open=body.style.display!=='none';body.style.display=open?'none':'block';section?.classList.toggle('market-collapsed',open);if(btn)btn.textContent=open?'›':'⌄'}
function setAllMyProductCategories(id,open,e){if(e){e.preventDefault();e.stopPropagation()}const body=document.getElementById(id+'_body');if(!body)return;body.querySelectorAll('.my-products-category-body').forEach(b=>b.style.setProperty('display',open?'block':'none','important'));body.querySelectorAll('.my-products-category-head b').forEach(b=>{b.textContent=open?'−':'+'})}
function toggleMyProductsCategory(id,e){if(e){e.preventDefault();e.stopPropagation()}const body=document.getElementById(id),sign=document.getElementById(id+'_sign');if(!body)return;const open=body.style.display!=='none';body.style.setProperty('display',open?'none':'block','important');if(sign)sign.textContent=open?'+':'−'}
function removeFavoriteFromMyProducts(index){const p=db.productFavorites?.[index];if(!p)return;if(!confirm(`Rimuovere "${p.name}" dai preferiti?`))return;db.productFavorites.splice(index,1);save();haptic('light');render();toast(`${p.name} rimosso dai preferiti`,'OK')}
function history(){titleEl.textContent='Spese passate';subtitleEl.textContent='';menuTitleEl.textContent='Spese passate';statsEl.innerHTML='';document.getElementById('shopTools').innerHTML='';const h=db.history||[];if(!h.length){mainEl.innerHTML='<div class="empty">Non hai ancora completato una spesa.</div>';return}mainEl.innerHTML=h.map((x,i)=>{const products=Array.isArray(x.items)?x.items:[];const total=products.reduce((s,p)=>s+(+p.price||0)*(+p.qty||0),0);return `<div class="card history-card history-toggle" id="hist_${i}" onclick="toggleHistory(${i})"><div class="history-icon">🛍️</div><div class="history-main"><div class="item-name">${esc(x.name||'Spesa')}</div><div class="history-date">${esc(x.date)} · ${products.length} prodotti${total?` · €${total.toFixed(2).replace('.',',')}`:''}</div></div><span class="history-chevron" id="histchev_${i}">⌄</span><button class="trash" onclick="event.stopPropagation();deleteHistory(${i})">🗑</button></div><div class="history-products" id="histprod_${i}">${products.length?products.map((p,j)=>{const marketName=x.market||x.name||'';const isFav=(db.productFavorites||[]).some(f=>String(f.marketId)===String((db.lists.find(l=>l.name.toLowerCase()===String(marketName).toLowerCase())||{}).id||'')&&String(f.name).toLowerCase()===String(p.name).toLowerCase());return `<div class="history-product"><span class="history-product-name">${esc(p.unit||'nr')} ${esc(p.qty)} · ${esc(p.name)}</span><button class="history-fav-star ${isFav?'active':''}" title="${isFav?'Nei miei prodotti':'Aggiungi ai miei prodotti'}" aria-label="${isFav?'Nei miei prodotti':'Aggiungi ai miei prodotti'}" onclick="event.stopPropagation();toggleHistoryFavorite(${i},${j},this)">${isFav?'★':'☆'}</button></div>`}).join('')+`<div class="history-actions"><button onclick="event.stopPropagation();repeatHistory(${i},false)">↻ Ripeti</button><button onclick="event.stopPropagation();repeatHistory(${i},true)">✓ Solo acquistati</button></div>`:'<div class="smallnote">Nessun dettaglio disponibile.</div>'}</div>`}).join('')}
function toggleHistory(i){const el=document.getElementById('histprod_'+i),c=document.getElementById('histchev_'+i);if(!el)return;const open=el.classList.toggle('open');document.getElementById('hist_'+i)?.classList.toggle('open',open);if(c)c.textContent=open?'⌃':'⌄'}
db.theme='light'; document.body.dataset.theme='light';
render();
setTimeout(drawBarcodes,0);
marketSelect.addEventListener("change",()=>fillMarkets(marketSelect.value,marketSelect.disabled));
document.getElementById("name").addEventListener("input",updateFavoriteButton);categoryEl.addEventListener("change",updateCategoryPreview);document.getElementById("name").addEventListener("keydown",e=>{if(e.key==="Enter"){e.preventDefault();saveItem()}});
const qtyInput=document.getElementById("qty");
if(qtyInput){
  qtyInput.inputMode="decimal";
  qtyInput.addEventListener("focus",()=>{
    if(!editing && String(qtyInput.value)==="1"){
      qtyInput.value="";
    }
    setTimeout(()=>{try{qtyInput.select()}catch(e){}},0);
  });
}
