import { Plus, Home, Target, Trophy, User, Filter, TrendingUp } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';

export default function Leaderboard() {
    const navigate = useNavigate();
    const [rankings, setRankings] = useState([]);
    const [currentUser, setCurrentUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchLeaderboard();
        fetchCurrentUser();
    }, []);

    const fetchCurrentUser = async () => {
        try {
            const res = await fetch('http://localhost:3000/auth/user', { credentials: 'include' });
            const data = await res.json();
            if (data.success) setCurrentUser(data.user);
        } catch (err) { console.error(err); }
    };

    const fetchLeaderboard = async () => {
        try {
            const res = await fetch('http://localhost:3000/leaderboard', { credentials: 'include' });
            const data = await res.json();
            if (data.success) setRankings(data.rankings);
        } catch (err) { console.error(err); }
        finally { setLoading(false); }
    };

    // rankings[0] = rank 1 (most likes), rankings[1] = rank 2, rankings[2] = rank 3
    const first = rankings[0];   // rank 1
    const second = rankings[1];  // rank 2
    const third = rankings[2];   // rank 3
    const rest = rankings.slice(3); // rank 4-10

    const myRank = rankings.findIndex(r => r.user._id === currentUser?._id) + 1;
    const myData = rankings.find(r => r.user._id === currentUser?._id);

    const AvatarCircle = ({ user, size, borderColor }) => (
        user?.avatar ? (
            <img src={user.avatar} alt={user.name} className={`${size} rounded-full border-4 ${borderColor} object-cover`} />
        ) : (
            <div className={`${size} rounded-full border-4 ${borderColor} bg-green-100 flex items-center justify-center`}>
                <User className="w-6 h-6 text-green-600" />
            </div>
        )
    );

    if (loading) {
        return (
            <div className="max-w-md mx-auto bg-gray-50 min-h-screen flex items-center justify-center">
                <div className="w-8 h-8 border-4 border-green-500 border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }

    return (
        <div className="max-w-md mx-auto bg-gray-50 min-h-screen pb-20">
            <div className="sticky top-0 bg-white z-10 border-b border-gray-200">
                <div className="flex items-center justify-between p-4">
                    <h1 className="text-lg font-semibold">Global Leaderboard</h1>
                    <Filter className="w-5 h-5 text-gray-600" />
                </div>
            </div>

            <div className="p-4">
                {/* Podium - 2nd, 1st, 3rd */}
                {rankings.length > 0 ? (
                    <div className="bg-gradient-to-br from-yellow-50 to-orange-50 rounded-3xl p-6 mb-4">
                        <div className="flex items-end justify-center gap-6">

                            {/* 2nd place */}
                            {second && (
                                <div className="flex flex-col items-center">
                                    <div className="relative mb-2">
                                        <AvatarCircle user={second.user} size="w-16 h-16" borderColor="border-gray-400" />
                                        <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 bg-gray-400 text-white text-xs font-bold w-6 h-6 rounded-full flex items-center justify-center">2</div>
                                    </div>
                                    <div className="text-center mt-3">
                                        <div className="font-semibold text-sm">{second.user.name}</div>
                                        <div className="text-xs text-gray-500">@{second.user.username || 'unknown'}</div>
                                        <div className="text-lg font-bold text-green-600 mt-1">{second.totalLikes}</div>
                                        <div className="text-xs text-gray-400">likes</div>
                                    </div>
                                </div>
                            )}

                            {/* 1st place - taller */}
                            {first && (
                                <div className="flex flex-col items-center -mt-8">
                                    <div className="relative mb-2">
                                        <AvatarCircle user={first.user} size="w-20 h-20" borderColor="border-yellow-400" />
                                        <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 bg-yellow-400 text-white text-xs font-bold w-7 h-7 rounded-full flex items-center justify-center">1</div>
                                    </div>
                                    <div className="text-center mt-3">
                                        <div className="font-semibold text-sm">{first.user.name}</div>
                                        <div className="text-xs text-gray-500">@{first.user.username || 'unknown'}</div>
                                        <div className="text-xl font-bold text-green-600 mt-1">{first.totalLikes}</div>
                                        <div className="text-xs text-gray-400">likes</div>
                                    </div>
                                </div>
                            )}

                            {/* 3rd place */}
                            {third && (
                                <div className="flex flex-col items-center">
                                    <div className="relative mb-2">
                                        <AvatarCircle user={third.user} size="w-16 h-16" borderColor="border-orange-400" />
                                        <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 bg-orange-400 text-white text-xs font-bold w-6 h-6 rounded-full flex items-center justify-center">3</div>
                                    </div>
                                    <div className="text-center mt-3">
                                        <div className="font-semibold text-sm">{third.user.name}</div>
                                        <div className="text-xs text-gray-500">@{third.user.username || 'unknown'}</div>
                                        <div className="text-lg font-bold text-green-600 mt-1">{third.totalLikes}</div>
                                        <div className="text-xs text-gray-400">likes</div>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                ) : (
                    <div className="bg-gray-100 rounded-3xl p-8 mb-4 text-center text-gray-400">
                        <Trophy className="w-12 h-12 mx-auto mb-2" />
                        <p>No rankings yet — start posting!</p>
                    </div>
                )}

                {/* Rank 4-10 list */}
                {rest.length > 0 && (
                    <div className="bg-white rounded-2xl overflow-hidden shadow-sm mb-4">
                        {rest.map((item, index) => (
                            <div
                                key={item._id}
                                className={`flex items-center gap-3 p-4 border-b border-gray-100 last:border-b-0 ${item.user._id === currentUser?._id ? 'bg-green-50' : ''}`}
                            >
                                <div className="text-gray-400 font-bold text-sm w-8">#{index + 4}</div>
                                {item.user.avatar ? (
                                    <img src={item.user.avatar} alt={item.user.name} className="w-10 h-10 rounded-full object-cover" />
                                ) : (
                                    <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
                                        <User className="w-5 h-5 text-green-600" />
                                    </div>
                                )}
                                <div className="flex-1">
                                    <div className="font-semibold text-sm">{item.user.name}</div>
                                    <div className="text-xs text-gray-500">@{item.user.username || 'unknown'}</div>
                                </div>
                                <div className="text-right">
                                    <div className="flex items-center gap-1 text-green-600 font-bold text-sm">
                                        <TrendingUp className="w-4 h-4" />
                                        {item.totalLikes}
                                    </div>
                                    <div className="text-xs text-gray-400">LIKES</div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {/* My rank card */}
                {myData ? (
                    <div className="bg-gradient-to-r from-green-500 to-green-600 rounded-2xl p-4 flex items-center gap-3 text-white shadow-lg">
                        {myData.user.avatar ? (
                            <img src={myData.user.avatar} className="w-12 h-12 rounded-full border-2 border-white object-cover" alt="you" />
                        ) : (
                            <div className="w-12 h-12 rounded-full border-2 border-white bg-green-400 flex items-center justify-center">
                                <User className="w-6 h-6 text-white" />
                            </div>
                        )}
                        <div className="flex-1">
                            <div className="text-xs opacity-90">Your Global Rank</div>
                            <div className="font-bold text-lg">#{myRank} <span className="text-sm font-normal">@{myData.user.username}</span></div>
                        </div>
                        <div className="text-right">
                            <div className="text-2xl font-bold">{myData.totalLikes}</div>
                            <div className="text-xs opacity-90">Total Likes</div>
                        </div>
                    </div>
                ) : currentUser && (
                    <div className="bg-gradient-to-r from-gray-400 to-gray-500 rounded-2xl p-4 flex items-center gap-3 text-white shadow-lg">
                        {currentUser.avatar ? (
                            <img src={currentUser.avatar} className="w-12 h-12 rounded-full border-2 border-white object-cover" alt="you" />
                        ) : (
                            <div className="w-12 h-12 rounded-full border-2 border-white bg-gray-300 flex items-center justify-center">
                                <User className="w-6 h-6 text-white" />
                            </div>
                        )}
                        <div className="flex-1">
                            <div className="text-xs opacity-90">Your Global Rank</div>
                            <div className="font-bold text-lg">Unranked</div>
                            <div className="text-xs opacity-75">Post something to get ranked!</div>
                        </div>
                        <div className="text-right">
                            <div className="text-2xl font-bold">0</div>
                            <div className="text-xs opacity-90">Total Likes</div>
                        </div>
                    </div>
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
                        <Home className="w-6 h-6" /><span className="text-xs">Home</span>
                    </button>
                    <button onClick={() => navigate("/acc/home/campaign")} className="flex flex-col items-center gap-1 text-gray-500">
                        <Target className="w-6 h-6" /><span className="text-xs">Campaign</span>
                    </button>
                    <button onClick={() => navigate("/acc/home/post")} className="flex flex-col items-center gap-1 text-gray-500">
                        <div className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center -mt-6 shadow-lg">
                            <Plus className="w-6 h-6 text-white" strokeWidth={3} />
                        </div>
                    </button>
                    <button className="flex flex-col items-center gap-1 text-green-600">
                        <Trophy className="w-6 h-6" fill="currentColor" /><span className="text-xs">Leaderboard</span>
                    </button>
                    <button onClick={() => navigate("/acc/home/profile")} className="flex flex-col items-center gap-1 text-gray-500">
                        <User className="w-6 h-6" /><span className="text-xs">Profile</span>
                    </button>
                </div>
            </div>
        </div>
    );
}