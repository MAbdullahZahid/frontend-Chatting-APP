import React, { useState } from "react";
import axios from "axios";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";


const BackendURL = import.meta.env.VITE_BACKEND_BASE_URL;

export default function Home() {
     const navigate = useNavigate();
  const { login } = useAuth();
  const [formData, setFormData] = useState({
    usernameOrPhone: "",
    password: ""
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setError("");
  };

  const validateForm = () => {
    if (!formData.usernameOrPhone.trim()) {
      return "Username or phone number is required";
    }
    if (!formData.password.trim()) {
      return "Password is required";
    }
    return null;
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");

    const validationError = validateForm();
    if (validationError) {
      setError(validationError);
      return;
    }

    try {
      setLoading(true);
      const res = await fetch(`${BackendURL}/api/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          identifier: formData.usernameOrPhone, 
          password: formData.password
        })
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || "Login failed");
      }

      const data = await res.json();
      login(data.token, data.userId);
    

    } catch (err) {
      setError(err.message || "Server not reachable");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <div className="login-card">
        <div className="app-logo">
          <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M8 10H8.01M12 10H12.01M16 10H16.01M9 16H5C3.89543 16 3 15.1046 3 14V6C3 4.89543 3.89543 4 5 4H19C20.1046 4 21 4.89543 21 6V14C21 15.1046 20.1046 16 19 16H14L9 21V16Z" stroke="#4F46E5" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        <h1>Welcome to TalkZone</h1>
        <p class="author">by Abdullah Zahid</p>
        </div>

        {error && (
          <div className="error-message">
            <svg className="error-icon" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleLogin} className="login-form">
          <div className="form-group">
            <label htmlFor="usernameOrPhone">Username or Phone</label>
            <input
              type="text"
              id="usernameOrPhone"
              name="usernameOrPhone"
              value={formData.usernameOrPhone}
              onChange={handleChange}
              required
              placeholder="Enter username or phone number"
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">Password</label>
            <input
              type="password"
              id="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              required
              placeholder="Enter your password"
            />
          </div>

          <button
            type="submit"
            className={`login-button ${loading ? 'loading' : ''}`}
            disabled={loading}
          >
            {loading ? (
              <>
                <span className="spinner"></span>
                Logging in...
              </>
            ) : 'Login'}
          </button>
        </form>

        <div className="divider">or</div>

        <button
          className="signup-button"
          onClick={(e) => {
            e.preventDefault();
            navigate("/auth/signup");
          }}
        >
          Create new account
        </button>
 <footer className="footer">
        <p>© {new Date().getFullYear()} TalkZone. All rights reserved by Abdullah Zahid</p>
      </footer>
      
      </div>

     

      <style jsx>{`
        .login-container {
          min-height: 100vh;
          display: flex;
          justify-content: center;
          align-items: center;
          background-color: #f3f4f6;
          padding: 20px;
        }

        .login-card {
          background: white;
          border-radius: 12px;
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
          padding: 40px;
          width: 100%;
          max-width: 420px;
          text-align: center;
        }

        .app-logo {
          margin-bottom: 32px;
          display: flex;
          flex-direction: column;
          align-items: center;
        }

        .app-logo svg {
          width: 48px;
          height: 48px;
          margin-bottom: 16px;
        }

        .app-logo h1 {
          font-size: 24px;
          font-weight: 600;
          color: #1f2937;
          margin: 0;
        }

        .error-message {
          background-color: #fef2f2;
          color: #b91c1c;
          padding: 12px;
          border-radius: 8px;
          margin-bottom: 20px;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          font-size: 14px;
        }

        .error-icon {
          width: 20px;
          height: 20px;
          flex-shrink: 0;
        }
           .author {
            color: #1f2937;
            font-size: 1.1rem;
            font-weight: 600;
           
        }

        .login-form {
          display: flex;
          flex-direction: column;
          gap: 20px;
        }

        .form-group {
          display: flex;
          flex-direction: column;
          gap: 8px;
          text-align: left;
        }

        label {
          font-size: 14px;
          font-weight: 500;
          color: #4b5563;
        }

        input {
          padding: 12px 16px;
          border: 1px solid #e5e7eb;
          border-radius: 8px;
          font-size: 14px;
          transition: all 0.2s;
        }

        input:focus {
          outline: none;
          border-color: #6366f1;
          box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.2);
        }

        input::placeholder {
          color: #9ca3af;
        }

        .login-button {
          background-color: #4f46e5;
          color: white;
          border: none;
          padding: 14px;
          border-radius: 8px;
          font-weight: 500;
          cursor: pointer;
          transition: background-color 0.2s;
          display: flex;
          justify-content: center;
          align-items: center;
          gap: 8px;
        }

        .login-button:hover {
          background-color: #4338ca;
        }

        .login-button:disabled {
          background-color: #a5b4fc;
          cursor: not-allowed;
        }

        .spinner {
          width: 18px;
          height: 18px;
          border: 2px solid rgba(255, 255, 255, 0.3);
          border-radius: 50%;
          border-top-color: white;
          animation: spin 1s ease-in-out infinite;
        }

        @keyframes spin {
          to { transform: rotate(360deg); }
        }

        .divider {
          display: flex;
          align-items: center;
          margin: 20px 0;
          color: #9ca3af;
          font-size: 14px;
        }

        .divider::before, .divider::after {
          content: "";
          flex: 1;
          border-bottom: 1px solid #e5e7eb;
        }

        .divider::before {
          margin-right: 16px;
        }

        .divider::after {
          margin-left: 16px;
        }

        .signup-button {
          width: 100%;
          padding: 14px;
          background-color: white;
          color: #4f46e5;
          border: 1px solid #e5e7eb;
          border-radius: 8px;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s;
        }

        .signup-button:hover {
          background-color: #f5f5ff;
          border-color: #c7d2fe;
        }

        .footer {
    width: 100%;
    text-align: center;
    padding: 20px 0;
    color: #6b7280;
    font-size: 14px;
    margin-top: 40px;
  }

  @media (max-width: 480px) {
    .footer {
      margin-top: 20px;
    }
  }

        @media (max-width: 480px) {
          .login-card {
            padding: 32px 24px;
          }
        }
      `}</style>
    </div>
  );
}