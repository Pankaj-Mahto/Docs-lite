import React, { useState } from "react";

export default function Header({ documentTitle, tabActions, onSave }) {
  const [activeTab, setActiveTab] = useState(Object.keys(tabActions)[0]);

  /* ---------- Share Function ---------- */
  const handleShare = () => {
    const url = window.location.href;
    navigator.clipboard.writeText(url)
      .then(() => alert("Link copied to clipboard!"))
      .catch(() => alert("Failed to copy link."));
  };

  return (
    <div style={{ fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif" }}>
      {/* Tabs */}
      <div style={{
        display: "flex",
        alignItems: "center",
        gap: 20,
        padding: "10px 20px",
        background: "#ffffff",
        borderBottom: "1px solid #e0e0e0",
        boxShadow: "0 2px 4px rgba(0,0,0,0.05)",
        position: "sticky",
        top: 0,
        zIndex: 1000
      }}>
        {Object.keys(tabActions).map(tabName => (
          <div
            key={tabName}
            onClick={() => setActiveTab(tabName)}
            style={{
              padding: "6px 12px",
              cursor: "pointer",
              borderBottom: activeTab === tabName ? "3px solid #007bff" : "3px solid transparent",
              fontWeight: activeTab === tabName ? "bold" : "normal",
              color: "#333",
              transition: "border 0.2s"
            }}
          >
            {tabName}
          </div>
        ))}

        {/* Right side: Document title + Save + Share */}
        <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 12 }}>
          <span style={{ fontWeight: "bold", fontSize: 16, color: "#333" }}>{documentTitle}</span>
          <button
            onClick={onSave}
            style={{
              padding: "6px 14px",
              cursor: "pointer",
              border: "1px solid #007bff",
              borderRadius: 5,
              background: "#007bff",
              color: "#fff",
              fontWeight: 500,
              transition: "all 0.2s"
            }}
            onMouseEnter={e => e.currentTarget.style.background = "#0056b3"}
            onMouseLeave={e => e.currentTarget.style.background = "#007bff"}
          >
            Save
          </button>
          <button
            onClick={handleShare}
            style={{
              padding: "6px 14px",
              cursor: "pointer",
              border: "1px solid #28a745",
              borderRadius: 5,
              background: "#28a745",
              color: "#fff",
              fontWeight: 500,
              transition: "all 0.2s"
            }}
            onMouseEnter={e => e.currentTarget.style.background = "#1e7e34"}
            onMouseLeave={e => e.currentTarget.style.background = "#28a745"}
          >
            Share
          </button>
        </div>
      </div>

      {/* Active Tab Actions */}
      <div style={{
        display: "flex",
        gap: 10,
        padding: "8px 20px",
        background: "#f9f9f9",
        borderBottom: "1px solid #e0e0e0",
        flexWrap: "wrap"
      }}>
        {tabActions[activeTab].map(action => (
          <button
            key={action.label}
            onClick={action.onClick}
            style={{
              padding: "5px 12px",
              cursor: "pointer",
              border: "1px solid #ccc",
              borderRadius: 5,
              background: "#fff",
              transition: "all 0.2s"
            }}
            onMouseEnter={e => e.currentTarget.style.background = "#f0f0f0"}
            onMouseLeave={e => e.currentTarget.style.background = "#fff"}
          >
            {action.label}
          </button>
        ))}
      </div>
    </div>
  );
}
