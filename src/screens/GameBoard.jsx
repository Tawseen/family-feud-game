import React, { useEffect, useState } from "react";
import { io } from "socket.io-client";
import { motion, AnimatePresence } from "framer-motion";

const socket = io();

export default function GameBoard({ onReset }) {
  const [gameState, setGameState] = useState(null);

  useEffect(() => {
    socket.on("gameState", setGameState);
    return () => socket.off("gameState");
  }, []);

  if (!gameState)
    return (
      <div className="p-12 text-center text-indigo-400">Waiting for game...</div>
    );

  const currentQuestion = gameState.questions?.[gameState.currentQuestionIndex];

  return (
    <div className="max-w-6xl mx-auto p-8 bg-gradient-to-tr from-indigo-900 via-black to-indigo-900 rounded-3xl shadow-2xl border border-indigo-600 text-center select-none">
      <h2 className="text-5xl font-extrabold mb-8 tracking-widest text-indigo-400 drop-shadow-lg">
        {gameState.teamAName} vs {gameState.teamBName}
      </h2>

      <motion.div
        key={gameState.currentQuestionIndex}
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -30 }}
        transition={{ duration: 0.6 }}
        className="text-3xl md:text-4xl font-semibold mb-12 text-indigo-200 drop-shadow-md"
      >
        {currentQuestion?.question || "No question loaded"}
      </motion.div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-6 max-w-4xl mx-auto">
        <AnimatePresence>
          {currentQuestion?.answers.map((a, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, scale: 0.7 }}
              animate={{
                opacity: a.revealed ? 1 : 0.2,
                scale: a.revealed ? 1 : 0.7,
              }}
              exit={{ opacity: 0, scale: 0.7 }}
              transition={{ duration: 0.4, delay: i * 0.1 }}
              className={`rounded-xl p-6 shadow-lg font-bold ${
                a.revealed ? "bg-green-700" : "bg-indigo-800"
              }`}
            >
              {a.revealed ? (
                <div className="flex justify-between">
                  <span>{a.text}</span>
                  <span>{a.points}</span>
                </div>
              ) : (
                <span className="text-indigo-500 select-none">???</span>
              )}
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      <div className="mt-12 flex justify-between items-center text-3xl font-extrabold">
        <div>
          {gameState.teamAName}: {gameState.teamAScore}
        </div>
        <div className="text-red-500">Strikes: {gameState.strikes} / 3</div>
        <div>
          {gameState.teamBName}: {gameState.teamBScore}
        </div>
      </div>

      <button
        onClick={() => socket.emit("resetGame")}
        className="mt-10 bg-indigo-600 hover:bg-indigo-700 transition rounded-xl py-3 px-8 font-bold shadow-lg"
      >
        Reset Game
      </button>
    </div>
  );
}
