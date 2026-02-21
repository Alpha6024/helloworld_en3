import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, Phone, Camera, ArrowRight, Lock, Eye, EyeOff } from 'lucide-react';

export default function Newacc() {
    const navigate = useNavigate();
    const fileInputRef = useRef(null);
    
    const [formData, setFormData] = useState({
        name: '',
        username: '',
        mobile: '',
        password: '',
        confirmPassword: '',
        avatar: ''
    });
    const [userInfo, setUserInfo] = useState(null);
    const [loading, setLoading] = useState(true);
    const [imageFile, setImageFile] = useState(null);
    const [imagePreview, setImagePreview] = useState(null);
    const [uploading, setUploading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [passwordError, setPasswordError] = useState('');

    useEffect(() => {
        fetch('http://localhost:3000/auth/user', {
            credentials: 'include'
        })
        .then(res => res.json())
        .then(data => {
            if (data.success) {
                setUserInfo(data.user);
                setFormData({
                    name: data.user.name || '',
                    username: data.user.username || '',
                    mobile: data.user.mob || '',
                    password: '',
                    confirmPassword: '',
                    avatar: data.user.avatar || ''
                });
                setImagePreview(data.user.avatar || null);
            } else {
                navigate('/acc');
            }
            setLoading(false);
        })
        .catch(() => {
            navigate('/acc');
        });
    }, [navigate]);

    const handleImageClick = () => {
        fileInputRef.current?.click();
    };

    const handleImageChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            if (file.size > 5 * 1024 * 1024) {
                alert('Image size should be less than 5MB');
                return;
            }
            setImageFile(file);
            const reader = new FileReader();
            reader.onloadend = () => {
                setImagePreview(reader.result);
            };
            reader.readAsDataURL(file);
        }
    };

    const uploadToImageKit = async (file) => {
        const formData = new FormData();
        formData.append('file', file);

        try {
            const response = await fetch('http://localhost:3000/api/upload/avatar', {
                method: 'POST',
                credentials: 'include',
                body: formData
            });

            const data = await response.json();
            if (data.success) {
                return data.avatar;
            } else {
                throw new Error(data.message || 'Upload failed');
            }
        } catch (error) {
            console.error('Upload error:', error);
            throw error;
        }
    };

    const validatePassword = () => {
        if (formData.password.length < 6) {
            setPasswordError('Password must be at least 6 characters');
            return false;
        }
        if (formData.password !== formData.confirmPassword) {
            setPasswordError('Passwords do not match');
            return false;
        }
        setPasswordError('');
        return true;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!validatePassword()) {
            return;
        }

        setUploading(true);

        try {
            let avatarUrl = formData.avatar;

            if (imageFile) {
                avatarUrl = await uploadToImageKit(imageFile);
            }

            const response = await fetch('http://localhost:3000/api/user/complete-profile', {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                credentials: 'include',
                body: JSON.stringify({
                    name: formData.name,
                    username: formData.username,
                    mobile: formData.mobile,
                    password: formData.password,
                    avatar: avatarUrl
                })
            });

            const data = await response.json();

            if (data.success) {
                navigate('/acc/home');
            } else {
                alert(data.message);
            }
        } catch (error) {
            alert('Error completing profile');
        } finally {
            setUploading(false);
        }
    };

    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
        if (e.target.name === 'password' || e.target.name === 'confirmPassword') {
            setPasswordError('');
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-gray-600">Loading...</div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4 py-8">
            <div className="w-full max-w-md bg-white rounded-lg shadow-sm p-8">
                <div className="flex flex-col items-center mb-8">
                    <div className="relative mb-4">
                        <div className="w-24 h-24 rounded-full overflow-hidden bg-gray-200 border-4 border-white shadow-lg">
                            {imagePreview ? (
                                <img 
                                    src={imagePreview} 
                                    alt="Profile" 
                                    className="w-full h-full object-cover"
                                />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center bg-gray-300">
                                    <User className="w-12 h-12 text-gray-500" />
                                </div>
                            )}
                        </div>
                        <button
                            type="button"
                            onClick={handleImageClick}
                            className="absolute bottom-0 right-0 bg-green-500 text-white p-2 rounded-full shadow-lg hover:bg-green-600 transition-colors"
                        >
                            <Camera className="w-4 h-4" />
                        </button>
                        <input
                            ref={fileInputRef}
                            type="file"
                            accept="image/*"
                            onChange={handleImageChange}
                            className="hidden"
                        />
                    </div>
                    <h1 className="text-2xl font-bold text-gray-900 mb-2">Complete Your Profile</h1>
                    <p className="text-sm text-gray-600 text-center">Add your details to get started</p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-5">
                    <div>
                        <label className="block text-xs font-semibold text-gray-700 mb-2 uppercase tracking-wide">
                            Full Name
                        </label>
                        <div className="relative">
                            <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                            <input
                                type="text"
                                name="name"
                                value={formData.name}
                                onChange={handleChange}
                                placeholder="Enter your full name"
                                required
                                minLength={2}
                                maxLength={100}
                                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-xs font-semibold text-gray-700 mb-2 uppercase tracking-wide">
                            Username
                        </label>
                        <div className="relative">
                            <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 font-medium">@</span>
                            <input
                                type="text"
                                name="username"
                                value={formData.username}
                                onChange={handleChange}
                                placeholder="Choose a username"
                                required
                                minLength={3}
                                maxLength={30}
                                pattern="[a-zA-Z0-9_]+"
                                className="w-full pl-8 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                            />
                        </div>
                        <p className="text-xs text-gray-500 mt-1">Only letters, numbers, and underscores</p>
                    </div>

                    <div>
                        <label className="block text-xs font-semibold text-gray-700 mb-2 uppercase tracking-wide">
                            Mobile Number
                        </label>
                        <div className="relative">
                            <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                            <input
                                type="tel"
                                name="mobile"
                                value={formData.mobile}
                                onChange={handleChange}
                                placeholder="10 digit mobile number"
                                pattern="[0-9]{10}"
                                required
                                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-xs font-semibold text-gray-700 mb-2 uppercase tracking-wide">
                            Create Password
                        </label>
                        <div className="relative">
                            <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                            <input
                                type={showPassword ? "text" : "password"}
                                name="password"
                                value={formData.password}
                                onChange={handleChange}
                                placeholder="Min 6 characters"
                                required
                                minLength={6}
                                className="w-full pl-10 pr-12 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                            >
                                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                            </button>
                        </div>
                    </div>

                    <div>
                        <label className="block text-xs font-semibold text-gray-700 mb-2 uppercase tracking-wide">
                            Confirm Password
                        </label>
                        <div className="relative">
                            <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                            <input
                                type={showConfirmPassword ? "text" : "password"}
                                name="confirmPassword"
                                value={formData.confirmPassword}
                                onChange={handleChange}
                                placeholder="Re-enter password"
                                required
                                minLength={6}
                                className="w-full pl-10 pr-12 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                            />
                            <button
                                type="button"
                                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                            >
                                {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                            </button>
                        </div>
                        {passwordError && (
                            <p className="text-xs text-red-500 mt-1">{passwordError}</p>
                        )}
                    </div>

                    <button
                        type="submit"
                        disabled={uploading}
                        className="w-full bg-green-500 text-white py-3 rounded-lg font-semibold flex items-center justify-center gap-2 hover:bg-green-600 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
                    >
                        {uploading ? (
                            <>
                                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                Uploading...
                            </>
                        ) : (
                            <>
                                <ArrowRight className="w-5 h-5" />
                                Complete Profile
                            </>
                        )}
                    </button>
                </form>

                <div className="mt-6 text-center">
                    <p className="text-xs text-gray-500">
                        By continuing, you agree to our Terms of Service and Privacy Policy
                    </p>
                </div>
            </div>
        </div>
    );
}