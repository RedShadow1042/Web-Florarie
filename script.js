const slides = document.querySelectorAll('.hero-slide');
const dots = document.querySelectorAll('.dot');
const cartCountElement = document.querySelector('.cart-count');
let currentSlide = 0;
let slideInterval;
let cart = JSON.parse(localStorage.getItem('floraria_cart')) || [];

function showSlide(index) {
    slides.forEach(slide => slide.classList.remove('active'));
    dots.forEach(dot => dot.classList.remove('active'));
    
    slides[index].classList.add('active');
    dots[index].classList.add('active');
}

function nextSlide() {
    currentSlide++;
    if (currentSlide >= slides.length) {
        currentSlide = 0;
    }
    showSlide(currentSlide);
}

function startAutoSlide() {
    slideInterval = setInterval(nextSlide, 5000);
}

function resetAutoSlide() {
    clearInterval(slideInterval);
    startAutoSlide();
}

dots.forEach((dot, index) => {
    dot.addEventListener('click', () => {
        currentSlide = index;
        showSlide(currentSlide);
        resetAutoSlide();
    });
});

function updateCartCount(){
    cartCountElement.textContent = cart.length;
}

// ==========================================
// INTEGRARE DYNAMICA BUCHETE DIN ADMIN
// ==========================================
function renderHomepageProducts() {
    const productsContainer = document.getElementById('homepage-products-container');
    if (!productsContainer) return;

    // Preluăm catalogul salvat de admin în localStorage
    let catalog = JSON.parse(localStorage.getItem('floraria_bouquets')) || [];
    
    // Filtrăm doar buchetele care sunt selectate pentru prima pagină
    let homepageBouquets = catalog.filter(b => b.onHomePage);

    // Dacă adminul a configurat buchete în panou, le generăm pe ecran peste cele statice
    if (homepageBouquets.length > 0) {
        productsContainer.innerHTML = ''; // Golim structura default din HTML

        homepageBouquets.forEach(bouquet => {
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
    }

    // Atașăm evenimentele de click pentru butoanele „Adaugă în coș” (atât pentru cele noi, cât și pentru fallback)
    const activeAddToCartButtons = productsContainer.querySelectorAll('.add-to-cart');
    activeAddToCartButtons.forEach((button) => {
        button.addEventListener('click', (event) => {
            const productCard = event.target.closest('.product-card');
            
            const productName = productCard.querySelector('h3').textContent;
            const productPriceText = productCard.querySelector('.price').textContent;
            
            // Eliminăm textul „LEI” sau „RON” pentru a obține corect prețul numeric ca în codul tău inițial
            const cleanPrice = productPriceText.replace(' LEI', '').replace(' RON', '').trim();
            const productPrice = parseInt(cleanPrice) || 0;

            const product = {
                name: productName,
                price: productPrice
            };

            cart.push(product);
            localStorage.setItem('floraria_cart', JSON.stringify(cart));
            updateCartCount();
        });
    });
}

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
            // Verificăm să nu adăugăm butonul de mai multe ori la reîncărcări accidentale
            if (!document.getElementById('admin-nav-link')) {
                const adminLi = document.createElement('li');
                adminLi.id = 'admin-nav-link';
                adminLi.innerHTML = `<a href="admin.html" style="color: #ffcccc;">Panou Admin</a>`;
                navMenuList.appendChild(adminLi);
            }
        }
    }
}

// Executăm funcțiile în ordinea corectă la încărcare
renderHomepageProducts();
updateCartCount();
checkLoggedInUser();
startAutoSlide();