import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import io from 'socket.io-client';

const ContentManagementSystem = () => {
  const [socket, setSocket] = useState(null);
  const [connected, setConnected] = useState(false);
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [activeTab, setActiveTab] = useState('categories');
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingItem, setEditingItem] = useState(null);

  // Form states
  const [newCategory, setNewCategory] = useState({ name: '', description: '' });
  const [newQuestion, setNewQuestion] = useState({
    question: '',
    answers: Array(8).fill().map(() => ({ text: '', points: 0 }))
  });

  useEffect(() => {
    const newSocket = io();
    setSocket(newSocket);

    newSocket.on('connect', () => {
      setConnected(true);
      newSocket.emit('registerClient', 'admin');
      loadCategories();
    });

    newSocket.on('disconnect', () => {
      setConnected(false);
    });

    newSocket.on('categories', (cats) => {
      setCategories(cats);
    });

    return () => newSocket.close();
  }, []);

  const loadCategories = async () => {
    try {
      const response = await fetch('/api/categories');
      const data = await response.json();
      setCategories(data);
    } catch (error) {
      console.error('Failed to load categories:', error);
    }
  };

  const loadQuestions = async (categoryId) => {
    try {
      const response = await fetch(`/api/questions?category_id=${categoryId}`);
      const data = await response.json();
      setQuestions(data);
    } catch (error) {
      console.error('Failed to load questions:', error);
    }
  };

  const handleCategorySelect = (category) => {
    setSelectedCategory(category);
    loadQuestions(category.id);
    setActiveTab('questions');
  };

  const handleAddCategory = async () => {
    if (!newCategory.name.trim()) return;

    try {
      const response = await fetch('/api/categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newCategory)
      });

      if (response.ok) {
        setNewCategory({ name: '', description: '' });
        setShowAddForm(false);
        loadCategories();
      }
    } catch (error) {
      console.error('Failed to add category:', error);
    }
  };

  const handleAddQuestion = async () => {
    if (!newQuestion.question.trim() || !selectedCategory) return;

    const validAnswers = newQuestion.answers.filter(ans => ans.text.trim());
    if (validAnswers.length === 0) return;

    try {
      const response = await fetch('/api/questions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          categoryId: selectedCategory.id,
          question: newQuestion.question,
          answers: validAnswers
        })
      });

      if (response.ok) {
        setNewQuestion({
          question: '',
          answers: Array(8).fill().map(() => ({ text: '', points: 0 }))
        });
        setShowAddForm(false);
        loadQuestions(selectedCategory.id);
      }
    } catch (error) {
      console.error('Failed to add question:', error);
    }
  };

  const updateAnswerField = (index, field, value) => {
    const updatedAnswers = [...newQuestion.answers];
    updatedAnswers[index] = { ...updatedAnswers[index], [field]: value };
    setNewQuestion({ ...newQuestion, answers: updatedAnswers });
  };

  if (!connected) {
    return (
      <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-white mx-auto mb-4"></div>
          <h2 className="text-2xl font-bold">Connecting to Server...</h2>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-600 to-blue-600 p-6 shadow-2xl">
        <h1 className="text-4xl font-bold text-center">Content Management System</h1>
        <p className="text-center text-gray-200 mt-2">Manage categories, questions, and game content</p>
      </div>

      <div className="max-w-7xl mx-auto p-6">
        {/* Navigation Tabs */}
        <div className="flex space-x-4 mb-8">
          <button
            onClick={() => setActiveTab('categories')}
            className={`px-6 py-3 rounded-lg font-medium transition-all ${
              activeTab === 'categories'
                ? 'bg-blue-600 text-white shadow-lg'
                : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
            }`}
          >
            Categories
          </button>
          <button
            onClick={() => setActiveTab('questions')}
            disabled={!selectedCategory}
            className={`px-6 py-3 rounded-lg font-medium transition-all ${
              activeTab === 'questions' && selectedCategory
                ? 'bg-blue-600 text-white shadow-lg'
                : 'bg-gray-700 text-gray-500 cursor-not-allowed'
            }`}
          >
            Questions {selectedCategory && `(${selectedCategory.name})`}
          </button>
          <button
            onClick={() => setActiveTab('templates')}
            className={`px-6 py-3 rounded-lg font-medium transition-all ${
              activeTab === 'templates'
                ? 'bg-blue-600 text-white shadow-lg'
                : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
            }`}
          >
            Game Templates
          </button>
          <button
            onClick={() => setActiveTab('analytics')}
            className={`px-6 py-3 rounded-lg font-medium transition-all ${
              activeTab === 'analytics'
                ? 'bg-blue-600 text-white shadow-lg'
                : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
            }`}
          >
            Analytics
          </button>
        </div>

        {/* Categories Tab */}
        {activeTab === 'categories' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold">Categories</h2>
              <button
                onClick={() => setShowAddForm(true)}
                className="bg-green-600 hover:bg-green-700 px-4 py-2 rounded-lg font-medium transition-colors"
              >
                Add Category
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {categories.map((category) => (
                <motion.div
                  key={category.id}
                  className="bg-gray-800 rounded-lg p-6 border border-gray-700 hover:border-blue-500 transition-colors cursor-pointer"
                  onClick={() => handleCategorySelect(category)}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <h3 className="text-xl font-bold mb-2">{category.name}</h3>
                  <p className="text-gray-400 text-sm mb-4">
                    {category.description || 'No description'}
                  </p>
                  <div className="flex justify-between items-center">
                    <span className="text-blue-400 text-sm">Click to view questions</span>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setEditingItem(category);
                      }}
                      className="text-yellow-400 hover:text-yellow-300 text-sm"
                    >
                      Edit
                    </button>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}

        {/* Questions Tab */}
        {activeTab === 'questions' && selectedCategory && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold">
                Questions for "{selectedCategory.name}"
              </h2>
              <button
                onClick={() => setShowAddForm(true)}
                className="bg-green-600 hover:bg-green-700 px-4 py-2 rounded-lg font-medium transition-colors"
              >
                Add Question
              </button>
            </div>

            <div className="space-y-6">
              {questions.map((question, index) => (
                <motion.div
                  key={question.id}
                  className="bg-gray-800 rounded-lg p-6 border border-gray-700"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <div className="flex justify-between items-start mb-4">
                    <h3 className="text-lg font-bold text-blue-400">
                      Question {index + 1}
                    </h3>
                    <button
                      onClick={() => setEditingItem(question)}
                      className="text-yellow-400 hover:text-yellow-300 text-sm"
                    >
                      Edit
                    </button>
                  </div>
                  
                  <p className="text-white mb-4 text-lg">{question.question}</p>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {question.answers.map((answer, ansIndex) => (
                      <div
                        key={ansIndex}
                        className="bg-gray-700 rounded p-3 flex justify-between items-center"
                      >
                        <span>{answer.text}</span>
                        <span className="text-yellow-400 font-bold">
                          {answer.points} pts
                        </span>
                      </div>
                    ))}
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}

        {/* Game Templates Tab */}
        {activeTab === 'templates' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold">Game Templates</h2>
              <button
                onClick={() => setShowAddForm(true)}
                className="bg-green-600 hover:bg-green-700 px-4 py-2 rounded-lg font-medium transition-colors"
              >
                Create Template
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
                <h3 className="text-xl font-bold mb-2">Standard Game</h3>
                <p className="text-gray-400 text-sm mb-4">
                  Classic Family Feud format with 3 strikes and 30-second timer
                </p>
                <div className="space-y-2 text-sm">
                  <div>Max Strikes: 3</div>
                  <div>Timer: 30 seconds</div>
                  <div>Rounds: 5</div>
                </div>
              </div>

              <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
                <h3 className="text-xl font-bold mb-2">Fast Money</h3>
                <p className="text-gray-400 text-sm mb-4">
                  Lightning round format for final gameplay
                </p>
                <div className="space-y-2 text-sm">
                  <div>Max Strikes: 3</div>
                  <div>Timer: 20 seconds</div>
                  <div>Questions: 5</div>
                </div>
              </div>

              <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
                <h3 className="text-xl font-bold mb-2">Tournament Mode</h3>
                <p className="text-gray-400 text-sm mb-4">
                  Extended format for competitive play
                </p>
                <div className="space-y-2 text-sm">
                  <div>Max Strikes: 5</div>
                  <div>Timer: 45 seconds</div>
                  <div>Rounds: 7</div>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* Analytics Tab */}
        {activeTab === 'analytics' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <h2 className="text-2xl font-bold mb-6">Game Analytics</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-lg p-6">
                <h3 className="text-lg font-medium mb-2">Total Games</h3>
                <p className="text-3xl font-bold">247</p>
                <p className="text-blue-200 text-sm">+12 this week</p>
              </div>
              
              <div className="bg-gradient-to-r from-green-600 to-green-700 rounded-lg p-6">
                <h3 className="text-lg font-medium mb-2">Active Players</h3>
                <p className="text-3xl font-bold">1,432</p>
                <p className="text-green-200 text-sm">+89 this week</p>
              </div>
              
              <div className="bg-gradient-to-r from-purple-600 to-purple-700 rounded-lg p-6">
                <h3 className="text-lg font-medium mb-2">Questions Used</h3>
                <p className="text-3xl font-bold">3,891</p>
                <p className="text-purple-200 text-sm">Across all games</p>
              </div>
              
              <div className="bg-gradient-to-r from-orange-600 to-orange-700 rounded-lg p-6">
                <h3 className="text-lg font-medium mb-2">Avg Game Time</h3>
                <p className="text-3xl font-bold">18m</p>
                <p className="text-orange-200 text-sm">Per session</p>
              </div>
            </div>

            <div className="bg-gray-800 rounded-lg p-6">
              <h3 className="text-xl font-bold mb-4">Popular Categories</h3>
              <div className="space-y-4">
                {categories.slice(0, 5).map((category, index) => (
                  <div key={category.id} className="flex justify-between items-center">
                    <span>{category.name}</span>
                    <div className="flex items-center space-x-3">
                      <div className="w-32 bg-gray-700 rounded-full h-2">
                        <div 
                          className="bg-blue-500 h-2 rounded-full"
                          style={{ width: `${Math.random() * 100}%` }}
                        ></div>
                      </div>
                      <span className="text-sm text-gray-400">
                        {Math.floor(Math.random() * 100)} games
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </div>

      {/* Add/Edit Forms */}
      <AnimatePresence>
        {showAddForm && (
          <motion.div
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="bg-gray-800 rounded-lg p-8 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto"
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
            >
              {activeTab === 'categories' ? (
                <div>
                  <h3 className="text-2xl font-bold mb-6">Add New Category</h3>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium mb-2">Category Name</label>
                      <input
                        type="text"
                        value={newCategory.name}
                        onChange={(e) => setNewCategory({ ...newCategory, name: e.target.value })}
                        className="w-full p-3 bg-gray-700 border border-gray-600 rounded-lg"
                        placeholder="Enter category name"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2">Description</label>
                      <textarea
                        value={newCategory.description}
                        onChange={(e) => setNewCategory({ ...newCategory, description: e.target.value })}
                        className="w-full p-3 bg-gray-700 border border-gray-600 rounded-lg h-24"
                        placeholder="Enter category description"
                      />
                    </div>
                  </div>
                  <div className="flex space-x-4 mt-6">
                    <button
                      onClick={handleAddCategory}
                      className="bg-green-600 hover:bg-green-700 px-6 py-2 rounded-lg font-medium"
                    >
                      Add Category
                    </button>
                    <button
                      onClick={() => setShowAddForm(false)}
                      className="bg-gray-600 hover:bg-gray-700 px-6 py-2 rounded-lg font-medium"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : activeTab === 'questions' ? (
                <div>
                  <h3 className="text-2xl font-bold mb-6">Add New Question</h3>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium mb-2">Question</label>
                      <textarea
                        value={newQuestion.question}
                        onChange={(e) => setNewQuestion({ ...newQuestion, question: e.target.value })}
                        className="w-full p-3 bg-gray-700 border border-gray-600 rounded-lg h-20"
                        placeholder="Enter the survey question"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium mb-2">Answers</label>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {newQuestion.answers.map((answer, index) => (
                          <div key={index} className="flex space-x-2">
                            <input
                              type="text"
                              value={answer.text}
                              onChange={(e) => updateAnswerField(index, 'text', e.target.value)}
                              className="flex-1 p-2 bg-gray-700 border border-gray-600 rounded"
                              placeholder={`Answer ${index + 1}`}
                            />
                            <input
                              type="number"
                              value={answer.points}
                              onChange={(e) => updateAnswerField(index, 'points', parseInt(e.target.value) || 0)}
                              className="w-20 p-2 bg-gray-700 border border-gray-600 rounded"
                              placeholder="Pts"
                              min="0"
                            />
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                  <div className="flex space-x-4 mt-6">
                    <button
                      onClick={handleAddQuestion}
                      className="bg-green-600 hover:bg-green-700 px-6 py-2 rounded-lg font-medium"
                    >
                      Add Question
                    </button>
                    <button
                      onClick={() => setShowAddForm(false)}
                      className="bg-gray-600 hover:bg-gray-700 px-6 py-2 rounded-lg font-medium"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : null}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ContentManagementSystem;

