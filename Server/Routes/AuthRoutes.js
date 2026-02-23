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

const db = mysql.createConnection({
    host: "localhost",
    user: "root",
    password: "umar2006",
    database: "user_data_sys"
})
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
            const querry = "INSERT INTO users (username, email, password, role) VALUES (?, ?, ?, ?)"
            db.execute(querry, [username, email, hashedpassword, role], (err, results) => {
                if (err) {
                    return err.code === "ER_DUP_ENTRY"
                    ? res.status(400).json({ message: "User already exists" })
                    : res.status(500).json({ message: "Registration failed" })
                }
                return res.status(201).json({ message: "Registration successful" })
            })
        } catch (err) {
            return res.status(500).json({ message: "Internal Server Error" })
        }
    }
})

// ----------------------------------------------------------LOGIN--------------------------------------------------------------------

router.post("/login", async (req, res) => {
    const { email, password, } = req.body;
    if (!email || !password) {
        return res.status(400).json({ message: "All fields are required" });
    }
    const querry = "SELECT * FROM users WHERE email = ?"
    db.execute(querry, [email], (err, rows) => {
        if (err) {
            return res.status(500).json({ message: "Internal Server Error" });
        }
        if (rows.length === 0) {
            return res.status(401).json({ message: "Invalid credentials" });
        }
        const user = rows[0]
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

    })

});

// ----------------------------------------------------------REFRESH-------------------------------------------------------------------

router.post("/refresh", (req, res) => {
    const refreshToken = req.cookies.refreshtoken;
    if (!refreshToken) return res.status(401).json({ message: "No refresh token" });


    jwt.verify(refreshToken, REFRESH_SECRET, (err, user) => {
        if (err) return res.status(401).json({ message: "Refresh token expired!" });
        const idx = refreshTokens.indexOf(refreshToken);
        if (idx > -1) refreshTokens.splice(idx, 1);
        const newAccessToken = jwt.sign(
            { id: user.id, role: user.role, username: user.username },
            ACCESS_SECRET,
            { expiresIn: ACCESS_EXPIRY },
        );
        const newRefreshToken = jwt.sign(
            { id: user.id, role: user.role, username: user.username },
            REFRESH_SECRET
        );
        refreshTokens.push(newRefreshToken);
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

router.get("/dashboard", AuthenticateToken, (req, res) => {
    const query = "SELECT * FROM task" 
    db.execute(query, (err, rows) => {
        if (err) return res.status(500).json({ message: "Internal Server Error" })
        return res.json({
            username: req.user.username,
            role: req.user.role,
            bugs: rows,
        })
    })
})

// ----------------------------------------------------------ADD-TASK-----------------------------------------------------

router.post("/tasks", AuthenticateToken, (req, res) => {
    const createdby = req.user.username
    const { title, description, priority, status } = req.body
    const query = "INSERT INTO task(title, description, priority, status, createdby) VALUES (?, ?, ?, ?, ?)"
    db.execute(query, [title, description, priority, status, createdby], (err, results) => {
        if (err){
            console.log(err.message)
            return res.status(500).json({ message: err.message })
        }
        return res.status(201).json({ message: "Task Added" })
    })
})

// -------------------------------------------------------UPDATE-TASK-----------------------------------------------------

router.put("/task/:id", AuthenticateToken, (req, res) => {
    const {id} = req.params
    const {title, description, priority, status} = req.body
    const query = "UPDATE task SET title=?, description=?, priority=?, status=? WHERE id=? "
    db.execute(query, [title, description, priority, status, id], (err, results) => {
        if (err){
            return res.status(500).json({message: err.message})
        }
        if (results.affectedRows === 0) {
            return res.status(404).json({ message: "Task not found" })
        }
        return res.status(201).json({message : "Task Updated"})
    })

})

// -------------------------------------------------------FETCH-TASK----------------------------------------------------------------


router.get("/task/:id", AuthenticateToken, (req, res) => {
    const {id} = req.params
    const query = "SELECT * FROM task WHERE id=?"
    db.execute(query, [id], (err, rows) => {
        if (err) return res.status(500).json({ message: err.message })
        if (rows.length === 0) return res.status(404).json({ message: "Task not found" })
        return res.json({ task: rows[0] })
    })
})

// -------------------------------------------------------DELETE-TASK-----------------------------------------------------

router.delete("/task/:id", AuthenticateToken, (req, res) => {
    const {id} = req.params
    const query = "DELETE FROM task WHERE id=?"
    db.execute(query, [id], (err, results) => {
        if (err){
            return res.status(500).json({message: err.message})
        }        
        if (results.affectedRows === 0) {
            return res.status(404).json({ message: "Task not found" })
        }
        return res.status(200).json({message : "Task Deleted"})
    })
})

// ----------------------------------------------------------ADMIN--------------------------------------------------------

router.get("/admin", AuthenticateToken, AuthorizeRole("admin"), (req, res) => {
    return res.json(req.user);
});

export default router;
