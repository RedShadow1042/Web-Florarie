const adminMainContent = document.getElementById('admin-main-content');
const addProductForm = document.getElementById('add-product-form');
const adminOrdersActiveList = document.getElementById('admin-orders-active-list');
const adminOrdersCompletedList = document.getElementById('admin-orders-completed-list');
const adminCustomProductsList = document.getElementById('admin-custom-products-list');

const searchActiveInput = document.getElementById('search-active-orders');
const searchCompletedInput = document.getElementById('search-completed-orders');

// 1. VERIFICARE SECURITATE
const currentUser = JSON.parse(localStorage.getItem('floraria_current_user'));

if (!currentUser || currentUser.role !== 'admin') {
    alert('Acces interzis! Această pagină poate fi accesată doar de către un Administrator.');
    window.location.href = 'index.html';
} else {
    adminMainContent.style.display = 'block';
    renderAdminOrders();
    renderCustomProductsList(); // Afișăm și lista de flori adăugate
    setupTabNavigation();
    setupSearchListeners();
}

// 2. LOGICA TAB-URILOR
function setupTabNavigation() {
    const tabButtons = document.querySelectorAll('.tab-btn');
    const sections = document.querySelectorAll('.admin-section');

    tabButtons.forEach(button => {
        button.addEventListener('click', () => {
            tabButtons.forEach(btn => btn.classList.remove('active'));
            sections.forEach(sec => sec.classList.remove('active'));

            button.classList.add('active');
            const targetSectionId = button.getAttribute('data-tab');
            document.getElementById(targetSectionId).classList.add('active');
        });
    });
}

function setupSearchListeners() {
    if (searchActiveInput) {
        searchActiveInput.addEventListener('input', () => {
            const query = searchActiveInput.value.toLowerCase().trim();
            renderAdminOrders(query, 'active');
        });
    }
    if (searchCompletedInput) {
        searchCompletedInput.addEventListener('input', () => {
            const query = searchCompletedInput.value.toLowerCase().trim();
            renderAdminOrders(query, 'completed');
        });
    }
}

// 3. RANDAREA ȘI FILTRARE COMENZI
function renderAdminOrders(query = '', target = 'all') {
    if (!adminOrdersActiveList || !adminOrdersCompletedList) return;

    const orders = JSON.parse(localStorage.getItem('floraria_orders')) || [];
    
    const activeQuery = query && target === 'active' ? query : (searchActiveInput ? searchActiveInput.value.toLowerCase().trim() : '');
    const completedQuery = query && target === 'completed' ? query : (searchCompletedInput ? searchCompletedInput.value.toLowerCase().trim() : '');

    adminOrdersActiveList.innerHTML = '';
    adminOrdersCompletedList.innerHTML = '';

    let activeCount = 0;
    let completedCount = 0;

    [...orders].reverse().forEach((order) => {
        const currentQuery = order.status === 'În așteptare' ? activeQuery : completedQuery;

        if (currentQuery !== '') {
            const matchId = order.id.toLowerCase().includes(currentQuery);
            const matchName = order.customerName.toLowerCase().includes(currentQuery);
            const matchEmail = order.customerEmail.toLowerCase().includes(currentQuery);
            if (!matchId && !matchName && !matchEmail) return; 
        }

        const orderCard = document.createElement('div');
        orderCard.className = 'order-card';

        let productsHTML = '';
        order.products.forEach(prod => {
            productsHTML += `<li>🌸 ${prod.name} - ${prod.price} LEI</li>`;
        });

        let statusClass = 'status-asteptare';
        if (order.status === 'Livrată') statusClass = 'status-livrata';
        if (order.status === 'Anulată') statusClass = 'status-anulata';

        orderCard.innerHTML = `
            <div class="order-header">
                <span class="order-id">${order.id}</span>
                <span class="order-date">📅 ${order.date}</span>
            </div>
            <div class="admin-customer-info" style="margin: 10px 0; font-size: 14px; background: #f9f9f9; padding: 8px; border-radius:3px; text-align: left;">
                👤 <strong>Client:</strong> ${order.customerName} <br>✉️ <strong>Email:</strong> ${order.customerEmail}
            </div>
            <ul class="order-products-list" style="text-align: left;">
                ${productsHTML}
            </ul>
            <div class="order-footer">
                <div>Total: <span class="order-total-bold">${order.totalPrice} LEI</span></div>
                <span class="order-status ${statusClass}">${order.status}</span>
            </div>
            
            ${order.status === 'În așteptare' ? `
                <div class="admin-order-actions" style="margin-top: 15px; display: flex; gap: 10px; justify-content: center;">
                    <button class="btn-deliver" data-id="${order.id}" style="padding: 8px 20px; background: #28a745; color: white; border: none; border-radius: 4px; cursor: pointer; font-weight: bold;">Livrează</button>
                    <button class="btn-cancel" data-id="${order.id}" style="padding: 8px 20px; background: #dc3545; color: white; border: none; border-radius: 4px; cursor: pointer; font-weight: bold;">Anulează</button>
                </div>
            ` : ''}
        `;

        if (order.status === 'În așteptare') {
            adminOrdersActiveList.appendChild(orderCard);
            activeCount++;
        } else {
            adminOrdersCompletedList.appendChild(orderCard);
            completedCount++;
        }
    });

    if (activeCount === 0) {
        adminOrdersActiveList.innerHTML = `<p style="text-align: center; color: #666; padding: 20px;">${activeQuery !== '' ? 'Nu s-a găsit nicio comandă.' : 'Nu există comenzi active.'}</p>`;
    }
    if (completedCount === 0) {
        adminOrdersCompletedList.innerHTML = `<p style="text-align: center; color: #666; padding: 20px;">${completedQuery !== '' ? 'Nu s-a găsit nicio comandă.' : 'Nu există comenzi finalizate.'}</p>`;
    }

    document.querySelectorAll('.btn-deliver').forEach(btn => {
        btn.onclick = (e) => updateOrderStatus(e.target.getAttribute('data-id'), 'Livrată');
    });

    document.querySelectorAll('.btn-cancel').forEach(btn => {
        btn.onclick = (e) => updateOrderStatus(e.target.getAttribute('data-id'), 'Anulată');
    });
}

function updateOrderStatus(orderId, newStatus) {
    let orders = JSON.parse(localStorage.getItem('floraria_orders')) || [];
    const index = orders.findIndex(o => o.id === orderId);

    if (index !== -1) {
        orders[index].status = newStatus;
        localStorage.setItem('floraria_orders', JSON.stringify(orders));
        renderAdminOrders();
    }
}

// 4. LOGICA PENTRU AFIȘAREA ȘI ȘTERGEREA PRODUSELOR ADĂUGATE
function renderCustomProductsList() {
    if (!adminCustomProductsList) return;
    const customProducts = JSON.parse(localStorage.getItem('floraria_custom_products')) || [];
    adminCustomProductsList.innerHTML = '';

    if (customProducts.length === 0) {
        adminCustomProductsList.innerHTML = `<p style="color: #777; font-size: 14px; text-align: center; padding: 10px;">Nu ai adăugat niciun buchet custom până acum.</p>`;
        return;
    }

    customProducts.forEach(product => {
        const item = document.createElement('div');
        item.className = 'admin-product-item';
        item.innerHTML = `
            <div style="display: flex; align-items: center; gap: 15px;">
                <img src="${product.image}" alt="${product.name}">
                <div>
                    <strong style="font-size: 14px;">${product.name}</strong>
                    <p style="margin: 2px 0 0 0; color: #5c1a23; font-weight: bold; font-size: 13px;">${product.price} LEI</p>
                </div>
            </div>
            <button class="btn-delete" data-id="${product.id}">Șterge</button>
        `;
        adminCustomProductsList.appendChild(item);
    });

    document.querySelectorAll('.btn-delete').forEach(btn => {
        btn.onclick = (e) => deleteProduct(e.target.getAttribute('data-id'));
    });
}

function deleteProduct(productId) {
    if (confirm('Ești sigur că vrei să ștergi definitiv acest buchet de pe site?')) {
        let customProducts = JSON.parse(localStorage.getItem('floraria_custom_products')) || [];
        customProducts = customProducts.filter(p => p.id !== parseInt(productId));
        localStorage.setItem('floraria_custom_products', JSON.stringify(customProducts));
        renderCustomProductsList();
    }
}

// 5. ADĂUGARE PRODUS NOU
if (addProductForm) {
    addProductForm.addEventListener('submit', (e) => {
        e.preventDefault();

        const name = document.getElementById('prod-name').value;
        const price = parseInt(document.getElementById('prod-price').value);
        const desc = document.getElementById('prod-desc').value;
        const imageFile = document.getElementById('prod-image').files[0];

        if (!imageFile) {
            alert('Te rugăm să selectezi o imagine!');
            return;
        }

        const reader = new FileReader();
        reader.onload = function(event) {
            const base64Image = event.target.result;

            const newProduct = {
                id: Date.now(),
                name: name,
                price: price,
                description: desc,
                image: base64Image
            };

            let customProducts = JSON.parse(localStorage.getItem('floraria_custom_products')) || [];
            customProducts.push(newProduct);
            localStorage.setItem('floraria_custom_products', JSON.stringify(customProducts));

            alert(`Produsul "${name}" a fost adăugat cu succes!`);
            addProductForm.reset();
            renderCustomProductsList(); // Reîmprospătăm lista imediat după adăugare
        };
        reader.readAsDataURL(imageFile);
    });
}