import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import io from 'socket.io-client';

const GameScreen = () => {
  const [socket, setSocket] = useState(null);
  const [gameState, setGameState] = useState(null);
  const [connected, setConnected] = useState(false);
  const [showQuestion, setShowQuestion] = useState(true);
  const [revealedAnswers, setRevealedAnswers] = useState(new Set());

  useEffect(() => {
    const newSocket = io();
    setSocket(newSocket);

    newSocket.on('connect', () => {
      setConnected(true);
      newSocket.emit('registerClient', 'audience');
    });

    newSocket.on('disconnect', () => {
      setConnected(false);
    });

    newSocket.on('gameState', (state) => {
      setGameState(state);
      
      // Update revealed answers
      if (state.questions && state.questions[state.currentQuestionIndex]) {
        const currentQuestion = state.questions[state.currentQuestionIndex];
        const revealed = new Set();
        currentQuestion.answers.forEach((answer, index) => {
          if (answer.revealed) {
            revealed.add(index);
          }
        });
        setRevealedAnswers(revealed);
      }
    });

    newSocket.on('answerRevealed', (data) => {
      setRevealedAnswers(prev => new Set([...prev, data.answerIndex]));
    });

    newSocket.on('questionChanged', () => {
      setRevealedAnswers(new Set());
      setShowQuestion(true);
    });

    newSocket.on('soundEffect', (effect) => {
      // Handle sound effects
      console.log('Sound effect:', effect);
    });

    return () => newSocket.close();
  }, []);

  const currentQuestion = gameState?.questions?.[gameState?.currentQuestionIndex];

  if (!connected) {
    return (
      <div className="flex items-center justify-center h-screen bg-gradient-to-br from-blue-900 via-purple-900 to-indigo-900 text-white">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-4 border-white mx-auto mb-8"></div>
          <h2 className="text-4xl font-bold">Connecting to Game...</h2>
        </div>
      </div>
    );
  }

  if (!gameState?.gameStarted) {
    return (
      <div className="h-screen bg-gradient-to-br from-blue-900 via-purple-900 to-indigo-900 text-white flex items-center justify-center">
        <div className="text-center">
          <motion.h1 
            className="text-8xl font-bold mb-8 bg-gradient-to-r from-yellow-400 to-orange-500 bg-clip-text text-transparent"
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 1, ease: "easeOut" }}
          >
            FAMILY FEUD
          </motion.h1>
          <motion.p 
            className="text-3xl font-medium"
            initial={{ y: 50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.5, duration: 0.8 }}
          >
            Get ready to play!
          </motion.p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen bg-gradient-to-br from-blue-900 via-purple-900 to-indigo-900 text-white overflow-hidden">
      {/* Header with scores and game info */}
      <div className="bg-gradient-to-r from-yellow-500 to-orange-600 p-6 shadow-2xl">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          {/* Team A Score */}
          <motion.div 
            className="text-center"
            initial={{ x: -100, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ duration: 0.8 }}
          >
            <h2 className="text-2xl font-bold text-blue-900 mb-2">{gameState.teamAName}</h2>
            <div className="bg-white text-blue-900 rounded-lg px-6 py-3 shadow-lg">
              <span className="text-4xl font-bold">{gameState.teamAScore}</span>
            </div>
          </motion.div>

          {/* Center Info */}
          <div className="text-center">
            <motion.h1 
              className="text-4xl font-bold text-blue-900 mb-2"
              initial={{ y: -50, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.8 }}
            >
              FAMILY FEUD
            </motion.h1>
            <div className="flex items-center justify-center space-x-6 text-blue-900">
              <div className="text-center">
                <div className="text-sm font-medium">Question</div>
                <div className="text-xl font-bold">
                  {(gameState.currentQuestionIndex || 0) + 1} / {gameState.questions?.length || 0}
                </div>
              </div>
              
              {gameState.showTimer && (
                <div className="text-center">
                  <div className="text-sm font-medium">Timer</div>
                  <div className={`text-xl font-bold ${gameState.timerRemaining <= 10 ? 'text-red-600' : ''}`}>
                    {gameState.timerRemaining || 0}s
                  </div>
                </div>
              )}
              
              {gameState.showStrikes && (
                <div className="text-center">
                  <div className="text-sm font-medium">Strikes</div>
                  <div className="flex justify-center space-x-1">
                    {Array.from({ length: gameState.maxStrikes || 3 }).map((_, index) => (
                      <div
                        key={index}
                        className={`w-4 h-4 rounded-full ${
                          index < (gameState.strikes || 0) ? 'bg-red-600' : 'bg-gray-300'
                        }`}
                      ></div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Team B Score */}
          <motion.div 
            className="text-center"
            initial={{ x: 100, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ duration: 0.8 }}
          >
            <h2 className="text-2xl font-bold text-blue-900 mb-2">{gameState.teamBName}</h2>
            <div className="bg-white text-blue-900 rounded-lg px-6 py-3 shadow-lg">
              <span className="text-4xl font-bold">{gameState.teamBScore}</span>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Main Game Area */}
      <div className="flex-1 p-8">
        <div className="max-w-6xl mx-auto">
          {/* Question Display */}
          {currentQuestion && showQuestion && (
            <motion.div 
              className="bg-gradient-to-r from-indigo-800 to-purple-800 rounded-2xl p-8 mb-8 shadow-2xl border-4 border-yellow-400"
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.8 }}
            >
              <h2 className="text-4xl font-bold text-center text-yellow-300 mb-4">
                Survey Says...
              </h2>
              <p className="text-3xl font-medium text-center text-white leading-relaxed">
                {currentQuestion.question}
              </p>
            </motion.div>
          )}

          {/* Answers Grid */}
          {currentQuestion && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {currentQuestion.answers.map((answer, index) => (
                <motion.div
                  key={index}
                  className={`relative overflow-hidden rounded-xl shadow-2xl border-4 ${
                    answer.revealed 
                      ? 'bg-gradient-to-r from-green-600 to-emerald-600 border-yellow-400' 
                      : 'bg-gradient-to-r from-gray-700 to-gray-800 border-gray-600'
                  }`}
                  initial={{ y: 50, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: index * 0.1, duration: 0.6 }}
                >
                  <div className="p-6 flex justify-between items-center">
                    <div className="flex items-center space-x-4">
                      <div className={`w-12 h-12 rounded-full flex items-center justify-center text-2xl font-bold ${
                        answer.revealed ? 'bg-yellow-400 text-green-800' : 'bg-gray-600 text-gray-300'
                      }`}>
                        {index + 1}
                      </div>
                      <div className="text-2xl font-bold">
                        <AnimatePresence mode="wait">
                          {answer.revealed ? (
                            <motion.span
                              key="revealed"
                              initial={{ opacity: 0, x: -20 }}
                              animate={{ opacity: 1, x: 0 }}
                              exit={{ opacity: 0, x: 20 }}
                              transition={{ duration: 0.5 }}
                            >
                              {answer.text}
                            </motion.span>
                          ) : (
                            <motion.span
                              key="hidden"
                              initial={{ opacity: 0 }}
                              animate={{ opacity: 1 }}
                              exit={{ opacity: 0 }}
                              className="text-gray-400"
                            >
                              ???
                            </motion.span>
                          )}
                        </AnimatePresence>
                      </div>
                    </div>
                    
                    <div className={`text-4xl font-bold ${
                      answer.revealed ? 'text-yellow-300' : 'text-gray-500'
                    }`}>
                      <AnimatePresence mode="wait">
                        {answer.revealed ? (
                          <motion.span
                            key="points"
                            initial={{ scale: 0.5, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            transition={{ duration: 0.5, delay: 0.2 }}
                          >
                            {answer.points}
                          </motion.span>
                        ) : (
                          <motion.span
                            key="hidden-points"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                          >
                            ?
                          </motion.span>
                        )}
                      </AnimatePresence>
                    </div>
                  </div>

                  {/* Reveal Animation */}
                  <AnimatePresence>
                    {answer.revealed && (
                      <motion.div
                        className="absolute inset-0 bg-gradient-to-r from-yellow-400 to-orange-500 opacity-20"
                        initial={{ scale: 0, borderRadius: "50%" }}
                        animate={{ scale: 2, borderRadius: "0%" }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.8 }}
                      />
                    )}
                  </AnimatePresence>
                </motion.div>
              ))}
            </div>
          )}

          {/* Game Status Messages */}
          <AnimatePresence>
            {gameState.gamePaused && (
              <motion.div
                className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                <motion.div
                  className="bg-yellow-500 text-black p-12 rounded-2xl text-center shadow-2xl"
                  initial={{ scale: 0.5 }}
                  animate={{ scale: 1 }}
                  exit={{ scale: 0.5 }}
                >
                  <h2 className="text-6xl font-bold mb-4">GAME PAUSED</h2>
                  <p className="text-2xl">Please wait...</p>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Strike Animation */}
          <AnimatePresence>
            {gameState.strikes >= gameState.maxStrikes && (
              <motion.div
                className="fixed inset-0 bg-red-900 bg-opacity-90 flex items-center justify-center z-40"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                <motion.div
                  className="text-center"
                  initial={{ scale: 0.5, rotate: -10 }}
                  animate={{ scale: 1, rotate: 0 }}
                  exit={{ scale: 0.5, rotate: 10 }}
                >
                  <h2 className="text-8xl font-bold text-white mb-4">STRIKE OUT!</h2>
                  <p className="text-3xl text-red-300">Maximum strikes reached</p>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Timer Warning */}
      <AnimatePresence>
        {gameState.timerActive && gameState.timerRemaining <= 10 && gameState.timerRemaining > 0 && (
          <motion.div
            className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-30"
            initial={{ scale: 0 }}
            animate={{ scale: [1, 1.2, 1] }}
            exit={{ scale: 0 }}
            transition={{ repeat: Infinity, duration: 1 }}
          >
            <div className="bg-red-600 text-white rounded-full w-32 h-32 flex items-center justify-center shadow-2xl border-4 border-white">
              <span className="text-4xl font-bold">{gameState.timerRemaining}</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default GameScreen;

