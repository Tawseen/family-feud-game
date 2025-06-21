import { describe, it, expect, beforeEach } from 'vitest'
import { FamilyFeudGame } from '../gameLogic'

describe('FamilyFeudGame', () => {
  let game

  beforeEach(() => {
    game = new FamilyFeudGame({
      teams: ['Team A', 'Team B'],
      questions: [
        {
          question: "Name a fruit",
          answers: [
            { answer: "Apple", score: 30 },
            { answer: "Banana", score: 20 },
            { answer: "Orange", score: 10 },
          ],
        },
      ],
    })
  })

  it('starts a new round correctly', () => {
    game.startRound(0)
    expect(game.currentQuestion.question).toBe("Name a fruit")
    expect(game.strikes).toBe(0)
    expect(game.roundActive).toBe(true)
  })

  it('registers a correct answer and adds points', () => {
    game.startRound(0)
    const result = game.submitAnswer('Apple')
    expect(result.correct).toBe(true)
    expect(game.teamScores['Team A']).toBe(30)
  })

  it('registers a wrong answer and adds a strike', () => {
    game.startRound(0)
    const result = game.submitAnswer('Pineapple')
    expect(result.correct).toBe(false)
    expect(game.strikes).toBe(1)
  })

  it('switches team after 3 strikes and resets strikes immediately', () => {
    game.startRound(0)
    game.submitAnswer('Wrong1')
    game.submitAnswer('Wrong2')
    const res3 = game.submitAnswer('Wrong3')
    // After 3rd strike, strikes reset to 0 and team switches immediately
    expect(res3.strikes).toBe(0)
    expect(game.strikes).toBe(0)
    expect(game.currentTeam).toBe('Team B')
  })

  it('does not accept already revealed answers', () => {
    game.startRound(0)
    game.submitAnswer('Apple')
    const res = game.submitAnswer('Apple')
    expect(res.correct).toBe(false)
    expect(res.message).toBe("Answer already revealed")
  })

  it('tracks scores correctly across rounds', () => {
    game.startRound(0)
    game.submitAnswer('Apple')
    game.endRound()
    expect(game.teamScores['Team A']).toBe(30)
    game.startRound(0)
    game.submitAnswer('Banana')
    game.endRound()
    expect(game.teamScores['Team A']).toBe(50)
  })

  it('throws error when starting a round with invalid index', () => {
    expect(() => game.startRound(10)).toThrow("Invalid question index")
  })

  it('throws error when submitting answer outside round', () => {
    expect(() => game.submitAnswer('Apple')).toThrow("Round not active. Call startRound() first.")
  })

  it('allows manually revealing answers', () => {
    game.startRound(0)
    const res = game.revealAnswerManually('Orange')
    expect(res.success).toBe(true)
    expect(game.teamScores['Team A']).toBe(10)
  })

  it('does not allow revealing non-existent answers manually', () => {
    game.startRound(0)
    const res = game.revealAnswerManually('Pineapple')
    expect(res.success).toBe(false)
  })

  it('moves to next question correctly', () => {
    game.questions.push({
      question: "Name a color",
      answers: [
        { answer: "Red", score: 50 },
        { answer: "Blue", score: 40 },
      ],
    })
    game.startRound(0)
    game.nextQuestion()
    expect(game.currentQuestion.question).toBe("Name a color")
    expect(game.roundActive).toBe(true)
  })

  it('throws error when no more questions on nextQuestion()', () => {
    game.startRound(0)
    expect(() => game.nextQuestion()).toThrow("No more questions")
  })

  it('getGameState returns correct state snapshot', () => {
    game.startRound(0)
    game.submitAnswer('Apple')
    const state = game.getGameState()
    expect(state.currentTeam).toBe('Team A')
    expect(state.currentQuestion).toBe('Name a fruit')
    expect(state.strikes).toBe(0)
    expect(state.teamScores['Team A']).toBe(30)
    expect(state.revealedAnswers).toContain('apple')
    expect(state.roundActive).toBe(true)
  })
})
