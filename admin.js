// ==========================================
// 1. SECURITATE ȘI ACCES PANEL
// ==========================================
const currentUser = JSON.parse(localStorage.getItem('floraria_current_user'));
const adminMainContent = document.getElementById('admin-main-content');

if (!currentUser || currentUser.role !== 'admin') {
    alert('Acces interzis! Doar administratorii pot accesa această pagină.');
    window.location.href = 'index.html';
} else {
    if (adminMainContent) adminMainContent.style.display = 'block';
}

// ==========================================
// 2. LOGICĂ SWITCH TAB-URI
// ==========================================
const tabButtons = document.querySelectorAll('.tab-btn');
const adminSections = document.querySelectorAll('.admin-section');

tabButtons.forEach(btn => {
    btn.addEventListener('click', () => {
        tabButtons.forEach(b => b.classList.remove('active'));
        adminSections.forEach(s => s.classList.remove('active'));

        btn.classList.add('active');
        const targetTab = btn.getAttribute('data-tab');
        document.getElementById(targetTab).classList.add('active');
    });
});

// ==========================================
// 3. CATALOG BUCHETE (DATE INITIALE ȘI MANAGEMENT)
// ==========================================
let bouquetsCatalog = JSON.parse(localStorage.getItem('floraria_bouquets')) || [];

if (!localStorage.getItem('floraria_bouquets')) {
    localStorage.setItem('floraria_bouquets', JSON.stringify(bouquetsCatalog));
}

const customProductsList = document.getElementById('admin-custom-products-list');
const homepageCountBadge = document.getElementById('homepage-count');
const addProductForm = document.getElementById('add-product-form');

// Elemente pentru managementul imaginii curente din formular
const imageInputEl = document.getElementById('prod-image');
const clearImageBtn = document.getElementById('clear-image-btn');

// Randare catalog buchete în Tab 1
function renderAdminCatalog() {
    if (!customProductsList) return;
    customProductsList.innerHTML = '';

    const activeOnHome = bouquetsCatalog.filter(b => b.onHomePage).length;
    if (homepageCountBadge) homepageCountBadge.textContent = activeOnHome;

    if (bouquetsCatalog.length === 0) {
        customProductsList.innerHTML = '<p style="text-align:center; padding:15px; color:#666;">Catalogul este gol.</p>';
        return;
    }

    bouquetsCatalog.forEach(bouquet => {
        const itemRow = document.createElement('div');
        itemRow.className = 'admin-product-item';
        itemRow.style.borderLeft = bouquet.onHomePage ? '5px solid #769b21' : '1px solid #ddd';

        itemRow.innerHTML = `
            <div style="display: flex; align-items: center; gap: 12px; flex: 1;">
                <img src="${bouquet.image}" alt="${bouquet.name}" onerror="this.src='https://placehold.co/50x50?text=Flori'">
                <div>
                    <strong style="font-size: 14px; color:#333;">${bouquet.name}</strong>
                    <p style="margin:2px 0 0 0; font-size:12px; color:#d15b76; font-weight:bold;">${bouquet.price}</p>
                </div>
            </div>
            
            <div style="display: flex; align-items: center; gap: 15px; margin-right: 10px;">
                <label style="font-size: 11px; font-weight: bold; color: #555; cursor: pointer; display: flex; align-items: center; gap: 4px;">
                    <input type="checkbox" ${bouquet.onHomePage ? 'checked' : ''} 
                        style="width: 18px; height: 18px; cursor: pointer;"
                        onchange="toggleBouquetHomepage('${bouquet.id}', this)">
                    Prima pagină
                </label>
                <button class="btn-delete" onclick="deleteBouquet('${bouquet.id}')">Șterge</button>
            </div>
        `;
        customProductsList.appendChild(itemRow);
    });
}

// Comutare Casete pe Prima Pagină (Limită de Max 5)
window.toggleBouquetHomepage = function(id, checkbox) {
    const bouquet = bouquetsCatalog.find(b => b.id === id);
    if (!bouquet) return;

    if (checkbox.checked) {
        const currentActive = bouquetsCatalog.filter(b => b.onHomePage).length;
        if (currentActive >= 5) {
            alert('Poți selecta maxim 5 buchete pentru prima pagină! Dezbifează unul existent mai întâi.');
            checkbox.checked = false;
            return;
        }
        bouquet.onHomePage = true;
    } else {
        bouquet.onHomePage = false;
    }

    localStorage.setItem('floraria_bouquets', JSON.stringify(bouquetsCatalog));
    renderAdminCatalog();
};

// Ștergerea unui buchet din catalog
window.deleteBouquet = function(id) {
    if (confirm('Sigur vrei să ștergi definitiv acest buchet din catalog?')) {
        bouquetsCatalog = bouquetsCatalog.filter(b => b.id !== id);
        localStorage.setItem('floraria_bouquets', JSON.stringify(bouquetsCatalog));
        renderAdminCatalog();
    }
};

// Control afișare și ștergere imagine din formular (Butonul nou adăugat)
if (imageInputEl && clearImageBtn) {
    imageInputEl.addEventListener('change', () => {
        if (imageInputEl.files.length > 0) {
            clearImageBtn.style.display = 'block';
        } else {
            clearImageBtn.style.display = 'none';
        }
    });

    clearImageBtn.addEventListener('click', () => {
        imageInputEl.value = ''; // Resetează fișierul din formular
        clearImageBtn.style.display = 'none'; // Ascunde butonul roșu
    });
}

// Adăugare buchet nou citind fișierul local din dispozitiv
if (addProductForm) {
    addProductForm.addEventListener('submit', (e) => {
        e.preventDefault();
        
        const name = document.getElementById('prod-name').value.trim();
        let price = document.getElementById('prod-price').value.trim();
        const desc = document.getElementById('prod-desc').value.trim();

        if (imageInputEl.files.length === 0) {
            alert('Te rugăm să selectezi o imagine din dispozitiv.');
            return;
        }

        const file = imageInputEl.files[0];
        const reader = new FileReader();

        // Convertirea imaginii în format text Base64 pentru a fi acceptată de localStorage
        reader.onloadend = function () {
            const base64ImageString = reader.result;

            const newBouquet = {
                id: "b_" + Date.now(),
                name: name,
                price: price.toUpperCase().includes('LEI') ? price : price + " LEI",
                desc: desc,
                image: base64ImageString,
                onHomePage: false
            };

            bouquetsCatalog.push(newBouquet);
            localStorage.setItem('floraria_bouquets', JSON.stringify(bouquetsCatalog));
            
            alert(`Buchetul "${name}" a fost salvat cu succes în memoria locală!`);
            
            // Resetăm formularul și ascundem butonul roșu de ștergere imagine
            addProductForm.reset();
            if (clearImageBtn) clearImageBtn.style.display = 'none';
            
            renderAdminCatalog();
        };

        reader.readAsDataURL(file);
    });
}

// ==========================================
// 4. MANAGEMENT COMENZI (ACTIVE ȘI FINALIZATE)
// ==========================================
let ordersList = JSON.parse(localStorage.getItem('floraria_orders')) || [];

const activeOrdersContainer = document.getElementById('admin-orders-active-list');
const completedOrdersContainer = document.getElementById('admin-orders-completed-list');

function renderAdminOrders(filterActiveText = '', filterCompletedText = '') {
    if (!activeOrdersContainer || !completedOrdersContainer) return;
    activeOrdersContainer.innerHTML = '';
    completedOrdersContainer.innerHTML = '';

    const activeOrders = ordersList.filter(o => o.status === 'asteptare' || o.status === 'În așteptare' || !o.status);
    const completedOrders = ordersList.filter(o => o.status === 'livrata' || o.status === 'Livrată' || o.status === 'anulata' || o.status === 'Anulată');

    const filteredActive = activeOrders.filter(o => 
        o.id.toLowerCase().includes(filterActiveText.toLowerCase()) ||
        o.customerName.toLowerCase().includes(filterActiveText.toLowerCase()) ||
        o.customerEmail.toLowerCase().includes(filterActiveText.toLowerCase())
    );

    if (filteredActive.length === 0) {
        activeOrdersContainer.innerHTML = '<p style="text-align:center; color:#666; padding:15px;">Nu s-au găsit comenzi active.</p>';
    } else {
        filteredActive.forEach(order => activeOrdersContainer.appendChild(createOrderCard(order)));
    }

    const filteredCompleted = completedOrders.filter(o => 
        o.id.toLowerCase().includes(filterCompletedText.toLowerCase()) ||
        o.customerName.toLowerCase().includes(filterCompletedText.toLowerCase()) ||
        o.customerEmail.toLowerCase().includes(filterCompletedText.toLowerCase())
    );

    if (filteredCompleted.length === 0) {
        completedOrdersContainer.innerHTML = '<p style="text-align:center; color:#666; padding:15px;">Nu s-au găsit comenzi în istoric.</p>';
    } else {
        filteredCompleted.forEach(order => completedOrdersContainer.appendChild(createOrderCard(order)));
    }
}

function createOrderCard(order) {
    const card = document.createElement('div');
    card.className = 'order-card';
    card.style.background = '#fcf9f5';
    card.style.border = '1px solid #eadecf';
    card.style.borderRadius = '8px';
    card.style.padding = '15px';
    card.style.marginBottom = '15px';

    let statusClass = 'status-asteptare';
    let statusText = 'În așteptare';
    
    if (order.status === 'livrata' || order.status === 'Livrată') { statusClass = 'status-livrata'; statusText = 'Livrată'; }
    if (order.status === 'anulata' || order.status === 'Anulată') { statusClass = 'status-anulata'; statusText = 'Anulată'; }

    // Generăm lista de produse asociate comenzii
    let itemsHtml = '';
    if (order.products && Array.isArray(order.products)) {
        itemsHtml = order.products.map(item => `<li>${item.name} x ${item.quantity || 1} (${item.price} LEI)</li>`).join('');
    } else if (order.items && Array.isArray(order.items)) {
        itemsHtml = order.items.map(item => `<li>${item.name} x ${item.quantity || 1} (${item.price})</li>`).join('');
    }

    const finalTotal = order.totalPrice !== undefined ? order.totalPrice + " LEI" : order.total;

    card.innerHTML = `
        <div class="order-header" style="display:flex; justify-content:space-between; border-bottom:1px solid #eadecf; padding-bottom:8px; margin-bottom:10px;">
            <span class="order-id" style="font-weight:bold; color:#5c1a23;">Comandă #${order.id}</span>
            <span class="order-date" style="font-size:13px; color:#666;">${order.date}</span>
        </div>
        <div class="admin-customer-info" style="font-size:13px; color:#555; background:#f0e6db; padding:8px; border-radius:4px; margin-bottom:10px; line-height:1.5;">
            <strong>Client:</strong> ${order.customerName} (${order.customerEmail})<br>
            <strong>Adresă Livrare:</strong> ${order.address || 'Nespecificată'}
        </div>
        <ul class="order-products-list" style="padding-left:20px; font-size:14px; margin-bottom:12px; color:#333;">
            ${itemsHtml}
        </ul>
        <div class="order-footer" style="display:flex; justify-content:space-between; align-items:center;">
            <div>Status: <span class="order-status ${statusClass}" style="font-weight:bold; text-transform:uppercase; font-size:12px;">${statusText}</span></div>
            <div class="order-total-bold" style="font-weight:bold; color:#d15b76; font-size:16px;">Total: ${finalTotal}</div>
        </div>
        ${order.status === 'asteptare' || order.status === 'În așteptare' || !order.status ? `
            <div class="admin-order-actions" style="display:flex; gap:10px; margin-top:12px; border-top:1px dashed #eadecf; padding-top:10px;">
                <button class="view-details btn-small" style="background:#28a745; border:none; padding:6px 12px; color:white; border-radius:4px; cursor:pointer;" onclick="updateStatus('${order.id}', 'livrata')">Marchează Livrată</button>
                <button class="view-details btn-small" style="background:#dc3545; border:none; padding:6px 12px; color:white; border-radius:4px; cursor:pointer;" onclick="updateStatus('${order.id}', 'anulata')">Anulează Comandă</button>
            </div>
        ` : ''}
    `;
    return card;
}

window.updateStatus = function(id, newStatus) {
    const order = ordersList.find(o => o.id === id);
    if (order) {
        order.status = newStatus;
        localStorage.setItem('floraria_orders', JSON.stringify(ordersList));
        renderAdminOrders();
    }
};

// Căutare dinamică în tab-urile de comenzi
const searchActiveInput = document.getElementById('search-active-orders');
const searchCompletedInput = document.getElementById('search-completed-orders');

if (searchActiveInput) {
    searchActiveInput.addEventListener('input', (e) => {
        const completedVal = searchCompletedInput ? searchCompletedInput.value : '';
        renderAdminOrders(e.target.value, completedVal);
    });
}

if (searchCompletedInput) {
    searchCompletedInput.addEventListener('input', (e) => {
        const activeVal = searchActiveInput ? searchActiveInput.value : '';
        renderAdminOrders(activeVal, e.target.value);
    });
}

// Inițializare aplicație admin
renderAdminCatalog();
renderAdminOrders();