# 📰 Indonesian News Recommendation System

A news website that recommends articles based on user personalization and the user’s reading history.

## 🖥️ Live Demo

- Frontend (UI) : https://indonesia-news-recommender-system.vercel.app/ (Vercel)
- Backend (API) : https://sandking-indonesian-news-recommender.hf.space/run/api/docs (Hugging Face Spaces)

## 🚀 Key Features
1. **Article recommendations powered by FAISS (Facebook AI Similarity Search) to compute vector similarity between a user’s reading history and the news database.**
2. **Displays popular/general news for new users who do not yet have interaction history.**
3. **Allows users to filter news by category (Politics, Economy, Sports, etc.) and by news source (CNN Indonesia, CNBC Indonesia, Kumparan, Tempo, etc).**
4. **Backend is built with FastAPI and uses caching (`TTLCache`) to ensure low-latency responses.**

## 🎯 Target Audience
1. Individuals with limited time who need fast, relevant, and to-the-point news curation tailored to their industry (Finance, Tech, etc.) without having to search manually.
2. A generation accustomed to personalization algorithms (such as TikTok/Instagram) and more inclined toward automatically curated content rather than rigid, conventional news portals.
3. Users who want to deeply monitor specific topics only (e.g., news about “Politics” or “Environmental Issues”) from multiple sources at once.

<br>

## 💎 Future Business Model

Although currently positioned as an open-source portfolio, this project has strong potential for a sustainable business model in future development:

### 1. Freemium B2C Model (Subscription)
* **Free Tier:** Access to news with ads and standard-level personalization.
* **Premium Tier:** Ad-free experience, access to “AI Summary” features (using LLMs to summarize 5 similar news articles), and unlimited priority personalization.

### 2. API-as-a-Service (B2B)
Selling access to the recommendation API endpoints to smaller local media portals or third-party applications that want to add a “Related News” feature but do not have an in-house AI/ML team.
* *Revenue Stream:* Pay-per-request or monthly API key subscription.


## 🛠️ Tech Stack

### Machine Learning & Data
* **Engine:** FAISS
* **Data Processing:** Pandas, NumPy
* **Dataset:** `SandKing/News-Recommendation` (Hugging Face Datasets)
* **Method:** Content-Based Filtering

### Backend (API)
* **Framework:** FastAPI (Python)
* **Deployment:** Hugging Face Spaces (Docker)
* **Optimization:** `cachetools` for in-memory caching

### Frontend
* **Core:** HTML5, CSS3, JavaScript
* **Deployment:** Vercel

## 🔌 API Endpoints

The following are the main available endpoints:

| Method | Endpoint | Deskripsi |
| :--- | :--- | :--- |
| `POST` | `/feed/personalization` | Returns personalized news recommendations based on a list of article_ids (user reading history). |
| `GET`` | `/feed/home` | Default feed for new users (Cold Start). |
| `GET` | `/feed/latest` | Retrieves the latest news (based on timestamp). |
| `GET` | `/feed/category/{cat}` | Filters news by category. |
| `GET` | `/news/{article_id}` | Fetches the detailed content of a single news article. |






