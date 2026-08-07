import { useEffect, useState } from 'react';
import './LoadingScreen.css';

interface LoadingScreenProps {
    onLoadComplete?: () => void;
    isPageTransition?: boolean;
}

const LoadingScreen = ({ onLoadComplete, isPageTransition = false }: LoadingScreenProps) => {
    const [isLoaded, setIsLoaded] = useState(false);

    useEffect(() => {
        // Different timing for initial load vs page transitions
        const loadingDuration = isPageTransition ? 600 : 1500;

        const timer = setTimeout(() => {
            setIsLoaded(true);
            if (onLoadComplete) {
                // Add extra delay for fade-out animation
                setTimeout(onLoadComplete, 400);
            }
        }, loadingDuration);

        return () => clearTimeout(timer);
    }, [onLoadComplete, isPageTransition]);

    return (
        <div className={`loading-screen ${isLoaded ? 'fade-out' : ''}`}>
            <div className="loading-content">
                {/* Animated Logo */}
                <div className="loading-logo">
                    <div className="logo-container">
                        <img
                            src="/logo/android-chrome-512x512.png"
                            alt="it's ouR Studio"
                            className="loading-logo-image"
                        />
                    </div>
                </div>

                {/* Brand Name */}
                <h1 className="loading-brand">it's ouR Studio</h1>

                {/* Loading Bar */}
                <div className="loading-bar-container">
                    <div className="loading-bar"></div>
                </div>

                {/* Tagline */}
                <p className="loading-tagline">Capturing Your Moments</p>
            </div>

            {/* Decorative Elements */}
            <div className="loading-orb loading-orb-1"></div>
            <div className="loading-orb loading-orb-2"></div>
        </div>
    );
};

export default LoadingScreen;
