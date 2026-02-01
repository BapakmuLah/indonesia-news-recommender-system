import { saveToHistory } from '../storage/news-storage.js';

const DETAIL_API_URL = "https://sandking-indonesian-news-recommender.hf.space/news";

const loadingState = document.getElementById('loadingState');
const articleContent = document.getElementById('articleContent');
const progressBar = document.getElementById('progressBar');

// Scroll progress
window.addEventListener('scroll', () => {
    const winScroll = document.documentElement.scrollTop;
    const height = document.documentElement.scrollHeight - document.documentElement.clientHeight;
    progressBar.style.width = (winScroll / height) * 100 + "%";
});

function formatArticleBody(text) {
    if (!text) return "<p>Konten tidak tersedia.</p>";
    return text
        .split('\n')
        .filter(p => p.trim())
        .map(p => `<p>${p}</p>`)
        .join('');
}

async function fetchArticleDetail() {
    const articleId = new URLSearchParams(window.location.search).get('id');
    if (!articleId) return;

    const res = await fetch(`${DETAIL_API_URL}/${articleId}`);
    const data = await res.json();

    document.title = data.title;
    document.getElementById('artTitle').innerText = data.title;
    document.getElementById('artCategory').innerText = data.category || 'Berita';
    document.getElementById('artSource').innerText = data.source;
    document.getElementById('artDate').innerText =
        new Date(data.date).toLocaleDateString('id-ID');

    document.getElementById('artImage').src =
        data.image?.startsWith('http') ? data.image : 'https://via.placeholder.com/800x400';

    document.getElementById('artBody').innerHTML = formatArticleBody(data.content);
    document.getElementById('artOriginalLink').href = data.url;

    loadingState.style.display = 'none';
    articleContent.style.display = 'block';
    articleContent.classList.add('visible');

    saveToHistory(data.id);
}

fetchArticleDetail();
