import { useState, useEffect } from 'react';
import { Heart, MessageCircle, Share2, Plus, Home, Target, Trophy, ArrowLeft, LogOut, User } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function Profile() {
    const navigate = useNavigate();
    const [userData, setUserData] = useState(null);
    const [userPosts, setUserPosts] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchUserData();
        fetchUserPosts();
    }, []);

    const fetchUserData = async () => {
        try {
            const response = await fetch('http://localhost:3000/auth/user', {
                credentials: 'include'
            });
            const data = await response.json();
            if (data.success) {
                setUserData(data.user);
            } else {
                navigate('/acc');
            }
        } catch (error) {
            console.error('Error fetching user data:', error);
            navigate('/acc');
        }
    };

    const handleLogout = async () => {
    try {
        await fetch('http://localhost:3000/auth/logout', {
            method: 'POST',
            credentials: 'include'
        });
        navigate('/acc');
    } catch (error) {
        console.error('Logout failed:', error);
    }
};

    const fetchUserPosts = async () => {
    try {
        const response = await fetch('http://localhost:3000/post/myposts', { // ← changed
            credentials: 'include'
        });
        const data = await response.json();
        if (data.success) {
            setUserPosts(data.posts);
        }
        setLoading(false);
    } catch (error) {
        console.error('Error fetching posts:', error);
        setLoading(false);
    }
};

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-gray-600">Loading...</div>
            </div>
        );
    }

    if (!userData) {
        return null;
    }

    const stats = [
        { label: 'Posts', value: userPosts.length.toString() },
        { label: 'Followers', value: userData.followers || '0' },
        { label: 'Following', value: userData.Following || '0' }
    ];

    return (
        <div className="max-w-md mx-auto bg-white min-h-screen">
            <div className="sticky top-0 bg-white z-10 border-b border-gray-200">
                <div className="flex items-center justify-between p-4">
                    <button onClick={() => navigate("/acc/home")}>
                        <ArrowLeft className="w-6 h-6" />
                    </button>
                    <h1 className="font-semibold">My Profile</h1>
                    <button onClick={handleLogout} className="flex items-center gap-1 text-red-500">
    <LogOut className="w-5 h-5" />
</button>
                </div>
            </div>

            <div className="relative">
                <div className="h-32 bg-gradient-to-br from-green-400 to-green-600">
                    {userData.avatar && (
                        <img 
                            src={userData.avatar} 
                            alt="Cover" 
                            className="w-full h-full object-cover blur-sm opacity-50"
                        />
                    )}
                </div>
                <div className="absolute left-1/2 -translate-x-1/2 -bottom-12">
                    <img 
                        src={userData.avatar || 'https://via.placeholder.com/200'} 
                        alt="Profile" 
                        className="w-24 h-24 rounded-full border-4 border-white object-cover"
                    />
                </div>
            </div>

            <div className="pt-14 px-4 text-center">
                <h2 className="text-xl font-bold">{userData.name}</h2>
                <p className="text-sm text-green-600 mb-2">@{userData.username}</p>
                <p className="text-sm text-gray-600 mb-4">
                    {userData.email}
                </p>
                <button onClick={() => navigate("/newacc")} className="w-full bg-white border border-gray-300 text-gray-700 font-semibold py-2.5 rounded-xl hover:bg-gray-50 transition-colors">
                    Edit Profile
                </button>
            </div>

            <div className="flex items-center justify-around py-4 px-4 mt-4 border-y border-gray-200">
                {stats.map((stat, index) => (
                    <div key={index} className="text-center">
                        <div className="text-lg font-bold text-gray-900">
                            {stat.value}
                        </div>
                        <div className="text-xs text-gray-500 uppercase">{stat.label}</div>
                    </div>
                ))}
            </div>

            <div className="px-4 py-2 mt-4">
                <div className="flex gap-2 border-b border-gray-200">
                    <button className="flex items-center gap-1 px-4 py-3 text-green-600 border-b-2 border-green-600 font-medium text-sm">
                        <div className="w-5 h-5 grid grid-cols-3 gap-0.5">
                            {[...Array(9)].map((_, i) => (
                                <div key={i} className="bg-green-600"></div>
                            ))}
                        </div>
                        Posts
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-3 gap-1 px-1 pb-20 mt-2">
                {userPosts.length > 0 ? (
                    userPosts.map((post, index) => (
                        <div key={index} className="aspect-square bg-gray-200 relative">
                            {post.image ? (
                                <img 
                                    src={post.image} 
                                    alt={`Post ${index + 1}`} 
                                    className="w-full h-full object-cover"
                                />
                            ) : post.Video ? (
                                <video 
                                    src={post.Video} 
                                    className="w-full h-full object-cover"
                                />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center bg-gray-300">
                                    <span className="text-gray-500 text-xs">No Media</span>
                                </div>
                            )}
                        </div>
                    ))
                ) : (
                    <div className="col-span-3 text-center py-8 text-gray-500">
                        No posts yet
                    </div>
                )}
            </div>

            <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 max-w-md mx-auto">
                <div className="flex items-center justify-around py-3">
                    <button onClick={() => navigate("/acc/home")} className="flex flex-col items-center gap-1 text-gray-500">
                        <Home className="w-6 h-6"/>
                        <span className="text-xs">Home</span>
                    </button>
                    <button onClick={() => navigate("/acc/home/campaign")} className="flex flex-col items-center gap-1 text-gray-500">
                        <Target className="w-6 h-6" />
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
                    <button className="flex flex-col items-center gap-1 text-green-600">
                        <User className="w-6 h-6" fill="currentColor"/>
                        <span className="text-xs">Profile</span>
                    </button>
                </div>
            </div>
        </div>
    );
}