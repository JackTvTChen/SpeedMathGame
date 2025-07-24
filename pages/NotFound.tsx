import React from 'react';
import { Link } from 'react-router-dom';
import { ROUTES } from '../routes';

const NotFound: React.FC = () => {
  return (
    <div className="not-found">
      <h1>404</h1>
      <h2>Page Not Found</h2>
      <p>The page you are looking for doesn't exist or has been moved.</p>
      <div className="not-found-links">
        <Link to={ROUTES.HOME} className="primary-link">
          Go to Home
        </Link>
        <Link to={ROUTES.DASHBOARD} className="secondary-link">
          Go to Dashboard
        </Link>
      </div>
    </div>
  );
};

export default NotFound; 