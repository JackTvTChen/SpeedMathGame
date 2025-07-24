import React, { useEffect, useState } from 'react';
import { useAuth } from '../context';
import './Profile.css';

interface ProfileData {
  username: string;
  email: string;
  topScore: number;
  profileImage?: string;
  gamesPlayed: number;
  problemsSolved: number;
  currentStreak: number;
}

const Profile: React.FC = () => {
  const { state } = useAuth();
  const [profileData, setProfileData] = useState<ProfileData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchProfileData = async () => {
      try {
        setIsLoading(true);
        // In debug mode, use mock data
        if (import.meta.env.VITE_DEBUG_MODE === 'true') {
          setProfileData({
            username: state.user?.username || 'Debug User',
            email: state.user?.email || 'debug@example.com',
            topScore: 1000,
            profileImage: 'https://api.dicebear.com/7.x/avataaars/svg?seed=debug',
            gamesPlayed: 25,
            problemsSolved: 150,
            currentStreak: 7
          });
        } else {
          // TODO: Implement actual API call when backend is ready
          const response = await fetch('/api/profile');
          if (!response.ok) throw new Error('Failed to fetch profile data');
          const data = await response.json();
          setProfileData(data);
        }
      } catch (err) {
        setError('Failed to load profile data');
        console.error('Profile fetch error:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchProfileData();
  }, [state.user]);

  if (isLoading) {
    return (
      <div className="profile-container loading">
        <div className="loading-spinner"></div>
        <p>Loading profile...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="profile-container error">
        <h2>Error</h2>
        <p>{error}</p>
        <button onClick={() => window.location.reload()}>Retry</button>
      </div>
    );
  }

  if (!profileData) {
    return (
      <div className="profile-container error">
        <h2>No Profile Data</h2>
        <p>Could not load your profile information.</p>
      </div>
    );
  }

  return (
    <div className="profile-container">
      <div className="profile-header">
        <div className="profile-image-container">
          <img 
            src={profileData.profileImage} 
            alt={`${profileData.username}'s profile`}
            className="profile-image"
          />
        </div>
        <div className="profile-info">
          <h2>{profileData.username}</h2>
          <p className="email">{profileData.email}</p>
        </div>
      </div>

      <div className="profile-stats">
        <div className="stat-card">
          <h3>Top Score</h3>
          <p>{profileData.topScore}</p>
        </div>
        <div className="stat-card">
          <h3>Games Played</h3>
          <p>{profileData.gamesPlayed}</p>
        </div>
        <div className="stat-card">
          <h3>Problems Solved</h3>
          <p>{profileData.problemsSolved}</p>
        </div>
        <div className="stat-card">
          <h3>Current Streak</h3>
          <p>{profileData.currentStreak} days</p>
        </div>
      </div>
    </div>
  );
};

export default Profile; 