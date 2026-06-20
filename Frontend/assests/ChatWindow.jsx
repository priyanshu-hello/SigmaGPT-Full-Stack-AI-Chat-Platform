import "./ChatWindow.css";
import Chat from "./Chat.jsx";
import { MyContext } from "./MyContext.jsx";
import { useContext, useState, useEffect } from "react";
import { ScaleLoader } from "react-spinners";

function ChatWindow() {
    const { prompt, setPrompt, reply, setReply, currThreadId, setPrevChats, setNewChat } = useContext(MyContext);
    const [loading, setLoading] = useState(false);
    const [isOpen, setIsOpen] = useState(false);
    const [isListening, setIsListening] = useState(false);
    const [showAttachMenu, setShowAttachMenu] = useState(false);

    // Voice Recognition Setup
    const startListening = () => {
        if ('webkitSpeechRecognition' in window) {
            const recognition = new window.webkitSpeechRecognition();
            recognition.continuous = false;
            recognition.lang = 'en-US';

            recognition.onstart = () => setIsListening(true);
            recognition.onend = () => setIsListening(false);
            recognition.onresult = (event) => {
                const transcript = event.results[0][0].transcript;
                setPrompt(prev => prev ? prev + " " + transcript : transcript);
            };

            recognition.start();
        } else {
            alert("Voice recognition is not supported in this browser.");
        }
    };

    const handleAttachClick = () => {
        setShowAttachMenu(!showAttachMenu);
    };

    const getReply = async () => {
        setLoading(true);
        setNewChat(false);

        console.log("message ", prompt, " threadId ", currThreadId);

        let aiResponse = null;
        try {
            // 1. Generate AI Response Locally (Browser AI)
            const strictPrompt = prompt + "\n\n[SYSTEM: You are a restricted coding assistant. Strict Output Rules:\n1. ALL code, INCLUDING imports, headers, function signatures, and logic MUST be inside a Markdown code block (```language).\n2. PREVENT PLAIN TEXT CODE: Do not write code lines outside code blocks.\n3. ALWAYS specify the language tag (e.g., ```cpp, ```java).]";

            const resp = await window.puter.ai.chat(strictPrompt);
            aiResponse = resp?.message?.content || resp?.toString(); // Handle format
            console.log("Puter.js Response:", aiResponse);
        } catch (err) {
            console.error("Puter.js Failed:", err);
            aiResponse = "I apologize, but I am unable to generate a response right now.";
        }

        // 2. Save conversation to Backend
        const options = {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                message: prompt,
                threadId: currThreadId,
                aiReply: aiResponse // Send generated reply to save
            })
        };

        try {
            const response = await fetch("http://localhost:8080/api/chat", options);
            const res = await response.json();
            console.log(res);
            setReply(res.reply);
        } catch (err) {
            console.log(err);
            // Even if backend fails, show the AI response locally so user isn't blocked
            if (aiResponse) setReply(aiResponse);
        }
        setLoading(false);
    }

    //Append new chat to prevChats
    useEffect(() => {
        if (prompt && reply) {
            setPrevChats(prevChats => (
                [...prevChats, {
                    role: "user",
                    content: prompt
                }, {
                    role: "assistant",
                    content: reply
                }]
            ));
        }

        setPrompt("");
    }, [reply]);


    const handleProfileClick = () => {
        setIsOpen(!isOpen);
    }

    return (
        <div className="chatWindow">
            <div className="navbar">
                <div className="logo-section">
                    <img src="/logo.svg" alt="SigmaGPT logo" className="nav-logo" />

                    <span>SigmaGPT <i className="fa-solid fa-chevron-down"></i></span>
                </div>
                <div className="userIconDiv" onClick={handleProfileClick}>
                    <span className="userIcon"><i className="fa-solid fa-user"></i></span>
                </div>
            </div>
            {
                isOpen &&
                <div className="dropDown">
                    <div className="dropDownItem"><i class="fa-solid fa-gear"></i> Settings</div>
                    <div className="dropDownItem"><i class="fa-solid fa-cloud-arrow-up"></i> Upgrade plan</div>
                    <div className="dropDownItem"><i class="fa-solid fa-arrow-right-from-bracket"></i> Log out</div>
                </div>
            }
            <Chat></Chat>

            <ScaleLoader color="#fff" loading={loading}>
            </ScaleLoader>

            <div className="chatInput">
                <div className={`inputBox ${loading ? "loading-pulse" : ""}`}>
                    <div className="attach-btn" onClick={handleAttachClick}>
                        <i className="fa-solid fa-plus"></i>
                    </div>
                    {showAttachMenu && (
                        <div className="attach-menu">
                            <div className="attach-item"><i className="fa-solid fa-image"></i> Photos</div>
                            <div className="attach-item"><i className="fa-solid fa-folder"></i> Folder</div>
                        </div>
                    )}

                    <input placeholder="Ask anything"
                        value={prompt}
                        onChange={(e) => setPrompt(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' ? getReply() : ''}
                    >

                    </input>
                    <div className="voice-btn" onClick={startListening} style={{ color: isListening ? '#ef4444' : '#94a3b8' }}>
                        <i className={`fa-solid ${isListening ? 'fa-microphone-lines' : 'fa-microphone'}`}></i>
                    </div>
                    <div id="submit" onClick={getReply}><i className="fa-solid fa-paper-plane"></i></div>
                </div>
                <p className="info">
                    SigmaGPT can make mistakes. Check important info. See Cookie Preferences.
                </p>
            </div>
        </div>
    )
}

export default ChatWindow;