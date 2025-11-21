import React, { useState, useEffect } from "react";
import axios from "axios";
import { v4 as uuidv4 } from "uuid";
import "./App.css";

function App() {
  const [fortune, setFortune] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isRevisit, setIsRevisit] = useState(false); // Дали е повторно влизане

  useEffect(() => {
    let deviceId = localStorage.getItem("device_uuid");
    if (!deviceId) {
      deviceId = uuidv4();
      localStorage.setItem("device_uuid", deviceId);
    }

    const fetchFortune = async () => {
      try {
        // Увери се, че порта е 5001
        const response = await axios.post("https://dailyqr.onrender.com", {
          deviceId: deviceId,
        });

        // Взимаме данните от сървъра
        setFortune(response.data.message);
        setIsRevisit(response.data.isRevisit);
      } catch (err) {
        console.error(err);
        setFortune("Нещо се обърка. Проверете връзката.");
      } finally {
        setLoading(false);
      }
    };

    fetchFortune();
  }, []);

  return (
    <div className="app-container">
      <div className="card">
        {/* Сменяме заглавието ако е повторно влизане */}
        <h1>{isRevisit ? "Не забравяй:" : "Вашият късмет за деня ✨"}</h1>

        {loading ? (
          <p className="animate-pulse">Търсим вдъхновение...</p>
        ) : (
          <>
            <div className={`message-box ${isRevisit ? "revisit" : "success"}`}>
              <p>"{fortune}"</p>
            </div>

            {isRevisit && (
              <p className="hint">
                Това е твоето послание за днес. Утре те очаква ново!
              </p>
            )}

            {!isRevisit && <p className="brand-text">Усмихни се!</p>}
          </>
        )}
      </div>
    </div>
  );
}

export default App;
