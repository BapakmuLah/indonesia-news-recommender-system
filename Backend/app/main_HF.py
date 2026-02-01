import faiss
import numpy as np
import pandas as pd

from fastapi import FastAPI
from datasets import load_dataset
from huggingface_hub import hf_hub_download

from cachetools import TTLCache, cached
from fastapi.middleware.cors import CORSMiddleware

from . import schemas
from . import recommender


# DEFINE FASTAPI LAUNCHER
app = FastAPI(title="Indonesian News Recommender API", docs_url = "/run/api/docs", redoc_url = "/run/api/redoc", openapi_url = "/run/api/openapi.json")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  
    allow_credentials=True,
    allow_methods=["*"], 
    allow_headers=["*"],
)


# LOAD DATASET
dataset = load_dataset(path="SandKing/News-Recommendation",
                       data_files="labeled_news.csv",
                       split="train",
                       streaming=False)

# CONVERT TO PANDAS
df = dataset.to_pandas()

# LOAD FAISS 
FAISS_path = hf_hub_download(repo_id = "SandKing/News-Recommendation", 
                             filename = 'news_embeddings.faiss', 
                             repo_type = "dataset")
faiss_index = faiss.read_index(FAISS_path)

# PREPROCESS
# CONVERT OBJECT TO DATETIME DATA TYPE
for col in ["date", "created_at", "updated_at"]:
    df[col] = pd.to_datetime(df[col], errors="coerce")


# CACHE (REMOVE CACHE AFTER 5 MIN)
cache_limit = TTLCache(maxsize = 500, ttl = 300)

# RECOMMENDATION PIPELINE
@cached(cache = cache_limit)
def recommender_pipeline(article_ids, top_k):
    return recommender.news_recommender(article_ids = article_ids, 
                                        df = df, 
                                        faiss_index = faiss_index, 
                                        top_k = top_k,
                                        temperature = 0.2,
                                        lambda_div = 0.3,
                                        max_source = 5)


@app.get("/")
def health_check():
    return {"status": "ok", "message": "news recommender api is running"}


# RECOMMENDATION
@app.post("/feed/personalization", response_model = schemas.RecommendationResponse, response_model_exclude_none=True)
def get_recommendation(request: schemas.RecommendationRequest):

    article_ids = tuple(sorted(request.article_ids))
    results = recommender_pipeline(article_ids, request.top_k)
    results["date"] = results["date"].astype(str)

    return schemas.RecommendationResponse(top_k = len(results), results = results.to_dict(orient="records"))


# COLD START RECOMMENDATION
@app.get("/feed/home", response_model = schemas.RecommendationResponse)
def cold_recommendation(user_id, top_k: int = 10):

    results = recommender.home_feed_news(df, user_id, top_k)
    results["date"] = results["date"].astype(str)

    return schemas.RecommendationResponse(top_k = len(results), 
                                          results = results.to_dict(orient="records"))

# LATEST NEWS RECOMMENDATION
@app.get("/feed/latest", response_model= schemas.RecommendationResponse)
def latest_news_recommendation(top_k : int = 20):

    # GET TOP-K LATEST NEWS
    results = recommender.latest_news(df, top_k)
    results['date'] = results['date'].astype(str)

    return schemas.RecommendationResponse(top_k = len(results),
                                          results = results.to_dict(orient = "records"))


# CATEGORY RECOMMENDATION
@app.get("/feed/category/{category}", response_model = schemas.RecommendationResponse)
def category_feed_recommendation(category: str, top_k: int = 10):

    results = recommender.category_feed(df, category, top_k)
    results["date"] = results["date"].astype(str)

    return schemas.RecommendationResponse(top_k = len(results), 
                                          results = results.to_dict(orient="records"))


# SOURCE RECOMMENDATION
@app.get("/feed/source/{source}", response_model = schemas.RecommendationResponse)
def source_feed_recommendation(source : str, user_id : str, top_k: int = 10):

    results = recommender.source_feed(df, source, user_id, top_k)
    results["date"] = results["date"].astype(str)

    return schemas.RecommendationResponse(top_k = len(results), 
                                          results = results.to_dict(orient="records"))



@app.get("/feed/random")
def random_news(cursor: int = 0):
    random_df = df.sample(frac=1).reset_index(drop=True)
    TOTAL_RANDOM = len(random_df)

    # guard
    if cursor < 0 or cursor >= TOTAL_RANDOM:
        return {
            "cursor": 0,
            "is_end": True,
            "result": None
        }

    row = random_df.iloc[cursor].copy()
    row["date"] = str(row["date"]) if pd.notnull(row["date"]) else None

    result = {
        "id": int(row["id"]),
        "title": row["title"],
        "source": row["source"],
        "image": row["image"],
        "url": row["url"],
        "date": row["date"],
        "category": row.get("category"),
        "confidence": row.get("confidence"),
        "summary": row.get("summary")
    }

    return {
        "cursor": cursor + 1,
        "is_end": cursor + 1 >= TOTAL_RANDOM,
        "result": result
    }


# GET SINGLE NEWS BY ID
@app.get("/news/{article_id}")
def get_news_detail(article_id: int):
    
    #  GET THE SELECTED ID
    row = df[df['id'] == article_id]
    
    if row.empty:
        return {"error": "News not found"}
    
    # GET UNIQUE ID
    item = row.iloc[0]
    
    # DATETIME FORMAT
    date_str = str(item['date']) if pd.notnull(item['date']) else None

    return {
        "id": int(item['id']),
        "title": item['title'],
        "source": item['source'],
        "image": item['image'],
        "content": item['content'], 
        "date": date_str,
        "category": item.get("category"),
        "author": "Redaksi", 
        "url": item['url'] 
    }

