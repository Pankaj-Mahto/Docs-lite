
# [Google Docs Clone](https://docs-lite.onrender.com)

A **robust and feature-rich collaborative text editor** built with the MERN stack (MongoDB, Express, React, Node.js) and **Quill** for rich text editing. It supports **real-time collaboration**, allowing multiple users to edit documents simultaneously, with instant updates using **Socket.IO**. Users can also upload images via a custom toolbar, enhancing document creation and editing.

---

## 🚀 Live Demo

[View Live Demo](https://docs-lite.onrender.com)

---

## ✨ Features

* Real-time collaborative editing
* Create, edit, and save documents
* Upload images via a custom toolbar button
* Instant synchronization across all connected clients
* MongoDB integration for persistent document storage

---

## 🛠️ Technologies Used

* **Frontend:** React, Quill, Socket.IO-client, Vite
* **Backend:** Node.js, Express, Socket.IO, Multer, Mongoose
* **Database:** MongoDB

---

## 🗂️ Folder Structure

```
Google-Docs-Clone/
├─ client/           # React frontend
│  ├─ src/
│  │  ├─ components/ # Header, TextEditor, etc.
│  │  ├─ App.js
│  │  └─ index.js
│  ├─ public/
│  └─ package.json
├─ server/           # Express backend
│  ├─ uploads/       # Uploaded images
│  ├─ Document.js    # Mongoose schema
│  ├─ server.js
│  ├─ .env           # Environment variables
│  └─ package.json
```

---

## ⚙️ Setup & Installation

### 1. Clone the repository

```bash
git clone https://github.com/vasanthsai14/Google-Docs-Clone.git
cd Google-Docs-Clone
```

### 2. Install Client Dependencies

```bash
cd client
npm install
npm run dev
```

### 3. Install Server Dependencies

```bash
cd ../server
npm install
```

### 4. Configure Environment Variables

Create a `.env` file in the `server` directory:

```
MONGO_URI=your_mongodb_connection_string
```

### 5. Start the Server

```bash
npm start
```

### 6. Open in Browser

```
http://localhost:5173
```

---

## 🔌 How Real-Time Collaboration Works

We use **Socket.IO** to enable **instant synchronization** between clients. Socket.IO is a library for real-time, bidirectional communication between client and server.

### Key Concepts

* **Connection:** Establishes a link between client and server
* **Events:** Named messages passed back and forth
* **Broadcasting:** Sending updates to multiple clients simultaneously

### Example

**Server-side:**

```javascript
io.on("connection", (socket) => {
  socket.on("get-document", async (documentId) => {
    const document = await findOrCreateDocument(documentId);
    socket.join(documentId);
    socket.emit("load-document", { title: document.title, contents: document.data });

    socket.on("send-changes", (delta) => {
      socket.broadcast.to(documentId).emit("receive-changes", delta);
    });

    socket.on("save-document", async (data) => {
      await Document.findByIdAndUpdate(documentId, { data });
    });
  });
});
```

This ensures **all users see changes in real time**, just like Google Docs.

---

## 💡 License

MIT License

---
