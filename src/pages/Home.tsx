import { lazy, Suspense, useState, useEffect, useRef, useCallback } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Aperture, ArrowRight, CalendarCheck, ChevronDown, Clock, Images, Sparkles, X } from 'lucide-react';
import { useBooking } from '../context/BookingContext';
import { db } from '../firebase';
import { collection, query, where, onSnapshot, orderBy, limit, doc, getDoc } from 'firebase/firestore';
import { sanitizeName, sanitizeEmail, sanitizeText } from '../utils/sanitize';
import { visibleServices } from '../utils/serviceCatalog';
import FeedbackModal from '../components/FeedbackModal';
import PromoSection from '../components/PromoSection';
import BackdropVisualizer from '../components/BackdropVisualizer';
import LazyImage from '../components/LazyImage';

const ScrollCameraExperience = lazy(() => import('../components/ScrollCameraExperience'));
const preloadScrollCamera = () => import('../components/ScrollCameraExperience');
preloadScrollCamera().catch(() => {});

interface Feedback {
    id: string;
    name: string;
    rating: number;
    message: string;
    showInTestimonials: boolean;
}

interface AboutContent {
    title: string;
    description1: string;
    description2: string;
    imageUrl: string;
}

interface HomeService {
    id: string;
    title: string;
    price: string;
    duration: string;
    description: string;
    features: string[];
    isBestSelling?: boolean;
    isVisible?: boolean;
    order?: number;
}

const galleryItems = [
    { src: '/gallery/solo1.webp', category: 'Portrait', title: 'Solo Session' },
    { src: '/gallery/duo1.webp', category: 'Couple', title: 'Duo Shoot' },
    { src: '/gallery/group1.webp', category: 'Group', title: 'Barkada' },
    { src: '/gallery/solo2.webp', category: 'Portrait', title: 'Creative Solo' },
    { src: '/gallery/duo2.webp', category: 'Couple', title: 'Partner in Crime' },
    { src: '/gallery/group2.webp', category: 'Group', title: 'Squad Goals' },
    { src: '/gallery/solo3.webp', category: 'Portrait', title: 'Profile Update' },
    { src: '/gallery/duo3.webp', category: 'Couple', title: 'Anniversary' },
    { src: '/gallery/group3.webp', category: 'Group', title: 'Family Love' },
    { src: '/gallery/solo4.webp', category: 'Portrait', title: 'Self Love' },
    { src: '/gallery/duo4.webp', category: 'Couple', title: 'Besties' },
    { src: '/gallery/group4.webp', category: 'Group', title: 'Team Bonding' },
];

const FALLBACK_HOME_SERVICES: HomeService[] = [
    {
        id: 'solo',
        title: 'Solo Package',
        price: '₱299',
        duration: '15 Minutes',
        description: 'Perfect for a quick profile update or self-portrait session.',
        features: ['1 Person', '10 min shoot + 5 min selection', '1 Background selection', '10 Raw soft copies', '1 4R print'],
        isBestSelling: false,
        isVisible: true,
        order: 1
    },
    {
        id: 'basic',
        title: 'Basic Package',
        price: '₱399',
        duration: '25 Minutes',
        description: 'Our most popular choice for couples and duos.',
        features: ['1-2 People', '15 min shoot + 10 min selection', '1 Background selection', '15 Raw soft copies', '2 strips print', 'Free use of props & wardrobe'],
        isBestSelling: true,
        isVisible: true,
        order: 2
    },
    {
        id: 'barkada',
        title: 'Barkada Package',
        price: '₱1,949',
        duration: '50 Minutes',
        description: 'The ultimate group experience for friends and family.',
        features: ['Up to 8 People', '30 min shoot + 20 min selection', '1 Background selection', 'Soft copies of all raw photos', '8 strips print', '2 A5 prints & 2 4R prints'],
        isBestSelling: false,
        isVisible: true,
        order: 7
    }
];

const companionSections = [
    { id: 'home', label: 'Studio intro' },
    { id: 'gallery', label: 'Moments' },
    { id: 'services', label: 'Packages' },
    { id: 'testimonials', label: 'Stories' },
    { id: 'about', label: 'Studio' },
    { id: 'contact', label: 'Contact' }
];

const Home = () => {
    const { isBookingOpen, openBooking } = useBooking();
    const location = useLocation();
    const [showCompanionIntro, setShowCompanionIntro] = useState(() => {
        if (typeof window === 'undefined') return false;
        return sessionStorage.getItem('studioCompanionSeen') !== 'true';
    });
    const [isCompanionOpen, setIsCompanionOpen] = useState(false);
    const [scrollProgress, setScrollProgress] = useState(0);
    const [cameraProgress, setCameraProgress] = useState(0);
    const [activeCompanionSection, setActiveCompanionSection] = useState(companionSections[0].label);
    const isCompanionFlyingAway = scrollProgress >= 0.92;
    const showBottomBookingReveal = isCompanionFlyingAway;

    useEffect(() => {
        document.body.classList.add('home-3d-page');
        return () => document.body.classList.remove('home-3d-page');
    }, []);

    useEffect(() => {
        // Scroll to top on mount if no specific scroll intent
        if (!location.state?.scrollTo && !window.location.hash) {
            window.scrollTo(0, 0);
        }

        // Handle state-based scrolling (from other pages)
        if (location.state?.scrollTo) {
            const targetSection = location.state.scrollTo;

            const scrollToSection = () => {
                const element = document.getElementById(targetSection);
                if (element) {
                    element.scrollIntoView({ behavior: 'smooth', block: 'start' });
                    console.log(`Scrolled to section: ${targetSection}`);
                } else {
                    console.warn(`Section not found: ${targetSection}`);
                }
            };

            // Increased delay to account for loading screen (600ms) + fade out (400ms) + buffer
            setTimeout(scrollToSection, 1200);

            // Fallback: try again after a bit more time in case content is still loading
            setTimeout(scrollToSection, 1500);
        }
    }, [location]);
    const [feedbacks, setFeedbacks] = useState<Feedback[]>([]);
    const [isFeedbackOpen, setIsFeedbackOpen] = useState(false);
    const [homeServices, setHomeServices] = useState<HomeService[]>(FALLBACK_HOME_SERVICES);
    const [aboutContent, setAboutContent] = useState<AboutContent>({
        title: "About it's ouR Studio",
        description1: "Welcome to it's ouR Studio, where you're in complete control of your photography experience. Our state-of-the-art self-photography studio is designed to empower you to capture your authentic self in a comfortable, private environment.",
        description2: "Equipped with professional lighting, multiple backdrops, and an intuitive remote control system, our studio makes it easy for anyone to create stunning, professional-quality photos. Whether you need headshots for your career, content for social media, or simply want to celebrate yourself, we provide the perfect space and tools.",
        imageUrl: "/about-studio.jpg"
    });

    // Contact Form State
    const [contactForm, setContactForm] = useState({ name: '', email: '', message: '' });
    const [contactSubmitting, setContactSubmitting] = useState(false);
    const [contactSuccess, setContactSuccess] = useState(false);

    const handleContactChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        setContactForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
    };

    const handleContactSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setContactSubmitting(true);

        // Sanitize inputs
        const sanitizedName = sanitizeName(contactForm.name, 100);
        const sanitizedEmail = sanitizeEmail(contactForm.email);
        const sanitizedMessage = sanitizeText(contactForm.message, 1000);

        if (!sanitizedName || !sanitizedEmail || !sanitizedMessage) {
            alert('Please fill in all fields with valid information.');
            setContactSubmitting(false);
            return;
        }

        try {
            const response = await fetch('/api/send-email', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    type: 'contact',
                    contact: {
                        name: sanitizedName,
                        email: sanitizedEmail,
                        message: sanitizedMessage
                    }
                })
            });

            if (!response.ok) {
                throw new Error('Failed to send');
            }

            setContactSuccess(true);
            setContactForm({ name: '', email: '', message: '' });
            setTimeout(() => setContactSuccess(false), 5000);
        } catch (error) {
            console.error('Failed to send contact message:', error);
            alert('Failed to send message. Please try again or contact us directly.');
        } finally {
            setContactSubmitting(false);
        }
    };




    useEffect(() => {
        const fetchAbout = async () => {
            try {
                const docRef = doc(db, 'siteContent', 'about');
                const docSnap = await getDoc(docRef);
                if (docSnap.exists()) {
                    setAboutContent(docSnap.data() as AboutContent);
                }
            } catch (err) {
                console.error("Error fetching about content:", err);
            }
        };
        fetchAbout();
    }, []);

    useEffect(() => {
        const q = query(
            collection(db, 'feedbacks'),
            where('showInTestimonials', '==', true),
            orderBy('createdAt', 'desc'),
            limit(3)
        );

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const feedbacksData = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            })) as Feedback[];
            setFeedbacks(feedbacksData);
        });

        return () => unsubscribe();
    }, []);

    useEffect(() => {
        const unsubscribe = onSnapshot(collection(db, 'services'), (snapshot) => {
            if (snapshot.empty) {
                setHomeServices(FALLBACK_HOME_SERVICES);
                return;
            }

            const services = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            })) as HomeService[];

            const previewServices = visibleServices(services).slice(0, 3);
            setHomeServices(previewServices.length > 0 ? previewServices : FALLBACK_HOME_SERVICES);
        }, (error) => {
            console.error("Error fetching homepage services:", error);
            setHomeServices(FALLBACK_HOME_SERVICES);
        });

        return () => unsubscribe();
    }, []);

    const renderServiceIcon = (service: HomeService, index: number) => {
        if (service.isBestSelling) {
            return <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z"></path></svg>;
        }

        if (service.id.includes('barkada') || service.id.includes('family') || index === 2) {
            return <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>;
        }

        return <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>;
    };

    // Fetch Dynamic Gallery Items
    const [dynamicGalleryItems, setDynamicGalleryItems] = useState(galleryItems);

    useEffect(() => {
        const fetchGallery = async () => {
            // Fetch more items to ensure we get enough carousel-enabled ones, 
            // sorting by creation date. Client-side filtering is safer without composite index.
            const q = query(collection(db, 'gallery'), orderBy('createdAt', 'desc'), limit(50));

            const unsubscribe = onSnapshot(q, (snapshot) => {
                const fetchedItems = snapshot.docs
                    .map(doc => {
                        const data = doc.data();
                        return {
                            id: doc.id,
                            src: data.src,
                            category: data.category === 'solo' ? 'Portrait' : data.category === 'duo' ? 'Couple' : 'Group', // map to display names
                            title: data.alt || 'Studio Session',
                            showInCarousel: data.showInCarousel
                        };
                    })
                    // Filter for carousel items
                    .filter(item => item.showInCarousel);

                // If we have dynamic items, use them entirely. 
                // Fallback to static galleryItems ONLY if no dynamic items exist (or just empty if user explicitly turned all off).
                // Actually, let's merge or prefer dynamic. 
                // User wants control, so if they set items in DB, we should probably ONLY show those?
                // But initially DB is empty.
                if (fetchedItems.length > 0) {
                    setDynamicGalleryItems(fetchedItems);
                } else {
                    // Fallback to static if nothing in DB is marked for carousel
                    setDynamicGalleryItems(galleryItems);
                }
            });
            return () => unsubscribe();
        };
        fetchGallery();
    }, []);

    // Hero Interaction Logic
    const heroRef = useRef<HTMLElement>(null);
    const rafRef = useRef<number | null>(null);

    const handleHeroMouseMove = useCallback((e: React.MouseEvent) => {
        // Disable parallax on mobile/touch devices (performance optimization)
        const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
        if (isTouchDevice || window.innerWidth <= 1024) return;

        if (!heroRef.current || rafRef.current) return;

        const { clientX, clientY } = e;
        const element = heroRef.current;

        rafRef.current = requestAnimationFrame(() => {
            const rect = element.getBoundingClientRect();
            const x = (clientX - rect.left) / rect.width;
            const y = (clientY - rect.top) / rect.height;

            element.style.setProperty('--mouse-x', `${x}`);
            element.style.setProperty('--mouse-y', `${y}`);
            rafRef.current = null;
        });
    }, []);

    useEffect(() => {
        return () => {
            if (rafRef.current) {
                cancelAnimationFrame(rafRef.current);
            }
        };
    }, []);

    useEffect(() => {
        let ticking = false;
        let cachedGalleryBottom = 0;

        const updateCompanion = () => {
            const scrollableHeight = Math.max(document.documentElement.scrollHeight - window.innerHeight, 1);
            const progress = Math.min(Math.max(window.scrollY / scrollableHeight, 0), 1);
            setScrollProgress(progress);

            const galleryElement = document.getElementById('gallery');
            if (galleryElement && cachedGalleryBottom === 0) {
                cachedGalleryBottom = galleryElement.offsetTop + galleryElement.offsetHeight;
            }

            let cameraProgress = 0;
            if (cachedGalleryBottom > 0) {
                cameraProgress = Math.min(Math.max(window.scrollY / (cachedGalleryBottom - window.innerHeight), 0), 1);
            }
            setCameraProgress(cameraProgress);

            const viewportAnchor = window.innerHeight * 0.38;
            let currentSectionLabel = companionSections[0].label;
            for (let index = companionSections.length - 1; index >= 0; index -= 1) {
                const section = companionSections[index];
                const element = document.getElementById(section.id);
                if (element && element.getBoundingClientRect().top <= viewportAnchor) {
                    currentSectionLabel = section.label;
                    break;
                }
            }

            setActiveCompanionSection(currentSectionLabel);
            ticking = false;
        };

        const handleScroll = () => {
            if (ticking) return;
            ticking = true;
            requestAnimationFrame(updateCompanion);
        };

        const handleResize = () => {
            cachedGalleryBottom = 0;
            const galleryElement = document.getElementById('gallery');
            if (galleryElement) {
                cachedGalleryBottom = galleryElement.offsetTop + galleryElement.offsetHeight;
            }
            if (ticking) return;
            ticking = true;
            requestAnimationFrame(updateCompanion);
        };

        updateCompanion();
        window.addEventListener('scroll', handleScroll, { passive: true });
        window.addEventListener('resize', handleResize);

        return () => {
            window.removeEventListener('scroll', handleScroll);
            window.removeEventListener('resize', handleResize);
        };
    }, []);

    useEffect(() => {
        if (!showCompanionIntro) return;

        const timer = window.setTimeout(() => {
            setShowCompanionIntro(false);
            sessionStorage.setItem('studioCompanionSeen', 'true');
        }, 5200);

        return () => window.clearTimeout(timer);
    }, [showCompanionIntro]);

    const dismissCompanionIntro = () => {
        setShowCompanionIntro(false);
        sessionStorage.setItem('studioCompanionSeen', 'true');
    };

    const scrollToNextCompanionSection = () => {
        const currentIndex = companionSections.findIndex(section => section.label === activeCompanionSection);
        const nextSection = companionSections[Math.min(currentIndex + 1, companionSections.length - 1)];
        document.getElementById(nextSection.id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    };

    const [isDragging, setIsDragging] = useState(false);
    const [startX, setStartX] = useState(0);
    const [currentTranslate, setCurrentTranslate] = useState(0);
    const [prevTranslate, setPrevTranslate] = useState(0);

    // Animation state
    const trackRef = useRef<HTMLDivElement>(null);
    const animationRef = useRef<number>(0);
    const draggingRef = useRef(false); // To access fresh state in loop if needed, though strictly we use state for renders

    // Using a ref for currentTranslate to avoid closure staleness in the animation loop
    const translateRef = useRef(0);

    // Speed of auto-scroll (pixels per frame)
    const scrollSpeed = 0.5;

    const animationLoop = useCallback(() => {
        if (!draggingRef.current) {
            translateRef.current -= scrollSpeed;

            // Reset if we've scrolled past the first set of items
            // We need to know the width of the first set. 
            // Approximation: width of half the track.
            if (trackRef.current) {
                const trackWidth = trackRef.current.scrollWidth;
                const halfWidth = trackWidth / 2;

                if (Math.abs(translateRef.current) >= halfWidth) {
                    translateRef.current = 0;
                }
            }

            setCurrentTranslate(translateRef.current);
        }
        animationRef.current = requestAnimationFrame(animationLoop);
    }, []);

    useEffect(() => {
        animationRef.current = requestAnimationFrame(animationLoop);
        return () => cancelAnimationFrame(animationRef.current);
    }, [animationLoop]);

    // Add ref for carousel container to use native event listeners with passive option
    const carouselContainerRef = useRef<HTMLDivElement>(null);
    const mouseMoveRafRef = useRef<number>(0);

    useEffect(() => {
        const container = carouselContainerRef.current;
        if (!container) return;

        // Use passive listeners for better scroll performance
        const passiveTouchMove = (e: TouchEvent) => {
            if (!draggingRef.current) return;
            e.preventDefault();
            
            const pageX = e.touches[0].pageX;
            const diff = pageX - startX;
            const newTranslate = prevTranslate + diff;
            translateRef.current = newTranslate;
            
            if (trackRef.current) {
                trackRef.current.style.transform = `translateX(${newTranslate}px)`;
            }
        };

        container.addEventListener('touchmove', passiveTouchMove, { passive: false });

        return () => {
            container.removeEventListener('touchmove', passiveTouchMove);
            if (mouseMoveRafRef.current) {
                cancelAnimationFrame(mouseMoveRafRef.current);
            }
        };
    }, [startX, prevTranslate]);

    const handleDragStart = (e: React.MouseEvent | React.TouchEvent) => {
        setIsDragging(true);
        draggingRef.current = true;

        const pageX = 'touches' in e ? e.touches[0].pageX : (e as React.MouseEvent).pageX;
        setStartX(pageX);

        // Only cancel animation loop if we want to purely manual drag. 
        // But for "pause and drag", we keep the loop running but conditionally update?
        // Actually, better to just pause the AUTOMATIC update.
        // We still need to update state during drag.
        cancelAnimationFrame(animationRef.current);

        setPrevTranslate(translateRef.current);
    };

    const handleDragMove = (e: React.MouseEvent | React.TouchEvent) => {
        if (!isDragging) return;
        
        // Only handle mouse events here; touch events handled by native listener
        if ('touches' in e) return;
        
        e.preventDefault();

        // Throttle mouse move with requestAnimationFrame
        if (mouseMoveRafRef.current) {
            return;
        }

        mouseMoveRafRef.current = requestAnimationFrame(() => {
            mouseMoveRafRef.current = 0;
            
            const pageX = (e as React.MouseEvent).pageX;
            const diff = pageX - startX;
            const newTranslate = prevTranslate + diff;
            translateRef.current = newTranslate;
            
            // Use direct DOM manipulation for smoother dragging (no re-render on every move)
            if (trackRef.current) {
                trackRef.current.style.transform = `translateX(${newTranslate}px)`;
            }
        });
    };

    const handleDragEnd = () => {
        setIsDragging(false);
        draggingRef.current = false;

        // Constrain bounds if needed, or simply let it flow back to loop?
        // To ensure infinite loop stability, we should probably check bounds here too.
        if (trackRef.current) {
            const trackWidth = trackRef.current.scrollWidth;
            const halfWidth = trackWidth / 2;
            // If dragged too far left
            if (Math.abs(translateRef.current) >= halfWidth) {
                translateRef.current = translateRef.current % halfWidth;
            }
            // If dragged too far right (positive)
            if (translateRef.current > 0) {
                translateRef.current = -halfWidth + translateRef.current;
            }
        }

        // Update state once at the end
        setCurrentTranslate(translateRef.current);

        // Restart loop
        cancelAnimationFrame(animationRef.current);
        animationRef.current = requestAnimationFrame(animationLoop);
    };


    useEffect(() => {
        // Scroll to top on mount
        window.scrollTo(0, 0);

        // Check for hash and scroll if needed
        if (window.location.hash) {
            const element = document.querySelector(window.location.hash);
            if (element) {
                element.scrollIntoView({ behavior: 'smooth' });
            }
        }
    }, []);

    return (
        <div className="home-page">
            <Suspense fallback={null}>
                <ScrollCameraExperience scrollProgress={cameraProgress} />
            </Suspense>

            <aside className={`studio-companion ${showCompanionIntro ? 'intro-active' : ''} ${isCompanionOpen ? 'is-open' : ''} ${isCompanionFlyingAway ? 'is-flying-away' : ''} ${isBookingOpen ? 'is-hidden' : ''}`} aria-label="Studio page companion">
                {showCompanionIntro && (
                    <div className="companion-intro" role="status">
                        <button className="companion-close" type="button" onClick={dismissCompanionIntro} aria-label="Dismiss studio intro">
                            <X size={16} aria-hidden="true" />
                        </button>
                        <div className="companion-intro-camera" aria-hidden="true">
                            <div className="companion-camera-body">
                                <div className="companion-camera-lens"></div>
                                <div className="companion-camera-flash"></div>
                            </div>
                        </div>
                        <div>
                            <span className="companion-eyebrow">Self-booth mode</span>
                            <h2>Camera is ready.</h2>
                            <p>Scroll through the studio story, then book when your package feels right.</p>
                        </div>
                        <div className="companion-intro-actions">
                            <button className="btn btn-primary" type="button" onClick={() => { dismissCompanionIntro(); openBooking(); }}>
                                Book now
                            </button>
                            <button className="btn btn-secondary" type="button" onClick={dismissCompanionIntro}>
                                Explore first
                            </button>
                        </div>
                    </div>
                )}

                <button
                    className="companion-orb"
                    type="button"
                    onClick={() => setIsCompanionOpen(prev => !prev)}
                    aria-expanded={isCompanionOpen}
                    aria-label="Toggle studio companion"
                    style={{ '--progress': scrollProgress } as React.CSSProperties}
                >
                    <span className="companion-progress-ring" aria-hidden="true"></span>
                    <span className="companion-mini-camera" aria-hidden="true">
                        <Aperture size={24} />
                    </span>
                </button>

                <div className="companion-panel">
                    <span className="companion-eyebrow">Now viewing</span>
                    <strong>{activeCompanionSection}</strong>
                    <div className="companion-progress">
                        <span style={{ width: `${Math.round(scrollProgress * 100)}%` }}></span>
                    </div>
                    <div className="companion-panel-actions">
                        <button type="button" onClick={() => openBooking()}>
                            <CalendarCheck size={16} aria-hidden="true" />
                            Book
                        </button>
                        <button type="button" onClick={scrollToNextCompanionSection}>
                            <ChevronDown size={16} aria-hidden="true" />
                            Next
                        </button>
                    </div>
                </div>
            </aside>

            {/* Hero Section */}
            <section id="home" className="hero" ref={heroRef} onMouseMove={handleHeroMouseMove}>
                <div className="hero-background"></div>
                <div className="hero-motion-bg" aria-hidden="true">
                    <div className="studio-atmosphere">
                        <div className="aperture-halo">
                            <span></span>
                            <span></span>
                            <span></span>
                            <span></span>
                            <span></span>
                            <span></span>
                        </div>
                        <div className="light-leak light-leak-left"></div>
                        <div className="light-leak light-leak-right"></div>
                        <div className="focus-scan-line"></div>
                    </div>
                    <div className="film-ribbon film-ribbon-one"></div>
                    <div className="film-ribbon film-ribbon-two"></div>
                    <div className="studio-light-beam"></div>
                    <div className="shutter-ring shutter-ring-one"></div>
                    <div className="shutter-ring shutter-ring-two"></div>
                </div>

                {/* Interactive Camera Interface */}
                <div className="camera-interface">
                    <div className="camera-grid"></div>
                    <div className="focus-rect">
                        <div className="focus-corner top-left"></div>
                        <div className="focus-corner top-right"></div>
                        <div className="focus-corner bottom-left"></div>
                        <div className="focus-corner bottom-right"></div>
                    </div>
                    <div className="camera-data top-left">ISO <span>800</span></div>
                    <div className="camera-data top-right">RAW</div>
                    <div className="camera-data bottom-left"><span>ƒ</span>/2.8</div>
                    <div className="camera-data bottom-right">1/250</div>
                </div>

                <div className="hero-content">
                    <div className="parallax-content">
                        <div className="hero-copy">
                            <div className="hero-kicker">
                                <Sparkles size={18} aria-hidden="true" />
                                Premium self-photography studio
                            </div>
                            <h1 className="hero-title">
                                Book your private studio shoot in minutes.
                            </h1>
                            <p className="hero-description">
                                Choose your package, reserve your slot, and step into a studio built for portraits, duos, barkadas, and content days.
                            </p>
                            <div className="hero-buttons">
                                <button className="btn btn-primary btn-large hero-booking-button" onClick={() => openBooking()}>
                                    <CalendarCheck size={20} aria-hidden="true" />
                                    Book Session
                                </button>
                                <Link to="/gallery" className="btn btn-secondary btn-large">
                                    <Images size={20} aria-hidden="true" />
                                    View Gallery
                                </Link>
                            </div>
                            <div className="hero-proof-row" aria-label="Studio booking highlights">
                                <div>
                                    <strong>₱299+</strong>
                                    <span>starter sessions</span>
                                </div>
                                <div>
                                    <strong>15 min+</strong>
                                    <span>shoot options</span>
                                </div>
                                <div>
                                    <strong>GCash</strong>
                                    <span>downpayment</span>
                                </div>
                            </div>
                        </div>

                        <div className="webgl-demo-stage" aria-label="Animated camera booking preview">
                            <button className="webgl-booking-card" type="button" onClick={() => openBooking()}>
                                <span className="booking-card-label">Self-shoot booking</span>
                                <strong>Book your slot, settle your downpayment, and arrive camera-ready.</strong>
                                <span className="webgl-booking-link">Start booking</span>
                            </button>
                        </div>
                    </div>
                </div>
                <div className="scroll-indicator">
                    <span>Scroll to explore</span>
                    <div className="scroll-arrow"></div>
                </div>
            </section>

            {/* Gallery Preview Section */}
            <section id="gallery" className="gallery-section">
                <div className="container">
                    <div className="section-header">
                        <h2 className="section-title">Featured Moments</h2>
                        <p className="section-subtitle">A glimpse into our studio sessions</p>
                    </div>

                    <div
                        className="gallery-carousel-container"
                        ref={carouselContainerRef}
                        onMouseDown={handleDragStart}
                        onMouseUp={handleDragEnd}
                        onMouseLeave={handleDragEnd}
                        onMouseMove={handleDragMove}
                        onTouchStart={handleDragStart}
                        onTouchEnd={handleDragEnd}
                        style={{ cursor: isDragging ? 'grabbing' : 'grab' }}
                    >
                        <div
                            className="gallery-track"
                            ref={trackRef}
                            style={{
                                transform: `translateX(${currentTranslate}px)`,
                                animation: 'none', // Override CSS animation
                                width: 'max-content',
                                display: 'flex',
                                gap: 'var(--spacing-md)'
                            }}
                        >
                            {/* Render items twice for infinite scroll effect */}
                            {[...dynamicGalleryItems, ...dynamicGalleryItems].map((item, index) => (
                                <div
                                    className="gallery-card"
                                    key={index}
                                    style={{
                                        '--gallery-lift': `${((index % 5) - 2) * 6}px`,
                                        '--gallery-tilt': `${index % 2 === 0 ? -0.8 : 0.8}deg`
                                    } as React.CSSProperties}
                                >
                                    <div className="gallery-card-inner">
                                        <div className="gallery-card-chrome" aria-hidden="true">
                                            <span></span>
                                            <span></span>
                                            <span></span>
                                        </div>
                                        <LazyImage src={item.src} alt={item.title} wrapperClassName="gallery-card-image" />
                                        <div className="gallery-overlay">
                                            <div className="gallery-info">
                                                <div className="gallery-category">{item.category}</div>
                                                <div className="gallery-title">{item.title}</div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div style={{ textAlign: 'center', marginTop: 'var(--spacing-xl)' }}>
                        <Link to="/gallery" className="btn btn-primary btn-large">View Full Gallery</Link>
                    </div>
                </div>
            </section>

            <PromoSection />

            {/* Services Preview Section */}
            <section id="services" className="services-section">
                <div className="container">
                    <div className="section-header">
                        <h2 className="section-title">Our Packages</h2>
                        <p className="section-subtitle">Simple pricing for everyone</p>
                    </div>

                    <div className="services-grid">
                        {homeServices.map((service, index) => (
                            <div
                                key={service.id}
                                className={`service-card ${service.isBestSelling ? 'featured' : ''}`}
                                style={{ '--package-index': index } as React.CSSProperties}
                            >
                                <div className="package-glow" aria-hidden="true"></div>
                                <div className="package-card-top">
                                    <span className="package-number">0{index + 1}</span>
                                    {service.isBestSelling && <div className="featured-badge">Best Selling</div>}
                                </div>
                                <div className="service-icon">
                                    {renderServiceIcon(service, index)}
                                </div>
                                <h3 className="service-title">{service.title.replace(/ Package$/i, '')}</h3>
                                <p className="service-duration">
                                    <Clock size={15} aria-hidden="true" />
                                    {service.duration}
                                </p>
                                {service.price && service.price !== '0' && service.price !== '₱0' && (
                                    <div className="service-price">{service.price}</div>
                                )}
                                <p className="service-description">{service.description}</p>
                                <ul className="service-features">
                                    {(service.features || []).slice(0, 6).map((feature, featureIndex) => (
                                        <li key={featureIndex}>{feature}</li>
                                    ))}
                                </ul>
                                <button
                                    className={`btn ${service.isBestSelling ? 'btn-secondary' : 'btn-outline'}`}
                                    onClick={() => openBooking(service.id)}
                                >
                                    Book Now
                                    <ArrowRight size={16} aria-hidden="true" />
                                </button>
                            </div>
                        ))}
                    </div>

                    <div style={{ textAlign: 'center', marginTop: 'var(--spacing-xl)' }}>
                        <Link to="/services" className="btn btn-primary btn-large">See All Services</Link>
                    </div>
                </div>
            </section>

            {/* Testimonials Section */}
            <section id="testimonials" className="testimonials-section">
                <div className="container">
                    <div className="section-header">
                        <h2 className="section-title">Happy Faces</h2>
                        <p className="section-subtitle">Stories from our studio</p>
                    </div>

                    <div className="testimonials-grid">
                        {feedbacks.length > 0 ? (
                            feedbacks.map((feedback) => (
                                <div className="testimonial-card" key={feedback.id}>
                                    <div className="stars">{'★'.repeat(feedback.rating)}</div>
                                    <p className="testimonial-quote">{feedback.message}</p>
                                    <div className="testimonial-author">
                                        <div className="author-avatar">{feedback.name.charAt(0)}</div>
                                        <div className="author-info">
                                            <h4>{feedback.name}</h4>
                                            <span className="author-role">Verified Customer</span>
                                        </div>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="testimonial-card" style={{ gridColumn: '1 / -1', textAlign: 'center', display: 'block' }}>
                                <p className="testimonial-quote" style={{ fontStyle: 'normal' }}>Be the first to share your experience!</p>
                            </div>
                        )}
                    </div>

                    <div style={{ textAlign: 'center', marginTop: 'var(--spacing-xl)' }}>
                        <button className="btn btn-primary" onClick={() => setIsFeedbackOpen(true)}>Leave a Review</button>
                    </div>
                </div>
            </section>

            <FeedbackModal isOpen={isFeedbackOpen} onClose={() => setIsFeedbackOpen(false)} />

            {/* About Section */}
            <section id="about" className="about-section">
                <div className="container">
                    <div className="about-content">
                        <div className="about-image">
                            <div className="about-image-wrapper">
                                <LazyImage src={aboutContent.imageUrl} alt="it's ouR Studio Photography Studio" className="about-image-element" />
                                <div className="developing-badge">Developing Stories since 2024</div>
                            </div>
                        </div>
                        <div className="about-text">
                            <h2 className="section-title">{aboutContent.title}</h2>

                            <div className="about-signature">
                                "Capturing raw emotion in every frame."
                            </div>

                            <p className="about-description">
                                {aboutContent.description1}
                            </p>
                            <p className="about-description">
                                {aboutContent.description2}
                            </p>

                            <div className="film-strip-container">
                                <div className="film-holes top"></div>
                                <div className="about-features film-strip">
                                    <div className="about-feature frame">
                                        <div className="feature-icon">
                                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"></path><circle cx="12" cy="13" r="4"></circle></svg>
                                        </div>
                                        <div className="feature-text">
                                            <h4>Pro Gear</h4>
                                            <p>Top-tier equipment</p>
                                        </div>
                                    </div>
                                    <div className="about-feature frame">
                                        <div className="feature-icon">
                                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="13.5" cy="6.5" r=".5"></circle><circle cx="17.5" cy="10.5" r=".5"></circle><circle cx="8.5" cy="7.5" r=".5"></circle><circle cx="6.5" cy="12.5" r=".5"></circle><path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10c.926 0 1.648-.746 1.648-1.688 0-.437-.18-.835-.437-1.125-.29-.289-.438-.652-.438-1.125a1.64 1.64 0 0 1 1.668-1.668h1.996c3.051 0 5.555-2.503 5.555-5.554C21.965 6.012 17.461 2 12 2z"></path></svg>
                                        </div>
                                        <div className="feature-text">
                                            <h4>Creative</h4>
                                            <p>Limitless freedom</p>
                                        </div>
                                    </div>
                                    <div className="about-feature frame">
                                        <div className="feature-icon">
                                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>
                                        </div>
                                        <div className="feature-text">
                                            <h4>Private</h4>
                                            <p>Your own space</p>
                                        </div>
                                    </div>
                                </div>
                                <div className="film-holes bottom"></div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            <BackdropVisualizer />

            {/* Camera Vanish Flash Overlay */}
            <div className={`camera-vanish-flash ${cameraProgress > 0.85 ? 'is-active' : ''}`} aria-hidden="true"></div>

            {/* Ready to Shoot CTA Section */}
            <section className="cta-section">
                <div className="cta-background">
                    <div className="cta-Aurora-1"></div>
                    <div className="cta-Aurora-2"></div>
                </div>
                <div className="container">
                    <div className="cta-content">
                        <h2 className="cta-title">Ready to Capture Your Story?</h2>
                        <p className="cta-subtitle">Book your session today and create timeless memories with us.</p>
                        <div className="cta-buttons">
                            <button className="btn btn-secondary btn-large" onClick={() => openBooking()}>Book Now</button>
                            <Link to="/services" className="btn btn-outline-light btn-large">View Packages</Link>
                        </div>
                    </div>
                </div>
            </section>

            {/* Contact Section */}
            <section id="contact" className="contact-section">
                <div className="container">
                    <div className="section-header">
                        <h2 className="section-title">Get in Touch</h2>
                        <p className="section-subtitle">We'd love to hear from you</p>
                    </div>

                    <div className={`bottom-booking-reveal ${showBottomBookingReveal ? 'is-visible' : ''}`} aria-live="polite">
                        <div className="bottom-booking-copy">
                            <span className="companion-eyebrow">Final frame</span>
                            <h3>Ready for your session?</h3>
                            <p>Pick your package, reserve your time, and step into the studio when you're ready.</p>
                        </div>
                        <button className="btn btn-primary" type="button" onClick={() => openBooking()}>
                            <CalendarCheck size={18} aria-hidden="true" />
                            Book Session
                        </button>
                    </div>

                    <div className="contact-container">
                        <div className="contact-form-wrapper">
                            {contactSuccess ? (
                                <div className="contact-success" style={{
                                    backgroundColor: '#ecfdf5',
                                    border: '1px solid #10b981',
                                    borderRadius: '12px',
                                    padding: '2rem',
                                    textAlign: 'center'
                                }}>
                                    <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>✅</div>
                                    <h3 style={{ color: '#065f46', marginBottom: '0.5rem' }}>Message Sent!</h3>
                                    <p style={{ color: '#047857' }}>We'll get back to you as soon as possible.</p>
                                </div>
                            ) : (
                                <form className="contact-form" onSubmit={handleContactSubmit}>
                                    <div className="form-group">
                                        <label htmlFor="contactName">Name</label>
                                        <input
                                            type="text"
                                            id="contactName"
                                            name="name"
                                            value={contactForm.name}
                                            onChange={handleContactChange}
                                            placeholder="Your Name"
                                            required
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label htmlFor="contactEmail">Email</label>
                                        <input
                                            type="email"
                                            id="contactEmail"
                                            name="email"
                                            value={contactForm.email}
                                            onChange={handleContactChange}
                                            placeholder="your@email.com"
                                            required
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label htmlFor="contactMessage">Message</label>
                                        <textarea
                                            id="contactMessage"
                                            name="message"
                                            value={contactForm.message}
                                            onChange={handleContactChange}
                                            rows={5}
                                            placeholder="How can we help you?"
                                            required
                                        ></textarea>
                                    </div>
                                    <button
                                        type="submit"
                                        className="btn btn-primary"
                                        disabled={contactSubmitting}
                                    >
                                        {contactSubmitting ? 'Sending...' : 'Send Message'}
                                    </button>
                                </form>
                            )}
                        </div>

                        <div className="contact-info-wrapper">
                            <div className="info-card">
                                <h3>Studio Location</h3>
                                <div className="info-item">
                                    <span className="info-icon">
                                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg>
                                    </span>
                                    <p>FJ Center 15 Tongco Street, Maysan<br />Valenzuela City, Metro Manila, PH</p>
                                </div>
                                <div className="info-item">
                                    <span className="info-icon">
                                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path></svg>
                                    </span>
                                    <p>+63 905 336 7103</p>
                                </div>
                                <div className="info-item">
                                    <span className="info-icon">
                                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path><polyline points="22,6 12,13 2,6"></polyline></svg>
                                    </span>
                                    <p>itsourstudio1@gmail.com</p>
                                </div>
                                <div className="info-item">
                                    <span className="info-icon">
                                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
                                    </span>
                                    <p>Mon - Sun: 10:00 AM - 9:00 PM</p>
                                </div>

                                <div className="social-links-container">
                                    <h4>Follow Us</h4>
                                    <div className="social-links">
                                        <a href="https://www.facebook.com/itsouRstudioo/" target="_blank" rel="noopener noreferrer" className="social-link">Facebook</a>
                                        <a href="https://www.instagram.com/its_our_studio/" target="_blank" rel="noopener noreferrer" className="social-link">Instagram</a>
                                        <a href="https://www.tiktok.com/@itsourstudio" target="_blank" rel="noopener noreferrer" className="social-link">TikTok</a>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

        </div>
    );
};

export default Home;
