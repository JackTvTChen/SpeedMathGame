import React, { useState } from 'react';
import './TestGenerator.css';
import { generateQuestion, generateUniqueQuestions, getLevelByScore } from '../games/MathQuiz/utils/questionGenerator';

interface QuestionData {
  text: string;
  answer: number;
}

const TestGenerator: React.FC = () => {
  const [level, setLevel] = useState<number>(1);
  const [count, setCount] = useState<number>(10);
  const [generatedQuestions, setGeneratedQuestions] = useState<QuestionData[]>([]);

  const handleLevelChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newLevel = parseInt(e.target.value);
    setLevel(newLevel);
  };

  const handleCountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newCount = parseInt(e.target.value);
    if (newCount >= 1) {
      setCount(newCount);
    }
  };

  const generateQuestions = () => {
    // Use the question bank to get unique questions for this level
    const questions = generateUniqueQuestions(count, level);
    setGeneratedQuestions(questions);
  };

  const handleClear = () => {
    setGeneratedQuestions([]);
  };

  // Calculate statistics about operations used
  const getOperationStats = () => {
    const stats = {
      addition: 0,
      subtraction: 0,
      multiplication: 0,
      division: 0,
      mixed: 0
    };
    
    generatedQuestions.forEach(q => {
      if (q.text.includes('+')) stats.addition++;
      else if (q.text.includes('-')) stats.subtraction++;
      else if (q.text.includes('×')) stats.multiplication++;
      else if (q.text.includes('÷')) stats.division++;
    });
    
    return stats;
  };

  const operationStats = getOperationStats();

  return (
    <div className="test-generator">
      <h1>Math Quiz Question Bank Test Tool</h1>
      
      <p className="instructions">
        This tool helps you test the question bank at specific levels.
      </p>
      
      <div className="controls">
        <div className="input-group">
          <label htmlFor="level">Level (1-15):</label>
          <input
            type="range"
            id="level"
            min="1"
            max="15"
            value={level}
            onChange={handleLevelChange}
          />
          <div className="level-display">Level: {level}</div>
        </div>
        
        <div className="input-group">
          <label htmlFor="count">Number of Questions:</label>
          <input
            type="number"
            id="count"
            min="1"
            max="100"
            value={count}
            onChange={handleCountChange}
          />
        </div>
        
        <div className="button-group">
          <button className="generate-button" onClick={generateQuestions}>
            Get Questions from Bank
          </button>
          
          {generatedQuestions.length > 0 && (
            <button className="clear-button" onClick={handleClear}>
              Clear Results
            </button>
          )}
        </div>
      </div>
      
      {generatedQuestions.length > 0 && (
        <div className="results">
          <h2>Questions from Bank (Level {level})</h2>
          
          <div className="statistics">
            <div className="stat-section">
              <h3>Operations:</h3>
              <div className="stat-item">Addition: {operationStats.addition}</div>
              <div className="stat-item">Subtraction: {operationStats.subtraction}</div>
              <div className="stat-item">Multiplication: {operationStats.multiplication}</div>
              <div className="stat-item">Division: {operationStats.division}</div>
            </div>
          </div>
          
          <ul className="question-list">
            {generatedQuestions.map((q, index) => (
              <li key={index} className="question-item">
                <div className="question-number">Question {index + 1}</div>
                <div className="question-expression">
                  Expression: <strong>{q.text}</strong>
                </div>
                <div className="question-answer">
                  Answer: <strong>{q.answer}</strong>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default TestGenerator;