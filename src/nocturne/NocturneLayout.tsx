import { useEffect, useState, type ReactNode } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useBooking } from '../context/BookingContext';
import ReportModal from '../components/ReportModal';
import GlowCursor from './GlowCursor';
import TargetReticle from './TargetReticle';
import { useEffectsEnabled } from './useEffectsEnabled';
import './nocturne.css';

/**
 * The Nocturne site shell: floating pill nav, the decorative pointer layers,
 * and the footer. Wraps every public page.
 *
 * The Nocturne tokens redefine names the light-mode admin also uses
 * (--color-surface, --color-text, --radius-*, --shadow-*), so `.nocturne-root`
 * scopes them to the public site. The <body> class only paints the page ground
 * dark, which matters while the app scrolls past the wrapper's own bounds.
 */

const NAV_LINKS = [
    { to: '/', label: 'Home' },
    { to: '/gallery', label: 'Gallery' },
    { to: '/services', label: 'Services' },
];

const NocturneNav = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const { openBooking } = useBooking();
    const [menuOpen, setMenuOpen] = useState(false);

    // Close the mobile sheet on navigation, or it covers the page it opened.
    useEffect(() => setMenuOpen(false), [location.pathname]);

    const go = (to: string) => {
        navigate(to);
        setMenuOpen(false);
    };

    return (
        <nav className={`nx-nav${menuOpen ? ' is-open' : ''}`}>
            <button
                type="button"
                className="nx-nav-brand"
                data-target
                onClick={() => go('/')}
                aria-label="it's ouR Studio — home"
            >
                <img src="/logo/LOGO_var1.png" alt="it's ouR Studio" />
            </button>

            {NAV_LINKS.map((link) => (
                <button
                    key={link.to}
                    type="button"
                    data-target
                    className={`nx-nav-link${location.pathname === link.to ? ' is-active' : ''}`}
                    aria-current={location.pathname === link.to ? 'page' : undefined}
                    onClick={() => go(link.to)}
                >
                    {link.label}
                </button>
            ))}

            <button
                type="button"
                data-target
                className="nx-pill nx-pill-sm"
                onClick={() => {
                    openBooking();
                    setMenuOpen(false);
                }}
            >
                Book Now
            </button>

            <button
                type="button"
                className="nx-nav-toggle"
                aria-expanded={menuOpen}
                aria-label={menuOpen ? 'Close menu' : 'Open menu'}
                onClick={() => setMenuOpen((open) => !open)}
            >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                    {menuOpen ? (
                        <>
                            <path d="M18 6 6 18" />
                            <path d="m6 6 12 12" />
                        </>
                    ) : (
                        <>
                            <path d="M3 6h18" />
                            <path d="M3 12h18" />
                            <path d="M3 18h18" />
                        </>
                    )}
                </svg>
            </button>
        </nav>
    );
};

const NocturneFooter = () => {
    const [reportOpen, setReportOpen] = useState(false);

    return (
        <>
            <footer className="nx-footer">
                <div>© {new Date().getFullYear()} it&apos;s ouR Studio. All rights reserved.</div>
                <div className="nx-footer-links">
                    <Link to="/faq">FAQ</Link>
                    <Link to="/privacy-policy">Privacy Policy</Link>
                    <button type="button" className="nx-footer-btn" onClick={() => setReportOpen(true)}>
                        Report an Issue
                    </button>
                </div>
                <div>FJ Center 15 Tongco Maysan, Valenzuela City</div>
            </footer>
            <ReportModal isOpen={reportOpen} onClose={() => setReportOpen(false)} />
        </>
    );
};

const NocturneLayout = ({ children }: { children: ReactNode }) => {
    const effects = useEffectsEnabled();

    useEffect(() => {
        document.body.classList.add('nocturne-body');
        return () => document.body.classList.remove('nocturne-body');
    }, []);

    return (
        <div className="nocturne-root">
            {effects.cursor && (
                <>
                    <GlowCursor />
                    <TargetReticle />
                </>
            )}
            <NocturneNav />
            <main>{children}</main>
            <NocturneFooter />
        </div>
    );
};

export default NocturneLayout;
