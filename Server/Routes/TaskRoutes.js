import express from "express"
import { AuthenticateToken, isGroupAdmin, isGroupMember } from "../Middleware/AuthMiddleware.js"
import { getGroupTasks, getTask, createTask, updateTask, deleteTask } from "../Controllers/TaskController.js"

const router = express.Router()

router.get(   "/groups/:id/tasks",  AuthenticateToken, isGroupMember, getGroupTasks)
router.post(  "/groups/:id/tasks",  AuthenticateToken, isGroupAdmin,  createTask)
router.get(   "/tasks/:id",        AuthenticateToken,                getTask)
router.put(   "/tasks/:id",        AuthenticateToken,                updateTask)
router.delete("/tasks/:id",        AuthenticateToken,                deleteTask)

export default router