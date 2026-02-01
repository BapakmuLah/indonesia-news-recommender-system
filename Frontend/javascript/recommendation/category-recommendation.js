// --- KONFIGURASI API ---
// Endpoint: /feed/category/{category}?user_id=...&top_k=10
const CATEGORY_API_BASE = "https://sandking-indonesian-news-recommender.hf.space/feed/category";

// Daftar Kategori (23 Items)
const ALL_CATEGORIES = [
    "Politik", "Hukum", "Ekonomi", "Bisnis", "Keuangan", 
    "Teknologi", "Sains", "Kesehatan", "Pendidikan", "Sosial", 
    "Kriminalitas", "Agama", "Lingkungan", "Bencana Alam", "Energi", 
    "Transportasi", "Infrastruktur", "Internasional", 
    "Pertahanan & Keamanan", "Olahraga", "Hiburan", "Gaya Hidup"
];

// DOM Elements
const categorySelect = document.getElementById('categorySelect');
const categoryNewsTrack = document.getElementById('categoryNewsTrack');
const catPrevBtn = document.getElementById('catPrevBtn');
const catNextBtn = document.getElementById('catNextBtn');

// --- 1. UTILITY: USER ID ---
function getCatUserId() {
    let uid = localStorage.getItem('site_user_id');
    if (!uid) {
        uid = 'user_' + Date.now();
        localStorage.setItem('site_user_id', uid);
    }
    return uid;
}

// --- 2. POPULATE DROPDOWN ---
function initCategoryDropdown() {
    // Kosongkan dulu
    categorySelect.innerHTML = '';
    
    ALL_CATEGORIES.forEach((cat, index) => {
        const option = document.createElement('option');
        // Value slug: "Gaya Hidup" -> "Gaya%20Hidup" (untuk URL)
        option.value = cat; 
        option.innerText = cat;
        categorySelect.appendChild(option);
    });

    // Load kategori pertama (Politik) saat awal
    fetchCategoryNews(ALL_CATEGORIES[0]);

    // Event Listener saat ganti pilihan
    categorySelect.addEventListener('change', (e) => {
        fetchCategoryNews(e.target.value);
    });
}

// --- 3. FETCH DATA ---
async function fetchCategoryNews(categoryName) {
    // Loading State
    categoryNewsTrack.innerHTML = `<div class="loading-placeholder">Memuat berita topik ${categoryName}...</div>`;

    try {
        const userId = getCatUserId();
        // Encode URL (penting untuk kategori yang ada spasi atau simbol &)
        const encodedCat = encodeURIComponent(categoryName);
        
        const url = `${CATEGORY_API_BASE}/${encodedCat}?user_id=${userId}&top_k=10`;
        
        const response = await fetch(url);
        if (!response.ok) throw new Error("Gagal mengambil data kategori");

        const data = await response.json();
        renderCategoryCards(data.results);

    } catch (error) {
        console.error(error);
        categoryNewsTrack.innerHTML = `<div class="loading-placeholder" style="color:red">Gagal memuat. Coba lagi.</div>`;
    }
}

// --- 4. RENDER CARDS ---
function renderCategoryCards(articles) {
    if (!articles || articles.length === 0) {
        categoryNewsTrack.innerHTML = `<div class="loading-placeholder">Belum ada berita untuk topik ini.</div>`;
        return;
    }

    categoryNewsTrack.innerHTML = '';

    articles.forEach(article => {
        const imageUrl = article.image && article.image.startsWith('http') 
            ? article.image 
            : 'https://images.unsplash.com/photo-1504711434969-e33886168f5c?auto=format&fit=crop&w=800&q=80';
        
        const dateObj = new Date(article.date);
        const dateStr = dateObj.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });

        const html = `
            <article class="news-card" style="min-width:300px; max-width:300px; scroll-snap-align:start; border:1px solid #f3f4f6; box-shadow:none;">
                <div class="card-img-wrapper">
                    <img src="${imageUrl}" alt="${article.title}" class="card-img" loading="lazy">
                </div>
                <div class="card-content">
                    <div class="card-meta">
                        <span class="source-tag">${article.source}</span>
                        <time style="font-size:0.75rem; color:#999;">${dateStr}</time>
                    </div>
                    <h3 class="card-title" style="font-size:1rem;">${article.title}</h3>
                    <a href="article.html?id=${article.id}" class="read-more">Baca &rarr;</a>
                </div>
            </article>
        `;
        categoryNewsTrack.insertAdjacentHTML('beforeend', html);
    });
}

// --- 5. LOGIC NAVIGASI CAROUSEL ---
const CAT_SCROLL_AMOUNT = 324; // Width + Gap

if (catPrevBtn && catNextBtn && categoryNewsTrack) {
    catNextBtn.addEventListener('click', () => {
        categoryNewsTrack.scrollBy({ left: CAT_SCROLL_AMOUNT, behavior: 'smooth' });
    });

    catPrevBtn.addEventListener('click', () => {
        categoryNewsTrack.scrollBy({ left: -CAT_SCROLL_AMOUNT, behavior: 'smooth' });
    });
}

// --- INIT ---
document.addEventListener('DOMContentLoaded', () => {
    initCategoryDropdown();
});