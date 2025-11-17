// client/src/components/DocumentDashboard.jsx// client/src/components/DocumentDashboard.jsx
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import './DocumentDashboard.css';

function DocumentDashboard() {
  const [documents, setDocuments] = useState([]);
  const [newTitle, setNewTitle] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    axios.get('http://localhost:3001/documents').then(response => {
      setDocuments(response.data);
    });
  }, []);

  const createNewDocument = () => {
    const title = newTitle.trim() ? newTitle : 'Untitled Document';
    axios.post('http://localhost:3001/documents', { title }).then(response => {
      navigate(`/documents/${response.data._id}`);
    });
  };

  const deleteDocument = (id) => {
    axios.delete(`http://localhost:3001/documents/${id}`).then(() => {
      setDocuments(documents.filter(document => document._id !== id));
    });
  };

  const updateDocumentTitle = (id, title) => {
    axios.put(`http://localhost:3001/documents/${id}`, { title }).then(response => {
      setDocuments(documents.map(doc => (doc._id === id ? response.data : doc)));
    });
  };

  const openDocument = (id) => {
    navigate(`/documents/${id}`);
  };

  return (
    <div className="dashboard">
      <h1>Document Dashboard</h1>
      <input
        type="text"
        value={newTitle}
        onChange={(e) => setNewTitle(e.target.value)}
        placeholder="Enter document title"
      />
      <button onClick={createNewDocument}>Create New Document</button>
      <ul>
        {documents.map((document) => (
          <li key={document._id}>
            <input
              type="text"
              value={document.title}
              onChange={(e) => updateDocumentTitle(document._id, e.target.value)}
              onBlur={(e) => updateDocumentTitle(document._id, e.target.value)}
            />
            <button onClick={() => openDocument(document._id)}>Open</button>
            <button onClick={() => deleteDocument(document._id)}>Delete</button>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default DocumentDashboard;

