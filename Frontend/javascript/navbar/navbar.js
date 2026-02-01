// --- FITUR DARK MODE ---
const themeToggleBtn = document.getElementById('themeToggle');
const moonIcon = document.querySelector('.moon-icon');
const sunIcon = document.querySelector('.sun-icon');
const htmlEl = document.documentElement;

function updateIcon(theme) {
    if (theme === 'dark') {
        moonIcon.style.display = 'none';
        sunIcon.style.display = 'block';
    } else {
        moonIcon.style.display = 'block';
        sunIcon.style.display = 'none';
    }
}

// Cek apakah user punya preferensi sebelumnya (disimpan di LocalStorage)
const savedTheme = localStorage.getItem('theme');
if (savedTheme) {
    htmlEl.setAttribute('data-theme', savedTheme);
    updateIcon(savedTheme);
}

// Event Listener Tombol
if (themeToggleBtn) {
    themeToggleBtn.addEventListener('click', () => {
        const currentTheme = htmlEl.getAttribute('data-theme');
        const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
        
        htmlEl.setAttribute('data-theme', newTheme);
        localStorage.setItem('theme', newTheme);
        updateIcon(newTheme);
    });
}

// 2. Search Logic (Simple Redirect)
const searchInput = document.getElementById('searchInput');
const searchBtn = document.getElementById('searchBtn');

function performSearch() {
    const query = searchInput.value.trim();
}

if (searchBtn) {
    searchBtn.addEventListener('click', performSearch);
}
if (searchInput) {
    searchInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') performSearch();
    });
}