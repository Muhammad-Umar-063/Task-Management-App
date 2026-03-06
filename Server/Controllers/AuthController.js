import bcrypt from "bcryptjs"
import jwt from "jsonwebtoken"
import { ACCESS_SECRET, REFRESH_SECRET, ACCESS_EXPIRY, REFRESH_EXPIRY, ADMIN_KEY, SUPER_KEY } from "../Config/Auth.js"
import prisma from "../Config/Prisma.js"

export const register = async (req, res) => {
    const { username, email, password, role = "user", key } = req.body
    if (!username || !email || !password)
        return res.status(400).json({ message: "All fields are required" })

    const validRoles = ["user", "admin", "superadmin"]
    if (!validRoles.includes(role))
        return res.status(400).json({ message: "Invalid role" })

    if (role === "superadmin" && key !== SUPER_KEY)
        return res.status(401).json({ message: "Invalid superadmin key" })
    if (role === "admin" && key !== ADMIN_KEY)
        return res.status(401).json({ message: "Invalid admin key" })

    try {
        const hashed = await bcrypt.hash(password, 10)
        await prisma.user.create({ data: { username, email, password: hashed, role } })
        return res.status(201).json({ message: "Registration successful" })
    } catch (err) {
        if (err.code === "P2002")
            return res.status(400).json({ message: "Email already exists" })
        return res.status(500).json({ message: "Internal Server Error" })
    }
}

export const login = async (req, res) => {
    const { email, password } = req.body
    if (!email || !password)
        return res.status(400).json({ message: "All fields are required" })
    try {
        const user = await prisma.user.findUnique({ where: { email } })
        if (!user || !bcrypt.compareSync(password, user.password))
            return res.status(401).json({ message: "Invalid credentials" })

        const payload    = { id: user.id, username: user.username, role: user.role }
        const accesstoken  = jwt.sign(payload, ACCESS_SECRET , { expiresIn: ACCESS_EXPIRY })
        const refreshtoken = jwt.sign(payload, REFRESH_SECRET)

        res.cookie("refreshtoken", refreshtoken, { httpOnly: true, secure: false, sameSite: "lax" })
        return res.json({ message: "Login successful", accesstoken })
    } catch {
        return res.status(500).json({ message: "Internal Server Error" })
    }
}

export const refresh = async (req, res) => {
    const token = req.cookies.refreshtoken
    if (!token) return res.status(401).json({ message: "No refresh token" })
    try {
        const user = jwt.verify(token, REFRESH_SECRET)
        const payload    = { id: user.id, username: user.username, role: user.role }
        const accesstoken  = jwt.sign(payload, ACCESS_SECRET,  { expiresIn: ACCESS_EXPIRY })
        const refreshtoken = jwt.sign(payload, REFRESH_SECRET)
        res.cookie("refreshtoken", refreshtoken, { httpOnly: true, secure: false, sameSite: "lax" })
        return res.json({ message: "Token refreshed", accesstoken })
    } catch {
        return res.status(401).json({ message: "Refresh token expired" })
    }
}

export const logout = (req, res) => {
    res.clearCookie("refreshtoken")
    return res.json({ message: "Logged out" })
}