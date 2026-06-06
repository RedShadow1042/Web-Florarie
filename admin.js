// Acest fișier rulează exclusiv pe pagina admin.html
window.addEventListener('DOMContentLoaded', () => {
    setupAdminPanelLogic();
    setupHeroAdmin();
});

// ══════════════════════════════════════════
// SECȚIUNEA 1 & 2: CATALOG + COMENZI
// ══════════════════════════════════════════
function setupAdminPanelLogic() {
    const form = document.getElementById('add-bouquet-form');
    const bouquetListContainer = document.getElementById('admin-bouquets-list');
    const activeOrdersContainer = document.getElementById('admin-active-orders-list');
    const completedOrdersContainer = document.getElementById('admin-completed-orders-list');
    const searchBar = document.getElementById('order-search-bar');

    if (!bouquetListContainer || !activeOrdersContainer || !completedOrdersContainer) {
        console.error("Eroare: Containerele pentru tabele nu au fost găsite.");
        return;
    }

    // 1. Randare catalog
    function renderAdminCatalog() {
        let catalog = JSON.parse(localStorage.getItem('floraria_bouquets')) || [];
        bouquetListContainer.innerHTML = '';

        if (catalog.length === 0) {
            bouquetListContainer.innerHTML = '<tr><td colspan="6" style="text-align:center; color:#777;">Nu există produse adăugate.</td></tr>';
            return;
        }

        catalog.forEach((bouquet, index) => {
            const tr = document.createElement('tr');
            // FIX: curățăm "LEI" duplicat din preț — prețul poate fi string "123 LEI" sau număr 123
            const cleanPrice = String(bouquet.price).replace(/\s*lei/gi, '').trim();
            tr.innerHTML = `
                <td><img src="${bouquet.image}" style="width:50px; height:50px; object-fit:cover; border-radius:4px;" onerror="this.src='Imagini/blank_image.jpg'"></td>
                <td><strong>${bouquet.name}</strong></td>
                <td>${cleanPrice} LEI</td>
                <td>${bouquet.discount || 0}%</td>
                <td><input type="checkbox" onchange="toggleActiveStatus(${index})" ${bouquet.active !== false ? 'checked' : ''}></td>
                <td>
                    <button class="edit-btn" style="background:#f39c12; color:white; border:none; padding:5px 8px; border-radius:4px; cursor:pointer; margin-right:5px;" onclick="window.location.href='edit-produs.html?index=${index}'">Editează</button>
                    <button class="delete-btn" style="background:#dc3545; color:white; border:none; padding:5px 8px; border-radius:4px; cursor:pointer;" data-index="${index}">Șterge</button>
                </td>
            `;
            bouquetListContainer.appendChild(tr);
        });

        bouquetListContainer.querySelectorAll('.delete-btn').forEach(button => {
            button.addEventListener('click', (e) => {
                const idx = e.target.getAttribute('data-index');
                let currentCatalog = JSON.parse(localStorage.getItem('floraria_bouquets')) || [];
                if (confirm(`Sigur vrei să ștergi produsul "${currentCatalog[idx].name}"?`)) {
                    currentCatalog.splice(idx, 1);
                    localStorage.setItem('floraria_bouquets', JSON.stringify(currentCatalog));
                    renderAdminCatalog();
                }
            });
        });
    }

    window.toggleActiveStatus = (index) => {
        let catalog = JSON.parse(localStorage.getItem('floraria_bouquets')) || [];
        catalog[index].active = !catalog[index].active;
        localStorage.setItem('floraria_bouquets', JSON.stringify(catalog));
    };

    // 2. Randare Comenzi
    function renderAdminOrders(filterKeyword = '') {
        let orders = JSON.parse(localStorage.getItem('floraria_orders')) || [];
        activeOrdersContainer.innerHTML = '';
        completedOrdersContainer.innerHTML = '';

        orders.forEach((order, globalIndex) => {
            const clientName = order.user || order.customerName || 'Client Anonim';
            const orderTotal = order.total !== undefined ? order.total : (order.totalPrice || 0);
            const orderIdStr = (order.id || `CMD-${globalIndex + 1001}`).toString();
            const searchStr = filterKeyword.toLowerCase().trim();

            if (searchStr !== '' && !orderIdStr.toLowerCase().includes(searchStr) && !clientName.toLowerCase().includes(searchStr)) return;

            const orderStatus = (order.status === 'completed') ? 'completed' : 'active';

            // FIX: suportăm atât 'items' cât și 'products' (cart.js salvează ambele chei)
            const itemsArray = order.items || order.products || [];
            let produseText = Array.isArray(itemsArray)
                ? itemsArray.map(item => `${item.name} (${item.price} LEI)`).join(', ')
                : 'Produse nespecificate';

            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td><code>#${orderIdStr.replace('CMD-', '')}</code></td>
                <td><strong>${clientName}</strong></td>
                <td>${produseText}</td>
                <td style="color:#769b21; font-weight:bold;">${orderTotal} LEI</td>
                <td><small>${order.date || 'N/A'}</small></td>
                <td style="display: flex; gap: 8px; align-items: center; padding: 10px;">
                    ${orderStatus === 'active'
                        ? `<button class="btn-status-success complete-order-btn" style="padding: 4px 8px; font-size: 11px; cursor: pointer;" data-index="${globalIndex}">Finalizează ✓</button>`
                        : '<span style="color:#769b21; font-weight:bold; font-size:12px;">Finalizată</span>'
                    }
                    <button class="btn-status-danger delete-order-btn" style="padding: 4px 8px; font-size: 11px; cursor: pointer;" data-index="${globalIndex}">Elimină ✕</button>
                </td>
            `;

            if (orderStatus === 'active') activeOrdersContainer.appendChild(tr);
            else completedOrdersContainer.appendChild(tr);
        });

        if (activeOrdersContainer.innerHTML === '') {
            activeOrdersContainer.innerHTML = '<tr><td colspan="6" style="text-align:center; color:#777; padding:20px;">Nu există comenzi active.</td></tr>';
        }
        if (completedOrdersContainer.innerHTML === '') {
            completedOrdersContainer.innerHTML = '<tr><td colspan="6" style="text-align:center; color:#777; padding:20px;">Nu există comenzi finalizate.</td></tr>';
        }

        document.querySelectorAll('.complete-order-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                let currentOrders = JSON.parse(localStorage.getItem('floraria_orders'));
                currentOrders[e.target.getAttribute('data-index')].status = 'completed';
                localStorage.setItem('floraria_orders', JSON.stringify(currentOrders));
                renderAdminOrders(searchBar.value);
            });
        });

        document.querySelectorAll('.delete-order-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                let currentOrders = JSON.parse(localStorage.getItem('floraria_orders'));
                currentOrders.splice(e.target.getAttribute('data-index'), 1);
                localStorage.setItem('floraria_orders', JSON.stringify(currentOrders));
                renderAdminOrders(searchBar.value);
            });
        });
    }

    if (searchBar) searchBar.addEventListener('input', (e) => renderAdminOrders(e.target.value));

    // 3. Adăugare produs nou
    if (form) {
        form.addEventListener('submit', (e) => {
            e.preventDefault();
            const name = document.getElementById('bouquet-name').value;
            const price = document.getElementById('bouquet-price').value;
            const discount = document.getElementById('bouquet-discount').value;
            const desc = document.getElementById('bouquet-desc').value;
            const fileInput = document.getElementById('bouquet-image');

            let catalog = JSON.parse(localStorage.getItem('floraria_bouquets')) || [];
            const newBouquet = {
                name,
                price: parseInt(price),
                discount: parseInt(discount) || 0,
                desc,
                active: true,
                image: 'Imagini/blank_image.jpg'
            };

            if (fileInput && fileInput.files && fileInput.files[0]) {
                const reader = new FileReader();
                reader.onload = (ev) => {
                    newBouquet.image = ev.target.result;
                    catalog.push(newBouquet);
                    localStorage.setItem('floraria_bouquets', JSON.stringify(catalog));
                    form.reset();
                    renderAdminCatalog();
                };
                reader.readAsDataURL(fileInput.files[0]);
            } else {
                catalog.push(newBouquet);
                localStorage.setItem('floraria_bouquets', JSON.stringify(catalog));
                form.reset();
                renderAdminCatalog();
            }
        });
    }

    renderAdminCatalog();
    renderAdminOrders();
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

// Sincronizare preview live
window.syncHeroPreview = () => {
    const titleEl    = document.getElementById('hero-title');
    const subtitleEl = document.getElementById('hero-subtitle');
    const btnTextEl  = document.getElementById('hero-btn-text');
    const btnLinkEl  = document.getElementById('hero-btn-link');
    const bgTextEl   = document.getElementById('hero-bg-color-text');
    const bgColorEl  = document.getElementById('hero-bg-color');
    const previewBox = document.getElementById('hero-preview');

    if (titleEl)    document.getElementById('preview-title').innerHTML    = titleEl.innerHTML || '<span style="color:#aaa">Titlul panoului tău</span>';
    if (subtitleEl) document.getElementById('preview-subtitle').innerHTML = subtitleEl.innerHTML || '<span style="color:#aaa">Subtitlul mesajului</span>';
    if (btnTextEl)  {
        const btn = document.getElementById('preview-btn');
        btn.textContent = btnTextEl.value || 'Buton';
        btn.style.display = btnTextEl.value ? 'inline-block' : 'none';
    }
    if (btnLinkEl)  document.getElementById('preview-btn').href = btnLinkEl.value || '#';
    if (previewBox) {
        const bg = (bgTextEl && bgTextEl.value.trim()) || (bgColorEl && bgColorEl.value) || '#f5ebe1';
        previewBox.style.background = bg;
    }
};

// ══════════════════════════════════════════
// SECȚIUNEA 3: HERO SECTIONS ADMIN
// ══════════════════════════════════════════
function setupHeroAdmin() {
    const STORAGE_KEY = 'floraria_hero_slides';

    // Salvăm selecția când editorul pierde focus-ul (click pe toolbar)
    ['hero-title', 'hero-subtitle'].forEach(id => {
        const el = document.getElementById(id);
        if (!el) return;
        const editorId = id.replace('hero-', '');
        el.addEventListener('mouseup',  () => saveSelection(editorId));
        el.addEventListener('keyup',    () => saveSelection(editorId));
        el.addEventListener('blur',     () => saveSelection(editorId));
    });

    // Culoare fundal — color picker sincronizat cu câmpul text
    const bgColorPicker = document.getElementById('hero-bg-color');
    const bgColorText   = document.getElementById('hero-bg-color-text');
    const heroPreview   = document.getElementById('hero-preview');

    if (bgColorPicker) {
        bgColorPicker.addEventListener('input', () => {
            if (bgColorText) bgColorText.value = bgColorPicker.value;
            heroPreview.style.background = bgColorPicker.value;
        });
    }

    if (bgColorText) {
        bgColorText.addEventListener('input', () => {
            heroPreview.style.background = bgColorText.value;
            if (/^#[0-9a-f]{6}$/i.test(bgColorText.value.trim()) && bgColorPicker) {
                bgColorPicker.value = bgColorText.value.trim();
            }
            syncHeroPreview();
        });
    }

    // Randare listă panouri
    function renderHeroList() {
        const list = document.getElementById('hero-slides-list');
        const slides = JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];

        if (slides.length === 0) {
            list.innerHTML = '<p style="color:#777; font-size:13px; padding:10px 0;">Nu există panouri configurate. Adaugă primul panou folosind formularul de mai sus.</p>';
            return;
        }

        list.innerHTML = '';

        slides.forEach((slide, index) => {
            const card = document.createElement('div');
            card.className = 'hero-admin-card';

            const bgIsGradient = slide.bg && slide.bg.includes('gradient');
            const bgPreviewStyle = `background:${slide.bg || '#f5ebe1'}; width:40px; height:40px; border-radius:6px; border:1px solid #ccc; flex-shrink:0;`;

            // Afișăm text simplu (fără html) în preview card
            const tempDiv = document.createElement('div');
            tempDiv.innerHTML = slide.title || '';
            const plainTitle = tempDiv.textContent || '(fără titlu)';
            tempDiv.innerHTML = slide.subtitle || '';
            const plainSub = tempDiv.textContent || '(fără subtitlu)';

            card.innerHTML = `
                <div style="${bgPreviewStyle}"></div>
                <div class="hero-admin-card-body">
                    <strong>${plainTitle}</strong>
                    <span>${plainSub}</span>
                    ${slide.btnText ? `<span style="display:block; margin-top:3px; font-size:12px;">🔗 ${slide.btnText} → ${slide.btnLink || '#'}</span>` : ''}
                </div>
                <div class="hero-admin-actions">
                    <div class="hero-order-btns">
                        <button onclick="moveHeroSlide(${index}, -1)" title="Mută sus" ${index === 0 ? 'disabled' : ''}>▲</button>
                        <button onclick="moveHeroSlide(${index}, 1)" title="Mută jos" ${index === slides.length - 1 ? 'disabled' : ''}>▼</button>
                    </div>
                    <span class="hero-badge ${slide.active !== false ? 'activ' : 'inactiv'}" 
                          style="cursor:pointer;" 
                          onclick="toggleHeroActive(${index})" 
                          title="Click pentru a activa/dezactiva">
                        ${slide.active !== false ? 'Activ' : 'Inactiv'}
                    </span>
                    <button onclick="editHeroSlide(${index})" style="background:#f39c12; color:white; border:none; padding:5px 9px; border-radius:4px; cursor:pointer; font-weight:bold; font-size:12px;">✏️</button>
                    <button onclick="deleteHeroSlide(${index})" style="background:#dc3545; color:white; border:none; padding:5px 9px; border-radius:4px; cursor:pointer; font-weight:bold; font-size:12px;">✕</button>
                </div>
            `;
            list.appendChild(card);
        });
    }

    // Salvare panou
    window.saveHeroSlide = () => {
        const titleEl    = document.getElementById('hero-title');
        const subtitleEl = document.getElementById('hero-subtitle');
        const title    = titleEl ? titleEl.innerHTML.trim() : '';
        const subtitle = subtitleEl ? subtitleEl.innerHTML.trim() : '';
        const btnText  = document.getElementById('hero-btn-text').value.trim();
        const btnLink  = document.getElementById('hero-btn-link').value.trim();
        const bgText   = document.getElementById('hero-bg-color-text').value.trim();
        const bgColor  = bgText || document.getElementById('hero-bg-color').value;
        const editIdx  = parseInt(document.getElementById('hero-edit-index').value);

        // Considerăm gol dacă conține doar placeholder sau e cu adevărat gol
        const isEmpty = (html) => !html || html === '' || html === '<br>';
        if (isEmpty(title) && isEmpty(subtitle)) {
            alert('Adaugă cel puțin un titlu sau un subtitlu pentru panou.');
            return;
        }

        let slides = JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];

        if (slides.length >= 5 && editIdx === -1) {
            alert('Poți adăuga maxim 5 panouri. Șterge unul existent pentru a adăuga altul nou.');
            return;
        }

        // Salvăm HTML-ul (cu formatare inline) direct
        const newSlide = { title, subtitle, btnText, btnLink, bg: bgColor, active: true };

        if (editIdx >= 0) {
            newSlide.active = slides[editIdx].active;
            slides[editIdx] = newSlide;
        } else {
            slides.push(newSlide);
        }

        localStorage.setItem(STORAGE_KEY, JSON.stringify(slides));
        resetHeroForm();
        renderHeroList();
        alert(editIdx >= 0 ? 'Panoul a fost actualizat!' : 'Panoul a fost adăugat cu succes!');
    };

    // Editare panou — populează editorii rich text
    window.editHeroSlide = (index) => {
        const slides = JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
        const s = slides[index];

        const titleEl    = document.getElementById('hero-title');
        const subtitleEl = document.getElementById('hero-subtitle');

        if (titleEl)    titleEl.innerHTML    = s.title || '';
        if (subtitleEl) subtitleEl.innerHTML = s.subtitle || '';

        document.getElementById('hero-btn-text').value          = s.btnText || '';
        document.getElementById('hero-btn-link').value          = s.btnLink || '';
        document.getElementById('hero-bg-color-text').value     = s.bg || '#f5ebe1';
        document.getElementById('hero-bg-color').value          = /^#[0-9a-f]{6}$/i.test(s.bg) ? s.bg : '#f5ebe1';
        document.getElementById('hero-edit-index').value        = index;

        // Preview
        document.getElementById('preview-title').innerHTML    = s.title || '';
        document.getElementById('preview-subtitle').innerHTML = s.subtitle || '';
        document.getElementById('preview-btn').textContent    = s.btnText || 'Buton';
        document.getElementById('preview-btn').href           = s.btnLink || '#';
        document.getElementById('hero-preview').style.background = s.bg || '#f5ebe1';

        document.getElementById('hero-form-title').textContent = 'Editează Panoul';
        document.getElementById('hero-cancel-btn').style.display = 'inline-block';

        document.getElementById('hero-title').scrollIntoView({ behavior: 'smooth', block: 'center' });
    };

    window.cancelHeroEdit = () => resetHeroForm();

    function resetHeroForm() {
        const titleEl    = document.getElementById('hero-title');
        const subtitleEl = document.getElementById('hero-subtitle');
        if (titleEl)    titleEl.innerHTML    = '';
        if (subtitleEl) subtitleEl.innerHTML = '';

        document.getElementById('hero-btn-text').value          = '';
        document.getElementById('hero-btn-link').value          = '';
        document.getElementById('hero-bg-color-text').value     = '';
        document.getElementById('hero-bg-color').value          = '#f5ebe1';
        document.getElementById('hero-edit-index').value        = '-1';
        document.getElementById('hero-form-title').textContent  = 'Adaugă Panou Nou';
        document.getElementById('hero-cancel-btn').style.display = 'none';

        document.getElementById('preview-title').innerHTML    = '<span style="color:#aaa">Titlul panoului tău</span>';
        document.getElementById('preview-subtitle').innerHTML = '<span style="color:#aaa">Subtitlul sau mesajul promoțional</span>';
        document.getElementById('preview-btn').textContent    = 'Buton';
        document.getElementById('preview-btn').href           = '#';
        document.getElementById('hero-preview').style.background = '#f5ebe1';
    }

    window.deleteHeroSlide = (index) => {
        const slides = JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = slides[index].title || 'fără titlu';
        if (confirm(`Sigur vrei să ștergi panoul "${tempDiv.textContent}"?`)) {
            slides.splice(index, 1);
            localStorage.setItem(STORAGE_KEY, JSON.stringify(slides));
            renderHeroList();
        }
    };

    window.toggleHeroActive = (index) => {
        let slides = JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
        slides[index].active = slides[index].active === false ? true : false;
        localStorage.setItem(STORAGE_KEY, JSON.stringify(slides));
        renderHeroList();
    };

    window.moveHeroSlide = (index, direction) => {
        let slides = JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
        const newIndex = index + direction;
        if (newIndex < 0 || newIndex >= slides.length) return;
        [slides[index], slides[newIndex]] = [slides[newIndex], slides[index]];
        localStorage.setItem(STORAGE_KEY, JSON.stringify(slides));
        renderHeroList();
    };

    renderHeroList();
    syncHeroPreview();
}