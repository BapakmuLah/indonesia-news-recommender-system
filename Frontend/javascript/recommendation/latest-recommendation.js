
// --- KONFIGURASI API ---
// Base URL diambil dari Hugging Face Space Anda
const LATEST_API_URL = "https://sandking-indonesian-news-recommender.hf.space/feed/latest";

// --- DOM ELEMENTS ---
const latestTrack = document.getElementById('latestTrack');
const btnNext = document.getElementById('latestNextBtn');
const btnPrev = document.getElementById('latestPrevBtn');

// --- 1. UTILITY: FORMAT WAKTU (Time Ago) ---
function formatTimeAgo(dateString) {
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now - date) / 1000);

    // Jika selisih waktu kurang dari 1 jam
    if (diffInSeconds < 60) {
        return "Baru Saja";
    } else if (diffInSeconds < 3600) {
        const minutes = Math.floor(diffInSeconds / 60);
        return `${minutes} Menit lalu`;
    } else if (diffInSeconds < 86400) {
        const hours = Math.floor(diffInSeconds / 3600);
        return `${hours} Jam lalu`;
    } else {
        // Jika lebih dari 1 hari, tampilkan tanggal format pendek (misal: 14 Mar)
        return date.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });
    }
}

// --- 2. FETCH DATA DARI API ---
async function fetchLatestNews() {
    try {
        // Request ke endpoint GET /feed/latest dengan parameter top_k=20
        const response = await fetch(`${LATEST_API_URL}?top_k=20`);

        if (!response.ok) {
            throw new Error(`Gagal mengambil berita terbaru: ${response.status}`);
        }

        const data = await response.json();
        
        // data.results adalah array berita dari backend
        renderLatestCarousel(data.results);

    } catch (error) {
        console.error("Error fetching latest news:", error);
        latestTrack.innerHTML = `<p style="padding: 20px; color: red;">Gagal memuat berita terbaru.</p>`;
    }
}

// --- 3. RENDER CAROUSEL ---
function renderLatestCarousel(articles) {
    // Kosongkan track sebelum diisi (agar tidak duplikat jika dipanggil ulang)
    latestTrack.innerHTML = '';

    articles.forEach((news, index) => {
        // Fallback jika sumber/source kosong
        const sourceName = news.source ? news.source.toUpperCase() : "NEWS";
        
        // Format Waktu
        const timeDisplay = formatTimeAgo(news.date);

        // UI Logic: Tambahkan "Pulse Dot" (titik merah berkedip) 
        // hanya untuk 3 berita paling awal agar terlihat 'Live/Breaking'
        let pulseHtml = '';
        if (index < 3) {
            pulseHtml = `<div class="pulse-dot"></div>`;
        }

        // Template HTML Kartu
        // Note: Kita gunakan styling inline font-size sedikit agar muat di card kecil
        const html = `
            <article class="latest-card">
                <div class="latest-header">
                    <span class="latest-source">${sourceName}</span>
                    <span class="latest-time">
                        ${pulseHtml} 
                        ${timeDisplay}
                    </span>
                </div>
                
                <h3 class="latest-title">
                    <a href="article.html?id=${news.id}" target="_blank" style="text-decoration:none; color:inherit;">
                        ${news.title}
                    </a>
                </h3>
                
                <p class="card-summary" style="font-size: 0.85rem;">
                    ${news.summary ? news.summary.substring(0, 100) + '...' : 'Klik untuk membaca selengkapnya.'}
                </p>
            </article>
        `;

        // Masukkan ke dalam Track
        latestTrack.insertAdjacentHTML('beforeend', html);
    });
}

// --- 4. CAROUSEL NAVIGATION LOGIC (MANUAL SCROLL) ---
const scrollAmount = 320; // Lebar kartu (300px) + Gap (20px)

if (btnNext && btnPrev && latestTrack) {
    
    btnNext.addEventListener('click', () => {
        latestTrack.scrollBy({
            left: scrollAmount,
            behavior: 'smooth'
        });
    });

    btnPrev.addEventListener('click', () => {
        latestTrack.scrollBy({
            left: -scrollAmount,
            behavior: 'smooth'
        });
    });
}

// --- 5. INITIALIZATION ---
// Jalankan fungsi saat file JS dimuat
fetchLatestNews();