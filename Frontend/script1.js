let totalCalories = 0;
const BACKEND_URL = "http://127.0.0.1:8000";

// ========================
// DOM ELEMENTS
// ========================
const imageInput = document.getElementById("foodImage");
const preview = document.getElementById("preview");
const scanContainer = document.querySelector(".scan-container");
const scanLine = document.querySelector(".scan-line");
const analyzeBtn = document.getElementById("analyzeBtn");
const result = document.getElementById("result");
const daily = document.getElementById("dailyCalories");
const card = document.querySelector(".card");

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

    try {
      // STEP 1: CALL REAL BACKEND
      const data = await analyzeFood(file);
      totalCalories += data.calories;

      // STEP 2: CALL REAL LLM NUTRITION COACH
      const coachData = await nutritionCoach(data);

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

      // SAVE MEAL + UPDATE GRAPH
      saveMeal(data);
      updateWeeklyChart();

    } catch (error) {
      console.error(error);
      if (result) result.innerText = "❌ Backend not reachable.";
    }

    if (card) card.classList.remove("pulse");
    if (scanLine) scanLine.style.display = "none";
  });
}

// ========================
// SAVE MEAL DATA
// ========================
function saveMeal(data) {
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

  const history = JSON.parse(localStorage.getItem("foodHistory")) || [];
  history.push({
    food: data.food,
    calories: data.calories,
    carbs: data.carbs,
    protein: data.protein,
    fat: data.fat,
    timestamp: new Date().toISOString(),
    date: new Date().toISOString().split("T")[0]
  });
  localStorage.setItem("foodHistory", JSON.stringify(history));
}

// ========================
// UPDATE WEEKLY CHART
// ========================
function updateWeeklyChart() {
  const history = JSON.parse(localStorage.getItem("foodHistory")) || [];
  const weeklyData = Array(7).fill(0); // Sunday = 0

  history.forEach(item => {
    const day = new Date(item.date).getDay();
    weeklyData[day] += item.calories;
  });

  const ctx = document.getElementById('weeklyChart').getContext('2d');
  if (window.weeklyChart) {
    window.weeklyChart.data.datasets[0].data = weeklyData;
    window.weeklyChart.update();
  } else {
    window.weeklyChart = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'],
        datasets: [{
          label: 'Calories',
          data: weeklyData,
          backgroundColor: 'rgba(54, 162, 235, 0.6)'
        }]
      },
      options: {
        scales: { y: { beginAtZero: true } }
      }
    });
  }
}

// ========================
// DASHBOARD NAVIGATION
// ========================
function goDashboard() {
  window.location.href = "dashboard.html";
}

// ========================
// INITIALIZE CHART ON PAGE LOAD
// ========================
window.addEventListener('DOMContentLoaded', updateWeeklyChart);
