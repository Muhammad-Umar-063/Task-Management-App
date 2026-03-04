// import { Navigate } from "react-router-dom";

// const ProtectedRoute = ({ children }) => {
//     const token = localStorage.getItem("accesstoken");

//     if (!token) {
//         Navigate("/")
//     }
    

//     return children;
// }

// export default ProtectedRoute;



import { Navigate } from "react-router-dom"
import { jwtDecode } from "jwt-decode"

const ProtectedRoute = ({ children, roles }) => {
    const token = localStorage.getItem("accesstoken")

    // no token → go to login
    if (!token) return <Navigate to="/" />

    try {
        const decoded = jwtDecode(token)

        // wrong role for this page → redirect to their correct home
        if (roles && !roles.includes(decoded.role)) {
            return <Navigate to={decoded.role === "superadmin" ? "/superadmin" : "/dashboard"} />
        }

    } catch {
        // token is malformed/tampered
        localStorage.removeItem("accesstoken")
        return <Navigate to="/" />
    }

    return children
}

export default ProtectedRoute