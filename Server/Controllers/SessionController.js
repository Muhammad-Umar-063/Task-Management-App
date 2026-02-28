import prisma from "../Config/Prisma.js"

const createSession = async (req , res) => {
    const {name} = req.body
    const createdby = req.user.username
    if (!name) {
        return res.status(400).json({message : "Session Name Required!"})
    }
    try{
        const session = await prisma.session.create({
            data : {name, createdby}
        })
        return res.status(201).json({message : "Session Created", session})
    }catch(err){
        res.status(500).json({message : err.message})
    }
}

const getSessions = async(req, res) => {
    const createdby = req.user.username
    try{
        const sessions = await prisma.session.findMany({
            where : {createdby},
            orderBy: { createdat: "desc" }
        })
        return res.status(200).json({sessions})
    }catch(err){
        return res.status(500).json({message : err.message})
    }
}

const deleteSession = async (req, res) => {
    const id = Number(req.params.id)
    try{
        await prisma.session.delete({
            where : {id}
        })
        return res.status(200).json({message : "Session Deleted"})
    }catch(err){
        if (err.code === "P2025")
            return res.status(404).json({ message: "Session not found" })
        return res.status(500).json({message : err.message})
    }
}

export { getSessions, createSession, deleteSession }