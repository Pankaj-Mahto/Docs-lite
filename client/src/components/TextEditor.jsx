// client/src/components/TextEditor.jsx
import React, { useCallback, useEffect, useState } from "react";
import Quill from "quill";
import "quill/dist/quill.snow.css";
import { io } from "socket.io-client";
import { useParams, useNavigate } from "react-router-dom";
import QuillCursors from "quill-cursors";
import Header from "./Header";
import Table from "quill-table-ui";
import "quill-table-ui/dist/index.css";
import { jsPDF } from "jspdf";
import html2canvas from "html2canvas";
import axios from "axios";
import "./TextEditor.css";

// Register Quill modules
Quill.register("modules/cursors", QuillCursors);
Quill.register({ "modules/table": Table }, true);

/* ---------- RULER CONSTANTS ---------- */
const PX_PER_INCH = 96;
const PX_PER_CM = PX_PER_INCH / 2.54;
const MARK_EVERY_PX = PX_PER_INCH;
const SUBMARK_EVERY_PX = PX_PER_INCH / 8;

function pxToIndent(px, unit) {
  return unit === "in" ? px / PX_PER_INCH : px / PX_PER_CM;
}
function indentToPx(indent, unit) {
  return unit === "in" ? indent * PX_PER_INCH : indent * PX_PER_CM;
}

/* ---------- TOOLBAR ---------- */
const SAVE_INTERVAL_MS = 1000;
const TOOLBAR_OPTIONS = [
  [{ header: [1, 2, 3, false] }],
  [{ font: [] }],
  [{ size: ["small", false, "large", "huge"] }],
  [{ list: "ordered" }, { list: "bullet" }],
  ["bold", "italic", "underline", "strike"],
  [{ color: [] }, { background: [] }],
  ["image"],
];

export default function TextEditor() {
  const { id: documentId } = useParams();
  const navigate = useNavigate();
  const [socket, setSocket] = useState(null);
  const [quill, setQuill] = useState(null);

  const [documentTitle, setDocumentTitle] = useState("Loading...");
  const [activeUsers, setActiveUsers] = useState([]);
  const [changeLogs, setChangeLogs] = useState([]);
  const [showLogs, setShowLogs] = useState(false);
  const [showRuler, setShowRuler] = useState(false);
  const [showComments, setShowComments] = useState(false);
  const [comments, setComments] = useState([]);
 
  const [rulerUnit, setRulerUnit] = useState("in");
  const [leftIndent, setLeftIndent] = useState(0);
  const [rightIndent, setRightIndent] = useState(0);
  const [firstLineIndent, setFirstLineIndent] = useState(0);
  const [rulerDragging, setRulerDragging] = useState(null);

  const username = "User-" + Math.floor(Math.random() * 10000);

  /* ---------- Socket.IO ---------- */
  useEffect(() => {
    const s = io("https://docs-lite.onrender.com");
    setSocket(s);
    return () => s.disconnect();
  }, []);

  useEffect(() => {
    if (!socket || !quill) return;
    socket.once("load-document", ({ contents, title, logs }) => {
      quill.setContents(contents);
      quill.enable();
      setDocumentTitle(title);
      if (logs) setChangeLogs(logs);
    });
    socket.emit("get-document", { documentId, username });
  }, [socket, quill, documentId]);

  useEffect(() => {
    if (!socket) return;
    socket.on("active-users", users => setActiveUsers(users));
    return () => socket.off("active-users");
  }, [socket]);

  useEffect(() => {
    if (!socket) return;
    socket.on("log-update", logs => setChangeLogs(logs));
    return () => socket.off("log-update");
  }, [socket]);

  useEffect(() => {
    if (!socket || !quill) return;
    const interval = setInterval(() => {
      socket.emit("save-document", quill.getContents());
    }, SAVE_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [socket, quill]);

  useEffect(() => {
    if (!socket || !quill) return;
    socket.on("receive-changes", ({ delta, user }) => {
      quill.updateContents(delta);
      const cursorColor = stringToColor(user);
      const cursors = quill.getModule("cursors");
      cursors.createCursor(user, user, cursorColor);
      const pos = quill.getSelection() || { index: 0 };
      cursors.moveCursor(user, pos);
    });
    return () => socket.off("receive-changes");
  }, [socket, quill]);

  useEffect(() => {
    if (!socket || !quill) return;
    const handler = (delta, oldDelta, source) => {
      if (source !== "user") return;
      socket.emit("send-changes", delta);
    };
    quill.on("text-change", handler);
    return () => quill.off("text-change", handler);
  }, [socket, quill]);

  /* ---------- Initialize Quill ---------- */
  const wrapperRef = useCallback(wrapper => {
    if (!wrapper) return;
    wrapper.innerHTML = "";
    const editor = document.createElement("div");
    wrapper.append(editor);

    const q = new Quill(editor, {
      theme: "snow",
      modules: {
        toolbar: TOOLBAR_OPTIONS,
        cursors: true,
        table: true,
        history: { delay: 1000, maxStack: 100 },
      },
      bounds: ".quill-editor-container",
    });

    q.disable();
    q.setText("Loading...");
    setQuill(q);
  }, []);

  /* ---------- Utility ---------- */
  function stringToColor(str) {
    let hash = 0;
    for (let i = 0; i < str.length; i++)
      hash = str.charCodeAt(i) + ((hash << 5) - hash);
    const c = (hash & 0x00FFFFFF).toString(16).toUpperCase();
    return "#" + "000000".substring(0, 6 - c.length) + c;
  }

  function saveNow() {
    if (socket && quill) {
      socket.emit("save-document", quill.getContents());
      alert("Document Saved");
    }
  }

  /* ---------- Insert Functions ---------- */
  function insertImage() {
    if (!quill) return;

    const input = document.createElement("input");
    input.setAttribute("type", "file");
    input.setAttribute("accept", "image/*");
    input.click();

    input.onchange = async () => {
      if (input.files && input.files[0]) {
        const file = input.files[0];
        const reader = new FileReader();
        reader.onload = (e) => {
          const range = quill.getSelection(true);
          quill.insertEmbed(range.index, "image", e.target.result, "user");
          quill.setSelection(range.index + 1);
        };
        reader.readAsDataURL(file);
      }
    };
  }

  function insertLink() {
    if (!quill) return;
    const url = prompt("Enter link URL");
    const text = prompt("Enter link text");
    if (url && text) {
      const range = quill.getSelection(true);
      quill.insertText(range.index, text, "link", url);
      quill.setSelection(range.index + text.length);
    }
  }

  function insertTable() {
    if (!quill) return;
    quill.getModule('table').insertTable(2, 2);
  }

  function formatTextAlignment() {
    if (!quill) return;
    const alignment = prompt("Enter alignment: left, center, right, justify");
    if (alignment && ["left","center","right","justify"].includes(alignment)) {
      const range = quill.getSelection();
      if (range) quill.format("align", alignment);
    }
  }

  /* ---------- Download ---------- */
  function downloadContent(type = "txt") {
    if (!quill) return;
    const content = quill.root.innerHTML;

    if (type === "txt") {
      const blob = new Blob([quill.getText()], { type: "text/plain" });
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = `${documentTitle || "document"}.txt`;
      a.click();
    }

    if (type === "pdf") {
      const container = document.createElement("div");
      container.innerHTML = content;
      container.style.width = "800px";
      container.style.padding = "20px";
      container.style.background = "white";
      document.body.appendChild(container);

      html2canvas(container).then(canvas => {
        const imgData = canvas.toDataURL("image/png");
        const pdf = new jsPDF("p", "pt", "a4");
        const imgProps = pdf.getImageProperties(imgData);
        const pdfWidth = pdf.internal.pageSize.getWidth();
        const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;
        pdf.addImage(imgData, "PNG", 0, 0, pdfWidth, pdfHeight);
        pdf.save(`${documentTitle || "document"}.pdf`);
        document.body.removeChild(container);
      });
    }
  }

  /* ---------- Tab Actions ---------- */
  const tabActions = {
    File: [
      {
        label: "New",
        onClick: () => {
          axios.post("https://docs-lite.onrender.com/documents", { title: "Untitled Document" })
            .then(res => navigate(`/documents/${res.data._id}`))
            .catch(() => alert("Failed to create new document"));
        }
      },
      { label: "Open", onClick: () => navigate("/") },
      {
        label: "Rename",
        onClick: () => {
          const newName = prompt("Enter new document title");
          if (newName) {
            axios.put(`https://docs-lite.onrender.com/documents/${documentId}`, { title: newName })
              .then(res => setDocumentTitle(res.data.title))
              .catch(() => alert("Rename failed!"));
          }
        }
      },
      { label: "Download", onClick: () => downloadContent("pdf") },
    ],
    Edit: [
      { label: "Undo", onClick: () => quill?.history.undo() },
      { label: "Redo", onClick: () => quill?.history.redo() },
    ],
    View: [
      {
        label: "Comment",
        onClick: () => {
          if (!quill) return;
          const range = quill.getSelection();
          if (!range || range.length === 0) return alert("Select text to comment.");
          const text = quill.getText(range.index, range.length).trim();
          const comment = prompt("Enter your comment:");
          if (comment) setComments(prev => [...prev, { text, comment }]);
          setShowComments(true);
        }
      },
      { label: "Ruler", onClick: () => setShowRuler(prev => !prev) },
    ],
    Insert: [
      { label: "Image", onClick: () => insertImage() },
      // { label: "Table", onClick: () => insertTable() },
      { label: "Link", onClick: () => insertLink() },
    ],
    Format: [
      { label: "Text Alignment", onClick: () => formatTextAlignment() },
    ],
  };

  /* ---------- RETURN JSX ---------- */
  return (
    <div style={{ position: "relative" }}>
      <Header documentTitle={documentTitle} tabActions={tabActions} onSave={saveNow} />

      {/* Active Users */}
      <div style={{ background: "#eef", padding: 8 }}>
        <b>Users Editing:</b>
        {activeUsers.map(u => (
          <span key={u} style={{ marginLeft: 10, fontWeight: "bold", color: stringToColor(u) }}>
            ● {u}
          </span>
        ))}
      </div>

      {/* Editor Container */}
      <div className="quill-editor-container">
        {/* Ruler */}
        {showRuler && (
          <div style={{ height: 36, background: "#f5f5f5", borderBottom: "1px solid #ccc" }}>
            {/* ... Ruler marks and draggables as before ... */}
          </div>
        )}

        {/* Quill Editor */}
        <div
          className="container"
          ref={wrapperRef}
          style={{ minHeight: "400px", background: "#fff", marginTop: showRuler ? 0 : 10, border: "1px solid #ddd", overflow: "auto" }}
        />
      </div>

      {/* Comments Panel */}
      {showComments && (
        <div style={{
          position: "fixed", top: 80, right: 0, width: 220, height: "60%", background: "#f9f9f9", borderLeft: "1px solid #ccc", padding: 8, overflowY: "auto", zIndex: 999
        }}>
          <b>Comments</b><hr />
          {comments.map((c, i) => (
            <div key={i} style={{ marginBottom: 8 }}>
              <i>"{c.text}"</i><br />
              <b>Comment:</b> {c.comment}
            </div>
          ))}
        </div>
      )}

      {/* Logs Panel */}
      <div style={{ position: "fixed", bottom: 15, right: 15 }}>
        <button onClick={() => setShowLogs(!showLogs)} style={{ padding: "6px 10px", background: "#222", color: "#fff", borderRadius: 4, border: "none", cursor: "pointer", marginBottom: 5 }}>
          {showLogs ? "Hide Logs" : "Show Logs"}
        </button>
        {showLogs && (
          <div style={{ width: 260, height: 180, overflowY: "auto", background: "#fafafa", padding: 10, border: "1px solid #ccc", borderRadius: 6, boxShadow: "0 0 6px rgba(0,0,0,0.2)", fontSize: 13 }}>
            <b>Change History:</b>
            <hr />
            {changeLogs.map((l, i) => (
              <div key={i}>
                <span style={{ color: stringToColor(l.user) }}>{l.user}</span> edited at {l.time}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
