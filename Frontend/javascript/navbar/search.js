// --- LOGIKA SEARCH BAR (COMING SOON FEATURE) ---

document.addEventListener('DOMContentLoaded', () => {
    const searchInput = document.getElementById('searchInput');
    const searchBtn = document.getElementById('searchBtn');
    
    const searchOverlay = document.getElementById('searchOverlay');
    const closeSearchBtn = document.getElementById('closeSearchBtn');

    // Fungsi untuk memunculkan overlay
    function showSearchOverlay() {
        const query = searchInput.value.trim();
        
        // Opsional: Validasi kalau input kosong, jangan muncul
        if (!query) {
            searchInput.focus();
            return; 
        }

        // Tampilkan Overlay
        searchOverlay.classList.add('active');
        document.body.style.overflow = 'hidden'; // Matikan scroll background
    }

    // Fungsi menutup overlay
    function hideSearchOverlay() {
        searchOverlay.classList.remove('active');
        document.body.style.overflow = 'auto'; // Nyalakan scroll lagi
        searchInput.value = ''; // Reset input (opsional)
    }

    // 1. Event saat tombol search diklik
    if (searchBtn) {
        searchBtn.addEventListener('click', (e) => {
            e.preventDefault(); // Mencegah form submit default (jika ada form)
            showSearchOverlay();
        });
    }

    // 2. Event saat tekan Enter di input
    if (searchInput) {
        searchInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                showSearchOverlay();
            }
        });
    }

    // 3. Event menutup overlay (Tombol Kembali)
    if (closeSearchBtn) {
        closeSearchBtn.addEventListener('click', hideSearchOverlay);
    }

    // 4. Event menutup jika klik di area kosong (luar konten)
    if (searchOverlay) {
        searchOverlay.addEventListener('click', (e) => {
            if (e.target === searchOverlay) {
                hideSearchOverlay();
            }
        });
    }
});