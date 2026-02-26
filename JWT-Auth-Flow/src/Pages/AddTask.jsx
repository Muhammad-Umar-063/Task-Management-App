import { useState } from "react";
import { useNavigate } from "react-router-dom";
import API from "../Api/axios";

const AddTask = () => {
    const navigate = useNavigate()
    const [title, settitle] = useState("")
    const [description, setdes] = useState("")
    const [priority, setpriority] = useState("Medium")  
    const [status, setstatus] = useState("Active")      

    const handletask = async () => {
        try {
            await API.post("/tasks", { title, description, priority, status })
            alert("Task added")
            navigate("/dashboard")
        } catch (err) {
            console.log(err)
            alert(err.response?.data?.message || "Failed to add task")
        }
    }

    return (
        <div className="add">
            <input
                type="text"
                placeholder="Add Title"
                onChange={(e) => settitle(e.target.value)}  
            />
            <input
                type="text"
                placeholder="Description"
                onChange={(e) => setdes(e.target.value)}  
            />

            <select onChange={(e) => setpriority(e.target.value)}>
                <option value="Medium">Medium</option>
                <option value="Low">Low</option>
                <option value="High">High</option>
                <option value="Urgent">Urgent</option>
            </select>

            <select onChange={(e) => setstatus(e.target.value)}>
                <option value="Active">Active</option>
                <option value="in_progress">In Progress</option>
                <option value="Resolved">Resolved</option>
            </select>

            <button onClick={handletask}>Add Task</button>
        </div>
    )
}

export default AddTask;