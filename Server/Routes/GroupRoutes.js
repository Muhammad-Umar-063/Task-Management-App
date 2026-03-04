import express from "express"
import { AuthenticateToken, isSuperAdmin, isGroupAdmin, isGroupMember } from "../Middleware/AuthMiddleware.js"
import { getGroups, getGroup, createGroup, deleteGroup, addMember, removeMember } from "../Controllers/GroupController.js"

const router = express.Router()

router.get(   "/",                    AuthenticateToken,                getGroups)
router.post(  "/",                    AuthenticateToken,                createGroup)
router.get(   "/:id",                 AuthenticateToken, isGroupMember, getGroup)
router.delete("/:id",                 AuthenticateToken, isGroupAdmin,  deleteGroup)
// router.delete("/:id",                 AuthenticateToken, isSuperAdmin,  deleteGroup)
router.post(  "/:id/members",         AuthenticateToken, isGroupAdmin,  addMember)
router.delete("/:id/members/:userId", AuthenticateToken, isGroupAdmin,  removeMember)

export default router