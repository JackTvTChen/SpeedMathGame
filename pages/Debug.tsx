import React, { useState } from 'react';
import { API_BASE_URL } from '../utils/apiConfig';

const Debug: React.FC = () => {
  const [status, setStatus] = useState<string>('Ready to test');
  const [apiUrl, setApiUrl] = useState<string>(API_BASE_URL);
  const [response, setResponse] = useState<string>('');

  const testConnection = async () => {
    try {
      setStatus('Testing connection...');
      const result = await fetch(`${apiUrl}/health`);
      const data = await result.json();
      setResponse(JSON.stringify(data, null, 2));
      setStatus('Connection test completed');
    } catch (error) {
      setResponse(error instanceof Error ? error.message : 'Unknown error');
      setStatus('Connection test failed');
    }
  };

  const testRegister = async () => {
    try {
      setStatus('Testing registration...');
      
      const testUser = {
        username: `test_${Date.now()}`,
        email: `test_${Date.now()}@example.com`,
        password: 'Test123!'
      };
      
      const result = await fetch(`${apiUrl}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(testUser)
      });
      
      const data = await result.json();
      setResponse(JSON.stringify(data, null, 2));
      setStatus('Registration test completed');
    } catch (error) {
      setResponse(error instanceof Error ? error.message : 'Unknown error');
      setStatus('Registration test failed');
    }
  };

  return (
    <div style={{ padding: '20px', maxWidth: '800px', margin: '0 auto' }}>
      <h1>API Connection Debug</h1>
      
      <div style={{ marginBottom: '20px' }}>
        <h2>Current Environment</h2>
        <p><strong>Frontend URL:</strong> {window.location.origin}</p>
        <p><strong>API URL:</strong> {apiUrl}</p>
        <input 
          type="text" 
          value={apiUrl} 
          onChange={(e) => setApiUrl(e.target.value)}
          style={{ width: '100%', padding: '8px', marginTop: '10px' }}
        />
      </div>
      
      <div style={{ marginBottom: '20px' }}>
        <h2>Test API Connection</h2>
        <button 
          onClick={testConnection}
          style={{ padding: '10px', marginRight: '10px' }}
        >
          Test Health Endpoint
        </button>
        
        <button 
          onClick={testRegister}
          style={{ padding: '10px' }}
        >
          Test Registration
        </button>
        
        <p><strong>Status:</strong> {status}</p>
      </div>
      
      <div>
        <h2>Response</h2>
        <pre 
          style={{ 
            background: '#f4f4f4', 
            padding: '15px', 
            borderRadius: '5px',
            maxHeight: '300px',
            overflow: 'auto'
          }}
        >
          {response || 'No response yet'}
        </pre>
      </div>
    </div>
  );
};

export default Debug; 