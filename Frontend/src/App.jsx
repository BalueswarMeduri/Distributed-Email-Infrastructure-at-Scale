import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoutes from './components/ProtectedRoutes';
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import SendNotification from './pages/SendNotification';
import CampaignDetails from './pages/CampaignDetails';

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route
            path="/dashboard"
            element={
              <ProtectedRoutes>
                <Dashboard />
              </ProtectedRoutes>
            }
          />
          <Route
            path="/send"
            element={
              <ProtectedRoutes>
                <SendNotification />
              </ProtectedRoutes>
            }
          />
          <Route
            path="/campaigns/:id"
            element={
              <ProtectedRoutes>
                <CampaignDetails />
              </ProtectedRoutes>
            }
          />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
