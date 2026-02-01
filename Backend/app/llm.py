import os
from dotenv import load_dotenv

import google
from google import genai

import schemas
import recommender


# ACCESS AND GET GEMINI API KEY
load_dotenv()

GOOGLE_API_KEY = os.getenv("GEMINI_API_KEY")
print(f"Connected to Gemini API: {GOOGLE_API_KEY[:5]}***")

# ACTIVATE GEMINI API
client = genai.Client(api_key = GOOGLE_API_KEY)


# BUILD USER CONTEXT (FOR PROMPT)
def build_user_context(article_ids, df, max_chars = 1500):

    # GET ALL ARTICLES THAT USER HAVE READ
    user_articles = df[df['id'].isin(article_ids)]

    # FOR EACH USER ARTICLES
    context = []
    for _, row in user_articles.iterrows():
        text = f"- {row['title']}: {row['summary']}"
        context.append(text)

    full_context = "\n".join(context)
    return full_context[:max_chars]


# BUILD CANDIDATE CONTEXT
def build_candidate_context(row, max_chars=800):
    text = f"""Judul: {row['title']}
               Sumber: {row['source']}"""
    
    return text.strip()[:max_chars]


def build_explanation_prompt(user_context, 
                             candidate_context):
    prompt = f"""Kamu adalah sistem rekomendasi berita.
                 Riwayat bacaan pengguna: 
                 {user_context}

                 Berita yang direkomendasikan:
                 {candidate_context}
                 
                 Tugasmu:
                 Buat SATU kalimat pendek (maksimal 12 kata) dengan format PERSIS berikut:
                 "Direkomendasikan karena membahas <topik utama>."

                 Aturan keras: - Jangan gunakan kata "relevan", "serupa", atau "pengguna".
                               - Jangan menjelaskan lebih dari satu alasan.
                               - Jangan lebih dari satu kalimat.
                               - Jangan menambahkan konteks lain.
                               - Fokus hanya pada topik inti berita. 
                               Jawaban HARUS satu kalimat pendek."""
    return prompt.strip()



# GENERATE LLM EXPLANATION FOR RELEVANT ARTICLES
def generate_explanation(article_ids, relevant_articles, df):

    # BUILD CONTEXT
    user_context = build_user_context(article_ids, df)
    candidate_context = build_candidate_context(relevant_articles)

    # BUILD PROMPT
    prompt = build_explanation_prompt(user_context, candidate_context)

    # LLM GENERATE
    answer = client.models.generate_content(model= "models/gemma-3-27b-it", contents = prompt)

    return answer.text
