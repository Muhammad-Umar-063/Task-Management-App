import jwt from "jsonwebtoken";
import express, { json } from "express";
import bcrypt from "bcryptjs";
import mysql from "mysql2";
import {
    AuthenticateToken,
    AuthorizeRole,
} from "../Middleware/AuthMiddleware.js";
import { refreshTokens } from "../Data/db.js";
import {
    ACCESS_SECRET,
    REFRESH_SECRET,
    ACCESS_EXPIRY,
    REFRESH_EXPIRY,
} from "../Config/Auth.js";
import prisma from "../Config/Prisma.js"
const router = express.Router();

// ----------------------------------------------------------REGISTER------------------------------------------------------------------

router.post("/register", async (req, res) => {
    const { username, email, password, role, key } = req.body;
    if (!username || !email || !password) {
        return res.status(400).json({ message: "All Fields are required" });
    }
    if (key != "key123" && role === "admin" || !key && role === "admin" || key && role === "user" || key && !role || !key && !role)
        return res.status(401).json({ message: "Invalid" })
    else if (!key && role === "user" || key === "key123" && role === "admin") {
        try {
            const hashedpassword = await bcrypt.hash(password, 10);
            await prisma.user.create({
                data: { username, email, password: hashedpassword, role }
            });
            return res.status(201).json({ message: "Registration successful" });
        } catch (err) {
            if (err.code === "P2002") {
                return res.status(400).json({ message: "User Already Exist" });
            }
            return res.status(500).json({ message: "Internal Server Error" });
        }
    }
})

// ----------------------------------------------------------LOGIN--------------------------------------------------------------------

router.post("/login", async (req, res) => {
    const { email, password, } = req.body;
    if (!email || !password) {
        return res.status(400).json({ message: "All fields are required" });
    }
    try {
        const user = await prisma.user.findUnique({
            where: { email }
        })
        if (!user)
            return res.status(401).json({ message: "Invalid credentials" })

        const isPasswordValid = bcrypt.compareSync(password, user.password)
        if (!isPasswordValid) {
            return res.status(401).json({ message: "Invalid credentials" });
        }
        const accesstoken = jwt.sign(
            { id: user.id, role: user.role, username: user.username },
            ACCESS_SECRET,
            { expiresIn: ACCESS_EXPIRY },
        )
        const refreshtoken = jwt.sign(
            { id: user.id, role: user.role, username: user.username },
            REFRESH_SECRET,
            { expiresIn: REFRESH_EXPIRY },
        )
        res.cookie("refreshtoken", refreshtoken, {
            httpOnly: true,
            secure: false,
            sameSite: "lax",
            maxAge: 7 * 24 * 60 * 60 * 1000,
        });
        return res.json({ message: "Login successful", accesstoken: accesstoken });
    } catch (err) {
        return res.status(500).json({ message: "Internal Server Error" })
    }

});

// ----------------------------------------------------------REFRESH-------------------------------------------------------------------

router.post("/refresh", (req, res) => {
    const refreshToken = req.cookies.refreshtoken;
    if (!refreshToken) return res.status(401).json({ message: "No refresh token" });


    jwt.verify(refreshToken, REFRESH_SECRET, (err, user) => {
        if (err) return res.status(401).json({ message: "Refresh token expired!" });
        // const idx = refreshTokens.indexOf(refreshToken);
        // if (idx > -1) refreshTokens.splice(idx, 1);
        const newAccessToken = jwt.sign(
            { id: user.id, role: user.role, username: user.username },
            ACCESS_SECRET,
        );
        const newRefreshToken = jwt.sign(
            { id: user.id, role: user.role, username: user.username },
            REFRESH_SECRET
        );
        // refreshTokens.push(newRefreshToken);
        res.cookie("refreshtoken", newRefreshToken, {
            httpOnly: true,
            secure: false,
            maxAge: 7 * 24 * 60 * 60 * 1000,
        });

        return res.json({ message: "Token refreshed", accesstoken: newAccessToken });

    });
});


// ------------------------------------------------------LOGOUT-----------------------------------------------------------

router.post("/logout", (req, res) => {
    res.clearCookie("refreshtoken");
    return res.json({ message: "Logged out successfully" });
});

// ----------------------------------------------------------DASHBOARD----------------------------------------------------

router.get("/dashboard", AuthenticateToken, async (req, res) => {
    try {
        const tasks = await prisma.task.findMany({
            orderBy: { createdat: "desc" }
        })
        return res.json({
            username: req.user.username,
            role: req.user.role,
            bugs: tasks,
        })
    } catch (err) {
        return res.json({ message: "Internal Server Error" })
    }
})

// ----------------------------------------------------------ADD-TASK-----------------------------------------------------

router.post("/tasks", AuthenticateToken, async (req, res) => {
    debugger
    const createdby = req.user.username;
    const { title, description, priority, status } = req.body;
    try {
        await prisma.task.create({
            data: { title, description, priority, status, createdby },
        });
        return res.status(201).json({ message: "Task Added" });
    } catch (err) {
        return res.status(500).json({ message: err.message });
    }
})

// -------------------------------------------------------FETCH-TASK-----------------------------------------------------

router.get("/task/:id", AuthenticateToken, async (req, res) => {
    const id = Number(req.params.id)
    try {
        const task = await prisma.task.findUnique({
            where: { id }
        })
        if (!task)
            return res.status(404).json({ message: "Task Not Found" })
        return res.status(201).json({ task })
    } catch (err) {
        return res.status(500).json({ message: err.message })
    }
})

// -------------------------------------------------------UPDATE-TASK----------------------------------------------------------------


router.put("/task/:id", AuthenticateToken, async (req, res) => {
    const id = Number(req.params.id)
    const { title, description, priority, status } = req.body
    try {
        const task = await prisma.task.update({
            where: { id },
            data: { title, description, priority, status }
        })
        return res.status(200).json({ message: "Task Updated" })
    } catch (err) {
        if (err.code === "P2025")
            return res.status(404).json({ message: "Task not found" })
        return res.status(500).json({ message: err.message })
    }
})

// -------------------------------------------------------DELETE-TASK-----------------------------------------------------

router.delete("/task/:id", AuthenticateToken, async (req, res) => {
    const id = Number(req.params.id)
    try {
        await prisma.task.delete({
            where: { id }
        })
        return res.status(200).json({ message: "Task Deleted" })
    } catch {
        return res.status(500).json({ message: "Internal Server Error" })
    }
})

// ----------------------------------------------------------ADMIN--------------------------------------------------------

router.get("/admin", AuthenticateToken, AuthorizeRole("admin"), (req, res) => {
    return res.json(req.user);
});

export default router;
