// Inițializare catalog implicit dacă e gol
(function initializeCatalogIfEmpty() {
    let catalog = JSON.parse(localStorage.getItem('floraria_bouquets')) || [];
    if (catalog.length === 0) {
        const defaultBouquets = [
            { name: "Buchet 1", price: 150, discount: 20, desc: "Un buchet superb plin de trandafiri roșii proaspeți, perfect aranjați într-un coș tradițional.", image: "Imagini/buchet1.jpg", active: true },
            { name: "Test 2", price: 3000, discount: 0, desc: "Un aranjament floral spectaculos de proporții monumentale.", image: "Imagini/buchet2.jpg", active: true },
            { name: "Test3", price: 123, discount: 15, desc: "Buchet colorat de primăvară alcătuit din flori parfumate.", image: "Imagini/buchet3.jpg", active: true },
            { name: "Test 4", price: 12313, discount: 0, desc: "Creație florală unică destinată ocaziilor de protocol.", image: "Imagini/buchet4.jpg", active: true },
            { name: "Buchet 123", price: 123, discount: 0, desc: "Buchet personalizat simplu și elegant.", image: "Imagini/blank_image.jpg", active: true }
        ];
        localStorage.setItem('floraria_bouquets', JSON.stringify(defaultBouquets));
    }
})();

window.addEventListener('DOMContentLoaded', () => {
    updateCartCount();
    renderHomepageProducts();
    setupCarousel();       // va fi suprascris de renderHeroSlides dacă există panouri custom
    renderHeroSlides();    // panouri din admin — dacă există, înlocuiesc cele statice
    checkLoggedInUser();
});

// ══════════════════════════════════════════
// HERO SLIDES DINAMICE (din Admin)
// ══════════════════════════════════════════
function renderHeroSlides() {
    const heroSection = document.querySelector('.hero-section');
    if (!heroSection) return;

    const STORAGE_KEY = 'floraria_hero_slides';
    const slides = JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
    // Filtrăm doar panourile active
    const activeSlides = slides.filter(s => s.active !== false);

    // Dacă nu există panouri configurate în admin, lăsăm cele statice din HTML
    if (activeSlides.length === 0) return;

    // Construim HTML-ul dinamic
    let slidesHTML = '';
    activeSlides.forEach((slide, i) => {
        const bgStyle = slide.bg
            ? (slide.bg.includes('gradient') ? `background: ${slide.bg};` : `background-color: ${slide.bg};`)
            : '';
        const textStyle = slide.textColor ? `color: ${slide.textColor};` : '';

        slidesHTML += `
            <div class="hero-slide ${i === 0 ? 'active' : ''}" style="${bgStyle}">
                <div class="hero-content">
                    <h2 style="${textStyle}">${slide.title || ''}</h2>
                    <p style="${textStyle}">${slide.subtitle || ''}</p>
                    ${slide.btnText
                        ? `<a href="${slide.btnLink || '#'}" class="hero-btn">${slide.btnText}</a>`
                        : ''}
                </div>
            </div>
        `;
    });

    // Dots
    let dotsHTML = '<div class="hero-dots">';
    activeSlides.forEach((_, i) => {
        dotsHTML += `<span class="dot ${i === 0 ? 'active' : ''}"></span>`;
    });
    dotsHTML += '</div>';

    heroSection.innerHTML = slidesHTML + dotsHTML;

    // Re-inițializăm carousel-ul cu noile elemente
    setupCarousel();
}

// ══════════════════════════════════════════
// CAROUSEL LOGIC
// ══════════════════════════════════════════
function setupCarousel() {
    const slides = document.querySelectorAll('.hero-slide');
    const dots = document.querySelectorAll('.dot');
    if (!slides.length || !dots.length) return;

    // Curățăm intervalul anterior dacă există (pentru re-inițializare)
    if (window._carouselInterval) clearInterval(window._carouselInterval);

    let currentSlide = 0;

    function showSlide(index) {
        slides.forEach(slide => slide.classList.remove('active'));
        dots.forEach(dot => dot.classList.remove('active'));
        slides[index].classList.add('active');
        dots[index].classList.add('active');
    }

    function nextSlide() {
        currentSlide = (currentSlide + 1) % slides.length;
        showSlide(currentSlide);
    }

    window._carouselInterval = setInterval(nextSlide, 5000);

    dots.forEach((dot, index) => {
        dot.addEventListener('click', () => {
            currentSlide = index;
            showSlide(currentSlide);
            clearInterval(window._carouselInterval);
            window._carouselInterval = setInterval(nextSlide, 5000);
        });
    });
}

// ══════════════════════════════════════════
// COȘ — NUMĂR PRODUSE
// ══════════════════════════════════════════
function updateCartCount() {
    const cartCountElement = document.querySelector('.cart-count');
    if (cartCountElement) {
        let cart = JSON.parse(localStorage.getItem('floraria_cart')) || [];
        cartCountElement.textContent = cart.length;
    }
}

// ══════════════════════════════════════════
// PRODUSE HOMEPAGE
// ══════════════════════════════════════════
function renderHomepageProducts() {
    const container = document.getElementById('homepage-products-container');
    if (!container) return;

    let catalog = JSON.parse(localStorage.getItem('floraria_bouquets')) || [];
    container.innerHTML = '';

    const activeCatalog = catalog.filter(bouquet => bouquet.active !== false);

    activeCatalog.forEach(bouquet => {
        const rawPrice = parseInt(String(bouquet.price).replace(/\s*lei/gi, '').trim()) || 0;
        const discount = parseInt(bouquet.discount) || 0;
        let finalPrice = discount > 0 ? Math.round(rawPrice * (1 - discount / 100)) : rawPrice;
        let priceHtml = '';

        if (discount > 0) {
            priceHtml = `
                <span class="old-price" style="text-decoration: line-through; color: #a0958d; margin-right: 8px; font-size: 14px;">${rawPrice} LEI</span>
                <span class="price" style="color: #dc3545;">${finalPrice} LEI</span>
            `;
        } else {
            priceHtml = `<span class="price">${rawPrice} LEI</span>`;
        }

        const card = document.createElement('div');
        card.className = 'product-card';
        card.innerHTML = `
            <div class="product-card-img-wrapper" style="position:relative;">
                ${discount > 0 ? `<div class="discount-tag" style="position:absolute; top:8px; left:8px; background:#dc3545; color:white; font-size:11px; font-weight:bold; padding:3px 6px; border-radius:4px; z-index:5;">-${discount}%</div>` : ''}
                <img src="${bouquet.image}" alt="${bouquet.name}" onerror="this.src='Imagini/blank_image.jpg'">
            </div>
            <div class="product-info">
                <h3>${bouquet.name}</h3>
                <div class="price-container">${priceHtml}</div>
                <button class="add-to-cart">Adăugă în coș</button>
                <button class="view-details" onclick="window.location.href='produs.html?nume=${encodeURIComponent(bouquet.name)}'">Detalii produs</button>
            </div>
        `;

        card.querySelector('.add-to-cart').addEventListener('click', () => {
            let cart = JSON.parse(localStorage.getItem('floraria_cart')) || [];
            cart.push({ name: bouquet.name, price: finalPrice });
            localStorage.setItem('floraria_cart', JSON.stringify(cart));
            updateCartCount();
            alert(`"${bouquet.name}" a fost adăugat în coș!`);
        });

        container.appendChild(card);
    });
}

// ══════════════════════════════════════════
// UTILIZATOR LOGAT
// ══════════════════════════════════════════
function checkLoggedInUser() {
    const currentUser = JSON.parse(localStorage.getItem('floraria_current_user'));
    const navMenuList = document.querySelector('.main-nav ul');
    
    if (currentUser) {
        const userIconLink = document.querySelector('.icon-user');
        if (userIconLink) {
            userIconLink.innerHTML = `👤 <span style="font-size:14px; margin-left:5px; font-family:Arial,sans-serif;">${currentUser.name}</span>`;
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