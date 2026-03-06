import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import API, { getMyId, getMyRole } from "../Api/axios"
import { jwtDecode } from "jwt-decode"
import "./admin-stats.css"

const Admin = () => {
    const navigate = useNavigate()
    const myId = Number(getMyId())
    const myRole = getMyRole()

    const [groups, setGroups] = useState([])
    const [totalTasks, setTotalTasks] = useState(0)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState("")
    const [username, setUsername] = useState("")

    useEffect(() => {
        // Get username from token
        const token = localStorage.getItem("accesstoken")
        if (token) {
            try {
                const decoded = jwtDecode(token)
                setUsername(decoded.username)
            } catch {}
        }

        const fetchStats = async () => {
            try {
                // Step 1: get list of groups
                const res = await API.get("/groups")
                const groupList = res.data.groups || []

                // Step 2: get full details for each group
                let taskCount = 0
                const detailedGroups = []

                for (const g of groupList) {
                    const groupRes = await API.get(`/groups/${g.id}`)
                    detailedGroups.push(groupRes.data.group)

                    // Step 3: count tasks in each group
                    try {
                        const taskRes = await API.get(`/groups/${g.id}/tasks`)
                        taskCount += taskRes.data.tasks?.length || 0
                    } catch {
                        // ignore if tasks fail
                    }
                }

                setGroups(detailedGroups)
                setTotalTasks(taskCount)
            } catch {
                setError("Failed to load stats")
            } finally {
                setLoading(false)
            }
        }

        fetchStats()
    }, [])

    if (loading) return <div className="empty-state"><p>Loading stats...</p></div>
    if (error) return (
        <div className="empty-state">
            <p>{error}</p>
            <button onClick={() => navigate(-1)} style={{ marginTop: "16px" }}>← Go Back</button>
        </div>
    )

    // ── Count unique admins across all groups ──
    const adminIds = new Set()
    const userIds = new Set()

    for (const group of groups) {
        for (const member of group.members || []) {
            if (member.role === "admin") adminIds.add(member.userId)
            if (member.role === "member") userIds.add(member.userId)
        }
    }

    // ── Groups the current admin is part of ──
    const myGroups = groups.filter(g =>
        (g.members || []).some(m => m.userId === myId)
    )

    // ── Groups where I am an admin = "created/own" ──
    const groupsICreated = myGroups.filter(g =>
        (g.members || []).some(m => m.userId === myId && m.role === "admin")
    )

    // ── Groups where I am just a member ──
    const groupsIJoined = myGroups.filter(g =>
        (g.members || []).some(m => m.userId === myId && m.role === "member")
    )

    const displayGroups = myRole === "superadmin" ? groups : myGroups

    // ── Render ──
    return (
        <>
            <title>{myRole === "superadmin" ? "Super Admin Stats" : "Admin Stats"}</title>

            <div className="admin-stats">
                <div className="stats-nav">
                    <button onClick={() => navigate(myRole === "superadmin" ? "/superadmin" : "/dashboard")}>
                        ← Dashboard
                    </button>
                </div>

                <h1>{myRole === "superadmin" ? "Super Admin Overview" : "Admin Overview"}</h1>
                <p style={{ color: "var(--text-2)", fontSize: "13px", textAlign: "center", marginTop: "-16px", marginBottom: "20px" }}>
                    @{username}
                </p>

                {/* ── Summary Cards ── */}
                <div className="stats-cards">
                    <div className="stat-card">
                        <h3>{displayGroups.length}</h3>
                        <p>{myRole === "superadmin" ? "Total Groups" : "My Groups"}</p>
                    </div>

                    {myRole === "superadmin" ? (
                        <>
                            <div className="stat-card">
                                <h3>{adminIds.size}</h3>
                                <p>Total Admins</p>
                            </div>
                            <div className="stat-card">
                                <h3>{userIds.size}</h3>
                                <p>Total Users</p>
                            </div>
                            <div className="stat-card">
                                <h3>{totalTasks}</h3>
                                <p>Total Tasks</p>
                            </div>
                        </>
                    ) : (
                        <>
                            <div className="stat-card">
                                <h3>{groupsICreated.length}</h3>
                                <p>Groups I Created</p>
                            </div>
                            <div className="stat-card">
                                <h3>{groupsIJoined.length}</h3>
                                <p>Groups I Joined</p>
                            </div>
                        </>
                    )}
                </div>

                {/* ── My Groups Breakdown (admin only) ── */}
                {myRole !== "superadmin" && groupsICreated.length > 0 && (
                    <>
                        <h2 style={{ marginTop: "32px" }}>My Groups</h2>
                        {groupsICreated.map(group => {
                            const members = group.members || []
                            const admins = members.filter(m => m.role === "admin")
                            const users = members.filter(m => m.role === "member")

                            return (
                                <div key={group.id} className="group-stat-card">
                                    <div className="group-stat-header">
                                        <h3>{group.name}</h3>
                                        <span className="member-count">
                                            {members.length} member{members.length !== 1 ? "s" : ""}
                                        </span>
                                    </div>

                                    <div className="group-stat-row">
                                        <span className="group-stat-label">Admins ({admins.length}):</span>
                                        <span className="group-stat-value">
                                            {admins.length > 0
                                                ? admins.map(m => `@${m.user?.username || "unknown"}`).join(", ")
                                                : "None"}
                                        </span>
                                    </div>

                                    <div className="group-stat-row">
                                        <span className="group-stat-label">Users ({users.length}):</span>
                                        <span className="group-stat-value">
                                            {users.length > 0
                                                ? users.map(m => `@${m.user?.username || "unknown"}`).join(", ")
                                                : "None"}
                                        </span>
                                    </div>

                                    <button
                                        className="view-group-btn"
                                        onClick={() => navigate(`/groups/${group.id}`)}
                                    >
                                        View Group →
                                    </button>
                                </div>
                            )
                        })}
                    </>
                )}
            </div>
        </>
    )
}

export default Admin


