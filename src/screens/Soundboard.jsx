import React from "react";
import { useNavigate } from "react-router-dom";

export default function Soundboard() {
  const navigate = useNavigate();

  return (
    <div className="p-8 max-w-xl mx-auto">
      <h2 className="text-3xl font-bold mb-6">Soundboard</h2>
      <p>Soundboard UI goes here (play sounds, manage sound effects, etc.)</p>
      <button
        onClick={() => navigate("/admin")}
        className="w-full py-3 mt-8 bg-gray-700 hover:bg-gray-800 text-white rounded-md"
      >
        Back to Admin Menu
      </button>
    </div>
  );
}
