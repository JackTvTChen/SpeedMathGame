import React from 'react';
import { useAuth } from '../context';

const Home: React.FC = () => {
  const { state, logout } = useAuth();
  const { user, isAuthenticated } = state;

  return (
    <div className="home-container">
      <h1>Welcome to Project Shooting Star</h1>
      
      {isAuthenticated ? (
        <div>
          <p>Welcome, {user?.username}!</p>
          <button onClick={logout}>Logout</button>
        </div>
      ) : (
        <p>Please log in to access your dashboard</p>
      )}
    </div>
  );
};

export default Home; 