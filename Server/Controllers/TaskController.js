import prisma from "../Config/Prisma.js"



const getTasks = async (req, res) => {
    const { sessionId } = req.query  
    try {
        const tasks = await prisma.task.findMany({
            where: sessionId ? { sessionId: Number(sessionId) } : {},  
            orderBy: { createdat: "desc" }
        })
        return res.status(200).json({
            username: req.user.username,
            role: req.user.role,
            tasks
        })
    } catch (err) {
        return res.status(500).json({ message: "Internal Server Error" })
    }
}

const getTask = async(req, res) => {
    const id = Number(req.params.id)
    try{
        const task = await prisma.task.findUnique({
            where : {id}
        })
        if (!task){
            return res.status(404).json({ message : "Task Not Found" })
        }
        return res.json({task})
    }catch(err){
        return res.status(500).json({ message : err.message })
    }
}

const addTask = async(req, res) => {
    const createdby = req.user.username
    const {title, description, priority, status, sessionId} = req.body
    try{
        await prisma.task.create({
            data : {
                title, description, priority, status, createdby, 
                sessionId : sessionId ? Number(sessionId) : null
            }
        })
        return res.status(201).json("Task Added")
    }catch(err){
        return res.status(500).json({ message : err.message})
    }
}

const updateTask = async (req, res) => {
    const id = Number(req.params.id)
    const {title, description, priority, status} = req.body
    try{
        await prisma.task.update({
            where : {id},
            data : {title, description, priority, status}
        })
        return res.status(200).json({message : "Task Updated"})
    }catch(err){
        if (err.code === "P2025"){
            return res.status(404).json({message : "Task Not Found"})
        }
        return res.status(500).json({ message: err.message })
    }
}

const deleteTask = async(req, res) => {
    const id = Number(req.params.id)
    try{
        await prisma.task.delete({
            where : {id}
        })
        return res.status(201).json({ message : "Task Deleted"})
    }catch(err){
        if (err.code === "P2025"){
            return res.status(404).json({message : "Task Not Found"})
        }
        return res.status(500).json({ message: err.message })
    }
}
export { getTasks, getTask, addTask, updateTask, deleteTask }
