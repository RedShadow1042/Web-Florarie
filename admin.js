// Acest fișier rulează exclusiv pe pagina admin.html

// ── Sanitizare HTML (previne XSS) ────────────
function escAdmin(str) {
    return String(str || '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

window.addEventListener('DOMContentLoaded', () => {
    setupAdminPanelLogic();
    setupHeroAdmin();
    setupReviewsAdmin();
    setupGalleryAdmin();
    setupGalleryManagement()
});

// ══════════════════════════════════════════
// SECTIUNEA 1 & 2: CATALOG + COMENZI (MySQL)
// ══════════════════════════════════════════
function setupAdminPanelLogic() {
    const form                     = document.getElementById('add-bouquet-form');
    const bouquetListContainer     = document.getElementById('admin-bouquets-list');
    const activeOrdersContainer    = document.getElementById('admin-active-orders-list');
    const completedOrdersContainer = document.getElementById('admin-completed-orders-list');
    const searchBar                = document.getElementById('order-search-bar');

    if (!bouquetListContainer || !activeOrdersContainer || !completedOrdersContainer) return;

    // Helper API — credentials:'include' trimite cookie-ul de sesiune PHP
    async function api(url, method, body) {
        const res = await fetch(url, {
            method:      method || 'GET',
            credentials: 'include',
            headers:     { 'Content-Type': 'application/json' },
            body:        body ? JSON.stringify(body) : undefined
        });
        return res.json();
    }

    // ── 1. Catalog produse ──────────────────
    async function renderAdminCatalog() {
        bouquetListContainer.innerHTML = '<tr><td colspan="6" style="text-align:center;color:#aaa;padding:15px;">Se incarca...</td></tr>';
        const catalog = await api('api/products.php?action=all');
        bouquetListContainer.innerHTML = '';

        if (!Array.isArray(catalog) || catalog.length === 0) {
            bouquetListContainer.innerHTML = '<tr><td colspan="6" style="text-align:center;color:#777;">Nu exista produse adaugate.</td></tr>';
            return;
        }

        catalog.forEach(bouquet => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td><img src="${escAdmin(bouquet.image)}" style="width:50px;height:50px;object-fit:cover;border-radius:4px;" onerror="this.src='Imagini/blank_image.jpg'"></td>
                <td><strong>${escAdmin(bouquet.name)}</strong></td>
                <td>${escAdmin(String(bouquet.price))} LEI</td>
                <td>${escAdmin(String(bouquet.discount || 0))}%</td>
                <td><input type="checkbox" ${bouquet.active ? 'checked' : ''} data-id="${escAdmin(String(bouquet.id))}" onchange="toggleActiveStatus(this)"></td>
                <td>
                    <button style="background:#f39c12;color:white;border:none;padding:5px 8px;border-radius:4px;cursor:pointer;margin-right:5px;"
                        onclick="window.location.href='edit-produs.html?id=${escAdmin(String(bouquet.id))}'">Editeaza</button>
                    <button style="background:#dc3545;color:white;border:none;padding:5px 8px;border-radius:4px;cursor:pointer;"
                        data-id="${escAdmin(String(bouquet.id))}" data-name="${escAdmin(bouquet.name)}" class="delete-product-btn">Sterge</button>
                </td>`;
            bouquetListContainer.appendChild(tr);
        });

        bouquetListContainer.querySelectorAll('.delete-product-btn').forEach(btn => {
            btn.addEventListener('click', async (e) => {
                const id   = e.target.getAttribute('data-id');
                const name = e.target.getAttribute('data-name');
                if (!confirm(`Sigur vrei sa stergi produsul "${name}"?`)) return;
                const res = await api('api/products.php?action=delete', 'DELETE', { id });
                if (res.error) { alert(res.error); return; }
                renderAdminCatalog();
            });
        });
    }

    window.toggleActiveStatus = async (checkbox) => {
        const id     = checkbox.getAttribute('data-id');
        const active = checkbox.checked;
        await api('api/products.php?action=toggle', 'POST', { id, active });
    };

    // ── 2. Comenzi ─────────────────────────
    let _allOrders = [];

    async function loadAndRenderOrders(filterKeyword = '') {
        activeOrdersContainer.innerHTML    = '<tr><td colspan="6" style="text-align:center;color:#aaa;padding:15px;">Se incarca...</td></tr>';
        completedOrdersContainer.innerHTML = '';
        _allOrders = await api('api/orders.php?action=all');
        renderAdminOrders(filterKeyword);
    }

    function renderAdminOrders(filterKeyword = '') {
        activeOrdersContainer.innerHTML    = '';
        completedOrdersContainer.innerHTML = '';
        const searchStr = filterKeyword.toLowerCase().trim();

        _allOrders.forEach(order => {
            const clientName = order.customer_name || 'Client Anonim';
            if (searchStr && !order.id.toLowerCase().includes(searchStr) && !clientName.toLowerCase().includes(searchStr)) return;

            const items = Array.isArray(order.items) ? order.items : [];
            const produseText = items.map(i => `${escAdmin(i.name)} (${escAdmin(String(i.price))} LEI)`).join(', ') || 'Produse nespecificate';
            const isActive = order.status !== 'completed';

            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td><code>#${escAdmin(order.id.replace('CMD-',''))}</code></td>
                <td><strong>${escAdmin(clientName)}</strong></td>
                <td>${produseText}</td>
                <td style="color:#769b21;font-weight:bold;">${escAdmin(String(order.total))} LEI</td>
                <td><small>${escAdmin(order.date || 'N/A')}</small></td>
                <td style="display:flex;gap:8px;align-items:center;padding:10px;">
                    ${isActive
                        ? `<button class="btn-status-success" style="padding:4px 8px;font-size:11px;cursor:pointer;" data-id="${escAdmin(order.id)}">Finalizeaza ✓</button>`
                        : '<span style="color:#769b21;font-weight:bold;font-size:12px;">Finalizata</span>'
                    }
                    <button class="btn-status-danger" style="padding:4px 8px;font-size:11px;cursor:pointer;" data-id="${escAdmin(order.id)}">Elimina ✕</button>
                </td>`;

            tr.querySelectorAll('button').forEach(btn => {
                btn.addEventListener('click', async () => {
                    const oid = btn.getAttribute('data-id');
                    if (btn.classList.contains('btn-status-success')) {
                        await api('api/orders.php?action=status', 'POST', { id: oid, status: 'completed' });
                    } else {
                        if (!confirm('Stergi comanda definitiv?')) return;
                        await api('api/orders.php?action=delete', 'DELETE', { id: oid });
                    }
                    await loadAndRenderOrders(searchBar ? searchBar.value : '');
                });
            });

            if (isActive) activeOrdersContainer.appendChild(tr);
            else completedOrdersContainer.appendChild(tr);
        });

        if (!activeOrdersContainer.innerHTML)    activeOrdersContainer.innerHTML    = '<tr><td colspan="6" style="text-align:center;color:#777;padding:20px;">Nu exista comenzi active.</td></tr>';
        if (!completedOrdersContainer.innerHTML) completedOrdersContainer.innerHTML = '<tr><td colspan="6" style="text-align:center;color:#777;padding:20px;">Nu exista comenzi finalizate.</td></tr>';
    }

    if (searchBar) searchBar.addEventListener('input', e => renderAdminOrders(e.target.value));

    // ── 3. Adaugare produs nou ──────────────
    if (form) {
        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            const btn       = form.querySelector('button[type="submit"]');
            const name      = document.getElementById('bouquet-name').value.trim();
            const price     = document.getElementById('bouquet-price').value;
            const discount  = document.getElementById('bouquet-discount').value;
            const desc      = document.getElementById('bouquet-desc').value.trim();
            const fileInput = document.getElementById('bouquet-image');

            btn.disabled = true;
            btn.textContent = 'Se salveaza...';

            const saveProduct = async (imageSrc) => {
                const res = await api('api/products.php?action=add', 'POST', {
                    name, price: parseInt(price), discount: parseInt(discount) || 0,
                    desc, image: imageSrc || 'Imagini/blank_image.jpg'
                });
                btn.disabled = false;
                btn.textContent = 'Adauga Produs';
                if (res.error) { alert(res.error); return; }
                alert('Produsul a fost adaugat!');
                form.reset();
                renderAdminCatalog();
            };

            if (fileInput && fileInput.files && fileInput.files[0]) {
                const reader = new FileReader();
                reader.onload = ev => saveProduct(ev.target.result);
                reader.readAsDataURL(fileInput.files[0]);
            } else {
                saveProduct(null);
            }
        });
    }

    renderAdminCatalog();
    loadAndRenderOrders();
}

// ═══════════════════════════════════════════════════════════
// RICH TEXT EDITOR — implementare custom, fara execCommand
// ═══════════════════════════════════════════════════════════

let _savedRange = null;

function saveSelection(editorId) {
    const editor = document.getElementById('hero-' + editorId);
    if (!editor) return;
    const sel = window.getSelection();
    if (sel && sel.rangeCount > 0) {
        const range = sel.getRangeAt(0);
        if (editor.contains(range.commonAncestorContainer)) {
            _savedRange = range.cloneRange();
        }
    }
}

function restoreSelection() {
    if (!_savedRange) return false;
    const sel = window.getSelection();
    sel.removeAllRanges();
    sel.addRange(_savedRange);
    return true;
}

// Functia centrala: aplica un stil CSS pe selectia curenta.
// Parcurge recursiv nodurile din fragment si suprascrie stilul pe fiecare span
// sau creeaza unul nou in jurul nodurilor text.
function applyStyleToSelection(styleProp, styleValue) {
    if (!restoreSelection()) return;
    const sel = window.getSelection();
    if (!sel || sel.rangeCount === 0 || sel.isCollapsed) return;

    const range = sel.getRangeAt(0);
    const fragment = range.extractContents();

    function wrapNode(node) {
        if (node.nodeType === Node.TEXT_NODE) {
            if (node.textContent === '') return node.cloneNode();
            const span = document.createElement('span');
            span.style[styleProp] = styleValue;
            span.appendChild(node.cloneNode());
            return span;
        }
        if (node.nodeType === Node.ELEMENT_NODE) {
            const clone = node.cloneNode(false);
            // Daca e span, suprascriem stilul direct pe el
            if (node.tagName === 'SPAN') {
                clone.style[styleProp] = styleValue;
            }
            node.childNodes.forEach(child => clone.appendChild(wrapNode(child)));
            return clone;
        }
        return node.cloneNode(true);
    }

    const newFrag = document.createDocumentFragment();
    fragment.childNodes.forEach(child => newFrag.appendChild(wrapNode(child)));
    range.insertNode(newFrag);
    syncHeroPreview();
}

window.rteCmd = (editorId, command) => {
    if (!restoreSelection()) return;
    const sel = window.getSelection();
    if (!sel || sel.rangeCount === 0 || sel.isCollapsed) return;
    if (command === 'bold') {
        const isBold = document.queryCommandState('bold');
        applyStyleToSelection('fontWeight', isBold ? 'normal' : 'bold');
    } else if (command === 'italic') {
        const isItalic = document.queryCommandState('italic');
        applyStyleToSelection('fontStyle', isItalic ? 'normal' : 'italic');
    } else if (command === 'underline') {
        const isUnderline = document.queryCommandState('underline');
        applyStyleToSelection('textDecoration', isUnderline ? 'none' : 'underline');
    } else if (command === 'strikeThrough') {
        applyStyleToSelection('textDecoration', 'line-through');
    }
    syncHeroPreview();
};

window.rteFont = (editorId, fontFamily) => {
    applyStyleToSelection('fontFamily', fontFamily === 'inherit' ? '' : fontFamily);
};

window.rteFontSize = (editorId, size) => {
    if (!size) return;
    applyStyleToSelection('fontSize', size);
};

window.rteForeColor = (editorId, color) => {
    applyStyleToSelection('color', color);
};

// Elimina toata formatarea — inlocuieste selectia cu text simplu
window.rteClear = (editorId) => {
    if (!restoreSelection()) return;
    const sel = window.getSelection();
    if (!sel || sel.rangeCount === 0 || sel.isCollapsed) return;
    const range = sel.getRangeAt(0);
    const fragment = range.extractContents();
    const plainText = document.createTextNode(fragment.textContent);
    range.insertNode(plainText);
    syncHeroPreview();
};

// ══════════════════════════════════════════
// PREVIEW LIVE — pozitii independente
// ══════════════════════════════════════════

// Debounce pentru text sync (tastat)
let _syncPreviewTimer = null;
window.syncHeroPreview = () => {
    clearTimeout(window._syncTimer);
    window._syncTimer = setTimeout(_doSyncHeroPreview, 150);
};

function _doSyncHeroPreview() {
    const g = id => document.getElementById(id);
    const previewBox = g('hero-preview');
    if (!previewBox) return;

    // ── Text ──
    const ptitle = g('preview-title');
    const psub   = g('preview-subtitle');
    const pbtn   = g('preview-btn');

    if (ptitle) {
        const html = g('hero-title')?.innerHTML || '';
        ptitle.innerHTML = (html && html !== '<br>') ? html : '<span style="opacity:.3">Titlul panoului</span>';
    }
    if (psub) {
        const html = g('hero-subtitle')?.innerHTML || '';
        psub.innerHTML = (html && html !== '<br>') ? html : '<span style="opacity:.25">Subtitlul</span>';
    }
    if (pbtn) {
        const txt = g('hero-btn-text')?.value || '';
        pbtn.textContent   = txt || 'Buton';
        pbtn.style.display = txt ? 'inline-block' : 'none';
    }
    const btnLink = g('hero-btn-link');
    if (pbtn && btnLink) pbtn.href = btnLink.value || '#';

    // ── Fundal ──
    const imgData = g('hero-bg-image-data')?.value || '';
    const bgImg   = g('preview-bg-img');
    if (imgData) {
        if (bgImg) { bgImg.src = imgData; bgImg.style.display = 'block'; }
        previewBox.style.background = '#111';
    } else {
        if (bgImg) bgImg.style.display = 'none';
        const bgTxt = g('hero-bg-color-text')?.value.trim() || '';
        const bgCol = g('hero-bg-color')?.value || '#f5ebe1';
        previewBox.style.background = bgTxt || bgCol;
    }

    // ── Gradient overlay ──
    const overlay = g('preview-overlay');
    if (overlay) {
        const dir = g('hero-gradient-dir')?.value || 'to right';
        const str = parseInt(g('hero-gradient-strength')?.value || 55);
        overlay.style.background = imgData
            ? `linear-gradient(${dir}, rgba(0,0,0,${(str/100).toFixed(2)}) 0%, rgba(0,0,0,0) 70%)`
            : 'none';
    }

    _applyPreviewPos();
}

function _applyPreviewPos() {
    const px = parseFloat(document.getElementById('hero-pos-x')?.value ?? 50);
    const py = parseFloat(document.getElementById('hero-pos-y')?.value ?? 50);
    const block = document.getElementById('preview-content');
    if (block) {
        block.style.left      = px + '%';
        block.style.top       = py + '%';
        block.style.transform = 'translate(-50%, -50%)';
    }
    const dx = document.getElementById('preview-pos-x');
    const dy = document.getElementById('preview-pos-y');
    if (dx) dx.textContent = Math.round(px);
    if (dy) dy.textContent = Math.round(py);
}

window.updatePosFromInputs = () => _applyPreviewPos();

window.setPresetPos = (x, y) => {
    const xEl = document.getElementById('hero-pos-x');
    const yEl = document.getElementById('hero-pos-y');
    if (xEl) xEl.value = x;
    if (yEl) yEl.value = y;
    _applyPreviewPos();
};

window.openHeroPreview  = () => {};
window.closeHeroPreview = () => {};

// ── Drag bloc text ca un grup ──
window.startDragText = (e) => {
    e.preventDefault(); e.stopPropagation();
    const preview = document.getElementById('hero-preview');
    const block   = document.getElementById('preview-content');
    if (!preview || !block) return;
    block.style.cursor = 'grabbing';
    const move = ev => _moveDragTo(ev.clientX, ev.clientY);
    const up   = () => {
        block.style.cursor = 'grab';
        document.removeEventListener('mousemove', move);
        document.removeEventListener('mouseup', up);
    };
    document.addEventListener('mousemove', move);
    document.addEventListener('mouseup', up);
    _moveDragTo(e.clientX, e.clientY);
};

window.startDragTextTouch = (e) => {
    if (!e.touches?.[0]) return;
    e.preventDefault();
    _moveDragTo(e.touches[0].clientX, e.touches[0].clientY);
    const move = ev => { if (ev.touches?.[0]) _moveDragTo(ev.touches[0].clientX, ev.touches[0].clientY); };
    const up   = () => { document.removeEventListener('touchmove', move); document.removeEventListener('touchend', up); };
    document.addEventListener('touchmove', move, { passive: false });
    document.addEventListener('touchend', up);
};

function _moveDragTo(clientX, clientY) {
    const preview = document.getElementById('hero-preview');
    if (!preview) return;
    const rect = preview.getBoundingClientRect();
    const px = Math.max(2, Math.min(98, Math.round((clientX - rect.left) / rect.width  * 100)));
    const py = Math.max(2, Math.min(98, Math.round((clientY - rect.top)  / rect.height * 100)));
    const xEl = document.getElementById('hero-pos-x');
    const yEl = document.getElementById('hero-pos-y');
    if (xEl) xEl.value = px;
    if (yEl) yEl.value = py;
    _applyPreviewPos();
}






// ══════════════════════════════════════════
// SECȚIUNEA 3: HERO SECTIONS ADMIN
// ══════════════════════════════════════════
function setupHeroAdmin() {
    // Salvam selectia cand editorul pierde focus
    ['hero-title', 'hero-subtitle'].forEach(id => {
        const el = document.getElementById(id);
        if (!el) return;
        const editorId = id.replace('hero-', '');
        el.addEventListener('mouseup', () => saveSelection(editorId));
        el.addEventListener('keyup',   () => saveSelection(editorId));
        el.addEventListener('blur',    () => saveSelection(editorId));
    });

    const bgColorPicker = document.getElementById('hero-bg-color');
    const bgColorText   = document.getElementById('hero-bg-color-text');
    const heroPreview   = document.getElementById('hero-preview');

    if (bgColorPicker) bgColorPicker.addEventListener('input', () => {
        if (bgColorText) bgColorText.value = bgColorPicker.value;
        heroPreview.style.background = bgColorPicker.value;
    });
    if (bgColorText) bgColorText.addEventListener('input', () => {
        heroPreview.style.background = bgColorText.value;
        if (/^#[0-9a-f]{6}$/i.test(bgColorText.value.trim()) && bgColorPicker) bgColorPicker.value = bgColorText.value.trim();
        syncHeroPreview();
    });

    // Helper API
    async function heroApi(action, method, body) {
        const res = await fetch(`api/hero.php?action=${action}`, {
            method:      method || 'GET',
            credentials: 'include',
            headers:     { 'Content-Type': 'application/json' },
            body:        body ? JSON.stringify(body) : undefined
        });
        return res.json();
    }

    // Cache local al slide-urilor (pentru editare)
    let _slides = [];

    async function renderHeroList() {
        const list = document.getElementById('hero-slides-list');
        list.innerHTML = '<p style="color:#aaa;font-size:13px;padding:10px 0;">Se incarca...</p>';
        _slides = await heroApi('all');

        if (!Array.isArray(_slides) || _slides.length === 0) {
            list.innerHTML = '<p style="color:#777;font-size:13px;padding:10px 0;">Nu exista panouri configurate. Adauga primul panou folosind formularul de mai sus.</p>';
            return;
        }

        list.innerHTML = '';
        _slides.forEach((slide, index) => {
            const card = document.createElement('div');
            card.className = 'hero-admin-card';
            const tempDiv = document.createElement('div');
            tempDiv.innerHTML = slide.title || '';
            const plainTitle = tempDiv.textContent || '(fara titlu)';
            tempDiv.innerHTML = slide.subtitle || '';
            const plainSub = tempDiv.textContent || '(fara subtitlu)';

            card.innerHTML = `
                <div style="background:${slide.bg||'#f5ebe1'};width:40px;height:40px;border-radius:6px;border:1px solid #ccc;flex-shrink:0;"></div>
                <div class="hero-admin-card-body">
                    <strong>${plainTitle}</strong>
                    <span>${plainSub}</span>
                    ${slide.btn_text ? `<span style="display:block;margin-top:3px;font-size:12px;">🔗 ${slide.btn_text} → ${slide.btn_link||'#'}</span>` : ''}
                </div>
                <div class="hero-admin-actions">
                    <div class="hero-order-btns">
                        <button onclick="moveHeroSlide(${slide.id},'up')" ${index===0?'disabled':''}>▲</button>
                        <button onclick="moveHeroSlide(${slide.id},'down')" ${index===_slides.length-1?'disabled':''}>▼</button>
                    </div>
                    <span class="hero-badge ${slide.active?'activ':'inactiv'}" style="cursor:pointer;"
                          onclick="toggleHeroActive(${slide.id},${slide.active})" title="Click pentru activa/dezactiva">
                        ${slide.active ? 'Activ' : 'Inactiv'}
                    </span>
                    <button onclick="editHeroSlide(${slide.id})" style="background:#f39c12;color:white;border:none;padding:5px 9px;border-radius:4px;cursor:pointer;font-weight:bold;font-size:12px;">✏️</button>
                    <button onclick="deleteHeroSlide(${slide.id},'${plainTitle.replace(/'/g,"\\'")}')" style="background:#dc3545;color:white;border:none;padding:5px 9px;border-radius:4px;cursor:pointer;font-weight:bold;font-size:12px;">✕</button>
                </div>`;
            list.appendChild(card);
        });
    }


    // ── Upload imagine fundal ──
    window.handleHeroBgImage = (input) => {
        if (!input.files || !input.files[0]) return;
        const file = input.files[0];
        if (file.size > 5 * 1024 * 1024) { alert('Imaginea trebuie sa fie mai mica de 5MB.'); input.value = ''; return; }
        const reader = new FileReader();
        reader.onload = (e) => {
            const data = e.target.result;
            document.getElementById('hero-bg-image-data').value        = data;
            document.getElementById('img-upload-thumb').src            = data;
            document.getElementById('img-upload-preview').style.display = 'block';
            document.getElementById('img-upload-label').innerHTML =
                '<span>\u2705 ' + file.name + '</span>' +
                '<input type="file" id="hero-bg-image-file" accept="image/*" style="display:none;" onchange="handleHeroBgImage(this)">';
            clearTimeout(_syncPreviewTimer); _doSyncHeroPreview();
        };
        reader.readAsDataURL(file);
    };

    window.clearHeroBgImage = () => {
        document.getElementById('hero-bg-image-data').value         = '';
        document.getElementById('img-upload-preview').style.display = 'none';
        document.getElementById('img-upload-thumb').src             = '';
        document.getElementById('img-upload-label').innerHTML =
            '<span>\ud83d\udcc1 Click pentru a alege imaginea</span>' +
            '<input type="file" id="hero-bg-image-file" accept="image/*" style="display:none;" onchange="handleHeroBgImage(this)">';
        clearTimeout(_syncPreviewTimer); _doSyncHeroPreview();
    };

    window.saveHeroSlide = async () => { try {
        const titleEl    = document.getElementById('hero-title');
        const subtitleEl = document.getElementById('hero-subtitle');
        const title    = titleEl ? titleEl.innerHTML.trim() : '';
        const subtitle = subtitleEl ? subtitleEl.innerHTML.trim() : '';
        const btnText  = document.getElementById('hero-btn-text').value.trim();
        const btnLink  = document.getElementById('hero-btn-link').value.trim();
        const bgText   = document.getElementById('hero-bg-color-text').value.trim();
        const bgColor  = bgText || document.getElementById('hero-bg-color').value;
        const editId   = parseInt(document.getElementById('hero-edit-index').value);
        const imgData  = document.getElementById('hero-bg-image-data').value;
        const posX    = parseInt(document.getElementById('hero-pos-x')?.value) || 50;
        const posY    = parseInt(document.getElementById('hero-pos-y')?.value) || 50;
        const gradDir = document.getElementById('hero-gradient-dir')?.value || 'to right';
        const gradStr = parseInt(document.getElementById('hero-gradient-strength')?.value || 55);

        const isEmpty = h => !h || h === '' || h === '<br>';
        if (isEmpty(title) && isEmpty(subtitle)) { alert('Adauga cel putin un titlu sau subtitlu.'); return; }

        const posData = { posX, posY };
        let res;
        if (editId > 0) {
            res = await heroApi('edit', 'POST', { id: editId, title, subtitle, btnText, btnLink, bg: bgColor, bgImage: imgData, ...posData, gradDir, gradStr });
        } else {
            if (_slides.length >= 5) { alert('Poti adauga maxim 5 panouri.'); return; }
            res = await heroApi('add', 'POST', { title, subtitle, btnText, btnLink, bg: bgColor, bgImage: imgData, ...posData, gradDir, gradStr });
        }
        if (res.error) { alert(res.error); return; }
        resetHeroForm();
        renderHeroList();
        alert(editId > 0 ? 'Panoul a fost actualizat!' : 'Panoul a fost adaugat cu succes!');
    } catch(err) { console.error('saveHeroSlide error:', err); alert('Eroare: ' + err.message); } };

    window.editHeroSlide = (id) => {
        const s = _slides.find(sl => sl.id == id);
        if (!s) return;
        document.getElementById('hero-title').innerHTML    = s.title || '';
        document.getElementById('hero-subtitle').innerHTML = s.subtitle || '';
        document.getElementById('hero-btn-text').value     = s.btn_text || '';
        document.getElementById('hero-btn-link').value     = s.btn_link || '';
        document.getElementById('hero-bg-color-text').value= s.bg || '#f5ebe1';
        document.getElementById('hero-bg-color').value     = /^#[0-9a-f]{6}$/i.test(s.bg) ? s.bg : '#f5ebe1';
        document.getElementById('hero-edit-index').value   = s.id;
        document.getElementById('hero-pos-x').value = s.pos_x != null ? s.pos_x : 50;
        document.getElementById('hero-pos-y').value = s.pos_y != null ? s.pos_y : 50;
        if (s.grad_dir) document.getElementById('hero-gradient-dir').value = s.grad_dir;
        if (s.grad_str) { document.getElementById('hero-gradient-strength').value = s.grad_str; document.getElementById('grad-str-val').textContent = s.grad_str + '%'; }

        // Imagine
        if (s.bg_image) {
            document.getElementById('hero-bg-image-data').value = s.bg_image;
            document.getElementById('img-upload-thumb').src = s.bg_image;
            document.getElementById('img-upload-preview').style.display = 'block';
            document.getElementById('img-upload-label').textContent = '✅ Imagine existentă';
        } else {
            window.clearHeroBgImage();
        }

        document.getElementById('hero-form-title').textContent  = 'Editeaza Panoul';
        document.getElementById('hero-cancel-btn').style.display = 'inline-block';
        clearTimeout(_syncPreviewTimer); _doSyncHeroPreview();
        document.getElementById('hero-title').scrollIntoView({ behavior:'smooth', block:'center' });
    };

    window.cancelHeroEdit = () => resetHeroForm();

    function resetHeroForm() {
        document.getElementById('hero-title').innerHTML    = '';
        document.getElementById('hero-subtitle').innerHTML = '';
        document.getElementById('hero-btn-text').value     = '';
        document.getElementById('hero-btn-link').value     = '';
        document.getElementById('hero-bg-color-text').value= '';
        document.getElementById('hero-bg-color').value     = '#f5ebe1';
        document.getElementById('hero-edit-index').value   = '-1';
        document.getElementById('hero-pos-x').value = '50';
        document.getElementById('hero-pos-y').value = '50';
        if (document.getElementById('hero-gradient-dir')) document.getElementById('hero-gradient-dir').value = 'to right';
        if (document.getElementById('hero-gradient-strength')) { document.getElementById('hero-gradient-strength').value = '55'; document.getElementById('grad-str-val').textContent = '55%'; }
        document.getElementById('hero-form-title').textContent = 'Adauga Panou Nou';
        document.getElementById('hero-cancel-btn').style.display = 'none';
        window.clearHeroBgImage();
        clearTimeout(_syncPreviewTimer); _doSyncHeroPreview();
    }

    window.deleteHeroSlide = async (id, name) => {
        if (!confirm(`Sigur vrei sa stergi panoul "${name}"?`)) return;
        const res = await heroApi('delete', 'DELETE', { id });
        if (res.error) { alert(res.error); return; }
        renderHeroList();
    };

    window.toggleHeroActive = async (id, currentActive) => {
        await heroApi('toggle', 'POST', { id, active: !currentActive });
        renderHeroList();
    };

    window.moveHeroSlide = async (id, direction) => {
        await heroApi('reorder', 'POST', { id, direction });
        renderHeroList();
    };

    renderHeroList();
    clearTimeout(_syncPreviewTimer); _doSyncHeroPreview();
}

// ══════════════════════════════════════════
// SECTIUNEA GALERIE
// ══════════════════════════════════════════

// 1. Adăugare poze
function setupGalleryAdmin() {
    const form = document.getElementById('add-gallery-form');
    if (!form) return;

    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const fileInput = document.getElementById('gallery-file');
        const titleInput = document.getElementById('gallery-title');
        const file = fileInput.files[0];
        if (!file) return alert("Selectează o poză!");

        const reader = new FileReader();
        reader.onloadend = async () => {
            const payload = {
                image: reader.result,
                title: titleInput.value,
                made_by: currentUser ? currentUser.username : 'Admin'
            };
            
            const res = await fetch('api/gallery.php?action=add', {
                method: 'POST',
                credentials: 'include',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
            const data = await res.json();
            if (data.success) {
                alert('Adăugat!');
                form.reset();
                // Reîncărcăm și lista pentru a vedea poza nouă
                if (typeof loadGalleryAdmin === 'function') loadGalleryAdmin();
            } else {
                alert('Eroare: ' + (data.error || 'Necunoscut'));
            }
        };
        reader.readAsDataURL(file);
    });
}

// 2. Administrare (Ștergere)
function setupGalleryManagement() {
    const listContainer = document.getElementById('admin-gallery-list');
    if (!listContainer) return;

    // Definim loadGalleryAdmin global pentru a putea fi apelat din alte funcții
    window.loadGalleryAdmin = async function() {
        const listContainer = document.getElementById('admin-gallery-list');
        if (!listContainer) return;
        
        const res   = await fetch('api/gallery.php?action=all', { credentials: 'include' });
        const items = await res.json();
        
        listContainer.innerHTML = items.map(item => `
            <tr>
                <td><img src="${escAdmin(item.image)}" style="width:60px; height:60px; object-fit:cover; border-radius:4px;"></td>
                <td>${escAdmin(item.title)}</td>
                <td>${escAdmin(item.made_by)}</td>
                <td>
                    <button onclick="deleteGalleryItem(${parseInt(item.id)})" class="btn-delete">Șterge</button>
                </td>
            </tr>
        `).join('');
    };

    window.deleteGalleryItem = async (id) => {
        if (!confirm('Sigur ștergi?')) return;
        await fetch('api/gallery.php?action=delete', {
            method:      'DELETE',
            credentials: 'include',
            headers:     { 'Content-Type': 'application/json' },
            body:        JSON.stringify({ id })
        });
        loadGalleryAdmin();
    };

    loadGalleryAdmin();
}


// ══════════════════════════════════════════
// SECTIUNEA 5: MODERARE RECENZII
// ══════════════════════════════════════════
function setupReviewsAdmin() {
    let _reviews    = [];
    let _activeTab  = 'pending';

    async function loadReviews() {
        const res = await fetch('api/reviews.php?action=all', { credentials: 'include' });
        _reviews  = await res.json();
        if (!Array.isArray(_reviews)) _reviews = [];
        updateBadges();
        renderReviewsForTab(_activeTab);
    }

    function updateBadges() {
        ['pending','approved','rejected'].forEach(s => {
            const el = document.getElementById(`badge-${s}`);
            if (el) el.textContent = _reviews.filter(r => r.status === s).length;
        });
    }

    function renderReviewsForTab(status) {
        const container = document.getElementById('admin-reviews-list');
        if (!container) return;
        const filtered = _reviews.filter(r => r.status === status);

        if (!filtered.length) {
            container.innerHTML = `<p style="color:#aaa;font-size:13px;padding:10px;">Nu exista recenzii cu statusul "${status}".</p>`;
            return;
        }

        container.innerHTML = '';
        filtered.forEach(review => {
            const stars = Array.from({length:5}, (_,i) =>
                `<span style="color:${i < review.rating ? '#f5a623' : '#ddd'}">★</span>`
            ).join('');

            const typeLabel = review.type === 'general'
                ? '<span style="background:#e8f5e9;color:#2e7d32;padding:2px 8px;border-radius:10px;font-size:11px;font-weight:bold;">🌿 Florarie</span>'
                : `<span style="background:#fff3e0;color:#e65100;padding:2px 8px;border-radius:10px;font-size:11px;font-weight:bold;">🌸 ${review.product_name || 'Produs'}</span>`;

            const card = document.createElement('div');
            card.style.cssText = 'background:#fff;border-radius:10px;padding:18px 20px;box-shadow:0 2px 8px rgba(92,26,35,0.08);display:flex;flex-direction:column;gap:8px;';
            card.innerHTML = `
                <div style="display:flex;justify-content:space-between;align-items:flex-start;flex-wrap:wrap;gap:8px;">
                    <div style="display:flex;align-items:center;gap:10px;flex-wrap:wrap;">
                        <div style="font-size:18px;">${stars}</div>
                        ${typeLabel}
                        <span style="font-size:13px;color:#888;">👤 ${escAdmin(review.user_name)}</span>
                        <span style="font-size:12px;color:#bbb;">📅 ${new Date(review.created_at).toLocaleDateString('ro-RO')}</span>
                    </div>
                    <div style="display:flex;gap:6px;flex-wrap:wrap;">
                        ${status !== 'approved'  ? `<button onclick="setReviewStatus(${review.id},'approved')"  style="padding:5px 10px;background:#769b21;color:white;border:none;border-radius:5px;cursor:pointer;font-size:12px;font-weight:bold;">✅ Aproba</button>` : ''}
                        ${status !== 'rejected'  ? `<button onclick="setReviewStatus(${review.id},'rejected')"  style="padding:5px 10px;background:#e67e22;color:white;border:none;border-radius:5px;cursor:pointer;font-size:12px;font-weight:bold;">❌ Respinge</button>` : ''}
                        ${status !== 'pending'   ? `<button onclick="setReviewStatus(${review.id},'pending')"   style="padding:5px 10px;background:#aaa;color:white;border:none;border-radius:5px;cursor:pointer;font-size:12px;font-weight:bold;">⏳ Pending</button>` : ''}
                        <button onclick="deleteReview(${review.id})" style="padding:5px 10px;background:#dc3545;color:white;border:none;border-radius:5px;cursor:pointer;font-size:12px;font-weight:bold;">🗑 Sterge</button>
                    </div>
                </div>
                <div style="font-weight:bold;color:#5c1a23;font-size:15px;">${escAdmin(review.title)}</div>
                <div style="font-size:14px;color:#555;line-height:1.5;">${escAdmin(review.body)}</div>
                ${review.image ? `<img src="${review.image}" style="max-width:140px;max-height:120px;object-fit:cover;border-radius:8px;border:1px solid #f0e6e0;">` : ''}
            `;
            container.appendChild(card);
        });
    }

    // escAdmin este definit global la inceputul fisierului

    window.switchReviewTab = function(status) {
        _activeTab = status;
        document.querySelectorAll('.review-tab-btn').forEach(btn => {
            btn.classList.toggle('active', btn.getAttribute('data-status') === status);
        });
        renderReviewsForTab(status);
    };

    window.setReviewStatus = async function(id, status) {
        await fetch('api/reviews.php?action=status', {
            method:      'POST',
            credentials: 'include',
            headers:     { 'Content-Type': 'application/json' },
            body:        JSON.stringify({ id, status })
        });
        await loadReviews();
    };

    window.deleteReview = async function(id) {
        if (!confirm('Stergi aceasta recenzie definitiv?')) return;
        await fetch('api/reviews.php?action=delete', {
            method:      'DELETE',
            credentials: 'include',
            headers:     { 'Content-Type': 'application/json' },
            body:        JSON.stringify({ id })
        });
        await loadReviews();
    };

    loadReviews();
}