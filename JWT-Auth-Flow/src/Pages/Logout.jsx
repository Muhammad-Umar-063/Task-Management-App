import API from "../Api/axios";
import { useNavigate } from "react-router-dom";

const logout = () => {
    const navigate = useNavigate()
    const handleLogout = async() => {
        try{
            await API.post("/logout")
            localStorage.removeItem("accesstoken")
            localStorage.removeItem("activeSession")
            navigate("/")
        }catch(err){
            console.log(err)
            alert("Logout failed")
        }
}       
    return(
        <>
        <title>Logout</title>
        <div className="logout">
            <h2>Logout</h2>
            <button onClick={handleLogout}>Logout</button>
        </div>  
        </>
    )
}
export default logout;