import { useNavigate } from 'react-router-dom';
import { useBooking } from '../context/BookingContext';
import GradientWaves from '../nocturne/GradientWaves';
import HeroCardStack from '../nocturne/HeroCardStack';
import { useEffectsEnabled } from '../nocturne/useEffectsEnabled';
import { useAbout, useServices, peso } from '../nocturne/useStudioData';

/**
 * Nocturne home page — hero over the shader wave field, the studio collage,
 * the three most-booked packages, and the visit band.
 */

const HERO_STACK = [
    '/gallery/duo1.webp',
    '/gallery/solo1.webp',
    '/gallery/group1.webp',
    '/gallery/solo3.webp',
    '/gallery/duo3.webp',
];

const ABOUT_CARDS = [
    { title: 'Props & wardrobe', body: 'Free with Basic and up.' },
    { title: 'Raw soft copies', body: 'Sent after your session.' },
    { title: 'Prints on the spot', body: 'Strips, 4R and A5 by package.' },
    { title: 'Extend anytime', body: '+15 to +60 minutes, ₱150 each.' },
];

const SOCIALS = [
    { label: 'Instagram', href: 'https://www.instagram.com/its_our_studio/' },
    { label: 'Facebook', href: 'https://www.facebook.com/itsouRstudioo/' },
    { label: 'TikTok', href: 'https://www.tiktok.com/@itsourstudio' },
];

const NocturneHome = () => {
    const navigate = useNavigate();
    const { openBooking } = useBooking();
    const effects = useEffectsEnabled();
    const { services } = useServices();
    const about = useAbout();

    /* "Three most booked": whatever the admin flags best-selling leads, then
       the catalogue order fills the row. */
    const featured = [...services]
        .sort((a, b) => Number(!!b.isBestSelling) - Number(!!a.isBestSelling))
        .slice(0, 3);

    const startingPrice = services.reduce((min, service) => {
        const value = Number(String(service.price).replace(/[^\d.]/g, ''));
        return Number.isFinite(value) && value > 0 ? Math.min(min, value) : min;
    }, Number.POSITIVE_INFINITY);

    return (
        <>
            <section className="nx-hero">
                <div className={`nx-hero-waves${effects.waves ? '' : ' is-fallback'}`}>
                    {effects.waves && <GradientWaves className="nx-waves-layer" />}
                </div>

                <div className="nx-hero-inner">
                    <div>
                        <div className="nx-hero-badge">Self-photo studio · Valenzuela City</div>
                        <h1>Empowering you to capture your authentic self</h1>
                        <p className="nx-hero-lede">
                            Seven packages from a fifteen-minute solo sitting to a fifty-minute
                            barkada takeover. Book a slot, pick a backdrop, and hold the remote
                            yourself.
                        </p>

                        <div className="nx-hero-actions">
                            <button
                                type="button"
                                data-target
                                className="nx-pill nx-pill-lg"
                                onClick={() => openBooking()}
                            >
                                Book a session
                            </button>
                            <button
                                type="button"
                                data-target
                                className="nx-pill nx-pill-lg nx-pill-quiet"
                                onClick={() => navigate('/services')}
                            >
                                See packages
                            </button>
                        </div>

                        <div className="nx-hero-stats">
                            <div>
                                <div className="nx-hero-stat-value">
                                    {Number.isFinite(startingPrice) ? peso(startingPrice) : '₱299'}
                                </div>
                                <div className="nx-hero-stat-label">starting price</div>
                            </div>
                            <div>
                                <div className="nx-hero-stat-value">{services.length}</div>
                                <div className="nx-hero-stat-label">packages</div>
                            </div>
                            <div>
                                <div className="nx-hero-stat-value">50%</div>
                                <div className="nx-hero-stat-label">downpayment to reserve</div>
                            </div>
                        </div>
                    </div>

                    <HeroCardStack
                        images={HERO_STACK}
                        hint={effects.cursor ? 'hover the stack' : ''}
                    />
                </div>
            </section>

            <section className="nx-about" id="about">
                <div className="nx-about-inner">
                    <div className="nx-collage">
                        <div className="nx-collage-img nx-collage-1 lighten">
                            <img src={about.image1} alt="Inside the studio" />
                        </div>
                        <div className="nx-collage-img nx-collage-2 lighten">
                            <img src={about.image2} alt="Studio detail" />
                        </div>
                        <div className="nx-collage-img nx-collage-3 lighten">
                            <img src={about.image3} alt="Studio corner" />
                        </div>
                        <div className="nx-collage-seal" aria-hidden="true">
                            no photographer
                            <br />
                            needed
                        </div>
                    </div>

                    <div>
                        <div className="nx-eyebrow">About</div>
                        <h2>{about.title}</h2>
                        <p className="nx-about-lede">{about.body}</p>
                        <div className="nx-about-grid">
                            {ABOUT_CARDS.map((card) => (
                                <div className="nx-about-card" key={card.title}>
                                    <div className="nx-about-card-title">{card.title}</div>
                                    <div className="nx-about-card-body">{card.body}</div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </section>

            <section className="nx-packages" id="services">
                <div className="nx-shell">
                    <div className="nx-section-head">
                        <div>
                            <div className="nx-eyebrow">Packages</div>
                            <h2>Three most booked</h2>
                        </div>
                        <button
                            type="button"
                            data-target
                            className="nx-section-link"
                            onClick={() => navigate('/services')}
                        >
                            All {services.length} packages →
                        </button>
                    </div>

                    <div className="nx-package-grid">
                        {featured.map((service) => (
                            <article className="nx-package-card" key={service.id}>
                                <div
                                    className="nx-package-media lighten"
                                    style={{ backgroundImage: `url("${service.imageMain}")` }}
                                >
                                    {service.isBestSelling && (
                                        <span className="nx-badge">Best selling</span>
                                    )}
                                </div>
                                <div className="nx-package-body">
                                    <div className="nx-package-title">{service.title}</div>
                                    <div className="nx-package-duration">{service.duration}</div>
                                    <div className="nx-package-price">{peso(service.price)}</div>
                                    <div className="nx-package-desc">{service.description}</div>
                                    <button
                                        type="button"
                                        data-target
                                        className="nx-package-cta"
                                        onClick={() => openBooking(service.id)}
                                    >
                                        Book this package →
                                    </button>
                                </div>
                            </article>
                        ))}
                    </div>
                </div>
            </section>

            <section className="nx-visit" id="contact">
                <div className="nx-visit-inner">
                    <div>
                        <div className="nx-eyebrow">Visit</div>
                        <h2>FJ Center, Maysan</h2>
                        <div className="nx-visit-details">
                            <div>
                                FJ Center 15 Tongco Maysan
                                <br />
                                Valenzuela City
                            </div>
                            <div>
                                <a href="mailto:itsourstudio1@gmail.com">itsourstudio1@gmail.com</a>
                            </div>
                            <div className="nx-visit-social">
                                {SOCIALS.map((social) => (
                                    <a
                                        key={social.label}
                                        href={social.href}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                    >
                                        {social.label}
                                    </a>
                                ))}
                            </div>
                        </div>
                        <button
                            type="button"
                            data-target
                            className="nx-pill"
                            style={{ marginTop: 26 }}
                            onClick={() => openBooking()}
                        >
                            Book Now
                        </button>
                    </div>

                    <div className="nx-visit-media lighten">
                        <img src="/about-studio.jpg" alt="The studio" />
                    </div>
                </div>
            </section>
        </>
    );
};

export default NocturneHome;
