import React from "react";
import { useNavigate } from "react-router-dom";

export default function AdminMenu() {
  const navigate = useNavigate();

  return (
    <div className="p-8 max-w-xl mx-auto">
      <h2 className="text-3xl font-bold mb-6">Admin Menu</h2>
      <button
        onClick={() => navigate("/admin/control")}
        className="w-full py-3 mb-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-md"
      >
        Control Panel UI
      </button>
      <button
        onClick={() => navigate("/admin/soundboard")}
        className="w-full py-3 mb-4 bg-pink-600 hover:bg-pink-700 text-white rounded-md"
      >
        Soundboard UI
      </button>
      <button
        onClick={() => navigate("/")}
        className="w-full py-3 mt-8 bg-gray-700 hover:bg-gray-800 text-white rounded-md"
      >
        Back to Menu
      </button>
    </div>
  );
}
