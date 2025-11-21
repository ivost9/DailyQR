require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const bodyParser = require("body-parser");

const app = express();
app.use(cors());
app.use(bodyParser.json());

// Връзка с MongoDB Atlas (ще я зададем в настройките на Render)
const MONGO_URI = process.env.MONGO_URI;

if (!MONGO_URI) {
  console.error("ГРЕШКА: Няма връзка с базата данни!");
} else {
  mongoose
    .connect(MONGO_URI)
    .then(() => console.log("✅ MongoDB Connected to Cloud"))
    .catch((err) => console.error(err));
}

// Схема на базата
const VisitSchema = new mongoose.Schema({
  deviceId: String,
  date: String, // Пазим датата като стринг "Fri Nov 21 2025"
  fortune: String, // Пазим какво му се е паднало
});
const Visit = mongoose.model("Visit", VisitSchema);

const FORTUNES = [
  "Усмихни се, днес ще ти се случи чудо!",
  "Всяко начало е трудно, но успехът е сладък.",
  "Любовта е точно зад ъгъла.",
  "Днес е перфектният ден да започнеш нещо ново.",
  "Късметът е на страната на смелите!",
  "Не гледай назад, най-хубавото предстои.",
];

app.get("/", (req, res) => {
  res.send("Server is running!"); // За проверка дали работи
});

app.post("/api/get-fortune", async (req, res) => {
  const { deviceId } = req.body;
  if (!deviceId) return res.status(400).json({ error: "Липсва ID" });

  const todayStr = new Date().toDateString();

  try {
    // 1. Търсим дали има запис за този телефон
    let userVisit = await Visit.findOne({ deviceId });

    // 2. Ако има и е от днес -> връщаме стария късмет
    if (userVisit && userVisit.date === todayStr) {
      console.log("♻️ Повторно влизане");
      return res.json({
        allowed: true,
        message: userVisit.fortune,
        isRevisit: true,
      });
    }

    // 3. Ако е нов ден или нов потребител -> генерираме нов
    const randomFortune = FORTUNES[Math.floor(Math.random() * FORTUNES.length)];

    if (userVisit) {
      // Обновяваме стария запис с нова дата и късмет
      userVisit.date = todayStr;
      userVisit.fortune = randomFortune;
      await userVisit.save();
    } else {
      // Създаваме чисто нов запис
      await Visit.create({ deviceId, date: todayStr, fortune: randomFortune });
    }

    console.log("✨ Нов късмет записан в базата");
    return res.json({
      allowed: true,
      message: randomFortune,
      isRevisit: false,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server Error" });
  }
});

// Render автоматично дава порт в process.env.PORT
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
