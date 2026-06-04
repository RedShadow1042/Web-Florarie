document.addEventListener('DOMContentLoaded', () => {
    let cart = JSON.parse(localStorage.getItem('floraria_cart')) || [];
    
    // Inițializări elemente
    const productsContainer = document.getElementById('all-products-container');
    const cartCountElement = document.querySelector('.cart-count');

    // Sincronizare număr coș
    function updateCartCount() {
        if (cartCountElement) {
            cartCountElement.textContent = cart.length;
        }
    }

    // Funcție de randare a catalogului complet (fără filtru de prima pagină)
    function renderAllProducts() {
        if (!productsContainer) return;

        let catalog = JSON.parse(localStorage.getItem('floraria_bouquets')) || [];

        if (catalog.length === 0) {
            productsContainer.innerHTML = '<p style="text-align: center; width: 100%; color: #666; padding: 30px;">Momentan nu există buchete adăugate în magazin.</p>';
            return;
        }

        productsContainer.innerHTML = ''; // Curățăm textul de încărcare

        // Generăm dinamic TOATE produsele din baza de date
        catalog.forEach(bouquet => {
            const productCard = document.createElement('div');
            productCard.className = 'product-card';

            productCard.innerHTML = `
                <img src="${bouquet.image}" alt="${bouquet.name}" onerror="this.src='Imagini/blank_image.jpg'">
                <h3>${bouquet.name}</h3>
                <p class="price">${bouquet.price}</p>
                <button class="add-to-cart">Adauga in cos</button>
                <button class="view-details" onclick="alert('Descriere produs:\n\n${bouquet.desc || bouquet.name}')">Detalii produs</button>
            `;
            productsContainer.appendChild(productCard);
        });

        // Atașăm evenimentele de click pentru coș
        const addToCartButtons = productsContainer.querySelectorAll('.add-to-cart');
        addToCartButtons.forEach((button) => {
            button.addEventListener('click', (event) => {
                const productCard = event.target.closest('.product-card');
                
                const productName = productCard.querySelector('h3').textContent;
                const productPriceText = productCard.querySelector('.price').textContent;
                
                const cleanPrice = productPriceText.replace(' LEI', '').replace(' RON', '').trim();
                const productPrice = parseInt(cleanPrice) || 0;

                const product = {
                    name: productName,
                    price: productPrice
                };

                cart.push(product);
                localStorage.setItem('floraria_cart', JSON.stringify(cart));
                updateCartCount();
                alert(`"${productName}" a fost adăugat în coș!`);
            });
        });
    }

    // Verificarea utilizatorului autentificat (afișare nume și link admin)
    function checkLoggedInUser() {
        const currentUser = JSON.parse(localStorage.getItem('floraria_current_user'));
        const navMenuList = document.querySelector('.main-nav ul');
        
        if (currentUser) {
            const userIconLink = document.querySelector('.icon-user');
            if (userIconLink) {
                userIconLink.innerHTML = `👤 <span style="font-size: 14px; margin-left: 5px; font-family: Arial, sans-serif;">${currentUser.name}</span>`;
                userIconLink.style.width = 'auto';
                userIconLink.style.padding = '0 15px';
                userIconLink.style.borderRadius = '30px';
                userIconLink.href = 'autentificare.html'; 
            }

            if (currentUser.role === 'admin' && navMenuList) {
                if (!document.getElementById('admin-nav-link')) {
                    const adminLi = document.createElement('li');
                    adminLi.id = 'admin-nav-link';
                    adminLi.innerHTML = `<a href="admin.html" style="color: #ffcccc;">Panou Admin</a>`;
                    navMenuList.appendChild(adminLi);
                }
            }
        }
    }

    // Executare funcții la deschiderea paginii
    renderAllProducts();
    updateCartCount();
    checkLoggedInUser();
});