import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import io from 'socket.io-client';

const PlayerBuzzer = () => {
  const [socket, setSocket] = useState(null);
  const [connected, setConnected] = useState(false);
  const [playerName, setPlayerName] = useState('');
  const [isRegistered, setIsRegistered] = useState(false);
  const [gameState, setGameState] = useState(null);
  const [buzzed, setBuzzed] = useState(false);
  const [buzzCooldown, setBuzzCooldown] = useState(false);

  useEffect(() => {
    const newSocket = io();
    setSocket(newSocket);

    newSocket.on('connect', () => {
      setConnected(true);
    });

    newSocket.on('disconnect', () => {
      setConnected(false);
    });

    newSocket.on('gameState', (state) => {
      setGameState(state);
      
      // Reset buzz state when question changes
      if (state.currentQuestionIndex !== gameState?.currentQuestionIndex) {
        setBuzzed(false);
        setBuzzCooldown(false);
      }
    });

    newSocket.on('playerBuzzed', (data) => {
      if (data.playerId === newSocket.id) {
        setBuzzed(true);
        setBuzzCooldown(true);
        
        // Reset cooldown after 3 seconds
        setTimeout(() => {
          setBuzzCooldown(false);
        }, 3000);
      }
    });

    return () => newSocket.close();
  }, [gameState?.currentQuestionIndex]);

  const registerPlayer = () => {
    if (!playerName.trim()) {
      alert('Please enter your name');
      return;
    }
    
    socket.emit('registerClient', 'player');
    setIsRegistered(true);
  };

  const handleBuzz = () => {
    if (!gameState?.roundActive || gameState?.gamePaused || buzzCooldown) {
      return;
    }

    socket.emit('playerBuzz', { name: playerName });
    setBuzzed(true);
  };

  if (!connected) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-600 to-pink-600 flex items-center justify-center text-white">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-white mx-auto mb-4"></div>
          <h2 className="text-2xl font-bold">Connecting...</h2>
        </div>
      </div>
    );
  }

  if (!isRegistered) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center text-white p-4">
        <motion.div 
          className="bg-white bg-opacity-20 backdrop-blur-lg rounded-2xl p-8 w-full max-w-md"
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.8 }}
        >
          <h1 className="text-3xl font-bold text-center mb-8">Join the Game</h1>
          
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium mb-2">Your Name</label>
              <input
                type="text"
                value={playerName}
                onChange={(e) => setPlayerName(e.target.value)}
                className="w-full p-4 bg-white bg-opacity-20 border border-white border-opacity-30 rounded-lg text-white placeholder-white placeholder-opacity-70 focus:outline-none focus:ring-2 focus:ring-white focus:ring-opacity-50"
                placeholder="Enter your name"
                maxLength={20}
              />
            </div>
            
            <motion.button
              onClick={registerPlayer}
              className="w-full bg-gradient-to-r from-green-500 to-emerald-500 text-white font-bold py-4 px-6 rounded-lg shadow-lg"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              Join Game
            </motion.button>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-900 text-white">
      {/* Header */}
      <div className="bg-gradient-to-r from-yellow-500 to-orange-500 p-4 shadow-lg">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold text-blue-900">Family Feud Buzzer</h1>
          <div className="text-blue-900 font-medium">
            {playerName}
          </div>
        </div>
      </div>

      {/* Game Status */}
      <div className="p-6">
        <div className="bg-white bg-opacity-10 backdrop-blur-lg rounded-xl p-4 mb-6">
          <div className="grid grid-cols-2 gap-4 text-center">
            <div>
              <div className="text-sm text-gray-300">Game Status</div>
              <div className="text-lg font-bold">
                {!gameState?.gameStarted ? 'Waiting' :
                 gameState?.gamePaused ? 'Paused' : 'Active'}
              </div>
            </div>
            <div>
              <div className="text-sm text-gray-300">Question</div>
              <div className="text-lg font-bold">
                {gameState?.gameStarted ? 
                  `${(gameState?.currentQuestionIndex || 0) + 1} / ${gameState?.questions?.length || 0}` :
                  'N/A'
                }
              </div>
            </div>
          </div>
        </div>

        {/* Current Question (if visible) */}
        {gameState?.gameStarted && gameState?.questions?.[gameState.currentQuestionIndex] && (
          <motion.div 
            className="bg-gradient-to-r from-blue-800 to-indigo-800 rounded-xl p-6 mb-8 border-2 border-yellow-400"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <h2 className="text-xl font-bold text-yellow-300 mb-3 text-center">Current Question</h2>
            <p className="text-lg text-center">
              {gameState.questions[gameState.currentQuestionIndex].question}
            </p>
          </motion.div>
        )}

        {/* Buzzer Button */}
        <div className="flex justify-center">
          <motion.button
            onClick={handleBuzz}
            disabled={!gameState?.roundActive || gameState?.gamePaused || buzzCooldown}
            className={`w-80 h-80 rounded-full text-4xl font-bold shadow-2xl border-8 transition-all duration-300 ${
              buzzed 
                ? 'bg-gradient-to-br from-green-400 to-emerald-500 border-green-300 text-green-900' 
                : buzzCooldown
                ? 'bg-gradient-to-br from-gray-500 to-gray-600 border-gray-400 text-gray-300 cursor-not-allowed'
                : !gameState?.roundActive || gameState?.gamePaused
                ? 'bg-gradient-to-br from-gray-600 to-gray-700 border-gray-500 text-gray-400 cursor-not-allowed'
                : 'bg-gradient-to-br from-red-500 to-pink-500 border-red-300 text-white hover:from-red-400 hover:to-pink-400'
            }`}
            whileHover={!buzzCooldown && gameState?.roundActive && !gameState?.gamePaused ? { scale: 1.05 } : {}}
            whileTap={!buzzCooldown && gameState?.roundActive && !gameState?.gamePaused ? { scale: 0.95 } : {}}
            animate={buzzed ? { 
              boxShadow: [
                "0 0 0 0 rgba(34, 197, 94, 0.7)",
                "0 0 0 20px rgba(34, 197, 94, 0)",
                "0 0 0 0 rgba(34, 197, 94, 0)"
              ]
            } : {}}
            transition={{ duration: 0.6, repeat: buzzed ? Infinity : 0 }}
          >
            {buzzed ? 'BUZZED!' : 
             buzzCooldown ? 'WAIT...' :
             !gameState?.roundActive ? 'WAITING' :
             gameState?.gamePaused ? 'PAUSED' : 'BUZZ!'}
          </motion.button>
        </div>

        {/* Status Messages */}
        <div className="mt-8 text-center">
          {buzzed && (
            <motion.p 
              className="text-2xl font-bold text-green-400"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5 }}
            >
              You buzzed in! Wait for the host.
            </motion.p>
          )}
          
          {buzzCooldown && !buzzed && (
            <motion.p 
              className="text-xl text-yellow-400"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
            >
              Cooldown active... Please wait.
            </motion.p>
          )}
          
          {!gameState?.gameStarted && (
            <p className="text-xl text-gray-400">
              Waiting for the game to start...
            </p>
          )}
          
          {gameState?.gamePaused && (
            <p className="text-xl text-yellow-400">
              Game is paused. Please wait.
            </p>
          )}
        </div>

        {/* Instructions */}
        <div className="mt-12 bg-white bg-opacity-10 backdrop-blur-lg rounded-xl p-6">
          <h3 className="text-lg font-bold mb-3 text-center">How to Play</h3>
          <ul className="space-y-2 text-sm text-gray-300">
            <li>• Wait for the host to start the game and reveal questions</li>
            <li>• Press the BUZZ button when you know an answer</li>
            <li>• First player to buzz gets to answer</li>
            <li>• Wait for the host to acknowledge your buzz</li>
            <li>• There's a 3-second cooldown after buzzing</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default PlayerBuzzer;

