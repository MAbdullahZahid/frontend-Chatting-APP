import React, { useState } from "react";
import axios from "axios";
const BackendURL = import.meta.env.VITE_BACKEND_BASE_URL;
export default function Signup() {
  const [formData, setFormData] = useState({
    name: "",
    username: "",
    password: "",
    phoneNo: "",
    about: ""
  });

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setError("");
  };

  const validateForm = () => {
    if (!formData.name.trim() || formData.name.length < 3) {
      return "Full name must be at least 3 characters";
    }
    if (!formData.username.trim() || formData.username.length < 3) {
      return "Username must be at least 3 characters";
    }
    if (!formData.password.trim() || formData.password.length < 6) {
      return "Password must be at least 6 characters";
    }
    if (!formData.phoneNo.trim()) {
      return "Phone number is required";
    }
    const phoneRegex = /^[0-9]{10,15}$/;
    if (!phoneRegex.test(formData.phoneNo)) {
      return "Invalid phone number";
    }
    return null;
  };

  const handleSignup = async (e) => {
    e.preventDefault();
    setError("");

    const validationError = validateForm();
    if (validationError) {
      setError(validationError);
      return;
    }

    try {
      setLoading(true);
      const res = await axios.post(`${BackendURL}/api/signup`, formData, {
        headers: { "Content-Type": "application/json" }
      });

      alert("Signup successful! You can now login.");
      window.close();
    } catch (err) {
      if (err.response) {
        setError(err.response.data.message || "Signup failed");
      } else {
        setError("Server not reachable");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="signup-container">
      <div className="signup-card">
        <h2>Create your account</h2>

        {error && (
          <div className="error-message">
            <svg className="error-icon" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
            <p>{error}</p>
          </div>
        )}

        <form onSubmit={handleSignup} className="signup-form">
          <div className="form-group">
            <label htmlFor="name">Full Name</label>
            <input
              id="name"
              name="name"
              type="text"
              value={formData.name}
              onChange={handleChange}
              minLength={3}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="username">Username</label>
            <input
              id="username"
              name="username"
              type="text"
              value={formData.username}
              onChange={handleChange}
              minLength={3}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">Password</label>
            <input
              id="password"
              name="password"
              type="password"
              value={formData.password}
              onChange={handleChange}
              minLength={6}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="phoneNo">Phone Number</label>
            <input
              id="phoneNo"
              name="phoneNo"
              type="tel"
              value={formData.phoneNo}
              onChange={handleChange}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="about">About (Optional)</label>
            <textarea
              id="about"
              name="about"
              rows={3}
              value={formData.about}
              onChange={handleChange}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className={loading ? "submit-btn loading" : "submit-btn"}
          >
            {loading ? (
              <>
                <span className="spinner"></span>
                Signing up...
              </>
            ) : (
              'Sign up'
            )}
          </button>
        </form>
      </div>

      <style jsx>{`
        .signup-container {
          min-height: 100vh;
          background-color: #f8f9fa;
          display: flex;
          flex-direction: column;
          justify-content: center;
          align-items: center;
          padding: 20px;
        }

        .signup-card {
          background-color: white;
          border-radius: 8px;
          box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
          padding: 40px;
          width: 100%;
          max-width: 450px;
        }

        h2 {
          text-align: center;
          color: #2d3748;
          font-size: 24px;
          margin-bottom: 30px;
          font-weight: 600;
        }

        .error-message {
          background-color: #fef2f2;
          border-left: 4px solid #ef4444;
          padding: 12px;
          margin-bottom: 20px;
          display: flex;
          align-items: center;
          border-radius: 4px;
        }

        .error-icon {
          width: 20px;
          height: 20px;
          color: #ef4444;
          margin-right: 10px;
          flex-shrink: 0;
        }

        .error-message p {
          color: #b91c1c;
          font-size: 14px;
          margin: 0;
        }

        .signup-form {
          display: flex;
          flex-direction: column;
          gap: 20px;
        }

        .form-group {
          display: flex;
          flex-direction: column;
          gap: 6px;
        }

        label {
          font-size: 14px;
          color: #4a5568;
          font-weight: 500;
        }

        input, textarea {
          padding: 10px 12px;
          border: 1px solid #e2e8f0;
          border-radius: 6px;
          font-size: 14px;
          transition: border-color 0.2s;
        }

        input:focus, textarea:focus {
          outline: none;
          border-color: #3182ce;
          box-shadow: 0 0 0 3px rgba(49, 130, 206, 0.2);
        }

        textarea {
          resize: vertical;
          min-height: 80px;
        }

        .submit-btn {
          background-color: #3182ce;
          color: white;
          border: none;
          padding: 12px;
          border-radius: 6px;
          font-weight: 500;
          cursor: pointer;
          transition: background-color 0.2s;
          display: flex;
          justify-content: center;
          align-items: center;
          gap: 8px;
        }

        .submit-btn:hover {
          background-color: #2c5282;
        }

        .submit-btn:disabled {
          background-color: #a0aec0;
          cursor: not-allowed;
        }

        .spinner {
          width: 16px;
          height: 16px;
          border: 2px solid rgba(255, 255, 255, 0.3);
          border-radius: 50%;
          border-top-color: white;
          animation: spin 1s ease-in-out infinite;
        }

        @keyframes spin {
          to { transform: rotate(360deg); }
        }

        @media (max-width: 480px) {
          .signup-card {
            padding: 30px 20px;
          }
        }
      `}</style>
    </div>
  );
}