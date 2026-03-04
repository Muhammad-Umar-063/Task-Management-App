// import API from "../Api/axios";
// import { useState } from "react";
// import { useNavigate } from "react-router-dom";

// const SignUp = () => {
//     const navigate = useNavigate()
//     const [email, setEmail] = useState("")
//     const [password, setPass] = useState("")
//     const [username, setUsername] = useState("")
//     const [usertype, setusertype] = useState("user")
//     const [key, setkey] = useState("")
//     const [showAdminKey, setShowAdminKey] = useState(false) 

//     const handleRoleChange = (e) => {
//         setusertype(e.target.value)
//         if (e.target.value === "admin") {
//             setShowAdminKey(true)  
//         } else {
//             setShowAdminKey(false)
//             setkey("")
//         }
//     }

//     const handleSignUp = async () => {
//         try {
//             await API.post("/register", { username, email, password, role: usertype, key })
//             alert("Sign up successful. Please log in.")
//             navigate("/")
//         } catch (err) {
//             console.log(err.response?.data?.message)
//             alert("Sign up failed")
//         }
//     }

//     return (
//         <>
//         <title>Sign Up</title>
//         <div className="signup">
//             <h2>Sign Up</h2>
//             <input type="text" placeholder="Username" onChange={(e) => setUsername(e.target.value)} />
//             <input type="text" placeholder="Email" onChange={(e) => setEmail(e.target.value)} />
//             <input type="password" placeholder="Password" onChange={(e) => setPass(e.target.value)} />
//             <select onChange={handleRoleChange}>
//                 <option value="user">User</option>
//                 <option value="admin">Admin</option>
//             </select>
//             {showAdminKey && (
//                 <div>
//                     <label htmlFor="key">Admin Key</label>
//                     <input
//                         id="key"
//                         type="password"
//                         placeholder="Enter Admin Key"
//                         onChange={(e) => setkey(e.target.value)}
//                     />
//                 </div>
//             )}

//             <button onClick={handleSignUp}>Sign Up</button>
//             <button onClick={() => navigate("/")}>Go to Login</button>
//         </div>
//         </>
//     )
// }

// export default SignUp;



import { useState } from "react"
import { useNavigate } from "react-router-dom"
import API from "../Api/axios"

const SignUp = () => {
    const navigate = useNavigate()
    const [form, setForm] = useState({ username: "", email: "", password: "", role: "user", key: "" })
    const [error, setError] = useState("")

    const set = field => e => setForm(p => ({ ...p, [field]: e.target.value }))

    const handleSignUp = async () => {
        if (!form.username || !form.email || !form.password)
            return setError("All fields are required")
        try {
            await API.post("/auth/register", form)
            alert("Registration successful. Please log in.")
            navigate("/")
        } catch (err) {
            setError(err.response?.data?.message || "Sign up failed")
        }
    }

    return (
        <>
            <title>Sign Up</title>
            <div className="signup">
                <h2>Sign Up</h2>
                {error && <p className="error">{error}</p>}
                <input type="text"     placeholder="Username" onChange={set("username")} />
                <input type="email"    placeholder="Email"    onChange={set("email")} />
                <input type="password" placeholder="Password" onChange={set("password")} />
                <select onChange={set("role")}>
                    <option value="user">User</option>
                    <option value="admin">Admin</option>
                    <option value="superadmin">Super Admin</option>
                </select>
                {(form.role === "admin" || form.role === "superadmin") && (
                    <input type="password"
                        placeholder={form.role === "admin" ? "Admin Key" : "Super Admin Key"}
                        onChange={set("key")} />
                )}
                <button onClick={handleSignUp}>Sign Up</button>
                <button onClick={() => navigate("/")}>Go to Login</button>
            </div>
        </>
    )
}

export default SignUp