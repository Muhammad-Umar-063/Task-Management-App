import react from "react";
import API from "../Api/axios";
import { useNavigate } from "react-router-dom";

const Admin = () => {
    const navigate = useNavigate()
    const [message, setMessage] = react.useState("")
    react.useEffect(() => {
        const fetchAdmin = async () => {
            try {
                const res = await API.get("/admin")
                if (res.status === 200) {
                    setMessage(res.data)
                }
            } catch (err) {
                console.log(err)
                if (err.response?.status === 401 || err.response.status === 403) {
                    navigate("/");
                }
            }
        }
        fetchAdmin()
    }, [])
    return (
        <div className="admin">
            <h1>Admin Page</h1>
            <h3>Hello {message.username}</h3>
            <p>Role : {message.role}</p>
        </div>
    )
}
export default Admin

