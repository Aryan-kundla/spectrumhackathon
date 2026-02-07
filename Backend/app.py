from fastapi import FastAPI, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from PIL import Image
import torch
import open_clip
import io
import pandas as pd
import openai

# ===============================
# CONFIG
# ===============================

openai.api_key = "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"
app = FastAPI()

# ✅ CORS
from fastapi.middleware.cors import CORSMiddleware

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # or ["http://localhost:5500"] for safer
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ===============================
# LOAD DATA FOR FOOD ANALYZER
# ===============================

nutrition_df = pd.read_csv("nutrition.csv")
FOOD_CLASSES = nutrition_df["food"].tolist()

FOOD_PROMPTS = {
    "pizza": "a photo of a cheese pizza slice",
    "burger": "a photo of a burger with bun and patty",
    "salad": "a photo of vegetable salad in a bowl",
    "pasta": "a photo of pasta with sauce",
    "rice": "a photo of plain cooked rice",
    "fried_rice": "a photo of fried rice with vegetables",
    "biryani": "a photo of Indian biryani rice dish",
    "dosa": "a photo of South Indian dosa on a plate",
    "idli": "a photo of idli with chutney",
    "chapati": "a photo of Indian chapati or roti",
    "naan": "a photo of naan bread",
    "paneer": "a photo of paneer curry",
    "dal": "a photo of Indian dal lentil curry",
    "samosa": "a photo of samosa snack",
    "poha": "a photo of poha breakfast dish",
    "upma": "a photo of upma breakfast dish",
    "omelette": "a photo of egg omelette",
    "boiled_eggs": "a photo of boiled eggs",
    "grilled_chicken": "a photo of grilled chicken",
    "chicken_curry": "a photo of chicken curry"
}

# ===============================
# LOAD OPEN-CLIP MODEL
# ===============================

device = "cpu"

model, _, preprocess = open_clip.create_model_and_transforms(
    model_name="ViT-B-32",
    pretrained="openai"
)
model.eval().to(device)
tokenizer = open_clip.get_tokenizer("ViT-B-32")

# ===============================
# HEALTH SCORE FUNCTION
# ===============================

def calculate_health_score(calories, protein, fat, carbs):
    score = 100
    if calories > 500:
        score -= 20
    if protein < 10:
        score -= 15
    if fat > 20:
        score -= 15
    if carbs > 50:
        score -= 10
    return max(score, 0)

# ===============================
# API MODELS
# ===============================

class NutritionRequest(BaseModel):
    food: str
    calories: int
    protein: int
    fat: int
    carbs: int

class ChatRequest(BaseModel):
    message: str

# ===============================
# FOOD ANALYZER ENDPOINT
# ===============================

@app.post("/analyze-food/")
async def analyze_food(file: UploadFile = File(...)):
    image_bytes = await file.read()
    image = Image.open(io.BytesIO(image_bytes)).convert("RGB")
    image_input = preprocess(image).unsqueeze(0).to(device)

    text_inputs = tokenizer(
        [FOOD_PROMPTS.get(food, f"a photo of {food}") for food in FOOD_CLASSES]
    ).to(device)

    with torch.no_grad():
        image_features = model.encode_image(image_input)
        text_features = model.encode_text(text_inputs)

        image_features /= image_features.norm(dim=-1, keepdim=True)
        text_features /= text_features.norm(dim=-1, keepdim=True)

        similarity = (image_features @ text_features.T).softmax(dim=-1)

    best_idx = similarity.argmax().item()
    confidence = similarity[0][best_idx].item()

    detected_food = FOOD_CLASSES[best_idx]
    row = nutrition_df[nutrition_df["food"] == detected_food].iloc[0]

    # Confidence Label
    if confidence > 0.8:
        confidence_label = "High"
    elif confidence > 0.5:
        confidence_label = "Medium"
    else:
        confidence_label = "Low"

    # Health Score
    health_score = calculate_health_score(
        row["calories"], row["protein"], row["fat"], row["carbs"]
    )

    # Health Warning
    warning = "Healthy Choice 👍"
    if row["fat"] > 20:
        warning = "⚠️ High Fat Food"
    elif row["calories"] > 400:
        warning = "⚠️ High Calorie Meal"
    elif row["protein"] < 5:
        warning = "⚠️ Low Protein Food"

    return {
        "food": detected_food,
        "calories": int(row["calories"]),
        "protein": int(row["protein"]),
        "fat": int(row["fat"]),
        "carbs": int(row["carbs"]),
        "confidence": round(confidence, 3),
        "confidence_level": confidence_label,
        "health_score": health_score,
        "warning": warning
    }

# ===============================
# NUTRITION COACH ENDPOINT
# ===============================

@app.post("/nutrition-coach/")
async def nutrition_coach(data: NutritionRequest):
    advice = f"""
    🍽 Food: {data.food}

    Calories: {data.calories} kcal
    Protein: {data.protein}g
    Fat: {data.fat}g
    Carbs: {data.carbs}g

    Advice:
    Maintain balanced meals.
    Increase protein if muscle building.
    Reduce fat if weight loss goal.
    """
    return {"advice": advice.strip()}

# ===============================
# GPT CHAT ENDPOINT
# ===============================

@app.post("/ask/")
def ask_gpt(data: ChatRequest):
    try:
        response = openai.ChatCompletion.create(
            model="gpt-4o-mini",
            messages=[
                {"role": "system", "content": "You are a smart nutrition and fitness AI assistant."},
                {"role": "user", "content": data.message}
            ],
            max_tokens=300,
            temperature=0.7
        )
        return {"reply": response.choices[0].message.content}
    except Exception as e:
        return {"error": str(e)}
