import { createContext, useCallback, useContext, useEffect, useState } from "react";
import api from "../api/api";
import toast from "react-hot-toast"
import { useNavigate } from "react-router-dom";
// import {setUser} from "../utils/auth";
// import {setLoadingUser} from "../utils/auth";





const Appcontext = createContext(undefined);

export function AppcontextProvider({ children }) {
    const navigate = useNavigate();

    //Auth States

    const [user, setUser] = useState(null)
    const [loadingUser, setLoadingUser] = useState(true);
    // States

    const [projects, setProjects] = useState([]);
    const [loadingProjects, setLoadingProjects] = useState(true);
    const [activeProject, setActiveProject] = useState(null);

    const [loadingActiveProject, setLoadingActiveProject] = useState(true);
    const [chatLoading, setChatLoading] = useState(false);
    const [generatingProject, setGeneratingProject] = useState(false);
    const [activeFile, setActiveFile] = useState("/App.js");
    const [showCode, setShowCode] = useState(false);

    // Auth ACTIONS 

    const CheckSession = useCallback(async () => {
        try {
            const { data } = await api.get("/api/auth/me");
            setUser(data.user);
        } catch (error) {
            setUser(null)
        } finally {
            setLoadingUser(false)
        }
    }, [])

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


    {/* Logout Function */ }


    const logout = async () => {
        try {
            await api.post("/api/auth/logout");
            setUser(null);
            setProjects([]);
            setActiveProject(null);
            setActiveFile("/App.js");


            toast.success("Logged out successfully");
            navigate("/login");
        } catch (error) {
            console.error("Logout Failed:", error);
            toast.error("Failed to log out. Please try again.");
        }
    };

    // Project Actions

    const loadProjects = useCallback(async () => {
        if (!user) return;
        try {
            const { data } = await api.get("/api/projects");
            setProjects(data);
        }
        catch (error) {
            console.error("Failed to load projects:", error);
            toast.error("Failed to load projects. Please try again.");
        }
        finally {
            setLoadingProjects(false);
        }
    }, [user]);


    // to Load the Individual Project
    const LoadProject = useCallback(async (id, silent = false) => {
        if (!user) return;
        if (!silent) setLoadingActiveProject(true);
        try {
            const { data } = await api.get(`/api/projects/${id}`);
            setActiveProject(data);
            // Default File Selection
            const files = Object.keys(data.files);
            if (files.length > 0) {
                setActiveFile((prew) => {
                    if (files.includes(prew)) {
                        return prew;
                    }
                    if (files.includes("/App.js")) {
                        return "/App.js";
                    }
                    return files[0];



                });
            } else {
                setActiveFile("/App.js");
            }
        }
        catch (error) {
            console.error("Failed to load project:", error);
            if (!silent) toast.error("Failed to load project. Please try again.");
            navigate("/");
        }
        finally {
            if (!silent) setLoadingActiveProject(false);
        }

    }, [user, navigate]);

    // Autamatacaly Poll the Active Poll Status

    useEffect(() => {

        if (!activeProject?._id || !user) return;

        const isonGoing = activeProject?.status === "generating" || activeProject?.status === "updating" || activeProject?.status === "pending" || activeProject?.status === "revising";

        if (isonGoing) {
            setChatLoading(true);
            const interval = setInterval(() => {
                LoadProject(activeProject._id, true);
            }, 2000);
            return () => clearInterval(interval);
        } else {
            setChatLoading(false);
        }


    }, [activeProject?._id, activeProject?.status, LoadProject, user])



    const handleGenerate = useCallback(
        async (prompt) => {
            if (!user) return;
            setGeneratingProject(true);
            try {
                const { data } = await api.post("/api/projects", { prompt });
                toast.success("Project generation started. This may take a few minutes.");
                navigate(`/builder/${data._id}`);
            }
            catch (error) {
                console.error("Failed to generate project:", error);
                toast.error(error?.response?.data?.error || "Failed to generate project. Please try again.");
            }
            finally {
                setGeneratingProject(false);
            }
        }, [navigate, user]
    )


    // Handke delete Function


    const handleDelete = useCallback(
        async (id) => {
            if (!user) return;

            try {
                await api.delete(`/api/projects/${id}`);
                setProjects((prev) => prev.filter((project) => project._id !== id));
                toast.success("Project deleted successfully.");

            }


            catch (error) {
                console.error("Failed to delete project:", error);
                toast.error("Failed to delete project. Please try again.");
            }

        }, [user]
    )






    return (
        <Appcontext.Provider value={{
            user,
            loadingUser,
            login,
            register,
            projects,
            loadingProjects,
            activeProject,
            loadingActiveProject,
            chatLoading,
            activeFile,
            generatingProject,
            setActiveFile,
            showCode,
            setShowCode,
            loadProjects,
            LoadProject,
            handleGenerate,
            handleDelete,
            logout
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
