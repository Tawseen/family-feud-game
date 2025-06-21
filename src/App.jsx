import React, { useState, useEffect } from "react";
import Papa from "papaparse";
import { BrowserRouter, Routes, Route } from "react-router-dom";

import { GameProvider } from "./context/GameContext";

import Menu from "./screens/Menu";
import AdminMenu from "./screens/AdminMenu";
import ControlPanel from "./screens/ControlPanel";
import Soundboard from "./screens/soundboard";
import GameScreen from "./screens/GameScreen";

const CSV_URL =
  "https://docs.google.com/spreadsheets/d/e/2PACX-1vRPyh3wZXMXRivI7qwd3TL6dD5LQq5NLWjkfqNtCOKaM70Ptu8DUoGT8cnwxAceSq-mpTNb0nQaZBqb/pub?gid=883847407&single=true&output=csv";

export default function App() {
  // State for controlling the app screens and data
  const [mainScreen, setMainScreen] = useState("menu"); // "menu" | "admin" | "game"
  const [adminSubScreen, setAdminSubScreen] = useState(null); // null | "control" | "soundboard"

  const [questions, setQuestions] = useState([]);
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function loadCSV() {
      setLoading(true);
      try {
        const res = await fetch(CSV_URL);
        const text = await res.text();
        Papa.parse(text, {
          header: true,
          skipEmptyLines: true,
          complete: (results) => {
            const data = results.data;
            setQuestions(data);
            const cats = Array.from(new Set(data.map((r) => r.Category).filter(Boolean)));
            setCategories(cats);
            setLoading(false);
          },
          error: (err) => {
            setError(err.message);
            setLoading(false);
          },
        });
      } catch (e) {
        setError(e.message);
        setLoading(false);
      }
    }
    loadCSV();
  }, []);

  const filteredQuestions = selectedCategory
    ? questions.filter((q) => q.Category === selectedCategory)
    : [];

  // Navigation helpers
  const goToMenu = () => {
    setMainScreen("menu");
    setAdminSubScreen(null);
    setSelectedCategory(null);
  };
  const goToAdmin = () => {
    setMainScreen("admin");
    setAdminSubScreen(null);
  };
  const goToGame = () => {
    if (!selectedCategory) {
      alert("Select a category first in Control Panel!");
      return;
    }
    setMainScreen("game");
  };

  const openControlPanel = () => setAdminSubScreen("control");
  const openSoundboard = () => setAdminSubScreen("soundboard");
  const adminBack = () => setAdminSubScreen(null);

  function handleCategorySelect(cat) {
    setSelectedCategory(cat);
  }

  if (loading) return <div className="p-8 text-center">Loading questions...</div>;
  if (error) return <div className="p-8 text-center text-red-600">Error loading CSV: {error}</div>;

  if (mainScreen === "menu") {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-gradient-to-br from-purple-700 via-indigo-700 to-blue-700 text-white">
        <h1 className="text-5xl font-bold mb-12">Family Feud Studio</h1>
        <button
          onClick={goToGame}
          className="w-48 py-3 mb-6 bg-blue-500 hover:bg-blue-600 rounded-md shadow-lg transition"
          aria-label="Go to Game Screen"
        >
          Game Screen
        </button>
        <button
          onClick={goToAdmin}
          className="w-48 py-3 bg-green-500 hover:bg-green-600 rounded-md shadow-lg transition"
          aria-label="Go to Admin Menu"
        >
          Admin
        </button>
      </div>
    );
  }

  if (mainScreen === "admin") {
    if (!adminSubScreen) {
      return (
        <div className="p-8 max-w-xl mx-auto">
          <h2 className="text-3xl font-bold mb-6">Admin Menu</h2>
          <button
            onClick={openControlPanel}
            className="w-full py-3 mb-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-md"
          >
            Control Panel UI
          </button>
          <button
            onClick={openSoundboard}
            className="w-full py-3 mb-4 bg-pink-600 hover:bg-pink-700 text-white rounded-md"
          >
            Soundboard UI
          </button>
          <button
            onClick={goToMenu}
            className="w-full py-3 mt-8 bg-gray-700 hover:bg-gray-800 text-white rounded-md"
          >
            Back to Menu
          </button>
        </div>
      );
    }
    if (adminSubScreen === "control") {
      return (
        <div className="p-8 max-w-3xl mx-auto">
          <h2 className="text-3xl font-bold mb-6">Control Panel</h2>
          <label className="block mb-4 font-semibold">Select Category:</label>
          <select
            className="mb-6 p-2 border rounded w-full"
            value={selectedCategory || ""}
            onChange={(e) => handleCategorySelect(e.target.value)}
          >
            <option value="" disabled>
              -- Select a category --
            </option>
            {categories.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>

          {selectedCategory && (
            <div className="mb-6">
              <h3 className="font-semibold mb-2">Questions in {selectedCategory}:</h3>
              <ul className="list-disc list-inside max-h-64 overflow-y-auto border p-2 rounded bg-white text-black">
                {filteredQuestions.map((q, i) => (
                  <li key={i}>{q.Question || q.QuestionText || q["Question Text"] || "No question text"}</li>
                ))}
              </ul>
            </div>
          )}

          <button
            onClick={goToGame}
            disabled={!selectedCategory}
            className={`w-full py-3 mb-4 text-white rounded-md shadow ${
              selectedCategory
                ? "bg-green-600 hover:bg-green-700"
                : "bg-gray-400 cursor-not-allowed"
            }`}
          >
            Start Round
          </button>

          <button
            onClick={adminBack}
            className="w-full py-3 mt-8 bg-gray-700 hover:bg-gray-800 text-white rounded-md"
          >
            Back to Admin Menu
          </button>
        </div>
      );
    }
    if (adminSubScreen === "soundboard") {
      return (
        <div className="p-8 max-w-xl mx-auto">
          <h2 className="text-3xl font-bold mb-6">Soundboard</h2>
          <p>Soundboard UI goes here (play sounds, manage sound effects, etc.)</p>
          <button
            onClick={adminBack}
            className="w-full py-3 mt-8 bg-gray-700 hover:bg-gray-800 text-white rounded-md"
          >
            Back to Admin Menu
          </button>
        </div>
      );
    }
  }

  if (mainScreen === "game") {
    return (
      <div className="p-8 max-w-4xl mx-auto">
        <h2 className="text-3xl font-bold mb-6">
          Game Screen - Category: {selectedCategory}
        </h2>
        <GameScreen
          questions={filteredQuestions}
          category={selectedCategory}
          onBack={() => setMainScreen("menu")}
        />
      </div>
    );
  }

  return <div>Unknown screen state</div>;
}
