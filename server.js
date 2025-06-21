import express from "express";
import { createServer } from "http";
import { Server } from "socket.io";
import fetch from "node-fetch";
import { parse } from "csv-parse/sync";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const httpServer = createServer(app);

const io = new Server(httpServer, {
  cors: { origin: "*" }, // Adjust for production
});

const PORT = process.env.PORT || 3000;

const CSV_URL =
  "https://docs.google.com/spreadsheets/d/e/2PACX-1vRPyh3wZXMXRivI7qwd3TL6dD5LQq5NLWjkfqNtCOKaM70Ptu8DUoGT8cnwxAceSq-mpTNb0nQaZBqb/pub?gid=883847407&single=true&output=csv";

let questionsData = {};
let categories = [];

async function loadQuestions() {
  const res = await fetch(CSV_URL);
  const csvText = await res.text();
  const records = parse(csvText, { columns: true, skip_empty_lines: true });

  const categorySet = new Set();
  const questionsByCategory = {};

  for (const row of records) {
    const cat = row["Category"];
    const qid = row["Question ID"];
    const questionText = row["Question"];
    if (!cat || !qid || !questionText) continue;

    categorySet.add(cat);

    const answers = [];
    for (let i = 1; i <= 8; i++) {
      const ansCol = `Answer${i}`;
      const ptsCol = `Score${i}`;
      if (row[ansCol]) {
        answers.push({ text: row[ansCol], points: Number(row[ptsCol]) || 0, revealed: false });
      }
    }

    if (!questionsByCategory[cat]) questionsByCategory[cat] = [];
    questionsByCategory[cat].push({ id: qid, question: questionText, answers });
  }

  categories = [...categorySet];
  questionsData = questionsByCategory;
}

// Serve frontend build
app.use(express.static(path.join(__dirname, "public")));

app.get("/api/categories", (req, res) => {
  res.json(categories);
});

app.get("/api/questions", (req, res) => {
  const cat = req.query.category;
  if (!cat || !questionsData[cat]) return res.status(404).json({ error: "Category not found" });
  res.json(questionsData[cat]);
});

let gameState = {
  teamAName: "Team A",
  teamBName: "Team B",
  teamAScore: 0,
  teamBScore: 0,
  currentQuestionIndex: 0,
  questions: [],
  strikes: 0,
  roundActive: false,
};

io.on("connection", (socket) => {
  console.log("Client connected:", socket.id);

  socket.emit("gameState", gameState);

  socket.on("startRound", ({ category, teamAName, teamBName }) => {
    if (!category || !questionsData[category]) {
      socket.emit("error", "Invalid category");
      return;
    }

    gameState = {
      teamAName: teamAName || "Team A",
      teamBName: teamBName || "Team B",
      teamAScore: 0,
      teamBScore: 0,
      currentQuestionIndex: 0,
      questions: questionsData[category].map(q => ({
        ...q,
        answers: q.answers.map(a => ({ ...a, revealed: false })),
      })),
      strikes: 0,
      roundActive: true,
    };
    io.emit("gameState", gameState);
  });

  socket.on("revealAnswer", (answerIndex) => {
    const q = gameState.questions[gameState.currentQuestionIndex];
    if (!q) return;
    if (answerIndex < 0 || answerIndex >= q.answers.length) return;

    if (!q.answers[answerIndex].revealed) {
      q.answers[answerIndex].revealed = true;
      gameState.strikes = 0; // Reset strikes on correct answer
      gameState.teamAScore += q.answers[answerIndex].points; // You can improve team scoring logic
    } else {
      gameState.strikes++;
    }
    io.emit("gameState", gameState);
  });

  socket.on("nextQuestion", () => {
    if (gameState.currentQuestionIndex < gameState.questions.length - 1) {
      gameState.currentQuestionIndex++;
      gameState.strikes = 0;
      io.emit("gameState", gameState);
    }
  });

  socket.on("updateScores", ({ teamAScore, teamBScore }) => {
    gameState.teamAScore = teamAScore ?? gameState.teamAScore;
    gameState.teamBScore = teamBScore ?? gameState.teamBScore;
    io.emit("gameState", gameState);
  });

  socket.on("disconnect", () => {
    console.log("Client disconnected:", socket.id);
  });
});

httpServer.listen(PORT, async () => {
  await loadQuestions();
  console.log(`Server running on http://localhost:${PORT}`);
});
