import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import io from 'socket.io-client';
import SoundSystem from './public/SoundSystem';

const GameScreenTVQuality = () => {
  const [socket, setSocket] = useState(null);
  const [gameState, setGameState] = useState(null);
  const [connected, setConnected] = useState(false);
  const [currentSoundEffect, setCurrentSoundEffect] = useState(null);
  const [showQuestion, setShowQuestion] = useState(true);
  const [revealedAnswers, setRevealedAnswers] = useState(new Set());
  const [lastRevealedAnswer, setLastRevealedAnswer] = useState(null);

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
      setLastRevealedAnswer(data.answerIndex);
      setCurrentSoundEffect('reveal');
      
      // Clear the last revealed answer after animation
      setTimeout(() => setLastRevealedAnswer(null), 1000);
    });

    newSocket.on('questionChanged', () => {
      setRevealedAnswers(new Set());
      setShowQuestion(true);
      setLastRevealedAnswer(null);
    });

    newSocket.on('soundEffect', (effect) => {
      setCurrentSoundEffect(effect);
    });

    newSocket.on('timerUpdate', (timerInfo) => {
      if (timerInfo.remaining <= 10 && timerInfo.remaining > 0 && timerInfo.active) {
        setCurrentSoundEffect('timerTick');
      }
    });

    newSocket.on('timerExpired', () => {
      setCurrentSoundEffect('timerWarning');
    });

    return () => newSocket.close();
  }, []);

  const currentQuestion = gameState?.questions?.[gameState?.currentQuestionIndex];

  if (!connected) {
    return (
      <div className="h-screen tv-screen flex items-center justify-center text-white">
        <div className="text-center">
          <motion.div 
            className="w-32 h-32 border-8 border-white border-t-transparent rounded-full mx-auto mb-8"
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          />
          <h2 className="text-4xl font-bold tv-title">Connecting to Game...</h2>
        </div>
      </div>
    );
  }

  if (!gameState?.gameStarted) {
    return (
      <div className="h-screen tv-screen text-white flex items-center justify-center">
        <div className="text-center">
          <motion.h1 
            className="text-9xl font-bold mb-8 tv-title gradient-gold bg-clip-text text-transparent"
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 1.5, ease: "easeOut" }}
          >
            FAMILY FEUD
          </motion.h1>
          <motion.div
            className="text-4xl font-medium tv-subtitle mb-8"
            initial={{ y: 50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.8, duration: 1 }}
          >
            Welcome to the Show!
          </motion.div>
          <motion.div
            className="text-2xl text-gray-300 tv-body"
            initial={{ y: 50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 1.2, duration: 1 }}
          >
            Get ready for the ultimate family game show experience
          </motion.div>
          
          {/* Animated background elements */}
          <motion.div
            className="absolute top-20 left-20 w-4 h-4 bg-yellow-400 rounded-full"
            animate={{ 
              scale: [1, 1.5, 1],
              opacity: [0.5, 1, 0.5]
            }}
            transition={{ duration: 2, repeat: Infinity }}
          />
          <motion.div
            className="absolute bottom-20 right-20 w-6 h-6 bg-blue-400 rounded-full"
            animate={{ 
              scale: [1, 1.3, 1],
              opacity: [0.3, 0.8, 0.3]
            }}
            transition={{ duration: 3, repeat: Infinity, delay: 1 }}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen tv-screen text-white overflow-hidden">
      <SoundSystem 
        soundEffect={currentSoundEffect} 
        onSoundEnd={() => setCurrentSoundEffect(null)} 
      />
      
      {/* Header with scores and game info */}
      <div className="gradient-gold p-8 shadow-2xl relative overflow-hidden">
        {/* Animated background pattern */}
        <div className="absolute inset-0 opacity-20">
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white to-transparent transform -skew-x-12 animate-shimmer" />
        </div>
        
        <div className="max-w-7xl mx-auto flex justify-between items-center relative z-10">
          {/* Team A Score */}
          <motion.div 
            className="text-center"
            initial={{ x: -100, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ duration: 1, ease: "easeOut" }}
          >
            <h2 className="text-3xl font-bold text-blue-900 mb-3 tv-subtitle">
              {gameState.teamAName}
            </h2>
            <motion.div 
              className="score-display px-8 py-4"
              whileHover={{ scale: 1.05 }}
              transition={{ type: "spring", stiffness: 300 }}
            >
              <motion.span 
                className="text-5xl font-bold score-number"
                key={gameState.teamAScore}
                initial={{ scale: 1.2, color: "#48bb78" }}
                animate={{ scale: 1, color: "#2d3748" }}
                transition={{ duration: 0.3 }}
              >
                {gameState.teamAScore}
              </motion.span>
            </motion.div>
          </motion.div>

          {/* Center Logo and Info */}
          <div className="text-center">
            <motion.h1 
              className="text-5xl font-bold text-blue-900 mb-3 tv-title"
              initial={{ y: -50, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 1, ease: "easeOut" }}
            >
              FAMILY FEUD
            </motion.h1>
            <div className="flex items-center justify-center space-x-8 text-blue-900">
              <motion.div 
                className="text-center"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.5, duration: 0.5 }}
              >
                <div className="text-sm font-medium tv-body">Round</div>
                <div className="text-2xl font-bold tv-subtitle">{gameState.currentRound || 1}</div>
              </motion.div>
              
              <motion.div 
                className="text-center"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.6, duration: 0.5 }}
              >
                <div className="text-sm font-medium tv-body">Question</div>
                <div className="text-2xl font-bold tv-subtitle">
                  {(gameState.currentQuestionIndex || 0) + 1} / {gameState.questions?.length || 0}
                </div>
              </motion.div>
              
              {gameState.showTimer && (
                <motion.div 
                  className="text-center"
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.7, duration: 0.5 }}
                >
                  <div className="text-sm font-medium tv-body">Timer</div>
                  <motion.div 
                    className={`text-2xl font-bold tv-subtitle ${
                      gameState.timerRemaining <= 10 ? 'text-red-600' : ''
                    }`}
                    animate={gameState.timerRemaining <= 5 ? { 
                      scale: [1, 1.2, 1],
                      color: ["#e53e3e", "#ffffff", "#e53e3e"]
                    } : {}}
                    transition={{ duration: 0.5, repeat: gameState.timerRemaining <= 5 ? Infinity : 0 }}
                  >
                    {gameState.timerRemaining || 0}s
                  </motion.div>
                </motion.div>
              )}
            </div>
          </div>

          {/* Team B Score */}
          <motion.div 
            className="text-center"
            initial={{ x: 100, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ duration: 1, ease: "easeOut" }}
          >
            <h2 className="text-3xl font-bold text-blue-900 mb-3 tv-subtitle">
              {gameState.teamBName}
            </h2>
            <motion.div 
              className="score-display px-8 py-4"
              whileHover={{ scale: 1.05 }}
              transition={{ type: "spring", stiffness: 300 }}
            >
              <motion.span 
                className="text-5xl font-bold score-number"
                key={gameState.teamBScore}
                initial={{ scale: 1.2, color: "#48bb78" }}
                animate={{ scale: 1, color: "#2d3748" }}
                transition={{ duration: 0.3 }}
              >
                {gameState.teamBScore}
              </motion.span>
            </motion.div>
          </motion.div>
        </div>
      </div>

      {/* Strikes Display */}
      {gameState.showStrikes && (
        <motion.div 
          className="flex justify-center py-6"
          initial={{ y: -30, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.5, duration: 0.8 }}
        >
          <div className="bg-red-600 rounded-full px-8 py-3 shadow-xl border-4 border-white">
            <div className="flex items-center space-x-4">
              <span className="text-white font-bold text-xl tv-subtitle">STRIKES:</span>
              <div className="flex space-x-3">
                {Array.from({ length: gameState.maxStrikes || 3 }).map((_, index) => (
                  <motion.div
                    key={index}
                    className={`strike-indicator ${index < (gameState.strikes || 0) ? 'active' : ''}`}
                    initial={{ scale: 0, rotate: -180 }}
                    animate={{ scale: 1, rotate: 0 }}
                    transition={{ 
                      delay: 0.7 + index * 0.1, 
                      duration: 0.5,
                      type: "spring",
                      stiffness: 200
                    }}
                    whileHover={{ scale: 1.1 }}
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
          {currentQuestion && showQuestion && (
            <motion.div 
              className="answer-board p-10 mb-10 relative"
              initial={{ scale: 0.8, opacity: 0, rotateX: -15 }}
              animate={{ scale: 1, opacity: 1, rotateX: 0 }}
              transition={{ duration: 1, ease: "easeOut" }}
              style={{ perspective: "1000px" }}
            >
              <motion.h2 
                className="text-5xl font-bold text-center text-yellow-300 mb-6 tv-title"
                initial={{ y: -20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.3, duration: 0.8 }}
              >
                Survey Says...
              </motion.h2>
              <motion.p 
                className="text-4xl font-medium text-center text-white leading-relaxed tv-body"
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.6, duration: 0.8 }}
              >
                {currentQuestion.question}
              </motion.p>
              
              {/* Decorative elements */}
              <motion.div
                className="absolute top-4 left-4 w-3 h-3 bg-yellow-400 rounded-full"
                animate={{ 
                  scale: [1, 1.5, 1],
                  opacity: [0.5, 1, 0.5]
                }}
                transition={{ duration: 2, repeat: Infinity }}
              />
              <motion.div
                className="absolute top-4 right-4 w-3 h-3 bg-yellow-400 rounded-full"
                animate={{ 
                  scale: [1, 1.5, 1],
                  opacity: [0.5, 1, 0.5]
                }}
                transition={{ duration: 2, repeat: Infinity, delay: 1 }}
              />
            </motion.div>
          )}

          {/* Answers Grid */}
          {currentQuestion && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {currentQuestion.answers.map((answer, index) => (
                <motion.div
                  key={index}
                  className={`answer-board p-8 relative overflow-hidden ${
                    answer.revealed ? 'answer-revealed' : 'answer-hidden'
                  }`}
                  initial={{ y: 50, opacity: 0, rotateY: -15 }}
                  animate={{ y: 0, opacity: 1, rotateY: 0 }}
                  transition={{ 
                    delay: index * 0.15, 
                    duration: 0.8,
                    type: "spring",
                    stiffness: 100
                  }}
                  whileHover={{ scale: 1.02, rotateY: 2 }}
                  style={{ perspective: "1000px" }}
                >
                  <div className="flex justify-between items-center relative z-10">
                    <div className="flex items-center space-x-6">
                      <motion.div 
                        className={`w-16 h-16 rounded-full flex items-center justify-center text-3xl font-bold tv-subtitle ${
                          answer.revealed ? 'bg-yellow-400 text-green-800' : 'bg-gray-600 text-gray-300'
                        }`}
                        whileHover={{ rotate: 360 }}
                        transition={{ duration: 0.5 }}
                      >
                        {index + 1}
                      </motion.div>
                      <div className="text-3xl font-bold tv-body">
                        <AnimatePresence mode="wait">
                          {answer.revealed ? (
                            <motion.span
                              key="revealed"
                              initial={{ opacity: 0, x: -30, scale: 0.8 }}
                              animate={{ opacity: 1, x: 0, scale: 1 }}
                              exit={{ opacity: 0, x: 30, scale: 0.8 }}
                              transition={{ duration: 0.6, ease: "easeOut" }}
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
                    
                    <div className={`text-5xl font-bold tv-title ${
                      answer.revealed ? 'text-yellow-300' : 'text-gray-500'
                    }`}>
                      <AnimatePresence mode="wait">
                        {answer.revealed ? (
                          <motion.span
                            key="points"
                            initial={{ scale: 0, rotate: -180 }}
                            animate={{ scale: 1, rotate: 0 }}
                            transition={{ 
                              duration: 0.8, 
                              delay: 0.3,
                              type: "spring",
                              stiffness: 200
                            }}
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

                  {/* Reveal Animation Effect */}
                  <AnimatePresence>
                    {answer.revealed && lastRevealedAnswer === index && (
                      <motion.div
                        className="absolute inset-0 bg-gradient-to-r from-yellow-400 via-orange-500 to-yellow-400"
                        initial={{ 
                          scale: 0, 
                          borderRadius: "50%",
                          opacity: 0.8
                        }}
                        animate={{ 
                          scale: 3, 
                          borderRadius: "0%",
                          opacity: 0
                        }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 1, ease: "easeOut" }}
                      />
                    )}
                  </AnimatePresence>

                  {/* Sparkle effects for revealed answers */}
                  {answer.revealed && (
                    <>
                      <motion.div
                        className="absolute top-2 right-2 w-2 h-2 bg-yellow-300 rounded-full"
                        animate={{ 
                          scale: [0, 1, 0],
                          opacity: [0, 1, 0]
                        }}
                        transition={{ 
                          duration: 1.5, 
                          repeat: Infinity,
                          delay: Math.random() * 2
                        }}
                      />
                      <motion.div
                        className="absolute bottom-2 left-2 w-1 h-1 bg-white rounded-full"
                        animate={{ 
                          scale: [0, 1, 0],
                          opacity: [0, 1, 0]
                        }}
                        transition={{ 
                          duration: 1, 
                          repeat: Infinity,
                          delay: Math.random() * 2
                        }}
                      />
                    </>
                  )}
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
            className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-50"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="gradient-gold text-black p-16 rounded-3xl text-center shadow-2xl border-8 border-white"
              initial={{ scale: 0.5, rotate: -10 }}
              animate={{ scale: 1, rotate: 0 }}
              exit={{ scale: 0.5, rotate: 10 }}
              transition={{ type: "spring", stiffness: 200 }}
            >
              <motion.h2 
                className="text-8xl font-bold mb-6 tv-title"
                animate={{ scale: [1, 1.1, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                GAME PAUSED
              </motion.h2>
              <p className="text-3xl tv-body">Please wait while we sort things out...</p>
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
              initial={{ scale: 0.5, rotate: -15 }}
              animate={{ scale: 1, rotate: 0 }}
              exit={{ scale: 0.5, rotate: 15 }}
              transition={{ type: "spring", stiffness: 150 }}
            >
              <motion.h2 
                className="text-9xl font-bold text-white mb-6 tv-title"
                animate={{ 
                  textShadow: [
                    "0 0 20px #ffffff",
                    "0 0 40px #ff0000",
                    "0 0 20px #ffffff"
                  ]
                }}
                transition={{ duration: 1, repeat: Infinity }}
              >
                STRIKE OUT!
              </motion.h2>
              <p className="text-4xl text-red-300 tv-body">Three strikes and you're out!</p>
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
            animate={{ scale: [1, 1.3, 1] }}
            exit={{ scale: 0 }}
            transition={{ repeat: Infinity, duration: 1 }}
          >
            <div className="timer-display timer-warning w-40 h-40 flex items-center justify-center">
              <span className="text-5xl font-bold text-white tv-title">
                {gameState.timerRemaining}
              </span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Fast Money Mode */}
      <AnimatePresence>
        {gameState.fastMoneyActive && (
          <motion.div
            className="fixed inset-0 gradient-purple flex items-center justify-center z-50"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="text-center"
              initial={{ scale: 0.5, y: 100 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.5, y: -100 }}
              transition={{ type: "spring", stiffness: 150 }}
            >
              <motion.h2 
                className="text-8xl font-bold text-yellow-400 mb-6 tv-title"
                animate={{ 
                  scale: [1, 1.1, 1],
                  rotate: [0, 2, -2, 0]
                }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                FAST MONEY!
              </motion.h2>
              <p className="text-3xl text-white tv-body">Get ready for the lightning round!</p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default GameScreenTVQuality;

