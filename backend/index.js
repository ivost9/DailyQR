require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const bodyParser = require("body-parser");
const FORTUNES = require("./fortunes");
const app = express();

app.use(cors());
app.use(bodyParser.json());

const MONGO_URI = process.env.MONGO_URI;
const ADMIN_SECRET = process.env.ADMIN_SECRET;

if (!MONGO_URI) {
  console.error("❌ ГРЕШКА: Липсва MONGO_URI!");
} else {
  mongoose
    .connect(MONGO_URI)
    .then(() => console.log("✅ MongoDB Connected"))
    .catch((err) => console.error("❌ MongoDB Connection Error:", err));
}

const VisitSchema = new mongoose.Schema(
  {
    deviceId: String,
    date: String,
    fortune: String,
  },
  { timestamps: true }
);

const Visit = mongoose.model("Visit", VisitSchema);

app.get("/", (req, res) => {
  res.send("Server is running!");
});

// --- ADMIN: Връщаме всички записи ---
app.get("/api/admin-stats", async (req, res) => {
  const { secret } = req.query;

  if (secret !== ADMIN_SECRET) {
    return res.status(403).json({ error: "Достъп отказан!" });
  }

  try {
    // Връщаме всичко - тук ще има много записи за едни и същи хора (история)
    const visits = await Visit.find().sort({ _id: 1 });
    res.json({ count: visits.length, visits });
  } catch (err) {
    res.status(500).json({ error: "Error" });
  }
});

// --- USER: Логиката е променена ---
app.post("/api/get-fortune", async (req, res) => {
  const { deviceId } = req.body;
  if (!deviceId) return res.status(400).json({ error: "Липсва ID" });

  const todayStr = new Date().toDateString();

  try {
    // 1. Търсим дали има запис за ТОЗИ човек ДНЕС
    // (Преди търсехме само по deviceId, сега търсим и по дата)
    const visitToday = await Visit.findOne({ deviceId, date: todayStr });

    // Ако вече е влизал днес - не записваме ново, връщаме старото
    if (visitToday) {
      console.log("♻️ Повторно влизане за днес");
      return res.json({
        allowed: true,
        message: visitToday.fortune,
        isRevisit: true,
      });
    }

    // 2. Ако НЕ Е влизал днес (дори да е влизал вчера) -> СЪЗДАВАМЕ НОВ ЗАПИС
    const randomFortune =
      FORTUNES.length > 0
        ? FORTUNES[Math.floor(Math.random() * FORTUNES.length)]
        : "Късметът ти се пише в момента...";

    // Тук е разликата: Винаги create(), никога update на стар запис от друга дата
    await Visit.create({ deviceId, date: todayStr, fortune: randomFortune });

    console.log("✨ Нов запис в историята");
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

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
