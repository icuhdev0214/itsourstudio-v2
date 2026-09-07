import { type ReactElement, useState, useEffect, useCallback, useRef } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, Outlet, useLocation } from 'react-router-dom';
import NocturneLayout from './nocturne/NocturneLayout';
import NocturneHome from './pages/NocturneHome';
import NocturneServices from './pages/NocturneServices';
import NocturneGallery from './pages/NocturneGallery';
import EmailTest from './pages/EmailTest';
import PrivacyPolicy from './pages/PrivacyPolicy';
import AdminDashboard from './pages/AdminDashboard';
import AdminLogin from './pages/AdminLogin';
import CookieConsent from './components/CookieConsent';
import FAQ from './pages/FAQ';
import NotFound from './pages/NotFound';
import BioLinks from './pages/BioLinks';
import PatchNotes from './pages/PatchNotes';
import StructuredData from './components/StructuredData';

import { BookingProvider } from './context/BookingContext';
import BookingModal from './components/BookingModal';
import { auth } from './firebase';

const ProtectedRoute = ({ children }: { children: ReactElement }) => {
    const [user, setUser] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const unsubscribe = auth.onAuthStateChanged((user) => {
            setUser(user);
            setLoading(false);
        });
        return () => unsubscribe();
    }, []);

    if (loading) {
        return <div className="loading-container"><div className="spinner"></div></div>;
    }

    return user ? children : <Navigate to="/admin/login" replace />;
};

import ScrollToTop from './components/ScrollToTop';
import BackToTop from './components/BackToTop';
import LoadingScreen from './components/LoadingScreen';

/**
 * The public site, in the Nocturne shell. Everything inside `.nocturne-root`
 * picks up the dark tokens — including the booking modal and cookie banner,
 * which are written against the legacy token names the shell bridges.
 */
const PublicLayout = () => (
    <NocturneLayout>
        <BackToTop />
        <Outlet />
        <CookieConsent />
        <BookingModal />
    </NocturneLayout>
);

const AppContent = ({ onRouteChange }: { onRouteChange: () => void }) => {
    const location = useLocation();
    const prevPathnameRef = useRef(location.pathname);

    useEffect(() => {
        // Only trigger loading if pathname actually changed
        if (prevPathnameRef.current !== location.pathname) {
            onRouteChange();
            prevPathnameRef.current = location.pathname;
        }
    }, [location.pathname, onRouteChange]);

    return (
        <div className="app-container">
            <StructuredData />
            <ScrollToTop />

            <Routes>
                <Route element={<PublicLayout />}>
                    <Route path="/" element={<NocturneHome />} />
                    <Route path="/services" element={<NocturneServices />} />
                    <Route path="/gallery" element={<NocturneGallery />} />
                    <Route path="/privacy-policy" element={<PrivacyPolicy />} />
                    <Route path="/faq" element={<FAQ />} />
                    <Route path="/patch-notes" element={<PatchNotes />} />

                    {/* Redirects for hash links that might be interpreted as routes */}
                    <Route path="/about" element={<Navigate to="/" replace state={{ scrollTo: 'about' }} />} />
                    <Route path="/contact" element={<Navigate to="/" replace state={{ scrollTo: 'contact' }} />} />

                    {/* Catch all - renders 404 page */}
                    <Route path="*" element={<NotFound />} />
                </Route>

                {/* Standalone routes — their own chrome, no site nav */}
                <Route path="/email-test" element={<EmailTest />} />
                <Route path="/admin/login" element={<AdminLogin />} />
                <Route path="/links" element={<BioLinks />} />

                <Route
                    path="/admin"
                    element={
                        <ProtectedRoute>
                            <AdminDashboard />
                        </ProtectedRoute>
                    }
                />
            </Routes>
        </div >
    );
};

function App() {
    const [isLoading, setIsLoading] = useState(true);
    const isInitialLoadRef = useRef(true);

    const handleRouteChange = useCallback(() => {
        if (!isInitialLoadRef.current) {
            // Show loading screen for page transitions
            setIsLoading(true);
        }
    }, []);

    const handleLoadComplete = useCallback(() => {
        setIsLoading(false);
        if (isInitialLoadRef.current) {
            isInitialLoadRef.current = false;
        }
    }, []);

    return (
        <BookingProvider>
            <Router>
                {isLoading && <LoadingScreen onLoadComplete={handleLoadComplete} isPageTransition={!isInitialLoadRef.current} />}
                <AppContent onRouteChange={handleRouteChange} />
            </Router>
        </BookingProvider>
    );
}

export default App;
