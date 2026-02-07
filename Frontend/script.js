let totalCalories = 0;
const BACKEND_URL = "http://127.0.0.1:8000";

// DOM ELEMENTS
const imageInput = document.getElementById("foodImage");
const preview = document.getElementById("preview");
const scanContainer = document.querySelector(".scan-container");
const scanLine = document.querySelector(".scan-line");
const analyzeBtn = document.getElementById("analyzeBtn");
const result = document.getElementById("result");
const daily = document.getElementById("dailyCalories");
const card = document.querySelector(".card");
const chatInput = document.getElementById("chatMessage");
const sendBtn = document.getElementById("sendBtn");
const chatArea = document.getElementById("chatArea");

// ========================
// IMAGE PREVIEW
// ========================
if (imageInput) {
  imageInput.addEventListener("change", function () {
    const file = imageInput.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = function () {
      if (preview) preview.src = reader.result;
      if (scanContainer) scanContainer.style.display = "block";
    };
    reader.readAsDataURL(file);
  });
}

// ========================
// ANALYZE FOOD + LLM COACH
// ========================
if (analyzeBtn) {
  analyzeBtn.addEventListener("click", async function () {
    if (!imageInput || !imageInput.files[0]) {
      if (result) result.innerText = "❌ Upload food image first.";
      return;
    }

    if (card) card.classList.add("pulse");
    if (scanLine) scanLine.style.display = "block";
    if (result) result.innerText = "🤖 AI analyzing food...";

    const file = imageInput.files[0];
    const formData = new FormData();
    formData.append("file", file);

    try {
      // STEP 1: FOOD ANALYSIS
      const response = await fetch(`${BACKEND_URL}/analyze-food/`, {
        method: "POST",
        body: formData
      });
      const data = await response.json();
      totalCalories += data.calories;

      // STEP 2: LLM NUTRITION COACH
      const coachResponse = await fetch(`${BACKEND_URL}/nutrition-coach/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          food: data.food,
          calories: data.calories,
          protein: data.protein,
          fat: data.fat,
          carbs: data.carbs
        })
      });
      const coachData = await coachResponse.json();

      // STEP 3: DISPLAY RESULT
      if (result) {
        result.innerHTML = `
          🍕 Food: <b>${data.food}</b><br>
          🔥 Calories: <b>${data.calories}</b><br>
          🥗 Carbs: <b>${data.carbs}g</b><br>
          🍗 Protein: <b>${data.protein}g</b><br>
          🧈 Fat: <b>${data.fat}g</b><br><br>
          🤖 Coach Advice:<br>
          <i>${coachData.advice}</i>
        `;
      }

      // Update daily calories
      if (daily) daily.innerText = `Calories Today: ${totalCalories} kcal`;

      // SAVE MEAL TO LOCAL STORAGE
      saveMeal(data);

    } catch (error) {
      console.error(error);
      if (result) result.innerText = "❌ Backend not reachable.";
    }

    if (card) card.classList.remove("pulse");
    if (scanLine) scanLine.style.display = "none";
  });
}
sendBtn.addEventListener("click", sendChatMessage);
chatInput.addEventListener("keypress", (e) => {
  if (e.key === "Enter") sendChatMessage();
});
async function sendChatMessage() {
  const message = chatInput.value.trim();
  if (!message) return;

  addChatMessage("You", message);
  chatInput.value = "";

  // Typing indicator
  const typingId = "typingMsg";
  chatArea.innerHTML += `<p id="${typingId}">AI is typing...</p>`;

  try {
    const res = await fetch(`${BACKEND_URL}/ask/`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message })
    });
    const data = await res.json();

    // Remove typing
    const typingEl = document.getElementById(typingId);
    if (typingEl) typingEl.remove();

    addChatMessage("AI", data.reply || data.error);

  } catch (err) {
    console.error("GPT error:", err);
    const typingEl = document.getElementById(typingId);
    if (typingEl) typingEl.remove();
    addChatMessage("AI", "Error getting response.");
  }
}
// ========================
// SAVE MEAL DATA
// ========================
function saveMeal(data) {
  // For meals array
  const meals = JSON.parse(localStorage.getItem("meals")) || [];
  meals.push({
    name: data.food,
    calories: data.calories,
    carbs: data.carbs,
    protein: data.protein,
    fat: data.fat,
    date: new Date().toISOString().split("T")[0]
  });
  localStorage.setItem("meals", JSON.stringify(meals));

  // For foodHistory array
  const history = JSON.parse(localStorage.getItem("foodHistory")) || [];
  history.push({
    food: data.food,
    calories: data.calories,
    carbs: data.carbs,
    protein: data.protein,
    fat: data.fat,
    timestamp: new Date().toISOString()
  });
  localStorage.setItem("foodHistory", JSON.stringify(history));
}

// ========================
// DASHBOARD NAVIGATION
// ========================
function goDashboard() {
  window.location.href = "dashboard.html";
}

// ========================
// SAVE MEAL DATA
// ========================
function saveMeal(food, calories, carbs, protein, fat) {

  const meals = JSON.parse(localStorage.getItem("meals")) || [];

  meals.push({
    name: food,
    calories: calories,
    carbs: carbs,
    protein: protein,
    fat: fat,
    date: new Date().toISOString().split("T")[0]
  });

  localStorage.setItem("meals", JSON.stringify(meals));
}
function addChatMessage(sender, message) {
  chatArea.innerHTML += `<p><b>${sender}:</b> ${message}</p>`;
  chatArea.scrollTop = chatArea.scrollHeight; // scroll to bottom
}
function sendLastFoodToGPT(lastFood) {
  chatInput.value = `Tell me more about ${lastFood.food} with ${lastFood.calories} calories, ${lastFood.protein}g protein, ${lastFood.fat}g fat, ${lastFood.carbs}g carbs.`;
  sendChatMessage();
}