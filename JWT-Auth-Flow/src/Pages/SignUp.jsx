import API from "../Api/axios";
import { useState } from "react";
import { useNavigate } from "react-router-dom";

const SignUp = () => {
    const navigate = useNavigate()
    const [email, setEmail] = useState("")
    const [password, setPass] = useState("")
    const [username, setUsername] = useState("")
    const [usertype, setusertype] = useState("user")
    const [key, setkey] = useState("")
    const [showAdminKey, setShowAdminKey] = useState(false) 

    const handleRoleChange = (e) => {
        setusertype(e.target.value)
        if (e.target.value === "admin") {
            setShowAdminKey(true)  
        } else {
            setShowAdminKey(false)
            setkey("")
        }
    }

    const handleSignUp = async () => {
        try {
            await API.post("/register", { username, email, password, role: usertype, key })
            alert("Sign up successful. Please log in.")
            navigate("/")
        } catch (err) {
            console.log(err.response?.data?.message)
            alert("Sign up failed")
        }
    }

    return (
        <>
        <title>Sign Up</title>
        <div className="signup">
            <h2>Sign Up</h2>
            <input type="text" placeholder="Username" onChange={(e) => setUsername(e.target.value)} />
            <input type="text" placeholder="Email" onChange={(e) => setEmail(e.target.value)} />
            <input type="password" placeholder="Password" onChange={(e) => setPass(e.target.value)} />
            <select onChange={handleRoleChange}>
                <option value="user">User</option>
                <option value="admin">Admin</option>
            </select>
            {showAdminKey && (
                <div>
                    <label htmlFor="key">Admin Key</label>
                    <input
                        id="key"
                        type="password"
                        placeholder="Enter Admin Key"
                        onChange={(e) => setkey(e.target.value)}
                    />
                </div>
            )}

            <button onClick={handleSignUp}>Sign Up</button>
            <button onClick={() => navigate("/")}>Go to Login</button>
        </div>
        </>
    )
}

export default SignUp;