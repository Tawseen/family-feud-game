import React from "react";
import { useNavigate } from "react-router-dom";

export default function Menu() {
  const navigate = useNavigate();

  return (
    <div className="flex flex-col items-center justify-center h-screen bg-gradient-to-br from-purple-700 via-indigo-700 to-blue-700 text-white">
      <h1 className="text-5xl font-bold mb-12">Family Feud Studio</h1>
      <button
        onClick={() => navigate("/game")}
        className="w-48 py-3 mb-6 bg-blue-500 hover:bg-blue-600 rounded-md shadow-lg transition"
      >
        Game Screen
      </button>
      <button
        onClick={() => navigate("/admin")}
        className="w-48 py-3 bg-green-500 hover:bg-green-600 rounded-md shadow-lg transition"
      >
        Admin
      </button>
    </div>
  );
}
