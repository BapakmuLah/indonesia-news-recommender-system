// news-storage.js

const STORAGE_KEY = {
    READ_HISTORY: 'readHistory'
};

export function saveToHistory(id, limit = 20) {
    let history = JSON.parse(localStorage.getItem(STORAGE_KEY.READ_HISTORY)) || [];
    const idInt = parseInt(id);

    if (!history.includes(idInt)) {
        history.unshift(idInt);
        if (history.length > limit) history = history.slice(0, limit);
        localStorage.setItem(STORAGE_KEY.READ_HISTORY, JSON.stringify(history));
    }
}

export function getReadHistory() {
    return JSON.parse(localStorage.getItem(STORAGE_KEY.READ_HISTORY)) || [];
}

export function clearReadHistory() {
    localStorage.removeItem(STORAGE_KEY.READ_HISTORY);
}
