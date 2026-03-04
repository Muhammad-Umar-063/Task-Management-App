import { useState, useEffect } from "react"
import { useNavigate, useParams } from "react-router-dom"
import API, { getMyId, getMyRole } from "../Api/axios"

const GroupPage = () => {
    const { id } = useParams()
    const navigate = useNavigate()
    const myId = getMyId()
    const globalRole = getMyRole()

    const [group, setGroup] = useState(null)
    const [tasks, setTasks] = useState([])
    const [myGroupRole, setMyGroupRole] = useState("user")
    const [selectedTask, setSelectedTask] = useState(null)
    const [showMembers, setShowMembers] = useState(false)
    const [prevStatuses, setPrevStatuses] = useState({})
    const [error, setError] = useState("")
    const [memberForm, setMemberForm] = useState({ email: "", role: "user" })


    useEffect(() => {
        const load = async () => {
            try {
                const [gRes, tRes] = await Promise.all([
                    API.get(`/groups/${id}`),
                    API.get(`/groups/${id}/tasks`)
                ])
                setGroup(gRes.data.group)
                setTasks(tRes.data.tasks)
                const me = gRes.data.group.members.find(m => m.userId === myId)
                if (me) setMyGroupRole(me.role)
            } catch {
                setError("Failed to load group")
            }
        }
        load()
    }, [id])

    const isAdmin = globalRole === "superadmin" || myGroupRole === "admin"

    const handleCheckbox = async (e, task) => {
        e.stopPropagation()
        if (task.assignedToId !== myId && !isAdmin) return

        if (e.target.checked) {
            setPrevStatuses(p => ({ ...p, [task.id]: task.status }))
            await API.put(`/tasks/${task.id}`, { status: "Resolved" })
            setTasks(p => p.map(t => t.id === task.id ? { ...t, status: "Resolved" } : t))
        } else {
            const prev = prevStatuses[task.id] || "Active"
            await API.put(`/tasks/${task.id}`, { status: prev })
            setTasks(p => p.map(t => t.id === task.id ? { ...t, status: prev } : t))
            setPrevStatuses(p => { const u = { ...p }; delete u[task.id]; return u })
        }
    }

    const handleDelete = async taskId => {
        if (!window.confirm("Delete this task?")) return
        try {
            await API.delete(`/tasks/${taskId}`)
            setTasks(p => p.filter(t => t.id !== taskId))
            setSelectedTask(null)
        } catch { alert("Failed to delete task") }
    }

    const handleRemoveMember = async userId => {
        if (!window.confirm("Remove this member?")) return
        try {
            await API.delete(`/groups/${id}/members/${userId}`)
            setGroup(p => ({ ...p, members: p.members.filter(m => m.userId !== userId) }))
        } catch { alert("Failed to remove member") }
    }

    const handleStatusChange = async (task, newStatus) => {
        try {
            await API.put(`/tasks/${task.id}`, { status: newStatus })
            setTasks(p => p.map(t => t.id === task.id ? { ...t, status: newStatus } : t))
            setSelectedTask(p => p ? { ...p, status: newStatus } : null)
        } catch { alert("Failed to update status") }
    }

    const handleAddMember = async () => {
        if (!memberForm.email.trim()) return
        try {
            const res = await API.post(`/groups/${id}/members`, {
                email: memberForm.email,
                role: memberForm.role
            })
            setGroup(p => ({ ...p, members: [...p.members, res.data.member] }))
            setMemberForm({ email: "", role: "user" })  // ✅ reset form
        } catch (err) {
            alert(err.response?.data?.message || "Failed to add member")
        }
    }

    if (!group) return <div className="empty-state">{error || "Loading..."}</div>

    return (
        <>
            <title>{group.name}</title>
            <div className="dashboard-wrapper">
                <div className="dashboard">
                    <div className="dash-header">
                        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                            <button className="btn-hamburger" onClick={() => navigate("/dashboard")}>←</button>
                            <h2>{group.name}</h2>
                        </div>
                        <div className="dash-header-btns">
                            {isAdmin && (
                                <>
                                    <button className="btn-admin" onClick={() => setShowMembers(!showMembers)}>
                                        👥 Members ({group.members.length})
                                    </button>
                                    <button className="btn-add" onClick={() => navigate(`/groups/${id}/add-task`)}>
                                        + Add Task
                                    </button>
                                </>
                            )}
                            <button className="btn-logout" onClick={() => navigate("/dashboard")}>← Back</button>
                        </div>
                    </div>

                    {error && <p className="error">{error}</p>}

                    {/* Members Panel — admin only */}
                    {showMembers && isAdmin && (
                        <div className="members-panel">
                            <h4>Members</h4>

                            {/* ✅ ADD MEMBER FORM — add it here, above the members list */}
                            <div className="create-group-form" style={{ marginBottom: "12px" }}>
                                <input
                                    type="email"
                                    placeholder="Enter user email"
                                    value={memberForm.email}
                                    onChange={e => setMemberForm(p => ({ ...p, email: e.target.value }))}
                                />
                                <select
                                    value={memberForm.role}
                                    onChange={e => setMemberForm(p => ({ ...p, role: e.target.value }))}
                                >
                                    <option value="user">User</option>
                                    <option value="admin">Admin</option>
                                </select>
                                <button onClick={handleAddMember}>Add</button>
                            </div>

                            {/* existing members list — unchanged */}
                            {group.members.map(m => (
                                <div key={m.userId} className="member-item">
                                    <span>{m.user.username}</span>
                                    <span className="task-author">{m.user.email}</span>
                                    <span className={`badge ${m.role === "admin" ? "priority-high" : "status-active"}`}>
                                        {m.role}
                                    </span>
                                    {m.userId !== myId && (
                                        <button className="session-delete" style={{ opacity: 1 }}
                                            onClick={() => handleRemoveMember(m.userId)}>✕</button>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}

                    <div className="task-table-head">
                        <span></span>
                        <span>Title</span>
                        <span>Priority</span>
                        <span>Status</span>
                        <span>Assigned To</span>
                    </div>

                    <ul>
                        {tasks.map(task => {
                            const canCheck = task.assignedToId === myId || isAdmin
                            return (
                                <li key={task.id} className="task-item" onClick={() => setSelectedTask(task)}>
                                    <label className="task-check-wrapper" onClick={e => e.stopPropagation()}>
                                        <input
                                            type="checkbox"
                                            className="task-checkbox-input"
                                            checked={task.status === "Resolved"}
                                            disabled={!canCheck}
                                            onChange={e => handleCheckbox(e, task)}
                                        />
                                        <span className="task-check-circle" style={!canCheck ? { opacity: 0.3, cursor: "not-allowed" } : {}}>
                                            <svg viewBox="0 0 12 10" fill="none">
                                                <path d="M1 5L4.5 8.5L11 1" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                            </svg>
                                        </span>
                                    </label>
                                    <span className="task-title">{task.title}</span>
                                    <span className={`badge priority-${task.priority?.toLowerCase()}`}>{task.priority}</span>
                                    <span className={`badge status-${task.status?.toLowerCase().replace("_", "-")}`}>{task.status}</span>
                                    <span className="task-author">@{task.assignedTo?.username}</span>
                                </li>
                            )
                        })}
                        {tasks.length === 0 && <div className="empty-state">No tasks yet</div>}
                    </ul>

                    {/* Modal */}
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
                                        <p>{selectedTask.description || "No description provided."}</p>
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
                                    {/* status update for assigned user (non-admin) */}
                                    {selectedTask.assignedToId === myId && !isAdmin && (
                                        <div className="modal-field">
                                            <label>Update Status</label>
                                            <select value={selectedTask.status}
                                                onChange={e => handleStatusChange(selectedTask, e.target.value)}>
                                                <option value="Active">Active</option>
                                                <option value="In_Progress">In Progress</option>
                                                <option value="Resolved">Resolved</option>
                                            </select>
                                        </div>
                                    )}
                                </div>
                                {isAdmin && (
                                    <div className="modal-actions">
                                        <button className="btn-edit" onClick={() =>
                                            navigate(`/tasks/${selectedTask.id}/edit`, { state: { groupId: id } })}>
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

export default GroupPage