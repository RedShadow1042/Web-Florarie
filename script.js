// =============================================
// script.js — Homepage: produse + hero + cos
// =============================================

window.addEventListener('DOMContentLoaded', async () => {
    updateCartCount();
    checkLoggedInUser();
    await renderHomepageProducts();
    await renderHeroSlides();
});

// ── Produse homepage ──────────────────────────
async function renderHomepageProducts() {
    const container = document.getElementById('homepage-products-container');
    if (!container) return;
    container.innerHTML = '<p style="text-align:center;color:#aaa;padding:30px;">Se incarca produsele...</p>';
    try {
        const res = await fetch('api/products.php?action=active');
        const catalog = await res.json();
        if (!Array.isArray(catalog) || catalog.length === 0) {
            container.innerHTML = '<p style="text-align:center;color:#666;padding:30px;">Momentan nu exista produse disponibile.</p>';
            return;
        }
        container.innerHTML = '';
        catalog.forEach(bouquet => {
            const rawPrice   = parseInt(bouquet.price)    || 0;
            const discount   = parseInt(bouquet.discount) || 0;
            const finalPrice = discount > 0 ? Math.round(rawPrice * (1 - discount / 100)) : rawPrice;
            const priceHtml  = discount > 0
                ? `<span class="old-price">${rawPrice} LEI</span><span class="price" style="color:#dc3545;">${finalPrice} LEI</span>`
                : `<span class="price">${rawPrice} LEI</span>`;

            const card = document.createElement('div');
            card.className = 'product-card';
            card.innerHTML = `
                <div class="product-card-img-wrapper">
                    ${discount > 0 ? `<div class="discount-tag">-${discount}%</div>` : ''}
                    <img src="${bouquet.image}" alt="${bouquet.name}" onerror="this.src='Imagini/blank_image.jpg'">
                </div>
                <div class="product-info">
                    <h3>${bouquet.name}</h3>
                    <div class="price-container">${priceHtml}</div>
                    <button class="add-to-cart">Adauga in cos</button>
                    <button class="view-details" onclick="window.location.href='produs.html?id=${bouquet.id}'">Detalii produs</button>
                </div>`;
            card.querySelector('.add-to-cart').addEventListener('click', () => {
                addToCart({ id: bouquet.id, name: bouquet.name, price: finalPrice });
            });
            container.appendChild(card);
        });
    } catch (e) {
        container.innerHTML = '<p style="text-align:center;color:#dc3545;">Eroare la incarcarea produselor.</p>';
    }
}

// ── Hero carousel dinamic ─────────────────────
async function renderHeroSlides() {
    const heroSection = document.querySelector('.hero-section');
    if (!heroSection) return;
    try {
        const res    = await fetch('api/hero.php?action=active');
        const slides = await res.json();
        if (!Array.isArray(slides) || slides.length === 0) {
            setupCarousel();
            return;
        }

        let html = '';
        slides.forEach((s, i) => {
            // Fundal
            let bgStyle = '';
            if (s.bg_image) {
                bgStyle = `background-image:url('${s.bg_image}');background-size:cover;background-position:center;`;
            } else if (s.bg) {
                bgStyle = s.bg.includes('gradient') ? `background:${s.bg};` : `background-color:${s.bg};`;
            }

            // Overlay gradient (doar pentru slide-uri cu imagine)
            let overlayHtml = '';
            if (s.bg_image) {
                const gradDir = s.grad_dir || 'to right';
                const alpha   = ((parseInt(s.grad_str) || 55) / 100).toFixed(2);
                overlayHtml = `<div class="hero-overlay" style="background:linear-gradient(${gradDir},rgba(0,0,0,${alpha}) 0%,rgba(0,0,0,0) 70%);"></div>`;
            }

            // Pozitie text (clamped sigur; CSS reseteaza pe mobile <600px)
            const posX    = Math.min(Math.max(parseInt(s.pos_x) || 50, 12), 88);
            const posY    = Math.min(Math.max(parseInt(s.pos_y) || 50, 12), 78);
            const posStyle = `position:absolute;left:${posX}%;top:${posY}%;transform:translate(-50%,-50%);z-index:2;`;

            html += `
            <div class="hero-slide has-dynamic-content ${i === 0 ? 'active' : ''}" style="${bgStyle}">
                ${overlayHtml}
                <div class="hero-content" style="${posStyle}">
                    ${s.title    ? `<h2>${s.title}</h2>`    : ''}
                    ${s.subtitle ? `<p>${s.subtitle}</p>`   : ''}
                    ${s.btn_text ? `<a href="${s.btn_link || '#'}" class="hero-btn">${s.btn_text}</a>` : ''}
                </div>
            </div>`;
        });

        // Dots
        const dotsHtml = '<div class="hero-dots">'
            + slides.map((_, i) => `<span class="dot ${i === 0 ? 'active' : ''}"></span>`).join('')
            + '</div>';

        heroSection.innerHTML = html + dotsHtml;
    } catch (e) {
        /* API indisponibil — lasam slide-urile statice din HTML */
    }
    setupCarousel();
}

// ── Carousel logic ────────────────────────────
function setupCarousel() {
    const slides = document.querySelectorAll('.hero-slide');
    const dots   = document.querySelectorAll('.dot');
    if (!slides.length) return;

    if (window._carouselInterval) clearInterval(window._carouselInterval);
    let current = 0;

    function showSlide(idx) {
        slides.forEach(s => s.classList.remove('active'));
        dots.forEach(d   => d.classList.remove('active'));
        if (slides[idx]) slides[idx].classList.add('active');
        if (dots[idx])   dots[idx].classList.add('active');
        current = idx;
    }

    function nextSlide() {
        showSlide((current + 1) % slides.length);
    }

    window._carouselInterval = setInterval(nextSlide, 5000);

    dots.forEach((dot, i) => dot.addEventListener('click', () => {
        showSlide(i);
        clearInterval(window._carouselInterval);
        window._carouselInterval = setInterval(nextSlide, 5000);
    }));
}

// ── Cos ───────────────────────────────────────
function addToCart(item) {
    const cart = JSON.parse(localStorage.getItem('floraria_cart')) || [];
    cart.push(item);
    localStorage.setItem('floraria_cart', JSON.stringify(cart));
    updateCartCount();
    alert(`"${item.name}" a fost adaugat in cos!`);
}

function updateCartCount() {
    const el = document.querySelector('.cart-count');
    if (el) el.textContent = (JSON.parse(localStorage.getItem('floraria_cart')) || []).length;
}

// ── Utilizator logat ──────────────────────────
function checkLoggedInUser() {
    const u = JSON.parse(localStorage.getItem('floraria_current_user'));
    if (!u) return;

    const icon = document.querySelector('.icon-user');
    if (icon) {
        icon.innerHTML = `<span style="font-size:20px;">👤</span><span style="font-size:13px;margin-left:6px;white-space:nowrap;">${u.name}</span>`;
        icon.style.cssText = 'display:flex;align-items:center;width:auto;height:44px;padding:0 14px;border-radius:22px;background:rgba(255,255,255,0.15);color:white;text-decoration:none;cursor:pointer;transition:background .2s;';
        icon.href = 'autentificare.html';
    }

    if (u.role === 'admin') {
        const nav = document.querySelector('.main-nav ul');
        if (nav && !document.getElementById('admin-nav-link')) {
            const li = document.createElement('li');
            li.id = 'admin-nav-link';
            li.innerHTML = `<a href="admin.html" style="color:#ffcccc;">Panou Admin</a>`;
            nav.appendChild(li);
        }
    }
}