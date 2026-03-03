import prisma from "../Config/Prisma.js";

const getTasks = async (req, res) => {
  const { sessionId } = req.query;
  try {
    const tasks = await prisma.task.findMany({
      where: sessionId ? { sessionId: Number(sessionId) } : {},
      orderBy: { createdat: "desc" },
      include: { user: { select: { username: true } } },
    });
    const mapped = tasks.map(({ user, ...t }) => ({
      ...t,
      createdby: user.username,
    }));
    return res.status(200).json({
      username: req.user.username,
      role: req.user.role,
      tasks: mapped,
    });
  } catch (err) {
    return res.status(500).json({ message: "Internal Server Error" });
  }
};

const getTask = async (req, res) => {
  const id = Number(req.params.id);
  try {
    const task = await prisma.task.findUnique({
      where: { id },
      include: { user: { select: { username: true } } },
    });
    if (!task) {
      return res.status(404).json({ message: "Task Not Found" });
    }
    const { user, ...rest } = task;
    return res.json({ task: { ...rest, createdby: user.username } });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};

const addTask = async (req, res) => {
  const { title, description, priority, status, sessionId } = req.body;
  try {
   const task = await prisma.task.create({
      data: {
        title,
        description,
        priority,
        status,
        userId: req.user.id,
        sessionId: sessionId ? Number(sessionId) : null,
      },
      include : { user: { select: {username : true}}}
    });
    return res.status(201).json({ message: "Task Added", title: task.title, createdby: task.user.username, description: task.description, priority: task.priority, status: task.status });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};

const updateTask = async (req, res) => {
  const id = Number(req.params.id);
  const { title, description, priority, status } = req.body;
  try {
    await prisma.task.update({
      where: { id },
      data: { title, description, priority, status },
    });
    return res.status(200).json({ message: "Task Updated" });
  } catch (err) {
    if (err.code === "P2025") {
      return res.status(404).json({ message: "Task Not Found" });
    }
    return res.status(500).json({ message: err.message });
  }
};

const deleteTask = async (req, res) => {
  const id = Number(req.params.id);
  try {
    await prisma.task.delete({
      where: { id },
    });
    return res.status(201).json({ message: "Task Deleted" });
  } catch (err) {
    if (err.code === "P2025") {
      return res.status(404).json({ message: "Task Not Found" });
    }
    return res.status(500).json({ message: err.message });
  }
};
export { getTasks, getTask, addTask, updateTask, deleteTask };
