import pandas as pd
from pydantic import BaseModel, HttpUrl
from typing import List, Optional

class RecommendationRequest(BaseModel):
    article_ids: List[int]
    top_k: int = 10

class RecommendationItem(BaseModel):
    id: int
    title: str
    source: str
    image: Optional[HttpUrl]
    url : HttpUrl
    date: str | None
    final_score: Optional[float] = None
    topic_id: Optional[int] = None
    category: Optional[str] = None
    confidence: Optional[float] = None
    reason : Optional[str] = None
    summary: Optional[str] = None

class RecommendationResponse(BaseModel):

    top_k: int
    results: List[RecommendationItem]


class RandomNewsResponse(BaseModel):
    cursor: int
    is_end: bool
    result: RecommendationItem