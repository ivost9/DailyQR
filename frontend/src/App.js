import React, { useState, useEffect } from "react";
import axios from "axios";
import { v4 as uuidv4 } from "uuid";
import "./App.css";

function App() {
  const [fortune, setFortune] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isRevisit, setIsRevisit] = useState(false);

  // Нови състояния за админ панела
  const [isAdmin, setIsAdmin] = useState(false);
  const [stats, setStats] = useState({ count: 0, visits: [] });

  // Проверка за URL параметри (Secret Key)
  const urlParams = new URLSearchParams(window.location.search);
  const secretKey = urlParams.get("secret");

  // АВТОМАТИЧЕН ИЗБОР НА СЪРВЪР (Локален или Render)
  const API_URL =
    window.location.hostname === "localhost"
      ? "http://localhost:5000"
      : "https://dailyqr.onrender.com";

  // Функция за намиране на най-точната дата (създаване или обновяване)
  const getRealDate = (visit) => {
    // 1. Ако има updatedAt (значи е влизал повторно), взимаме него
    if (visit.updatedAt) return new Date(visit.updatedAt);
    // 2. Ако няма, взимаме createdAt
    if (visit.createdAt) return new Date(visit.createdAt);
    // 3. Ако е много стар запис, вадим дата от ID-то
    return new Date(parseInt(visit._id.substring(0, 8), 16) * 1000);
  };

  useEffect(() => {
    // --- АКО ИМА ТАЕН КЛЮЧ (АДМИН) ---
    if (secretKey) {
      setIsAdmin(true);
      axios
        .get(`${API_URL}/api/admin-stats?secret=${secretKey}`)
        .then((res) => {
          // ТУК Е МАГИЯТА: Сортираме ги хронологично (от старо към ново)
          const sortedVisits = res.data.visits.sort((a, b) => {
            return getRealDate(b) - getRealDate(a);
          });

          setStats({ count: res.data.count, visits: sortedVisits });
          setLoading(false);
        })
        .catch((err) => {
          console.error("Грешка:", err);
          setFortune("Грешен ключ за достъп!");
          setIsAdmin(false);
          setLoading(false);
        });
      return;
    }

    // --- НОРМАЛНА ЛОГИКА ЗА ПОТРЕБИТЕЛИ ---
    let deviceId = localStorage.getItem("device_uuid");
    if (!deviceId) {
      deviceId = uuidv4();
      localStorage.setItem("device_uuid", deviceId);
    }

    const fetchFortune = async () => {
      try {
        const response = await axios.post(`${API_URL}/api/get-fortune`, {
          deviceId: deviceId,
        });
        setFortune(response.data.message);
        setIsRevisit(response.data.isRevisit);
      } catch (err) {
        console.error(err);
        setFortune("Вселената има технически проблем. Опитайте по-късно.");
      } finally {
        setLoading(false);
      }
    };

    fetchFortune();
  }, [secretKey, API_URL]);

  // --- РЕНДЕРИРАНЕ ---

  return (
    <div className="app-container">
      <div className="background-orb orb-1"></div>
      <div className="background-orb orb-2"></div>

      <div className={`glass-card ${isAdmin ? "admin-mode" : ""}`}>
        {isAdmin ? (
          // --- АДМИН ПАНЕЛ ---
          <div className="admin-container">
            <div className="admin-header">
              <h3>🔒 АДМИН ЛОГ</h3>
              <div className="stats-summary">
                <span>
                  Общо: <strong>{stats.count}</strong>
                </span>
              </div>
            </div>

            <div className="log-header-row">
              <span className="col-num">№</span>
              <span className="col-date" style={{ textAlign: "right" }}>
                КОГА
              </span>
            </div>

            <div className="logs-wrapper">
              {loading ? (
                <div className="spinner"></div>
              ) : (
                <div className="logs-list">
                  {stats.visits.map((visit, index) => {
                    // Изчисляваме датата за показване
                    const dateObj = getRealDate(visit);

                    const dateStr = dateObj.toLocaleString("bg-BG", {
                      day: "2-digit",
                      month: "2-digit",
                      hour: "2-digit",
                      minute: "2-digit",
                    });

                    return (
                      <div
                        key={visit._id}
                        className="log-row fade-in"
                        style={{ animationDelay: `${index * 0.05}s` }}
                      >
                        <div className="col-num">#{stats.count - index}</div>

                        {/* ДАТА */}
                        <div
                          className="col-date"
                          style={{ textAlign: "right" }}
                        >
                          {dateStr}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            <button
              onClick={() => (window.location.href = "/")}
              className="exit-btn"
            >
              Изход
            </button>
          </div>
        ) : (
          // --- ПОТРЕБИТЕЛСКИ ИЗГЛЕД ---
          <>
            <div className="header">
              <span className="date-badge">
                {new Date().toLocaleDateString("bg-BG")}
              </span>
              <h2>{isRevisit ? "Твоето послание" : "Послание за деня"}</h2>
            </div>

            <div className="content">
              {loading ? (
                <div className="loader-container">
                  <div className="spinner"></div>
                  <p>Разчитане на знаците...</p>
                </div>
              ) : (
                <div className="message-container fade-in">
                  <span className="quote-mark">“</span>
                  <p className="fortune-text">{fortune}</p>
                  <span className="quote-mark right">”</span>
                </div>
              )}
            </div>

            <div className="footer">
              <p className="brand">Дневно вдъхновение</p>
              {isRevisit && (
                <span className="status-dot">● Запазено за днес</span>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default App;
