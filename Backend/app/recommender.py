import faiss
import numpy as np
import pandas as pd
from datetime import datetime, timezone
from sklearn.metrics.pairwise import cosine_similarity


# RECOMMEND RELEVANT ARTICLES BASED ON USER HISTORY READ
def session_embedding(article_ids : list, df : pd.DataFrame, faiss_index = None, decay_lambda : float = 0.0001, min_weights : float = 0.01):

    # GET THE CURRENT TIME
    now = datetime.now(timezone.utc)
    vectors = []

    # FOR EACH ARTICLES THAT USER READ
    for article_id in article_ids:

        # GET AN ARTICLE THAT USER READ
        article_idx = df.index[df["id"] == article_id].tolist()[0]

        article_date = df.loc[article_idx, "date"]

        # DETERMINE HOW RELEVANT THE ARTICLES NOW 
        delta_days = (now - article_date).days  # CALCULATING THE DIFFERENCE BETWEEN THE CURRENT TIME AND THE TIME THE NEWS WAS PUBLISHED
        weights = np.exp(-decay_lambda * delta_days)     # GIVE LESS WEIGHT TO OLD ARTICLES , AND MORE WEIGHT TO NEW ARTICLES
        weights = max(weights, min_weights)

        # 4. GET EMBEDDING FROM FAISS
        emb = faiss_index.reconstruct(article_idx)

        # COMBINING MANY ARTICLES THAT HAVE BEEN READ INTO 1 NEW EMBEDDING VECTOR
        vectors.append(weights * emb)   # CALCULATE ARTICLE RELEVANCE (BASED ON WEIGHT)
    
    # SUM ALL READ ARTICLES
    new_vectors = np.sum(vectors, axis=0).astype(np.float32).reshape(1, -1)

    # NORMALIZE
    faiss.normalize_L2(new_vectors)

    return new_vectors


# GET TOP-K RELEVANT ARTICLES BASED ON USER HISTORY
def get_relevant_articles(article_ids, df, faiss_index, top_k = 10):

    # AGGREGATE NEW EMBEDDING BASED USER HISTORY
    user_vectors = session_embedding(article_ids, df, faiss_index)

    # SEARCH ALL SIMILAR EMBEDDINGS ON FAISS INDEX
    scores, index = faiss_index.search(user_vectors, top_k + len(article_ids))

    # ADD SIMILARITY FEATURES INTO DATAFRAME
    results = df.iloc[index[0]].copy()
    results["similarity"] = scores[0]

    # REMOVE READ ARTICLES FROM RECOMMENDATION
    results = results[~results["id"].isin(article_ids)]
    top_relevance = results.head(top_k)
    
    return top_relevance

# FUNCTION TO CONTROL THE LATEST RELEVANT NEWS
def freshness_recommendation(df, similarity_weight = 0.5, freshness_weight = 0.5, decay_lambda = 0.001):

    # GET CURRENT DATE
    now = datetime.now(timezone.utc)
    df = df.copy()

    # CALCULATING THE DIFFERENCE BETWEEN THE CURRENT TIME AND THE TIME THE NEWS WAS PUBLISHED  (current date - news published date)
    df['freshness'] = df['date'].apply(lambda d: np.exp(-decay_lambda * (now - d).days))

    # AGGREGATE SIMILARITY WITH FRESHNESS SCORE (SO THAT THE LATEST NEWS IS MORE RELEVANT)
    df['final_score'] = similarity_weight * df['similarity'] + freshness_weight * df['freshness']

    # SORT BY DESCENDING
    df_fresh = df.sort_values(by = 'final_score', ascending = False)

    return df_fresh


# FUNGSI UNTUK MEMBATASI SUMBER ARTIKEL YG SERING MUNCUL
# Limiting frequently appearing news sources (to ensure more diverse news sources)
def source_diversity(df, max_source = 2, top_k = 10):

    selected = []
    source_count = {}

    # FOR EACH SAMPLE
    for _, row in df.iterrows():
        src = row['source']

        
        # IF THE NEWS SOURCE HAS NOT EXCEEDED max_source
        if source_count.get(src, 0) < max_source:
            selected.append(row)
            source_count[src] = source_count.get(src, 0) + 1

        # IF SOURCE HAS EXCEEDED max_source
        if len(selected) >= top_k:
            break

    return pd.DataFrame(selected)


def stochastic_rerank(df: pd.DataFrame, top_k: int = 10, temperature: float = 0.2, seed: int | None = None):

    rng = np.random.default_rng(seed)

    scores = df["final_score"].values.astype(np.float64)

    # softmax with temperature
    scores = scores / temperature
    exp_scores = np.exp(scores - scores.max())
    probs = exp_scores / exp_scores.sum()

    selected_idx = rng.choice(len(df), 
                              size=min(top_k, len(df)),
                              replace=False,
                              p=probs)
    
    return df.iloc[selected_idx].sort_values("final_score", ascending=False).reset_index(drop=True)
    

def mmr_rerank(df: pd.DataFrame, faiss_index, lambda_div: float = 0.3, top_k: int = 10):

    selected_rows = []
    selected_embs = []

    for idx, row in df.iterrows():
        emb = faiss_index.reconstruct(idx)

        if not selected_embs:
            selected_rows.append(row)
            selected_embs.append(emb)
        else:
            sims = cosine_similarity(
                [emb],
                np.array(selected_embs)
            )[0]

            penalty = sims.max()
            mmr_score = row["final_score"] - lambda_div * penalty

            if mmr_score > 0:
                selected_rows.append(row)
                selected_embs.append(emb)

        if len(selected_rows) >= top_k:
            break

    return pd.DataFrame(selected_rows).reset_index(drop=True)
    
# FINAL PIPELINE (RE-RANKER)
def news_recommender(article_ids, df, faiss_index, top_k = 10, **params):

    # UNPACK PARAMS
    temperature = params.pop("temperature", 0.1)
    lambda_div  = params.pop("lambda_div", 0.1)
    max_source  = params.pop("max_source", 5)


    # GET RELEVANT NEWS
    top_relevant = get_relevant_articles(article_ids, df, faiss_index, top_k = 100)

    # GET LATEST RELEVANT NEWS (TRADE OFF SIMILARITY VS FRESHNESS)
    reranked = freshness_recommendation(top_relevant, similarity_weight = 0.8, freshness_weight = 0.2)

    # LIMIT SOURCE OF NEWS THAT APPEAR FREQUENTLY
    diversified = source_diversity(reranked, max_source = max_source, top_k = top_k)

    # MMR DIVERSITY
    diversified = mmr_rerank(diversified, faiss_index, lambda_div = lambda_div, top_k=50)

    # 5. session-level randomness (ANTI CACHE MONOTON)
    session_seed = abs(hash(tuple(article_ids)) + int(datetime.now().timestamp() // 60))

    # 6. STOCHASTIC SAMPLING
    final_rank = stochastic_rerank(diversified, top_k = top_k, temperature = temperature, seed = session_seed)


    return final_rank[["id", "title", "source", "image", "url", "date", "final_score", "topic_id", "category", "confidence", 'summary']]



# ================================ ANOTHER RECOMMENDATION ======================================

# START COLD RECOMMENDATION FRIENDLY
def home_feed_news(df, user_id : str, top_k = 10):

    # GET CURRENT TIME
    now = datetime.now(timezone.utc)
    df = df.copy()

    seed = abs(hash(user_id)) % (2**32)
    rng = np.random.default_rng(seed)

    w_freshness = rng.random()
    w_confidence = 1.0 - w_freshness

    df["days_diff"] = df["date"].apply(lambda d: max((now - d).days, 0))
    df["freshness"] = 1.0 / np.log1p(df["days_diff"] + 1)

    # AGGREGATE 
    noise = rng.normal(0, 0.05, size=len(df))
    df["score"] = ((df["freshness"] * w_freshness) * (df["confidence"] * w_confidence)) * (1 + noise)


    return df.sort_values("score", ascending=False).head(top_k)

# LATEST NEWS RECOMMENDATION
def latest_news(df, top_k = None):

    if top_k is None:
        new_news = df.sort_values(by = 'date', ascending = False)   # --> MUNCULKAN SEMUA BERITA JIKA TOP-K NONE
    else:    
        new_news = df.sort_values(by = 'date', ascending = False).head(top_k)  # AMBIL TOP-K BERITA TERBARU

    return new_news


# TRENDING RECOMMENDATION
#def trending_feed(df, top_k = 10):
#    now = datetime.now(timezone.utc)
#    df = df.copy()

#    df["freshness"] = df["date"].apply(lambda d: np.exp(-0.002 * (now - d).days))
#    df["score"] = 0.7 * df["confidence"] + 0.3 * df["freshness"]

#    return df.sort_values("score", ascending=False).head(top_k)



# RECOMMENDATION BASED ON CATEGORY
def category_feed(df, category, top_k=10):
    filtered = df[df["category"].str.lower() == category.lower()]
    return home_feed_news(filtered, top_k)


# RECOMMENDATION BASED ON SOURCE
def source_feed(df, source, user_id,  top_k = 10):

    filtered = df[df['source'].str.lower() == source.lower()]

    return home_feed_news(filtered, user_id, top_k = top_k)