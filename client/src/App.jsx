// client/src/App.jsx
import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import DocumentDashboard from './components/DocumentDashboard';
import TextEditor from './components/TextEditor';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<DocumentDashboard />} />
        <Route path="/documents/:id" element={<TextEditor />} />
      </Routes>
    </Router>
  );
}

export default App;
