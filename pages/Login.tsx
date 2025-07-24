import React, { useState, FormEvent, useEffect } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context';

interface LocationState {
  from?: string;
}

interface LoginFormData {
  email: string;
  password: string;
}

interface FormErrors {
  email?: string;
  password?: string;
  general?: string;
}

const Login: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { state, login, clearError } = useAuth();
  const { isAuthenticated, isLoading, error } = state;
  
  // Get the path the user was trying to access
  const locationState = location.state as LocationState;
  const from = locationState?.from || '/dashboard';

  const [formData, setFormData] = useState<LoginFormData>({
    email: '',
    password: '',
  });
  const [formErrors, setFormErrors] = useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      navigate(from, { replace: true });
    }
  }, [isAuthenticated, navigate, from]);

  const validateForm = (): boolean => {
    const errors: FormErrors = {};
    let isValid = true;

    if (!formData.email) {
      errors.email = 'Username is required';
      isValid = false;
    }

    if (!formData.password) {
      errors.password = 'Password is required';
      isValid = false;
    } else if (formData.password.length < 6) {
      errors.password = 'Password must be at least 6 characters';
      isValid = false;
    }

    setFormErrors(errors);
    return isValid;
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
    
    // Clear specific field error when user starts typing again
    if (formErrors[name as keyof FormErrors]) {
      setFormErrors({
        ...formErrors,
        [name]: undefined,
      });
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    clearError();
    
    if (validateForm()) {
      setIsSubmitting(true);
      
      try {
        await login(formData.email, formData.password);
        // Redirect is handled by the useEffect that watches isAuthenticated
      } catch (err) {
        // Any errors from login are handled by the context
      } finally {
        setIsSubmitting(false);
      }
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-container">
        <h1>Log In</h1>
        
        {from !== '/dashboard' && (
          <div className="redirect-message">
            Please log in to access the requested page.
          </div>
        )}
        
        {error && (
          <div className="error-message">
            {error}
            <button onClick={clearError} className="close-btn">×</button>
          </div>
        )}
        
        <form onSubmit={handleSubmit} noValidate>
          <div className="form-group">
            <label htmlFor="email">Username</label>
            <input
              type="text"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              className={formErrors.email ? 'error' : ''}
              disabled={isLoading || isSubmitting}
            />
            {formErrors.email && <div className="field-error">{formErrors.email}</div>}
          </div>
          
          <div className="form-group">
            <label htmlFor="password">Password</label>
            <input
              type="password"
              id="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              className={formErrors.password ? 'error' : ''}
              disabled={isLoading || isSubmitting}
            />
            {formErrors.password && <div className="field-error">{formErrors.password}</div>}
          </div>
          
          <button 
            type="submit" 
            className="auth-button"
            disabled={isLoading || isSubmitting}
          >
            {isLoading || isSubmitting ? 'Logging in...' : 'Log In'}
          </button>
        </form>
        
        <div className="auth-footer">
          <p>
            Don't have an account? <Link to="/register">Register</Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login; 