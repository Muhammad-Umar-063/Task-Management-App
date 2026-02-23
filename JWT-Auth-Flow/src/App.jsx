import React from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import Login from "./Pages/Login";
import SignUp from "./Pages/SignUp";
import Products from "./Pages/Products";
import Admin from "./Pages/Admin";
import Logout from "./Pages/Logout";
import ProtectedRoute from "./Components/ProtectedRoute";
import PublicRoute from "./Components/PublicRoute";
import AddTask from "./Pages/AddTask";
import EditTask from "./Pages/EditTask";

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={
          <PublicRoute><Login /></PublicRoute>
        } />
        <Route path="/register" element={
          <PublicRoute><SignUp /></PublicRoute>
        } />
        <Route path="/dashboard" element={
          <ProtectedRoute><Products /></ProtectedRoute>
        } />
        <Route path="/tasks" element={
          <ProtectedRoute><AddTask /></ProtectedRoute>
        } />
        <Route path="/task/:id" element={
          <ProtectedRoute><EditTask /></ProtectedRoute>
        } />
        <Route path="/admin" element={
          <ProtectedRoute><Admin /></ProtectedRoute>
        } />
        <Route path="/logout" element={
          <ProtectedRoute><Logout /></ProtectedRoute>
        } />

        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </Router>
  );
}

export default App;