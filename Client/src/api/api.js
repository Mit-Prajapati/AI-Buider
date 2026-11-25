import axios from "axios";
// my bane is mit

const api = axios.create({
    baseURL: import.meta.env.VITE_BASE_URL || "",
    withCredentials: true,
});





export default api;
