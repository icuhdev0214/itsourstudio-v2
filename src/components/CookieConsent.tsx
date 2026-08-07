import { useState, useEffect } from 'react';
import './CookieConsent.css';

const CookieConsent = () => {
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        // Check if user has already consented
        const hasConsented = localStorage.getItem('cookieConsent');
        if (!hasConsented) {
            // Show banner after a short delay
            const timer = setTimeout(() => setIsVisible(true), 1000);
            return () => clearTimeout(timer);
        }
    }, []);

    const handleAccept = () => {
        localStorage.setItem('cookieConsent', 'accepted');
        localStorage.setItem('cookieConsentDate', new Date().toISOString());
        setIsVisible(false);
    };

    const handleDecline = () => {
        localStorage.setItem('cookieConsent', 'declined');
        localStorage.setItem('cookieConsentDate', new Date().toISOString());
        setIsVisible(false);
        // Optionally disable analytics here
    };

    if (!isVisible) return null;

    return (
        <div className="cookie-consent-overlay">
            <div className="cookie-consent-banner">
                <div className="cookie-icon">🍪</div>
                <div className="cookie-content">
                    <h3>We Value Your Privacy</h3>
                    <p>
                        We use cookies and similar technologies to enhance your experience,
                        analyze site traffic, and for analytics purposes. By clicking "Accept All,"
                        you consent to our use of cookies in accordance with our{' '}
                        <a href="/privacy-policy">Privacy Policy</a> and the
                        Data Privacy Act of 2012 (RA 10173).
                    </p>
                </div>
                <div className="cookie-actions">
                    <button className="btn-decline" onClick={handleDecline}>
                        Decline
                    </button>
                    <button className="btn-accept" onClick={handleAccept}>
                        Accept All
                    </button>
                </div>
            </div>
        </div>
    );
};

export default CookieConsent;
