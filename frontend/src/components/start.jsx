import { useNavigate } from 'react-router-dom';
import { useEffect } from 'react';

export default function Start() {
    const navigate = useNavigate();

    useEffect(() => {
        const timer = setTimeout(() => {
            navigate('/acc');
        }, 2500);

        return () => clearTimeout(timer);
    }, [navigate]);

    return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-b from-green-50 to-green-100 px-6">
            <div className="flex flex-col items-center space-y-6 animate-fade-in">
                <img 
                    src="https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?w=400&h=400&fit=crop" 
                    alt="Prithvi Logo" 
                    className="w-32 h-32 rounded-full shadow-2xl object-cover border-4 border-green-600"
                />
                <h1 className="text-5xl font-bold text-green-800 tracking-wide">
                    PRITHVI
                </h1>
                <p className="text-green-600 text-sm font-medium">
                    पृथ्वी
                </p>
            </div>
        </div>
    );
}