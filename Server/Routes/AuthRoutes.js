// import express from "express";
// import {
//     AuthenticateToken,
//     AuthorizeRole,
// } from "../Middleware/AuthMiddleware.js";
// const router = express.Router();
// import { register, login, refresh, logout, adminpage } from "../Controllers/AuthController.js"
// import { getTasks, getTask, addTask, updateTask, deleteTask } from "../Controllers/TaskController.js"
// import { getSessions, createSession, deleteSession } from "../Controllers/SessionController.js"


// // ----------------------------------------------------------AuthRoutes------------------------------------------------------------------

// router.post("/register", register)
// router.post("/login", login)   
// router.post("/refresh", refresh)
// router.post("/logout", logout)
// router.get("/admin", AuthenticateToken, AuthorizeRole("admin"), adminpage) 

// // ----------------------------------------------------------TaskRoutes----------------------------------------------------

// router.get("/dashboard", AuthenticateToken, getTasks)
// router.post("/tasks", AuthenticateToken, addTask)
// router.get("/task/:id", AuthenticateToken, getTask)
// router.put("/task/:id", AuthenticateToken, updateTask)
// router.delete("/task/:id", AuthenticateToken, deleteTask)

// export default router;



import express from "express"
import { register, login, refresh, logout } from "../Controllers/AuthController.js"

const router = express.Router()

router.post("/register", register)
router.post("/login",    login)
router.post("/refresh",  refresh)
router.post("/logout",   logout)

export default router
