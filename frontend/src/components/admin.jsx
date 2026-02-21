import { useState, useEffect } from "react";
import { Users, Target, LogOut, DollarSign, Send, Eye, Lock, Shield, AlertTriangle, CheckCircle, XCircle, Flag, Trash2, RefreshCw } from "lucide-react";

const ADMIN_USERNAME = "admin";
const ADMIN_PASSWORD = "prithvi@2026";
const RAZORPAY_KEY = "rzp_test_SGtmofw4CWXzzG";
const API = "http://localhost:3000";

export default function Admin() {
    const [loggedIn, setLoggedIn] = useState(false);
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [loginError, setLoginError] = useState("");

    const [stats, setStats] = useState({ users: 0, campaigns: 0, pool: 0 });
    const [campaigns, setCampaigns] = useState([]);
    const [transactions, setTransactions] = useState([]);
    const [users, setUsers] = useState([]);
    const [tab, setTab] = useState("overview");

    const [allocAmount, setAllocAmount] = useState({});
    const [allocMsg, setAllocMsg] = useState({});
    const [allocating, setAllocating] = useState({});

    // Scam detection state
    const [scamCampaigns, setScamCampaigns] = useState([]);
    const [scamLoading, setScamLoading] = useState(false);
    const [expandedScam, setExpandedScam] = useState(null);
    const [actionMsg, setActionMsg] = useState({});

    useEffect(() => {
        const script = document.createElement("script");
        script.src = "https://checkout.razorpay.com/v1/checkout.js";
        script.async = true;
        document.body.appendChild(script);
        return () => document.body.removeChild(script);
    }, []);

    useEffect(() => {
        if (loggedIn) {
            fetchAll();
        }
    }, [loggedIn]);

    useEffect(() => {
        if (loggedIn && tab === "scam") {
            fetchScamData();
        }
    }, [tab, loggedIn]);

    const handleLogin = () => {
        if (username === ADMIN_USERNAME && password === ADMIN_PASSWORD) {
            setLoggedIn(true);
            setLoginError("");
        } else {
            setLoginError("Invalid username or password");
        }
    };

    const fetchAll = async () => {
        try {
            const [usersRes, campaignsRes, poolRes, txRes] = await Promise.all([
                fetch(`${API}/admin/users`, { credentials: "include" }),
                fetch(`${API}/campaign/all`, { credentials: "include" }),
                fetch(`${API}/donation/pool`),
                fetch(`${API}/donation/transactions`, { credentials: "include" }),
            ]);
            const usersData = await usersRes.json();
            const campaignsData = await campaignsRes.json();
            const poolData = await poolRes.json();
            const txData = await txRes.json();

            if (usersData.success) setUsers(usersData.users);
            if (campaignsData.success) setCampaigns(campaignsData.campaigns);
            if (txData.success) setTransactions(txData.transactions);
            setStats({
                users: usersData.success ? usersData.users.length : 0,
                campaigns: campaignsData.success ? campaignsData.campaigns.length : 0,
                pool: poolData.success ? poolData.totalPool : 0,
            });
        } catch (err) {
            console.error(err);
        }
    };

    const fetchScamData = async () => {
        setScamLoading(true);
        try {
            const res = await fetch(`${API}/admin/scam-detection`, { credentials: "include" });
            const data = await res.json();
            if (data.success) setScamCampaigns(data.campaigns);
        } catch (err) {
            console.error(err);
        }
        setScamLoading(false);
    };

    const handleFlag = async (campaignId, reason) => {
        try {
            await fetch(`${API}/admin/campaign/flag/${campaignId}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                credentials: "include",
                body: JSON.stringify({ flagged: true, reason })
            });
            setActionMsg(prev => ({ ...prev, [campaignId]: "🚩 Campaign flagged" }));
            fetchScamData();
        } catch (err) {
            setActionMsg(prev => ({ ...prev, [campaignId]: "Failed" }));
        }
    };

    const handleRemove = async (campaignId) => {
        if (!window.confirm("Are you sure? This will permanently delete the campaign and notify the creator.")) return;
        try {
            const res = await fetch(`${API}/admin/campaign/remove/${campaignId}`, {
                method: "DELETE",
                credentials: "include"
            });
            const data = await res.json();
            if (data.success) {
                setActionMsg(prev => ({ ...prev, [campaignId]: "✅ Removed" }));
                fetchScamData();
            }
        } catch (err) {
            setActionMsg(prev => ({ ...prev, [campaignId]: "Failed" }));
        }
    };

    const handleAllocate = async (campaignId, campaignTitle) => {
        const amount = Number(allocAmount[campaignId]);
        if (!amount || amount < 1) {
            setAllocMsg(prev => ({ ...prev, [campaignId]: "Enter a valid amount" }));
            return;
        }
        if (amount > stats.pool) {
            setAllocMsg(prev => ({ ...prev, [campaignId]: `Exceeds pool balance (₹${stats.pool})` }));
            return;
        }
        setAllocating(prev => ({ ...prev, [campaignId]: true }));
        setAllocMsg(prev => ({ ...prev, [campaignId]: "" }));
        try {
            const orderRes = await fetch(`${API}/payment/create-order`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ amount }),
            });
            const order = await orderRes.json();
            if (!order.id) {
                setAllocMsg(prev => ({ ...prev, [campaignId]: "Failed to create payment order" }));
                setAllocating(prev => ({ ...prev, [campaignId]: false }));
                return;
            }
            const options = {
                key: RAZORPAY_KEY,
                amount: order.amount,
                currency: order.currency || "INR",
                name: "Prithvi Admin",
                description: `Allocating ₹${amount} to "${campaignTitle}"`,
                order_id: order.id,
                handler: async function (response) {
                    try {
                        const allocRes = await fetch(`${API}/donation/admin-allocate`, {
                            method: "POST",
                            headers: { "Content-Type": "application/json" },
                            credentials: "include",
                            body: JSON.stringify({
                                campaignId,
                                amount,
                                razorpay_order_id: response.razorpay_order_id,
                                razorpay_payment_id: response.razorpay_payment_id,
                                razorpay_signature: response.razorpay_signature,
                            }),
                        });
                        const result = await allocRes.json();
                        if (result.success) {
                            setAllocMsg(prev => ({ ...prev, [campaignId]: `✅ ₹${amount} sent to "${campaignTitle}"` }));
                            setAllocAmount(prev => ({ ...prev, [campaignId]: "" }));
                            fetchAll();
                        } else {
                            setAllocMsg(prev => ({ ...prev, [campaignId]: result.message || "Allocation failed" }));
                        }
                    } catch (err) {
                        setAllocMsg(prev => ({ ...prev, [campaignId]: "Allocation failed after payment" }));
                    }
                },
                modal: {
                    ondismiss: () => {
                        setAllocMsg(prev => ({ ...prev, [campaignId]: "Payment cancelled" }));
                        setAllocating(prev => ({ ...prev, [campaignId]: false }));
                    }
                },
                prefill: { name: "Admin", email: "admin@prithvi.com" },
                theme: { color: "#22c55e" },
            };
            const rzp = new window.Razorpay(options);
            rzp.on("payment.failed", () => {
                setAllocMsg(prev => ({ ...prev, [campaignId]: "Payment failed" }));
            });
            rzp.open();
        } catch (err) {
            setAllocMsg(prev => ({ ...prev, [campaignId]: "Something went wrong" }));
        }
        setAllocating(prev => ({ ...prev, [campaignId]: false }));
    };

    const activeCampaigns = campaigns.filter(c => c.status === "active");
    const completedCampaigns = campaigns.filter(c => c.status === "completed");
    const totalDonations = transactions.filter(t => t.type === "donation").reduce((s, t) => s + t.amount, 0);
    const totalAllocated = transactions.filter(t => t.type === "allocation").reduce((s, t) => s + t.amount, 0);

    const highRisk = scamCampaigns.filter(c => c.riskLevel === "high");
    const mediumRisk = scamCampaigns.filter(c => c.riskLevel === "medium");
    const lowRisk = scamCampaigns.filter(c => c.riskLevel === "low");

    const severityColor = (s) => s === "high" ? "text-red-400 bg-red-900" : s === "medium" ? "text-yellow-400 bg-yellow-900" : "text-blue-400 bg-blue-900";
    const riskBadgeColor = (level) => level === "high" ? "bg-red-500" : level === "medium" ? "bg-yellow-500" : "bg-green-500";

    if (!loggedIn) {
        return (
            <div className="min-h-screen bg-gray-950 flex items-center justify-center px-4">
                <div className="w-full max-w-sm">
                    <div className="text-center mb-8">
                        <div className="w-16 h-16 bg-green-500 rounded-2xl flex items-center justify-center mx-auto mb-4">
                            <Lock className="w-8 h-8 text-white" />
                        </div>
                        <h1 className="text-2xl font-bold text-white">Admin Panel</h1>
                        <p className="text-gray-400 text-sm mt-1">Prithvi Platform</p>
                    </div>
                    <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6">
                        <div className="mb-4">
                            <label className="text-xs text-gray-400 uppercase font-semibold mb-1 block">Username</label>
                            <input
                                type="text"
                                value={username}
                                onChange={e => setUsername(e.target.value)}
                                onKeyDown={e => e.key === "Enter" && handleLogin()}
                                placeholder="admin"
                                className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:border-green-500 text-sm"
                            />
                        </div>
                        <div className="mb-5">
                            <label className="text-xs text-gray-400 uppercase font-semibold mb-1 block">Password</label>
                            <input
                                type="password"
                                value={password}
                                onChange={e => setPassword(e.target.value)}
                                onKeyDown={e => e.key === "Enter" && handleLogin()}
                                placeholder="••••••••"
                                className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:border-green-500 text-sm"
                            />
                        </div>
                        {loginError && <p className="text-red-400 text-xs mb-4 text-center">{loginError}</p>}
                        <button onClick={handleLogin} className="w-full bg-green-500 hover:bg-green-400 text-white font-semibold py-3 rounded-xl transition">
                            Login
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-950 text-white">
            <div className="sticky top-0 bg-gray-900 border-b border-gray-800 z-10">
                <div className="max-w-6xl mx-auto flex items-center justify-between px-6 py-4">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-green-500 rounded-lg flex items-center justify-center">
                            <span className="text-sm font-black">P</span>
                        </div>
                        <h1 className="font-bold text-lg">Prithvi Admin</h1>
                    </div>
                    <button onClick={() => setLoggedIn(false)} className="flex items-center gap-2 text-gray-400 hover:text-red-400 transition text-sm">
                        <LogOut className="w-4 h-4" /> Logout
                    </button>
                </div>
            </div>

            <div className="max-w-6xl mx-auto px-6 py-8">

                {/* Stat Cards */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                    <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5">
                        <div className="flex items-center gap-3 mb-2">
                            <Users className="w-5 h-5 text-blue-400" />
                            <span className="text-gray-400 text-sm">Total Users</span>
                        </div>
                        <p className="text-3xl font-black text-white">{stats.users}</p>
                    </div>
                    <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5">
                        <div className="flex items-center gap-3 mb-2">
                            <Target className="w-5 h-5 text-green-400" />
                            <span className="text-gray-400 text-sm">Campaigns</span>
                        </div>
                        <p className="text-3xl font-black text-white">{stats.campaigns}</p>
                        <p className="text-xs text-gray-500 mt-1">{activeCampaigns.length} active · {completedCampaigns.length} done</p>
                    </div>
                    <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5">
                        <div className="flex items-center gap-3 mb-2">
                            <DollarSign className="w-5 h-5 text-yellow-400" />
                            <span className="text-gray-400 text-sm">Total Donated</span>
                        </div>
                        <p className="text-3xl font-black text-white">₹{totalDonations.toLocaleString()}</p>
                    </div>
                    <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5">
                        <div className="flex items-center gap-3 mb-2">
                            <Send className="w-5 h-5 text-emerald-400" />
                            <span className="text-gray-400 text-sm">Pool Balance</span>
                        </div>
                        <p className="text-3xl font-black text-emerald-400">₹{stats.pool.toLocaleString()}</p>
                        <p className="text-xs text-gray-500 mt-1">₹{totalAllocated} allocated so far</p>
                    </div>
                </div>

                {/* Pool Low Balance Warning */}
                {stats.pool < 500 && stats.pool >= 0 && (
                    <div className="bg-red-900 border border-red-700 rounded-2xl p-4 mb-6 flex items-center gap-3">
                        <AlertTriangle className="w-5 h-5 text-red-400 shrink-0" />
                        <div>
                            <p className="text-red-300 font-semibold text-sm">⚠️ Pool Low Balance Alert</p>
                            <p className="text-red-400 text-xs mt-0.5">Pool balance is ₹{stats.pool} — below ₹500 threshold. Consider encouraging more donations.</p>
                        </div>
                    </div>
                )}

                {/* Tabs */}
                <div className="flex gap-2 mb-6 flex-wrap">
                    {["overview", "allocate", "users", "transactions", "scam"].map(t => (
                        <button
                            key={t}
                            onClick={() => setTab(t)}
                            className={`px-4 py-2 rounded-xl text-sm font-medium capitalize transition flex items-center gap-1.5 ${
                                tab === t ? "bg-green-500 text-white" : "bg-gray-800 text-gray-400 hover:bg-gray-700"
                            }`}
                        >
                            {t === "scam" && <Shield className="w-3.5 h-3.5" />}
                            {t === "scam" ? "Scam Detection" : t}
                            {t === "scam" && highRisk.length > 0 && (
                                <span className="bg-red-500 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center font-bold">
                                    {highRisk.length}
                                </span>
                            )}
                        </button>
                    ))}
                </div>

                {/* OVERVIEW TAB */}
                {tab === "overview" && (
                    <div className="grid md:grid-cols-2 gap-6">
                        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5">
                            <h2 className="font-semibold text-green-400 mb-4">🟢 Active Campaigns ({activeCampaigns.length})</h2>
                            <div className="space-y-3 max-h-80 overflow-y-auto">
                                {activeCampaigns.length === 0 && <p className="text-gray-500 text-sm">None</p>}
                                {activeCampaigns.map(c => (
                                    <div key={c._id} className="bg-gray-800 rounded-xl p-3">
                                        <p className="font-medium text-sm">{c.title}</p>
                                        <p className="text-xs text-gray-400 mt-0.5">by @{c.userId?.username || "unknown"}</p>
                                        <div className="flex items-center gap-2 mt-2">
                                            <div className="flex-1 bg-gray-700 rounded-full h-1.5">
                                                <div className="bg-green-500 h-1.5 rounded-full" style={{ width: `${c.progress || 0}%` }} />
                                            </div>
                                            <span className="text-xs text-gray-400">{c.progress || 0}%</span>
                                        </div>
                                        <div className="flex gap-3 mt-1 text-xs text-gray-500">
                                            <span>👥 {c.members?.length || 0}/{c.peopleNeeded}</span>
                                            <span>💰 ₹{c.amountRaised || 0}</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5">
                            <h2 className="font-semibold text-gray-400 mb-4">✅ Completed Campaigns ({completedCampaigns.length})</h2>
                            <div className="space-y-3 max-h-80 overflow-y-auto">
                                {completedCampaigns.length === 0 && <p className="text-gray-500 text-sm">None</p>}
                                {completedCampaigns.map(c => (
                                    <div key={c._id} className="bg-gray-800 rounded-xl p-3">
                                        <p className="font-medium text-sm">{c.title}</p>
                                        <p className="text-xs text-gray-400 mt-0.5">by @{c.userId?.username || "unknown"}</p>
                                        <div className="flex gap-3 mt-1 text-xs text-gray-500">
                                            <span>👥 {c.members?.length || 0} members</span>
                                            <span>💰 ₹{c.amountRaised || 0} raised</span>
                                            <span>⭐ {c.feedbacks?.length || 0} reviews</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                )}

                {/* ALLOCATE TAB */}
                {tab === "allocate" && (
                    <div>
                        <div className="bg-emerald-900 border border-emerald-700 rounded-2xl p-4 mb-6 flex items-center justify-between">
                            <div>
                                <p className="text-xs text-emerald-400 uppercase font-semibold">Available Pool Balance</p>
                                <p className="text-3xl font-black text-white">₹{stats.pool.toLocaleString()}</p>
                                <p className="text-xs text-emerald-500 mt-1">Payment via Razorpay required to allocate</p>
                            </div>
                            <Send className="w-10 h-10 text-emerald-400 opacity-50" />
                        </div>
                        <h2 className="font-semibold text-white mb-4">Send Funds to Campaigns</h2>
                        <div className="space-y-4">
                            {campaigns.length === 0 && <p className="text-gray-500 text-sm">No campaigns found.</p>}
                            {campaigns.map(c => (
                                <div key={c._id} className="bg-gray-900 border border-gray-800 rounded-2xl p-5">
                                    <div className="flex items-start justify-between mb-3">
                                        <div>
                                            <p className="font-semibold">{c.title}</p>
                                            <p className="text-xs text-gray-400">@{c.userId?.username || "unknown"}</p>
                                        </div>
                                        <span className={`text-xs px-2 py-1 rounded-full font-medium ${c.status === "active" ? "bg-green-900 text-green-400" : "bg-gray-800 text-gray-500"}`}>
                                            {c.status}
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-2 mb-2">
                                        <div className="flex-1 bg-gray-800 rounded-full h-2">
                                            <div className="bg-green-500 h-2 rounded-full" style={{ width: `${c.progress || 0}%` }} />
                                        </div>
                                        <span className="text-xs text-gray-400 w-10">{c.progress || 0}%</span>
                                    </div>
                                    <div className="flex gap-4 text-xs text-gray-500 mb-4 flex-wrap">
                                        <span>👥 {c.members?.length || 0}/{c.peopleNeeded} members</span>
                                        <span>💰 ₹{c.amountRaised || 0} raised</span>
                                        {c.feedbacks?.length > 0 && (
                                            <span>⭐ {(c.feedbacks.reduce((s, f) => s + f.rating, 0) / c.feedbacks.length).toFixed(1)}/5</span>
                                        )}
                                    </div>
                                    <div className="flex gap-2">
                                        <input
                                            type="number"
                                            placeholder="Amount ₹"
                                            value={allocAmount[c._id] || ""}
                                            onChange={e => setAllocAmount(prev => ({ ...prev, [c._id]: e.target.value }))}
                                            className="flex-1 bg-gray-800 border border-gray-700 rounded-xl px-3 py-2 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-green-500"
                                        />
                                        <button
                                            onClick={() => handleAllocate(c._id, c.title)}
                                            disabled={allocating[c._id]}
                                            className="bg-green-500 hover:bg-green-400 disabled:opacity-50 text-white font-semibold px-4 py-2 rounded-xl text-sm flex items-center gap-1 transition"
                                        >
                                            <Send className="w-4 h-4" />
                                            {allocating[c._id] ? "Opening..." : "Pay & Send"}
                                        </button>
                                    </div>
                                    {allocMsg[c._id] && (
                                        <p className={`text-xs mt-2 font-medium ${allocMsg[c._id].startsWith("✅") ? "text-green-400" : "text-red-400"}`}>
                                            {allocMsg[c._id]}
                                        </p>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* USERS TAB */}
                {tab === "users" && (
                    <div className="bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden">
                        <div className="p-4 border-b border-gray-800 flex items-center justify-between">
                            <h2 className="font-semibold">All Users ({users.length})</h2>
                            <Eye className="w-4 h-4 text-gray-500" />
                        </div>
                        <div className="divide-y divide-gray-800 max-h-[600px] overflow-y-auto">
                            {users.length === 0 && <p className="text-gray-500 text-sm p-4">No users found.</p>}
                            {users.map(u => (
                                <div key={u._id} className="flex items-center gap-3 p-4 hover:bg-gray-800 transition">
                                    {u.avatar ? (
                                        <img src={u.avatar} className="w-10 h-10 rounded-full object-cover" alt="" />
                                    ) : (
                                        <div className="w-10 h-10 rounded-full bg-green-900 flex items-center justify-center text-green-400 font-bold">
                                            {u.name?.[0] || "?"}
                                        </div>
                                    )}
                                    <div className="flex-1 min-w-0">
                                        <p className="font-medium text-sm truncate">{u.name}</p>
                                        <p className="text-xs text-gray-400">@{u.username || "no username"} · {u.email}</p>
                                    </div>
                                    <div className="text-right shrink-0">
                                        <p className="text-xs text-gray-500">Trust</p>
                                        <p className={`text-sm font-bold ${(u.trustScore || 0) >= 75 ? "text-green-400" : (u.trustScore || 0) >= 50 ? "text-yellow-400" : "text-gray-400"}`}>
                                            {u.trustScore || 0}%
                                        </p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* TRANSACTIONS TAB */}
                {tab === "transactions" && (
                    <div className="bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden">
                        <div className="p-4 border-b border-gray-800">
                            <h2 className="font-semibold">All Transactions ({transactions.length})</h2>
                        </div>
                        <div className="divide-y divide-gray-800 max-h-[600px] overflow-y-auto">
                            {transactions.length === 0 && <p className="text-gray-500 text-sm p-4">No transactions yet.</p>}
                            {transactions.map(t => (
                                <div key={t._id} className="flex items-center justify-between p-4 hover:bg-gray-800 transition">
                                    <div>
                                        <p className="text-sm font-medium">{t.description}</p>
                                        <p className="text-xs text-gray-500 mt-0.5">
                                            {new Date(t.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                                        </p>
                                    </div>
                                    <div className="text-right">
                                        <p className={`font-bold ${t.type === "donation" ? "text-emerald-400" : "text-orange-400"}`}>
                                            {t.type === "donation" ? "+" : "-"}₹{t.amount}
                                        </p>
                                        <p className="text-xs text-gray-500 capitalize">{t.type}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* SCAM DETECTION TAB */}
                {tab === "scam" && (
                    <div>
                        {/* Summary bar */}
                        <div className="grid grid-cols-3 gap-4 mb-6">
                            <div className="bg-red-950 border border-red-800 rounded-2xl p-4 text-center">
                                <p className="text-3xl font-black text-red-400">{highRisk.length}</p>
                                <p className="text-xs text-red-500 mt-1">🚨 High Risk</p>
                            </div>
                            <div className="bg-yellow-950 border border-yellow-800 rounded-2xl p-4 text-center">
                                <p className="text-3xl font-black text-yellow-400">{mediumRisk.length}</p>
                                <p className="text-xs text-yellow-500 mt-1">⚠️ Suspicious</p>
                            </div>
                            <div className="bg-green-950 border border-green-800 rounded-2xl p-4 text-center">
                                <p className="text-3xl font-black text-green-400">{lowRisk.length}</p>
                                <p className="text-xs text-green-500 mt-1">✅ Clean</p>
                            </div>
                        </div>

                        <div className="flex items-center justify-between mb-4">
                            <h2 className="font-semibold text-white">Campaign Risk Analysis</h2>
                            <button
                                onClick={fetchScamData}
                                className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-white bg-gray-800 px-3 py-1.5 rounded-lg transition"
                            >
                                <RefreshCw className="w-3.5 h-3.5" /> Refresh
                            </button>
                        </div>

                        {scamLoading ? (
                            <div className="flex justify-center py-20">
                                <div className="w-8 h-8 border-4 border-green-500 border-t-transparent rounded-full animate-spin" />
                            </div>
                        ) : scamCampaigns.length === 0 ? (
                            <div className="text-center py-16 text-gray-500">
                                <Shield className="w-12 h-12 mx-auto mb-3 opacity-30" />
                                <p>No active campaigns to analyze</p>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {scamCampaigns.map(c => (
                                    <div key={c._id} className={`bg-gray-900 border rounded-2xl overflow-hidden ${
                                        c.riskLevel === "high" ? "border-red-800" :
                                        c.riskLevel === "medium" ? "border-yellow-800" : "border-gray-800"
                                    }`}>
                                        {/* Campaign header */}
                                        <div
                                            className="p-5 cursor-pointer hover:bg-gray-800 transition"
                                            onClick={() => setExpandedScam(expandedScam === c._id ? null : c._id)}
                                        >
                                            <div className="flex items-start justify-between gap-3">
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-center gap-2 mb-1">
                                                        <span className={`text-xs font-bold px-2 py-0.5 rounded-full text-white ${riskBadgeColor(c.riskLevel)}`}>
                                                            {c.riskScore}/100
                                                        </span>
                                                        <span className={`text-xs font-semibold uppercase ${
                                                            c.riskLevel === "high" ? "text-red-400" :
                                                            c.riskLevel === "medium" ? "text-yellow-400" : "text-green-400"
                                                        }`}>
                                                            {c.riskLevel === "high" ? "🚨 High Risk" : c.riskLevel === "medium" ? "⚠️ Suspicious" : "✅ Clean"}
                                                        </span>
                                                    </div>
                                                    <p className="font-semibold text-white truncate">{c.title}</p>
                                                    <div className="flex items-center gap-2 mt-1">
                                                        {c.creator.avatar ? (
                                                            <img src={c.creator.avatar} className="w-5 h-5 rounded-full object-cover" alt="" />
                                                        ) : (
                                                            <div className="w-5 h-5 rounded-full bg-gray-700 flex items-center justify-center text-xs">
                                                                {c.creator.name?.[0]}
                                                            </div>
                                                        )}
                                                        <p className="text-xs text-gray-400">@{c.creator.username} · Trust {c.creator.trustScore}% · {c.creator.postCount} posts</p>
                                                    </div>
                                                </div>
                                                <div className="text-right shrink-0">
                                                    <p className="text-xs text-gray-500">Raised</p>
                                                    <p className="font-bold text-white">₹{c.amountRaised}</p>
                                                    <p className="text-xs text-gray-500 mt-1">{c.flags.length} flag{c.flags.length !== 1 ? "s" : ""}</p>
                                                </div>
                                            </div>

                                            {/* Flag pills preview */}
                                            {c.flags.length > 0 && (
                                                <div className="flex flex-wrap gap-1.5 mt-3">
                                                    {c.flags.map((f, i) => (
                                                        <span key={i} className={`text-xs px-2 py-0.5 rounded-full font-medium ${severityColor(f.severity)}`}>
                                                            {f.signal}
                                                        </span>
                                                    ))}
                                                </div>
                                            )}
                                        </div>

                                        {/* Expanded details */}
                                        {expandedScam === c._id && (
                                            <div className="border-t border-gray-800 p-5 bg-gray-950">

                                                {/* Detailed flags */}
                                                <h3 className="text-sm font-semibold text-gray-300 mb-3">Risk Signals Detected</h3>
                                                {c.flags.length === 0 ? (
                                                    <div className="flex items-center gap-2 text-green-400 text-sm mb-4">
                                                        <CheckCircle className="w-4 h-4" />
                                                        <span>No risk signals detected</span>
                                                    </div>
                                                ) : (
                                                    <div className="space-y-2 mb-4">
                                                        {c.flags.map((f, i) => (
                                                            <div key={i} className={`flex items-start gap-3 p-3 rounded-xl ${
                                                                f.severity === "high" ? "bg-red-950 border border-red-900" :
                                                                f.severity === "medium" ? "bg-yellow-950 border border-yellow-900" :
                                                                "bg-blue-950 border border-blue-900"
                                                            }`}>
                                                                <AlertTriangle className={`w-4 h-4 shrink-0 mt-0.5 ${
                                                                    f.severity === "high" ? "text-red-400" :
                                                                    f.severity === "medium" ? "text-yellow-400" : "text-blue-400"
                                                                }`} />
                                                                <div>
                                                                    <p className={`text-xs font-bold ${
                                                                        f.severity === "high" ? "text-red-300" :
                                                                        f.severity === "medium" ? "text-yellow-300" : "text-blue-300"
                                                                    }`}>{f.signal}</p>
                                                                    <p className="text-xs text-gray-400 mt-0.5">{f.detail}</p>
                                                                </div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                )}

                                                {/* IP Warning */}
{c.creator.lastIP && c.flags.some(f => f.signal === "Same IP Campaigns") && (
    <div className="bg-purple-950 border border-purple-800 rounded-xl p-3 mb-3 flex items-center gap-2">
        <span className="text-purple-400 text-lg">🌐</span>
        <div>
            <p className="text-purple-300 text-xs font-bold">Same IP Detected</p>
            <p className="text-purple-400 text-xs mt-0.5">IP: {c.creator.lastIP} — multiple accounts from same network</p>
        </div>
    </div>
)}

                                                {/* Campaign stats */}
                                                <div className="grid grid-cols-3 gap-3 mb-4">
                                                    <div className="bg-gray-900 rounded-xl p-3 text-center">
                                                        <p className="text-lg font-black text-white">{c.progress}%</p>
                                                        <p className="text-xs text-gray-500">Progress</p>
                                                    </div>
                                                    <div className="bg-gray-900 rounded-xl p-3 text-center">
                                                        <p className="text-lg font-black text-white">{c.members}</p>
                                                        <p className="text-xs text-gray-500">Members</p>
                                                    </div>
                                                    <div className="bg-gray-900 rounded-xl p-3 text-center">
                                                        <p className="text-lg font-black text-white">
                                                            {Math.round((Date.now() - new Date(c.created_on).getTime()) / (1000 * 60 * 60 * 24))}d
                                                        </p>
                                                        <p className="text-xs text-gray-500">Age</p>
                                                    </div>
                                                </div>

                                                {/* Admin actions */}
                                                <div className="flex gap-2 flex-wrap">
                                                    <button
                                                        onClick={() => handleFlag(c._id, "Flagged by admin via scam detection")}
                                                        className="flex items-center gap-1.5 bg-yellow-600 hover:bg-yellow-500 text-white text-xs font-semibold px-3 py-2 rounded-xl transition"
                                                    >
                                                        <Flag className="w-3.5 h-3.5" /> Flag Campaign
                                                    </button>
                                                    <button
                                                        onClick={() => handleRemove(c._id)}
                                                        className="flex items-center gap-1.5 bg-red-600 hover:bg-red-500 text-white text-xs font-semibold px-3 py-2 rounded-xl transition"
                                                    >
                                                        <Trash2 className="w-3.5 h-3.5" /> Remove Campaign
                                                    </button>
                                                    {actionMsg[c._id] && (
                                                        <span className="text-xs text-green-400 flex items-center">{actionMsg[c._id]}</span>
                                                    )}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}