// server/server.js
require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const { Server } = require('socket.io');
const http = require('http');
const multer = require('multer');
const path = require('path');
const Document = require('./Document');


const app = express();

const _dirname = path.resolve();

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "https://docs-lite.onrender.com",
    methods: ["GET", "POST"],
    allowedHeaders: ["Content-Type"],
  }
});

mongoose.connect(process.env.MONGO_URI).then(() => {
  console.log('MongoDB connected');
}).catch(err => {
  console.error('MongoDB connection error:', err);
});

app.use(cors({ origin: 'https://docs-lite.onrender.com' }));
app.use(express.json());
app.use(express.json({ limit: '500mb' }));
app.use(express.urlencoded({ limit: '500mb', extended: true }));

// FILE UPLOAD
const upload = multer({ 
  dest: 'uploads/',
  limits: { fileSize: 500 * 1024 * 1024 }
});

app.post('/upload', upload.single('image'), (req, res) => {
  const file = req.file;
  if (!file) {
    return res.status(400).json({ error: 'No file uploaded' });
  }
  const imageUrl = `https://docs-lite.onrender.com/uploads/${file.filename}`;
  res.status(200).json({ url: imageUrl });
});

app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

const defaultValue = "";

// ✅ New tracking objects
const activeUsers = {}; // { documentId: [usernames] }
const changeLogs = {};  // { documentId: [{ user, time }] }

io.on("connection", socket => {

  socket.on("get-document", async ({ documentId, username }) => {
    const document = await findOrCreateDocument(documentId);

    socket.join(documentId);
    socket.data.username = username;

    // ✅ Track users
    if (!activeUsers[documentId]) activeUsers[documentId] = [];
    if (!activeUsers[documentId].includes(username)) activeUsers[documentId].push(username);

    io.to(documentId).emit("active-users", activeUsers[documentId]);

    socket.emit("load-document", { 
      title: document.title, 
      contents: document.data,
      logs: changeLogs[documentId] || []
    });

    // ✅ Receive changes
    socket.on("send-changes", delta => {
      const user = socket.data.username;

      // ✅ Track change log
      if (!changeLogs[documentId]) changeLogs[documentId] = [];
      changeLogs[documentId].push({
        user,
        time: new Date().toLocaleTimeString()
      });

      // ✅ Broadcast change + username for highlighting
      socket.broadcast.to(documentId).emit("receive-changes", {
        delta,
        user
      });

      // ✅ Send updated logs to all
      io.to(documentId).emit("log-update", changeLogs[documentId]);
    });

    // ✅ Save document
    socket.on("save-document", async data => {
      await Document.findByIdAndUpdate(documentId, { data });
    });

    // ✅ On disconnect remove user
    socket.on("disconnect", () => {
      if (activeUsers[documentId]) {
        activeUsers[documentId] = activeUsers[documentId].filter(u => u !== socket.data.username);
        io.to(documentId).emit("active-users", activeUsers[documentId]);
      }
    });
  });
});

// Find or create document
async function findOrCreateDocument(id) {
  if (id == null) return;

  const document = await Document.findById(id);
  if (document) return document;
  return await Document.create({ _id: id, title: 'Untitled Document', data: defaultValue });
}

// REST API for CRUD
app.get('/documents', async (req, res) => {
  const documents = await Document.find();
  res.json(documents);
});

app.post('/documents', async (req, res) => {
  const { title = 'Untitled Document' } = req.body;
  const newDocument = await Document.create({ title, data: defaultValue });
  res.json(newDocument);
});

app.put('/documents/:id', async (req, res) => {
  const { title } = req.body;
  const document = await Document.findByIdAndUpdate(req.params.id, { title }, { new: true });
  res.json(document);
});

app.delete('/documents/:id', async (req, res) => {
  await Document.findByIdAndDelete(req.params.id);
  res.sendStatus(200);
});

app.use(express.static(path.join(_dirname, "/client/dist")));
app.get('*', (_,res) => {
    res.sendFile(path.resolve(_dirname, "client", "dist", "index.html"));
});


const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
