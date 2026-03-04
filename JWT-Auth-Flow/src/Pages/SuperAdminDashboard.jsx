import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import API from "../Api/axios"

const SuperAdminDashboard = () => {
    const navigate = useNavigate()
    const [groups, setGroups]         = useState([])
    const [error, setError]           = useState("")
    const [showCreate, setShowCreate] = useState(false)
    const [form, setForm]             = useState({ name: "", email: "" })

    useEffect(() => {
        API.get("/groups")
            .then(res => setGroups(res.data.groups))
            .catch(() => setError("Failed to load groups"))
    }, [])

    const handleLogout = async () => {
        try { await API.post("/auth/logout") } catch {}
        localStorage.removeItem("accesstoken")
        navigate("/")
    }

    const handleCreate = async () => {
        if (!form.name.trim()) return
        try {
            const res = await API.post("/groups", {
                name: form.name,
                ...(form.email && { email: form.email })
            })
            setGroups(p => [res.data.group, ...p])
            setForm({ name: "", email: "" })
            setShowCreate(false)
        } catch (err) {
            alert(err.response?.data?.message || "Failed to create group")
        }
    }

    const handleDelete = async groupId => {
        if (!window.confirm("Delete this group and all its tasks?")) return
        try {
            await API.delete(`/groups/${groupId}`)
            setGroups(p => p.filter(g => g.id !== groupId))
        } catch { alert("Failed to delete group") }
    }

    return (
        <>
            <title>Super Admin</title>
            <div className="dashboard-wrapper">
                <div className="dashboard">
                    <div className="dash-header">
                        <h2>All Groups</h2>
                        <div className="dash-header-btns">
                            <button className="btn-add" onClick={() => setShowCreate(!showCreate)}>+ New Group</button>
                            <button className="btn-logout" onClick={handleLogout}>→ Logout</button>
                            <button onClick={() => navigate("/stats")}>📊 Stats</button>
                        </div>
                    </div>

                    {error && <p className="error">{error}</p>}

                    {showCreate && (
                        <div className="create-group-form">
                            <input type="text" placeholder="Group name" value={form.name} autoFocus
                                onChange={e => setForm(p => ({ ...p, name: e.target.value }))} />
                            <input type="email" placeholder="Assign admin By Email" value={form.email}
                                onChange={e => setForm(p => ({ ...p, email: e.target.value }))} />
                            <button onClick={handleCreate}>Create</button>
                            <button onClick={() => setShowCreate(false)}>Cancel</button>
                        </div>
                    )}

                    <div className="groups-grid">
                        {groups.map(g => (
                            <div key={g.id} className="group-card">
                                <div onClick={() => navigate(`/superadmin/groups/${g.id}`)}>
                                    <h3>{g.name}</h3>
                                    <div className="group-meta">
                                        <span>by @{g.createdBy?.username}</span>
                                        <span>👥 {g._count?.members || 0}</span>
                                        <span>📋 {g._count?.tasks || 0}</span>
                                    </div>
                                </div>
                                <button className="btn-delete" style={{ marginTop: "12px", padding: "8px" }}
                                    onClick={e => { e.stopPropagation(); handleDelete(g.id) }}>
                                    Delete Group
                                </button>
                            </div>
                        ))}
                        {groups.length === 0 && !error && (
                            <div className="empty-state">No groups yet</div>
                        )}
                    </div>
                </div>
            </div>
        </>
    )
}

export default SuperAdminDashboard