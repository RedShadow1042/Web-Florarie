const myOrdersList = document.getElementById('my-orders-list');
const ordersTitle = document.getElementById('orders-title');

// Verificăm dacă utilizatorul este logat
const currentUser = JSON.parse(localStorage.getItem('floraria_current_user'));

if (!currentUser) {
    alert('Trebuie să fii conectat pentru a-ți vedea comenzile!');
    window.location.href = 'autentificare.html';
} else {
    // Personalizăm titlul paginii cu numele utilizatorului
    if (ordersTitle) ordersTitle.textContent = `Comenzile lui ${currentUser.name}`;
    
    // Afișăm comenzile
    renderMyOrders();
}

function renderMyOrders() {
    // Preluăm toate comenzile din sistem
    const allOrders = JSON.parse(localStorage.getItem('floraria_orders')) || [];
    
    // Filtrăm pentru a le păstra doar pe cele ale utilizatorului logat curent
    const myOrders = allOrders.filter(order => order.customerEmail === currentUser.email);

    myOrdersList.innerHTML = '';

    if (myOrders.length === 0) {
        myOrdersList.innerHTML = `<div class="empty-cart-message" style="text-align: center; padding: 30px; color: #666;">Nu ai nicio comandă plasată în acest moment.</div>`;
        return;
    }

    // Afișăm comenzile în ordine inversă (cea mai nouă comanda să fie sus)
    myOrders.reverse().forEach(order => {
        const orderCard = document.createElement('div');
        orderCard.className = 'order-card';

        // Generăm lista de produse formatată sub formă de listă HTML
        let productsHTML = '';
        order.products.forEach(prod => {
            productsHTML += `<li>🌸 ${prod.name} - ${prod.price} LEI</li>`;
        });

        // Mapăm stilurile CSS în funcție de statusul comenzii
        let statusClass = 'status-asteptare';
        if (order.status === 'Livrată') statusClass = 'status-livrata';
        if (order.status === 'Anulată') statusClass = 'status-anulata';

        // Construim structura vizuală a comenzii
        orderCard.innerHTML = `
            <div class="order-header">
                <span class="order-id">${order.id}</span>
                <span class="order-date">📅 ${order.date}</span>
            </div>
            <ul class="order-products-list">
                ${productsHTML}
            </ul>
            <div class="order-footer">
                <div>Total: <span class="order-total-bold">${order.totalPrice} LEI</span></div>
                <span class="order-status ${statusClass}">${order.status}</span>
            </div>
        `;

        myOrdersList.appendChild(orderCard);
    });
}