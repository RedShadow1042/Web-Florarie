// =============================================
// reviews.js — Pagina recenzii completa
// =============================================

const TAGS = ['Flori','Servicii','Atmosfera','Pret','Livrare','Ambalaj','Personal'];

// ── Inject CSS pentru carduri (functioneaza pe orice pagina) ──
(function injectReviewCSS() {
    if (document.getElementById('rv-card-css')) return;
    const style = document.createElement('style');
    style.id = 'rv-card-css';
    style.textContent = `
        .rv-card {
            background: #fff; border-radius: 14px; padding: 22px;
            box-shadow: 0 3px 18px rgba(92,26,35,.10);
            display: flex; flex-direction: column; gap: 11px;
            color: #333; position: relative;
            transition: transform .16s, box-shadow .16s;
        }
        .rv-card:hover { transform: translateY(-3px); box-shadow: 0 8px 28px rgba(92,26,35,.15); }
        .btn-delete-own {
            position: absolute; top: 12px; right: 12px;
            background: #fff0f0; border: 1.5px solid #ffcccc; cursor: pointer;
            color: #dc3545; font-size: 15px; padding: 5px 8px; border-radius: 7px;
            transition: background .15s, transform .1s; line-height: 1; z-index: 2;
        }
        .btn-delete-own:hover { background: #dc3545; color: white; transform: scale(1.1); }
        .card-head { display: flex; align-items: center; gap: 10px; padding-right: 32px; flex-wrap: wrap; }
        .card-stars { display: flex; gap: 2px; font-size: 17px; }
        .s-on  { color: #f5a623; }
        .s-off { color: #e0d5ce; }
        .type-badge { font-size: 10px; font-weight: 700; padding: 3px 9px; border-radius: 20px; white-space: nowrap; margin-left: auto; }
        .b-general { background: #e8f5e9; color: #2e7d32; }
        .b-product  { background: #fff3e0; color: #e65100; }
        .card-title { font-weight: 700; font-size: 15px; color: #5c1a23; line-height: 1.3; }
        .card-body  { font-size: 13px; line-height: 1.65; color: #555; }
        .card-tags  { display: flex; flex-wrap: wrap; gap: 6px; }
        .ctag { padding: 3px 11px; border-radius: 20px; background: #f5ebe1; color: #7a4a2a; font-size: 11px; font-weight: 600; cursor: pointer; transition: background .15s; }
        .ctag:hover  { background: #e8d5c4; }
        .ctag.active { background: #f5a623; color: #fff; }
        .card-foot { display: flex; justify-content: space-between; align-items: center; border-top: 1px solid #f5ebe1; padding-top: 10px; font-size: 11px; color: #aaa; flex-wrap: wrap; gap: 4px; margin-top: auto; }
        .prod-link { color: #b8685a; text-decoration: underline; cursor: pointer; font-style: italic; }
    `;
    document.head.appendChild(style);
})();
window.renderStars = function(n, cls1, cls2) {
    cls1 = cls1 || 's-on'; cls2 = cls2 || 's-off';
    return Array.from({length:5}, (_,i) =>
        `<span class="${i < n ? cls1 : cls2}">★</span>`
    ).join('');
};

window.formatDate = function(s) {
    return new Date(s).toLocaleDateString('ro-RO', {year:'numeric',month:'long',day:'numeric'});
};

function esc(s) {
    return String(s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
}

// ── Star picker standalone ────────────────────
window.initStarPicker = function(pickerId, hiddenId, init) {
    const picker = document.getElementById(pickerId);
    const hidden = document.getElementById(hiddenId);
    if (!picker) return;
    let cur = init || 5;
    function draw(h) {
        picker.innerHTML = '';
        for (let i = 1; i <= 5; i++) {
            const s = document.createElement('span');
            s.textContent = '★';
            s.style.cssText = `color:${i<=h?'#f5a623':'#e0d5ce'};cursor:pointer;font-size:36px;transition:transform .1s;user-select:none;line-height:1;`;
            s.onmouseenter = () => draw(i);
            s.onmouseleave = () => draw(cur);
            s.onclick = () => { cur=i; if(hidden) hidden.value=i; draw(i); };
            picker.appendChild(s);
        }
    }
    draw(cur);
    if (hidden) hidden.value = cur;
};

// ── Build review card ─────────────────────────
window.buildReviewCard = function(r, activeTag, currentUser) {
    const tags = r.tags ? r.tags.split(',').map(t=>t.trim()).filter(Boolean) : [];
    const tagsHtml = tags.map(t =>
        `<span class="ctag${t===activeTag?' active':''}" onclick="filterByTag('${esc(t)}')">${esc(t)}</span>`
    ).join('');

    const badge = r.type==='general'
        ? '<span class="type-badge b-general">🌿 Florărie</span>'
        : `<span class="type-badge b-product">🌸 Produs</span>`;

    const prodLink = (r.type==='product' && r.product_id)
        ? `<span class="prod-link" onclick="location.href='produs.html?id=${r.product_id}'">${esc(r.product_name||'Produs')}</span>`
        : '<span></span>';

    const isOwn = currentUser && String(currentUser.id) === String(r.user_id);
    const deleteBtn = isOwn
        ? `<button class="btn-delete-own" title="Sterge recenzia ta" onclick="deleteOwnReview(${r.id}, this)">🗑</button>`
        : '';

    return `
        <div class="rv-card" id="rv-card-${r.id}">
            ${deleteBtn}
            <div class="card-head">
                <div class="card-stars">${window.renderStars(r.rating)}</div>
                ${badge}
            </div>
            <div class="card-title">${esc(r.title)}</div>
            ${tagsHtml ? `<div class="card-tags">${tagsHtml}</div>` : ''}
            <div class="card-body">${esc(r.body)}</div>
            ${r.image ? `<img class="card-img" src="${r.image}" alt="Foto recenzie" style="width:100%;max-height:190px;object-fit:cover;border-radius:9px;border:1px solid #f0e6e0;display:block;">` : ''}
            <div class="card-foot">
                <span>👤 ${esc(r.user_name)}</span>
                ${prodLink}
                <span>📅 ${window.formatDate(r.created_at)}</span>
            </div>
        </div>`;
};

// ═══════════════════════════════════════════
// LOGICA PAGINII recenzii.html
// ═══════════════════════════════════════════
if (document.getElementById('rv-grid')) {

    let _all      = [];
    let _activeTag = null;
    const currentUser = JSON.parse(localStorage.getItem('floraria_current_user'));

    let _products = [];
    fetch('api/products.php?action=active').then(r=>r.json()).then(d=>{ if(Array.isArray(d)) _products=d; });

    // ── Load ─────────────────────────────────
    async function loadAll() {
        try {
            const res = await fetch('api/reviews.php?action=approved');
            _all = await res.json();
            if (!Array.isArray(_all)) _all = [];
        } catch(e) { _all = []; }
        buildHero();
        buildTagCloud();
        applyFilters();
        renderForm();
    }

    // ── Hero ─────────────────────────────────
    function buildHero() {
        const total = _all.length;
        const avgEl  = document.getElementById('h-avg');
        const stEl   = document.getElementById('h-stars');
        const cntEl  = document.getElementById('h-count');
        const barsEl = document.getElementById('h-bars');

        if (!total) {
            if (avgEl)  avgEl.textContent  = '—';
            if (stEl)   stEl.innerHTML     = '';
            if (cntEl)  cntEl.textContent  = 'Nicio recenzie încă';
            if (barsEl) barsEl.innerHTML   = '';
            return;
        }
        const avg = _all.reduce((s,r)=>s+parseInt(r.rating),0)/total;
        if (avgEl)  avgEl.textContent = avg.toFixed(1);
        if (stEl)   stEl.innerHTML    = window.renderStars(Math.round(avg));
        if (cntEl)  cntEl.textContent = `${total} recenz${total===1?'ie':'ii'}`;

        let bars = '';
        for (let s=5; s>=1; s--) {
            const cnt = _all.filter(r=>parseInt(r.rating)===s).length;
            const pct = Math.round(cnt/total*100);
            bars += `<div class="rv-bar-row">
                <span class="rv-bar-lbl">${s} ★</span>
                <div class="rv-bar-track"><div class="rv-bar-fill" style="width:${pct}%"></div></div>
                <span class="rv-bar-cnt">${cnt}</span>
            </div>`;
        }
        if (barsEl) barsEl.innerHTML = bars;
    }

    // ── Tag cloud ─────────────────────────────
    function buildTagCloud() {
        const cloud = document.getElementById('tag-cloud');
        if (!cloud) return;
        const counts = {};
        TAGS.forEach(t => counts[t] = 0);
        _all.forEach(r => {
            if (!r.tags) return;
            r.tags.split(',').map(t=>t.trim()).filter(Boolean).forEach(t => {
                if (counts[t] !== undefined) counts[t]++;
            });
        });
        cloud.innerHTML = TAGS.map(t => `
            <div class="tag-pill${_activeTag===t?' active':''}" onclick="filterByTag('${t}')">
                ${t} <span class="tc">${counts[t]}</span>
            </div>`).join('');
    }

    window.filterByTag = function(tag) {
        _activeTag = (_activeTag === tag) ? null : tag;
        buildTagCloud();
        applyFilters();
    };

    window.resetFilters = function() {
        _activeTag = null;
        document.getElementById('f-type').value  = '';
        document.getElementById('f-stars').value = '';
        document.getElementById('f-sort').value  = 'newest';
        buildTagCloud();
        applyFilters();
    };

    // ── Paginare ──────────────────────────────
    const PER_PAGE = 10;
    let _page = 1;
    let _filtered = [];

    // ── Filtre ────────────────────────────────
    window.applyFilters = function() {
        _filtered = [..._all];
        const type  = document.getElementById('f-type')?.value  || '';
        const stars = document.getElementById('f-stars')?.value || '';
        const sort  = document.getElementById('f-sort')?.value  || 'newest';

        if (type)       _filtered = _filtered.filter(r => r.type === type);
        if (stars)      _filtered = _filtered.filter(r => parseInt(r.rating) === parseInt(stars));
        if (_activeTag) _filtered = _filtered.filter(r => r.tags && r.tags.split(',').map(t=>t.trim()).includes(_activeTag));

        if (sort === 'highest') _filtered.sort((a,b) => b.rating - a.rating);
        else if (sort === 'lowest')  _filtered.sort((a,b) => a.rating - b.rating);
        else if (sort === 'oldest')  _filtered.sort((a,b) => new Date(a.created_at) - new Date(b.created_at));

        _page = 1;
        const cnt = document.getElementById('rv-count');
        if (cnt) cnt.textContent = `${_filtered.length} recenz${_filtered.length===1?'ie':'ii'}`;

        renderGrid();
        renderPagination();
    };

    // ── Grid cu paginare ──────────────────────
    function renderGrid() {
        const grid = document.getElementById('rv-grid');
        if (!_filtered.length) {
            grid.innerHTML = `<div class="rv-empty"><span class="em">🌸</span>Nicio recenzie găsită pentru filtrele selectate.</div>`;
            return;
        }
        const start = (_page - 1) * PER_PAGE;
        const page  = _filtered.slice(start, start + PER_PAGE);
        grid.innerHTML = page.map(r => window.buildReviewCard(r, _activeTag, currentUser)).join('');
    }

    // ── Paginare UI ───────────────────────────
    function renderPagination() {
        let pag = document.getElementById('rv-pagination');
        if (!pag) {
            pag = document.createElement('div');
            pag.id = 'rv-pagination';
            pag.style.cssText = 'display:flex;justify-content:center;align-items:center;gap:8px;flex-wrap:wrap;margin-top:4px;';
            document.getElementById('rv-grid').after(pag);
        }

        const total = Math.ceil(_filtered.length / PER_PAGE);
        if (total <= 1) { pag.innerHTML = ''; return; }

        let html = '';
        // Buton prev
        html += `<button onclick="goPage(${_page-1})" ${_page===1?'disabled':''} style="padding:7px 14px;border-radius:8px;border:1.5px solid #d4c5bc;background:${_page===1?'#f5f5f5':'white'};color:${_page===1?'#bbb':'#5c1a23'};cursor:${_page===1?'default':'pointer'};font-weight:600;font-size:13px;">← Anterior</button>`;

        // Numere pagini
        for (let i = 1; i <= total; i++) {
            if (total > 7 && i > 2 && i < total - 1 && Math.abs(i - _page) > 1) {
                if (i === 3 || i === total - 2) html += `<span style="color:#aaa;padding:0 4px;">…</span>`;
                continue;
            }
            html += `<button onclick="goPage(${i})" style="padding:7px 13px;border-radius:8px;border:1.5px solid ${i===_page?'#5c1a23':'#d4c5bc'};background:${i===_page?'#5c1a23':'white'};color:${i===_page?'white':'#5c1a23'};cursor:pointer;font-weight:600;font-size:13px;">${i}</button>`;
        }

        // Buton next
        html += `<button onclick="goPage(${_page+1})" ${_page===total?'disabled':''} style="padding:7px 14px;border-radius:8px;border:1.5px solid #d4c5bc;background:${_page===total?'#f5f5f5':'white'};color:${_page===total?'#bbb':'#5c1a23'};cursor:${_page===total?'default':'pointer'};font-weight:600;font-size:13px;">Următor →</button>`;

        html += `<span style="font-size:12px;color:#aaa;margin-left:6px;">Pagina ${_page} din ${total}</span>`;
        pag.innerHTML = html;
    }

    window.goPage = function(p) {
        const total = Math.ceil(_filtered.length / PER_PAGE);
        if (p < 1 || p > total) return;
        _page = p;
        renderGrid();
        renderPagination();
        // Scroll la inceputul gridului
        document.getElementById('rv-grid')?.scrollIntoView({behavior:'smooth', block:'start'});
    };

    // ── Sterge propriul review ────────────────
    window.deleteOwnReview = async function(id, btn) {
        if (!currentUser) return;
        if (!confirm('Ești sigur că vrei să îți ștergi recenzia? Aceasta acțiune este ireversibilă.')) return;

        btn.disabled = true;
        try {
            const res  = await fetch('api/reviews.php?action=delete_own', {
                method: 'DELETE',
                headers: {'Content-Type':'application/json'},
                body: JSON.stringify({ id, user_id: currentUser.id })
            });
            const data = await res.json();
            if (data.error) { alert(data.error); btn.disabled = false; return; }

            // Scoatem cardul cu animatie
            const card = document.getElementById(`rv-card-${id}`);
            if (card) {
                card.style.transition = 'opacity .3s, transform .3s';
                card.style.opacity = '0';
                card.style.transform = 'scale(.95)';
                setTimeout(() => { card.remove(); }, 300);
            }
            // Actualizam lista locala
            _all = _all.filter(r => parseInt(r.id) !== parseInt(id));
            buildHero();
            buildTagCloud();
            const cnt = document.getElementById('rv-count');
            if (cnt) {
                const visible = document.querySelectorAll('.rv-card').length - 1;
                cnt.textContent = `${visible} recenz${visible===1?'ie':'ii'}`;
            }
        } catch(e) {
            alert('Eroare de conexiune.');
            btn.disabled = false;
        }
    };

    // ── Formular cu toggle deasupra gridului ──
    function renderForm() {
        const area = document.getElementById('rv-form-area');
        if (!area) return;

        if (!currentUser) {
            // Buton simplu care duce la login
            area.innerHTML = `
                <div style="text-align:center;margin-bottom:8px;">
                    <a href="autentificare.html" style="display:inline-block;padding:12px 30px;background:#769b21;color:white;border-radius:10px;font-weight:700;font-size:15px;text-decoration:none;transition:background .2s;">
                        ✍️ Lasă o Recenzie
                    </a>
                    <p style="color:#aaa;font-size:13px;margin-top:8px;">Trebuie să fii conectat pentru a lăsa o recenzie.</p>
                </div>`;
            return;
        }

        area.innerHTML = `
            <div style="text-align:center;margin-bottom:16px;">
                <button id="toggle-form-btn" onclick="toggleReviewForm()" style="padding:13px 36px;background:#769b21;color:white;border:none;border-radius:11px;font-weight:700;font-size:15px;cursor:pointer;transition:background .2s;box-shadow:0 3px 12px rgba(118,155,33,.3);">
                    ✍️ Lasă o Recenzie
                </button>
            </div>
            <div id="rv-form-collapse" style="display:none;max-width:740px;margin:0 auto;width:100%;">
                <div class="rv-form-card">
                    <h3>✍️ Lasă o Recenzie</h3>

                    <div class="type-tabs">
                        <div class="ttab active" id="ttab-gen" onclick="switchTab('general')">🌿 Despre Florărie</div>
                        <div class="ttab"        id="ttab-pro" onclick="switchTab('product')">🌸 Despre un Produs</div>
                    </div>
                    <input type="hidden" id="rv-type" value="general">

                    <div class="frow" id="prod-row" style="display:none;">
                        <label>Produsul recenzat:</label>
                        <select id="rv-product">
                            <option value="">-- Alege un produs --</option>
                            ${_products.map(p=>`<option value="${p.id}" data-name="${esc(p.name)}">${esc(p.name)}</option>`).join('')}
                        </select>
                    </div>

                    <div class="frow">
                        <label>Rating:</label>
                        <div class="fstar-picker" id="f-sp"></div>
                        <input type="hidden" id="rv-rating" value="5">
                    </div>

                    <div class="frow">
                        <label>🏷️ Categorii (opțional):</label>
                        <div class="ftag-picker">
                            ${TAGS.map(t=>`<div class="ftag" data-tag="${t}" onclick="this.classList.toggle('active')">${t}</div>`).join('')}
                        </div>
                    </div>

                    <div class="frow">
                        <label>Titlu:</label>
                        <input type="text" id="rv-title" placeholder="Ex: Experiență minunată!">
                    </div>

                    <div class="frow">
                        <label>Recenzia ta:</label>
                        <textarea id="rv-body" placeholder="Descrie experiența ta..."></textarea>
                    </div>

                    <div class="frow">
                        <label>Fotografie (opțional):</label>
                        <input type="file" id="rv-img-file" accept="image/*" onchange="prevImg(this)">
                        <div class="img-prev-wrap" id="rv-img-wrap">
                            <img id="rv-img-prev" src="" alt="preview">
                            <button type="button" onclick="clearImg()">✕ Elimină poza</button>
                        </div>
                    </div>

                    <div class="fstatus" id="rv-status"></div>
                    <button class="btn-submit" id="rv-submit" onclick="submitReview()">Trimite Recenzia</button>
                </div>
            </div>`;

        window.initStarPicker('f-sp', 'rv-rating', 5);
    }

    window.toggleReviewForm = function() {
        const collapse = document.getElementById('rv-form-collapse');
        const btn      = document.getElementById('toggle-form-btn');
        if (!collapse) return;
        const isOpen = collapse.style.display !== 'none';
        collapse.style.display = isOpen ? 'none' : 'block';
        btn.textContent = isOpen ? '✍️ Lasă o Recenzie' : '✕ Închide formularul';
        btn.style.background = isOpen ? '#769b21' : '#b8685a';
        if (!isOpen) {
            collapse.scrollIntoView({behavior:'smooth', block:'start'});
        }
    };

    window.switchTab = function(type) {
        document.getElementById('rv-type').value = type;
        document.getElementById('ttab-gen').classList.toggle('active', type==='general');
        document.getElementById('ttab-pro').classList.toggle('active', type==='product');
        document.getElementById('prod-row').style.display = type==='product' ? 'block' : 'none';
    };

    window.prevImg = function(input) {
        if (!input.files[0]) return;
        const r = new FileReader();
        r.onload = ev => {
            document.getElementById('rv-img-prev').src = ev.target.result;
            document.getElementById('rv-img-wrap').style.display = 'block';
        };
        r.readAsDataURL(input.files[0]);
    };

    window.clearImg = function() {
        document.getElementById('rv-img-file').value = '';
        document.getElementById('rv-img-wrap').style.display = 'none';
    };

    window.submitReview = async function() {
        const btn    = document.getElementById('rv-submit');
        const status = document.getElementById('rv-status');
        const type   = document.getElementById('rv-type').value;
        const rating = parseInt(document.getElementById('rv-rating').value) || 5;
        const title  = document.getElementById('rv-title').value.trim();
        const body   = document.getElementById('rv-body').value.trim();
        const tags   = [...document.querySelectorAll('.ftag.active')].map(el=>el.dataset.tag);

        if (!title) { status.style.color='#dc3545'; status.textContent='Adaugă un titlu.'; return; }
        if (!body)  { status.style.color='#dc3545'; status.textContent='Scrie textul recenziei.'; return; }

        let productId = null, productName = null;
        if (type === 'product') {
            const sel = document.getElementById('rv-product');
            productId = sel?.value || null;
            if (!productId) { status.style.color='#dc3545'; status.textContent='Selectează un produs.'; return; }
            productName = sel.options[sel.selectedIndex]?.getAttribute('data-name') || '';
        }

        const imgEl = document.getElementById('rv-img-prev');
        const image = (imgEl && imgEl.src.startsWith('data:')) ? imgEl.src : null;

        btn.disabled = true; btn.textContent = 'Se trimite...'; status.textContent = '';

        try {
            const res = await fetch('api/reviews.php?action=add', {
                method:'POST', headers:{'Content-Type':'application/json'},
                body: JSON.stringify({
                    user_id: currentUser.id, user_name: currentUser.name,
                    type, product_id: productId, product_name: productName,
                    title, body, rating, tags, image
                })
            });
            const data = await res.json();
            if (data.error) {
                status.style.color='#dc3545'; status.textContent=data.error;
            } else {
                status.style.color='#769b21'; status.textContent='✅ ' + data.message;
                document.getElementById('rv-title').value = '';
                document.getElementById('rv-body').value  = '';
                document.querySelectorAll('.ftag.active').forEach(el=>el.classList.remove('active'));
                clearImg();
                window.initStarPicker('f-sp','rv-rating',5);
            }
        } catch(e) {
            status.style.color='#dc3545'; status.textContent='Eroare de conexiune.';
        }
        btn.disabled = false; btn.textContent = 'Trimite Recenzia';
    };

    loadAll();
}