export class FamilyFeudGame {
  constructor({ teams = [], questions = [] } = {}) {
    this.teams = teams
    this.questions = questions

    this.teamScores = {}
    teams.forEach(team => {
      this.teamScores[team] = 0
    })

    this.currentTeamIndex = 0
    this.currentQuestionIndex = -1
    this.currentQuestion = null
    this.revealedAnswers = new Set()
    this.strikes = 0
    this.roundActive = false
  }

  get currentTeam() {
    return this.teams[this.currentTeamIndex]
  }

  startRound(questionIndex) {
    if (questionIndex < 0 || questionIndex >= this.questions.length) {
      throw new Error("Invalid question index")
    }
    this.currentQuestionIndex = questionIndex
    this.currentQuestion = this.questions[questionIndex]
    this.revealedAnswers.clear()
    this.strikes = 0
    this.roundActive = true
  }

  submitAnswer(answer) {
    if (!this.roundActive) {
      throw new Error("Round not active. Call startRound() first.")
    }

    const answerNormalized = answer.trim().toLowerCase()

    // Already revealed check
    if (this.revealedAnswers.has(answerNormalized)) {
      return { correct: false, message: "Answer already revealed", strikes: this.strikes }
    }

    // Find matching answer (case insensitive)
    const matched = this.currentQuestion.answers.find(a => a.answer.toLowerCase() === answerNormalized)

    if (matched) {
      this.revealedAnswers.add(answerNormalized)
      this.teamScores[this.currentTeam] += matched.score

      // Check if all answers revealed => round ends
      if (this.revealedAnswers.size === this.currentQuestion.answers.length) {
        this.roundActive = false
      }

      return { correct: true, score: matched.score, strikes: this.strikes }
    } else {
      // Wrong answer, add strike
      this.strikes += 1

      if (this.strikes >= 3) {
        // Switch team and reset strikes immediately
        this.currentTeamIndex = (this.currentTeamIndex + 1) % this.teams.length
        this.strikes = 0
      }

      return { correct: false, strikes: this.strikes }
    }
  }

  revealAnswerManually(answer) {
    if (!this.roundActive) {
      return { success: false, message: "Round not active" }
    }

    const answerNormalized = answer.trim().toLowerCase()

    if (this.revealedAnswers.has(answerNormalized)) {
      return { success: false, message: "Answer already revealed" }
    }

    const matched = this.currentQuestion.answers.find(a => a.answer.toLowerCase() === answerNormalized)

    if (matched) {
      this.revealedAnswers.add(answerNormalized)
      this.teamScores[this.currentTeam] += matched.score

      if (this.revealedAnswers.size === this.currentQuestion.answers.length) {
        this.roundActive = false
      }

      return { success: true }
    }

    return { success: false, message: "Answer not found" }
  }

  endRound() {
    this.roundActive = false
    this.strikes = 0
    this.revealedAnswers.clear()
    this.currentQuestion = null
    this.currentQuestionIndex = -1
  }

  nextQuestion() {
    const nextIndex = this.currentQuestionIndex + 1
    if (nextIndex >= this.questions.length) {
      throw new Error("No more questions")
    }
    this.startRound(nextIndex)
  }

  getGameState() {
    return {
      currentTeam: this.currentTeam,
      currentQuestion: this.currentQuestion ? this.currentQuestion.question : null,
      strikes: this.strikes,
      teamScores: { ...this.teamScores },
      revealedAnswers: Array.from(this.revealedAnswers),
      roundActive: this.roundActive,
    }
  }
}
