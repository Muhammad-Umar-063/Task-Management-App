import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import API from "../Api/axios"
import { getMyRole } from "../Api/axios"
import { jwtDecode } from "jwt-decode"

const Dashboard = () => {
    const navigate = useNavigate()
    const [groups, setGroups] = useState([])
    const [error, setError] = useState("")
    const [showCreate, setShowCreate] = useState(false)
    const [groupName, setGroupName] = useState("")
    const [username, setUsername] = useState("")
    const myRole = getMyRole()

    useEffect(() => {
        // Get username from token
        const token = localStorage.getItem("accesstoken")
        if (token) {
            try {
                const decoded = jwtDecode(token)
                setUsername(decoded.username)
            } catch {}
        }

        API.get("/groups")
            .then(res => setGroups(res.data.groups))
            .catch(() => setError("Failed to load groups"))
    }, [])

    const handleLogout = async () => {
        try { await API.post("/auth/logout") } catch { }
        localStorage.removeItem("accesstoken")
        navigate("/")
    }

    const handleCreate = async () => {
        if (!groupName.trim()) return
        try {
            const res = await API.post("/groups", { name: groupName })
            setGroups(p => [res.data.group, ...p])
            setGroupName("")
            setShowCreate(false)
        } catch (err) {
            alert(err.response?.data?.message || "Failed to create group")
        }
    }

    const handleDelete = async (groupId) => {
        if (!window.confirm("Delete this group and all its tasks?")) return
        try {
            await API.delete(`/groups/${groupId}`)
            setGroups(p => p.filter(g => g.id !== groupId))
        } catch { alert("Failed to delete group") }
    }

    return (
        <>
            <title>Dashboard</title>
            <div className="dashboard-wrapper">
                <div className="dashboard">
                    <div className="dash-header">
                        <div>
                            <h2>My Groups</h2>
                            <p style={{ color: "var(--text-2)", fontSize: "13px", marginTop: "4px" }}>
                                Welcome, @{username}
                            </p>
                        </div>
                        <div className="dash-header-btns">            
                            {myRole === "admin" && (
                                <button className="btn-add" onClick={() => setShowCreate(!showCreate)}>
                                    + New Group
                                </button>
                            )}
                            <button className="btn-logout" onClick={handleLogout}>→ Logout</button>
                            <button onClick={() => navigate("/stats")}>📊 Stats</button>
                        </div>
                    </div>

                    {error && <p className="error">{error}</p>}

                    {showCreate && (
                        <div className="create-group-form">
                            <input type="text" placeholder="Group name" value={groupName}
                                autoFocus
                                onChange={e => setGroupName(e.target.value)}
                                onKeyDown={e => e.key === "Enter" && handleCreate()} />
                            <button onClick={handleCreate}>Create</button>
                            <button onClick={() => setShowCreate(false)}>Cancel</button>
                        </div>
                    )}

                    <div className="groups-grid">
                        {groups.map(g => (
                            <div key={g.id} className="group-card" onClick={() => navigate(`/groups/${g.id}`)}>
                                <h3>{g.name}</h3>
                                <div className="group-meta">
                                    <span>👥 {g._count?.members || 0} members</span>
                                    <span>📋 {g._count?.tasks || 0} tasks</span>
                                </div>
                                <span className={`badge ${g.myRole === "admin" ? "priority-high" : "status-active"}`}>
                                    {g.myRole}
                                </span>
                                {g.myRole === "admin" && (
                                    <button className="btn-delete" style={{ marginTop: "12px", padding: "8px" }}
                                        onClick={e => { e.stopPropagation(); handleDelete(g.id) }}>
                                        Delete Group
                                    </button>
                                )}
                            </div>
                        ))}
                        {groups.length === 0 && !error && (
                            <div className="empty-state">No groups yet — create one or wait to be added</div>
                        )}
                    </div>
                </div>
            </div>
        </>
    )
}

export default Dashboard