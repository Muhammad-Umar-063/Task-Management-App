import prisma from "../Config/Prisma.js"

// GET /api/groups
// superadmin → all groups | admin/user → their groups
export const getGroups = async (req, res) => {
    try {
        if (req.user.role === "superadmin") {
            const groups = await prisma.group.findMany({
                include: {
                    _count:    { select: { members: true, tasks: true } },
                    createdBy: { select: { username: true } }
                },
                orderBy: { createdat: "desc" }
            })
            return res.json({ groups })
        }

        const memberships = await prisma.groupMember.findMany({
            where: { userId: req.user.id },
            include: {
                group: {
                    include: {
                        _count:    { select: { members: true, tasks: true } },
                        createdBy: { select: { username: true } }
                    }
                }
            }
        })

        const groups = memberships.map(m => ({ ...m.group, myRole: m.role }))
        return res.json({ groups })
    } catch {
        return res.status(500).json({ message: "Internal Server Error" })
    }
}

// GET /api/groups/:id
export const getGroup = async (req, res) => {
    const id = Number(req.params.id)
    try {
        const group = await prisma.group.findUnique({
            where: { id },
            include: {
                members: {
                    include: { user: { select: { id: true, username: true, email: true } } },
                    orderBy: { joinedAt: "asc" }
                },
                createdBy: { select: { username: true } },
                _count: { select: { tasks: true } }
            }
        })
        if (!group) return res.status(404).json({ message: "Group not found" })
        return res.json({ group })
    } catch {
        return res.status(500).json({ message: "Internal Server Error" })
    }
}

// POST /api/groups
// admin:      auto-added as admin member
// superadmin: optionally assigns an existing admin via adminId
export const createGroup = async (req, res) => {
    const { name, email } = req.body  // ← accept email instead of adminId
    if (!name?.trim()) return res.status(400).json({ message: "Group name is required" })

    try {
        let assignedAdminId = null

        if (req.user.role === "superadmin" && email) {
            const adminUser = await prisma.user.findUnique({ where: { email } })
            if (!adminUser)
                return res.status(404).json({ message: "No user found with this email" })
            if (adminUser.role !== "admin")
                return res.status(400).json({ message: "User must have admin role to be assigned" })
            assignedAdminId = adminUser.id
        }

        const group = await prisma.group.create({
            data: {
                name: name.trim(),
                createdById: req.user.id,
                members: {
                    create: req.user.role === "superadmin"
                        ? assignedAdminId ? [{ userId: assignedAdminId, role: "admin" }] : []
                        : [{ userId: req.user.id, role: "admin" }]
                }
            },
            include: {
                _count:    { select: { members: true, tasks: true } },
                createdBy: { select: { username: true } }
            }
        })
        return res.status(201).json({ message: "Group created", group })
    } catch {
        return res.status(500).json({ message: "Internal Server Error" })
    }
}

// DELETE /api/groups/:id — group admin or superadmin
export const deleteGroup = async (req, res) => {
    const id = Number(req.params.id)
    try {
        const group = await prisma.group.findUnique({ where: { id } })
        if (!group) return res.status(404).json({ message: "Group not found" })

        // superadmin can delete any group
        if (req.user.role === "superadmin") {
            await prisma.group.delete({ where: { id } })
            return res.json({ message: "Group deleted" })
        }

        // group admin can only delete their own group
        const member = await prisma.groupMember.findUnique({
            where: { userId_groupId: { userId: req.user.id, groupId: id } }
        })
        if (!member || member.role !== "admin")
            return res.status(403).json({ message: "Forbidden: only group admin can delete" })

        await prisma.group.delete({ where: { id } })
        return res.json({ message: "Group deleted" })
    } catch (err) {
        if (err.code === "P2025") return res.status(404).json({ message: "Group not found" })
        return res.status(500).json({ message: "Internal Server Error" })
    }
}

// POST /api/groups/:id/members — group admin or superadmin
export const addMember = async (req, res) => {
    const groupId = Number(req.params.id)
    const { email, role = "user" } = req.body
    if (!email) return res.status(400).json({ message: "Email is required" })

    const validGroupRoles = ["admin", "user"]
    if (!validGroupRoles.includes(role))
        return res.status(400).json({ message: "Invalid role" })

    try {
        const user = await prisma.user.findUnique({
            where: { email },
            select: { id: true, username: true, role: true }
        })
        if (!user) return res.status(404).json({ message: "No user found with this email" })

        if (role === "admin" && user.role !== "admin")
            return res.status(400).json({ message: "User must have admin role to be added as group admin" })

        const member = await prisma.groupMember.create({
            data: { userId: user.id, groupId, role },
            include: { user: { select: { id: true, username: true, email: true } } }
        })
        return res.status(201).json({ message: "Member added", member })
    } catch (err) {
        if (err.code === "P2002")
            return res.status(400).json({ message: "User already in this group" })
        return res.status(500).json({ message: "Internal Server Error" })
    }
}

// DELETE /api/groups/:id/members/:userId — group admin or superadmin
export const removeMember = async (req, res) => {
    const groupId = Number(req.params.id)
    const userId  = Number(req.params.userId)

    // admin cannot remove themselves
    if (req.user.id === userId && req.user.role !== "superadmin")
        return res.status(400).json({ message: "You cannot remove yourself" })

    try {
        await prisma.groupMember.delete({
            where: { userId_groupId: { userId, groupId } }
        })
        return res.json({ message: "Member removed" })
    } catch (err) {
        if (err.code === "P2025") return res.status(404).json({ message: "Member not found" })
        return res.status(500).json({ message: "Internal Server Error" })
    }
}