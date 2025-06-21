import express from "express";
import { createServer } from "http";
import { Server } from "socket.io";
import fetch from "node-fetch";
import { parse } from "csv-parse/sync";
import path from "path";
import { fileURLToPath } from "url";
import { spawn } from "child_process";
import fs from "fs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const httpServer = createServer(app);

const io = new Server(httpServer, {
  cors: { origin: "*" },
});

const PORT = process.env.PORT || 3000;

const CSV_URL =
  "https://docs.google.com/spreadsheets/d/e/2PACX-1vRPyh3wZXMXRivI7qwd3TL6dD5LQq5NLWjkfqNtCOKaM70Ptu8DUoGT8cnwxAceSq-mpTNb0nQaZBqb/pub?gid=883847407&single=true&output=csv";

// Database integration
class DatabaseManager {
  constructor() {
    this.pythonProcess = null;
    this.initDatabase();
  }

  async initDatabase() {
    try {
      // Initialize database and import CSV data
      await this.executePython('init_db', {});
      await this.importCSVData();
      console.log('Database initialized successfully');
    } catch (error) {
      console.error('Database initialization failed:', error);
    }
  }

  async executePython(operation, data) {
    return new Promise((resolve, reject) => {
      const python = spawn('python3', ['-c', `
import sys
import json
sys.path.append('${__dirname}')
from database import db
import requests
from csv import DictReader
from io import StringIO

def init_db():
    return {"success": True}

def get_categories():
    return db.get_categories()

def get_questions_by_category(category_id):
    return db.get_questions_by_category(category_id)

def create_game_session(session_id, category_id, team_a_name, team_b_name):
    return db.create_game_session(session_id, category_id, team_a_name, team_b_name)

def update_game_session(session_id, **kwargs):
    return db.update_game_session(session_id, **kwargs)

def get_game_session(session_id):
    return db.get_game_session(session_id)

def log_game_event(session_id, event_type, event_data=None):
    return db.log_game_event(session_id, event_type, event_data)

def import_csv_data():
    try:
        response = requests.get('${CSV_URL}')
        csv_content = response.text
        reader = DictReader(StringIO(csv_content))
        data = list(reader)
        db.import_csv_data(data)
        return {"success": True, "imported": len(data)}
    except Exception as e:
        return {"success": False, "error": str(e)}

# Execute operation
operation = '${operation}'
data = ${JSON.stringify(data)}

if operation == 'init_db':
    result = init_db()
elif operation == 'get_categories':
    result = get_categories()
elif operation == 'get_questions_by_category':
    result = get_questions_by_category(data['category_id'])
elif operation == 'create_game_session':
    result = create_game_session(data['session_id'], data['category_id'], data['team_a_name'], data['team_b_name'])
elif operation == 'update_game_session':
    result = update_game_session(data['session_id'], **data['updates'])
elif operation == 'get_game_session':
    result = get_game_session(data['session_id'])
elif operation == 'log_game_event':
    result = log_game_event(data['session_id'], data['event_type'], data.get('event_data'))
elif operation == 'import_csv_data':
    result = import_csv_data()
else:
    result = {"error": "Unknown operation"}

print(json.dumps(result))
      `]);

      let output = '';
      let error = '';

      python.stdout.on('data', (data) => {
        output += data.toString();
      });

      python.stderr.on('data', (data) => {
        error += data.toString();
      });

      python.on('close', (code) => {
        if (code === 0) {
          try {
            const result = JSON.parse(output.trim());
            resolve(result);
          } catch (e) {
            reject(new Error(`Failed to parse Python output: ${output}`));
          }
        } else {
          reject(new Error(`Python process failed: ${error}`));
        }
      });
    });
  }

  async importCSVData() {
    try {
      const result = await this.executePython('import_csv_data', {});
      console.log('CSV import result:', result);
      return result;
    } catch (error) {
      console.error('CSV import failed:', error);
      return { success: false, error: error.message };
    }
  }

  async getCategories() {
    return await this.executePython('get_categories', {});
  }

  async getQuestionsByCategory(categoryId) {
    return await this.executePython('get_questions_by_category', { category_id: categoryId });
  }

  async createGameSession(sessionId, categoryId, teamAName, teamBName) {
    return await this.executePython('create_game_session', {
      session_id: sessionId,
      category_id: categoryId,
      team_a_name: teamAName,
      team_b_name: teamBName
    });
  }

  async updateGameSession(sessionId, updates) {
    return await this.executePython('update_game_session', {
      session_id: sessionId,
      updates
    });
  }

  async getGameSession(sessionId) {
    return await this.executePython('get_game_session', { session_id: sessionId });
  }

  async logGameEvent(sessionId, eventType, eventData = null) {
    return await this.executePython('log_game_event', {
      session_id: sessionId,
      event_type: eventType,
      event_data: eventData
    });
  }
}

const dbManager = new DatabaseManager();

// Serve frontend build
app.use(express.static(path.join(__dirname, "public")));
app.use(express.json());

// API Routes
app.get("/api/categories", async (req, res) => {
  try {
    const categories = await dbManager.getCategories();
    res.json(categories);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get("/api/questions", async (req, res) => {
  try {
    const categoryId = parseInt(req.query.category_id);
    if (!categoryId) {
      return res.status(400).json({ error: "Category ID required" });
    }
    
    const questions = await dbManager.getQuestionsByCategory(categoryId);
    res.json(questions);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post("/api/game-session", async (req, res) => {
  try {
    const { sessionId, categoryId, teamAName, teamBName } = req.body;
    const result = await dbManager.createGameSession(sessionId, categoryId, teamAName, teamBName);
    res.json({ success: result });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get("/api/game-session/:sessionId", async (req, res) => {
  try {
    const session = await dbManager.getGameSession(req.params.sessionId);
    if (session) {
      res.json(session);
    } else {
      res.status(404).json({ error: "Session not found" });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Enhanced game state with database persistence
let gameState = {
  // Basic game info
  gameId: null,
  sessionId: null,
  teamAName: "Team A",
  teamBName: "Team B",
  teamAScore: 0,
  teamBScore: 0,
  
  // Question management
  currentQuestionIndex: 0,
  questions: [],
  category: null,
  categoryId: null,
  
  // Game control
  strikes: 0,
  maxStrikes: 3,
  roundActive: false,
  gameStarted: false,
  gamePaused: false,
  
  // Timer system
  timerActive: false,
  timerDuration: 30,
  timerRemaining: 30,
  timerStartTime: null,
  
  // Host controls
  hostConnected: false,
  audienceMode: false,
  
  // Sound effects
  soundEffects: {
    correctAnswer: false,
    wrongAnswer: false,
    buzzer: false,
    applause: false,
    gameStart: false,
    roundEnd: false
  },
  
  // Game history
  gameHistory: [],
  currentRound: 1,
  
  // Display settings
  showScores: true,
  showStrikes: true,
  showTimer: true,
  
  // Fast money round
  fastMoneyActive: false,
  fastMoneyAnswers: [],
  fastMoneyScore: 0,

  // Analytics
  totalAnswersRevealed: 0,
  gameStartTime: null,
  lastActivity: null
};

// Store connected clients by type
let connectedClients = {
  hosts: new Set(),
  players: new Set(),
  audience: new Set()
};

// Timer management
let timerInterval = null;

async function saveGameState() {
  if (gameState.sessionId) {
    try {
      await dbManager.updateGameSession(gameState.sessionId, {
        team_a_score: gameState.teamAScore,
        team_b_score: gameState.teamBScore,
        current_question_index: gameState.currentQuestionIndex,
        strikes: gameState.strikes,
        status: gameState.gameStarted ? (gameState.gamePaused ? 'paused' : 'active') : 'waiting',
        game_state: {
          timerActive: gameState.timerActive,
          timerRemaining: gameState.timerRemaining,
          audienceMode: gameState.audienceMode,
          showScores: gameState.showScores,
          showStrikes: gameState.showStrikes,
          showTimer: gameState.showTimer,
          fastMoneyActive: gameState.fastMoneyActive,
          currentRound: gameState.currentRound,
          totalAnswersRevealed: gameState.totalAnswersRevealed,
          lastActivity: new Date().toISOString()
        }
      });
    } catch (error) {
      console.error('Failed to save game state:', error);
    }
  }
}

async function logEvent(eventType, eventData = null) {
  if (gameState.sessionId) {
    try {
      await dbManager.logGameEvent(gameState.sessionId, eventType, eventData);
    } catch (error) {
      console.error('Failed to log event:', error);
    }
  }
}

function startTimer(duration = 30) {
  if (timerInterval) clearInterval(timerInterval);
  
  gameState.timerActive = true;
  gameState.timerDuration = duration;
  gameState.timerRemaining = duration;
  gameState.timerStartTime = Date.now();
  
  timerInterval = setInterval(async () => {
    gameState.timerRemaining--;
    
    if (gameState.timerRemaining <= 0) {
      gameState.timerActive = false;
      gameState.timerRemaining = 0;
      clearInterval(timerInterval);
      timerInterval = null;
      
      await logEvent('timer_expired', { duration });
      io.emit("timerExpired");
    }
    
    io.emit("timerUpdate", {
      remaining: gameState.timerRemaining,
      active: gameState.timerActive
    });
  }, 1000);
  
  logEvent('timer_started', { duration });
  io.emit("timerStarted", { duration, remaining: gameState.timerRemaining });
}

function stopTimer() {
  if (timerInterval) {
    clearInterval(timerInterval);
    timerInterval = null;
  }
  gameState.timerActive = false;
  logEvent('timer_stopped');
  io.emit("timerStopped");
}

function resetTimer(duration = 30) {
  stopTimer();
  gameState.timerDuration = duration;
  gameState.timerRemaining = duration;
  io.emit("timerReset", { duration });
}

function triggerSoundEffect(effect) {
  gameState.soundEffects[effect] = true;
  io.emit("soundEffect", effect);
  logEvent('sound_effect', { effect });
  
  setTimeout(() => {
    gameState.soundEffects[effect] = false;
  }, 100);
}

async function resetGame() {
  stopTimer();
  gameState = {
    ...gameState,
    teamAScore: 0,
    teamBScore: 0,
    currentQuestionIndex: 0,
    strikes: 0,
    roundActive: false,
    gameStarted: false,
    gamePaused: false,
    timerActive: false,
    timerRemaining: 30,
    fastMoneyActive: false,
    fastMoneyAnswers: [],
    fastMoneyScore: 0,
    totalAnswersRevealed: 0,
    gameStartTime: new Date().toISOString(),
    questions: gameState.questions.map(q => ({
      ...q,
      answers: q.answers.map(a => ({ ...a, revealed: false }))
    }))
  };
  
  await saveGameState();
  await logEvent('game_reset');
  io.emit("gameState", gameState);
  triggerSoundEffect("gameStart");
}

async function nextQuestion() {
  if (gameState.currentQuestionIndex < gameState.questions.length - 1) {
    gameState.currentQuestionIndex++;
    gameState.strikes = 0;
    resetTimer();
    
    const currentQuestion = gameState.questions[gameState.currentQuestionIndex];
    if (currentQuestion) {
      currentQuestion.answers.forEach(answer => {
        answer.revealed = false;
      });
    }
    
    await saveGameState();
    await logEvent('question_changed', { 
      questionIndex: gameState.currentQuestionIndex,
      question: currentQuestion?.question 
    });
    
    io.emit("gameState", gameState);
    io.emit("questionChanged", {
      questionIndex: gameState.currentQuestionIndex,
      question: currentQuestion
    });
  }
}

async function previousQuestion() {
  if (gameState.currentQuestionIndex > 0) {
    gameState.currentQuestionIndex--;
    gameState.strikes = 0;
    resetTimer();
    
    await saveGameState();
    await logEvent('question_changed', { 
      questionIndex: gameState.currentQuestionIndex,
      question: gameState.questions[gameState.currentQuestionIndex]?.question 
    });
    
    io.emit("gameState", gameState);
    io.emit("questionChanged", {
      questionIndex: gameState.currentQuestionIndex,
      question: gameState.questions[gameState.currentQuestionIndex]
    });
  }
}

io.on("connection", (socket) => {
  console.log("Client connected:", socket.id);

  socket.emit("gameState", gameState);

  socket.on("registerClient", async (clientType) => {
    if (clientType === "host") {
      connectedClients.hosts.add(socket.id);
      gameState.hostConnected = true;
      socket.emit("hostRegistered");
      
      // Send categories to host
      try {
        const categories = await dbManager.getCategories();
        socket.emit("categories", categories);
      } catch (error) {
        socket.emit("error", "Failed to load categories");
      }
    } else if (clientType === "player") {
      connectedClients.players.add(socket.id);
    } else if (clientType === "audience") {
      connectedClients.audience.add(socket.id);
    }
    
    io.emit("clientsUpdate", {
      hosts: connectedClients.hosts.size,
      players: connectedClients.players.size,
      audience: connectedClients.audience.size
    });
  });

  socket.on("startGame", async ({ categoryId, teamAName, teamBName }) => {
    if (!connectedClients.hosts.has(socket.id)) return;
    
    try {
      const questions = await dbManager.getQuestionsByCategory(categoryId);
      if (!questions || questions.length === 0) {
        socket.emit("error", "No questions found for this category");
        return;
      }

      const sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      // Create database session
      await dbManager.createGameSession(sessionId, categoryId, teamAName, teamBName);

      gameState.gameId = Date.now().toString();
      gameState.sessionId = sessionId;
      gameState.categoryId = categoryId;
      gameState.teamAName = teamAName || "Team A";
      gameState.teamBName = teamBName || "Team B";
      gameState.questions = questions;
      gameState.gameStarted = true;
      gameState.roundActive = true;
      gameState.currentQuestionIndex = 0;
      gameState.strikes = 0;
      gameState.gameStartTime = new Date().toISOString();
      
      await saveGameState();
      await logEvent('game_started', { 
        categoryId, 
        teamAName, 
        teamBName, 
        questionCount: questions.length 
      });
      
      io.emit("gameState", gameState);
      triggerSoundEffect("gameStart");
    } catch (error) {
      socket.emit("error", "Failed to start game: " + error.message);
    }
  });

  socket.on("pauseGame", async () => {
    if (!connectedClients.hosts.has(socket.id)) return;
    
    gameState.gamePaused = !gameState.gamePaused;
    if (gameState.gamePaused) {
      stopTimer();
    }
    
    await saveGameState();
    await logEvent('game_paused', { paused: gameState.gamePaused });
    io.emit("gameState", gameState);
  });

  socket.on("resetGame", async () => {
    if (!connectedClients.hosts.has(socket.id)) return;
    await resetGame();
  });

  socket.on("nextQuestion", async () => {
    if (!connectedClients.hosts.has(socket.id)) return;
    await nextQuestion();
  });

  socket.on("previousQuestion", async () => {
    if (!connectedClients.hosts.has(socket.id)) return;
    await previousQuestion();
  });

  socket.on("revealAnswer", async (answerIndex) => {
    if (!connectedClients.hosts.has(socket.id)) return;
    
    const q = gameState.questions[gameState.currentQuestionIndex];
    if (!q || answerIndex < 0 || answerIndex >= q.answers.length) return;

    if (!q.answers[answerIndex].revealed) {
      q.answers[answerIndex].revealed = true;
      gameState.totalAnswersRevealed++;
      triggerSoundEffect("correctAnswer");
      
      await saveGameState();
      await logEvent('answer_revealed', {
        questionIndex: gameState.currentQuestionIndex,
        answerIndex,
        answer: q.answers[answerIndex]
      });
      
      io.emit("answerRevealed", {
        questionIndex: gameState.currentQuestionIndex,
        answerIndex,
        answer: q.answers[answerIndex]
      });
    }
    
    io.emit("gameState", gameState);
  });

  socket.on("hideAnswer", async (answerIndex) => {
    if (!connectedClients.hosts.has(socket.id)) return;
    
    const q = gameState.questions[gameState.currentQuestionIndex];
    if (!q || answerIndex < 0 || answerIndex >= q.answers.length) return;

    q.answers[answerIndex].revealed = false;
    await saveGameState();
    await logEvent('answer_hidden', {
      questionIndex: gameState.currentQuestionIndex,
      answerIndex
    });
    
    io.emit("gameState", gameState);
  });

  socket.on("revealAllAnswers", async () => {
    if (!connectedClients.hosts.has(socket.id)) return;
    
    const q = gameState.questions[gameState.currentQuestionIndex];
    if (!q) return;

    q.answers.forEach(answer => {
      if (!answer.revealed) {
        answer.revealed = true;
        gameState.totalAnswersRevealed++;
      }
    });
    
    await saveGameState();
    await logEvent('all_answers_revealed', {
      questionIndex: gameState.currentQuestionIndex
    });
    
    io.emit("gameState", gameState);
    triggerSoundEffect("applause");
  });

  socket.on("updateScores", async ({ teamAScore, teamBScore }) => {
    if (!connectedClients.hosts.has(socket.id)) return;
    
    const oldScoreA = gameState.teamAScore;
    const oldScoreB = gameState.teamBScore;
    
    if (teamAScore !== undefined) gameState.teamAScore = Math.max(0, teamAScore);
    if (teamBScore !== undefined) gameState.teamBScore = Math.max(0, teamBScore);
    
    await saveGameState();
    await logEvent('scores_updated', {
      oldScores: { teamA: oldScoreA, teamB: oldScoreB },
      newScores: { teamA: gameState.teamAScore, teamB: gameState.teamBScore }
    });
    
    io.emit("gameState", gameState);
    io.emit("scoresUpdated", {
      teamAScore: gameState.teamAScore,
      teamBScore: gameState.teamBScore
    });
  });

  socket.on("addPoints", async ({ team, points }) => {
    if (!connectedClients.hosts.has(socket.id)) return;
    
    const oldScore = team === "A" ? gameState.teamAScore : gameState.teamBScore;
    
    if (team === "A") {
      gameState.teamAScore = Math.max(0, gameState.teamAScore + points);
    } else if (team === "B") {
      gameState.teamBScore = Math.max(0, gameState.teamBScore + points);
    }
    
    await saveGameState();
    await logEvent('points_added', { team, points, oldScore });
    
    io.emit("gameState", gameState);
    triggerSoundEffect("correctAnswer");
  });

  socket.on("addStrike", async () => {
    if (!connectedClients.hosts.has(socket.id)) return;
    
    if (gameState.strikes < gameState.maxStrikes) {
      gameState.strikes++;
      triggerSoundEffect("wrongAnswer");
      
      if (gameState.strikes >= gameState.maxStrikes) {
        triggerSoundEffect("buzzer");
        io.emit("maxStrikesReached");
      }
    }
    
    await saveGameState();
    await logEvent('strike_added', { strikes: gameState.strikes });
    io.emit("gameState", gameState);
  });

  socket.on("removeStrike", async () => {
    if (!connectedClients.hosts.has(socket.id)) return;
    
    gameState.strikes = Math.max(0, gameState.strikes - 1);
    await saveGameState();
    await logEvent('strike_removed', { strikes: gameState.strikes });
    io.emit("gameState", gameState);
  });

  socket.on("resetStrikes", async () => {
    if (!connectedClients.hosts.has(socket.id)) return;
    
    gameState.strikes = 0;
    await saveGameState();
    await logEvent('strikes_reset');
    io.emit("gameState", gameState);
  });

  socket.on("startTimer", (duration) => {
    if (!connectedClients.hosts.has(socket.id)) return;
    startTimer(duration || 30);
  });

  socket.on("stopTimer", () => {
    if (!connectedClients.hosts.has(socket.id)) return;
    stopTimer();
  });

  socket.on("resetTimer", (duration) => {
    if (!connectedClients.hosts.has(socket.id)) return;
    resetTimer(duration || 30);
  });

  socket.on("playSoundEffect", (effect) => {
    if (!connectedClients.hosts.has(socket.id)) return;
    triggerSoundEffect(effect);
  });

  socket.on("toggleAudienceMode", async () => {
    if (!connectedClients.hosts.has(socket.id)) return;
    
    gameState.audienceMode = !gameState.audienceMode;
    await saveGameState();
    await logEvent('audience_mode_toggled', { audienceMode: gameState.audienceMode });
    io.emit("gameState", gameState);
  });

  socket.on("updateDisplaySettings", async (settings) => {
    if (!connectedClients.hosts.has(socket.id)) return;
    
    gameState.showScores = settings.showScores ?? gameState.showScores;
    gameState.showStrikes = settings.showStrikes ?? gameState.showStrikes;
    gameState.showTimer = settings.showTimer ?? gameState.showTimer;
    
    await saveGameState();
    await logEvent('display_settings_updated', settings);
    io.emit("gameState", gameState);
  });

  socket.on("startFastMoney", async () => {
    if (!connectedClients.hosts.has(socket.id)) return;
    
    gameState.fastMoneyActive = true;
    gameState.fastMoneyAnswers = [];
    gameState.fastMoneyScore = 0;
    
    await saveGameState();
    await logEvent('fast_money_started');
    io.emit("gameState", gameState);
    triggerSoundEffect("gameStart");
  });

  socket.on("endFastMoney", async () => {
    if (!connectedClients.hosts.has(socket.id)) return;
    
    gameState.fastMoneyActive = false;
    await saveGameState();
    await logEvent('fast_money_ended', { score: gameState.fastMoneyScore });
    io.emit("gameState", gameState);
  });

  socket.on("playerBuzz", async (playerData) => {
    if (!gameState.roundActive || gameState.gamePaused) return;
    
    const buzzData = {
      playerId: socket.id,
      playerName: playerData.name || "Unknown Player",
      timestamp: Date.now()
    };
    
    await logEvent('player_buzzed', buzzData);
    
    io.emit("playerBuzzed", buzzData);
    triggerSoundEffect("buzzer");
  });

  socket.on("disconnect", () => {
    console.log("Client disconnected:", socket.id);
    
    connectedClients.hosts.delete(socket.id);
    connectedClients.players.delete(socket.id);
    connectedClients.audience.delete(socket.id);
    
    if (connectedClients.hosts.size === 0) {
      gameState.hostConnected = false;
    }
    
    io.emit("clientsUpdate", {
      hosts: connectedClients.hosts.size,
      players: connectedClients.players.size,
      audience: connectedClients.audience.size
    });
  });
});

// Cleanup timer on server shutdown
process.on('SIGINT', () => {
  if (timerInterval) {
    clearInterval(timerInterval);
  }
  process.exit();
});

httpServer.listen(PORT, async () => {
  console.log(`Enhanced Family Feud Server with Database running on http://localhost:${PORT}`);
  console.log('Database integration: SQLite with Python backend');
  console.log('Features: Real-time sync, game persistence, event logging, analytics');
});

