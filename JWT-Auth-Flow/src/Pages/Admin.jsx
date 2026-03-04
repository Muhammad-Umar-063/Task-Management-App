import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import API, { getMyId, getMyRole } from "../Api/axios"
import "./admin-stats.css"

const Admin = () => {
    const navigate = useNavigate()
    const myId = Number(getMyId())
    const myRole = getMyRole()

    const [groups, setGroups] = useState([])
    const [totalTasks, setTotalTasks] = useState(0)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState("")

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const { data } = await API.get("/groups")
                const groupList = data.groups || []

                // Fetch each group's full details (with members + tasks)
                let taskCount = 0
                const detailed = await Promise.all(
                    groupList.map(async (g) => {
                        try {
                            const { data: gData } = await API.get(`/groups/${g.id}`)
                            // Count tasks per group
                            try {
                                const { data: tData } = await API.get(`/groups/${g.id}/tasks`)
                                taskCount += (tData.tasks || []).length
                            } catch { /* ignore */ }
                            return gData.group
                        } catch {
                            return { ...g, members: [] }
                        }
                    })
                )

                setGroups(detailed)
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

    // ── Derived stats ──
    const allMembers = groups.flatMap(g =>
        (g.members || []).map(m => ({ ...m, groupName: g.name, groupId: g.id }))
    )

    const uniqueAdmins = [...new Map(
        allMembers.filter(m => m.role === "admin").map(m => [m.userId, m])
    ).values()]

    const uniqueUsers = [...new Map(
        allMembers.filter(m => m.role === "member").map(m => [m.userId, m])
    ).values()]

    // ── Admin-specific ──
    const myGroups = groups.filter(g =>
        (g.members || []).some(m => m.userId === myId)
    )
    const groupsICreated = groups.filter(g =>
        g.createdById === myId || g.createdBy?.id === myId
    )
    const groupsIJoined = myGroups.filter(g =>
        g.createdById !== myId && g.createdBy?.id !== myId
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

                {/* ── Summary Cards ── */}
                <div className="stats-cards">
                    <div className="stat-card">
                        <h3>{displayGroups.length}</h3>
                        <p>{myRole === "superadmin" ? "Total Groups" : "My Groups"}</p>
                    </div>

                    {myRole === "superadmin" ? (
                        <>
                            <div className="stat-card">
                                <h3>{uniqueAdmins.length}</h3>
                                <p>Total Admins</p>
                            </div>
                            <div className="stat-card">
                                <h3>{uniqueUsers.length}</h3>
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

