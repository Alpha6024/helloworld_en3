import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";

const API = "http://localhost:3000";
const RAZORPAY_KEY = "rzp_test_SGtmofw4CWXzzG";

export default function Fund() {
  const navigate = useNavigate();
  const [amount, setAmount] = useState("");
  const [campaigns, setCampaigns] = useState([]);
  const [leaderboard, setLeaderboard] = useState([]);
  const [leaderboardTab, setLeaderboardTab] = useState("monthly");
  const [transactions, setTransactions] = useState([]);
  const [totalPool, setTotalPool] = useState(0);
  const [tab, setTab] = useState("donate");
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState("");

useEffect(() => {
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.async = true;
    document.body.appendChild(script);
    return () => document.body.removeChild(script);
}, []);

  useEffect(() => {
    fetchCampaigns();
    fetchTransactions();
    fetchPool();
  }, []);

  useEffect(() => {
    fetchLeaderboard();
  }, [leaderboardTab]);

  async function fetchCampaigns() {
    try {
      const res = await fetch(`${API}/campaign/all`, { credentials: "include" });
      const data = await res.json();
      if (data.success) setCampaigns(data.campaigns);
    } catch (err) { console.error(err); }
  }

  async function fetchLeaderboard() {
    try {
      const url = leaderboardTab === "monthly"
        ? `${API}/leaderboard/monthly`
        : `${API}/leaderboard/alltime`;
      const res = await fetch(url, { credentials: "include" });
      const data = await res.json();
      if (data.success) setLeaderboard(data.rankings.slice(0, 3));
    } catch (err) { console.error(err); }
  }

  async function fetchTransactions() {
    try {
      const res = await fetch(`${API}/donation/transactions`, { credentials: "include" });
      const data = await res.json();
      if (data.success) setTransactions(data.transactions);
    } catch (err) { console.error(err); }
  }

  async function fetchPool() {
    try {
      const res = await fetch(`${API}/donation/pool`);
      const data = await res.json();
      if (data.success) setTotalPool(data.totalPool);
    } catch (err) { console.error(err); }
  }

  async function handleDonate() {
    if (!amount || isNaN(amount) || Number(amount) < 1) {
      setMsg("Enter a valid amount (min ₹1)");
      return;
    }
    setLoading(true);
    setMsg("");

    try {
      const orderRes = await fetch(`${API}/payment/create-order`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ amount: Number(amount) }),
      });
      const order = await orderRes.json();

      if (!order.id) {
        setMsg("Failed to create payment order. Try again.");
        setLoading(false);
        return;
      }

      const options = {
        key: RAZORPAY_KEY,
        amount: order.amount,
        currency: order.currency || "INR",
        name: "EcoAction Platform",
        description: "Community Donation Pool",
        order_id: order.id,
        handler: async function (response) {
          const verifyRes = await fetch(`${API}/donation/verify`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            credentials: "include",
            body: JSON.stringify({
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
              amount: Number(amount),
            }),
          });
          const result = await verifyRes.json();
          if (result.success) {
            setMsg("🎉 Thank you! Your donation has been added to the pool.");
            setAmount("");
            fetchTransactions();
            fetchPool();
          } else {
            setMsg("Payment verification failed.");
          }
        },
        prefill: { name: "", email: "" },
        theme: { color: "#16a34a" },
      };

      const rzp = new window.Razorpay(options);
      rzp.on("payment.failed", () => setMsg("Payment failed. Please try again."));
      rzp.open();
    } catch (err) {
      console.error(err);
      setMsg("Something went wrong. Try again.");
    }
    setLoading(false);
  }

  async function allocateToCampaign(campaignId, allocAmount) {
    const res = await fetch(`${API}/donation/allocate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ campaignId, amount: allocAmount }),
    });
    const data = await res.json();
    setMsg(data.message || "Allocated!");
    fetchTransactions();
    fetchPool();
  }

  async function rewardLeaderboard(userId, rewardAmount) {
    const res = await fetch(`${API}/donation/reward-leaderboard`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ userId, amount: rewardAmount }),
    });
    const data = await res.json();
    setMsg(data.message || "Rewarded!");
    fetchTransactions();
    fetchPool();
  }

  const tabs = ["donate", "campaigns", "leaderboard", "tracker"];
  const rewardAmounts = [500, 300, 200];

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-950 via-emerald-900 to-teal-900 text-white font-sans">

      {/* Back Button */}
      <div className="sticky top-0 z-10 bg-green-950 bg-opacity-80 backdrop-blur-sm border-b border-emerald-800 px-4 py-3 flex items-center gap-3">
        <button
          onClick={() => navigate("/acc/home")}
          className="flex items-center gap-2 text-emerald-300 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
          <span className="text-sm font-medium">Back to Home</span>
        </button>
      </div>

      {/* Header */}
      <div className="text-center py-8 px-4">
        <h1 className="text-4xl font-bold tracking-tight text-emerald-300">🌱 EcoAction Pool</h1>
        <p className="text-emerald-400 mt-1 text-sm">Your donation funds green campaigns & rewards eco-heroes</p>
        <div className="mt-4 inline-block bg-emerald-800 border border-emerald-600 rounded-2xl px-8 py-3">
          <p className="text-xs text-emerald-400 uppercase tracking-widest">Total Pool</p>
          <p className="text-3xl font-bold text-white">₹{totalPool.toLocaleString()}</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex justify-center gap-2 mb-8 px-4 flex-wrap">
        {tabs.map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-5 py-2 rounded-full text-sm font-medium transition-all capitalize ${
              tab === t
                ? "bg-emerald-500 text-white shadow-lg shadow-emerald-900"
                : "bg-emerald-900 border border-emerald-700 text-emerald-300 hover:bg-emerald-800"
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      <div className="max-w-2xl mx-auto px-4 pb-16">

        {/* DONATE TAB */}
        {tab === "donate" && (
          <div className="bg-emerald-900 border border-emerald-700 rounded-2xl p-6 shadow-xl">
            <h2 className="text-xl font-semibold mb-4 text-emerald-200">Make a Donation</h2>
            <p className="text-emerald-400 text-sm mb-6">
              100% of your donation goes to platform campaigns and top eco-contributors on the leaderboard.
            </p>
            <div className="flex gap-3 mb-4 flex-wrap">
              {[50, 100, 500, 1000].map(preset => (
                <button
                  key={preset}
                  onClick={() => setAmount(String(preset))}
                  className={`px-4 py-2 rounded-xl text-sm transition border ${
                    amount === String(preset)
                      ? "bg-emerald-500 border-emerald-400 text-white"
                      : "bg-emerald-800 border-emerald-600 hover:bg-emerald-700"
                  }`}
                >
                  ₹{preset}
                </button>
              ))}
            </div>
            <input
              type="number"
              placeholder="Enter custom amount (₹)"
              value={amount}
              onChange={e => setAmount(e.target.value)}
              className="w-full bg-emerald-950 border border-emerald-700 rounded-xl px-4 py-3 text-white placeholder-emerald-600 focus:outline-none focus:border-emerald-400 mb-4"
            />
            {msg && (
              <p className={`text-sm mb-3 ${msg.includes("🎉") ? "text-emerald-300" : "text-red-400"}`}>
                {msg}
              </p>
            )}
            <button
              onClick={handleDonate}
              disabled={loading}
              className="w-full bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-white font-semibold py-3 rounded-xl transition"
            >
              {loading ? "Processing..." : `Donate ₹${amount || "0"} via Razorpay`}
            </button>
          </div>
        )}

        {/* CAMPAIGNS TAB */}
        {tab === "campaigns" && (
          <div className="space-y-4">
            <h2 className="text-xl font-semibold text-emerald-200 mb-2">All Campaigns</h2>
            <p className="text-emerald-500 text-sm mb-4">Donations are distributed to these campaigns by the platform admin.</p>
            {campaigns.length === 0 && <p className="text-emerald-600 text-sm">No campaigns yet.</p>}
            {campaigns.map(c => (
              <div key={c._id} className="bg-emerald-900 border border-emerald-700 rounded-2xl p-5">
                {c.image && <img src={c.image} alt={c.title} className="w-full h-36 object-cover rounded-xl mb-3" />}
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-semibold text-white">{c.title}</h3>
                    <p className="text-emerald-400 text-xs mt-1">{c.description}</p>
                  </div>
                  <span className={`text-xs px-2 py-1 rounded-full ml-2 shrink-0 ${
                    c.status === "completed" ? "bg-gray-700 text-gray-400" : "bg-emerald-800 text-emerald-300"
                  }`}>
                    {c.status}
                  </span>
                </div>
                <div className="mt-3">
                  <div className="flex justify-between text-xs text-emerald-400 mb-1">
                    <span>Progress</span><span>{c.progress || 0}%</span>
                  </div>
                  <div className="w-full bg-emerald-950 rounded-full h-2">
                    <div className="bg-emerald-400 h-2 rounded-full transition-all" style={{ width: `${c.progress || 0}%` }} />
                  </div>
                </div>
                <p className="text-emerald-300 text-sm mt-2 font-medium">₹{c.amountRaised || 0} raised</p>
              </div>
            ))}
          </div>
        )}

        {/* LEADERBOARD TAB */}
        {tab === "leaderboard" && (
          <div>
            <h2 className="text-xl font-semibold text-emerald-200 mb-2">Top Eco-Heroes 🏆</h2>
            <p className="text-emerald-500 text-sm mb-4">Top 3 contributors receive rewards from the donation pool.</p>

            {/* Monthly / All Time toggle */}
            <div className="flex gap-2 mb-5">
              <button
                onClick={() => setLeaderboardTab("monthly")}
                className={`flex-1 py-2 rounded-xl text-sm font-medium transition ${
                  leaderboardTab === "monthly"
                    ? "bg-emerald-500 text-white"
                    : "bg-emerald-900 border border-emerald-700 text-emerald-300"
                }`}
              >
                🗓 Monthly
              </button>
              <button
                onClick={() => setLeaderboardTab("alltime")}
                className={`flex-1 py-2 rounded-xl text-sm font-medium transition ${
                  leaderboardTab === "alltime"
                    ? "bg-emerald-500 text-white"
                    : "bg-emerald-900 border border-emerald-700 text-emerald-300"
                }`}
              >
                🏆 All Time
              </button>
            </div>

            {leaderboard.length === 0 ? (
              <p className="text-emerald-600 text-sm text-center py-8">
                {leaderboardTab === "monthly" ? "No posts this month yet!" : "No rankings yet"}
              </p>
            ) : (
              <div className="space-y-3">
                {leaderboard.map((u, i) => (
                  <div key={u._id} className="bg-emerald-900 border border-emerald-700 rounded-2xl p-4 flex items-center gap-4">
                    <div className={`text-2xl font-black ${i === 0 ? "text-yellow-400" : i === 1 ? "text-gray-400" : "text-amber-700"}`}>
                      #{i + 1}
                    </div>
                    {u.user.avatar ? (
                      <img src={u.user.avatar} alt="" className="w-10 h-10 rounded-full object-cover" />
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-emerald-700 flex items-center justify-center text-white font-bold">
                        {u.user.name?.[0] || "?"}
                      </div>
                    )}
                    <div className="flex-1">
                      <p className="font-semibold">{u.user.name}</p>
                      <p className="text-emerald-400 text-xs">@{u.user.username} · {u.totalLikes} likes</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-emerald-500">Reward</p>
                      <p className="text-emerald-300 font-bold">₹{rewardAmounts[i]}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TRACKER TAB */}
        {tab === "tracker" && (
          <div>
            <h2 className="text-xl font-semibold text-emerald-200 mb-4">Where Your Money Went</h2>
            {transactions.length === 0 && <p className="text-emerald-600 text-sm">No transactions yet.</p>}
            <div className="space-y-3">
              {transactions.map(t => (
                <div key={t._id} className="bg-emerald-900 border border-emerald-700 rounded-2xl p-4 flex justify-between items-center">
                  <div>
                    <p className="text-sm font-medium text-white">{t.description}</p>
                    <p className="text-xs text-emerald-500 mt-0.5">
                      {new Date(t.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className={`font-bold ${t.type === "donation" ? "text-emerald-400" : "text-orange-400"}`}>
                      {t.type === "donation" ? "+" : "-"}₹{t.amount}
                    </p>
                    <p className="text-xs text-emerald-600 capitalize">{t.type}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}