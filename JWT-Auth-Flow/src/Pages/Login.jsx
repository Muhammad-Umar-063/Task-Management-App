import react from "react";
import API from "../Api/axios";
import { useState } from "react";
import { useNavigate } from "react-router-dom";

const Login = () => {
    const navigate = useNavigate()
    const [email, setEmail] = useState("")
    const [password, setPass] = useState("")

    const handleLogin = async () => {
        // debugger
        try {
            const res = await API.post("/login", { email: email, password: password })
            localStorage.setItem("accesstoken", res.data.accesstoken)
            navigate("/dashboard")
        }
        catch (err) {
            console.log(err.response?.data?.message)
            alert("Login failed")
        }
    }
    function signup() {
        navigate("/register")
    }
    return (
        <>
        <title>Login</title>
        <div className="login">
            <h2>Login</h2>
            <input type="text" placeholder="Email" onChange={(e) => setEmail(e.target.value)} />
            <input type="password" placeholder="Password" onChange={(e) => setPass(e.target.value)} />
            <button onClick={handleLogin}>Login</button>
            <button onClick={signup}>Go to Sign Up</button>
        </div>
        </>
    )
}
export default Login
