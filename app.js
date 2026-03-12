document.addEventListener('DOMContentLoaded', () => {

  // Data Model & Default State
  const defaultState = () => ({
    version: 2,
    lang: 'gr',
    topImage: '',
    title: 'Shelly PRO 1 – Installation Video',
    code: '',
    desc: 'Επαγγελματικός έξυπνος διακόπτης ράγας DIN 1 καναλιού με ξηρές επαφές.',
    bullets: [
      'Κατάλληλος για αυτοματισμό σπιτιού και εγκαταστάσεων με τηλεχειρισμό.',
      'Τοποθετείται σε ράγα DIN μέσα σε κουτί διακοπτών.',
      'Ενισχυμένα χαρακτηριστικά ασφαλείας και συμβατότητα με τις περισσότερες πλατφόρμες.'
    ],
    manual: { url: '', label_gr: 'Οδηγίες χρήσης (PDF)', label_en: 'User manual (PDF)' },
    video: { url: 'https://www.youtube.com/watch?v=nGj5ZgnwP04', label_gr: 'Άνοιγμα video', label_en: 'Open video' },
    diagrams: {
      url: 'https://elvhx.gr/index.php?route=product/category&path=267_269_268',
      label_gr: 'Δείτε εδώ διαγράμματα',
      label_en: 'View wiring diagrams',
      sub_gr: 'Wiring diagrams / schematics για άμεση εγκατάσταση',
      sub_en: 'Schematics for quick & correct installation'
    },
    extraButtons: [], // {id, label_gr, label_en, url, iconUrl, style}
    extraVideos: []   // {id, url}
  });

  let state = defaultState();

  // Helpers
  const $ = (id) => document.getElementById(id);
  const setStatus = (txt) => { if($('statusChip')) $('statusChip').textContent = txt; };
  const safeText = (s) => (s ? s.toString() : '').replace(/</g,'&lt;').replace(/>/g,'&gt;');
  const uid = () => Math.random().toString(36).slice(2,10);

  const normalizeBullets = (txt) => (txt || '').split(/\r?\n/).map(l => l.replace(/^\s*[•\-\*]\s*/,'').trim()).filter(Boolean);

  const youTubeToEmbed = (url) => {
    if(!url) return '';
    try {
      const u = new URL(url);
      if(u.hostname.includes('youtu.be')) return `https://www.youtube.com/embed/${u.pathname.replace('/','')}`;
      if(u.searchParams.get('v')) return `https://www.youtube.com/embed/${u.searchParams.get('v')}`;
      return url;
    } catch { return url; }
  };

  // Render Dynamic Lists (Buttons & Videos)
  function renderLists() {
    const btnWrap = $('buttonsList');
    if (btnWrap) {
      btnWrap.innerHTML = state.extraButtons.map((b, i) => `
        <div class="item" data-id="${b.id}">
          <div class="top">
            <div class="row"><span class="drag">☰</span> <strong>Button ${i+1}</strong></div>
            <div class="row">
              <button class="btn small" data-act="up">↑</button>
              <button class="btn small" data-act="down">↓</button>
              <button class="btn small danger" data-act="del">X</button>
            </div>
          </div>
          <div class="grid">
            <div><label>Label (GR)</label><textarea rows="2" data-type="btn" data-k="label_gr">${safeText(b.label_gr)}</textarea></div>
            <div><label>Label (EN)</label><textarea rows="2" data-type="btn" data-k="label_en">${safeText(b.label_en)}</textarea></div>
            <div><label>Link URL</label><textarea rows="2" class="mono" data-type="btn" data-k="url">${safeText(b.url)}</textarea></div>
            <div><label>Icon URL (Optional)</label><textarea rows="2" class="mono" data-type="btn" data-k="iconUrl">${safeText(b.iconUrl)}</textarea></div>
            <div>
              <label>Style</label>
              <select data-type="btn" data-k="style">
                <option value="ghost" ${b.style!=='primary'?'selected':''}>Ghost (Gray)</option>
                <option value="primary" ${b.style==='primary'?'selected':''}>Primary (Red)</option>
              </select>
            </div>
          </div>
        </div>
      `).join('');
    }

    const vidWrap = $('videosList');
    if (vidWrap) {
      vidWrap.innerHTML = state.extraVideos.map((v, i) => `
        <div class="item" data-id="${v.id}">
          <div class="top">
            <div class="row"><span class="drag">☰</span> <strong>Video ${i+1}</strong></div>
            <div class="row">
              <button class="btn small" data-act="up-vid">↑</button>
              <button class="btn small" data-act="down-vid">↓</button>
              <button class="btn small danger" data-act="del-vid">X</button>
            </div>
          </div>
          <div>
            <label>YouTube URL</label>
            <textarea rows="2" class="mono" data-type="vid" data-k="url">${safeText(v.url)}</textarea>
          </div>
        </div>
      `).join('');
    }
  }

  // Event Delegation for inputs
  document.addEventListener('input', (e) => {
    const target = e.target;
    if(target.dataset.type === 'btn') {
      const id = target.closest('.item').dataset.id;
      const item = state.extraButtons.find(x => x.id === id);
      if(item) { item[target.dataset.k] = target.value; syncAll(false); }
    }
    if(target.dataset.type === 'vid') {
      const id = target.closest('.item').dataset.id;
      const item = state.extraVideos.find(x => x.id === id);
      if(item) { item[target.dataset.k] = target.value; syncAll(false); }
    }
  });

  // Event Delegation for Clicks (Delete, Up, Down)
  document.addEventListener('click', (e) => {
    const btn = e.target.closest('button');
    if(!btn) return;
    const act = btn.dataset.act;
    if(!act) return;

    const itemEl = btn.closest('.item');
    if(!itemEl) return;
    const id = itemEl.dataset.id;
    
    // Deletes
    if(act === 'del') { state.extraButtons = state.extraButtons.filter(x => x.id !== id); syncAll(); }
    if(act === 'del-vid') { state.extraVideos = state.extraVideos.filter(x => x.id !== id); syncAll(); }
    
    // Buttons Order
    if(act === 'up' || act === 'down') {
      const i = state.extraButtons.findIndex(x => x.id === id);
      if(i > 0 && act === 'up') { [state.extraButtons[i-1], state.extraButtons[i]] = [state.extraButtons[i], state.extraButtons[i-1]]; syncAll(); }
      if(i < state.extraButtons.length-1 && act === 'down') { [state.extraButtons[i+1], state.extraButtons[i]] = [state.extraButtons[i], state.extraButtons[i+1]]; syncAll(); }
    }

    // Videos Order
    if(act === 'up-vid' || act === 'down-vid') {
      const i = state.extraVideos.findIndex(x => x.id === id);
      if(i > 0 && act === 'up-vid') { [state.extraVideos[i-1], state.extraVideos[i]] = [state.extraVideos[i], state.extraVideos[i-1]]; syncAll(); }
      if(i < state.extraVideos.length-1 && act === 'down-vid') { [state.extraVideos[i+1], state.extraVideos[i]] = [state.extraVideos[i], state.extraVideos[i+1]]; syncAll(); }
    }
  });

  // HTML Builder
  function buildHtml() {
    const isGR = state.lang === 'gr';
    
    const imgHtml = state.topImage ? `<img src="${safeText(state.topImage)}" alt="Product Image" style="width:100%; border-radius:14px; margin-bottom:16px; display:block; object-fit:cover;">` : '';
    const bulletsHtml = (state.bullets && state.bullets.length) ? `<ul style="margin:0 0 14px 18px; padding:0; font-size:14px; line-height:1.55; color:#222;">${state.bullets.map(b=>`<li>${safeText(b)}</li>`).join('')}</ul>` : '';

    const ytEmbed = state.video ? youTubeToEmbed(state.video.url) : '';
    const mainVideoHtml = ytEmbed ? `
      <div style="flex:1 1 420px;">
        <div style="position:relative; width:100%; padding-top:56.25%; border-radius:14px; overflow:hidden; background:#000;">
          <iframe src="${safeText(ytEmbed)}" frameborder="0" allowfullscreen style="position:absolute; inset:0; width:100%; height:100%;"></iframe>
        </div>
      </div>` : '';

    const extraVidsHtml = (state.extraVideos && state.extraVideos.length) ? `
      <div style="display:grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap:16px; margin-top:20px;">
        ${state.extraVideos.map(v => v.url ? `
          <div style="position:relative; width:100%; padding-top:56.25%; border-radius:12px; overflow:hidden; background:#000;">
            <iframe src="${safeText(youTubeToEmbed(v.url))}" frameborder="0" allowfullscreen style="position:absolute; inset:0; width:100%; height:100%;"></iframe>
          </div>` : '').join('')}
      </div>` : '';

    const buttonStyle = (style) => style === 'primary' 
      ? 'display:inline-flex; align-items:center; gap:8px; padding:10px 14px; border-radius:12px; text-decoration:none; font-weight:700; font-size:14px; color:#B22222; border:1px solid rgba(178,34,34,0.25); background:rgba(178,34,34,0.06);'
      : 'display:inline-flex; align-items:center; gap:8px; padding:10px 14px; border-radius:12px; text-decoration:none; font-weight:700; font-size:14px; color:#111; border:1px solid #e9e9e9; background:#f7f7f7;';

    const createBtn = (url, label, icon, style) => url ? `
      <a href="${safeText(url)}" target="_blank" style="${buttonStyle(style)}">
        ${icon ? `<img src="${safeText(icon)}" style="width:20px; height:20px; object-fit:contain;">` : ''}
        ${safeText(label)}
      </a>` : '';

    const manualBtn = state.manual ? createBtn(state.manual.url, isGR ? state.manual.label_gr : state.manual.label_en, "https://www.elvhx.gr/image/catalog/New%20photos%202022/free-click-icon-2384-thumb.png", 'primary') : '';
    const videoBtn = state.video ? createBtn(state.video.url, isGR ? state.video.label_gr : state.video.label_en, null, 'ghost') : '';
    const extraBtnsHtml = (state.extraButtons || []).map(b => createBtn(b.url, isGR ? b.label_gr : b.label_en, b.iconUrl, b.style)).join('\n');
    const buttonsRow = [manualBtn, videoBtn, extraBtnsHtml].filter(Boolean).join('\n');

    // Diagrams Block
    let diagramsBlock = '';
    if (state.diagrams && state.diagrams.url) {
      const diagramsLabel = isGR ? state.diagrams.label_gr : state.diagrams.label_en;
      const diagramsSub = isGR ? state.diagrams.sub_gr : state.diagrams.sub_en;
      diagramsBlock = `
        <div style="margin-top:14px; background:linear-gradient(90deg, rgba(178,34,34,0.10), rgba(178,34,34,0.03)); border:1px solid rgba(178,34,34,0.18); border-radius:14px; padding:14px 16px;">
          <a href="${safeText(state.diagrams.url)}" target="_blank" style="display:flex; align-items:center; gap:12px; text-decoration:none;">
            <span style="width:40px; height:40px; border-radius:12px; display:grid; place-items:center; background:#fff; border:1px solid rgba(178,34,34,0.18); box-shadow:0 6px 16px rgba(0,0,0,0.06);">
              <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#B22222" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6"/><path d="M8 13h8"/><path d="M8 17h8"/><path d="M8 9h2"/></svg>
            </span>
            <span style="display:flex; flex-direction:column; gap:2px;">
              <span style="font-weight:800; font-size:14px; color:#B22222;">${safeText(diagramsLabel)}</span>
              <span style="font-size:12px; color:#444;">${safeText(diagramsSub)}</span>
            </span>
            <span style="margin-left:auto; font-weight:800; font-size:14px; color:#B22222; display:inline-flex; align-items:center; gap:8px;">${isGR?'Άνοιγμα':'Open'} <span style="display:inline-block; transform:translateY(-1px);">→</span></span>
          </a>
        </div>`;
    }

    const b64 = btoa(unescape(encodeURIComponent(JSON.stringify(state))));
    const toolDataComment = ``;

    return `${toolDataComment}
<div style="max-width:980px; margin:0 auto; font-family:Arial, sans-serif; color:#111;">
  <div style="background:#fff; border:1px solid #eee; border-radius:14px; padding:18px; box-shadow:0 6px 18px rgba(0,0,0,0.06);">
    ${imgHtml}
    <div style="display:flex; flex-wrap:wrap; align-items:flex-start; gap:16px;">
      <div style="flex:1 1 420px;">
        <div style="font-size:18px; font-weight:700; margin:0 0 8px 0;">${safeText(state.title)} ${state.code ? `(${safeText(state.code)})` : ''}</div>
        <div style="font-size:14px; line-height:1.5; color:#333; margin:0 0 12px 0;">${safeText(state.desc)}</div>
        ${bulletsHtml}
        ${buttonsRow ? `<div style="display:flex; flex-wrap:wrap; gap:10px; margin-top:10px;">${buttonsRow}</div>` : ''}
      </div>
      ${mainVideoHtml}
    </div>
    ${extraVidsHtml}
  </div>
  ${diagramsBlock}
</div>`;
  }

  // Sync UI and State
  function readForm() {
    if($('lang')) state.lang = $('lang').value;
    if($('topImage')) state.topImage = $('topImage').value.trim();
    if($('title')) state.title = $('title').value;
    if($('code')) state.code = $('code').value;
    if($('desc')) state.desc = $('desc').value;
    if($('bullets')) state.bullets = normalizeBullets($('bullets').value);
    
    if(!state.manual) state.manual = {};
    if($('manualUrl')) state.manual.url = $('manualUrl').value;
    if($('manualLabel')) state.manual[state.lang==='gr'?'label_gr':'label_en'] = $('manualLabel').value;
    
    if(!state.video) state.video = {};
    if($('youtubeUrl')) state.video.url = $('youtubeUrl').value;
    if($('videoBtnLabel')) state.video[state.lang==='gr'?'label_gr':'label_en'] = $('videoBtnLabel').value;

    if(!state.diagrams) state.diagrams = {};
    if($('diagramsUrl')) state.diagrams.url = $('diagramsUrl').value;
    if($('diagramsLabel')) state.diagrams[state.lang==='gr'?'label_gr':'label_en'] = $('diagramsLabel').value;
    if($('diagramsSub')) state.diagrams[state.lang==='gr'?'sub_gr':'sub_en'] = $('diagramsSub').value;
  }

  function fillForm() {
    if($('lang')) $('lang').value = state.lang;
    if($('topImage')) $('topImage').value = state.topImage || '';
    if($('title')) $('title').value = state.title || '';
    if($('code')) $('code').value = state.code || '';
    if($('desc')) $('desc').value = state.desc || '';
    if($('bullets')) $('bullets').value = (state.bullets || []).map(b => `• ${b}`).join('\n');
    
    if($('manualUrl')) $('manualUrl').value = state.manual ? state.manual.url || '' : '';
    if($('manualLabel')) $('manualLabel').value = state.manual ? (state.lang==='gr' ? state.manual.label_gr : state.manual.label_en) : '';
    
    if($('youtubeUrl')) $('youtubeUrl').value = state.video ? state.video.url || '' : '';
    if($('videoBtnLabel')) $('videoBtnLabel').value = state.video ? (state.lang==='gr' ? state.video.label_gr : state.video.label_en) : '';

    if($('diagramsUrl')) $('diagramsUrl').value = state.diagrams ? state.diagrams.url || '' : '';
    if($('diagramsLabel')) $('diagramsLabel').value = state.diagrams ? (state.lang==='gr' ? state.diagrams.label_gr : state.diagrams.label_en) : '';
    if($('diagramsSub')) $('diagramsSub').value = state.diagrams ? (state.lang==='gr' ? state.diagrams.sub_gr : state.diagrams.sub_en) : '';

    renderLists();
  }

  function syncAll(rebuildLists = true) {
    try {
      readForm();
      if(rebuildLists) renderLists();
      const html = buildHtml();
      if($('preview')) $('preview').innerHTML = html.replace(/\n?/,'');
      if($('output')) $('output').value = html;
      setStatus('Updated');
    } catch(e) {
      console.error("Sync Error: ", e);
      setStatus('Error!');
    }
  }

  // SAFE Event Attacher
  const addEvt = (id, event, handler) => {
    const el = $(id);
    if(el) el.addEventListener(event, handler);
  };

  // Event Listeners for main form
  addEvt('formArea', 'input', (e) => {
    if(['INPUT','TEXTAREA','SELECT'].includes(e.target.tagName) && !e.target.dataset.type) {
      syncAll(false);
    }
  });

  addEvt('btnAddButton', 'click', () => {
    state.extraButtons.push({ id: uid(), label_gr: 'Νέο κουμπί', label_en: 'New Button', url: '', iconUrl: '', style: 'ghost' });
    syncAll();
  });

  addEvt('btnAddVideo', 'click', () => {
    state.extraVideos.push({ id: uid(), url: '' });
    syncAll();
  });

  addEvt('btnReset', 'click', () => { state = defaultState(); fillForm(); syncAll(); setStatus('Reset'); });

  addEvt('btnCopy', 'click', async () => {
    try {
      await navigator.clipboard.writeText($('output').value);
      setStatus('Copied!');
    } catch {
      $('output').select();
      document.execCommand('copy');
      setStatus('Copied!');
    }
  });

  addEvt('btnExport', 'click', () => { if($('btnCopy')) $('btnCopy').click(); });

  addEvt('btnDownload', 'click', () => {
    const blob = new Blob([$('output').value], {type:'text/html;charset=utf-8'});
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'elvhx-product.html';
    a.click();
    URL.revokeObjectURL(a.href);
    setStatus('Downloaded!');
  });

  // Import Logic
  addEvt('btnImport', 'click', () => { $('modal').style.display='grid'; $('importArea').value=''; });
  addEvt('btnClose', 'click', () => { $('modal').style.display='none'; });
  addEvt('btnDoImport', 'click', () => {
    const m = $('importArea').value.match(//);
    if(m && m[1]) {
      try {
        const parsed = JSON.parse(decodeURIComponent(escape(atob(m[1]))));
        state = { ...defaultState(), ...parsed };
        fillForm(); syncAll(); setStatus('Imported!');
      } catch(e) { alert('Import failed.'); }
    } else { alert('No valid ELVHX_TOOL_DATA found.'); }
    $('modal').style.display='none';
  });

  // Init
  fillForm();
  syncAll();

});
