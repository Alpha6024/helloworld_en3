import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Send, Bot, User, Loader } from 'lucide-react';

export default function bot() {
    const navigate = useNavigate();
    const [messages, setMessages] = useState([
        {
            role: 'bot',
            text: "Hi! 👋 I'm your eco-app assistant. I know everything about the posts, campaigns, and users on this platform. Ask me anything!"
        }
    ]);
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(false);
    const bottomRef = useRef(null);

    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const sendMessage = async () => {
        if (!input.trim() || loading) return;

        const userMessage = input.trim();
        setInput('');
        setMessages(prev => [...prev, { role: 'user', text: userMessage }]);
        setLoading(true);

        try {
            const res = await fetch('http://localhost:3000/ai/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({ message: userMessage })
            });

            const data = await res.json();

            if (data.success) {
                setMessages(prev => [...prev, { role: 'bot', text: data.reply }]);
            } else {
                setMessages(prev => [...prev, { role: 'bot', text: "Sorry, I couldn't process that. Try again!" }]);
            }
        } catch (err) {
            setMessages(prev => [...prev, { role: 'bot', text: "Connection error. Please try again." }]);
        } finally {
            setLoading(false);
        }
    };

    const handleKeyDown = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            sendMessage();
        }
    };

    return (
        <div className="max-w-md mx-auto bg-gray-50 min-h-screen flex flex-col">

            {/* Header */}
            <div className="bg-white sticky top-0 z-10 border-b border-gray-200">
                <div className="flex items-center gap-3 p-4">
                    <button onClick={() => navigate(-1)} className="text-gray-700">
                        <ArrowLeft className="w-6 h-6" />
                    </button>
                    <div className="w-9 h-9 bg-green-500 rounded-full flex items-center justify-center">
                        <Bot className="w-5 h-5 text-white" />
                    </div>
                    <div>
                        <div className="font-semibold text-sm">Eco Assistant</div>
                        <div className="text-xs text-green-500">Knows your app's live data</div>
                    </div>
                </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3 pb-24">
                {messages.map((msg, i) => (
                    <div key={i} className={`flex gap-2 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                        {msg.role === 'bot' && (
                            <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                                <Bot className="w-4 h-4 text-white" />
                            </div>
                        )}
                        <div className={`max-w-xs px-4 py-3 rounded-2xl text-sm ${
                            msg.role === 'user'
                                ? 'bg-green-500 text-white rounded-tr-sm'
                                : 'bg-white text-gray-800 rounded-tl-sm shadow-sm border border-gray-100'
                        }`}>
                            {msg.text}
                        </div>
                        {msg.role === 'user' && (
                            <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                                <User className="w-4 h-4 text-gray-600" />
                            </div>
                        )}
                    </div>
                ))}

                {loading && (
                    <div className="flex gap-2 justify-start">
                        <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center flex-shrink-0">
                            <Bot className="w-4 h-4 text-white" />
                        </div>
                        <div className="bg-white px-4 py-3 rounded-2xl rounded-tl-sm shadow-sm border border-gray-100">
                            <Loader className="w-4 h-4 text-green-500 animate-spin" />
                        </div>
                    </div>
                )}

                <div ref={bottomRef} />
            </div>

            {/* Input */}
            <div className="fixed bottom-0 left-0 right-0 max-w-md mx-auto bg-white border-t border-gray-200 p-3">
                <div className="flex gap-2 items-end">
                    <textarea
                        className="flex-1 border border-gray-200 rounded-2xl px-4 py-3 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-green-500 max-h-24"
                        rows="1"
                        placeholder="Ask about users, posts, campaigns..."
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={handleKeyDown}
                    />
                    <button
                        onClick={sendMessage}
                        disabled={loading || !input.trim()}
                        className="w-11 h-11 bg-green-500 rounded-full flex items-center justify-center disabled:opacity-50 flex-shrink-0"
                    >
                        <Send className="w-4 h-4 text-white" />
                    </button>
                </div>
            </div>
        </div>
    );
}