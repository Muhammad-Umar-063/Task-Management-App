// import ax from "axios";

// export const API = ax.create({
//     baseURL: "http://localhost:3000/api/auth",
//     withCredentials: true,
// })


// API.interceptors.request.use((config) => {
//     const token = localStorage.getItem("accesstoken")
//     if (token) {
//         config.headers['Authorization'] = `Bearer ${token}`
//     }
//     return config
// })

// const skipRefreshRoutes = ["/login", "/register", "/refresh"];

// API.interceptors.response.use(
//     response => response,
//     async error => {
//         const originalRequest = error.config;

//         if (skipRefreshRoutes.some(route => originalRequest.url === route)) {
//         return Promise.reject(error);
//         }

//         if (error.response?.status === 498) {
//             localStorage.removeItem("accesstoken") 
//             await API.post("/logout")   
//             window.location.href = "/"
//             return Promise.reject(error)
//         }
//         if (error.response?.status === 401 && !originalRequest._retry) {
//             originalRequest._retry = true;
//             try {
//                 const res = await API.post("/refresh");

//                 localStorage.setItem("accesstoken", res.data.accesstoken);
//                 originalRequest.headers["Authorization"] = `Bearer ${res.data.accesstoken}`;

//                 return API(originalRequest);
//             } catch (refreshError) {
//                 localStorage.removeItem("accesstoken");
//                 window.location.href = "/";
//                 return Promise.reject(refreshError);
//             }
//         }
//         return Promise.reject(error);
//     }
// );


// export default API;



import ax from "axios"
import { jwtDecode } from "jwt-decode"

const API = ax.create({
    baseURL: "http://localhost:3000/api",
    withCredentials: true
})

API.interceptors.request.use(config => {
    const token = localStorage.getItem("accesstoken")
    if (token) config.headers["Authorization"] = `Bearer ${token}`
    return config
})

const skipRoutes = ["/auth/login", "/auth/register", "/auth/refresh"]

let isRefreshing = false
let failedQueue = []

const processQueue = (error, token = null) => {
    failedQueue.forEach(prom => {
        if (error) prom.reject(error)
        else prom.resolve(token)
    })
    failedQueue = []
}

API.interceptors.response.use(
    res => res,
    async err => {
        const req = err.config
        if (skipRoutes.some(r => req.url?.includes(r))) return Promise.reject(err)

        if (err.response?.status === 498) {
            localStorage.removeItem("accesstoken")
            try { await API.post("/auth/logout") } catch {}
            window.location.href = "/"
            return Promise.reject(err)
        }

        if (err.response?.status === 401 && !req._retry) {
            if (isRefreshing) {
                return new Promise((resolve, reject) => {
                    failedQueue.push({ resolve, reject })
                }).then(token => {
                    req.headers["Authorization"] = `Bearer ${token}`
                    return API(req)
                }).catch(e => Promise.reject(e))
            }

            req._retry = true
            isRefreshing = true

            try {
                const res = await API.post("/auth/refresh")
                const newToken = res.data.accesstoken
                localStorage.setItem("accesstoken", newToken)
                req.headers["Authorization"] = `Bearer ${newToken}`
                processQueue(null, newToken)
                return API(req)
            } catch (refreshErr) {
                processQueue(refreshErr, null)
                localStorage.removeItem("accesstoken")
                window.location.href = "/"
                return Promise.reject(refreshErr)
            } finally {
                isRefreshing = false
            }
        }
        return Promise.reject(err)
    }
)

// helpers
export const getMyRole = () => {
    try { return jwtDecode(localStorage.getItem("accesstoken")).role }
    catch { return null }
}

export const getMyId = () => {
    try { return jwtDecode(localStorage.getItem("accesstoken")).id }
    catch { return null }
}

export default API