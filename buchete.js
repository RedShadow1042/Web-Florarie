document.addEventListener('DOMContentLoaded', () => {
    let cart = JSON.parse(localStorage.getItem('floraria_cart')) || [];
    
    // FIX: ID corectat — buchete.html folosește 'homepage-products-container', nu 'all-products-container'
    const productsContainer = document.getElementById('homepage-products-container');
    const cartCountElement = document.querySelector('.cart-count');

    function updateCartCount() {
        if (cartCountElement) {
            cartCountElement.textContent = cart.length;
        }
    }

    function renderAllProducts() {
        if (!productsContainer) return;

        let catalog = JSON.parse(localStorage.getItem('floraria_bouquets')) || [];

        // Filtrăm doar produsele active
        const activeCatalog = catalog.filter(b => b.active !== false);

        if (activeCatalog.length === 0) {
            productsContainer.innerHTML = '<p style="text-align: center; width: 100%; color: #666; padding: 30px;">Momentan nu există buchete adăugate în magazin.</p>';
            return;
        }

        productsContainer.innerHTML = '';

        activeCatalog.forEach(bouquet => {
            // FIX: calculăm prețul final cu reducere (înainte afișa prețul brut fără reducere)
            const rawPrice = parseInt(String(bouquet.price).replace(/\s*lei/gi, '').trim()) || 0;
            const discount = parseInt(bouquet.discount) || 0;
            const finalPrice = discount > 0 ? Math.round(rawPrice * (1 - discount / 100)) : rawPrice;

            let priceHtml = '';
            if (discount > 0) {
                priceHtml = `
                    <span class="old-price" style="text-decoration:line-through; color:#a0958d; margin-right:8px; font-size:14px;">${rawPrice} LEI</span>
                    <span class="price" style="color:#dc3545;">${finalPrice} LEI</span>
                `;
            } else {
                priceHtml = `<span class="price">${finalPrice} LEI</span>`;
            }

            const productCard = document.createElement('div');
            productCard.className = 'product-card';
            productCard.innerHTML = `
                <div class="product-card-img-wrapper" style="position:relative;">
                    ${discount > 0 ? `<div style="position:absolute;top:8px;left:8px;background:#dc3545;color:white;font-size:11px;font-weight:bold;padding:3px 6px;border-radius:4px;z-index:5;">-${discount}%</div>` : ''}
                    <img src="${bouquet.image}" alt="${bouquet.name}" onerror="this.src='Imagini/blank_image.jpg'">
                </div>
                <div class="product-info">
                    <h3>${bouquet.name}</h3>
                    <div class="price-container">${priceHtml}</div>
                    <button class="add-to-cart">Adaugă în coș</button>
                    <button class="view-details" onclick="window.location.href='produs.html?nume=${encodeURIComponent(bouquet.name)}'">Detalii produs</button>
                </div>
            `;

            productCard.querySelector('.add-to-cart').addEventListener('click', () => {
                cart.push({ name: bouquet.name, price: finalPrice });
                localStorage.setItem('floraria_cart', JSON.stringify(cart));
                updateCartCount();
                alert(`"${bouquet.name}" a fost adăugat în coș!`);
            });

            productsContainer.appendChild(productCard);
        });
    }

    function checkLoggedInUser() {
        const currentUser = JSON.parse(localStorage.getItem('floraria_current_user'));
        const navMenuList = document.querySelector('.main-nav ul');
        if (currentUser) {
            const icon = document.querySelector('.icon-user');
            if (icon) {
                icon.innerHTML = `<span style="font-size:20px;">👤</span><span style="font-size:13px;margin-left:6px;white-space:nowrap;">${currentUser.name}</span>`;
                icon.style.cssText = 'display:flex;align-items:center;width:auto;height:44px;padding:0 14px;border-radius:22px;background:rgba(255,255,255,0.15);color:white;text-decoration:none;cursor:pointer;';
                icon.href = 'autentificare.html';
            }
            if (currentUser.role === 'admin' && navMenuList) {
                if (!document.getElementById('admin-nav-link')) {
                    const adminLi = document.createElement('li');
                    adminLi.id = 'admin-nav-link';
                    adminLi.innerHTML = `<a href="admin.html" style="color:#ffcccc;">Panou Admin</a>`;
                    navMenuList.appendChild(adminLi);
                }
            }
        }
    }

    renderAllProducts();
    updateCartCount();
    checkLoggedInUser();
});