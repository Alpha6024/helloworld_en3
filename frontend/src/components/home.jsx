import { Heart, MessageCircle, Share2, Plus, Home, Target, Trophy, User, MapPin } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';

export default function home() {
  const navigate = useNavigate();
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [likedPosts, setLikedPosts] = useState({});
  const [currentUserId, setCurrentUserId] = useState(null);

  useEffect(() => {
    fetchCurrentUser();
    fetchPosts();
}, []);

const fetchCurrentUser = async () => {
    try {
        const res = await fetch('http://localhost:3000/auth/user', { credentials: 'include' });
        const data = await res.json();
        if (data.success) setCurrentUserId(data.user._id);
    } catch (err) {
        console.error(err);
    }
};

const fetchPosts = async () => {
    try {
        const res = await fetch('http://localhost:3000/post/view', { credentials: 'include' });
        const data = await res.json();
        if (data.success) {
            const shuffled = data.posts.sort(() => Math.random() - 0.5);
            setPosts(shuffled);
        }
    } catch (err) {
        console.error('Error fetching posts:', err);
    } finally {
        setLoading(false);
    }
};

useEffect(() => {
    if (posts.length > 0 && currentUserId) {
        const initialLikes = {};
        posts.forEach(post => {
            // Convert ObjectIds to strings for comparison
            initialLikes[post._id] = post.likedBy?.some(
                id => id.toString() === currentUserId.toString()
            );
        });
        setLikedPosts(initialLikes);
    }
}, [posts.length, currentUserId]);

const handleLike = async (postId) => {
    const alreadyLiked = likedPosts[postId];

    // Optimistic update
    setLikedPosts(prev => ({ ...prev, [postId]: !alreadyLiked }));
    setPosts(prev => prev.map(p =>
        p._id === postId
            ? { ...p, likes: alreadyLiked ? p.likes - 1 : p.likes + 1 }
            : p
    ));

    try {
        const res = await fetch(`http://localhost:3000/post/like/${postId}`, {
            method: 'PUT',
            credentials: 'include'
        });
        const data = await res.json();
        if (data.success) {
            // Sync with server truth
            setLikedPosts(prev => ({ ...prev, [postId]: data.liked }));
            setPosts(prev => prev.map(p =>
                p._id === postId ? { ...p, likes: data.likes } : p
            ));
        }
    } catch (err) {
        // Revert on error
        setLikedPosts(prev => ({ ...prev, [postId]: alreadyLiked }));
        setPosts(prev => prev.map(p =>
            p._id === postId
                ? { ...p, likes: alreadyLiked ? p.likes + 1 : p.likes - 1 }
                : p
        ));
    }
};
  if (loading) {
    return (
      <div className="max-w-md mx-auto bg-white min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-green-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto bg-white min-h-screen">

      <div className="sticky top-0 bg-white z-10 border-b border-gray-200">
        <div className="flex items-center justify-between p-4">
  <div className="w-10 h-10 bg-black rounded-xl flex items-center justify-center">
    <div className="w-6 h-6 border-2 border-white rounded-lg"></div>
  </div>
  {/* Donation Button */}
  <button
    onClick={() => navigate("/acc/home/fund")}
    className="flex items-center gap-2 bg-red-500 text-white text-xs font-semibold px-4 py-2 rounded-full shadow-md hover:bg-red-600 transition-colors"
  >
    <Heart className="w-4 h-4" fill="white" />
    Donate
  </button>
</div>
        
        <div className="flex border-b border-gray-200">
          <button className="flex-1 py-3 text-green-600 border-b-2 border-green-600 font-semibold">For You</button>
          <button className="flex-1 py-3 text-gray-500">Following</button>
        </div>
      </div>

      <div className="pb-20">
        {posts.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-gray-400">
            <MapPin className="w-12 h-12 mb-3" />
            <p className="font-medium">No posts yet</p>
            <p className="text-sm mt-1">Be the first to post an action!</p>
          </div>
        ) : (
          posts.map((post) => (
            <div key={post._id} className="border-b border-gray-200 pb-4">

              {/* Post Header with user info */}
              <div className="flex items-center justify-between p-4">
                <div className="flex items-center gap-3">
                  {post.userId?.avatar ? (
                    <img
                      src={post.userId.avatar}
                      alt={post.userId.name}
                      className="w-10 h-10 rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
                      <User className="w-5 h-5 text-green-600" />
                    </div>
                  )}
                  <div>
                    <div className="font-semibold text-sm">
                      {post.userId?.name || 'Unknown User'}
                    </div>
                    <div className="text-xs text-gray-500">
                      @{post.userId?.username || 'unknown'} · {new Date(post.posted_on).toLocaleDateString('en-IN', {
                        day: 'numeric', month: 'short'
                      })}
                    </div>
                  </div>
                </div>
                {post.featured && (
                  <span className="bg-yellow-100 text-yellow-700 text-xs font-semibold px-3 py-1 rounded-full">
                    ⭐ Featured
                  </span>
                )}
              </div>

             
              {/* Post Image */}
{post.image && (
    <img src={post.image} alt="Post" className="w-full h-64 object-cover" />
)}
{post.Video && (
    <video src={post.Video} className="w-full h-64 object-cover mt-1" controls />
)}

              {/* Caption */}
              {post.description && (
                <div className="px-4 pt-3">
                  <p className="text-sm text-gray-800">{post.description}</p>
                </div>
              )}

              {/* Post Actions */}
              <div className="px-4 pt-3">
                <div className="flex items-center gap-4 text-gray-600">
                  <button
                    onClick={() => handleLike(post._id)}
                    className="flex items-center gap-1"
                  >
                    <Heart
                      className="w-5 h-5 transition-colors"
                      fill={likedPosts[post._id] ? '#ef4444' : 'none'}
                      stroke={likedPosts[post._id] ? '#ef4444' : 'currentColor'}
                    />
                    <span className={`text-sm ${likedPosts[post._id] ? 'text-red-500' : ''}`}>
                      {post.likes || 0}
                    </span>
                  </button>
                  <button className="flex items-center gap-1">
                    <MessageCircle className="w-5 h-5" />
                    <span className="text-sm">0</span>
                  </button>
                  <button className="ml-auto">
                    <Share2 className="w-5 h-5" />
                  </button>
                </div>
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
          <button className="flex flex-col items-center gap-1 text-green-600">
            <Home className="w-6 h-6" fill="currentColor" />
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
          <button onClick={() => navigate("/acc/home/profile")} className="flex flex-col items-center gap-1 text-gray-500">
            <User className="w-6 h-6" />
            <span className="text-xs">Profile</span>
          </button>
        </div>
      </div>
    </div>
  );
}