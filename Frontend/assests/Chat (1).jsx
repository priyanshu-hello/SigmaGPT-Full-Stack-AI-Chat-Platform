import "./Chat.css";
import React, { useContext, useState, useEffect } from "react";
import { MyContext } from "./MyContext";
import ReactMarkdown from "react-markdown";
import rehypeHighlight from "rehype-highlight";
import "highlight.js/styles/github-dark.css";

// Import languages for syntax highlighting
import java from 'highlight.js/lib/languages/java';
import javascript from 'highlight.js/lib/languages/javascript';
import python from 'highlight.js/lib/languages/python';
import cpp from 'highlight.js/lib/languages/cpp';
import c from 'highlight.js/lib/languages/c';
import csharp from 'highlight.js/lib/languages/csharp';
import bash from 'highlight.js/lib/languages/bash';
import json from 'highlight.js/lib/languages/json';
import sql from 'highlight.js/lib/languages/sql';
import xml from 'highlight.js/lib/languages/xml';
import css from 'highlight.js/lib/languages/css';
import typescript from 'highlight.js/lib/languages/typescript';
import go from 'highlight.js/lib/languages/go';
import kotlin from 'highlight.js/lib/languages/kotlin';
import rust from 'highlight.js/lib/languages/rust';
import swift from 'highlight.js/lib/languages/swift';
import yaml from 'highlight.js/lib/languages/yaml';
import markdown from 'highlight.js/lib/languages/markdown';

const languages = {
    java, javascript, python, cpp, c, csharp, bash, json, sql, xml, css, typescript, go, kotlin, rust, swift, yaml, markdown
};

function Chat() {
    const { newChat, prevChats, reply } = useContext(MyContext);
    const [latestReply, setLatestReply] = useState(null);

    const chatEndRef = React.useRef(null);

    const scrollToBottom = () => {
        chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [prevChats, latestReply]);

    useEffect(() => {
        if (!reply) { // Handles null, undefined, empty string
            setLatestReply(null); //prevchat load
            return;
        }

        if (!Array.isArray(prevChats) || !prevChats.length) return;

        const content = reply.split(" "); //individual words

        let idx = 0;
        const interval = setInterval(() => {
            setLatestReply(content.slice(0, idx + 1).join(" "));
            scrollToBottom();
            idx++;
            if (idx >= content.length) clearInterval(interval);
        }, 30);

        return () => clearInterval(interval);

    }, [prevChats, reply])

    const suggestions = [
        { icon: "fa-code", text: "Write a React component" },
        { icon: "fa-pen-nib", text: "Draft an email" },
        { icon: "fa-lightbulb", text: "Explain Quantum Physics" },
        { icon: "fa-bug", text: "Debug this code" }
    ];

    const { setPrompt } = useContext(MyContext);
    const [toast, setToast] = useState(null);

    const showToast = (message) => {
        setToast(message);
        setTimeout(() => setToast(null), 2000);
    };

    // ... PreBlock component ...
    const PreBlock = ({ children, ...props }) => {
        const preRef = React.useRef(null);

        // Extract language from code element (first child)
        const codeChild = React.Children.toArray(children)[0];
        const className = codeChild?.props?.className || '';
        const match = /language-(\w+)/.exec(className);
        let language = match ? match[1] : 'Code';

        // Map common keys to display names
        const languageMap = {
            'cpp': 'C++',
            'csharp': 'C#',
            'javascript': 'JavaScript',
            'typescript': 'TypeScript',
            'html': 'HTML',
            'css': 'CSS',
            'json': 'JSON',
            'sql': 'SQL'
        };

        language = languageMap[language] || (language.charAt(0).toUpperCase() + language.slice(1));

        const handleCopy = () => {
            if (preRef.current) {
                const codeText = preRef.current.innerText;
                navigator.clipboard.writeText(codeText);
                showToast("Copied to clipboard! 📋");
            }
        };

        return (
            <div className="code-block-wrapper">
                <div className="code-header">
                    <span>{language}</span>
                    <button onClick={handleCopy} className="copy-btn">
                        <i className="fa-regular fa-copy"></i>
                        Copy
                    </button>
                </div>
                <pre ref={preRef} {...props}>
                    {children}
                </pre>
            </div>
        );
    };


    return (
        <>
            {toast && <div className="toast-notification">{toast}</div>}
            {newChat ? (
                <div className="hero">
                    <img src="/logo.svg" className="hero-logo" alt="SigmaGPT logo" />
                    <h1>Welcome to SigmaGPT</h1>
                    <p>How can I help you today?</p>
                    <div className="suggestion-grid">
                        {suggestions.map((s, i) => (
                            <div key={i} className="suggestion-card" onClick={() => setPrompt(s.text)}>
                                <i className={`fa-solid ${s.icon}`}></i>
                                <span>{s.text}</span>
                            </div>
                        ))}
                    </div>
                </div>
            ) : null}
            <div className="chats">
                {
                    Array.isArray(prevChats) && prevChats.slice(0, -1).map((chat, idx) =>
                        <div className={chat.role === "user" ? "userDiv" : "gptDiv"} key={idx}>
                            {
                                chat.role === "user" ?
                                    <p className="userMessage">{chat.content}</p> :
                                    <ReactMarkdown
                                        components={{ pre: PreBlock }}
                                        rehypePlugins={[[rehypeHighlight, {
                                            detect: true,
                                            languages,
                                            // auto-detect only these (prevents CSS/INI false positives on C++ code)
                                            subset: ['java', 'javascript', 'python', 'cpp', 'c', 'csharp', 'go', 'rust', 'typescript', 'bash']
                                        }]]}
                                    >
                                        {chat.content}
                                    </ReactMarkdown>
                            }
                        </div>
                    )
                }

                {
                    Array.isArray(prevChats) && prevChats.length > 0 && (
                        <>
                            {
                                latestReply === null && prevChats[prevChats.length - 1] ? (
                                    <div className="gptDiv" key={"non-typing"} >
                                        <ReactMarkdown
                                            components={{ pre: PreBlock }}
                                            rehypePlugins={[[rehypeHighlight, {
                                                detect: true,
                                                languages,
                                                subset: ['java', 'javascript', 'python', 'cpp', 'c', 'csharp', 'go', 'rust', 'typescript', 'bash']
                                            }]]}
                                        >
                                            {prevChats[prevChats.length - 1].content || ""}
                                        </ReactMarkdown>
                                    </div>
                                ) : (
                                    <div className="gptDiv" key={"typing"} >
                                        <ReactMarkdown
                                            components={{ pre: PreBlock }}
                                            rehypePlugins={[[rehypeHighlight, {
                                                detect: true,
                                                languages,
                                                subset: ['java', 'javascript', 'python', 'cpp', 'c', 'csharp', 'go', 'rust', 'typescript', 'bash']
                                            }]]}
                                        >
                                            {latestReply || ""}
                                        </ReactMarkdown>
                                    </div>
                                )
                            }
                        </>
                    )
                }
                <div ref={chatEndRef} />
            </div>
        </>
    )
}

export default Chat;