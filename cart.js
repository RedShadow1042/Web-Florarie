const cartItemsList = document.getElementById('cart-items-list');
const cartSummaryBox = document.getElementById('cart-summary-box');
const cartTotalPriceElement = document.getElementById('cart-total-price');
const checkoutBtn = document.getElementById('checkout-btn');
const clearCartBtn = document.getElementById('clear-cart-btn');

let cart = JSON.parse(localStorage.getItem('floraria_cart')) || [];

function renderCart() {
    if (!cartItemsList) return;
    cartItemsList.innerHTML = '';

    if (cart.length === 0) {
        cartItemsList.innerHTML = `<div class="empty-cart-message">Coșul tău este gol. Mergi pe pagina principală pentru a adăuga buchete!</div>`;
        if (cartSummaryBox) cartSummaryBox.style.display = 'none';
        return;
    }

    if (cartSummaryBox) cartSummaryBox.style.display = 'block';
    let total = 0;

    cart.forEach((product, index) => {
        total += product.price;

        const itemRow = document.createElement('div');
        itemRow.className = 'cart-item-row';
        itemRow.innerHTML = `
            <div class="cart-item-info">
                <h4>${product.name}</h4>
            </div>
            <div class="cart-item-actions">
                <span class="cart-item-price">${product.price} LEI</span>
                <button class="remove-item-btn" data-index="${index}">❌</button>
            </div>
        `;
        cartItemsList.appendChild(itemRow);
    });

    if (cartTotalPriceElement) cartTotalPriceElement.textContent = total;

    const removeButtons = document.querySelectorAll('.remove-item-btn');
    removeButtons.forEach(button => {
        button.addEventListener('click', (event) => {
            const indexToRemove = parseInt(event.target.getAttribute('data-index'));
            removeItemFromCart(indexToRemove);
        });
    });
}

function removeItemFromCart(index) {
    cart.splice(index, 1);
    localStorage.setItem('floraria_cart', JSON.stringify(cart));
    renderCart();
}

if (clearCartBtn) {
    clearCartBtn.addEventListener('click', () => {
        if (confirm('Ești sigur că vrei să golești tot coșul?')) {
            cart = [];
            localStorage.setItem('floraria_cart', JSON.stringify(cart));
            renderCart();
        }
    });
}

if (checkoutBtn) {
    checkoutBtn.addEventListener('click', () => {
        const currentUser = JSON.parse(localStorage.getItem('floraria_current_user'));
        
        if (!currentUser) {
            alert('Trebuie să fii conectat într-un cont pentru a putea finaliza comanda!');
            window.location.href = 'autentificare.html'; 
            return;
        }

        const newOrder = {
            id: 'CMD-' + Date.now(),
            customerName: currentUser.name,
            customerEmail: currentUser.email,
            products: cart,
            totalPrice: parseInt(cartTotalPriceElement.textContent),
            date: new Date().toLocaleDateString('ro-RO') + ' ' + new Date().toLocaleTimeString('ro-RO'),
            status: 'În așteptare'
        };

        let orders = JSON.parse(localStorage.getItem('floraria_orders')) || [];
        orders.push(newOrder);
        localStorage.setItem('floraria_orders', JSON.stringify(orders));

        alert('Comanda ta a fost trimisă cu succes! O poți vedea în secțiunea „Comenzile Mele”.');
        
        cart = [];
        localStorage.setItem('floraria_cart', JSON.stringify(cart));
        window.location.href = 'comenzi.html'; 
    });
}

renderCart();

const myOrdersNavButton = document.getElementById('nav-my-orders');
const userLoggedIn = JSON.parse(localStorage.getItem('floraria_current_user'));
if (myOrdersNavButton && !userLoggedIn) {
    myOrdersNavButton.style.display = 'none';
}