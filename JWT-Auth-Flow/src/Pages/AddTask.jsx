import { useState, useEffect } from "react"
import { useNavigate, useParams, useLocation } from "react-router-dom"
import API from "../Api/axios"

const AddTask = () => {
    const navigate = useNavigate()
    const { groupId } = useParams()
    const location = useLocation()
    const fromSuperAdmin = location.state?.from === "superadmin"

    const [members, setMembers] = useState([])
    const [form, setForm] = useState({
        title: "",
        description: "",
        priority: "Medium",
        status: "Active",
        assignedToId: "",
    })
    const [error, setError] = useState("")

    // ── Fetch group members ──
    useEffect(() => {
        const fetchMembers = async () => {
            try {
                const { data } = await API.get(`/groups/${groupId}`)
                const groupMembers = data.group.members
                setMembers(groupMembers)

                // Auto-assign first member
                if (groupMembers.length > 0) {
                    setForm((prev) => ({ ...prev, assignedToId: groupMembers[0].userId }))
                }
            } catch {
                setError("Failed to load group members")
            }
        }

        fetchMembers()
    }, [groupId])

    // ── Helpers ──
    const updateField = (field) => (e) =>
        setForm((prev) => ({ ...prev, [field]: e.target.value }))

    const backPath = fromSuperAdmin
        ? `/superadmin/groups/${groupId}`
        : `/groups/${groupId}`

    // ── Submit handler ──
    const handleSubmit = async () => {
        // Validation
        if (!form.title.trim()) {
            return setError("Title is required")
        }
        if (!form.assignedToId) {
            return setError("Select a member to assign the task")
        }

        try {
            await API.post(`/groups/${groupId}/tasks`, {
                title: form.title.trim(),
                description: form.description,
                priority: form.priority,
                status: form.status,
                assignedToId: Number(form.assignedToId),
            })
            navigate(backPath)
        } catch (err) {
            setError(err.response?.data?.message || "Failed to create task")
        }
    }

    return (
        <>
            <title>Add Task</title>
            <div className="add">
                <h2>Add Task</h2>
                {error && <p className="error">{error}</p>}

                <input
                    type="text"
                    placeholder="Title"
                    value={form.title}
                    onChange={updateField("title")}
                />
                <input
                    type="text"
                    placeholder="Description"
                    value={form.description}
                    onChange={updateField("description")}
                />

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
                    <option value="">Assign to...</option>
                    {members.map((m) => (
                        <option key={m.userId} value={m.userId}>
                            @{m.user.username} — {m.role}
                        </option>
                    ))}
                </select>
                <button onClick={handleSubmit}>Add Task</button>
                <button onClick={() => navigate(backPath)}>Cancel</button>
            </div>
        </>
    )
}

export default AddTask