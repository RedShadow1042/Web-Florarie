const slides = document.querySelectorAll('.hero-slide');
const dots = document.querySelectorAll('.dot');
const cartCountElement = document.querySelector('.cart-count');
const addToCartButtons = document.querySelectorAll('.add-to-cart');
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

addToCartButtons.forEach((button) => {
    button.addEventListener('click', (event) => {
        const productCard = event.target.closest('.product-card');
        
        const productName = productCard.querySelector('h3').textContent;
        const productPriceText = productCard.querySelector('.price').textContent;
        
        const productPrice = parseInt(productPriceText.replace(' LEI', ''));

        const product = {
            name: productName,
            price: productPrice
        };

        cart.push(product);
        localStorage.setItem('floraria_cart', JSON.stringify(cart));
        updateCartCount();
    });
});

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
            // Îl lăsăm să poată da click pe iconiță ca să meargă la autentificare.html și să vadă butoanele de management cont!
            userIconLink.href = 'autentificare.html'; 
        }

        // Doar butonul de Panou Admin rămâne în meniu dacă e admin
        if (currentUser.role === 'admin' && navMenuList) {
            const adminLi = document.createElement('li');
            adminLi.innerHTML = `<a href="admin.html" style="color: #ffcccc;">Panou Admin</a>`;
            navMenuList.appendChild(adminLi);
        }
    }
}

updateCartCount();
checkLoggedInUser();
startAutoSlide();