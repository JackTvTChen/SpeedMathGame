import React from 'react';
import './Dashboard.css';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Dashboard: React.FC = () => {
  const { state: authState } = useAuth();
  
  return (
    <div className="dashboard">
      <header className="dashboard-header">
        <h1>Welcome to the Math Game</h1>
        <p>Track your progress and play educational games</p>
        <div className="test-connection">TEST 314</div>
      </header>
      
      <div className="dashboard-container">
        <h1>Dashboard</h1>
        <div className="test-connection">TEST 314</div>
        
        <div className="dashboard-content">
          <section className="dashboard-stats">
            <h2>Your Stats</h2>
            <div className="stats-grid">
              <div className="stat-card">
                <h3>Games Played</h3>
                <p className="stat-value">0</p>
              </div>
              <div className="stat-card">
                <h3>High Score</h3>
                <p className="stat-value">0</p>
              </div>
            </div>
          </section>
          
          <section className="dashboard-games">
            <h2>Games</h2>
            <div className="games-grid">
              <div className="game-card">
                <h3>Math Quiz</h3>
                <p>Test your math skills!</p>
                <a href="/math-quiz" className="play-button">Play</a>
              </div>
              <div className="game-card">
                <h3>Math Quiz (Advanced)</h3>
                <p>Start at level 6 for experts!</p>
                <a href="/math-quiz?mode=advanced" className="play-button">Play</a>
              </div>
              <div className="game-card">
                <h3>Math Asteroids</h3>
                <p>Solve equations to destroy asteroids!</p>
                <a href="/math-asteroids" className="play-button">Play</a>
              </div>
              <div className="game-card">
                <h3>Asteroids (Advanced)</h3>
                <p>Start at level 6 for experts!</p>
                <a href="/math-asteroids?mode=advanced" className="play-button">Play</a>
              </div>
            </div>
          </section>
        </div>
      </div>

      {/* Developer Tools Section - Only show if user is an admin or test mode is enabled */}
      {(authState.user?.isAdmin || process.env.NODE_ENV === 'development') && (
        <div className="developer-tools">
          <h2>Developer Tools</h2>
          <p>These tools are only available to administrators and during development.</p>
          
          <div className="dev-tools-grid">
            <div className="tool-card">
              <h3>Test Generator</h3>
              <p>Test the question generation system at any level without playing through the game.</p>
              <Link to="/test-generator" className="view-button">Open Test Generator</Link>
            </div>
            
            <div className="tool-card">
              <h3>Level Calculator</h3>
              <p>Test the 10-point bracket level calculation system with various scores.</p>
              <Link to="/test-generator" className="view-button">Test Level Calculation</Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard; 