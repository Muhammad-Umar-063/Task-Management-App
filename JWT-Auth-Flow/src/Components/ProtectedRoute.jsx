import { Navigate } from "react-router-dom";

const ProtectedRoute = ({ children }) => {
    const token = localStorage.getItem("accesstoken");

    if (!token) {
        Navigate("/")
    }
    

    return children;
}

export default ProtectedRoute;