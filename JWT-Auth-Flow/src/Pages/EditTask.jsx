import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import API from "../Api/axios";

const EditTask = () => {
    const { id } = useParams()
    const navigate = useNavigate()
    const [title, settitle] = useState("")
    const [description, setdes] = useState("")
    const [priority, setpriority] = useState("Medium")
    const [status, setstatus] = useState("Active")

    useEffect(() => {
        const fetchTask = async () => {
            try{
                const res = await API.get(`/task/${id}`)
                const task = res.data.task

                settitle(task.title)
                setdes(task.description || "")
                setpriority(task.priority)
                setstatus(task.status)
            }catch(err){
                
                alert("Failed to load task")
            }
        }
        fetchTask()
    }, [id])

    const handleEdit = async () => {
        try {
            await API.put(`/task/${id}`, {title, description, priority, status})
            alert("Task Edited")
            navigate("/dashboard")
        } catch (err) {
            console.log(err.response?.data?.message)
            alert(err.response?.data?.message || "Failed to edit task")
        }
    }

    return (
        <div className="add">
            <input
                type="text"
                placeholder="Add Title"
                value={title}
                onChange={(e) => settitle(e.target.value)}
            />
            <input
                type="text"
                placeholder="Description"
                value={description}
                onChange={(e) => setdes(e.target.value)}
            />

            <select value= {priority} onChange={(e) => setpriority(e.target.value)}>
                <option value="Medium">Medium</option>
                <option value="Low">Low</option>
                <option value="High">High</option>
                <option value="Urgent">Urgent</option>
            </select>

            <select value={status} onChange={(e) => setstatus(e.target.value)}>
                <option value="Active">Active</option>
                <option value="In Progress">In Progress</option>
                <option value="Resolved">Resolved</option>
            </select>

            <button onClick={handleEdit}>Save Changes</button>
            <button onClick={() => {
                navigate("/dashboard")
            }}>Cancel</button>
        </div>
    )
}

export default EditTask