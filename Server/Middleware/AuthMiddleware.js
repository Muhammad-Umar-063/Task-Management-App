// import jwt from "jsonwebtoken";

// import { ACCESS_SECRET } from "../Config/Auth.js";
// function AuthenticateToken(req, res, next) {
//   const authHeader = req.headers['authorization']
//   const token = authHeader && authHeader.split(' ')[1]
//   if (!token)
//     return res.status(401).json({ message: "Access token not found" });
//   try {
//     const user = jwt.verify(token, ACCESS_SECRET);
//     req.user = user;
//     next();
//   } catch (err) {
//     if (err.name === "TokenExpiredError") {
//         return res.status(401).json({ message: "Access token expired" })
//     }
//     return res.status(498).json({ message: "Invalid access token" })
// }
// }

// function AuthorizeRole(role) {
//   return (req, res, next) => {
//     if (req.user.role != role)
//       return res.status(403).json({ message: "Forbidden: Insufficient role" });
//     next();
//   };
// }

// export { AuthenticateToken, AuthorizeRole };



import jwt from "jsonwebtoken"
import { ACCESS_SECRET } from "../Config/Auth.js"
import prisma from "../Config/Prisma.js"

export function AuthenticateToken(req, res, next) {
    const token = req.headers["authorization"]?.split(" ")[1]
    if (!token)
        return res.status(401).json({ message: "Access token not found" })
    try {
        req.user = jwt.verify(token, ACCESS_SECRET)
        next()
    } catch (err) {
        if (err.name === "TokenExpiredError")
            return res.status(401).json({ message: "Access token expired" })
        return res.status(498).json({ message: "Invalid access token" })
    }
}

export function isSuperAdmin(req, res, next) {
    if (req.user.role !== "superadmin")
        return res.status(403).json({ message: "Forbidden: superadmin only" })
    next()
}

// groupId comes from :id (group routes) or :groupId (task routes)
export async function isGroupAdmin(req, res, next) {
    if (req.user.role === "superadmin") return next()
    const groupId = Number(req.params.id || req.params.groupId)
    try {
        const member = await prisma.groupMember.findUnique({
            where: { userId_groupId: { userId: req.user.id, groupId } }
        })
        if (!member || member.role !== "admin")
            return res.status(403).json({ message: "Forbidden: group admin only" })
        next()
    } catch {
        return res.status(500).json({ message: "Internal Server Error" })
    }
}

export async function isGroupMember(req, res, next) {
    if (req.user.role === "superadmin") return next()
    const groupId = Number(req.params.id || req.params.groupId)
    try {
        const member = await prisma.groupMember.findUnique({
            where: { userId_groupId: { userId: req.user.id, groupId } }
        })
        if (!member)
            return res.status(403).json({ message: "Forbidden: not a group member" })
        next()
    } catch {
        return res.status(500).json({ message: "Internal Server Error" })
    }
}