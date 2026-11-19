import { createContext, useContext, useEffect, useState } from "react";
import api from "../api/api";
import toast from "react-hot-toast"
// import {setUser} from "../utils/auth";
// import {setLoadingUser} from "../utils/auth";





const Appcontext = createContext(undefined);

export function AppcontextProvider({ children }) {

    //Auth States

    const [user, setUser] = useState(null)
    const [loadingUser, setLoadingUser] = useState(true);

    // Auth ACTIONS 

    const CheckSession = async () => {
        try {
            const { data } = await api.get("/api/auth/me");
            setUser(data.user);
        } catch (error) {
            setUser(null)
        } finally {
            setLoadingUser(false)
        }
    }

    useEffect(() => {
        CheckSession()
    }, [CheckSession])

    const login = async (email, password) => {
        try {
            const { data } = await api.post("/api/auth/login", { email, password });
            setUser(data.user)
            toast.success("WelCome Back ")
        } catch (err) {
            console.error("Login Failed:", err);
            const errMsg = err?.response?.data?.error || " Invaild Email or the Password";
            toast.error(errMsg);
            throw new Error(errMsg);
        }
    }


    const register = async (name, email, password) => {
        try {
            const { data } = await api.post("/api/auth/register", { name, email, password });
            setUser(data.user);
            toast.success("Account created successfully");
        } catch (err) {
            const errMsg = err?.response?.data?.error || "Registration failed. Please try again.";
            toast.error(errMsg);
            throw new Error(errMsg);
        }
    };

    return (
        <Appcontext.Provider value={{
            user,
            loadingUser,
            login,
            register
        }}>
            {children}
        </Appcontext.Provider>
    )
}


export function useAppContext() {
    const context = useContext(Appcontext);
    if (context === undefined) {
        throw new Error("UseAppContext Must be used within an Appcontext Provider");

    }

    return context;
}
