const services = ['Netflix','Disney+','Prime Video','HBO Max','Apple TV+','Paramount+','Crunchyroll','FX','Hulu','Peacock','AMC+','BBC','Sky / WOW','Joyn','RTL+','ORF'];

const releases = [
  {id:1,title:'Neon District',service:'Netflix',type:'series',period:'today',date:'Heute',original:true,studio:'Netflix Original',accent:'#ff3158',description:'Eine düstere Tech-Thriller-Serie über Macht, Erinnerung und eine Stadt, die niemals offline geht.'},
  {id:2,title:'Ashes of Europa',service:'HBO Max',type:'series',period:'week',date:'Diese Woche',original:true,studio:'HBO Original',accent:'#7c6dff',description:'Prestige-Sci-Fi über eine Expedition, die unter Europas Eisschicht etwas Unmögliches findet.'},
  {id:3,title:'Red Horizon',service:'Prime Video',type:'movie',period:'month',date:'12. Sep.',original:true,studio:'Amazon MGM',accent:'#39a8ff',description:'Ein Survival-Thriller über die erste bemannte Mars-Mission und ein Signal aus dem Nichts.'},
  {id:4,title:'Moonblade',service:'Crunchyroll',type:'anime',period:'today',date:'Heute',original:false,studio:'Crunchyroll',accent:'#ff8c31',description:'Neue Anime-Serie über einen gefallenen Wächter und eine Klinge, die Erinnerungen schneiden kann.'},
  {id:5,title:'The Quiet Room',service:'Apple TV+',type:'series',period:'upcoming',date:'18. Sep.',original:true,studio:'Apple Original',accent:'#d9e2ef',description:'Psychologisches Mystery-Drama über einen Raum, in dem niemand länger als 17 Minuten bleiben kann.'},
  {id:6,title:'Blackwater',service:'Paramount+',type:'series',period:'month',date:'22. Sep.',original:true,studio:'Paramount+ Original',accent:'#4386ff',description:'Crime-Serie über eine Küstenstadt, einen verschwundenen Ermittler und ein Netzwerk aus alten Schulden.'},
  {id:7,title:'Glass Cities',service:'Disney+',type:'movie',period:'upcoming',date:'27. Sep.',original:true,studio:'Disney+ Original',accent:'#2a7cff',description:'Visuell opulentes Abenteuer über zwei Geschwister in einer Stadt aus lebendem Glas.'},
  {id:8,title:'Signal Fire',service:'FX',type:'series',period:'week',date:'Freitag',original:true,studio:'FX Original',accent:'#ff7a59',description:'Ein Ensemble-Drama über ein Bergdorf, dessen Notsignal nach zwanzig Jahren plötzlich wieder aktiv wird.'}
];

const state = { service:'all', view:'discover', watchlist:new Set(JSON.parse(localStorage.getItem('streamradar-watchlist') || '[]')) };

const $ = (s) => document.querySelector(s);
const $$ = (s) => [...document.querySelectorAll(s)];

function renderServices(){
  const root = $('#serviceStrip');
  root.innerHTML = services.map(name => `<button class="service-chip ${state.service===name?'active':''}" data-service="${name}"><span class="service-dot"></span>${name}</button>`).join('');
  $$('.service-chip').forEach(btn => btn.addEventListener('click',()=>{state.service = state.service===btn.dataset.service?'all':btn.dataset.service; renderServices(); renderReleases();}));
}

function matchesView(item){
  if(state.view==='upcoming') return item.period==='upcoming';
  if(state.view==='watchlist') return state.watchlist.has(item.id);
  return true;
}

function renderReleases(){
  const query = $('#searchInput').value.trim().toLowerCase();
  const type = $('#typeFilter').value;
  const period = $('#periodFilter').value;
  const originalsOnly = $('#originalsOnly').checked;

  const filtered = releases.filter(item => {
    return matchesView(item)
      && (state.service==='all' || item.service===state.service)
      && (type==='all' || item.type===type)
      && (period==='all' || item.period===period)
      && (!originalsOnly || item.original)
      && (!query || `${item.title} ${item.service} ${item.studio}`.toLowerCase().includes(query));
  });

  $('#heroReleaseCount').textContent = releases.length;
  $('#watchlistCount').textContent = state.watchlist.size;
  $('#resultSummary').textContent = `${filtered.length} ${filtered.length===1?'Treffer':'Treffer'} auf deinem Radar.`;
  $('#releaseGrid').innerHTML = filtered.map(cardTemplate).join('');
  $('#emptyState').hidden = filtered.length > 0;

  $$('.release-card').forEach(card=>card.addEventListener('click',e=>{if(!e.target.closest('.save-button')) openDetails(Number(card.dataset.id));}));
  $$('.save-button').forEach(btn=>btn.addEventListener('click',e=>{e.stopPropagation(); toggleWatchlist(Number(btn.dataset.id));}));
}

function cardTemplate(item){
  const saved = state.watchlist.has(item.id);
  return `<article class="release-card" data-id="${item.id}" style="--card-accent:${item.accent}">
    <div class="poster">
      <div class="badge-row"><span class="badge">${item.service}</span>${item.original?'<span class="badge original">ORIGINAL</span>':''}</div>
      <span class="poster-monogram">${item.title.split(' ').map(x=>x[0]).join('').slice(0,3)}</span>
    </div>
    <button class="save-button ${saved?'saved':''}" data-id="${item.id}" aria-label="${saved?'Von Merkliste entfernen':'Zur Merkliste hinzufügen'}">${saved?'✓':'+'}</button>
    <div class="card-body"><div class="card-meta"><span>${labelType(item.type)}</span><span>${item.date}</span></div><h3>${item.title}</h3><p>${item.studio}</p></div>
  </article>`;
}

function labelType(type){ return ({series:'SERIE',movie:'FILM',anime:'ANIME'})[type] || type.toUpperCase(); }

function toggleWatchlist(id){
  state.watchlist.has(id) ? state.watchlist.delete(id) : state.watchlist.add(id);
  localStorage.setItem('streamradar-watchlist',JSON.stringify([...state.watchlist]));
  renderReleases();
}

function openDetails(id){
  const item = releases.find(x=>x.id===id); if(!item) return;
  $('#dialogContent').innerHTML = `<div class="detail-hero" style="--card-accent:${item.accent}"><div><span class="section-kicker">${item.service} · ${item.studio}</span><h2>${item.title}</h2><span>${item.date}</span></div></div><div class="detail-content"><p>${item.description}</p><div class="detail-facts"><span>${labelType(item.type)}</span><span>${item.original?'Original':'Katalogtitel'}</span><span>Region AT</span></div><p><strong>v0.0.1 Hinweis:</strong> Diese Inhalte sind Demo-Daten. In der nächsten Ausbaustufe werden echte Release- und Metadaten über APIs angebunden.</p></div>`;
  $('#detailDialog').showModal();
}

function setView(view){
  state.view = view;
  $$('.nav-link').forEach(x=>x.classList.toggle('active',x.dataset.view===view));
  if(view==='upcoming'){ $('#viewKicker').textContent='KOMMENDE RELEASES'; $('#viewTitle').textContent='Demnächst'; }
  else if(view==='watchlist'){ $('#viewKicker').textContent='GESPEICHERT'; $('#viewTitle').textContent='Deine Merkliste'; }
  else { $('#viewKicker').textContent='DEIN FEED'; $('#viewTitle').textContent='Neu & relevant'; }
  renderReleases();
  $('#releases').scrollIntoView({behavior:'smooth'});
}

function resetFilters(){
  state.service='all'; $('#searchInput').value=''; $('#typeFilter').value='all'; $('#periodFilter').value='all'; $('#originalsOnly').checked=false; renderServices(); renderReleases();
}

$$('.nav-link').forEach(btn=>btn.addEventListener('click',()=>setView(btn.dataset.view)));
$('#searchInput').addEventListener('input',renderReleases);
$('#typeFilter').addEventListener('change',renderReleases);
$('#periodFilter').addEventListener('change',renderReleases);
$('#originalsOnly').addEventListener('change',renderReleases);
$('#resetServices').addEventListener('click',()=>{state.service='all';renderServices();renderReleases();});
$('#clearFilters').addEventListener('click',resetFilters);
$('#showUpcoming').addEventListener('click',()=>setView('upcoming'));
$('[data-jump="releases"]').addEventListener('click',()=>$('#releases').scrollIntoView({behavior:'smooth'}));
$('#dialogClose').addEventListener('click',()=>$('#detailDialog').close());
$('#detailDialog').addEventListener('click',e=>{if(e.target===$('#detailDialog')) $('#detailDialog').close();});
$('#themePulse').addEventListener('click',()=>document.documentElement.style.setProperty('--accent', getComputedStyle(document.documentElement).getPropertyValue('--accent').trim()==='#62f7c7' ? '#7c6dff' : '#62f7c7'));

renderServices();
renderReleases();
