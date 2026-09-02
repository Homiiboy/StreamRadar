const tmdb = window.StreamRadarTMDB;
const tvmaze = window.StreamRadarTVMaze;
const APP_VERSION = '0.0.4';
const TOKEN_KEY = 'streamradar-tmdb-token';
const WATCHLIST_KEY = 'streamradar-watchlist';
const brandNames = tmdb.ORIGINAL_BRANDS.map(b => b.name);
const serviceNames = [...new Set([...tmdb.SERVICE_DEFINITIONS.map(s => s.name), ...brandNames])];

const $ = s => document.querySelector(s);
const $$ = s => [...document.querySelectorAll(s)];
const safeJSON = (value, fallback) => { try { return JSON.parse(value); } catch { return fallback; } };
const todayISO = () => { const d = new Date(); d.setHours(12,0,0,0); return d.toISOString().slice(0,10); };
const addDaysISO = days => { const d = new Date(); d.setHours(12,0,0,0); d.setDate(d.getDate()+days); return d.toISOString().slice(0,10); };

const demoReleases = [
  {id:'demo-1',title:'Neon District',services:['Netflix'],type:'series',releaseDate:todayISO(),original:true,originalBrand:'Netflix',originalConfidence:'high',studio:'Netflix Original',accent:'#ff3158',description:'Demo-Inhalt: Eine düstere Tech-Thriller-Serie über Macht, Erinnerung und eine Stadt, die niemals offline geht.',source:'demo'},
  {id:'demo-2',title:'Ashes of Europa',services:['HBO Max'],type:'series',releaseDate:addDaysISO(3),original:true,originalBrand:'HBO',originalConfidence:'high',studio:'HBO Original',accent:'#7c6dff',description:'Demo-Inhalt: Prestige-Sci-Fi über eine Expedition, die unter Europas Eisschicht etwas Unmögliches findet.',source:'demo'},
  {id:'demo-3',title:'Red Horizon',services:['Prime Video'],type:'movie',releaseDate:addDaysISO(11),original:true,originalBrand:'Prime Video',originalConfidence:'medium',studio:'Amazon MGM',accent:'#39a8ff',description:'Demo-Inhalt: Ein Survival-Thriller über die erste bemannte Mars-Mission und ein Signal aus dem Nichts.',source:'demo'},
  {id:'demo-4',title:'Moonblade',services:['Crunchyroll'],type:'anime',releaseDate:addDaysISO(1),original:true,originalBrand:'Crunchyroll',originalConfidence:'high',studio:'Crunchyroll',accent:'#ff8c31',description:'Demo-Inhalt: Neue Anime-Serie über einen gefallenen Wächter und eine Klinge, die Erinnerungen schneiden kann.',source:'demo'},
  {id:'demo-5',title:'The Quiet Room',services:['Apple TV+'],type:'series',releaseDate:addDaysISO(18),original:true,originalBrand:'Apple TV+',originalConfidence:'high',studio:'Apple Original',accent:'#d9e2ef',description:'Demo-Inhalt: Psychologisches Mystery-Drama über einen Raum, in dem niemand länger als 17 Minuten bleiben kann.',source:'demo'},
  {id:'demo-6',title:'Blackwater',services:['Paramount+'],type:'series',releaseDate:addDaysISO(22),original:true,originalBrand:'Paramount+',originalConfidence:'high',studio:'Paramount+ Original',accent:'#4386ff',description:'Demo-Inhalt: Crime-Serie über eine Küstenstadt, einen verschwundenen Ermittler und ein Netzwerk aus alten Schulden.',source:'demo'},
  {id:'demo-7',title:'Glass Cities',services:['Disney+'],type:'movie',releaseDate:addDaysISO(27),original:true,originalBrand:'Disney+',originalConfidence:'medium',studio:'Disney+ Original',accent:'#2a7cff',description:'Demo-Inhalt: Visuell opulentes Abenteuer über zwei Geschwister in einer Stadt aus lebendem Glas.',source:'demo'},
  {id:'demo-8',title:'Signal Fire',services:['Disney+'],type:'series',releaseDate:addDaysISO(5),original:true,originalBrand:'FX',originalConfidence:'high',studio:'FX Original',accent:'#ff7a59',description:'Demo-Inhalt: Ein FX Original, das in Österreich über Disney+ verfügbar ist.',source:'demo'}
];

const state = {
  service:'all', view:'discover', mode:'demo', releases:[], providerMap:[], loading:false, enriching:false,
  watchlist:new Set(safeJSON(localStorage.getItem(WATCHLIST_KEY)||'[]',[]).map(String)),
  detailCache:new Map(), tvmazeCache:new Map()
};

function parseDate(value){ if(!value) return null; const d=new Date(`${value}T12:00:00`); return Number.isNaN(d.getTime())?null:d; }
function dayDistance(value){ const d=parseDate(value); if(!d) return 9999; const now=new Date(); now.setHours(12,0,0,0); return Math.round((d-now)/86400000); }
function periodFor(value){ const days=dayDistance(value); if(days===0)return'today'; if(days>=-7&&days<=7)return'week'; if(days>7)return'upcoming'; return'month'; }
function formatReleaseDate(value){ const days=dayDistance(value); if(days===0)return'Heute'; if(days===1)return'Morgen'; if(days===-1)return'Gestern'; const d=parseDate(value); return d?new Intl.DateTimeFormat('de-AT',{day:'2-digit',month:'short',year:d.getFullYear()!==new Date().getFullYear()?'numeric':undefined}).format(d):'Datum offen'; }
function accentFor(service){ return ({'Netflix':'#ff3158','Disney+':'#2a7cff','Prime Video':'#39a8ff','HBO Max':'#7c6dff','HBO':'#a89cff','Apple TV+':'#d9e2ef','Paramount+':'#4386ff','Crunchyroll':'#ff8c31','Sky / WOW':'#ff5dcc','Sky':'#ff5dcc','Joyn':'#f4d44d','RTL+':'#38d59f','ORF':'#e84855','FX':'#ff7a59','Hulu':'#55e58a','Peacock':'#8f7aff','AMC+':'#ffb45a','BBC':'#e6e6e6'})[service]||'#62f7c7'; }
function escapeHTML(value=''){ return String(value).replace(/[&<>'"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c])); }
function enrichRelease(item){ return {...item,period:periodFor(item.releaseDate),date:formatReleaseDate(item.releaseDate),accent:item.accent||accentFor(item.services?.[0]||item.originalBrand||'')}; }
function labelType(type){ return ({series:'SERIE',movie:'FILM',anime:'ANIME'})[type]||String(type).toUpperCase(); }
function sortByRadarRelevance(a,b){ const score=d=>Math.abs(d)+(d<0?4:0); return score(dayDistance(a.releaseDate))-score(dayDistance(b.releaseDate))||(b.popularity||0)-(a.popularity||0); }

state.releases = demoReleases.map(enrichRelease);

function setDataStatus(kind,label,text){ $('#dataStatus').dataset.state=kind; $('#dataStatusLabel').textContent=label; $('#dataStatusText').textContent=text; $('#radarState').textContent=kind==='live'?'TMDB + TVmaze':kind==='loading'?'Synchronisiere …':'Radar aktiv'; $('#statusAction').textContent=kind==='live'?'Einstellungen':'TMDB verbinden'; }
function setLoading(value){ state.loading=value; $('#loadingGrid').hidden=!value; $('#releaseGrid').classList.toggle('is-loading',value); $('#refreshData').classList.toggle('spinning',value); $('#refreshData').disabled=value; }
function providerFor(name){ return state.providerMap.find(p=>p.name===name); }
function brandLogoPath(name){ return state.releases.find(item=>item.originalBrand===name&&item.originalLogoPath)?.originalLogoPath || providerFor(name)?.logoPath || null; }
function logoMarkup(path, className='brand-logo'){ return path?`<img class="${className}" src="${tmdb.image(path,'w185')}" alt="" loading="lazy"/>`:''; }
function useDemo(message='TMDB noch nicht verbunden.'){ state.mode='demo'; state.releases=demoReleases.map(enrichRelease); state.providerMap=[]; state.detailCache.clear(); state.tvmazeCache.clear(); setDataStatus('demo','Demo-Modus',message); renderServices(); renderReleases(); }

function renderBrandFilter(){ const select=$('#brandFilter'); const current=select.value; select.innerHTML='<option value="all">Alle Original-Marken</option>'+brandNames.map(b=>`<option value="${escapeHTML(b)}">${escapeHTML(b)}</option>`).join(''); select.value=brandNames.includes(current)?current:'all'; }
function renderServices(){ $('#serviceStrip').innerHTML=serviceNames.map(name=>{ const p=providerFor(name); const path=p?.logoPath||brandLogoPath(name); const logo=path?logoMarkup(path,'service-logo'):'<span class="service-dot"></span>'; const sourceOnly=state.mode==='live'&&(!p||!p.available); const kind=brandNames.includes(name)?'Original-Marke / Network':'Streaming-Provider'; return `<button class="service-chip ${state.service===name?'active':''} ${sourceOnly?'source-only':''}" data-service="${escapeHTML(name)}" title="${escapeHTML(kind)}: ${escapeHTML(name)}">${logo}<span>${escapeHTML(name)}</span></button>`; }).join(''); $$('.service-chip').forEach(b=>b.onclick=()=>{state.service=state.service===b.dataset.service?'all':b.dataset.service;renderServices();renderReleases();}); }
function matchesView(item){ if(state.view==='upcoming'){const d=dayDistance(item.releaseDate);return d>=0&&d<=30;} if(state.view==='watchlist')return state.watchlist.has(String(item.id)); return true; }

function renderReleases(){
  const query=$('#searchInput').value.trim().toLowerCase(), type=$('#typeFilter').value, period=$('#periodFilter').value, originals=$('#originalsOnly').checked, brand=$('#brandFilter').value;
  const filtered=state.releases.filter(item=>{ const haystack=`${item.title} ${item.originalTitle||''} ${(item.services||[]).join(' ')} ${item.originalBrand||''} ${item.studio||''}`.toLowerCase(); return matchesView(item)&&(state.service==='all'||item.services?.includes(state.service)||item.originalBrand===state.service)&&(type==='all'||item.type===type)&&(period==='all'||item.period===period)&&(!originals||item.original===true)&&(brand==='all'||item.originalBrand===brand)&&(!query||haystack.includes(query)); });
  $('#heroReleaseCount').textContent=state.releases.length; $('#watchlistCount').textContent=state.watchlist.size;
  $('#resultSummary').textContent=state.loading?'TMDB-Daten werden geladen …':`${filtered.length} Treffer ${state.mode==='live'?'für Österreich':state.mode==='demo'?'im Demo-Modus':''}${state.enriching?' · Original-Erkennung läuft …':''}`;
  $('#releaseGrid').innerHTML=filtered.map(cardTemplate).join(''); $('#emptyState').hidden=filtered.length>0||state.loading;
  $$('.release-card').forEach(c=>c.onclick=e=>{if(!e.target.closest('.save-button'))openDetails(c.dataset.id);}); $$('.save-button').forEach(b=>b.onclick=e=>{e.stopPropagation();toggleWatchlist(b.dataset.id);});
}

function cardTemplate(item){
  const saved=state.watchlist.has(String(item.id));
  const poster=item.posterPath?`<img class="poster-image" src="${tmdb.image(item.posterPath,'w500')}" alt="Poster von ${escapeHTML(item.title)}" loading="lazy"/>`:`<span class="poster-monogram">${escapeHTML(item.title.split(' ').map(x=>x[0]).join('').slice(0,3))}</span>`;
  const primary=item.services?.[0]||'Unbekannt', extra=Math.max(0,(item.services?.length||1)-1), rating=item.rating>0?`<span class="rating">★ ${item.rating.toFixed(1)}</span>`:'';
  const brandLogo=item.originalBrand?logoMarkup(item.originalLogoPath||brandLogoPath(item.originalBrand),'original-badge-logo'):'';
  const rightBadge=item.originalBrand?`<span class="badge original-brand" title="Original-Erkennung: ${escapeHTML(item.originalConfidence||'')}">${brandLogo}<span>${escapeHTML(item.originalBrand)} ORIGINAL</span></span>`:(state.mode==='demo'?'<span class="badge demo">DEMO</span>':'');
  return `<article class="release-card" data-id="${escapeHTML(item.id)}" style="--card-accent:${item.accent}"><div class="poster">${poster}<div class="poster-shade"></div><div class="badge-row"><span class="badge">${escapeHTML(primary)}${extra?` +${extra}`:''}</span>${rightBadge}</div>${rating}</div><button class="save-button ${saved?'saved':''}" data-id="${escapeHTML(item.id)}">${saved?'✓':'+'}</button><div class="card-body"><div class="card-meta"><span>${labelType(item.type)}</span><span>${escapeHTML(item.date)}</span></div><h3>${escapeHTML(item.title)}</h3><p>${item.originalBrand?`Original: ${escapeHTML(item.originalBrand)} · `:''}${escapeHTML(item.services?.join(' · ')||'Streaming')}</p></div></article>`;
}

function toggleWatchlist(id){ const key=String(id); state.watchlist.has(key)?state.watchlist.delete(key):state.watchlist.add(key); localStorage.setItem(WATCHLIST_KEY,JSON.stringify([...state.watchlist])); renderReleases(); }

async function enrichOriginals(token){
  if(state.mode!=='live')return; state.enriching=true; renderReleases();
  const candidates=[...state.releases].sort(sortByRadarRelevance);
  try{ await tmdb.enrichOriginalMetadata(candidates,token,(done,total)=>{ setDataStatus('live','TMDB live',`Original-Marken und Logos werden erkannt ${done}/${total} …`); if(done%8===0||done===total){renderServices();renderReleases();} },72); }
  finally{ state.enriching=false; setDataStatus('live','TMDB + TVmaze',`${state.releases.length} reale Titel · Originals & Network-Logos erkannt · Region Österreich.`); renderServices(); renderReleases(); }
}

async function loadLiveData({closeSettings=false}={}){
  const token=localStorage.getItem(TOKEN_KEY)?.trim(); if(!token)return useDemo();
  setLoading(true); setDataStatus('loading','TMDB wird geladen','Provider und Releases für Österreich werden synchronisiert …'); $('#settingsStatus').textContent='Verbindung wird geprüft …';
  try{
    const result=await tmdb.loadRadar(token,(done,total)=>setDataStatus('loading','TMDB wird geladen',`Datenquellen ${done}/${total} …`));
    state.mode='live'; state.providerMap=result.providers; state.releases=result.releases.map(enrichRelease).filter(x=>x.title).sort(sortByRadarRelevance); state.detailCache.clear(); state.tvmazeCache.clear();
    setDataStatus('live','TMDB live',`${state.releases.length} reale Titel · Original-Erkennung startet …`); $('#settingsStatus').textContent='Verbunden. Live-Daten sind aktiv.'; renderServices(); renderReleases(); if(closeSettings&&$('#settingsDialog').open)$('#settingsDialog').close();
    enrichOriginals(token);
  }catch(error){ console.error(error); const auth=error.status===401||error.status===403; useDemo(auth?'TMDB-Token ungültig oder nicht autorisiert.':'TMDB ist gerade nicht erreichbar – Demo-Daten werden angezeigt.'); $('#settingsStatus').textContent=auth?'Token konnte nicht authentifiziert werden.':'Verbindung fehlgeschlagen.'; if(auth)openSettings(); }
  finally{setLoading(false);}
}

async function openDetails(id){
  const item=state.releases.find(x=>String(x.id)===String(id)); if(!item)return; renderDetail(item,null,null,true); $('#detailDialog').showModal(); if(state.mode!=='live'||!item.tmdbId)return;
  const key=`${item.mediaType}-${item.tmdbId}`;
  let details=state.detailCache.get(key);
  try{ if(!details){details=await tmdb.getDetails(item.mediaType,item.tmdbId,localStorage.getItem(TOKEN_KEY));state.detailCache.set(key,details); if(details.inferredOriginalBrand){item.original=true;item.originalBrand=details.inferredOriginalBrand;item.originalConfidence=details.originalConfidence;item.originalLogoPath=details.inferredOriginalLogoPath||item.originalLogoPath;item.originalLogoSource=details.originalLogoSource||item.originalLogoSource;renderServices();renderReleases();}} renderDetail(item,details,null,item.mediaType==='tv');
    if(item.mediaType==='tv'){
      let maze=state.tvmazeCache.get(key); if(!maze){maze=await tvmaze.getSeriesRadar(details.external_ids||item.externalIds||{},item.originalTitle||item.title);state.tvmazeCache.set(key,maze);} renderDetail(item,details,maze,false);
    }
  }catch(error){console.warn('Detail enrichment failed',error);renderDetail(item,details,{loadError:true},false);}
}

function renderDetail(item,details,maze,loading){
  const backdrop=item.backdropPath?tmdb.image(item.backdropPath,'w1280'):''; const genres=details?.genres?.map(g=>g.name)||[]; const runtime=item.mediaType==='movie'?details?.runtime:details?.episode_run_time?.[0];
  const providers=details?.providers||[]; const providerPills=providers.slice(0,8).map(p=>`<span class="provider-pill">${p.logo_path?`<img src="${tmdb.image(p.logo_path,'w92')}" alt=""/>`:''}${escapeHTML(p.provider_name)}</span>`).join('');
  const tmdbUrl=item.tmdbId?`https://www.themoviedb.org/${item.mediaType}/${item.tmdbId}`:null; const style=backdrop?`--detail-bg:url('${backdrop}');--card-accent:${item.accent}`:`--card-accent:${item.accent}`;
  const brand=item.originalBrand||details?.inferredOriginalBrand; const confidence=item.originalConfidence||details?.originalConfidence; const originalLogo=item.originalLogoPath||details?.inferredOriginalLogoPath||brandLogoPath(brand);
  const originLogo=brand&&originalLogo?`<div class="origin-logo-wrap">${logoMarkup(originalLogo,'origin-logo')}</div>`:'';
  const episode=maze?.nextEpisode; const episodePanel=episode?`<div class="tvmaze-panel"><div><span class="section-kicker">${maze.nextIsNewSeason?'NEUE STAFFEL':'NÄCHSTE EPISODE'} · TVMAZE</span><h3>${maze.nextIsNewSeason?`Staffel ${episode.season} startet`:`S${episode.season||'?'}E${episode.number||'?'} · ${escapeHTML(episode.name)}`}</h3><p>${escapeHTML(formatReleaseDate(episode.airdate))}${episode.runtime?` · ${episode.runtime} Min.`:''}${maze.network?` · ${escapeHTML(maze.network)}`:''}</p></div>${episode.image?`<img src="${escapeHTML(episode.image)}" alt=""/>`:''}</div>`:(maze&&!maze.loadError?'<div class="tvmaze-panel compact">Keine kommende Episode in den nächsten 120 Tagen bei TVmaze hinterlegt.</div>':'');
  $('#dialogContent').innerHTML=`<div class="detail-hero ${backdrop?'has-backdrop':''}" style="${style}"><div><span class="section-kicker">${escapeHTML(item.services?.join(' · ')||'STREAMRADAR')}</span><h2>${escapeHTML(item.title)}</h2><span>${escapeHTML(item.date)} · ${labelType(item.type)}</span></div></div><div class="detail-content"><p>${escapeHTML(details?.overview||item.description||'Keine Beschreibung verfügbar.')}</p>${brand?`<div class="origin-line">${originLogo}<div class="origin-copy"><strong>Original von ${escapeHTML(brand)}</strong><span>${confidence==='high'?'hohe':'mittlere'} Erkennungssicherheit${details?.originalEvidence?` · ${escapeHTML(details.originalEvidence)}`:''}</span></div></div>`:''}<div class="detail-facts">${item.rating>0?`<span>★ ${item.rating.toFixed(1)} TMDB</span>`:''}${runtime?`<span>${runtime} Min.</span>`:''}${details?.number_of_seasons?`<span>${details.number_of_seasons} Staffeln</span>`:''}${genres.slice(0,3).map(g=>`<span>${escapeHTML(g)}</span>`).join('')}<span>Region AT</span></div>${episodePanel}${providerPills?`<div class="provider-list"><strong>Läuft in Österreich bei</strong><div>${providerPills}</div></div>`:'<div class="provider-list"><strong>Läuft in Österreich bei</strong><p>Keine aktuellen Providerdaten gefunden.</p></div>'}${loading?'<div class="inline-loading">Serien- und Episodendaten werden geladen …</div>':''}${maze?.loadError?'<div class="inline-error">TVmaze-Zusatzdaten konnten nicht geladen werden.</div>':''}<div class="detail-actions">${tmdbUrl?`<a class="ghost-button link-button" href="${tmdbUrl}" target="_blank" rel="noopener">Auf TMDB ansehen ↗</a>`:''}${details?.watchLink?`<a class="primary-button link-button" href="${escapeHTML(details.watchLink)}" target="_blank" rel="noopener">Streamingoptionen ↗</a>`:''}${maze?.url?`<a class="ghost-button link-button" href="${escapeHTML(maze.url)}" target="_blank" rel="noopener">TVmaze ↗</a>`:''}</div><p class="attribution">Metadaten & Network-/Studio-Logos: TMDB · Streaming-Verfügbarkeit: JustWatch via TMDB · Episodendaten: TVmaze. Original-Zuordnung ist heuristisch und zeigt die Erkennungssicherheit an.</p></div>`;
}

function setView(view){ state.view=view; $$('.nav-link').forEach(x=>x.classList.toggle('active',x.dataset.view===view)); if(view==='upcoming'){ $('#viewKicker').textContent='KOMMENDE 30 TAGE';$('#viewTitle').textContent='Demnächst'; }else if(view==='watchlist'){ $('#viewKicker').textContent='GESPEICHERT';$('#viewTitle').textContent='Deine Merkliste'; }else{ $('#viewKicker').textContent='DEIN FEED';$('#viewTitle').textContent='Neu & relevant'; } renderReleases(); $('#releases').scrollIntoView({behavior:'smooth'}); }
function resetFilters(){ state.service='all'; $('#searchInput').value='';$('#typeFilter').value='all';$('#periodFilter').value='all';$('#brandFilter').value='all';$('#originalsOnly').checked=false;renderServices();renderReleases(); }
function openSettings(){ $('#tmdbToken').value=localStorage.getItem(TOKEN_KEY)||'';$('#settingsStatus').textContent=state.mode==='live'?'Verbunden. Live-Daten sind aktiv.':'Füge deinen TMDB API Read Access Token ein.'; if(!$('#settingsDialog').open)$('#settingsDialog').showModal(); }
async function saveToken(){ const token=$('#tmdbToken').value.trim();if(!token)return $('#settingsStatus').textContent='Bitte zuerst einen Token eintragen.';$('#saveToken').disabled=true;try{await tmdb.validateToken(token);localStorage.setItem(TOKEN_KEY,token);await loadLiveData({closeSettings:true});}catch(e){$('#settingsStatus').textContent=e.status===401||e.status===403?'Dieser Token ist ungültig oder nicht autorisiert.':'TMDB konnte nicht erreicht werden.';}finally{$('#saveToken').disabled=false;} }
function clearToken(){localStorage.removeItem(TOKEN_KEY);$('#tmdbToken').value='';useDemo('TMDB-Verbindung wurde entfernt.');$('#settingsStatus').textContent='Token entfernt.';}

renderBrandFilter();
$$('.nav-link').forEach(b=>b.onclick=()=>setView(b.dataset.view)); $('#searchInput').oninput=renderReleases; $('#typeFilter').onchange=renderReleases; $('#periodFilter').onchange=renderReleases; $('#brandFilter').onchange=renderReleases; $('#originalsOnly').onchange=renderReleases; $('#resetServices').onclick=()=>{state.service='all';renderServices();renderReleases();}; $('#clearFilters').onclick=resetFilters; $('#showUpcoming').onclick=()=>setView('upcoming'); $('[data-jump="releases"]').onclick=()=>$('#releases').scrollIntoView({behavior:'smooth'}); $('#dialogClose').onclick=()=>$('#detailDialog').close(); $('#detailDialog').onclick=e=>{if(e.target===$('#detailDialog'))$('#detailDialog').close();}; $('#openSettings').onclick=openSettings; $('#statusAction').onclick=openSettings; $('#settingsClose').onclick=()=>$('#settingsDialog').close(); $('#settingsDialog').onclick=e=>{if(e.target===$('#settingsDialog'))$('#settingsDialog').close();}; $('#saveToken').onclick=saveToken; $('#clearToken').onclick=clearToken; $('#refreshData').onclick=()=>localStorage.getItem(TOKEN_KEY)?loadLiveData():openSettings(); $('#themePulse').onclick=()=>{const c=getComputedStyle(document.documentElement).getPropertyValue('--accent').trim();document.documentElement.style.setProperty('--accent',c==='#62f7c7'?'#7c6dff':'#62f7c7');};
document.addEventListener('keydown',e=>{if(e.key==='/'&&!['INPUT','TEXTAREA'].includes(document.activeElement?.tagName)){e.preventDefault();$('#searchInput').focus();}});
renderServices();renderReleases(); if(localStorage.getItem(TOKEN_KEY))loadLiveData();else useDemo();