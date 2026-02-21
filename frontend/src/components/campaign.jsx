import { useState, useEffect, useRef } from 'react';
import { Plus, Home, Target, Trophy, User, ArrowLeft, Users, TrendingUp, X, Camera } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function Campaign() {
    const navigate = useNavigate();
    const fileRef = useRef(null);

    const [campaigns, setCampaigns] = useState([]);
    const [loading, setLoading] = useState(true);
    const [currentUser, setCurrentUser] = useState(null);
    const [showForm, setShowForm] = useState(false);
    const [editingCampaign, setEditingCampaign] = useState(null);
    const [imagePreview, setImagePreview] = useState(null);
    const [imageFile, setImageFile] = useState(null);
    const [submitting, setSubmitting] = useState(false);
    const [contributionInput, setContributionInput] = useState('');
    const [donationAmount, setDonationAmount] = useState('');
    const [requestsModal, setRequestsModal] = useState(null);
    const [requests, setRequests] = useState([]);
    const [requestsLoading, setRequestsLoading] = useState(false);
    const [notifications, setNotifications] = useState([]);
    const [showNotifications, setShowNotifications] = useState(false);

    const [form, setForm] = useState({
        title: '',
        description: '',
        contributionTypes: [],
        peopleNeeded: '',
        progress: 0
    });

    useEffect(() => {
        fetchCurrentUser();
        fetchCampaigns();
        fetchNotifications();
    }, []);

    const fetchCurrentUser = async () => {
        try {
            const res = await fetch('http://localhost:3000/auth/user', { credentials: 'include' });
            const data = await res.json();
            if (data.success) setCurrentUser(data.user);
        } catch (err) { console.error(err); }
    };

    const fetchCampaigns = async () => {
        try {
            const res = await fetch('http://localhost:3000/campaign/all', { credentials: 'include' });
            const data = await res.json();
            if (data.success) setCampaigns(data.campaigns);
        } catch (err) { console.error(err); }
        finally { setLoading(false); }
    };

    const fetchNotifications = async () => {
        try {
            const res = await fetch('http://localhost:3000/user/notifications', { credentials: 'include' });
            const data = await res.json();
            if (data.success) setNotifications(data.notifications);
        } catch (err) { console.error(err); }
    };

    const openNotifications = async () => {
        await fetchNotifications();
        setShowNotifications(true);
        await fetch('http://localhost:3000/user/notifications/read', {
            method: 'PUT',
            credentials: 'include'
        });
    };

    const fetchRequests = async (campaign) => {
        setRequestsModal(campaign);
        setRequestsLoading(true);
        try {
            const res = await fetch(`http://localhost:3000/campaign/requests/${campaign._id}`, {
                credentials: 'include'
            });
            const data = await res.json();
            if (data.success) setRequests(data.requests);
        } catch (err) { console.error(err); }
        finally { setRequestsLoading(false); }
    };

    const handleRequestAction = async (campaignId, userId, action) => {
        try {
            const res = await fetch(`http://localhost:3000/campaign/request/${campaignId}/${userId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({ action })
            });
            const data = await res.json();
            if (data.success) {
                setRequests(prev => prev.filter(r => r.userId._id !== userId));
                fetchCampaigns();
            }
        } catch (err) { alert('Failed'); }
    };

    const handleImageChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setImageFile(file);
            setImagePreview(URL.createObjectURL(file));
        }
    };

    const addContributionType = () => {
        if (contributionInput.trim() && !form.contributionTypes.includes(contributionInput.trim())) {
            setForm(prev => ({ ...prev, contributionTypes: [...prev.contributionTypes, contributionInput.trim()] }));
            setContributionInput('');
        }
    };

    const removeContributionType = (type) => {
        setForm(prev => ({ ...prev, contributionTypes: prev.contributionTypes.filter(t => t !== type) }));
    };

    const openEditForm = (campaign) => {
        setEditingCampaign(campaign);
        setForm({
            title: campaign.title,
            description: campaign.description,
            contributionTypes: campaign.contributionTypes || [],
            peopleNeeded: campaign.peopleNeeded,
            progress: campaign.progress
        });
        setImagePreview(campaign.image);
        setShowForm(true);
    };

    const resetForm = () => {
        setForm({ title: '', description: '', contributionTypes: [], peopleNeeded: '', progress: 0 });
        setImageFile(null);
        setImagePreview(null);
        setEditingCampaign(null);
        setShowForm(false);
        setContributionInput('');
    };

    const handleSubmit = async () => {
        if (!form.title.trim()) return alert('Title is required');
        setSubmitting(true);
        try {
            const formData = new FormData();
            formData.append('title', form.title);
            formData.append('description', form.description);
            formData.append('contributionTypes', JSON.stringify(form.contributionTypes));
            formData.append('peopleNeeded', form.peopleNeeded);
            if (editingCampaign) formData.append('progress', form.progress);
            if (imageFile) formData.append('image', imageFile);

            const url = editingCampaign
                ? `http://localhost:3000/campaign/update/${editingCampaign._id}`
                : 'http://localhost:3000/campaign/create';
            const method = editingCampaign ? 'PUT' : 'POST';

            const res = await fetch(url, { method, credentials: 'include', body: formData });
            const data = await res.json();
            if (data.success) {
                fetchCampaigns();
                resetForm();
            } else {
                alert(data.message);
            }
        } catch (err) {
            alert('Something went wrong');
        } finally {
            setSubmitting(false);
        }
    };

    const handleJoin = async (campaignId) => {
        try {
            const res = await fetch(`http://localhost:3000/campaign/join/${campaignId}`, {
                method: 'POST',
                credentials: 'include'
            });
            const data = await res.json();
            alert(data.message);
            fetchCampaigns();
        } catch (err) {
            alert('Failed to send request');
        }
    };

    const payNow = async (campaignId) => {
        const amount = parseInt(donationAmount);
        if (!amount || amount < 1) return alert('Please enter a valid amount');
        try {
            const res = await fetch("http://localhost:3000/payment/create-order", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ amount }),
            });
            const order = await res.json();
            const options = {
                key: "rzp_test_SGtmofw4CWXzzG",
                amount: order.amount,
                currency: "INR",
                name: "Prithvi Campaign Donation",
                description: "Support this campaign ❤️",
                order_id: order.id,
                handler: async function () {
                    await fetch(`http://localhost:3000/campaign/donate/${campaignId}`, {
                        method: 'PUT',
                        headers: { 'Content-Type': 'application/json' },
                        credentials: 'include',
                        body: JSON.stringify({ amount })
                    });
                    alert("Payment Successful 🎉 Thank you for supporting!");
                    setDonationAmount('');
                    fetchCampaigns();
                },
                theme: { color: "#22c55e" }
            };
            const rzp = new window.Razorpay(options);
            rzp.open();
        } catch (err) {
            alert("Payment Failed 😢");
        }
    };

    const getJoinStatus = (campaign) => {
        if (!currentUser) return 'none';
        const myRequest = campaign.joinRequests?.find(
            r => r.userId === currentUser._id || r.userId?._id === currentUser._id
        );
        if (myRequest?.status === 'accepted') return 'accepted';
        if (myRequest?.status === 'pending') return 'pending';
        if (campaign.members?.length >= campaign.peopleNeeded) return 'full';
        return 'none';
    };

    const isCreator = (campaign) => {
        if (!currentUser) return false;
        return campaign.userId?._id === currentUser._id || campaign.userId === currentUser._id;
    };

    return (
        <div className="max-w-md mx-auto bg-white min-h-screen pb-20">

            {/* Header */}
            <div className="sticky top-0 bg-white z-10 border-b border-gray-200">
                <div className="flex items-center justify-between p-4">
                    <button onClick={() => navigate("/acc/home")}>
                        <ArrowLeft className="w-6 h-6" />
                    </button>
                    <h1 className="text-base font-semibold">Campaigns</h1>
                    <div className="flex items-center gap-2">
                        <button onClick={openNotifications} className="relative">
                            <span className="text-xl">🔔</span>
                            {notifications.filter(n => !n.read).length > 0 && (
                                <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                                    {notifications.filter(n => !n.read).length}
                                </span>
                            )}
                        </button>
                        <button
                            onClick={() => { resetForm(); setShowForm(true); }}
                            className="bg-green-500 text-white text-xs font-semibold px-3 py-1.5 rounded-full flex items-center gap-1"
                        >
                            <Plus className="w-4 h-4" /> Create
                        </button>
                    </div>
                </div>
            </div>

            {/* Create / Edit Form Modal */}
            {showForm && (
                <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-end justify-center">
                    <div className="bg-white w-full max-w-md rounded-t-2xl p-5 max-h-[90vh] overflow-y-auto">
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-lg font-bold">{editingCampaign ? 'Edit Campaign' : 'Create Campaign'}</h2>
                            <button onClick={resetForm}><X className="w-6 h-6" /></button>
                        </div>

                        <div
                            onClick={() => fileRef.current.click()}
                            className="w-full h-36 rounded-xl bg-gray-100 border-2 border-dashed border-gray-300 flex items-center justify-center cursor-pointer mb-4 overflow-hidden"
                        >
                            {imagePreview ? (
                                <img src={imagePreview} className="w-full h-full object-cover" alt="preview" />
                            ) : (
                                <div className="flex flex-col items-center text-gray-400">
                                    <Camera className="w-8 h-8 mb-1" />
                                    <span className="text-sm">Upload campaign image</span>
                                </div>
                            )}
                        </div>
                        <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleImageChange} />

                        <input
                            type="text"
                            placeholder="Campaign title *"
                            value={form.title}
                            onChange={e => setForm(prev => ({ ...prev, title: e.target.value }))}
                            className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm mb-3 focus:outline-none focus:ring-2 focus:ring-green-500"
                        />

                        <textarea
                            placeholder="Describe your campaign..."
                            value={form.description}
                            onChange={e => setForm(prev => ({ ...prev, description: e.target.value }))}
                            rows={3}
                            className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm mb-3 resize-none focus:outline-none focus:ring-2 focus:ring-green-500"
                        />

                        <div className="mb-3">
                            <label className="text-xs font-semibold text-gray-600 uppercase mb-1 block">Contribution Types Needed</label>
                            <div className="flex gap-2 mb-2">
                                <input
                                    type="text"
                                    placeholder="e.g. Manpower, Financial..."
                                    value={contributionInput}
                                    onChange={e => setContributionInput(e.target.value)}
                                    onKeyDown={e => e.key === 'Enter' && addContributionType()}
                                    className="flex-1 border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                                />
                                <button onClick={addContributionType} className="bg-green-500 text-white px-3 py-2 rounded-xl text-sm">Add</button>
                            </div>
                            <div className="flex flex-wrap gap-2">
                                {form.contributionTypes.map(type => (
                                    <span key={type} className="bg-green-100 text-green-700 text-xs px-3 py-1 rounded-full flex items-center gap-1">
                                        {type}
                                        <button onClick={() => removeContributionType(type)}><X className="w-3 h-3" /></button>
                                    </span>
                                ))}
                            </div>
                        </div>

                        <input
                            type="number"
                            placeholder="Number of people needed"
                            value={form.peopleNeeded}
                            onChange={e => setForm(prev => ({ ...prev, peopleNeeded: e.target.value }))}
                            className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm mb-3 focus:outline-none focus:ring-2 focus:ring-green-500"
                        />

                        {editingCampaign && (
                            <div className="mb-3">
                                <label className="text-xs font-semibold text-gray-600 uppercase mb-1 block">
                                    Progress: {form.progress}%
                                </label>
                                <input
                                    type="range" min="0" max="100"
                                    value={form.progress}
                                    onChange={e => setForm(prev => ({ ...prev, progress: e.target.value }))}
                                    className="w-full accent-green-500"
                                />
                            </div>
                        )}

                        <button
                            onClick={handleSubmit}
                            disabled={submitting}
                            className="w-full bg-green-500 text-white font-semibold py-3 rounded-xl disabled:opacity-60"
                        >
                            {submitting ? 'Saving...' : editingCampaign ? 'Update Campaign' : 'Create Campaign'}
                        </button>
                    </div>
                </div>
            )}

            {/* Requests Modal */}
            {requestsModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-end justify-center">
                    <div className="bg-white w-full max-w-md rounded-t-2xl p-5 max-h-[80vh] overflow-y-auto">
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-lg font-bold">Join Requests</h2>
                            <button onClick={() => setRequestsModal(null)}><X className="w-6 h-6" /></button>
                        </div>
                        {requestsLoading ? (
                            <div className="flex justify-center py-8">
                                <div className="w-8 h-8 border-4 border-green-500 border-t-transparent rounded-full animate-spin" />
                            </div>
                        ) : requests.filter(r => r.status === 'pending').length === 0 ? (
                            <div className="text-center py-8 text-gray-400">
                                <Users className="w-10 h-10 mx-auto mb-2" />
                                <p>No pending requests</p>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {requests.filter(r => r.status === 'pending').map(request => (
                                    <div key={request.userId._id} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                                        <div className="flex items-center gap-3">
                                            {request.userId.avatar ? (
                                                <img src={request.userId.avatar} className="w-10 h-10 rounded-full object-cover" alt="avatar" />
                                            ) : (
                                                <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
                                                    <User className="w-5 h-5 text-green-600" />
                                                </div>
                                            )}
                                            <div>
                                                <p className="text-sm font-semibold">{request.userId.name}</p>
                                                <p className="text-xs text-gray-500">@{request.userId.username}</p>
                                            </div>
                                        </div>
                                        <div className="flex gap-2">
                                            <button
                                                onClick={() => handleRequestAction(requestsModal._id, request.userId._id, 'accepted')}
                                                className="bg-green-500 text-white text-xs font-semibold px-3 py-1.5 rounded-lg"
                                            >Accept</button>
                                            <button
                                                onClick={() => handleRequestAction(requestsModal._id, request.userId._id, 'rejected')}
                                                className="bg-red-100 text-red-500 text-xs font-semibold px-3 py-1.5 rounded-lg"
                                            >Reject</button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Notifications Modal */}
            {showNotifications && (
                <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-end justify-center">
                    <div className="bg-white w-full max-w-md rounded-t-2xl p-5 max-h-[80vh] overflow-y-auto">
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-lg font-bold">Notifications</h2>
                            <button onClick={() => setShowNotifications(false)}><X className="w-6 h-6" /></button>
                        </div>
                        {notifications.length === 0 ? (
                            <div className="text-center py-8 text-gray-400">
                                <p>No notifications yet</p>
                            </div>
                        ) : (
                            <div className="space-y-2">
                                {notifications.map((notif, index) => (
                                    <div key={index} className={`p-3 rounded-xl text-sm ${notif.read ? 'bg-gray-50 text-gray-600' : 'bg-green-50 text-green-800 font-medium'}`}>
                                        {notif.message}
                                        <p className="text-xs text-gray-400 mt-1">
                                            {new Date(notif.created_on).toLocaleDateString('en-IN', {
                                                day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit'
                                            })}
                                        </p>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Campaign List */}
            <div className="p-4 space-y-4">
                {loading ? (
                    <div className="flex justify-center py-20">
                        <div className="w-8 h-8 border-4 border-green-500 border-t-transparent rounded-full animate-spin" />
                    </div>
                ) : campaigns.length === 0 ? (
                    <div className="text-center py-20 text-gray-400">
                        <Target className="w-12 h-12 mx-auto mb-3" />
                        <p className="font-medium">No campaigns yet</p>
                        <p className="text-sm mt-1">Be the first to create one!</p>
                    </div>
                ) : (
                    campaigns.map(campaign => (
                        <div key={campaign._id} className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm">

                            {campaign.image && (
                                <img src={campaign.image} alt={campaign.title} className="w-full h-48 object-cover" />
                            )}

                            <div className="p-4">
                                {/* Status + Buttons */}
                                <div className="flex items-center justify-between mb-2">
                                    <span className={`text-xs font-bold px-3 py-1 rounded-full ${campaign.status === 'active' ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-500'}`}>
                                        {campaign.status === 'active' ? '🟢 ACTIVE' : '✅ COMPLETED'}
                                    </span>
                                    {isCreator(campaign) && (
                                        <div className="flex gap-2">
                                            <button
                                                onClick={() => fetchRequests(campaign)}
                                                className="relative text-xs text-orange-500 font-semibold border border-orange-200 px-3 py-1 rounded-full"
                                            >
                                                Requests
                                                {campaign.joinRequests?.filter(r => r.status === 'pending').length > 0 && (
                                                    <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                                                        {campaign.joinRequests.filter(r => r.status === 'pending').length}
                                                    </span>
                                                )}
                                            </button>
                                            <button
                                                onClick={() => openEditForm(campaign)}
                                                className="text-xs text-blue-500 font-semibold border border-blue-200 px-3 py-1 rounded-full"
                                            >Edit</button>
                                        </div>
                                    )}
                                </div>

                                {/* Creator info */}
                                <div className="flex items-center gap-2 mb-3">
                                    {campaign.userId?.avatar ? (
                                        <img src={campaign.userId.avatar} className="w-8 h-8 rounded-full object-cover" alt="avatar" />
                                    ) : (
                                        <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center">
                                            <User className="w-4 h-4 text-green-600" />
                                        </div>
                                    )}
                                    <div>
                                        <p className="text-sm font-semibold">{campaign.userId?.name || 'Unknown'}</p>
                                        <p className="text-xs text-gray-500">@{campaign.userId?.username || 'unknown'}</p>
                                    </div>
                                </div>

                                <h3 className="text-base font-bold mb-1">{campaign.title}</h3>
                                <p className="text-sm text-gray-600 mb-3">{campaign.description}</p>

                                {campaign.contributionTypes?.length > 0 && (
                                    <div className="flex flex-wrap gap-1 mb-3">
                                        {campaign.contributionTypes.map(type => (
                                            <span key={type} className="bg-blue-50 text-blue-600 text-xs px-2 py-0.5 rounded-full">{type}</span>
                                        ))}
                                    </div>
                                )}

                                {/* Stats */}
                                <div className="flex gap-3 mb-3">
                                    <div className="flex-1 bg-gray-50 rounded-xl p-2 text-center">
                                        <Users className="w-4 h-4 mx-auto text-gray-500 mb-1" />
                                        <p className="text-xs text-gray-500">People Needed</p>
                                        <p className="font-bold text-sm">{campaign.peopleNeeded}</p>
                                    </div>
                                    <div className="flex-1 bg-gray-50 rounded-xl p-2 text-center">
                                        <TrendingUp className="w-4 h-4 mx-auto text-gray-500 mb-1" />
                                        <p className="text-xs text-gray-500">Members</p>
                                        <p className="font-bold text-sm">{campaign.members?.length || 0}</p>
                                    </div>
                                    <div className="flex-1 bg-gray-50 rounded-xl p-2 text-center">
                                        <span className="text-xs">💰</span>
                                        <p className="text-xs text-gray-500">Raised</p>
                                        <p className="font-bold text-sm">₹{campaign.amountRaised || 0}</p>
                                    </div>
                                </div>

                                {/* Progress */}
                                <div className="mb-3">
                                    <div className="flex justify-between text-xs text-gray-500 mb-1">
                                        <span>Progress</span>
                                        <span className="font-semibold text-green-600">{campaign.progress}%</span>
                                    </div>
                                    <div className="w-full bg-gray-200 rounded-full h-2">
                                        <div className="bg-green-500 h-2 rounded-full transition-all" style={{ width: `${campaign.progress}%` }} />
                                    </div>
                                </div>

                                {/* Action Buttons - only for non-creators */}
                                {!isCreator(campaign) && (
                                    <div className="space-y-2">
                                        {/* Join Button */}
                                        {campaign.status === 'active' && (() => {
                                            const status = getJoinStatus(campaign);
                                            if (status === 'accepted') return (
                                                <button disabled className="w-full bg-gray-100 text-green-600 font-semibold py-2.5 rounded-xl text-sm">
                                                    ✅ Joined
                                                </button>
                                            );
                                            if (status === 'pending') return (
                                                <button disabled className="w-full bg-yellow-50 text-yellow-600 font-semibold py-2.5 rounded-xl text-sm">
                                                    ⏳ Request Pending
                                                </button>
                                            );
                                            if (status === 'full') return (
                                                <button disabled className="w-full bg-gray-100 text-gray-400 font-semibold py-2.5 rounded-xl text-sm">
                                                    🔒 Campaign Full
                                                </button>
                                            );
                                            return (
                                                <button
                                                    onClick={() => handleJoin(campaign._id)}
                                                    className="w-full bg-green-500 text-white font-semibold py-2.5 rounded-xl text-sm hover:bg-green-600 transition-colors"
                                                >
                                                    Join Campaign
                                                </button>
                                            );
                                        })()}

                                        {/* Donate - only active campaigns */}
                                        {campaign.status === 'active' && (
                                            <div className="flex gap-2">
                                                <input
                                                    type="number"
                                                    placeholder="Enter amount ₹"
                                                    value={donationAmount}
                                                    onChange={e => setDonationAmount(e.target.value)}
                                                    className="flex-1 border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                                                />
                                                <button
                                                    onClick={() => payNow(campaign._id)}
                                                    className="bg-blue-500 text-white font-semibold px-4 py-2.5 rounded-xl text-sm hover:bg-blue-600 transition-colors"
                                                >
                                                    Donate ❤️
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>
                    ))
                )}
            </div>
            <button
    onClick={() => navigate("/acc/bot")}
    className="fixed bottom-24 right-4 w-14 h-14 bg-green-500 rounded-full flex items-center justify-center shadow-xl z-20 hover:bg-green-600 transition-colors"
>
    <span className="text-2xl">🤖</span>
</button>

            {/* Bottom Nav */}
            <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 max-w-md mx-auto">
                <div className="flex items-center justify-around py-3">
                    <button onClick={() => navigate("/acc/home")} className="flex flex-col items-center gap-1 text-gray-500">
                        <Home className="w-6 h-6" />
                        <span className="text-xs">Home</span>
                    </button>
                    <button className="flex flex-col items-center gap-1 text-green-600">
                        <Target className="w-6 h-6" fill="currentColor" />
                        <span className="text-xs">Campaign</span>
                    </button>
                    <button onClick={() => navigate("/acc/home/post")} className="flex flex-col items-center gap-1 text-gray-500">
                        <div className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center -mt-6 shadow-lg">
                            <Plus className="w-6 h-6 text-white" strokeWidth={3} />
                        </div>
                    </button>
                    <button onClick={() => navigate("/acc/home/leaderboard")} className="flex flex-col items-center gap-1 text-gray-500">
                        <Trophy className="w-6 h-6" />
                        <span className="text-xs">Leaderboard</span>
                    </button>
                    <button onClick={() => navigate("/acc/home/profile")} className="flex flex-col items-center gap-1 text-gray-500">
                        <User className="w-6 h-6" />
                        <span className="text-xs">Profile</span>
                    </button>
                </div>
            </div>
        </div>
    );
}