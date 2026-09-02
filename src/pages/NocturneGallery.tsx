import { useEffect, useMemo, useState } from 'react';
import DriftWall from '../nocturne/DriftWall';
import { useEffectsEnabled } from '../nocturne/useEffectsEnabled';
import { useGallery } from '../nocturne/useStudioData';

/**
 * Nocturne gallery — the drifting 3D photo wall with a filter row and a
 * lightbox. Falls back to a flat grid where the 3D scene is inappropriate.
 */

const FILTERS = [
    { id: 'all', label: 'All Photos' },
    { id: 'solo', label: 'Solo' },
    { id: 'duo', label: 'Duo' },
    { id: 'group', label: 'Group' },
] as const;

const NocturneGallery = () => {
    const { images, loading } = useGallery();
    const effects = useEffectsEnabled();
    const [filter, setFilter] = useState<string>('all');
    const [lightbox, setLightbox] = useState(-1);

    const shown = useMemo(
        () => (filter === 'all' ? images : images.filter((image) => image.category === filter)),
        [images, filter],
    );

    const current = lightbox >= 0 ? shown[Math.min(lightbox, shown.length - 1)] : null;

    const step = (delta: number) => {
        if (!shown.length) return;
        setLightbox((index) => (index + delta + shown.length) % shown.length);
    };

    // Arrow keys and Escape drive the lightbox once it is open.
    useEffect(() => {
        if (!current) return;

        const onKey = (e: KeyboardEvent) => {
            if (e.key === 'Escape') setLightbox(-1);
            if (e.key === 'ArrowRight') step(1);
            if (e.key === 'ArrowLeft') step(-1);
        };

        document.addEventListener('keydown', onKey);
        document.body.style.overflow = 'hidden';
        return () => {
            document.removeEventListener('keydown', onKey);
            document.body.style.overflow = '';
        };
    }, [current, shown.length]);

    return (
        <>
            <section className="nx-page-head">
                <div className="nx-shell">
                    <div className="nx-eyebrow">Gallery</div>
                    <h1>Moments captured in our studio</h1>
                    <div className="nx-filters">
                        {FILTERS.map((entry) => (
                            <button
                                key={entry.id}
                                type="button"
                                data-target
                                className={`nx-filter${filter === entry.id ? ' is-active' : ''}`}
                                aria-pressed={filter === entry.id}
                                onClick={() => {
                                    setFilter(entry.id);
                                    setLightbox(-1);
                                }}
                            >
                                {entry.label}
                            </button>
                        ))}
                    </div>
                </div>
            </section>

            <section className="nx-drift-section">
                {loading ? (
                    <div className="nx-empty">Loading the wall…</div>
                ) : shown.length === 0 ? (
                    <div className="nx-empty">
                        <h3>No photos here yet</h3>
                        <p>
                            We haven&apos;t uploaded any {filter !== 'all' ? filter : ''} photos yet.
                            Check back soon, or book a session and be the first.
                        </p>
                    </div>
                ) : (
                    <DriftWall
                        images={shown}
                        onOpen={setLightbox}
                        // The wall runs 70 composited 3D layers against a rAF
                        // loop, so it rides the same gate as the shader layers.
                        animated={effects.waves}
                    />
                )}
            </section>

            {current && (
                <div
                    className="nx-lightbox"
                    role="dialog"
                    aria-modal="true"
                    aria-label={current.alt}
                    onClick={() => setLightbox(-1)}
                >
                    <button
                        type="button"
                        data-target
                        className="nx-lightbox-nav nx-lightbox-prev"
                        aria-label="Previous photo"
                        onClick={(e) => {
                            e.stopPropagation();
                            step(-1);
                        }}
                    >
                        ‹
                    </button>
                    <button
                        type="button"
                        data-target
                        className="nx-lightbox-nav nx-lightbox-next"
                        aria-label="Next photo"
                        onClick={(e) => {
                            e.stopPropagation();
                            step(1);
                        }}
                    >
                        ›
                    </button>
                    <button
                        type="button"
                        data-target
                        className="nx-lightbox-close"
                        aria-label="Close"
                        onClick={(e) => {
                            e.stopPropagation();
                            setLightbox(-1);
                        }}
                    >
                        ×
                    </button>

                    <figure className="nx-lightbox-figure" onClick={(e) => e.stopPropagation()}>
                        <div
                            className="nx-lightbox-image"
                            style={{ backgroundImage: `url("${current.src}")` }}
                            role="img"
                            aria-label={current.alt}
                        />
                        <figcaption className="nx-lightbox-caption">
                            {current.alt} ({Math.min(lightbox, shown.length - 1) + 1} / {shown.length})
                        </figcaption>
                    </figure>
                </div>
            )}
        </>
    );
};

export default NocturneGallery;
