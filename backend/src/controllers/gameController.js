const User = require('../models/User');
const logger = require('../utils/logger');

/**
 * Generate random integer between min and max (inclusive)
 */
const getRandomInt = (min, max) => {
  min = Math.ceil(min);
  max = Math.floor(max);
  return Math.floor(Math.random() * (max - min + 1)) + min;
};

/**
 * Get a random operator
 */
const getRandomOperator = () => {
  const operators = ['+', '-', '×', '÷'];
  return operators[Math.floor(Math.random() * operators.length)];
};

/**
 * Generate a single-digit arithmetic question
 */
const generateSingleDigitQuestion = () => {
  const operator = getRandomOperator();
  let a, b;
  
  switch (operator) {
    case '+': // Addition
      a = getRandomInt(1, 9);
      b = getRandomInt(1, 9);
      return {
        text: `${a} + ${b}`,
        answer: a + b
      };
      
    case '-': // Subtraction
      // Ensure non-negative result
      b = getRandomInt(1, 9);
      a = getRandomInt(b, 9);
      return {
        text: `${a} - ${b}`,
        answer: a - b
      };
      
    case '×': // Multiplication
      a = getRandomInt(1, 9);
      b = getRandomInt(1, 9);
      return {
        text: `${a} × ${b}`,
        answer: a * b
      };
      
    case '÷': // Division
      // Ensure whole number result
      b = getRandomInt(1, 9);
      const result = getRandomInt(1, 9);
      a = b * result;
      return {
        text: `${a} ÷ ${b}`,
        answer: result
      };
      
    default:
      // Fallback to addition
      a = getRandomInt(1, 9);
      b = getRandomInt(1, 9);
      return {
        text: `${a} + ${b}`,
        answer: a + b
      };
  }
};

/**
 * Generate a set of unique single-digit questions
 * (no duplicate answers)
 */
const generateUniqueQuestions = (count) => {
  const questions = [];
  const usedAnswers = new Set();
  
  let attempts = 0;
  const maxAttempts = count * 10; // Avoid infinite loops
  
  while (questions.length < count && attempts < maxAttempts) {
    attempts++;
    const question = generateSingleDigitQuestion();
    
    if (!usedAnswers.has(question.answer)) {
      usedAnswers.add(question.answer);
      questions.push(question);
    }
  }
  
  return questions;
};

/**
 * @route   GET /api/game/questions
 * @desc    Get random math questions (public, no auth needed)
 * @access  Public
 */
const getQuestions = (req, res) => {
  try {
    // Parse params with defaults
    const count = parseInt(req.query.count) || 5;
    const level = parseInt(req.query.level) || 1;
    const unique = req.query.unique === 'true';
    
    // Generate questions based on params
    const questions = unique 
      ? generateUniqueQuestions(count)
      : Array.from({ length: count }, () => generateSingleDigitQuestion());
    
    res.json({
      success: true,
      data: {
        questions,
        count: questions.length,
        level
      }
    });
  } catch (error) {
    logger.error('Error generating questions:', error);
    res.status(500).json({
      success: false,
      error: {
        message: 'Error generating questions',
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
      }
    });
  }
};

/**
 * @route   POST /api/game/score
 * @desc    Update user's score
 * @access  Private (requires auth)
 */
const updateScore = async (req, res) => {
  try {
    const { score, gameId = 'math-asteroids' } = req.body;
    const userId = req.user.id;

    // Validate score
    if (typeof score !== 'number' || score < 0) {
      return res.status(400).json({
        success: false,
        error: {
          message: 'Score must be a positive number'
        }
      });
    }

    // Find user and update score
    const user = await User.findById(userId).select('-password');
    
    if (!user) {
      return res.status(404).json({
        success: false,
        error: {
          message: 'User not found'
        }
      });
    }

    // Only update if new score is higher than current score
    if (!user.score || score > user.score) {
      user.score = score;
      await user.save();
    }

    res.json({
      success: true,
      data: {
        user: {
          id: user._id,
          username: user.username,
          email: user.email,
          score: user.score
        },
        game: {
          id: gameId,
          submittedScore: score,
          highScore: user.score
        }
      }
    });
  } catch (error) {
    logger.error('Score update error:', error);
    res.status(500).json({
      success: false,
      error: {
        message: 'Error updating score',
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
      }
    });
  }
};

module.exports = {
  getQuestions,
  updateScore
}; 