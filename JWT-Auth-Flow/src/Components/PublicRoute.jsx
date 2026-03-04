import { Navigate } from "react-router-dom"
import { jwtDecode } from "jwt-decode"

const PublicRoute = ({ children }) => {
    const token = localStorage.getItem("accesstoken")
    if (!token) return children

    try {
        const { role } = jwtDecode(token)
        return <Navigate to={role === "superadmin" ? "/superadmin" : "/dashboard"} />
    } catch {
        localStorage.removeItem("accesstoken")
        return children
    }
}

export default PublicRoute