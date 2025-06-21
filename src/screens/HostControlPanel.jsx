import React, { useState, useEffect } from 'react';
import io from 'socket.io-client';

const HostControlPanel = () => {
  const [socket, setSocket] = useState(null);
  const [gameState, setGameState] = useState(null);
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [teamAName, setTeamAName] = useState('Team A');
  const [teamBName, setTeamBName] = useState('Team B');
  const [timerDuration, setTimerDuration] = useState(30);
  const [connected, setConnected] = useState(false);
  const [clientsInfo, setClientsInfo] = useState({ hosts: 0, players: 0, audience: 0 });

  useEffect(() => {
    const newSocket = io();
    setSocket(newSocket);

    newSocket.on('connect', () => {
      setConnected(true);
      newSocket.emit('registerClient', 'host');
    });

    newSocket.on('disconnect', () => {
      setConnected(false);
    });

    newSocket.on('gameState', (state) => {
      setGameState(state);
    });

    newSocket.on('categories', (cats) => {
      setCategories(cats);
    });

    newSocket.on('clientsUpdate', (info) => {
      setClientsInfo(info);
    });

    newSocket.on('hostRegistered', () => {
      console.log('Host registered successfully');
    });

    newSocket.on('timerUpdate', (timerInfo) => {
      setGameState(prev => ({
        ...prev,
        timerRemaining: timerInfo.remaining,
        timerActive: timerInfo.active
      }));
    });

    newSocket.on('playerBuzzed', (playerInfo) => {
      // Handle player buzzer
      console.log('Player buzzed:', playerInfo);
    });

    return () => newSocket.close();
  }, []);

  const startGame = () => {
    if (!selectedCategory) {
      alert('Please select a category first');
      return;
    }
    socket.emit('startGame', {
      category: selectedCategory,
      teamAName,
      teamBName
    });
  };

  const pauseGame = () => {
    socket.emit('pauseGame');
  };

  const resetGame = () => {
    if (confirm('Are you sure you want to reset the game?')) {
      socket.emit('resetGame');
    }
  };

  const nextQuestion = () => {
    socket.emit('nextQuestion');
  };

  const previousQuestion = () => {
    socket.emit('previousQuestion');
  };

  const revealAnswer = (answerIndex) => {
    socket.emit('revealAnswer', answerIndex);
  };

  const hideAnswer = (answerIndex) => {
    socket.emit('hideAnswer', answerIndex);
  };

  const revealAllAnswers = () => {
    socket.emit('revealAllAnswers');
  };

  const updateScore = (team, newScore) => {
    const scores = {};
    if (team === 'A') {
      scores.teamAScore = parseInt(newScore) || 0;
    } else {
      scores.teamBScore = parseInt(newScore) || 0;
    }
    socket.emit('updateScores', scores);
  };

  const addPoints = (team, points) => {
    socket.emit('addPoints', { team, points: parseInt(points) || 0 });
  };

  const addStrike = () => {
    socket.emit('addStrike');
  };

  const removeStrike = () => {
    socket.emit('removeStrike');
  };

  const resetStrikes = () => {
    socket.emit('resetStrikes');
  };

  const startTimer = () => {
    socket.emit('startTimer', timerDuration);
  };

  const stopTimer = () => {
    socket.emit('stopTimer');
  };

  const resetTimer = () => {
    socket.emit('resetTimer', timerDuration);
  };

  const playSoundEffect = (effect) => {
    socket.emit('playSoundEffect', effect);
  };

  const toggleAudienceMode = () => {
    socket.emit('toggleAudienceMode');
  };

  const currentQuestion = gameState?.questions?.[gameState.currentQuestionIndex];

  if (!connected) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-900 text-white">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-white mx-auto mb-4"></div>
          <h2 className="text-2xl font-bold">Connecting to Game Server...</h2>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white p-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg p-6 mb-6">
          <h1 className="text-3xl font-bold mb-2">Family Feud - Host Control Panel</h1>
          <div className="flex items-center space-x-6 text-sm">
            <div className={`flex items-center ${connected ? 'text-green-300' : 'text-red-300'}`}>
              <div className={`w-3 h-3 rounded-full mr-2 ${connected ? 'bg-green-400' : 'bg-red-400'}`}></div>
              {connected ? 'Connected' : 'Disconnected'}
            </div>
            <div>Hosts: {clientsInfo.hosts}</div>
            <div>Players: {clientsInfo.players}</div>
            <div>Audience: {clientsInfo.audience}</div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Game Setup */}
          <div className="bg-gray-800 rounded-lg p-6">
            <h2 className="text-xl font-bold mb-4">Game Setup</h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Category</label>
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="w-full p-2 bg-gray-700 border border-gray-600 rounded"
                  disabled={gameState?.gameStarted}
                >
                  <option value="">Select Category</option>
                  {categories.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Team A Name</label>
                <input
                  type="text"
                  value={teamAName}
                  onChange={(e) => setTeamAName(e.target.value)}
                  className="w-full p-2 bg-gray-700 border border-gray-600 rounded"
                  disabled={gameState?.gameStarted}
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Team B Name</label>
                <input
                  type="text"
                  value={teamBName}
                  onChange={(e) => setTeamBName(e.target.value)}
                  className="w-full p-2 bg-gray-700 border border-gray-600 rounded"
                  disabled={gameState?.gameStarted}
                />
              </div>

              <div className="flex space-x-2">
                <button
                  onClick={startGame}
                  disabled={gameState?.gameStarted}
                  className="flex-1 bg-green-600 hover:bg-green-700 disabled:bg-gray-600 px-4 py-2 rounded font-medium"
                >
                  Start Game
                </button>
                <button
                  onClick={resetGame}
                  className="flex-1 bg-red-600 hover:bg-red-700 px-4 py-2 rounded font-medium"
                >
                  Reset Game
                </button>
              </div>
            </div>
          </div>

          {/* Game Control */}
          <div className="bg-gray-800 rounded-lg p-6">
            <h2 className="text-xl font-bold mb-4">Game Control</h2>
            
            <div className="space-y-4">
              {/* Game Status */}
              <div className="bg-gray-700 p-3 rounded">
                <div className="text-sm text-gray-300">Status</div>
                <div className="font-medium">
                  {!gameState?.gameStarted ? 'Not Started' :
                   gameState?.gamePaused ? 'Paused' : 'Active'}
                </div>
              </div>

              {/* Question Navigation */}
              <div>
                <div className="text-sm text-gray-300 mb-2">Question Control</div>
                <div className="flex space-x-2">
                  <button
                    onClick={previousQuestion}
                    disabled={!gameState?.gameStarted || gameState?.currentQuestionIndex === 0}
                    className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 px-3 py-2 rounded text-sm"
                  >
                    Previous
                  </button>
                  <button
                    onClick={nextQuestion}
                    disabled={!gameState?.gameStarted || gameState?.currentQuestionIndex >= (gameState?.questions?.length - 1)}
                    className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 px-3 py-2 rounded text-sm"
                  >
                    Next
                  </button>
                </div>
                <div className="text-center text-sm text-gray-400 mt-1">
                  Question {(gameState?.currentQuestionIndex || 0) + 1} of {gameState?.questions?.length || 0}
                </div>
              </div>

              {/* Game Actions */}
              <div className="flex space-x-2">
                <button
                  onClick={pauseGame}
                  disabled={!gameState?.gameStarted}
                  className="flex-1 bg-yellow-600 hover:bg-yellow-700 disabled:bg-gray-600 px-4 py-2 rounded font-medium"
                >
                  {gameState?.gamePaused ? 'Resume' : 'Pause'}
                </button>
                <button
                  onClick={toggleAudienceMode}
                  className="flex-1 bg-purple-600 hover:bg-purple-700 px-4 py-2 rounded font-medium"
                >
                  {gameState?.audienceMode ? 'Exit Audience' : 'Audience Mode'}
                </button>
              </div>
            </div>
          </div>

          {/* Timer Control */}
          <div className="bg-gray-800 rounded-lg p-6">
            <h2 className="text-xl font-bold mb-4">Timer Control</h2>
            
            <div className="space-y-4">
              {/* Timer Display */}
              <div className="bg-gray-700 p-4 rounded text-center">
                <div className="text-3xl font-bold">
                  {gameState?.timerRemaining || 0}s
                </div>
                <div className="text-sm text-gray-300">
                  {gameState?.timerActive ? 'Running' : 'Stopped'}
                </div>
              </div>

              {/* Timer Duration */}
              <div>
                <label className="block text-sm font-medium mb-2">Duration (seconds)</label>
                <input
                  type="number"
                  value={timerDuration}
                  onChange={(e) => setTimerDuration(parseInt(e.target.value) || 30)}
                  className="w-full p-2 bg-gray-700 border border-gray-600 rounded"
                  min="1"
                  max="300"
                />
              </div>

              {/* Timer Controls */}
              <div className="grid grid-cols-3 gap-2">
                <button
                  onClick={startTimer}
                  className="bg-green-600 hover:bg-green-700 px-3 py-2 rounded text-sm"
                >
                  Start
                </button>
                <button
                  onClick={stopTimer}
                  className="bg-red-600 hover:bg-red-700 px-3 py-2 rounded text-sm"
                >
                  Stop
                </button>
                <button
                  onClick={resetTimer}
                  className="bg-blue-600 hover:bg-blue-700 px-3 py-2 rounded text-sm"
                >
                  Reset
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Current Question & Answers */}
        {currentQuestion && (
          <div className="bg-gray-800 rounded-lg p-6 mt-6">
            <h2 className="text-xl font-bold mb-4">Current Question</h2>
            
            <div className="bg-gray-700 p-4 rounded mb-4">
              <h3 className="text-lg font-medium">{currentQuestion.question}</h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {currentQuestion.answers.map((answer, index) => (
                <div
                  key={index}
                  className={`p-4 rounded border-2 ${
                    answer.revealed 
                      ? 'bg-green-700 border-green-500' 
                      : 'bg-gray-700 border-gray-600'
                  }`}
                >
                  <div className="flex justify-between items-center mb-2">
                    <span className="font-medium">
                      {index + 1}. {answer.revealed ? answer.text : '???'}
                    </span>
                    <span className="text-lg font-bold">
                      {answer.revealed ? answer.points : '?'}
                    </span>
                  </div>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => revealAnswer(index)}
                      disabled={answer.revealed}
                      className="flex-1 bg-green-600 hover:bg-green-700 disabled:bg-gray-600 px-3 py-1 rounded text-sm"
                    >
                      Reveal
                    </button>
                    <button
                      onClick={() => hideAnswer(index)}
                      disabled={!answer.revealed}
                      className="flex-1 bg-red-600 hover:bg-red-700 disabled:bg-gray-600 px-3 py-1 rounded text-sm"
                    >
                      Hide
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-4">
              <button
                onClick={revealAllAnswers}
                className="bg-yellow-600 hover:bg-yellow-700 px-6 py-2 rounded font-medium"
              >
                Reveal All Answers
              </button>
            </div>
          </div>
        )}

        {/* Score & Strike Management */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
          {/* Score Management */}
          <div className="bg-gray-800 rounded-lg p-6">
            <h2 className="text-xl font-bold mb-4">Score Management</h2>
            
            <div className="space-y-4">
              {/* Team A */}
              <div>
                <label className="block text-sm font-medium mb-2">{gameState?.teamAName || 'Team A'}</label>
                <div className="flex space-x-2">
                  <input
                    type="number"
                    value={gameState?.teamAScore || 0}
                    onChange={(e) => updateScore('A', e.target.value)}
                    className="flex-1 p-2 bg-gray-700 border border-gray-600 rounded"
                  />
                  <button
                    onClick={() => addPoints('A', 10)}
                    className="bg-green-600 hover:bg-green-700 px-3 py-2 rounded text-sm"
                  >
                    +10
                  </button>
                  <button
                    onClick={() => addPoints('A', 25)}
                    className="bg-green-600 hover:bg-green-700 px-3 py-2 rounded text-sm"
                  >
                    +25
                  </button>
                </div>
              </div>

              {/* Team B */}
              <div>
                <label className="block text-sm font-medium mb-2">{gameState?.teamBName || 'Team B'}</label>
                <div className="flex space-x-2">
                  <input
                    type="number"
                    value={gameState?.teamBScore || 0}
                    onChange={(e) => updateScore('B', e.target.value)}
                    className="flex-1 p-2 bg-gray-700 border border-gray-600 rounded"
                  />
                  <button
                    onClick={() => addPoints('B', 10)}
                    className="bg-green-600 hover:bg-green-700 px-3 py-2 rounded text-sm"
                  >
                    +10
                  </button>
                  <button
                    onClick={() => addPoints('B', 25)}
                    className="bg-green-600 hover:bg-green-700 px-3 py-2 rounded text-sm"
                  >
                    +25
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Strike Management */}
          <div className="bg-gray-800 rounded-lg p-6">
            <h2 className="text-xl font-bold mb-4">Strike Management</h2>
            
            <div className="space-y-4">
              {/* Strike Display */}
              <div className="bg-gray-700 p-4 rounded text-center">
                <div className="text-2xl font-bold mb-2">
                  {gameState?.strikes || 0} / {gameState?.maxStrikes || 3}
                </div>
                <div className="flex justify-center space-x-2">
                  {Array.from({ length: gameState?.maxStrikes || 3 }).map((_, index) => (
                    <div
                      key={index}
                      className={`w-6 h-6 rounded-full ${
                        index < (gameState?.strikes || 0) ? 'bg-red-500' : 'bg-gray-600'
                      }`}
                    ></div>
                  ))}
                </div>
              </div>

              {/* Strike Controls */}
              <div className="grid grid-cols-3 gap-2">
                <button
                  onClick={addStrike}
                  className="bg-red-600 hover:bg-red-700 px-3 py-2 rounded text-sm"
                >
                  Add Strike
                </button>
                <button
                  onClick={removeStrike}
                  className="bg-blue-600 hover:bg-blue-700 px-3 py-2 rounded text-sm"
                >
                  Remove Strike
                </button>
                <button
                  onClick={resetStrikes}
                  className="bg-gray-600 hover:bg-gray-700 px-3 py-2 rounded text-sm"
                >
                  Reset
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Sound Effects */}
        <div className="bg-gray-800 rounded-lg p-6 mt-6">
          <h2 className="text-xl font-bold mb-4">Sound Effects</h2>
          
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
            <button
              onClick={() => playSoundEffect('correctAnswer')}
              className="bg-green-600 hover:bg-green-700 px-4 py-2 rounded text-sm"
            >
              Correct Answer
            </button>
            <button
              onClick={() => playSoundEffect('wrongAnswer')}
              className="bg-red-600 hover:bg-red-700 px-4 py-2 rounded text-sm"
            >
              Wrong Answer
            </button>
            <button
              onClick={() => playSoundEffect('buzzer')}
              className="bg-yellow-600 hover:bg-yellow-700 px-4 py-2 rounded text-sm"
            >
              Buzzer
            </button>
            <button
              onClick={() => playSoundEffect('applause')}
              className="bg-purple-600 hover:bg-purple-700 px-4 py-2 rounded text-sm"
            >
              Applause
            </button>
            <button
              onClick={() => playSoundEffect('gameStart')}
              className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded text-sm"
            >
              Game Start
            </button>
            <button
              onClick={() => playSoundEffect('roundEnd')}
              className="bg-indigo-600 hover:bg-indigo-700 px-4 py-2 rounded text-sm"
            >
              Round End
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HostControlPanel;

