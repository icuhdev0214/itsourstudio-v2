import { useBooking } from '../context/BookingContext';
import { useServices, peso } from '../nocturne/useStudioData';

/**
 * Nocturne services — one full-width row per package, alternating which side
 * the three-shot collage sits on, with every other row on a shaded ground.
 */

const NocturneServices = () => {
    const { openBooking } = useBooking();
    const { services, loading } = useServices();

    return (
        <section className="nx-services">
            <div className="nx-shell">
                <div className="nx-eyebrow">Services</div>
                <h1>
                    {services.length === 7 ? 'Seven ways to shoot' : `${services.length} ways to shoot`}
                </h1>

                {loading && !services.length ? (
                    <div className="nx-empty">Loading packages…</div>
                ) : (
                    <div className="nx-service-rows">
                        {services.map((service, index) => (
                            <article
                                key={service.id}
                                className={[
                                    'nx-service-row',
                                    index % 2 === 0 ? 'is-shaded' : '',
                                    index % 2 === 0 ? '' : 'is-flipped',
                                ]
                                    .filter(Boolean)
                                    .join(' ')}
                            >
                                <div className="nx-service-info">
                                    {service.isBestSelling && (
                                        <div>
                                            <span className="nx-badge">Best selling</span>
                                        </div>
                                    )}
                                    <h2 className="nx-service-title">{service.title}</h2>
                                    <div className="nx-service-pricing">
                                        <div className="nx-service-price">{peso(service.price)}</div>
                                        <div className="nx-service-duration">{service.duration}</div>
                                    </div>
                                    <p className="nx-service-desc">{service.description}</p>

                                    <div className="nx-service-features">
                                        {service.features.map((feature, i) => (
                                            <span className="nx-chip" key={`${feature}-${i}`}>
                                                {feature}
                                            </span>
                                        ))}
                                    </div>

                                    <button
                                        type="button"
                                        data-target
                                        className="nx-pill"
                                        onClick={() => openBooking(service.id)}
                                    >
                                        Book This Package
                                    </button>
                                </div>

                                <div className="nx-service-media">
                                    <div
                                        className="nx-service-shot nx-service-shot-main lighten"
                                        style={{ backgroundImage: `url("${service.imageMain}")` }}
                                        role="img"
                                        aria-label={`${service.title} main shot`}
                                    />
                                    <div
                                        className="nx-service-shot lighten"
                                        style={{ backgroundImage: `url("${service.imageDetail}")` }}
                                        role="img"
                                        aria-label={`${service.title} detail shot`}
                                    />
                                    <div
                                        className="nx-service-shot lighten"
                                        style={{ backgroundImage: `url("${service.imageAction}")` }}
                                        role="img"
                                        aria-label={`${service.title} action shot`}
                                    />
                                </div>
                            </article>
                        ))}
                    </div>
                )}
            </div>
        </section>
    );
};

export default NocturneServices;
