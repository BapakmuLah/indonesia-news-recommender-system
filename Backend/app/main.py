from fastapi import FastAPI
from functools import lru_cache
from cachetools import TTLCache, cached

import faiss
import numpy as np
import pandas as pd

import llm
import schemas
import recommender

# DEFINE FASTAPI
app = FastAPI(title = 'news recommender')

# LOAD DATA
df = pd.read_csv(r'../news-dataset/labeled_data.csv')

# LOAD FAISS 
faiss_index = faiss.read_index(r"../news_embeddings.faiss")


# PREPROCESSING : CHANGE TO DATETIME
df['date'] = pd.to_datetime(df['date'], errors='coerce')
df['created_at'] = pd.to_datetime(df['created_at'], errors='coerce')
df['updated_at'] = pd.to_datetime(df['updated_at'], errors='coerce')


# DEFINE CACHE MEMORY
cache_limit = TTLCache(maxsize = 500, ttl = 300)


# RECOMMENDATION PIPELINE
@cached(cache = cache_limit)  #@lru_cache(maxsize = 500)    # --> CACHE RECOMMENDATION
def recommender_pipeline(article_ids, top_k):
    return recommender.news_recommender(article_ids = article_ids, 
                                        df = df, 
                                        faiss_index = faiss_index,
                                        top_k = top_k)

# LLM GENERATOR 
#@lru_cache(maxsize = 500)  # --> CACHE LLM 
def llm_pipeline(article_ids, relevant_article):

    return llm.generate_explanation(article_ids = article_ids, relevant_articles = relevant_article, df = df)

    # IF USE CACHE
    #return llm.generate_explanation(article_ids = article_ids, 
    #                                relevant_articles = {"id" : id, "source" : source, "title" : title, "summary" : summary},
    #                               df = df)



@app.post(path = '/recommendation', response_model = schemas.RecommendationResponse, response_model_exclude_none = True)
def get_recommendation(request : schemas.RecommendationRequest):

    # CONVERT TO TUPLE
    article_ids = tuple(sorted(request.article_ids))

    # FIND MOST RELEVANT DOCUMENT (RECOMMENDATION)
    results = recommender_pipeline(article_ids, request.top_k)

    # RETURN DATETIME TO STR
    results["date"] = results["date"].astype(str)

    return schemas.RecommendationResponse(top_k = len(results), 
                                          results = results.to_dict(orient = "records"))



@app.post(path = '/recommendation/reason', response_model = schemas.RecommendationResponse, response_model_exclude_none = True)
def get_reason(request : schemas.RecommendationRequest):

    # CONVERT TO TUPLE
    article_ids = tuple(sorted(request.article_ids))

    # RECOMMENDATION
    recommendation = recommender_pipeline(article_ids, request.top_k)

    # RETURN DATETIME TO STR
    recommendation['date'] = recommendation['date'].astype(str)

    # LLM
    results = []
    for _, row in recommendation.iterrows():

        # GENERATE EXPLAINATION BY LLM
        #llm_explanation = llm_pipeline(article_ids, row['id'], row['source'], row['title'], row['summary'])  #  --> KHUSUS JIKA PAKAI CACHE

        results.append(schemas.RecommendationItem(id = row["id"],
                                                  title = row["title"],
                                                  source = row['source'],
                                                  date   = row['date'],
                                                  final_score = row['final_score'],
                                                  topic_id = row['topic_id'],
                                                  category = row['category'],
                                                  confidence = row['confidence'],
                                                  reason = llm_pipeline(article_ids, row)))

    return schemas.RecommendationResponse(top_k = request.top_k, results = results)
        


