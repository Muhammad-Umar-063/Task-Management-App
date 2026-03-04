import { useState, useEffect } from "react"
import { useNavigate, useParams } from "react-router-dom"
import API from "../Api/axios"

const SuperAdminGroupPage = () => {
    const { id } = useParams()
    const navigate = useNavigate()
    const [group, setGroup] = useState(null)
    const [tasks, setTasks] = useState([])
    const [selectedTask, setSelectedTask] = useState(null)
    const [showAddMember, setShowAddMember] = useState(false)
    const [memberForm, setMemberForm] = useState({ email: "", role: "user" })
    const [error, setError] = useState("")

    useEffect(() => {
        Promise.all([API.get(`/groups/${id}`), API.get(`/groups/${id}/tasks`)])
            .then(([gRes, tRes]) => {
                setGroup(gRes.data.group)
                setTasks(tRes.data.tasks)
            })
            .catch(() => setError("Failed to load group"))
    }, [id])

    const handleAddMember = async () => {
        if (!memberForm.email.trim()) return
        try {
            const res = await API.post(`/groups/${id}/members`, {
                email: memberForm.email,
                role: memberForm.role
            })
            setGroup(p => ({ ...p, members: [...p.members, res.data.member] }))
            setMemberForm({ email: "", role: "user" })
            setShowAddMember(false)
        } catch (err) {
            alert(err.response?.data?.message || "Failed to add member")
        }
    }

    const handleRemoveMember = async userId => {
        if (!window.confirm("Remove this member?")) return
        try {
            await API.delete(`/groups/${id}/members/${userId}`)
            setGroup(p => ({ ...p, members: p.members.filter(m => m.userId !== userId) }))
        } catch { alert("Failed to remove member") }
    }

    const handleDeleteTask = async taskId => {
        if (!window.confirm("Delete this task?")) return
        try {
            await API.delete(`/tasks/${taskId}`)
            setTasks(p => p.filter(t => t.id !== taskId))
            setSelectedTask(null)
        } catch { alert("Failed to delete task") }
    }

    if (!group) return <div className="empty-state">{error || "Loading..."}</div>

    return (
        <>
            <title>{group.name}</title>
            <div className="dashboard-wrapper">
                <div className="dashboard">
                    <div className="dash-header">
                        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                            <button className="btn-hamburger" onClick={() => navigate("/superadmin")}>←</button>
                            <h2>{group.name}</h2>
                        </div>
                        <div className="dash-header-btns">
                            <button className="btn-admin" onClick={() => setShowAddMember(!showAddMember)}>+ Member</button>
                            <button className="btn-add" onClick={() => navigate(`/superadmin/groups/${id}/add-task`, { state: { from: "superadmin" } })}>+ Task</button>
                            <button className="btn-logout" onClick={() => navigate("/superadmin")}>← Back</button>
                        </div>
                    </div>

                    {error && <p className="error">{error}</p>}

                    {/* Members */}
                    <div className="members-panel">
                        <h4>Members ({group.members.length})</h4>
                        {showAddMember && (
                            <div className="create-group-form" style={{ marginBottom: "12px" }}>
                                <input type="email" placeholder="Enter user email" value={memberForm.email}
                                    onChange={e => setMemberForm(p => ({ ...p, email: e.target.value }))} />
                                <select value={memberForm.role}
                                    onChange={e => setMemberForm(p => ({ ...p, role: e.target.value }))}>
                                    <option value="user">User</option>
                                    <option value="admin">Admin</option>
                                </select>
                                <button onClick={handleAddMember}>Add</button>
                                <button onClick={() => setShowAddMember(false)}>Cancel</button>
                            </div>
                        )}
                        {group.members.map(m => (
                            <div key={m.userId} className="member-item">
                                <span>{m.user.username}</span>
                                <span className="task-author">{m.user.email}</span>
                                <span className={`badge ${m.role === "admin" ? "priority-high" : "status-active"}`}>{m.role}</span>
                                <button className="session-delete" style={{ opacity: 1 }}
                                    onClick={() => handleRemoveMember(m.userId)}>✕</button>
                            </div>
                        ))}
                    </div>

                    {/* Tasks */}
                    <div className="task-table-head">
                        <span>Title</span>
                        <span>Priority</span>
                        <span>Status</span>
                        <span>Assigned To</span>
                        <span>Created By</span>
                    </div>

                    <ul>
                        {tasks.map(task => (
                            <li key={task.id} className="task-item" style={{ gridTemplateColumns: "2fr 120px 140px 1fr 1fr" }}
                                onClick={() => setSelectedTask(task)}>
                                <span className="task-title">{task.title}</span>
                                <span className={`badge priority-${task.priority?.toLowerCase()}`}>{task.priority}</span>
                                <span className={`badge status-${task.status?.toLowerCase().replace("_", "-")}`}>{task.status}</span>
                                <span className="task-author">@{task.assignedTo?.username}</span>
                                <span className="task-author">@{task.createdBy?.username}</span>
                            </li>
                        ))}
                        {tasks.length === 0 && <div className="empty-state">No tasks in this group</div>}
                    </ul>

                    {selectedTask && (
                        <div className="modal-overlay" onClick={() => setSelectedTask(null)}>
                            <div className="modal" onClick={e => e.stopPropagation()}>
                                <button className="modal-close" onClick={() => setSelectedTask(null)}>✕</button>
                                <div className="modal-header">
                                    <h3>{selectedTask.title}</h3>
                                    <div className="modal-badges">
                                        <span className={`badge priority-${selectedTask.priority?.toLowerCase()}`}>{selectedTask.priority}</span>
                                        <span className={`badge status-${selectedTask.status?.toLowerCase().replace("_", "-")}`}>{selectedTask.status}</span>
                                    </div>
                                </div>
                                <div className="modal-body">
                                    <div className="modal-field">
                                        <label>Description</label>
                                        <p>{selectedTask.description || "No description."}</p>
                                    </div>
                                    <div className="modal-row">
                                        <div className="modal-field">
                                            <label>Assigned To</label>
                                            <p>@{selectedTask.assignedTo?.username}</p>
                                        </div>
                                        <div className="modal-field">
                                            <label>Created By</label>
                                            <p>@{selectedTask.createdBy?.username}</p>
                                        </div>
                                    </div>
                                </div>
                                <div className="modal-actions">
                                    <button className="btn-edit" onClick={() =>
                                        navigate(`/tasks/${selectedTask.id}/edit`, {
                                            state: { groupId: id, from: "superadmin" }
                                        })}>Edit Task</button>
                                    <button className="btn-delete" onClick={() => handleDeleteTask(selectedTask.id)}>
                                        Delete Task
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </>
    )
}

export default SuperAdminGroupPage