import { useState, useEffect } from 'react';
import { ArrowLeft, Star } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';

export default function feedback() {
    const navigate = useNavigate();
    const { campaignId } = useParams();
    const [campaign, setCampaign] = useState(null);
    const [rating, setRating] = useState(0);
    const [hovered, setHovered] = useState(0);
    const [comment, setComment] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [submitted, setSubmitted] = useState(false);
    const [existingFeedbacks, setExistingFeedbacks] = useState([]);
    const [msg, setMsg] = useState('');

    useEffect(() => {
        fetchCampaign();
        fetchFeedbacks();
    }, []);

    const fetchCampaign = async () => {
        try {
            const res = await fetch('http://localhost:3000/campaign/all', { credentials: 'include' });
            const data = await res.json();
            if (data.success) {
                const found = data.campaigns.find(c => c._id === campaignId);
                setCampaign(found);
            }
        } catch (err) { console.error(err); }
    };

    const fetchFeedbacks = async () => {
        try {
            const res = await fetch(`http://localhost:3000/campaign/feedback/${campaignId}`, { credentials: 'include' });
            const data = await res.json();
            if (data.success) setExistingFeedbacks(data.feedbacks);
        } catch (err) { console.error(err); }
    };

    const handleSubmit = async () => {
        if (rating === 0) return setMsg('Please select a rating');
        if (!comment.trim()) return setMsg('Please write a comment');
        setSubmitting(true);
        try {
            const res = await fetch(`http://localhost:3000/campaign/feedback/${campaignId}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({ rating, comment })
            });
            const data = await res.json();
            if (data.success) {
                setSubmitted(true);
                fetchFeedbacks();
            } else {
                setMsg(data.message);
            }
        } catch (err) {
            setMsg('Something went wrong');
        }
        setSubmitting(false);
    };

    const avgRating = existingFeedbacks.length > 0
        ? (existingFeedbacks.reduce((sum, f) => sum + f.rating, 0) / existingFeedbacks.length).toFixed(1)
        : null;

    return (
        <div className="max-w-md mx-auto bg-white min-h-screen pb-10">
            {/* Header */}
            <div className="sticky top-0 bg-white z-10 border-b border-gray-200">
                <div className="flex items-center gap-3 p-4">
                    <button onClick={() => navigate(-1)}>
                        <ArrowLeft className="w-6 h-6" />
                    </button>
                    <h1 className="text-base font-semibold">Campaign Feedback</h1>
                </div>
            </div>

            <div className="p-4">
                {/* Campaign info */}
                {campaign && (
                    <div className="bg-green-50 rounded-2xl p-4 mb-5">
                        <p className="text-xs text-green-600 font-semibold uppercase mb-1">Completed Campaign</p>
                        <h2 className="text-base font-bold text-gray-800">{campaign.title}</h2>
                        <p className="text-sm text-gray-500 mt-1">{campaign.description}</p>
                    </div>
                )}

                {/* Average rating display */}
                {avgRating && (
                    <div className="flex items-center gap-3 mb-5 bg-yellow-50 rounded-2xl p-4">
                        <div className="text-4xl font-black text-yellow-500">{avgRating}</div>
                        <div>
                            <div className="flex gap-0.5">
                                {[1,2,3,4,5].map(s => (
                                    <Star key={s} className="w-4 h-4" fill={s <= Math.round(avgRating) ? '#f59e0b' : 'none'} stroke="#f59e0b" />
                                ))}
                            </div>
                            <p className="text-xs text-gray-500 mt-0.5">{existingFeedbacks.length} review{existingFeedbacks.length !== 1 ? 's' : ''}</p>
                        </div>
                    </div>
                )}

                {/* Feedback form */}
                {!submitted ? (
                    <div className="bg-white border border-gray-200 rounded-2xl p-4 mb-5 shadow-sm">
                        <h3 className="font-semibold text-gray-800 mb-4">Share Your Experience</h3>

                        {/* Star rating */}
                        <div className="mb-4">
                            <p className="text-sm text-gray-500 mb-2">Your Rating</p>
                            <div className="flex gap-2">
                                {[1,2,3,4,5].map(star => (
                                    <button
                                        key={star}
                                        onMouseEnter={() => setHovered(star)}
                                        onMouseLeave={() => setHovered(0)}
                                        onClick={() => setRating(star)}
                                    >
                                        <Star
                                            className="w-8 h-8 transition-colors"
                                            fill={(hovered || rating) >= star ? '#f59e0b' : 'none'}
                                            stroke={(hovered || rating) >= star ? '#f59e0b' : '#d1d5db'}
                                        />
                                    </button>
                                ))}
                            </div>
                            {rating > 0 && (
                                <p className="text-xs text-yellow-600 mt-1 font-medium">
                                    {['', 'Poor', 'Fair', 'Good', 'Very Good', 'Excellent'][rating]}
                                </p>
                            )}
                        </div>

                        {/* Comment */}
                        <div className="mb-4">
                            <p className="text-sm text-gray-500 mb-2">Your Comment</p>
                            <textarea
                                rows={4}
                                placeholder="Share your experience with this campaign..."
                                value={comment}
                                onChange={e => setComment(e.target.value)}
                                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-green-500"
                            />
                        </div>

                        {msg && <p className="text-red-500 text-xs mb-3">{msg}</p>}

                        <button
                            onClick={handleSubmit}
                            disabled={submitting}
                            className="w-full bg-green-500 text-white font-semibold py-3 rounded-xl disabled:opacity-60 text-sm"
                        >
                            {submitting ? 'Submitting...' : 'Submit Feedback'}
                        </button>
                    </div>
                ) : (
                    <div className="bg-green-50 border border-green-200 rounded-2xl p-6 text-center mb-5">
                        <div className="text-4xl mb-2">🎉</div>
                        <p className="font-bold text-green-700">Thank you for your feedback!</p>
                        <p className="text-sm text-green-600 mt-1">Your review helps build trust in the community.</p>
                    </div>
                )}

                {/* Existing feedbacks */}
                {existingFeedbacks.length > 0 && (
                    <div>
                        <h3 className="font-semibold text-gray-800 mb-3">Community Reviews</h3>
                        <div className="space-y-3">
                            {existingFeedbacks.map((f, i) => (
                                <div key={i} className="bg-gray-50 rounded-2xl p-4">
                                    <div className="flex items-center gap-2 mb-2">
                                        {f.userId?.avatar ? (
                                            <img src={f.userId.avatar} className="w-8 h-8 rounded-full object-cover" alt="" />
                                        ) : (
                                            <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center text-xs font-bold text-green-600">
                                                {f.userId?.name?.[0] || '?'}
                                            </div>
                                        )}
                                        <div>
                                            <p className="text-sm font-semibold">{f.userId?.name || 'User'}</p>
                                            <div className="flex gap-0.5">
                                                {[1,2,3,4,5].map(s => (
                                                    <Star key={s} className="w-3 h-3" fill={s <= f.rating ? '#f59e0b' : 'none'} stroke="#f59e0b" />
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                    <p className="text-sm text-gray-600">{f.comment}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}