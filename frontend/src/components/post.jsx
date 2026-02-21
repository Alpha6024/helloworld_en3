import { ArrowLeft, Camera, CheckCircle, X, Image, Video } from 'lucide-react';
import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';

export default function CreatePost() {
    const navigate = useNavigate();
    const fileRef = useRef(null);
    const videoRef = useRef(null);

    const [imageFile, setImageFile] = useState(null);
    const [imagePreview, setImagePreview] = useState(null);
    const [videoFile, setVideoFile] = useState(null);
    const [videoPreview, setVideoPreview] = useState(null);
    const [description, setDescription] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleImageChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setImageFile(file);
            setImagePreview(URL.createObjectURL(file));
        }
    };

    const handleVideoChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setVideoFile(file);
            setVideoPreview(URL.createObjectURL(file));
        }
    };

    const removeImage = () => {
        setImageFile(null);
        setImagePreview(null);
        fileRef.current.value = '';
    };

    const removeVideo = () => {
        setVideoFile(null);
        setVideoPreview(null);
        videoRef.current.value = '';
    };

    const handleSubmit = async () => {
        setError('');

        if (!imageFile && !videoFile && !description.trim()) {
            return setError('Please add an image, video, or description');
        }

        setLoading(true);

        try {
            const formData = new FormData();
            if (imageFile) formData.append('image', imageFile);
            if (videoFile) formData.append('video', videoFile);
            if (description) formData.append('description', description);

            const res = await fetch('http://localhost:3000/post/create', {
                method: 'POST',
                credentials: 'include',
                body: formData
            });

            const data = await res.json();

            if (data.success) {
                navigate('/acc/home');
            } else {
                setError(data.message || 'Failed to create post');
            }
        } catch (err) {
            setError('Server error, please try again');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-md mx-auto bg-gray-50 min-h-screen">

            {/* HEADER */}
            <div className="bg-white sticky top-0 z-10 border-b border-gray-200">
                <div className="flex items-center justify-between p-4">
                    <button onClick={() => navigate("/acc/home")} className="text-gray-700">
                        <ArrowLeft className="w-6 h-6" />
                    </button>
                    <h1 className="text-lg font-semibold">New Action</h1>
                    <div className="w-10" />
                </div>
            </div>

            <div className="p-4 space-y-4">

                {/* IMAGE UPLOAD */}
                <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-200">
                    <div className="flex items-center gap-2 mb-3">
                        <Camera className="w-5 h-5 text-green-600" />
                        <span className="font-semibold text-sm">Capture Your Impact</span>
                    </div>

                    {imagePreview ? (
                        <div className="relative rounded-xl overflow-hidden">
                            <img
                                src={imagePreview}
                                alt="preview"
                                className="w-full h-48 object-cover"
                            />
                            <button
                                onClick={removeImage}
                                className="absolute top-2 right-2 bg-black bg-opacity-60 text-white rounded-full p-1"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        </div>
                    ) : (
                        <div
                            onClick={() => fileRef.current.click()}
                            className="bg-gray-100 rounded-xl h-40 flex flex-col items-center justify-center cursor-pointer hover:bg-gray-200 transition-colors border-2 border-dashed border-gray-300"
                        >
                            <Image className="w-10 h-10 text-gray-400 mb-2" />
                            <p className="text-sm text-gray-500 font-medium">Tap to upload image</p>
                            <p className="text-xs text-gray-400 mt-1">JPG, PNG supported</p>
                        </div>
                    )}

                    <input
                        ref={fileRef}
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={handleImageChange}
                    />
                </div>

                {/* VIDEO UPLOAD */}
                <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-200">
                    <div className="flex items-center gap-2 mb-3">
                        <Video className="w-5 h-5 text-blue-600" />
                        <span className="font-semibold text-sm">Add Video</span>
                    </div>

                    {videoPreview ? (
                        <div className="relative rounded-xl overflow-hidden">
                            <video
                                src={videoPreview}
                                controls
                                className="w-full h-48 object-cover rounded-xl"
                            />
                            <button
                                onClick={removeVideo}
                                className="absolute top-2 right-2 bg-black bg-opacity-60 text-white rounded-full p-1"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        </div>
                    ) : (
                        <div
                            onClick={() => videoRef.current.click()}
                            className="bg-gray-100 rounded-xl h-40 flex flex-col items-center justify-center cursor-pointer hover:bg-gray-200 transition-colors border-2 border-dashed border-gray-300"
                        >
                            <Video className="w-10 h-10 text-gray-400 mb-2" />
                            <p className="text-sm text-gray-500 font-medium">Tap to upload video</p>
                            <p className="text-xs text-gray-400 mt-1">MP4, MOV supported</p>
                        </div>
                    )}

                    <input
                        ref={videoRef}
                        type="file"
                        accept="video/*"
                        className="hidden"
                        onChange={handleVideoChange}
                    />
                </div>

                {/* DESCRIPTION */}
                <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-200">
                    <label className="block text-sm font-semibold mb-2">
                        Tell the community what happened!
                    </label>
                    <textarea
                        className="w-full border border-gray-200 rounded-xl p-3 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-green-500"
                        rows="4"
                        placeholder="Describe your eco action... planted trees, cleaned a beach, reduced waste?"
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        maxLength={500}
                    />
                    <p className="text-xs text-gray-400 text-right mt-1">{description.length}/500</p>
                </div>

                {/* ERROR */}
                {error && (
                    <div className="bg-red-50 border border-red-200 text-red-600 text-sm px-4 py-3 rounded-xl">
                        {error}
                    </div>
                )}

                {/* POST BUTTON */}
                <button
                    onClick={handleSubmit}
                    disabled={loading}
                    className="w-full bg-green-500 text-white font-semibold py-4 rounded-2xl flex items-center justify-center gap-2 shadow-lg hover:bg-green-600 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
                >
                    {loading ? (
                        <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    ) : (
                        <>
                            <CheckCircle className="w-5 h-5" />
                            Post My Action
                        </>
                    )}
                </button>

            </div>
        </div>
    );
}