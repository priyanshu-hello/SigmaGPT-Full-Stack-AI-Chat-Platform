import "./Sidebar.css";
import { useContext, useEffect } from "react";
import { MyContext } from "./MyContext.jsx";
import { v1 as uuidv1 } from "uuid";

function Sidebar() {
    const { allThreads, setAllThreads, currThreadId, setNewChat, setPrompt, setReply, setCurrThreadId, setPrevChats } = useContext(MyContext);

    const getAllThreads = async () => {
        try {
            const response = await fetch("http://localhost:8080/api/thread");
            if (!response.ok) return; // Handle 404/500 gracefully
            const res = await response.json();
            if (Array.isArray(res)) {
                const filteredData = res.map(thread => ({ threadId: thread.threadId, title: thread.title }));
                setAllThreads(filteredData);
            }
        } catch (err) {
            console.log(err);
        }
    };

    useEffect(() => {
        getAllThreads();
    }, [currThreadId])


    const createNewChat = () => {
        setNewChat(true);
        setPrompt("");
        setReply(null);
        setCurrThreadId(uuidv1());
        setPrevChats([]);
    }

    const changeThread = async (newThreadId) => {
        setCurrThreadId(newThreadId);

        try {
            const response = await fetch(`http://localhost:8080/api/thread/${newThreadId}`);
            if (!response.ok) return;
            const res = await response.json();
            console.log(res);
            if (Array.isArray(res)) {
                setPrevChats(res);
            } else {
                setPrevChats([]); // Fallback
            }
            setNewChat(false);
            setReply(null);
        } catch (err) {
            console.log(err);
            setPrevChats([]); // Fallback on error
        }
    }

    const deleteThread = async (threadId) => {
        try {
            const response = await fetch(`http://localhost:8080/api/thread/${threadId}`, { method: "DELETE" });
            const res = await response.json();
            console.log(res);

            //updated threads re-render
            setAllThreads(prev => prev.filter(thread => thread.threadId !== threadId));

            if (threadId === currThreadId) {
                createNewChat();
            }

        } catch (err) {
            console.log(err);
        }
    }

    return (
        <section className="sidebar">
            <button onClick={createNewChat}>
                <img src="/logo.svg" alt="SigmaGPT Logo" className="logo"></img>
                <span>New Chat</span>
            </button>


            <ul className="history">
                {
                    allThreads?.map((thread, idx) => (
                        <li key={idx}
                            onClick={() => changeThread(thread.threadId)}
                            className={thread.threadId === currThreadId ? "highlighted" : " "}
                        >
                            {thread.title}
                            <i className="fa-solid fa-trash"
                                onClick={(e) => {
                                    e.stopPropagation(); //stop event bubbling
                                    deleteThread(thread.threadId);
                                }}
                            ></i>
                        </li>
                    ))
                }
            </ul>

            <div className="sign">
                <p>By Mausam &hearts;</p>
            </div>
        </section>
    )
}

export default Sidebar;