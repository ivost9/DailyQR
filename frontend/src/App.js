import React, { useState, useEffect } from "react";
import axios from "axios";
import { v4 as uuidv4 } from "uuid";
import "./App.css";

function App() {
  const [fortune, setFortune] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isRevisit, setIsRevisit] = useState(false);

  useEffect(() => {
    let deviceId = localStorage.getItem("device_uuid");
    if (!deviceId) {
      deviceId = uuidv4();
      localStorage.setItem("device_uuid", deviceId);
    }

    const fetchFortune = async () => {
      try {
        // Увери се, че тук е твоят Render линк!
        const response = await axios.post(
          "https://dailyqr.onrender.com/api/get-fortune",
          {
            deviceId: deviceId,
          }
        );

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
  }, []);

  return (
    <div className="app-container">
      {/* Анимиран фон */}
      <div className="background-orb orb-1"></div>
      <div className="background-orb orb-2"></div>

      <div className="glass-card">
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
          <p className="brand">Daily Inspiration</p>
          {isRevisit && <span className="status-dot">● Запазено за днес</span>}
        </div>
      </div>
    </div>
  );
}

export default App;
