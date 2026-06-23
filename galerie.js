// ── State ─────────────────────────────────────────────
let galleryItems = [];
let currentIndex = 0;

// ── Skeleton placeholders ──────────────────────────────
function showSkeletons(n = 8) {
    const container = document.getElementById('gallery-container');
    container.innerHTML = Array.from({ length: n }, () =>
        '<div class="skeleton"></div>'
    ).join('');
}

// ── Render galerie ─────────────────────────────────────
function renderGallery(items) {
    const container = document.getElementById('gallery-container');

    if (!items || items.length === 0) {
        container.innerHTML = '<p class="gallery-empty">Nu există fotografii în galerie momentan.</p>';
        return;
    }

    container.innerHTML = items.map((item, i) => `
        <div class="gallery-item" data-index="${i}" tabindex="0" role="button" aria-label="Deschide ${item.title}">
            <img src="${item.image}" alt="${item.title}" loading="lazy">
            <div class="zoom-icon">🔍</div>
            <div class="overlay">${item.title}</div>
        </div>
    `).join('');

    // Event listeners pe carduri
    container.querySelectorAll('.gallery-item').forEach(el => {
        el.addEventListener('click', () => openLightbox(parseInt(el.dataset.index)));
        el.addEventListener('keydown', e => {
            if (e.key === 'Enter' || e.key === ' ') openLightbox(parseInt(el.dataset.index));
        });
    });
}

// ── Fetch galerie ──────────────────────────────────────
async function loadGallery() {
    showSkeletons();
    try {
        const res = await fetch('api/gallery.php?action=all');
        if (!res.ok) throw new Error('Eroare server: ' + res.status);
        const items = await res.json();
        galleryItems = items;
        renderGallery(items);
    } catch (err) {
        const container = document.getElementById('gallery-container');
        container.innerHTML = '<p class="gallery-empty">Nu am putut încărca galeria. Încearcă din nou mai târziu.</p>';
        console.error('Gallery load error:', err);
    }
}

// ── Lightbox ───────────────────────────────────────────
function openLightbox(index) {
    currentIndex = index;
    updateLightbox();
    document.getElementById('lightbox').classList.add('open');
    document.body.style.overflow = 'hidden';
}

function closeLightbox() {
    document.getElementById('lightbox').classList.remove('open');
    document.body.style.overflow = '';
}

function updateLightbox() {
    const item = galleryItems[currentIndex];
    const img = document.getElementById('lightbox-img');
    img.style.animation = 'none';
    img.offsetHeight; // reflow
    img.style.animation = '';
    img.src = item.image;
    img.alt = item.title;
    document.getElementById('lightbox-caption').textContent = item.title;
}

function prevImage() {
    currentIndex = (currentIndex - 1 + galleryItems.length) % galleryItems.length;
    updateLightbox();
}

function nextImage() {
    currentIndex = (currentIndex + 1) % galleryItems.length;
    updateLightbox();
}

// ── Lightbox events ────────────────────────────────────
document.getElementById('lightbox-close').addEventListener('click', closeLightbox);
document.getElementById('lb-prev').addEventListener('click', prevImage);
document.getElementById('lb-next').addEventListener('click', nextImage);

document.getElementById('lightbox').addEventListener('click', e => {
    if (e.target === document.getElementById('lightbox')) closeLightbox();
});

document.addEventListener('keydown', e => {
    if (!document.getElementById('lightbox').classList.contains('open')) return;
    if (e.key === 'Escape')     closeLightbox();
    if (e.key === 'ArrowLeft')  prevImage();
    if (e.key === 'ArrowRight') nextImage();
});

// ── Init ───────────────────────────────────────────────
window.onload = loadGallery;