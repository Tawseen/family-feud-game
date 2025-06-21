import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import io from 'socket.io-client';

const AudienceDisplay = () => {
  const [socket, setSocket] = useState(null);
  const [gameState, setGameState] = useState(null);
  const [connected, setConnected] = useState(false);

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
    });

    newSocket.on('soundEffect', (effect) => {
      // Handle sound effects for audience
      console.log('Sound effect for audience:', effect);
    });

    return () => newSocket.close();
  }, []);

  const currentQuestion = gameState?.questions?.[gameState?.currentQuestionIndex];

  if (!connected) {
    return (
      <div className="h-screen bg-gradient-to-br from-blue-900 via-purple-900 to-indigo-900 text-white flex items-center justify-center">
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
            className="text-9xl font-bold mb-8 bg-gradient-to-r from-yellow-400 to-orange-500 bg-clip-text text-transparent"
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 1, ease: "easeOut" }}
          >
            FAMILY FEUD
          </motion.h1>
          <motion.p 
            className="text-4xl font-medium"
            initial={{ y: 50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.5, duration: 0.8 }}
          >
            Welcome to the Show!
          </motion.p>
          <motion.p 
            className="text-2xl text-gray-300 mt-4"
            initial={{ y: 50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 1, duration: 0.8 }}
          >
            Game starting soon...
          </motion.p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen bg-gradient-to-br from-blue-900 via-purple-900 to-indigo-900 text-white overflow-hidden">
      {/* Header with scores and game info */}
      <div className="bg-gradient-to-r from-yellow-500 to-orange-600 p-8 shadow-2xl">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          {/* Team A Score */}
          <motion.div 
            className="text-center"
            initial={{ x: -100, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ duration: 0.8 }}
          >
            <h2 className="text-3xl font-bold text-blue-900 mb-3">{gameState.teamAName}</h2>
            <div className="bg-white text-blue-900 rounded-xl px-8 py-4 shadow-xl">
              <span className="text-5xl font-bold">{gameState.teamAScore}</span>
            </div>
          </motion.div>

          {/* Center Logo and Info */}
          <div className="text-center">
            <motion.h1 
              className="text-5xl font-bold text-blue-900 mb-3"
              initial={{ y: -50, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.8 }}
            >
              FAMILY FEUD
            </motion.h1>
            <div className="flex items-center justify-center space-x-8 text-blue-900">
              <div className="text-center">
                <div className="text-sm font-medium">Round</div>
                <div className="text-2xl font-bold">{gameState.currentRound || 1}</div>
              </div>
              
              <div className="text-center">
                <div className="text-sm font-medium">Question</div>
                <div className="text-2xl font-bold">
                  {(gameState.currentQuestionIndex || 0) + 1} / {gameState.questions?.length || 0}
                </div>
              </div>
              
              {gameState.showTimer && (
                <div className="text-center">
                  <div className="text-sm font-medium">Timer</div>
                  <div className={`text-2xl font-bold ${gameState.timerRemaining <= 10 ? 'text-red-600' : ''}`}>
                    {gameState.timerRemaining || 0}s
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
            <h2 className="text-3xl font-bold text-blue-900 mb-3">{gameState.teamBName}</h2>
            <div className="bg-white text-blue-900 rounded-xl px-8 py-4 shadow-xl">
              <span className="text-5xl font-bold">{gameState.teamBScore}</span>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Strikes Display */}
      {gameState.showStrikes && (
        <motion.div 
          className="flex justify-center py-6"
          initial={{ y: -30, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.3, duration: 0.6 }}
        >
          <div className="bg-red-600 rounded-full px-8 py-3 shadow-xl">
            <div className="flex items-center space-x-3">
              <span className="text-white font-bold text-xl">STRIKES:</span>
              <div className="flex space-x-2">
                {Array.from({ length: gameState.maxStrikes || 3 }).map((_, index) => (
                  <motion.div
                    key={index}
                    className={`w-8 h-8 rounded-full border-2 border-white ${
                      index < (gameState.strikes || 0) ? 'bg-white' : 'bg-transparent'
                    }`}
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.5 + index * 0.1, duration: 0.3 }}
                  />
                ))}
              </div>
            </div>
          </div>
        </motion.div>
      )}

      {/* Main Game Area */}
      <div className="flex-1 p-8">
        <div className="max-w-7xl mx-auto">
          {/* Question Display */}
          {currentQuestion && (
            <motion.div 
              className="bg-gradient-to-r from-indigo-800 to-purple-800 rounded-3xl p-10 mb-10 shadow-2xl border-4 border-yellow-400"
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.8 }}
            >
              <h2 className="text-5xl font-bold text-center text-yellow-300 mb-6">
                Survey Says...
              </h2>
              <p className="text-4xl font-medium text-center text-white leading-relaxed">
                {currentQuestion.question}
              </p>
            </motion.div>
          )}

          {/* Answers Grid */}
          {currentQuestion && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {currentQuestion.answers.map((answer, index) => (
                <motion.div
                  key={index}
                  className={`relative overflow-hidden rounded-2xl shadow-2xl border-4 ${
                    answer.revealed 
                      ? 'bg-gradient-to-r from-green-600 to-emerald-600 border-yellow-400' 
                      : 'bg-gradient-to-r from-gray-700 to-gray-800 border-gray-600'
                  }`}
                  initial={{ y: 50, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: index * 0.1, duration: 0.6 }}
                >
                  <div className="p-8 flex justify-between items-center">
                    <div className="flex items-center space-x-6">
                      <div className={`w-16 h-16 rounded-full flex items-center justify-center text-3xl font-bold ${
                        answer.revealed ? 'bg-yellow-400 text-green-800' : 'bg-gray-600 text-gray-300'
                      }`}>
                        {index + 1}
                      </div>
                      <div className="text-3xl font-bold">
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
                    
                    <div className={`text-5xl font-bold ${
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
        </div>
      </div>

      {/* Game Status Overlays */}
      <AnimatePresence>
        {gameState.gamePaused && (
          <motion.div
            className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="bg-yellow-500 text-black p-16 rounded-3xl text-center shadow-2xl"
              initial={{ scale: 0.5 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.5 }}
            >
              <h2 className="text-8xl font-bold mb-6">GAME PAUSED</h2>
              <p className="text-3xl">Please wait while we sort things out...</p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Strike Out Animation */}
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
              <h2 className="text-9xl font-bold text-white mb-6">STRIKE OUT!</h2>
              <p className="text-4xl text-red-300">Three strikes and you're out!</p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

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
            <div className="bg-red-600 text-white rounded-full w-40 h-40 flex items-center justify-center shadow-2xl border-8 border-white">
              <span className="text-5xl font-bold">{gameState.timerRemaining}</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Fast Money Mode */}
      <AnimatePresence>
        {gameState.fastMoneyActive && (
          <motion.div
            className="fixed inset-0 bg-gradient-to-br from-purple-900 to-pink-900 flex items-center justify-center z-50"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="text-center"
              initial={{ scale: 0.5 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.5 }}
            >
              <h2 className="text-8xl font-bold text-yellow-400 mb-6">FAST MONEY!</h2>
              <p className="text-3xl text-white">Get ready for the lightning round!</p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default AudienceDisplay;

