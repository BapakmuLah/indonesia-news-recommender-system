// --- KONFIGURASI API ---
// Endpoint 1: Jika User SUDAH punya history bacaan
const PERSONAL_API_URL = "https://sandking-indonesian-news-recommender.hf.space/feed/personalization"; 

// Endpoint 2: Jika User BARU (Belum ada history)
const COLD_START_API_URL = "https://sandking-indonesian-news-recommender.hf.space/feed/home";

// --- KONFIGURASI STACK ---
const ITEMS_PER_ROW = 3;      
const STACKS_PER_LOAD = 2;    
const ITEMS_PER_LOAD = ITEMS_PER_ROW * STACKS_PER_LOAD; // 6 item
const MAX_STACKS = 10;        
const TOTAL_ITEMS_TO_FETCH = ITEMS_PER_ROW * MAX_STACKS; // 30 item

// --- STATE MANAGEMENT ---
let allArticles = [];         
let renderedCount = 0;        
const newsGrid = document.querySelector('.news-grid');
const loadMoreContainer = document.getElementById('loadMoreContainer');
const loadMoreBtn = document.getElementById('loadMoreBtn');
const filterContainer = document.getElementById('categoryFilters');

// --- 1. UTILITY: USER ID MANAGEMENT ---
// Fungsi ini membuat ID unik untuk user baru dan menyimpannya di browser
function getUserId() {
    let uid = localStorage.getItem('site_user_id');
    if (!uid) {
        // Generate Random ID: user_TIMESTAMP_RANDOM
        uid = 'user_' + Date.now() + '_' + Math.random().toString(36).substring(2, 9);
        localStorage.setItem('site_user_id', uid);
    }
    return uid;
}

// --- 2. LOGIC HISTORY READER ---
function getReadHistory() {
    const history = JSON.parse(localStorage.getItem('readHistory'));
    // Return array history atau array kosong jika belum ada
    return history && history.length > 0 ? history : []; 
}

// --- 3. SETUP KATEGORI & FILTER ---
const categories = [
    "Politik", "Hukum", "Ekonomi", "Bisnis", "Keuangan", 
    "Teknologi", "Sains", "Kesehatan", "Pendidikan", "Sosial", 
    "Budaya", "Agama", "Lingkungan", "Bencana Alam", "Energi", 
    "Industri", "Transportasi", "Infrastruktur", "Internasional", 
    "Pertahanan & Keamanan", "Olahraga", "Hiburan", "Gaya Hidup"
];



function attachFilterEvents() {
    const buttons = document.querySelectorAll('.filter-btn');
    buttons.forEach(btn => {
        btn.addEventListener('click', () => {
            buttons.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            
            const filterValue = btn.getAttribute('data-filter');
            const visibleCards = document.querySelectorAll('.news-grid .news-card');
            
            visibleCards.forEach(card => {
                const cardCategory = card.getAttribute('data-category');
                if (filterValue === 'all' || cardCategory === filterValue) {
                    card.style.display = 'flex';
                    card.style.animation = 'fadeIn 0.5s ease';
                } else {
                    card.style.display = 'none';
                }
            });
        });
    });
}

// --- 4. FUNGSI FETCH DATA UTAMA (LOGIC BARU) ---
async function fetchAllRecommendations() {
    try {
        const history = getReadHistory();
        let response;
        
        // --- CABANG LOGIKA: COLD START VS PERSONALIZED ---
        
        if (history.length === 0) {
            // KONDISI A: User Baru (Belum punya history) -> Pake COLD START
            const userId = getUserId();
            console.log(`User Baru detected (${userId}). Mengambil Cold Start Recommendation...`);
            
            // Panggil GET /feed/home
            response = await fetch(`${COLD_START_API_URL}?user_id=${userId}&top_k=${TOTAL_ITEMS_TO_FETCH}`);
            
        } else {
            // KONDISI B: User Lama (Punya history) -> Pake PERSONALIZATION
            console.log("User Lama detected. Mengambil Personalized Recommendation...", history.slice(0, 8));
            
            const requestBody = {
                article_ids: history.slice(0, 8), // Ambil 3 history terakhir
                top_k: TOTAL_ITEMS_TO_FETCH + 1
            };

            // Panggil POST /recommendation
            response = await fetch(PERSONAL_API_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(requestBody)
            });
        }

        if (!response.ok) throw new Error(`API Error: ${response.status}`);

        const data = await response.json();
        allArticles = data.results; 
        
        // Render Batch Pertama
        renderNextBatch();
        
        // Show Load More Button
        if (allArticles.length > renderedCount) {
            loadMoreContainer.style.display = 'block';
        }

    } catch (error) {
        console.error("Gagal mengambil rekomendasi:", error);
        newsGrid.innerHTML = `<p style="text-align:center; width:100%; color:#666;">Gagal memuat rekomendasi. Coba refresh halaman.</p>`;
    }
}

// --- 5. FUNGSI RENDER BATCH (TETAP SAMA) ---
function renderNextBatch() {
    const nextLimit = renderedCount + ITEMS_PER_LOAD;
    const batch = allArticles.slice(renderedCount, nextLimit);
    
    batch.forEach(article => {
        const imageUrl = article.image && article.image.startsWith('http') 
            ? article.image 
            : 'https://images.unsplash.com/photo-1504711434969-e33886168f5c?auto=format&fit=crop&w=800&q=80';
            
        const rawDate = new Date(article.date);
        const formattedDate = rawDate.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });
        
        const rawCategory = article.category || "Umum";
        const catSlug = rawCategory.toLowerCase().replace(/ & /g, '-').replace(/ /g, '-');

        const html = `
            <article class="news-card" data-category="${catSlug}">
                <div class="card-img-wrapper">
                    <img src="${imageUrl}" alt="${article.title}" class="card-img" loading="lazy">
                </div>
                <div class="card-content">
                    <div class="card-meta">
                        <span class="source-tag">${article.source || 'News'}</span>
                        <span style="font-size:0.7rem; background:#f3f4f6; padding:2px 6px; border-radius:4px; font-weight:600; color:#4b5563;">
                            ${rawCategory.toUpperCase()}
                        </span>
                    </div>
                    <time style="font-size:0.8rem; color:#999; margin-bottom:0.5rem; display:block;">${formattedDate}</time>
                    <h3 class="card-title">${article.title}</h3>
                    <p class="card-summary">${article.summary}</p>
                    <a href="article.html?id=${article.id}" class="read-more">Baca selengkapnya &rarr;</a>
                </div>
            </article>
        `;
        
        newsGrid.insertAdjacentHTML('beforeend', html);
    });

    renderedCount += batch.length;
    
    if (renderedCount >= allArticles.length) {
        loadMoreContainer.style.display = 'none'; 
    }

    // Refresh filter logic
    const activeFilterBtn = document.querySelector('.filter-btn.active');
    if(activeFilterBtn) {
        activeFilterBtn.click();
    } else {
        attachFilterEvents();
    }
}

// --- 6. EVENT LISTENER ---
loadMoreBtn.addEventListener('click', () => {
    const originalText = loadMoreBtn.innerHTML;
    loadMoreBtn.innerText = "Memuat...";
    setTimeout(() => {
        renderNextBatch();
        loadMoreBtn.innerHTML = originalText;
    }, 300); 
});

// --- 7. INITIALIZATION ---
document.addEventListener('DOMContentLoaded', () => {
    fetchAllRecommendations(); 
});