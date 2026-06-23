// =============================================
// cart.js — Cos de cumparaturi
// =============================================
const cartItemsList        = document.getElementById('cart-items-list');
const cartSummaryBox       = document.getElementById('cart-summary-box');
const cartTotalPriceElement= document.getElementById('cart-total-price');
const checkoutBtn          = document.getElementById('checkout-btn');
const clearCartBtn         = document.getElementById('clear-cart-btn');

let cart = JSON.parse(localStorage.getItem('floraria_cart')) || [];

function renderCart() {
    if (!cartItemsList) return;
    cartItemsList.innerHTML = '';

    if (cart.length === 0) {
        cartItemsList.innerHTML = `<div class="empty-cart-message">Cosul tau este gol. Mergi pe pagina "Buchete" pentru a adauga produse!</div>`;
        if (cartSummaryBox) cartSummaryBox.style.display = 'none';
        return;
    }

    if (cartSummaryBox) cartSummaryBox.style.display = 'block';
    let total = 0;

    cart.forEach((product, index) => {
        total += product.price;
        const row = document.createElement('div');
        row.className = 'cart-item-row';
        row.innerHTML = `
            <div class="cart-item-info"><h4>${product.name}</h4></div>
            <div class="cart-item-actions">
                <span class="cart-item-price">${product.price} LEI</span>
                <button class="remove-item-btn" data-index="${index}">❌</button>
            </div>`;
        cartItemsList.appendChild(row);
    });

    if (cartTotalPriceElement) cartTotalPriceElement.textContent = total;

    document.querySelectorAll('.remove-item-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            cart.splice(parseInt(e.target.getAttribute('data-index')), 1);
            localStorage.setItem('floraria_cart', JSON.stringify(cart));
            renderCart();
        });
    });
}

if (clearCartBtn) {
    clearCartBtn.addEventListener('click', () => {
        if (confirm('Esti sigur ca vrei sa golesti tot cosul?')) {
            cart = [];
            localStorage.setItem('floraria_cart', JSON.stringify(cart));
            renderCart();
        }
    });
}

if (checkoutBtn) {
    checkoutBtn.addEventListener('click', async () => {
        const currentUser = JSON.parse(localStorage.getItem('floraria_current_user'));
        if (!currentUser) {
            alert('Trebuie sa fii conectat intr-un cont pentru a putea finaliza comanda!');
            window.location.href = 'autentificare.html';
            return;
        }

        const total = parseInt(cartTotalPriceElement.textContent) || 0;
        checkoutBtn.disabled = true;
        checkoutBtn.textContent = 'Se trimite comanda...';

        try {
            const res = await fetch('api/orders.php?action=place', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    user_id:        currentUser.id,
                    customer_name:  currentUser.name,
                    customer_email: currentUser.email,
                    items:          cart,
                    total:          total
                })
            });
            const data = await res.json();

            if (data.error) {
                alert('Eroare: ' + data.error);
                checkoutBtn.disabled = false;
                checkoutBtn.textContent = 'Finalizeaza Comanda';
                return;
            }

            alert('Comanda ta a fost trimisa cu succes! O poti vedea in sectiunea "Comenzile Mele".');
            cart = [];
            localStorage.setItem('floraria_cart', JSON.stringify(cart));
            window.location.href = 'comenzi.html';
        } catch(e) {
            alert('Eroare de conexiune. Asigura-te ca serverul XAMPP ruleaza.');
            checkoutBtn.disabled = false;
            checkoutBtn.textContent = 'Finalizeaza Comanda';
        }
    });
}

// Ascunde link "Comenzile Mele" daca nu e logat
const myOrdersNav = document.getElementById('nav-my-orders');
if (myOrdersNav && !JSON.parse(localStorage.getItem('floraria_current_user'))) {
    myOrdersNav.style.display = 'none';
}

renderCart();
