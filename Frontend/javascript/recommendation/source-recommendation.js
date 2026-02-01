
// --- KONFIGURASI API ---
const SOURCE_API_BASE = "https://sandking-indonesian-news-recommender.hf.space/feed/source";

// SUMBER BERITA
const AVAILABLE_SOURCES = [
    "cnnindonesia",
    "cnbcindonesia", 
    "suara", 
    "kumparan",
    "tempo",
    "okezone",
    "jawapos"
];

// DOM Elements
const sourceTabsContainer = document.getElementById('sourceTabs');
const sourceNewsTrack = document.getElementById('sourceNewsTrack');

// --- 1. UTILITY: USER ID (Reuse logic) ---
function getSourceUserId() {
    let uid = localStorage.getItem('site_user_id');
    if (!uid) {
        uid = 'user_' + Date.now();
        localStorage.setItem('site_user_id', uid);
    }
    return uid;
}

// --- 2. RENDER TABS ---
function renderSourceTabs() {
    sourceTabsContainer.innerHTML = '';
    
    AVAILABLE_SOURCES.forEach((source, index) => {
        const btn = document.createElement('button');
        btn.className = `source-btn ${index === 0 ? 'active' : ''}`; // Aktifkan tombol pertama default
        btn.innerText = source;
        btn.onclick = () => handleSourceClick(source, btn);
        sourceTabsContainer.appendChild(btn);
    });

    // Load sumber pertama secara otomatis saat awal buka
    fetchSourceNews(AVAILABLE_SOURCES[0]);
}

// --- 3. HANDLE CLICK ---
function handleSourceClick(sourceName, clickedBtn) {
    // Update UI Tombol
    document.querySelectorAll('.source-btn').forEach(b => b.classList.remove('active'));
    clickedBtn.classList.add('active');

    // Fetch Data
    fetchSourceNews(sourceName);
}

// --- 4. FETCH DATA DARI API ---
async function fetchSourceNews(sourceName) {
    // Tampilkan Loading State
    sourceNewsTrack.innerHTML = `<div class="loading-placeholder">Sedang mengambil berita dari ${sourceName}...</div>`;

    try {
        const userId = getSourceUserId();
        // Encode sourceName karena ada spasi (misal "CNN INDONESIA" jadi "CNN%20INDONESIA")
        const encodedSource = encodeURIComponent(sourceName);
        
        const url = `${SOURCE_API_BASE}/${encodedSource}?user_id=${userId}&top_k=10`;
        
        const response = await fetch(url);
        if (!response.ok) throw new Error("Gagal mengambil data source");

        const data = await response.json();
        
        // Render Hasil
        renderSourceCards(data.results);

    } catch (error) {
        console.error(error);
        sourceNewsTrack.innerHTML = `<div class="loading-placeholder" style="color:red">Gagal memuat berita. Silakan coba lagi.</div>`;
    }
}

// --- 5. RENDER CARDS ---
function renderSourceCards(articles) {
    if (!articles || articles.length === 0) {
        sourceNewsTrack.innerHTML = `<div class="loading-placeholder">Tidak ada berita ditemukan untuk sumber ini.</div>`;
        return;
    }

    sourceNewsTrack.innerHTML = ''; // Bersihkan container

    articles.forEach(article => {
        // Fallback Image
        const imageUrl = article.image && article.image.startsWith('http') 
            ? article.image 
            : 'https://images.unsplash.com/photo-1504711434969-e33886168f5c?auto=format&fit=crop&w=800&q=80';
        
        // Format Tanggal Simpel
        const dateObj = new Date(article.date);
        const dateStr = dateObj.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });

        const html = `
            <article class="news-card">
                <div class="card-img-wrapper">
                    <img src="${imageUrl}" alt="${article.title}" class="card-img" loading="lazy">
                </div>
                <div class="card-content">
                    <div class="card-meta">
                        <span class="source-tag" style="color:var(--primary)">${article.source}</span>
                        <time style="font-size:0.75rem; color:#999;">${dateStr}</time>
                    </div>
                    
                    <h3 class="card-title" style="font-size:1rem;">${article.title}</h3>
                    
                    <a href="article.html?id=${article.id}" class="read-more">Baca &rarr;</a>
                </div>
            </article>
        `;
        
        sourceNewsTrack.insertAdjacentHTML('beforeend', html);
    });
}


// --- 6. LOGIC NAVIGASI CAROUSEL (BARU) ---
const sourcePrevBtn = document.getElementById('sourcePrevBtn');
const sourceNextBtn = document.getElementById('sourceNextBtn');

// Jarak scroll per klik (Lebar kartu 300px + Gap 24px)
const SOURCE_SCROLL_AMOUNT = 324; 

if (sourcePrevBtn && sourceNextBtn && sourceNewsTrack) {
    
    sourceNextBtn.addEventListener('click', () => {
        sourceNewsTrack.scrollBy({
            left: SOURCE_SCROLL_AMOUNT,
            behavior: 'smooth'
        });
    });

    sourcePrevBtn.addEventListener('click', () => {
        sourceNewsTrack.scrollBy({
            left: -SOURCE_SCROLL_AMOUNT,
            behavior: 'smooth'
        });
    });
}



// --- INITIALIZATION ---
document.addEventListener('DOMContentLoaded', () => {
    renderSourceTabs();
});