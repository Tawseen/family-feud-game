import React, { createContext, useState, useEffect } from "react";
import Papa from "papaparse";

const CSV_URL =
  "https://docs.google.com/spreadsheets/d/e/2PACX-1vRPyh3wZXMXRivI7qwd3TL6dD5LQq5NLWjkfqNtCOKaM70Ptu8DUoGT8cnwxAceSq-mpTNb0nQaZBqb/pub?gid=883847407&single=true&output=csv";

export const GameContext = createContext();

export function GameProvider({ children }) {
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
            const cats = Array.from(
              new Set(data.map((r) => r.Category).filter(Boolean))
            );
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

  return (
    <GameContext.Provider
      value={{
        questions,
        categories,
        selectedCategory,
        setSelectedCategory,
        loading,
        error,
      }}
    >
      {children}
    </GameContext.Provider>
  );
}
