import prisma from "../Config/Prisma.js";

const taskInclude = {
  assignedTo: { select: { id: true, username: true } },
  createdBy: { select: { id: true, username: true } },
};

// GET /api/groups/:id/tasks — all group members see all tasks
export const getGroupTasks = async (req, res) => {
  const groupId = Number(req.params.id || req.params.groupId);
  try {
    const tasks = await prisma.task.findMany({
      where: { groupId },
      include: taskInclude,
      orderBy: { createdat: "desc" },
    });
    return res.json({ tasks });
  } catch {
    return res.status(500).json({ message: "Internal Server Error" });
  }
};

// GET /api/tasks/:id — any group member or superadmin
export const getTask = async (req, res) => {
  const id = Number(req.params.id);
  try {
    const task = await prisma.task.findUnique({
      where: { id },
      include: taskInclude,
    });
    if (!task) return res.status(404).json({ message: "Task not found" });

    if (req.user.role !== "superadmin") {
      const member = await prisma.groupMember.findUnique({
        where: {
          userId_groupId: { userId: req.user.id, groupId: task.groupId },
        },
      });
      if (!member) return res.status(403).json({ message: "Forbidden" });
    }

    return res.json({ task });
  } catch {
    return res.status(500).json({ message: "Internal Server Error" });
  }
};

// POST /api/groups/:groupId/tasks — group admin or superadmin
export const createTask = async (req, res) => {
  const groupId = Number(req.params.groupId || req.params.id);
  const { title, description, priority, status, assignedToId } = req.body;

  if (!title?.trim())
    return res.status(400).json({ message: "Title is required" });
  if (!assignedToId)
    return res.status(400).json({ message: "assignedToId is required" });

  try {
    // assignee must be a member of the group
    const member = await prisma.groupMember.findUnique({
      where: { userId_groupId: { userId: Number(assignedToId), groupId } },
    });
    if (!member)
      return res
        .status(400)
        .json({ message: "Assigned user is not a member of this group" });

    const task = await prisma.task.create({
      data: {
        title: title.trim(),
        description,
        priority,
        status,
        groupId,
        assignedToId: Number(assignedToId),
        createdById: req.user.id,
      },
      include: taskInclude,
    });
    return res.status(201).json({ message: "Task created", task });
  } catch {
    return res.status(500).json({ message: "Internal Server Error" });
  }
};

// PUT /api/tasks/:id
// superadmin / group admin → full update
// assigned user            → status only
export const updateTask = async (req, res) => {
  const id = Number(req.params.id);
  const { title, description, priority, status, assignedToId } = req.body;

  try {
    const task = await prisma.task.findUnique({ where: { id } });
    if (!task) return res.status(404).json({ message: "Task not found" });

    const isSuperAdmin = req.user.role === "superadmin";
    const isAssigned = task.assignedToId === req.user.id;

    let isGroupAdmin = false;
    if (!isSuperAdmin) {
      const member = await prisma.groupMember.findUnique({
        where: {
          userId_groupId: { userId: req.user.id, groupId: task.groupId },
        },
      });
      isGroupAdmin = member?.role === "admin";
    }

    if (!isSuperAdmin && !isGroupAdmin && !isAssigned)
      return res.status(403).json({ message: "Forbidden" });

    const data =
      isSuperAdmin || isGroupAdmin
        ? {
            ...(title !== undefined && { title }),
            ...(description !== undefined && { description }),
            ...(priority !== undefined && { priority }),
            ...(status !== undefined && { status }),
            ...(assignedToId !== undefined && {
              assignedToId: Number(assignedToId),
            }),
          }
        : { status }; // assigned user: status only

    if (!isSuperAdmin && !isGroupAdmin && !status)
      return res.status(400).json({ message: "You can only update status" });

    const updated = await prisma.task.update({
      where: { id },
      data,
      include: taskInclude,
    });
    return res.json({ message: "Task updated", task: updated });
  } catch (err) {
    if (err.code === "P2025")
      return res.status(404).json({ message: "Task not found" });
    return res.status(500).json({ message: "Internal Server Error" });
  }
};

// DELETE /api/tasks/:id — group admin or superadmin
export const deleteTask = async (req, res) => {
  const id = Number(req.params.id);
  try {
    const task = await prisma.task.findUnique({ where: { id } });
    if (!task) return res.status(404).json({ message: "Task not found" });

    if (req.user.role !== "superadmin") {
      const member = await prisma.groupMember.findUnique({
        where: {
          userId_groupId: { userId: req.user.id, groupId: task.groupId },
        },
      });
      if (!member || member.role !== "admin")
        return res.status(403).json({ message: "Forbidden" });
    }

    await prisma.task.delete({ where: { id } });
    return res.json({ message: "Task deleted" });
  } catch (err) {
    if (err.code === "P2025")
      return res.status(404).json({ message: "Task not found" });
    return res.status(500).json({ message: "Internal Server Error" });
  }
};
