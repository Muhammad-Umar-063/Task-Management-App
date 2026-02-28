import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom"
import API from "../Api/axios";
import Sidebar from "../Components/Sidebar"

const Dashboard = () => {
    const navigate = useNavigate()
    const [dashboard, setDashboard] = useState([])
    const [role, setRole] = useState("")
    const [username, setUsername] = useState("")
    const [error, setError] = useState("")
    const [selectedTask, setSelectedTask] = useState(null)
    const [sidebarOpen, setSidebarOpen] = useState(false)
    const [sessions, setSessions] = useState([])
    const [prevStatuses, setPrevStatuses] = useState({})
    const [searchParams, setSearchParams] = useSearchParams()
    const activeSession = searchParams.get("sessionId")
        ? Number(searchParams.get("sessionId"))
        : null

    // fetch sessions
    useEffect(() => {
        const fetchSessions = async () => {
            try {
                const res = await API.get("/sessions")
                setSessions(res.data.sessions)
            } catch {
                console.log("Failed to load sessions")
            }
        }
        fetchSessions()
    }, [])

    // fetch tasks — reruns when activeSession changes
    useEffect(() => {
        const fetchDashboard = async () => {
            try {
                const url = activeSession
                    ? `/dashboard?sessionId=${activeSession}`
                    : "/dashboard"
                const res = await API.get(url)
                setDashboard(res.data.tasks)
                setRole(res.data.role)
                setUsername(res.data.username)
            } catch {
                setError("Currently Dashboard is not accessible!")
            }
        }
        fetchDashboard()
    }, [activeSession])

    const handleSessionSelect = (id) => {
        if (id === null) {
            setSearchParams({})
        } else {
            setSearchParams({ sessionId: id })
        }
        setSidebarOpen(false)
    }

    const handleDelete = async (id) => {
        if (!window.confirm("Delete this task?")) return
        try {
            await API.delete(`/task/${id}`)
            setDashboard(dashboard.filter(b => b.id !== id))
            setSelectedTask(null)
        } catch {
            alert("Failed to delete task")
        }
    }

    const handleLogout = async () => {
        try { await API.post("/logout") } catch { }
        finally {
            localStorage.removeItem("accesstoken")
            navigate("/")
        }
    }

    const handleCheckbox = async (e, task) => {
        e.stopPropagation()
    
        if (e.target.checked) {
            setPrevStatuses(prev => ({ ...prev, [task.id]: task.status }))
    
            await API.put(`/task/${task.id}`, {
                title: task.title,
                description: task.description,
                priority: task.priority,
                status: "Resolved"
            })
    
            setDashboard(prev => prev.map(t =>
                t.id === task.id ? { ...t, status: "Resolved" } : t
            ))
    
        } else {
            const previous = prevStatuses[task.id] || "Active"
    
            await API.put(`/task/${task.id}`, {
                title: task.title,
                description: task.description,
                priority: task.priority,
                status: previous
            })
    
            setDashboard(prev => prev.map(t =>
                t.id === task.id ? { ...t, status: previous } : t
            ))
    
            setPrevStatuses(prev => {
                const updated = { ...prev }
                delete updated[task.id]
                return updated
            })
        }
    }

    const canModify = (task) => role === "admin" || username === task.createdby

    return (
        <>
            <title>Dashboard</title>
            <div className="dashboard-wrapper">

                <Sidebar
                    isOpen={sidebarOpen}
                    sessions={sessions}
                    activeSession={activeSession}
                    role={role}
                    onSessionSelect={handleSessionSelect}
                    onSessionCreated={(session) => setSessions([...sessions, session])}
                    onSessionDeleted={(id) => {
                        setSessions(sessions.filter(s => s.id !== id))
                        if (activeSession === id) setSearchParams({})
                    }}
                />

                <div className="dashboard">
                    <div className="dash-header">
                        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                            <button className="btn-hamburger" onClick={() => setSidebarOpen(!sidebarOpen)}>
                                ☰
                            </button>
                            <h2>
                                {activeSession
                                    ? sessions.find(s => s.id === activeSession)?.name
                                    : "All Tasks"
                                }
                            </h2>
                        </div>
                        <div className="dash-header-btns">
                            <button className="btn-add" onClick={() =>
                                navigate("/tasks", { state: { sessionId: activeSession } })
                            }>+ Add Task</button>
                            <button className="btn-logout" onClick={handleLogout}>→ Logout</button>
                        </div>
                    </div>

                    {error && <p className="error">{error}</p>}

                    <div className="task-table-head">
                        <span>Title</span>
                        <span>Priority</span>
                        <span>Status</span>
                        <span>Created By</span>
                    </div>

                    <ul>
                        {dashboard.map((bug) => (
                            <li
                                key={bug.id}
                                className="task-item"
                                onClick={() => setSelectedTask(bug)}
                            >
                                <label className="task-check-wrapper" onClick={(e) => e.stopPropagation()}>
                                    <input
                                        type="checkbox"
                                        className="task-checkbox-input"
                                        checked={bug.status === "Resolved"}
                                        onChange={(e) => handleCheckbox(e, bug)}
                                    />
                                    <span className="task-check-circle">
                                        <svg viewBox="0 0 12 10" fill="none">
                                            <path d="M1 5L4.5 8.5L11 1" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                        </svg>
                                    </span>
                                </label>
                                <span className="task-title">{bug.title}</span>
                                <span className={`badge priority-${bug.priority?.toLowerCase()}`}>{bug.priority}</span>
                                <span className={`badge status-${bug.status?.toLowerCase().replace("_", "-")}`}>{bug.status}</span>
                                <span className="task-author">@{bug.createdby}</span>
                            </li>
                        ))}
                        {dashboard.length === 0 && (
                            <div className="empty-state">No tasks yet — click Add Task to create one</div>
                        )}
                    </ul>

                    {selectedTask && (
                        <div className="modal-overlay" onClick={() => setSelectedTask(null)}>
                            <div className="modal" onClick={(e) => e.stopPropagation()}>
                                <button className="modal-close" onClick={() => setSelectedTask(null)}>✕</button>

                                <div className="modal-header">
                                    <h3>{selectedTask.title}</h3>
                                    <div className="modal-badges">
                                        <span className={`badge priority-${selectedTask.priority?.toLowerCase()}`}>
                                            {selectedTask.priority}
                                        </span>
                                        <span className={`badge status-${selectedTask.status?.toLowerCase().replace("_", "-")}`}>
                                            {selectedTask.status}
                                        </span>
                                    </div>
                                </div>

                                <div className="modal-body">
                                    <div className="modal-field">
                                        <label>Description</label>
                                        <p>{selectedTask.description || "No description provided."}</p>
                                    </div>
                                    <div className="modal-row">
                                        <div className="modal-field">
                                            <label>Created By</label>
                                            <p>@{selectedTask.createdby}</p>
                                        </div>
                                        <div className="modal-field">
                                            <label>Created At</label>
                                            <p>{new Date(selectedTask.createdat).toLocaleDateString("en-US", {
                                                year: "numeric", month: "short", day: "numeric"
                                            })}</p>
                                        </div>
                                    </div>
                                </div>

                                {canModify(selectedTask) && (
                                    <div className="modal-actions">
                                        <button className="btn-edit" onClick={() => navigate(`/task/${selectedTask.id}`)}>
                                            Edit Task
                                        </button>
                                        <button className="btn-delete" onClick={() => handleDelete(selectedTask.id)}>
                                            Delete Task
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </>
    )
}

export default Dashboard;
