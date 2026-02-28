import ax from "axios";

export const API = ax.create({
    baseURL: "http://localhost:3000/api/auth",
    withCredentials: true,
})


API.interceptors.request.use((config) => {
    const token = localStorage.getItem("accesstoken")
    if (token) {
        config.headers['Authorization'] = `Bearer ${token}`
    }
    return config
})

const skipRefreshRoutes = ["/login", "/register", "/refresh"];

API.interceptors.response.use(
    response => response,
    async error => {
        const originalRequest = error.config;

        if (skipRefreshRoutes.some(route => originalRequest.url === route)) {
        return Promise.reject(error);
        }

        if (error.response?.status === 498) {
            localStorage.removeItem("accesstoken") 
            await API.post("/logout")   
            window.location.href = "/"
            return Promise.reject(error)
        }
        if (error.response?.status === 401 && !originalRequest._retry) {
            originalRequest._retry = true;
            try {
                const res = await API.post("/refresh");

                localStorage.setItem("accesstoken", res.data.accesstoken);
                originalRequest.headers["Authorization"] = `Bearer ${res.data.accesstoken}`;

                return API(originalRequest);
            } catch (refreshError) {
                localStorage.removeItem("accesstoken");
                window.location.href = "/";
                return Promise.reject(refreshError);
            }
        }
        return Promise.reject(error);
    }
);


export default API;