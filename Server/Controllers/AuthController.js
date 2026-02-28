import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import {
    ACCESS_SECRET,
    REFRESH_SECRET,
    ACCESS_EXPIRY,
    REFRESH_EXPIRY,
} from "../Config/Auth.js";
import prisma from "../Config/Prisma.js"


const register = async(req, res) => {
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
}

const login = async(req, res) => {
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
        )
        res.cookie("refreshtoken", refreshtoken, {
            httpOnly: true,
            secure: false,
            sameSite: "lax",
        });
        return res.json({ message: "Login successful", accesstoken: accesstoken });
    } catch (err) {
        return res.status(500).json({ message: "Internal Server Error" })
    }
}


const refresh = async(req, res) => {
    const refreshToken = req.cookies.refreshtoken;
    if (!refreshToken) return res.status(401).json({ message: "No refresh token" });


    jwt.verify(refreshToken, REFRESH_SECRET, (err, user) => {
        if (err) return res.status(401).json({ message: "Refresh token expired!" });
        // const idx = refreshTokens.indexOf(refreshToken);
        // if (idx > -1) refreshTokens.splice(idx, 1);
        const newAccessToken = jwt.sign(
            { id: user.id, role: user.role, username: user.username },
            ACCESS_SECRET,
            { expiresIn: ACCESS_EXPIRY }
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
}

const logout = async (req, res) => {
    res.clearCookie("refreshtoken");
    return res.json({ message: "Logged out successfully" });
}

const adminpage = async (req, res) => {
    return res.json(req.user);
}

export { register, login, refresh, logout, adminpage }