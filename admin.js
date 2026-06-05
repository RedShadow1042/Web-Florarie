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

// ══════════════════════════════════════════
// SECȚIUNEA 3: HERO SECTIONS ADMIN
// ══════════════════════════════════════════
function setupHeroAdmin() {
    const STORAGE_KEY = 'floraria_hero_slides';

    // Sincronizare preview live în timp real
    const fieldsToSync = [
        { id: 'hero-title',    previewId: 'preview-title',    prop: 'textContent' },
        { id: 'hero-subtitle', previewId: 'preview-subtitle', prop: 'textContent' },
        { id: 'hero-btn-text', previewId: 'preview-btn',      prop: 'textContent' },
        { id: 'hero-btn-link', previewId: 'preview-btn',      prop: 'href' },
    ];

    fieldsToSync.forEach(({ id, previewId, prop }) => {
        const input = document.getElementById(id);
        const preview = document.getElementById(previewId);
        if (!input || !preview) return;
        input.addEventListener('input', () => {
            preview[prop] = input.value || (prop === 'textContent' ? '...' : '#');
        });
    });

    // Culoare fundal — color picker sincronizat cu câmpul text
    const bgColorPicker = document.getElementById('hero-bg-color');
    const bgColorText   = document.getElementById('hero-bg-color-text');
    const heroPreview   = document.getElementById('hero-preview');
    const previewTitle  = document.getElementById('preview-title');
    const previewSub    = document.getElementById('preview-subtitle');

    bgColorPicker.addEventListener('input', () => {
        bgColorText.value = bgColorPicker.value;
        heroPreview.style.background = bgColorPicker.value;
    });

    bgColorText.addEventListener('input', () => {
        heroPreview.style.background = bgColorText.value;
        // Actualizăm color picker-ul doar dacă e hex valid
        if (/^#[0-9a-f]{6}$/i.test(bgColorText.value.trim())) {
            bgColorPicker.value = bgColorText.value.trim();
        }
    });

    const textColorPicker = document.getElementById('hero-text-color');
    textColorPicker.addEventListener('input', () => {
        previewTitle.style.color = textColorPicker.value;
        previewSub.style.color   = textColorPicker.value;
    });

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
            const bgPreviewStyle = bgIsGradient
                ? `background:${slide.bg}; width:40px; height:40px; border-radius:6px; border:1px solid #ccc; flex-shrink:0;`
                : `background:${slide.bg || '#f5ebe1'}; width:40px; height:40px; border-radius:6px; border:1px solid #ccc; flex-shrink:0;`;

            card.innerHTML = `
                <div style="${bgPreviewStyle}"></div>
                <div class="hero-admin-card-body">
                    <strong>${slide.title || '(fără titlu)'}</strong>
                    <span>${slide.subtitle || '(fără subtitlu)'}</span>
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

    // Salvare panou (adăugare sau editare)
    window.saveHeroSlide = () => {
        const title    = document.getElementById('hero-title').value.trim();
        const subtitle = document.getElementById('hero-subtitle').value.trim();
        const btnText  = document.getElementById('hero-btn-text').value.trim();
        const btnLink  = document.getElementById('hero-btn-link').value.trim();
        const bgText   = document.getElementById('hero-bg-color-text').value.trim();
        const bgColor  = bgText || document.getElementById('hero-bg-color').value;
        const txtColor = document.getElementById('hero-text-color').value;
        const editIdx  = parseInt(document.getElementById('hero-edit-index').value);

        if (!title && !subtitle) {
            alert('Adaugă cel puțin un titlu sau un subtitlu pentru panou.');
            return;
        }

        let slides = JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];

        if (slides.length >= 5 && editIdx === -1) {
            alert('Poți adăuga maxim 5 panouri. Șterge unul existent pentru a adăuga altul nou.');
            return;
        }

        const newSlide = { title, subtitle, btnText, btnLink, bg: bgColor, textColor: txtColor, active: true };

        if (editIdx >= 0) {
            // Păstrăm statusul activ/inactiv la editare
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

    // Editare panou — populează formularul
    window.editHeroSlide = (index) => {
        const slides = JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
        const s = slides[index];

        document.getElementById('hero-title').value    = s.title || '';
        document.getElementById('hero-subtitle').value = s.subtitle || '';
        document.getElementById('hero-btn-text').value = s.btnText || '';
        document.getElementById('hero-btn-link').value = s.btnLink || '';
        document.getElementById('hero-bg-color-text').value = s.bg || '#f5ebe1';
        document.getElementById('hero-text-color').value    = s.textColor || '#5c1a23';
        document.getElementById('hero-edit-index').value    = index;

        // Actualizăm preview
        document.getElementById('preview-title').textContent    = s.title || '';
        document.getElementById('preview-subtitle').textContent = s.subtitle || '';
        document.getElementById('preview-btn').textContent      = s.btnText || 'Buton';
        document.getElementById('preview-btn').href             = s.btnLink || '#';
        document.getElementById('hero-preview').style.background = s.bg || '#f5ebe1';
        document.getElementById('preview-title').style.color    = s.textColor || '#5c1a23';
        document.getElementById('preview-subtitle').style.color = s.textColor || '#5c1a23';

        document.getElementById('hero-form-title').textContent = 'Editează Panoul';
        document.getElementById('hero-cancel-btn').style.display = 'inline-block';

        // Scroll la formular
        document.getElementById('hero-title').scrollIntoView({ behavior: 'smooth', block: 'center' });
    };

    // Anulare editare
    window.cancelHeroEdit = () => resetHeroForm();

    function resetHeroForm() {
        document.getElementById('hero-title').value    = '';
        document.getElementById('hero-subtitle').value = '';
        document.getElementById('hero-btn-text').value = '';
        document.getElementById('hero-btn-link').value = '';
        document.getElementById('hero-bg-color-text').value = '';
        document.getElementById('hero-bg-color').value      = '#f5ebe1';
        document.getElementById('hero-text-color').value    = '#5c1a23';
        document.getElementById('hero-edit-index').value    = '-1';
        document.getElementById('hero-form-title').textContent = 'Adaugă Panou Nou';
        document.getElementById('hero-cancel-btn').style.display = 'none';
        document.getElementById('preview-title').textContent    = 'Titlul panoului tău';
        document.getElementById('preview-subtitle').textContent = 'Subtitlul sau mesajul promoțional';
        document.getElementById('preview-btn').textContent      = 'Buton';
        document.getElementById('hero-preview').style.background = '#f5ebe1';
        document.getElementById('preview-title').style.color    = '#5c1a23';
        document.getElementById('preview-subtitle').style.color = '#5c1a23';
    }

    // Ștergere panou
    window.deleteHeroSlide = (index) => {
        const slides = JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
        if (confirm(`Sigur vrei să ștergi panoul "${slides[index].title || 'fără titlu'}"?`)) {
            slides.splice(index, 1);
            localStorage.setItem(STORAGE_KEY, JSON.stringify(slides));
            renderHeroList();
        }
    };

    // Toggle activ/inactiv
    window.toggleHeroActive = (index) => {
        let slides = JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
        slides[index].active = slides[index].active === false ? true : false;
        localStorage.setItem(STORAGE_KEY, JSON.stringify(slides));
        renderHeroList();
    };

    // Reordonare panouri (sus/jos)
    window.moveHeroSlide = (index, direction) => {
        let slides = JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
        const newIndex = index + direction;
        if (newIndex < 0 || newIndex >= slides.length) return;
        [slides[index], slides[newIndex]] = [slides[newIndex], slides[index]];
        localStorage.setItem(STORAGE_KEY, JSON.stringify(slides));
        renderHeroList();
    };

    renderHeroList();
}