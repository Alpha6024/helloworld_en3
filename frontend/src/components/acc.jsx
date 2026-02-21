import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, Lock, ArrowRight } from 'lucide-react';

export default function Acc() {
    const navigate = useNavigate();
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleLogin = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            const res = await fetch('http://localhost:3000/user/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({ username, password })
            });

            const data = await res.json();

            if (data.success) {
                navigate("/acc/home");
            } else {
                setError(data.message || 'Login failed');
            }
        } catch (err) {
            setError('Server error, please try again');
        } finally {
            setLoading(false);
        }
    };

    const handleGoogleSignup = () => {
        window.location.href = 'http://localhost:3000/auth/google';
    };

    return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
            <div className="w-full max-w-md m-4 bg-white rounded-lg shadow-sm p-8">
                <div className="flex flex-col items-center mb-8">
                    <div className="w-20 h-20 bg-black rounded-full flex items-center justify-center mb-4">
                        <svg className="w-12 h-12 text-white" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M13 2L3 14h8l-1 8 10-12h-8l1-8z"/>
                        </svg>
                    </div>
                    <h1 className="text-2xl font-bold text-gray-900 mb-2">Action for the Earth</h1>
                    <p className="text-sm text-gray-600 text-center">Join the community of eco-activists tracking real-world impact.</p>
                </div>

                <form onSubmit={handleLogin} className="space-y-5">
                    <div>
                        <label className="block text-xs font-semibold text-gray-700 mb-2 uppercase tracking-wide">
                            Username
                        </label>
                        <div className="relative">
                            <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                            <input
                                type="text"
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                placeholder="naturelover"
                                required
                                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                            />
                        </div>
                    </div>

                    <div>
                        <div className="flex justify-between items-center mb-2">
                            <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wide">
                                Password
                            </label>
                            <button type="button" className="cursor-pointer text-xs text-green-500 font-medium">
                                Forgot Password?
                            </button>
                        </div>
                        <div className="relative">
                            <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                            <input
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder="••••••••"
                                required
                                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                            />
                        </div>
                    </div>

                    {/* Error message */}
                    {error && (
                        <div className="bg-red-50 border border-red-200 text-red-600 text-sm px-4 py-3 rounded-lg">
                            {error}
                        </div>
                    )}

                    <button
                        type="submit"
                        disabled={loading}
                        className="cursor-pointer w-full bg-green-500 text-white py-3 rounded-lg font-semibold flex items-center justify-center gap-2 hover:bg-green-600 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
                    >
                        {loading ? (
                            <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        ) : (
                            <>
                                <ArrowRight className="w-5 h-5" />
                                Login
                            </>
                        )}
                    </button>
                </form>

                <div className="flex items-center gap-3 my-6">
                    <div className="flex-1 h-px bg-gray-300"></div>
                    <span className="text-xs text-gray-500 font-medium uppercase">Or continue with</span>
                    <div className="flex-1 h-px bg-gray-300"></div>
                </div>

                <button
                    onClick={handleGoogleSignup}
                    className="cursor-pointer w-full border border-gray-300 py-3 rounded-lg font-medium text-gray-700 flex items-center justify-center gap-2 hover:bg-gray-50 transition-colors"
                >
                    <svg className="w-5 h-5" viewBox="0 0 24 24">
                        <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                        <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                        <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                        <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                    </svg>
                    Sign in with Google
                </button>

                <div onClick={() => navigate("/createacc")} className="mt-6 text-center">
                    <p className="text-sm text-gray-600">
                        Don't have an account?{' '}
                        <button className="cursor-pointer text-green-500 font-semibold">Sign Up</button>
                    </p>
                </div>

                <div className="mt-6 flex justify-center gap-4 text-xs text-gray-500">
                    <button className="hover:text-gray-700">PRIVACY POLICY</button>
                    <span>•</span>
                    <button className="hover:text-gray-700">TERMS OF SERVICE</button>
                </div>
            </div>
        </div>
    );
}