import streamlit as st
import requests
from PIL import Image

API_URL = "http://127.0.0.1:8000/analyze-food/"

st.set_page_config(page_title="Food Calorie Analyzer", layout="centered")

st.title("🍽️ Food Recognition & Nutrition Analyzer")
st.caption("AI-powered food analysis (demo prototype)")

uploaded_file = st.file_uploader(
    "Upload a food image",
    type=["jpg", "jpeg", "png"]
)

if uploaded_file:
    image = Image.open(uploaded_file)
    st.image(image, caption="Uploaded Food Image", use_column_width=True)

    if st.button("Analyze Food"):
        with st.spinner("Analyzing..."):
            try:
                response = requests.post(
                    API_URL,
                    files={"file": uploaded_file.getvalue()}
                )

                if response.status_code != 200:
                    st.error("Backend error")
                else:
                    data = response.json()

                    st.success(f"Detected Food: {data['food'].title()}")

                    col1, col2, col3, col4 = st.columns(4)
                    col1.metric("Calories", f"{data['calories']} kcal")
                    col2.metric("Protein", f"{data['protein']} g")
                    col3.metric("Fat", f"{data['fat']} g")
                    col4.metric("Carbs", f"{data['carbs']} g")

                    st.caption("⚠️ Nutritional values are approximate per serving")

            except Exception as e:
                st.error(f"Connection failed: {e}")
