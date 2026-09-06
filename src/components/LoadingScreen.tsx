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
                {/* Animated Logo, framed by the reticle's corner brackets */}
                <div className="loading-logo">
                    <div className="logo-frame" aria-hidden="true">
                        <i className="tl" />
                        <i className="tr" />
                        <i className="bl" />
                        <i className="br" />
                    </div>
                    <div className="logo-container">
                        {/* The nav's wordmark, so the loader and the site read as
                            one brand. It carries the name, so no separate
                            heading below it. */}
                        <img
                            src="/logo/LOGO_var2.png"
                            alt="it's ouR Studio"
                            className="loading-logo-image"
                        />
                    </div>
                </div>

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
