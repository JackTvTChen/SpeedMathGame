# Math Asteroids API

## Optional Authentication Implementation

The Math Asteroids game API is designed to support both authenticated users and guests, allowing anyone to play the game while preserving score persistence for registered users.

### API Structure

The API follows a split-access model:

#### Public Endpoints (No Authentication Required)

```
GET /api/game/questions
```

This endpoint serves math questions for the game and is intentionally **public** to allow:
- Guest users to play without authentication
- Questions to be loaded without sending JWT tokens
- Seamless gameplay experience for all users

#### Protected Endpoints (Authentication Required)

```
POST /api/game/score
```

This endpoint requires a valid JWT token and is protected to:
- Store high scores for authenticated users
- Ensure data integrity and prevent score manipulation
- Associate scores with specific user accounts

### Implementation Details

The routes are designed with optional authentication in mind:

```javascript
// game.routes.js
const express = require('express');
const router = express.Router();
const { getQuestions, updateScore } = require('../controllers/gameController');
const { protect } = require('../middleware/auth');

// Public route - no auth middleware
router.get('/questions', getQuestions);

// Protected route - requires JWT token
router.post('/score', protect, updateScore);

module.exports = router;
```

### Front-End Integration

The front-end is designed to:
1. Try to fetch questions from the server for all users
2. Save scores to the server only for authenticated users
3. Save scores to localStorage for guest users
4. Provide UI indicating that logging in will save scores permanently

### Local Fallback

If the API is unavailable, the front-end can generate questions locally, ensuring:
- The game remains playable even with API failures
- No service interruption for users 