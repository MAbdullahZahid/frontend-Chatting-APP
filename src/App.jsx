import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { useAuth } from './context/AuthContext.jsx';

import AuthLayout from './layouts/authLayouts.jsx';
import UserLayout from './layouts/userLayouts.jsx';

const AppRoutes = () => {
  const { isAuthenticated } = useAuth();

  return (
    <Routes>
      {!isAuthenticated ? (
        <>
        
          <Route path="/auth/*" element={<AuthLayout />} />
          <Route path="*" element={<Navigate to="/auth/login" replace />} />
        </>
      ) : (
        <>
       
          <Route path="/user/*" element={<UserLayout />} />
          <Route path="*" element={<Navigate to="/user/dashboard" replace />} />
        </>
      )}
    </Routes>
  );
};


const App = () => {
  return (
    <Router>
      <AppRoutes />
    </Router>
  );
};

export default App;