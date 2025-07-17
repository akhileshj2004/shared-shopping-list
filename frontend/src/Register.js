import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom'; // Import useNavigate

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || 'http://localhost:5000';

function Register() { // Removed onSwitchToLogin prop
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [message, setMessage] = useState('');
  const [isError, setIsError] = useState(false);
  const navigate = useNavigate(); // Initialize useNavigate

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage('');
    setIsError(false);

    if (password !== confirmPassword) {
      setMessage('Passwords do not match.');
      setIsError(true);
      return;
    }

    try {
      const response = await fetch(`${BACKEND_URL}/api/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, password }),
      });

      const data = await response.json();

      if (response.ok) {
        setMessage(data.message || 'Registration successful! You can now log in.');
        setUsername('');
        setPassword('');
        setConfirmPassword('');
        setTimeout(() => navigate('/login'), 2000); // Automatically switch to login
      } else {
        setMessage(data.message || 'Registration failed.');
        setIsError(true);
      }
    } catch (err) {
      console.error('Registration request failed:', err);
      setMessage('Network error or server unavailable.');
      setIsError(true);
    }
  };

  return (
    <div style={styles.container}>
      <h2 style={styles.heading}>Register</h2>
      <form onSubmit={handleSubmit} style={styles.form}>
        <div style={styles.formGroup}>
          <label htmlFor="username" style={styles.label}>Username:</label>
          <input
            type="text"
            id="username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
            style={styles.input}
          />
        </div>
        <div style={styles.formGroup}>
          <label htmlFor="password" style={styles.label}>Password:</label>
          <input
            type="password"
            id="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            style={styles.input}
          />
        </div>
        <div style={styles.formGroup}>
          <label htmlFor="confirmPassword" style={styles.label}>Confirm Password:</label>
          <input
            type="password"
            id="confirmPassword"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
            style={styles.input}
          />
        </div>
        {message && (
          <p style={isError ? styles.error : styles.success}>{message}</p>
        )}
        <button type="submit" style={styles.button}>Register</button>
      </form>
      <p style={styles.switchText}>
        Already have an account?{' '}
        <span onClick={() => navigate('/login')} style={styles.switchLink}> {/* Use navigate */}
          Login here.
        </span>
      </p>
    </div>
  );
}

const styles = {
  container: {
    maxWidth: '400px',
    margin: '50px auto',
    padding: '30px',
    border: '1px solid #ddd',
    borderRadius: '10px',
    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
    backgroundColor: '#fff',
    textAlign: 'center',
  },
  heading: {
    marginBottom: '25px',
    color: '#333',
    fontSize: '2em',
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '15px',
  },
  formGroup: {
    textAlign: 'left',
  },
  label: {
    display: 'block',
    marginBottom: '8px',
    fontWeight: 'bold',
    color: '#555',
  },
  input: {
    width: '100%',
    padding: '12px',
    border: '1px solid #ccc',
    borderRadius: '6px',
    fontSize: '1em',
    boxSizing: 'border-box',
  },
  button: {
    padding: '12px 20px',
    backgroundColor: '#28a745',
    color: 'white',
    border: 'none',
    borderRadius: '6px',
    fontSize: '1.1em',
    cursor: 'pointer',
    transition: 'background-color 0.3s ease',
  },
  buttonHover: {
    backgroundColor: '#218838',
  },
  error: {
    color: '#dc3545',
    marginTop: '10px',
    fontWeight: 'bold',
  },
  success: {
    color: '#28a745',
    marginTop: '10px',
    fontWeight: 'bold',
  },
  switchText: {
    marginTop: '20px',
    color: '#666',
  },
  switchLink: {
    color: '#007bff',
    cursor: 'pointer',
    textDecoration: 'underline',
  },
};

export default Register;
