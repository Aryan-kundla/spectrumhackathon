from fastapi import FastAPI, UploadFile, File
import pandas as pd
import random

app = FastAPI()

nutrition_df = pd.read_csv("nutrition.csv")

FOODS = nutrition_df["food"].tolist()

@app.post("/analyze-food/")
async def analyze_food(file: UploadFile = File(...)):
    # Fake but consistent "food detection"
    detected_food = random.choice(FOODS)

    row = nutrition_df[nutrition_df["food"] == detected_food].iloc[0]

    return {
        "food": detected_food,
        "calories": int(row["calories"]),
        "protein": int(row["protein"]),
        "fat": int(row["fat"]),
        "carbs": int(row["carbs"])
    }
