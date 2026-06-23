// =============================================
// orders.js — Istoricul comenzilor clientului
// =============================================
const myOrdersList = document.getElementById('my-orders-list');
const ordersTitle  = document.getElementById('orders-title');

const currentUser = JSON.parse(localStorage.getItem('floraria_current_user'));

if (!currentUser) {
    alert('Trebuie sa fii conectat pentru a-ti vedea comenzile!');
    window.location.href = 'autentificare.html';
} else {
    if (ordersTitle) ordersTitle.textContent = `Comenzile lui ${currentUser.name}`;
    renderMyOrders();
}

async function renderMyOrders() {
    if (!myOrdersList) return;
    myOrdersList.innerHTML = '<p style="text-align:center;color:#aaa;padding:20px;">Se incarca comenzile...</p>';

    try {
        const res = await fetch(`api/orders.php?action=my&email=${encodeURIComponent(currentUser.email)}`);
        const orders = await res.json();

        myOrdersList.innerHTML = '';

        if (!Array.isArray(orders) || orders.length === 0) {
            myOrdersList.innerHTML = `<div class="empty-cart-message" style="text-align:center;padding:30px;color:#666;">Nu ai nicio comanda plasata in acest moment.</div>`;
            return;
        }

        orders.forEach(order => {
            const card = document.createElement('div');
            card.className = 'order-card';

            const items = Array.isArray(order.items) ? order.items : [];
            let productsHTML = '';
            items.forEach(p => { productsHTML += `<li>🌸 ${p.name} - ${p.price} LEI</li>`; });

            let statusClass = 'status-asteptare';
            let statusLabel = order.status;
            if (order.status === 'active')     { statusClass = 'status-asteptare'; statusLabel = 'In procesare'; }
            if (order.status === 'completed')  { statusClass = 'status-livrata';   statusLabel = 'Finalizata'; }
            if (order.status === 'Anulata')    { statusClass = 'status-anulata';   statusLabel = 'Anulata'; }

            card.innerHTML = `
                <div class="order-header">
                    <span class="order-id">${order.id}</span>
                    <span class="order-date">📅 ${order.date}</span>
                </div>
                <ul class="order-products-list">${productsHTML}</ul>
                <div class="order-footer">
                    <div>Total: <span class="order-total-bold">${order.total} LEI</span></div>
                    <span class="order-status ${statusClass}">${statusLabel}</span>
                </div>`;
            myOrdersList.appendChild(card);
        });
    } catch(e) {
        myOrdersList.innerHTML = '<p style="text-align:center;color:#dc3545;">Eroare la incarcarea comenzilor. Asigura-te ca serverul XAMPP ruleaza.</p>';
    }
}
