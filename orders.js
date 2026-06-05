const myOrdersList = document.getElementById('my-orders-list');
const ordersTitle = document.getElementById('orders-title');

const currentUser = JSON.parse(localStorage.getItem('floraria_current_user'));

if (!currentUser) {
    alert('Trebuie să fii conectat pentru a-ți vedea comenzile!');
    window.location.href = 'autentificare.html';
} else {
    if (ordersTitle) ordersTitle.textContent = `Comenzile lui ${currentUser.name}`;
    renderMyOrders();
}

function renderMyOrders() {
    const allOrders = JSON.parse(localStorage.getItem('floraria_orders')) || [];
    const myOrders = allOrders.filter(order => order.customerEmail === currentUser.email);

    myOrdersList.innerHTML = '';

    if (myOrders.length === 0) {
        myOrdersList.innerHTML = `<div class="empty-cart-message" style="text-align: center; padding: 30px; color: #666;">Nu ai nicio comandă plasată în acest moment.</div>`;
        return;
    }

    myOrders.reverse().forEach(order => {
        const orderCard = document.createElement('div');
        orderCard.className = 'order-card';

        // FIX: comanda salvată din cart.js are cheia 'products' dar și 'items' ca alias
        // Suportăm ambele chei pentru compatibilitate
        const productsList = order.products || order.items || [];

        let productsHTML = '';
        productsList.forEach(prod => {
            productsHTML += `<li>🌸 ${prod.name} - ${prod.price} LEI</li>`;
        });

        // FIX: statusul 'active' (trimis de cart.js) nu avea CSS class mapat → apărea fără stil
        let statusClass = 'status-asteptare';
        let statusLabel = order.status;
        if (order.status === 'active') {
            statusClass = 'status-asteptare';
            statusLabel = 'În procesare';
        }
        if (order.status === 'completed') {
            statusClass = 'status-livrata';
            statusLabel = 'Finalizată';
        }
        if (order.status === 'Livrată') statusClass = 'status-livrata';
        if (order.status === 'Anulată') { statusClass = 'status-anulata'; statusLabel = 'Anulată'; }

        // FIX: total poate fi în 'totalPrice' (cart.js) sau 'total' (admin.js)
        const orderTotal = order.totalPrice !== undefined ? order.totalPrice : (order.total || 0);

        orderCard.innerHTML = `
            <div class="order-header">
                <span class="order-id">${order.id}</span>
                <span class="order-date">📅 ${order.date}</span>
            </div>
            <ul class="order-products-list">
                ${productsHTML}
            </ul>
            <div class="order-footer">
                <div>Total: <span class="order-total-bold">${orderTotal} LEI</span></div>
                <span class="order-status ${statusClass}">${statusLabel}</span>
            </div>
        `;

        myOrdersList.appendChild(orderCard);
    });
}