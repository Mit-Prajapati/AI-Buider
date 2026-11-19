import { createContext, useContext, useEffect, useState } from "react";
import api from "../api/api";
// import {setUser} from "../utils/auth";
// import {setLoadingUser} from "../utils/auth";





const Appcontext = createContext(undefined);

export function AppcontextProvider({children}){
    //Auth States

    const [user,setUser] = useState(null)
    const [loadingUser, setLoadingUser] = useState(true);

    // Auth ACTIONS 

    const CheckSession = async () => {
        try {
            const {data} = await api.get("/api/auth/me");
            // setUser(data.user);
        } catch (error) {
            setUser(null)
        }finally{
            setLoadingUser(false)
        }
    }

    useEffect(()=>{
        CheckSession()
    },[CheckSession])
    return(
        <Appcontext.Provider value={{
            user,
            loadingUser
        }}>
            {children}
        </Appcontext.Provider>
    )
}


export function useAppContext(){
    const context = useContext(Appcontext);
    if(context === undefined){
        throw new Error ("UseAppContext Must be used within an Appcontext Provider");

    }

    return context;
}
