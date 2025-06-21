import React, { useContext } from "react";
import { GameContext } from "../context/GameContext";
import { useNavigate } from "react-router-dom";

export default function ControlPanel() {
  const {
    categories,
    selectedCategory,
    setSelectedCategory,
    questions,
  } = useContext(GameContext);

  const navigate = useNavigate();

  const filteredQuestions = selectedCategory
    ? questions.filter((q) => q.Category === selectedCategory)
    : [];

  return (
    <div className="p-8 max-w-3xl mx-auto">
      <h2 className="text-3xl font-bold mb-6">Control Panel</h2>

      <label className="block mb-4 font-semibold">Select Category:</label>
      <select
        className="mb-6 p-2 border rounded w-full"
        value={selectedCategory || ""}
        onChange={(e) => setSelectedCategory(e.target.value)}
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
              <li key={i}>
                {q.Question || q.QuestionText || q["Question Text"] || "No question text"}
              </li>
            ))}
          </ul>
        </div>
      )}

      <button
        onClick={() => {
          if (!selectedCategory) {
            alert("Select a category first!");
            return;
          }
          navigate("/game");
        }}
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
        onClick={() => navigate("/admin")}
        className="w-full py-3 mt-8 bg-gray-700 hover:bg-gray-800 text-white rounded-md"
      >
        Back to Admin Menu
      </button>
    </div>
  );
}
