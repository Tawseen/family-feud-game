import React, { useContext } from "react";
import { GameContext } from "../context/GameContext";
import { useNavigate } from "react-router-dom";

export default function GameScreen() {
  const { selectedCategory, questions } = useContext(GameContext);
  const navigate = useNavigate();

  const filteredQuestions = selectedCategory
    ? questions.filter((q) => q.Category === selectedCategory)
    : [];

  if (!selectedCategory) {
    return (
      <div className="p-8 text-center">
        <p className="mb-4 text-red-600 font-semibold">
          No category selected. Go back and select one.
        </p>
        <button
          onClick={() => navigate("/admin/control")}
          className="py-3 px-6 bg-gray-700 hover:bg-gray-800 text-white rounded-md"
        >
          Back to Control Panel
        </button>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <h2 className="text-3xl font-bold mb-6">
        Game Screen - Category: {selectedCategory}
      </h2>

      <div className="mb-6">
        <h3 className="font-semibold mb-2">Questions & Answers:</h3>
        <ul className="list-disc list-inside max-h-96 overflow-y-auto border p-4 rounded bg-gray-100">
          {filteredQuestions.map((q, i) => (
            <li key={i} className="mb-4">
              <strong>{q.Question || q.QuestionText || "Question"}</strong>
              <ul className="ml-6 list-decimal list-inside mt-1 text-gray-700">
                {[...Array(8)].map((_, idx) => {
                  const ans =
                    q[`Answer${idx + 1}`] ||
                    q[`a${idx + 1}`] ||
                    q[`Answer ${idx + 1}`] ||
                    "";
                  if (!ans) return null;
                  return <li key={idx}>{ans}</li>;
                })}
              </ul>
            </li>
          ))}
        </ul>
      </div>

      <button
        onClick={() => navigate("/")}
        className="w-full py-3 mt-8 bg-red-600 hover:bg-red-700 text-white rounded-md"
      >
        Exit to Menu
      </button>
    </div>
  );
}
