const meals = JSON.parse(localStorage.getItem("meals")) || [];

if (meals.length === 0) {
  alert("No meal data found. Scan food first.");
}

// =========================
// DATE UTIL
// =========================
function getLast7Days() {
  const days = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    days.push(d.toISOString().split("T")[0]);
  }
  return days;
}

// =========================
// BASIC COUNTS
// =========================
document.getElementById("mealCount").innerText = meals.length;

// =========================
// WEEKLY CALORIES
// =========================
const last7 = getLast7Days();

const caloriesPerDay = last7.map(day =>
  meals
    .filter(m => m.date === day)
    .reduce((sum, m) => sum + m.calories, 0)
);

const weeklyTotal = caloriesPerDay.reduce((a, b) => a + b, 0);

document.getElementById("weeklyCalories").innerText =
  weeklyTotal + " kcal";

// =========================
// MOST EATEN FOOD
// =========================
const foodCount = {};

meals.forEach(m => {
  foodCount[m.name] = (foodCount[m.name] || 0) + 1;
});

const mostFood =
  Object.keys(foodCount).length > 0
    ? Object.keys(foodCount).reduce((a, b) =>
        foodCount[a] > foodCount[b] ? a : b
      )
    : "—";

document.getElementById("mostFood").innerText = mostFood;

// =========================
// AI CALORIE PREDICTION
// =========================
const avgCalories =
  weeklyTotal / 7 || 0;

document.getElementById("prediction").innerText =
  Math.round(avgCalories) + " kcal";

// =========================
// STREAK COUNTER
// =========================
const uniqueDays = [...new Set(meals.map(m => m.date))].sort();
let streak = 0;

for (let i = uniqueDays.length - 1; i >= 0; i--) {
  const today = new Date();
  today.setDate(today.getDate() - streak);
  const check = today.toISOString().split("T")[0];

  if (uniqueDays.includes(check)) {
    streak++;
  } else {
    break;
  }
}

document.getElementById("streak").innerText =
  streak + " days";

// =========================
// MACRO ANALYSIS
// =========================
let carbs = 0,
  protein = 0,
  fat = 0;

meals.forEach(m => {
  carbs += m.carbs;
  protein += m.protein;
  fat += m.fat;
});

// =========================
// MACRO DOUGHNUT CHART
// =========================
new Chart(document.getElementById("macroChart"), {
  type: "doughnut",
  data: {
    labels: ["Carbs", "Protein", "Fat"],
    datasets: [
      {
        data: [carbs, protein, fat],
        backgroundColor: ["#7fd1b9", "#2f5d50", "#c1e3da"],
        borderWidth: 0
      }
    ]
  },
  options: {
    cutout: "70%",
    plugins: {
      legend: {
        position: "bottom"
      }
    }
  }
});

// =========================
// HEALTH SCORE CALCULATION
// =========================
const totalMacros = carbs + protein + fat || 1;

const score =
  (protein / totalMacros) * 40 +
  (carbs / totalMacros) * 30 +
  (fat / totalMacros) * 30;

const roundedScore = Math.round(score);

document.getElementById("nutritionScore").innerText =
  roundedScore + " / 100";

// =========================
// HEALTH RING CHART
// =========================
new Chart(document.getElementById("healthRing"), {
  type: "doughnut",
  data: {
    datasets: [
      {
        data: [roundedScore, 100 - roundedScore],
        backgroundColor: ["#2f5d50", "#e5f2ee"],
        borderWidth: 0
      }
    ]
  },
  options: {
    cutout: "80%",
    plugins: {
      legend: { display: false }
    }
  }
});

// =========================
// HEALTH METER (REPLACES CALORIE GRAPH)
// =========================
const healthFill = document.getElementById("healthFill");
const healthLabel = document.getElementById("healthLabel");

healthFill.style.width = roundedScore + "%";

if (roundedScore >= 75) {
  healthLabel.innerText = "Excellent balance 🔥 Keepely up!";
  healthFill.style.background =
    "linear-gradient(90deg, #7fd1b9, #2f5d50)";
} else if (roundedScore >= 50) {
  healthLabel.innerText = "Decent, but can improve 👍";
  healthFill.style.background =
    "linear-gradient(90deg, #ffd166, #f4a261)";
} else {
  healthLabel.innerText =
    "Needs improvement ⚠️ Try more protein & veggies";
  healthFill.style.background =
    "linear-gradient(90deg, #ff7a7a, #ff4d4d)";
}