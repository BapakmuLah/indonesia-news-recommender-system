
// --- KONFIGURASI API ---
const RANDOM_API_URL = "https://sandking-indonesian-news-recommender.hf.space/feed/random";
let apiCursor = 0; // Cursor awal sesuai backend (default 0)

// --- DOM ELEMENTS ---
const track = document.getElementById('carouselTrack');
const nextBtn = document.getElementById('nextBtn');
const prevBtn = document.getElementById('prevBtn');
const carouselContainer = document.querySelector('.carousel-container');

// --- STATE MANAGEMENT ---
let currentSlideIndex = 0;
let slideHistory = []; // Array untuk menyimpan riwayat berita (untuk tombol Prev)
let isFetching = false; // Flag agar tidak double fetch
let autoplayTimer = null;
let autoSlideDuration = 5000; // 5 Detik
let isHovering = false;

// --- 1. FUNGSI FETCH DATA DARI API ---
async function fetchRandomNews() {
    // Cegah fetch jika sedang loading
    if (isFetching) return null;
    isFetching = true;

    try {
        // Panggil Endpoint dengan cursor
        const response = await fetch(`${RANDOM_API_URL}?cursor=${apiCursor}`);
        
        if (!response.ok) throw new Error("API Error");
        
        const data = await response.json();

        // Update cursor untuk request berikutnya
        apiCursor = data.cursor;

        // Ambil data berita (result)
        const newsItem = data.result;

        // Validasi data (kadang null jika error di backend)
        if (!newsItem) {
            isFetching = false;
            return null;
        }

        isFetching = false;
        return newsItem;

    } catch (error) {
        console.error("Gagal mengambil banner random:", error);
        isFetching = false;
        return null;
    }
}

// --- 2. FUNGSI RENDER SLIDE KE DOM (UPDATED) ---
function createSlideElement(news) {
    // Fallback Image
    const imageUrl = news.image && news.image.startsWith('http') 
        ? news.image 
        : 'https://images.unsplash.com/photo-1504711434969-e33886168f5c?auto=format&fit=crop&w=1200&q=80';

    const sourceName = news.source ? news.source.toUpperCase() : "NEWS FLASH";

    const slide = document.createElement('article');
    slide.classList.add('hero-card', 'slide');

    // NEWS CARD
    slide.innerHTML = `
        <img src="${imageUrl}" alt="${news.title}" class="hero-image">
        <div class="hero-content">
            <span class="badge">${sourceName}</span>
            <h1 class="hero-title">${news.title}</h1>
            <p class="hero-summary">${news.summary || 'Klik tombol baca selengkapnya untuk melihat detail berita ini.'}</p>
            <button class="btn-primary read-full-btn">Baca Selengkapnya</button>
        </div>
    `;

    // --- EVENT LISTENER UNTUK MEMBUKA HALAMAN BERITA ---
    const btnRead = slide.querySelector('.read-full-btn');
    btnRead.addEventListener('click', () => {
        openArticlePage(news);
    });

    return slide;
}

// Helper Function: Simpan data dan Pindah Halaman
function openArticlePage(newsData) {
    // 1. Simpan objek berita ke LocalStorage
    // LocalStorage hanya menerima String, jadi kita JSON.stringify
    localStorage.setItem('currentArticle', JSON.stringify(newsData));
    
    // 2. Redirect ke halaman article.html
    window.location.href =  `article.html?id=${newsData.id}`;
}

// Menambahkan slide ke Track dan History
function appendSlide(news) {
    // 1. Simpan ke History (Memory)
    slideHistory.push(news);

    // 2. Buat Element HTML
    const slideElement = createSlideElement(news);
    track.appendChild(slideElement);
}

// --- 3. INITIALIZATION (Load Awal) ---
async function initCarousel() {
    // Load 2 slide pertama agar user bisa langsung geser sekali tanpa nunggu
    const slide1 = await fetchRandomNews();
    if(slide1) appendSlide(slide1);

    const slide2 = await fetchRandomNews();
    if(slide2) appendSlide(slide2);

    // Mulai Autoplay
    startAutoplay();
}

// --- 4. NAVIGASI UTAMA ---
const updateSlidePosition = () => {
    track.style.transform = `translateX(-${currentSlideIndex * 100}%)`;
};

const moveToNextSlide = async () => {
    // 1. Naikkan Index
    currentSlideIndex++;

    // 2. Cek apakah kita sudah di ujung slide?
    // slideHistory.length adalah jumlah total slide saat ini.
    // Jika currentSlideIndex == slideHistory.length - 1 (Slide Terakhir),
    // Maka kita harus fetch slide BARU untuk persiapan geser berikutnya.
    
    if (currentSlideIndex >= slideHistory.length - 1) {
        // Fetch data baru di background dan tempel di ujung kanan
        const newNews = await fetchRandomNews();
        if (newNews) {
            appendSlide(newNews);
        }
    }

    // 3. Update Visual Geser
    updateSlidePosition();
    resetAutoplay();
};

const moveToPrevSlide = () => {
    // Hanya bisa mundur jika index > 0
    if (currentSlideIndex > 0) {
        currentSlideIndex--;
        updateSlidePosition();
        resetAutoplay();
    }
};

// --- 5. LOGIKA AUTOPLAY & VISIBILITY ---
const startAutoplay = () => {
    if (autoplayTimer) clearInterval(autoplayTimer);
    autoplayTimer = setInterval(moveToNextSlide, autoSlideDuration);
};

const stopAutoplay = () => {
    if (autoplayTimer) {
        clearInterval(autoplayTimer);
        autoplayTimer = null;
    }
};

const resetAutoplay = () => {
    stopAutoplay();
    if (!document.hidden && !isHovering) {
        startAutoplay();
    }
};

// Handle Tab Visibility (Hemat resource browser)
document.addEventListener("visibilitychange", () => {
    if (document.hidden) {
        stopAutoplay();
    } else {
        if (!isHovering) startAutoplay();
    }
});

// --- 6. EVENT LISTENERS ---

if(nextBtn) {
    nextBtn.addEventListener('click', () => {
        moveToNextSlide(); 
        // Note: Kita panggil fungsi fetch di dalam moveToNextSlide
    });
}

if(prevBtn) {
    prevBtn.addEventListener('click', moveToPrevSlide);
}

// Hover Events
if(carouselContainer) {
    carouselContainer.addEventListener('mouseenter', () => {
        isHovering = true;
        stopAutoplay();
    });
    
    carouselContainer.addEventListener('mouseleave', () => {
        isHovering = false;
        resetAutoplay();
    });
}


// JALANKAN SAAT LOAD
initCarousel();