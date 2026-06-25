document.addEventListener('DOMContentLoaded', () => {
    let cart = JSON.parse(localStorage.getItem('floraria_cart')) || [];
    
    const productsContainer = document.getElementById('homepage-products-container');
    const cartCountElement  = document.querySelector('.cart-count');

    function escB(s) {
        return String(s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
    }

    function updateCartCount() {
        if (cartCountElement) cartCountElement.textContent = cart.length;
    }

    // Incarcam produsele din API (nu din localStorage)
    async function renderAllProducts() {
        if (!productsContainer) return;
        productsContainer.innerHTML = '<p style="text-align:center;color:#aaa;padding:30px;">Se incarca produsele...</p>';

        try {
            const res     = await fetch('api/products.php?action=active');
            const catalog = await res.json();

            if (!Array.isArray(catalog) || catalog.length === 0) {
                productsContainer.innerHTML = '<p style="text-align:center;color:#666;padding:30px;">Momentan nu există buchete adăugate în magazin.</p>';
                return;
            }

            productsContainer.innerHTML = '';

            catalog.forEach(bouquet => {
                const rawPrice   = parseInt(bouquet.price)    || 0;
                const discount   = parseInt(bouquet.discount) || 0;
                const finalPrice = discount > 0 ? Math.round(rawPrice * (1 - discount / 100)) : rawPrice;

                let priceHtml = discount > 0
                    ? `<span class="old-price" style="text-decoration:line-through;color:#a0958d;margin-right:8px;font-size:14px;">${rawPrice} LEI</span>
                       <span class="price" style="color:#dc3545;">${finalPrice} LEI</span>`
                    : `<span class="price">${finalPrice} LEI</span>`;

                const productCard = document.createElement('div');
                productCard.className = 'product-card';
                productCard.innerHTML = `
                    <div class="product-card-img-wrapper" style="position:relative;">
                        ${discount > 0 ? `<div style="position:absolute;top:8px;left:8px;background:#dc3545;color:white;font-size:11px;font-weight:bold;padding:3px 6px;border-radius:4px;z-index:5;">-${escB(String(discount))}%</div>` : ''}
                        <img src="${escB(bouquet.image)}" alt="${escB(bouquet.name)}" onerror="this.src='Imagini/blank_image.jpg'">
                    </div>
                    <div class="product-info">
                        <h3>${escB(bouquet.name)}</h3>
                        <div class="price-container">${priceHtml}</div>
                        <button class="add-to-cart">Adaugă în coș</button>
                        <button class="view-details" onclick="window.location.href='produs.html?id=${escB(String(bouquet.id))}'">Detalii produs</button>
                    </div>
                `;

                productCard.querySelector('.add-to-cart').addEventListener('click', () => {
                    cart.push({ id: bouquet.id, name: bouquet.name, price: finalPrice });
                    localStorage.setItem('floraria_cart', JSON.stringify(cart));
                    updateCartCount();
                    alert(`"${bouquet.name}" a fost adăugat în coș!`);
                });

                productsContainer.appendChild(productCard);
            });
        } catch(e) {
            productsContainer.innerHTML = '<p style="text-align:center;color:#dc3545;">Eroare la incarcarea produselor.</p>';
        }
    }

    function checkLoggedInUser() {
        const currentUser = JSON.parse(localStorage.getItem('floraria_current_user'));
        const navMenuList = document.querySelector('.main-nav ul');
        if (currentUser) {
            const icon = document.querySelector('.icon-user');
            if (icon) {
                icon.innerHTML = `<span style="font-size:20px;">👤</span><span style="font-size:13px;margin-left:6px;white-space:nowrap;">${escB(currentUser.name)}</span>`;
                icon.style.cssText = 'display:flex;align-items:center;width:auto;height:44px;padding:0 14px;border-radius:22px;background:rgba(255,255,255,0.15);color:white;text-decoration:none;cursor:pointer;';
                icon.href = 'autentificare.html';
            }
            // Link admin vizibil doar daca rol e admin (verificat si pe backend)
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