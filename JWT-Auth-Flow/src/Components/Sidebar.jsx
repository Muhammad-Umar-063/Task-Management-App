import { useState } from "react"
import { useNavigate } from "react-router-dom"
import API from "../Api/axios"

const Sidebar = ({ isOpen, sessions, onSessionSelect, activeSession, onSessionCreated, onSessionDeleted, role }) => {
    const [newSessionName, setNewSessionName] = useState("")
    const [adding, setAdding] = useState(false)
    const navigate = useNavigate()

    const handleCreate = async () => {
        if (!newSessionName.trim()) return
        try {
            const res = await API.post("/sessions", { name: newSessionName })
            onSessionCreated(res.data.session)
            setNewSessionName("")
            setAdding(false)
        } catch {
            alert("Failed to create session")
        }
    }

    const handleDelete = async (id, e) => {
        e.stopPropagation()
        if (!window.confirm("Delete this session?")) return
        try {
            await API.delete(`/sessions/${id}`)
            onSessionDeleted(id)
        } catch {
            alert("Failed to delete session")
        }
    }

    return (
        <div className={`sidebar ${isOpen ? "sidebar-open" : "sidebar-closed"}`}>
            <h3 className="sidebar-title">📁 Sessions</h3>

            {/* ALL TASKS — default, no delete button — not a real session */}
            <div
                className={`session-item ${activeSession === null ? "active" : ""}`}
                onClick={() => onSessionSelect(null)}
            >
                <span>All Tasks</span>
            </div>
            {/* USER SESSIONS — all deleteable */}
            {sessions.map(session => (
                <div
                    key={session.id}
                    className={`session-item ${activeSession === session.id ? "active" : ""}`}
                    onClick={() => onSessionSelect(session.id)}
                >
                    <span>{session.name}</span>
                    <button
                        className="session-delete"
                        onClick={(e) => handleDelete(session.id, e)}
                    >✕</button>
                </div>
            ))}

            {/* ADD SESSION */}
            {adding ? (
                <div className="session-add-form">
                    <input
                        type="text"
                        placeholder="Session name"
                        value={newSessionName}
                        onChange={(e) => setNewSessionName(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && handleCreate()}
                        autoFocus
                    />
                    <button onClick={handleCreate}>Add</button>
                    <button onClick={() => setAdding(false)}>Cancel</button>
                </div>
            ) : (
                <button className="session-new-btn" onClick={() => setAdding(true)}>
                    + New Session
                </button>
            )}
            {role === "admin" && (
                <button
                    className="btn-admin sidebar-admin-btn"
                    onClick={() => API.get("/admin").then(() => navigate("/admin"))}
                >
                    Admin Panel
                </button>
            )}
        </div>
    )
}

export default Sidebar