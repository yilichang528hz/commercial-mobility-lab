(function(){
  const state = {lang:'zh',theme:'A'};
  const I18N={
    zh:{kicker:'Interactive Proposal Reading Room',start:'開始閱讀',summary:'閱讀摘要',executiveSummary:'企劃摘要',chapterNavigator:'章節導覽',chapterNavigatorHint:'點選章節後，系統會載入該章文字與靜態插圖。',readingRoom:'企劃書閱讀室',readingRoomHint:'每章與每小節均可展開或收合。',downloads:'下載區',downloadHint:'下載原始企劃書 Word 檔與查看提示詞資產。',downloadProposal:'下載企劃書',toc:'目錄',load:'載入章節',staticIllustration:'靜態插圖'},
    en:{kicker:'Interactive Proposal Reading Room',start:'Start Reading',summary:'Read Summary',executiveSummary:'Executive Summary',chapterNavigator:'Chapter Navigator',chapterNavigatorHint:'Select a chapter to load its text and static illustrations.',readingRoom:'Proposal Reading Room',readingRoomHint:'Each chapter and section can be expanded or collapsed.',downloads:'Downloads',downloadHint:'Download the source proposal Word file and review prompt assets.',downloadProposal:'Download Proposal',toc:'TOC',load:'Load Chapter',staticIllustration:'Static illustration'},
    ja:{kicker:'Interactive Proposal Reading Room',start:'読み始める',summary:'要約を見る',executiveSummary:'企画要約',chapterNavigator:'章ナビゲーション',chapterNavigatorHint:'章を選ぶと本文と静的な挿絵を読み込みます。',readingRoom:'企画書閲覧室',readingRoomHint:'各章と各節を展開または折りたたむことができます。',downloads:'ダウンロード',downloadHint:'原企画書のWordファイルとプロンプト資産を確認できます。',downloadProposal:'企画書をダウンロード',toc:'目次',load:'章を読み込む',staticIllustration:'静的な挿絵'}
  };
  const qs=s=>document.querySelector(s);
  const qsa=s=>Array.from(document.querySelectorAll(s));
  function t(key){return (I18N[state.lang]&&I18N[state.lang][key])||I18N.zh[key]||key}
  function local(obj){return obj&&(obj[state.lang]||obj.zh||obj.en||'')}
  function init(){
    state.lang = localStorage.getItem('hotai-lang') || SITE_META.defaultLanguage || 'zh';
    state.theme = localStorage.getItem('hotai-theme') || SITE_META.defaultTheme || 'A';
    document.body.dataset.theme=state.theme;
    bindGlobal(); renderShell(); handleHashRoute();
  }
  function bindGlobal(){
    qsa('[data-lang-btn]').forEach(b=>b.addEventListener('click',()=>setLanguage(b.dataset.langBtn)));
    qsa('[data-theme-btn]').forEach(b=>b.addEventListener('click',()=>setTheme(b.dataset.themeBtn)));
    qs('#start-reading')?.addEventListener('click',()=>qs('#chapter-cards .primary-btn')?.click());
    qs('#open-summary')?.addEventListener('click',()=>qs('#summary-panel')?.scrollIntoView({behavior:'smooth'}));
    qs('#floating-open')?.addEventListener('click',openFloatingToc);
    qs('#floating-close')?.addEventListener('click',closeFloatingToc);
    qs('#drawer-backdrop')?.addEventListener('click',closeFloatingToc);
    document.addEventListener('keydown',e=>{ if(e.key==='Escape'){closeFloatingToc(); closeGlossary(); closeLightbox();} });
    qs('[data-close-modal]')?.addEventListener('click',closeGlossary);
    qs('[data-close-lightbox]')?.addEventListener('click',closeLightbox);
    document.addEventListener('click',e=>{
      const img=e.target.closest('[data-lightbox]'); if(img) openLightbox(img.getAttribute('data-lightbox'), img);
      const gl=e.target.closest('[data-glossary]'); if(gl) openGlossary(gl.dataset.glossary);
    });
    window.addEventListener('hashchange',handleHashRoute);
  }
  function renderShell(){
    document.documentElement.lang = state.lang==='zh'?'zh-Hant':state.lang;
    qs('#site-title').textContent=local(SITE_META.title);
    qs('#site-subtitle').textContent=local(SITE_META.subtitle);
    qs('#copyright').textContent=local(SITE_META.copyright);
    qs('#hero-eyebrow').textContent=t('kicker');
    qs('#hero-title').textContent=local(SITE_META.title);
    qs('#creation-motivation').textContent=local(SITE_META.creationMotivation);
    qs('#prototype-disclaimer').textContent=local(SITE_META.prototypeDisclaimer);
    qs('#start-reading').textContent=t('start');
    qs('#open-summary').textContent=t('summary');
    qs('#drawer-title').textContent=t('toc');
    qs('#floating-open').textContent=t('toc');
    qs('#executive-summary-text').textContent = state.lang==='zh'
      ? '本企劃書以台灣未來十年的高齡化、觀光復甦、健康物流、農村地方創生、到府服務與 AI 車隊管理為核心，重新整理商用車產品企劃的需求邏輯。網站將長篇文字拆為章節閱讀、情境摘要與小節級靜態插圖，讓讀者能從人口、服務場景、車型配置、成本模型、收益池與資料治理逐層理解產品包設計。'
      : state.lang==='en'
      ? 'This proposal reframes commercial vehicle product planning through aging society, tourism recovery, health logistics, rural revitalization, door to door service and AI fleet management. The site turns the long document into chapter based reading, scenario summaries and section level static illustrations so readers can connect market structure, service scenes, vehicle configuration, cost models, revenue pools and data governance.'
      : '本企画書は、高齢化、観光回復、健康物流、農村地域創生、訪問サービス、AI車隊管理を軸に、商用車の商品企画を読み直します。長文を章別閲覧、場景要約、節単位の静的な挿絵に分け、市場構造、サービス場景、車両配置、コストモデル、収益、データ管理を結びつけます。';
    qsa('[data-i18n]').forEach(el=>{el.textContent=t(el.dataset.i18n)});
    renderCards(); renderToc(); rerenderLoadedChapters();
  }
  function setLanguage(lang){
    if(!lang || lang===state.lang) return;
    const readingPosition = captureReadingPosition();
    const openState = captureOpenDetailsState();
    state.lang=lang;
    localStorage.setItem('hotai-lang',lang);
    renderShell();
    restoreOpenDetailsState(openState);
    restoreReadingPosition(readingPosition);
  }
  function captureReadingPosition(){
    const viewportX = Math.max(12, Math.min(window.innerWidth - 12, Math.floor(window.innerWidth * 0.5)));
    const viewportY = Math.max(80, Math.min(window.innerHeight - 12, Math.floor(window.innerHeight * 0.28)));
    const stack = document.elementsFromPoint(viewportX, viewportY);
    let target = stack.find(el => el.closest && el.closest('[data-section]'))?.closest('[data-section]');
    if(!target){
      target = stack.find(el => el.closest && el.closest('.chapter-loaded'))?.closest('.chapter-loaded');
    }
    if(!target){
      target = document.querySelector('.section-details[open], .chapter-loaded');
    }
    const id = target?.dataset?.section || target?.id || '';
    const type = target?.dataset?.section ? 'section' : (target?.id ? 'chapter' : 'absolute');
    const offsetTop = target ? target.getBoundingClientRect().top : 0;
    return { type, id, offsetTop, scrollY: window.scrollY };
  }
  function captureOpenDetailsState(){
    return qsa('details').map(el=>({
      sectionId: el.dataset?.section || '',
      chapterId: el.closest('.chapter-loaded')?.id || '',
      open: el.open
    }));
  }
  function restoreOpenDetailsState(records){
    if(!Array.isArray(records)) return;
    records.forEach(rec=>{
      let el=null;
      if(rec.sectionId) el=document.querySelector(`[data-section="${CSS.escape(rec.sectionId)}"]`);
      else if(rec.chapterId) el=document.querySelector(`#${CSS.escape(rec.chapterId)} .chapter-details`);
      if(el) el.open=!!rec.open;
    });
  }
  function restoreReadingPosition(pos){
    if(!pos) return;
    requestAnimationFrame(()=>{
      let target=null;
      if(pos.type==='section' && pos.id) target=document.querySelector(`[data-section="${CSS.escape(pos.id)}"]`);
      if(!target && pos.type==='chapter' && pos.id) target=document.getElementById(pos.id);
      if(target){
        const chapterDetails=target.closest('.chapter-details');
        if(chapterDetails) chapterDetails.open=true;
        if(target.matches('details')) target.open=true;
        const delta=target.getBoundingClientRect().top - pos.offsetTop;
        window.scrollTo({top: Math.max(0, window.scrollY + delta), behavior:'auto'});
      }else{
        window.scrollTo({top: pos.scrollY, behavior:'auto'});
      }
    });
  }
  function setTheme(theme){state.theme=theme; document.body.dataset.theme=theme; localStorage.setItem('hotai-theme',theme);}
  function renderCards(){
    const root=qs('#chapter-cards'); if(!root) return; root.innerHTML='';
    PROPOSAL_TOC.forEach(ch=>{
      const card=document.createElement('article');
      card.className='chapter-card';
      card.innerHTML=`<img src="${ch.imagePath}" alt="${escapeHtml(local(ch.title))}" loading="lazy" decoding="async" data-lightbox="${ch.chapterId}"><div class="meta-row"><span class="pill">Chapter ${String(ch.number).padStart(2,'0')}</span></div><h3>${escapeHtml(local(ch.title))}</h3><p>${escapeHtml(local(ch.summary))}</p><button class="primary-btn" data-load-chapter="${ch.chapterId}">${t('load')}</button>`;
      root.appendChild(card);
    });
    qsa('[data-load-chapter]').forEach(b=>b.addEventListener('click',()=>loadChapter(b.dataset.loadChapter,true)));
  }
  function renderToc(){
    const nav=qs('#floating-toc'); if(!nav) return;
    nav.innerHTML='<a href="#top">'+escapeHtml(local(SITE_META.title))+'</a><a href="#summary-panel">'+t('executiveSummary')+'</a>';
    PROPOSAL_TOC.forEach(ch=>{
      const a=document.createElement('a');
      a.href='#'+ch.chapterId;
      a.textContent=`${String(ch.number).padStart(2,'0')} ${local(ch.title)}`;
      a.addEventListener('click',e=>{e.preventDefault(); loadChapter(ch.chapterId,true); closeFloatingToc();});
      nav.appendChild(a);
    });
  }
  function openFloatingToc(){qs('#floating-drawer')?.classList.add('open'); qs('#drawer-backdrop')?.classList.add('open'); qs('#floating-open')?.setAttribute('aria-expanded','true');}
  function closeFloatingToc(){qs('#floating-drawer')?.classList.remove('open'); qs('#drawer-backdrop')?.classList.remove('open'); qs('#floating-open')?.setAttribute('aria-expanded','false');}
  function script(src){ return new Promise((res,rej)=>{ if(!src){res();return} if(document.querySelector(`script[src="${src}"]`)){res();return} const s=document.createElement('script'); s.src=src; s.onload=res; s.onerror=rej; document.body.appendChild(s);});}
  async function loadChapter(id,scroll){
    const meta=PROPOSAL_TOC.find(c=>c.chapterId===id); if(!meta) return;
    try{await script(meta.lazyLoadFile);}catch(e){console.warn(e)}
    renderChapter(id);
    if(scroll){setTimeout(()=>qs('#'+id)?.scrollIntoView({behavior:'smooth',block:'start'}),80)}
    history.replaceState(null,'','#'+id);
  }
  function renderChapter(id){
    const ch=window.PROPOSAL_CHAPTERS?.[id]; if(!ch) return;
    let wrap=qs('#'+id);
    if(!wrap){wrap=document.createElement('article'); wrap.className='chapter-loaded'; wrap.id=id; qs('#chapter-container').appendChild(wrap);}
    wrap.innerHTML=`<figure class="chapter-figure"><img src="${ch.image.path}" alt="${escapeHtml(local(ch.image.alt))}" loading="lazy" decoding="async" data-lightbox="${ch.chapterId}"><figcaption class="chapter-inner source-note">${escapeHtml(local(ch.image.caption))}</figcaption></figure><div class="chapter-inner"><h2>${String(ch.number).padStart(2,'0')} ${escapeHtml(local(ch.title))}</h2><p>${escapeHtml(local(ch.summary))}</p><details class="chapter-details" open><summary>${escapeHtml(local(ch.title))}</summary><div class="section-list">${ch.sections.map(s=>sectionHtml(s,ch)).join('')}</div></details></div>`;
  }
  function sectionHtml(s,ch){
    const body=local(s.body).split('\n\n').map(p=>`<p>${linkGlossary(escapeHtml(p))}</p>`).join('');
    const sectionImage = s.sectionImage || {};
    const sectionImagePath = sectionImage.path || `images/sections/${s.sectionId.replace('-s-','-section-')}-illustration.jpg`;
    const alt=escapeHtml(local(sectionImage.alt) || `${local(s.title)} ${t('staticIllustration')}`);
    const caption=escapeHtml(local(sectionImage.caption) || local(s.title));
    return `<details class="section-details" data-section="${s.sectionId}"><summary>${escapeHtml(local(s.title))}</summary><div class="section-body"><p class="source-note">${escapeHtml(local(s.summary))}</p><figure class="section-figure"><img src="${sectionImagePath}" alt="${alt}" loading="lazy" decoding="async" data-lightbox="${s.sectionId}" onerror="this.onerror=null;this.src='${ch.image.path}';"><figcaption class="source-note">${caption}</figcaption></figure>${body}</div></details>`;
  }
  function rerenderLoadedChapters(){ qsa('.chapter-loaded').forEach(el=>{const id=el.id; if(window.PROPOSAL_CHAPTERS?.[id]) renderChapter(id);}); }
  function openGlossary(id){
    const g=GLOSSARY.find(x=>x.id===id); if(!g) return;
    const def=g.definition?.[state.lang]||g.definition?.zh||'';
    qs('#glossary-content').innerHTML=`<h2>${escapeHtml(g[state.lang]||g.zh||g.fullEn)}</h2><p><strong>${escapeHtml(g.fullEn)}</strong> ${g.abbr?`(${escapeHtml(g.abbr)})`:''}</p><p>${escapeHtml(def)}</p><p class="source-note">${escapeHtml(g.relation||'')}</p><p class="source-note">${escapeHtml(g.limitation||'')}</p>`;
    qs('#glossary-modal').showModal();
  }
  function closeGlossary(){ const d=qs('#glossary-modal'); if(d?.open) d.close(); }
  function openLightbox(id,img){
    const src=img?.src || (PROPOSAL_TOC.find(c=>c.chapterId===id)?.imagePath) || 'images/home-hero.jpg';
    qs('#lightbox-img').src=src; qs('#lightbox-caption').textContent=img?.alt||''; qs('#lightbox').showModal();
  }
  function closeLightbox(){ const d=qs('#lightbox'); if(d?.open) d.close(); }
  function handleHashRoute(){ const id=location.hash.replace('#',''); if(PROPOSAL_TOC.some(c=>c.chapterId===id)) loadChapter(id,true); }
  function escapeHtml(s){return String(s||'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));}
  function linkGlossary(text){ ['TCO','TAM','SAM','SOM','MaaS','AI'].forEach(k=>{ text=text.replaceAll(k,`<span class="glossary-link" data-glossary="${k}">${k}</span>`); }); return text; }
  document.addEventListener('DOMContentLoaded',init);
})();
