// Așteptăm ca structura HTML să fie complet încărcată
window.addEventListener('DOMContentLoaded', () => {
    updateCartCount();
    renderHomepageProducts();
    setupAdminPanel();
});

// 1. ACTUALIZARE NUMĂR PRODUSE ÎN COȘ
function updateCartCount() {
    const cartCountElement = document.querySelector('.cart-count');
    if (cartCountElement) {
        let cart = JSON.parse(localStorage.getItem('floraria_cart')) || [];
        cartCountElement.textContent = cart.length;
    }
}

// 2. RENDEREA DINAMICĂ A PRODUSELOR PE PAGINĂ (INDEX ȘI BUCHETE)
function renderHomepageProducts() {
    const container = document.getElementById('homepage-products-container');
    if (!container) return; // Oprim execuția dacă nu suntem pe o pagină cu listă de produse

    let catalog = JSON.parse(localStorage.getItem('floraria_bouquets')) || [];

    // Dacă avem produse salvate în baza de date locală, curățăm produsele statice mockup și le punem pe cele reale
    if (catalog.length > 0) {
        container.innerHTML = ''; //Șterge produsele de test din HTML-ul brut

        catalog.forEach(bouquet => {
            const rawPrice = parseInt(bouquet.price) || 0;
            const discount = parseInt(bouquet.discount) || 0;
            let finalPrice = rawPrice;
            let priceHtml = '';

            // Dacă produsul are reducere setată în Admin, calculăm noul preț
            if (discount > 0) {
                finalPrice = Math.round(rawPrice * (1 - discount / 100));
                priceHtml = `
                    <span class="old-price" style="text-decoration: line-through; color: #a0958d; margin-right: 8px; font-size: 14px;">${rawPrice} LEI</span>
                    <span class="price">${finalPrice} LEI</span>
                `;
            } else {
                priceHtml = `<span class="price">${rawPrice} LEI</span>`;
            }

            const card = document.createElement('div');
            card.className = 'product-card';
            card.innerHTML = `
                <div class="product-card-img-wrapper">
                    ${discount > 0 ? `<div style="position:absolute; top:8px; left:8px; background:#dc3545; color:white; font-size:11px; font-weight:bold; padding:3px 6px; border-radius:4px; z-index:5;">-${discount}%</div>` : ''}
                    <img src="${bouquet.image}" alt="${bouquet.name}" onerror="this.src='Imagini/blank_image.jpg'">
                </div>
                <div class="product-info">
                    <h3>${bouquet.name}</h3>
                    <div class="price-container">
                        ${priceHtml}
                    </div>
                    <button class="add-to-cart">Adaugă în coș</button>
                    <button class="view-details" onclick="window.location.href='produs.html?nume=${encodeURIComponent(bouquet.name)}'">Detalii produs</button>
                </div>
            `;

            // Eveniment funcțional pentru adăugarea directă în coș din card
            card.querySelector('.add-to-cart').addEventListener('click', () => {
                let cart = JSON.parse(localStorage.getItem('floraria_cart')) || [];
                cart.push({
                    name: bouquet.name,
                    price: finalPrice
                });
                localStorage.setItem('floraria_cart', JSON.stringify(cart));
                updateCartCount();
                alert(`"${bouquet.name}" a fost adăugat în coș!`);
            });

            container.appendChild(card);
        });
    } else {
        // Dacă local storage e gol, lăsăm produsele statice scrise direct în HTML, dar le legăm funcțional butoanele de adăugare în coș
        const staticCards = container.querySelectorAll('.product-card');
        staticCards.forEach(card => {
            const btnAdd = card.querySelector('.add-to-cart');
            if(btnAdd) {
                btnAdd.addEventListener('click', () => {
                    const name = card.querySelector('h3').textContent;
                    const priceText = card.querySelector('.price').textContent;
                    const price = parseInt(priceText) || 0;

                    let cart = JSON.parse(localStorage.getItem('floraria_cart')) || [];
                    cart.push({ name: name, price: price });
                    localStorage.setItem('floraria_cart', JSON.stringify(cart));
                    updateCartCount();
                    alert(`"${name}" a fost adăugat în coș!`);
                });
            }
        });
    }
}

// 3. LOGICA PENTRU PANOU ADMINISTRARE (ADĂUGARE / ȘTERGERE PRODUSE)
function setupAdminPanel() {
    const form = document.getElementById('add-bouquet-form');
    if (!form) return; // Oprim execuția dacă nu ne aflăm pe pagina Panou Admin

    const bouquetListContainer = document.getElementById('admin-bouquets-list');

    // Funcție internă de randare a listei din tabelul de admin
    function renderAdminList() {
        if (!bouquetListContainer) return;
        let catalog = JSON.parse(localStorage.getItem('floraria_bouquets')) || [];
        bouquetListContainer.innerHTML = '';

        if (catalog.length === 0) {
            bouquetListContainer.innerHTML = '<tr><td colspan="5" style="text-align:center; color:#777;">Nu există produse adăugate în catalog.</td></tr>';
            return;
        }

        catalog.forEach((bouquet, index) => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td><img src="${bouquet.image}" style="width:50px; height:50px; object-fit:cover; border-radius:4px;" onerror="this.src='Imagini/blank_image.jpg'"></td>
                <td><strong>${bouquet.name}</strong></td>
                <td>${bouquet.price} LEI</td>
                <td>${bouquet.discount || 0}%</td>
                <td><button class="delete-btn" style="background:#dc3545; color:white; border:none; padding:5px 10px; border-radius:4px; cursor:pointer;" data-index="${index}">Șterge</button></td>
            `;
            bouquetListContainer.appendChild(tr);
        });

        // Legăm butoanele de ștergere
        bouquetListContainer.querySelectorAll('.delete-btn').forEach(button => {
            button.addEventListener('click', (e) => {
                const idx = e.target.getAttribute('data-index');
                let catalog = JSON.parse(localStorage.getItem('floraria_bouquets')) || [];
                if(confirm(`Sigur vrei să ștergi produsul "${catalog[idx].name}"?`)) {
                    catalog.splice(idx, 1);
                    localStorage.setItem('floraria_bouquets', JSON.stringify(catalog));
                    renderAdminList();
                }
            });
        });
    }

    // Ascultător pentru trimiterea formularului de adăugare
    form.addEventListener('submit', (e) => {
        e.preventDefault();

        const nameInput = document.getElementById('bouquet-name').value.trim();
        const priceInput = document.getElementById('bouquet-price').value.trim();
        const discountInput = document.getElementById('bouquet-discount').value.trim();
        const descInput = document.getElementById('bouquet-desc') ? document.getElementById('bouquet-desc').value.trim() : '';
        const fileInput = document.getElementById('bouquet-image');

        if (!nameInput || !priceInput) {
            alert('Te rog introdu cel puțin numele și prețul de bază!');
            return;
        }

        let catalog = JSON.parse(localStorage.getItem('floraria_bouquets')) || [];

        // Verificăm dublurile
        if (catalog.some(b => b.name.toLowerCase() === nameInput.toLowerCase())) {
            alert('Există deja un buchet cu acest nume! Folosește un nume unic.');
            return;
        }

        const newBouquet = {
            name: nameInput,
            price: parseInt(priceInput),
            discount: parseInt(discountInput) || 0,
            desc: descInput,
            image: 'Imagini/blank_image.jpg' // Imagine default
        };

        // Procesare imagine în format Base64 (dacă a fost selectat un fișier local)
        if (fileInput && fileInput.files && fileInput.files[0]) {
            const reader = new FileReader();
            reader.onload = function(event) {
                newBouquet.image = event.target.result; // Salvează string-ul imaginii
                catalog.push(newBouquet);
                localStorage.setItem('floraria_bouquets', JSON.stringify(catalog));
                form.reset();
                renderAdminList();
                alert('Produsul a fost adăugat cu succes în catalog!');
            };
            reader.readAsDataURL(fileInput.files[0]);
        } else {
            // Dacă nu a pus imagine, îl salvăm direct cu cea default
            catalog.push(newBouquet);
            localStorage.setItem('floraria_bouquets', JSON.stringify(catalog));
            form.reset();
            renderAdminList();
            alert('Produsul a fost adăugat fără imagine specifică (s-a alocat imaginea default).');
        }
    });

    // Inițializăm lista din admin la prima încărcare a paginii administrative
    renderAdminList();
}