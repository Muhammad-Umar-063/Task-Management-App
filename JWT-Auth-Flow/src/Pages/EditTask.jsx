import { useState, useEffect } from "react"
import { useNavigate, useParams, useLocation } from "react-router-dom"
import API, { getMyId, getMyRole } from "../Api/axios"

const EditTask = () => {
    const { id } = useParams()
    const navigate = useNavigate()
    const location = useLocation()

    const stateGroupId = location.state?.groupId
    const fromSuperAdmin = location.state?.from === "superadmin"
    const myId = getMyId()
    const myRole = getMyRole()

    const [members, setMembers] = useState([])
    const [canEditAll, setCanEditAll] = useState(false)
    const [error, setError] = useState("")
    const [groupId, setGroupId] = useState(stateGroupId)
    const [form, setForm] = useState({
        title: "",
        description: "",
        priority: "Medium",
        status: "Active",
        assignedToId: "",
    })

    // ── Fetch task + group data ──
    useEffect(() => {
        const fetchData = async () => {
            try {
                const { data: taskData } = await API.get(`/tasks/${id}`)
                const task = taskData.task

                const gId = stateGroupId || task.groupId
                if (!gId) return setError("Missing group context")
                setGroupId(gId)

                const { data: groupData } = await API.get(`/groups/${gId}`)

                setForm({
                    title: task.title,
                    description: task.description || "",
                    priority: task.priority,
                    status: task.status,
                    assignedToId: task.assignedToId,
                })
                setMembers(groupData.group.members)

                // superadmin or group admin → can edit all fields
                if (myRole === "superadmin") {
                    setCanEditAll(true)
                } else {
                    const me = groupData.group.members.find(m => m.userId === myId)
                    setCanEditAll(me?.role === "admin")
                }
            } catch {
                setError("Failed to load task")
            }
        }

        fetchData()
    }, [id, stateGroupId, myId, myRole])

    // ── Helpers ──
    const updateField = (field) => (e) =>
        setForm((prev) => ({ ...prev, [field]: e.target.value }))

    const backPath = fromSuperAdmin
        ? `/superadmin/groups/${groupId}`
        : `/groups/${groupId}`

    // ── Save handler ──
    const handleSave = async () => {
        try {
            const payload = canEditAll
                ? { ...form, assignedToId: Number(form.assignedToId) }
                : { status: form.status }

            await API.put(`/tasks/${id}`, payload)
            navigate(backPath)
        } catch (err) {
            setError(err.response?.data?.message || "Failed to update task")
        }
    }

    // ── Error state ──
    if (error) {
        return (
            <div className="empty-state">
                <p>{error}</p>
                <button onClick={() => navigate(-1)} style={{ marginTop: "16px" }}>
                    ← Go Back
                </button>
            </div>
        )
    }

    // ── Render ──
    return (
        <>
            <title>Edit Task</title>
            <div className="add">
                <h2>Edit Task</h2>

                {canEditAll ? (
                    <>
                        <input type="text" placeholder="Title" value={form.title} onChange={updateField("title")} />
                        <input type="text" placeholder="Description" value={form.description} onChange={updateField("description")} />

                        <select value={form.priority} onChange={updateField("priority")}>
                            <option value="Low">Low</option>
                            <option value="Medium">Medium</option>
                            <option value="High">High</option>
                            <option value="Urgent">Urgent</option>
                        </select>

                        <select value={form.status} onChange={updateField("status")}>
                            <option value="Active">Active</option>
                            <option value="In_Progress">In Progress</option>
                            <option value="Resolved">Resolved</option>
                        </select>

                        <select value={form.assignedToId} onChange={updateField("assignedToId")}>
                            {members.map((m) => (
                                <option key={m.userId} value={m.userId}>
                                    @{m.user.username} — {m.role}
                                </option>
                            ))}
                        </select>
                    </>
                ) : (
                    <>
                        <p style={{ color: "var(--text-2)", fontSize: "13px", marginBottom: "8px" }}>
                            You can only update the status of your task.
                        </p>
                        <select value={form.status} onChange={updateField("status")}>
                            <option value="Active">Active</option>
                            <option value="In_Progress">In Progress</option>
                            <option value="Resolved">Resolved</option>
                        </select>
                    </>
                )}

                <button onClick={handleSave}>Save Changes</button>
                <button onClick={() => navigate(backPath)}>Cancel</button>
            </div>
        </>
    )
}

export default EditTask