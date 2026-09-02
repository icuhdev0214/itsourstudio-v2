import { useEffect, useMemo, useRef } from 'react';

/**
 * The gallery's drifting photo wall — five columns scrolling at alternating
 * speeds on a tilted 3D plane that leans toward the pointer.
 *
 * Ported from `setupDrift()` in the Nocturne design source; the tilt, turn,
 * depth, parallax and per-column speed formula are the design's values.
 *
 * When `animated` is false (reduced motion, coarse pointer, or a device that
 * would struggle with a 70-layer 3D scene) this falls back to a plain
 * responsive grid of the same tiles, which stays fully clickable.
 */

export interface DriftImage {
    src: string;
    alt: string;
}

/** Plane orientation, in degrees / px. */
const TILT = 16;
const TURN = -14;
const DEPTH = 120;
/** Pointer lean, scaled to a maximum of PARALLAX * 8 degrees. */
const PARALLAX = 0.6;
const COLUMNS = 5;
/** Tiles per half-track. The track holds two copies so it can wrap seamlessly. */
const TILES_PER_HALF = 7;

const planeTransform = (dx: number, dy: number) =>
    `translate(-50%,-50%) scale(1.18) rotateX(${TILT + dy}deg) rotateY(${TURN + dx}deg) translateZ(${-DEPTH}px)`;

interface DriftWallProps {
    images: DriftImage[];
    onOpen: (index: number) => void;
    animated: boolean;
}

const DriftWall = ({ images, onOpen, animated }: DriftWallProps) => {
    const hostRef = useRef<HTMLDivElement>(null);
    const offsetsRef = useRef<Record<string, number>>({});

    /* Deal the images across five columns, then pad each column up to a full
       half-track and duplicate it, so every column can wrap without a seam
       even when the filter leaves only a couple of photos. */
    const columns = useMemo(() => {
        if (!images.length) return [];

        return Array.from({ length: COLUMNS }, (_, col) => {
            const mine = images
                .map((image, index) => ({ image, index }))
                .filter((entry) => entry.index % COLUMNS === col);
            const pool = mine.length ? mine : [{ image: images[0], index: 0 }];

            const half: typeof pool = [];
            while (half.length < TILES_PER_HALF) {
                for (const entry of pool) {
                    if (half.length < TILES_PER_HALF) half.push(entry);
                }
            }

            const speed =
                42 *
                (1 + 0.45 * ((((col * 0.618 + 0.35) % 1) * 2) - 1)) *
                (col % 2 === 0 ? 1 : -1);

            return { speed, tiles: half.concat(half) };
        });
    }, [images]);

    useEffect(() => {
        if (!animated) return;
        const host = hostRef.current;
        if (!host) return;

        let raf = 0;
        let targetX = 0;
        let targetY = 0;
        let driftX = 0;
        let driftY = 0;
        let last: number | null = null;

        const onPointerMove = (e: PointerEvent) => {
            const rect = host.getBoundingClientRect();
            const inside =
                e.clientX >= rect.left &&
                e.clientX <= rect.right &&
                e.clientY >= rect.top &&
                e.clientY <= rect.bottom;

            if (!inside) {
                targetX = 0;
                targetY = 0;
                return;
            }

            targetX = (e.clientX - rect.left) / rect.width - 0.5;
            targetY = (e.clientY - rect.top) / rect.height - 0.5;
        };

        const tick = (ts: number) => {
            raf = requestAnimationFrame(tick);
            if (last === null) last = ts;
            const dt = Math.min(0.05, Math.max(0, ts - last) / 1000);
            last = ts;

            const maxTilt = PARALLAX * 8;
            const damp = 1 - Math.exp(-dt / 0.12);
            driftX += (targetX * maxTilt - driftX) * damp;
            driftY += (-targetY * maxTilt - driftY) * damp;

            const plane = host.querySelector<HTMLElement>('[data-plane]');
            if (plane) plane.style.transform = planeTransform(driftX, driftY);

            host.querySelectorAll<HTMLElement>('[data-track]').forEach((track, c) => {
                const v = parseFloat(track.getAttribute('data-track') || '0') || 0;
                const span = track.scrollHeight / 2 || 1;
                const key = `c${c}`;
                let offset = offsetsRef.current[key];
                // Seed each column at a different phase so they never line up.
                if (offset == null) offset = offsetsRef.current[key] = span * ((c * 0.37) % 1);
                offset = (((offset + v * dt) % span) + span) % span;
                offsetsRef.current[key] = offset;
                track.style.transform = `translate3d(0,${-offset}px,0)`;
            });
        };

        const seed = host.querySelector<HTMLElement>('[data-plane]');
        if (seed) seed.style.transform = planeTransform(0, 0);

        window.addEventListener('pointermove', onPointerMove);
        raf = requestAnimationFrame(tick);

        return () => {
            cancelAnimationFrame(raf);
            window.removeEventListener('pointermove', onPointerMove);
        };
    }, [animated, columns]);

    if (!images.length) return null;

    if (!animated) {
        return (
            <div className="nx-grid-wall">
                {images.map((image, index) => (
                    <button
                        key={`${image.src}-${index}`}
                        type="button"
                        className="nx-grid-tile"
                        style={{ backgroundImage: `url("${image.src}")` }}
                        onClick={() => onOpen(index)}
                        aria-label={`View ${image.alt}`}
                    />
                ))}
            </div>
        );
    }

    return (
        <div className="nx-drift" ref={hostRef}>
            <div className="nx-drift-plane" data-plane>
                {columns.map((column, col) => (
                    <div className="nx-drift-col" key={col}>
                        <div className="nx-drift-track" data-track={column.speed}>
                            {column.tiles.map((entry, t) => (
                                <div className="nx-drift-cell" key={`${entry.index}-${t}`}>
                                    <button
                                        type="button"
                                        className="nx-drift-tile"
                                        style={{ backgroundImage: `url("${entry.image.src}")` }}
                                        onClick={() => onOpen(entry.index)}
                                        // The track is duplicated, so only the
                                        // first copy is exposed to assistive tech.
                                        aria-hidden={t >= TILES_PER_HALF}
                                        tabIndex={t >= TILES_PER_HALF ? -1 : 0}
                                        aria-label={`View ${entry.image.alt}`}
                                    />
                                </div>
                            ))}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default DriftWall;
