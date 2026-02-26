import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import API from "../Api/axios";

const Dashboard = () => {
    const navigate = useNavigate()
    const [dashboard, setDashboard] = useState([])
    const [role, setRole] = useState("")
    const [error, setError] = useState("")
    const [selectedTask, setSelectedTask] = useState(null) 
    useEffect(() => {
        const fetchDashboard = async () => {
            try {
                const res = await API.get("/dashboard")
                setDashboard(res.data.bugs)
                setRole(res.data.role)
            } catch {
                setError("Currently Dashboard is not accessible!")
            }
        }
        fetchDashboard()
    }, [])

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
        try { await API.post("/logout") } catch {}
        finally {
            localStorage.removeItem("accesstoken")
            navigate("/")
        }
    }

    const canModify = (task) => role === "admin" || role === "user"

    return (
        <div className="dashboard">
            <div className="dash-header">
                <h2>Dashboard</h2>
                <div className="dash-header-btns">
                    {role === "admin" && (
                        <button className="btn-admin" onClick={() =>
                            API.get("/admin").then(() => navigate("/admin"))
                        }>Admin</button>
                    )}
                    <button className="btn-add" onClick={() => navigate("/tasks")}>+ Add Task</button>
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
                        <span className="task-title">{bug.title}</span>
                        <span className={`badge priority-${bug.priority?.toLowerCase()}`}>{bug.priority}</span>
                        <span className={`badge status-${bug.status?.toLowerCase().replace(" ", "-")}`}>{bug.status}</span>
                        <span className="task-author">@{bug.createdby}</span>
                    </li>
                ))}
                {dashboard.length === 0 && (
                    <div className="empty-state">No tasks yet — click Add Task to create one</div>
                )}
            </ul>

            {selectedTask && (
                <div className="modal-overlay" onClick={() => setSelectedTask(null)}>
                    <div className="modal" onClick={(e) => e.stopPropagation()} >
                        <button className="modal-close" onClick={() => setSelectedTask(null)}>✕</button>

                        <div className="modal-header">
                            <h3>{selectedTask.title}</h3>
                            <div className="modal-badges">
                                <span className={`badge priority-${selectedTask.priority?.toLowerCase()}`}>
                                    {selectedTask.priority}
                                </span>
                                <span className={`badge status-${selectedTask.status?.toLowerCase().replace(" ", "-")}`}>
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
    )
}

export default Dashboard;