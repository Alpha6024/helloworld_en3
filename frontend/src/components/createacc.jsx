import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, Mail, Lock, Phone, ArrowRight, Camera } from 'lucide-react';

export default function CreateAcc() {
    const navigate = useNavigate();
    const fileRef = useRef(null);

    const [form, setForm] = useState({
        name: '',
        email: '',
        username: '',
        password: '',
        confirmPassword: '',
        mob: ''
    });
    const [avatar, setAvatar] = useState(null);
    const [avatarPreview, setAvatarPreview] = useState(null);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleChange = (e) => {
        setForm({ ...form, [e.target.name]: e.target.value });
        setError('');
    };

    const handleAvatarChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setAvatar(file);
            setAvatarPreview(URL.createObjectURL(file));
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        if (form.password !== form.confirmPassword) {
            return setError("Passwords don't match");
        }
        if (form.password.length < 6) {
            return setError("Password must be at least 6 characters");
        }
        if (form.username.length < 3) {
            return setError("Username must be at least 3 characters");
        }

        setLoading(true);

        try {
            const formData = new FormData();
            formData.append('name', form.name);
            formData.append('email', form.email);
            formData.append('username', form.username);
            formData.append('password', form.password);
            if (form.mob) formData.append('mob', form.mob);
            if (avatar) formData.append('avatar', avatar);

            const res = await fetch('http://localhost:3000/user/signup', {
                method: 'POST',
                credentials: 'include',
                body: formData
            });

            const data = await res.json();

            if (data.success) {
                navigate('/acc/home');
            } else {
                setError(data.message || 'Something went wrong');
            }
        } catch (err) {
            setError('Server error, please try again');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4 py-8">
            <div className="w-full max-w-md bg-white rounded-lg shadow-sm p-8">

                {/* Header */}
                <div className="flex flex-col items-center mb-8">
                    <div className="w-16 h-16 bg-black rounded-full flex items-center justify-center mb-3">
                        <svg className="w-10 h-10 text-white" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M13 2L3 14h8l-1 8 10-12h-8l1-8z"/>
                        </svg>
                    </div>
                    <h1 className="text-2xl font-bold text-gray-900">Create Account</h1>
                    <p className="text-sm text-gray-500 mt-1">Join the eco-activist community</p>
                </div>

                {/* Avatar Upload */}
                <div className="flex flex-col items-center mb-6">
                    <div
                        className="relative w-24 h-24 rounded-full bg-gray-100 border-2 border-dashed border-gray-300 flex items-center justify-center cursor-pointer hover:border-green-400 transition-colors"
                        onClick={() => fileRef.current.click()}
                    >
                        {avatarPreview ? (
                            <img
                                src={avatarPreview}
                                alt="avatar"
                                className="w-full h-full rounded-full object-cover"
                            />
                        ) : (
                            <Camera className="w-8 h-8 text-gray-400" />
                        )}
                        <div className="absolute bottom-0 right-0 w-7 h-7 bg-green-500 rounded-full flex items-center justify-center">
                            <Camera className="w-4 h-4 text-white" />
                        </div>
                    </div>
                    <p className="text-xs text-gray-500 mt-2">Upload profile picture</p>
                    <input
                        ref={fileRef}
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={handleAvatarChange}
                    />
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">

                    {/* Name */}
                    <div>
                        <label className="block text-xs font-semibold text-gray-700 mb-1 uppercase tracking-wide">Full Name</label>
                        <div className="relative">
                            <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                            <input
                                type="text"
                                name="name"
                                value={form.name}
                                onChange={handleChange}
                                placeholder="John Doe"
                                required
                                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                            />
                        </div>
                    </div>

                    {/* Email */}
                    <div>
                        <label className="block text-xs font-semibold text-gray-700 mb-1 uppercase tracking-wide">Email</label>
                        <div className="relative">
                            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                            <input
                                type="email"
                                name="email"
                                value={form.email}
                                onChange={handleChange}
                                placeholder="john@example.com"
                                required
                                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                            />
                        </div>
                    </div>

                    {/* Username */}
                    <div>
                        <label className="block text-xs font-semibold text-gray-700 mb-1 uppercase tracking-wide">Username</label>
                        <div className="relative">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 font-medium">@</span>
                            <input
                                type="text"
                                name="username"
                                value={form.username}
                                onChange={handleChange}
                                placeholder="naturelover"
                                required
                                className="w-full pl-8 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                            />
                        </div>
                    </div>

                    {/* Mobile (optional) */}
                    <div>
                        <label className="block text-xs font-semibold text-gray-700 mb-1 uppercase tracking-wide">
                            Mobile <span className="text-gray-400 normal-case font-normal">(optional)</span>
                        </label>
                        <div className="relative">
                            <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                            <input
                                type="tel"
                                name="mob"
                                value={form.mob}
                                onChange={handleChange}
                                placeholder="10 digit number"
                                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                            />
                        </div>
                    </div>

                    {/* Password */}
                    <div>
                        <label className="block text-xs font-semibold text-gray-700 mb-1 uppercase tracking-wide">Password</label>
                        <div className="relative">
                            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                            <input
                                type="password"
                                name="password"
                                value={form.password}
                                onChange={handleChange}
                                placeholder="Min 6 characters"
                                required
                                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                            />
                        </div>
                    </div>

                    {/* Confirm Password */}
                    <div>
                        <label className="block text-xs font-semibold text-gray-700 mb-1 uppercase tracking-wide">Confirm Password</label>
                        <div className="relative">
                            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                            <input
                                type="password"
                                name="confirmPassword"
                                value={form.confirmPassword}
                                onChange={handleChange}
                                placeholder="Re-enter password"
                                required
                                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                            />
                        </div>
                    </div>

                    {/* Error */}
                    {error && (
                        <div className="bg-red-50 border border-red-200 text-red-600 text-sm px-4 py-3 rounded-lg">
                            {error}
                        </div>
                    )}

                    {/* Submit */}
                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-green-500 text-white py-3 rounded-lg font-semibold flex items-center justify-center gap-2 hover:bg-green-600 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
                    >
                        {loading ? (
                            <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        ) : (
                            <>
                                <ArrowRight className="w-5 h-5" />
                                Create Account
                            </>
                        )}
                    </button>
                </form>

                <div className="mt-6 text-center">
                    <p className="text-sm text-gray-600">
                        Already have an account?{' '}
                        <button
                            onClick={() => navigate('/acc')}
                            className="text-green-500 font-semibold cursor-pointer"
                        >
                            Login
                        </button>
                    </p>
                </div>
            </div>
        </div>
    );
}