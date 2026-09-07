import { useEffect, useRef } from 'react';

/**
 * The fanned photo stack in the hero, which springs into place on mount and
 * parts around whichever card the pointer is over.
 *
 * Ported from `setupBounce()` in the Nocturne design source. The rest layout,
 * spring curve, push distance and stagger are the design's values.
 */

/** Resting [rotation deg, x offset px] per card, centre card first at index 2. */
const REST: [number, number][] = [
    [5, -150],
    [0, -70],
    [-5, 0],
    [5, 70],
    [-5, 150],
];

/** How far the neighbours slide away from a hovered card. */
const PUSH = 34;
/** Per-card entrance delay, measured out from the centre card. */
const STAGGER = 0.08;
/** Beat before the stack springs in, so it lands after the hero copy. */
const ENTRANCE_DELAY = 1;

interface HeroCardStackProps {
    images: string[];
    /** Hint copy under the stack; hidden when the pointer is coarse. */
    hint?: string;
}

const HeroCardStack = ({ images, hint = 'hover the stack' }: HeroCardStackProps) => {
    const hostRef = useRef<HTMLDivElement>(null);
    const enteredRef = useRef(false);

    useEffect(() => {
        const host = hostRef.current;
        if (!host) return;

        const cards = Array.from(host.querySelectorAll<HTMLElement>('[data-bc]'));
        if (!cards.length) return;

        const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

        /* The stack is authored for a ~500px column. Narrower columns scale the
           spread down rather than letting the cards overflow. */
        const scaleK = () => {
            const avail = host.getBoundingClientRect().width || 500;
            return Math.min(1, Math.max(0.42, (avail - 200) / 340));
        };

        const apply = (hover: number | null) => {
            const k = scaleK();
            cards.forEach((card, i) => {
                const [rot, restX] = REST[i] || [0, 0];
                let x = restX * k;
                let scale = 1;

                if (hover != null) {
                    if (i === hover) scale = 1.06;
                    else x += (i < hover ? -PUSH : PUSH) * k;
                }

                card.style.zIndex = String(hover === i ? 20 : 10 - Math.abs(i - 2));
                card.style.transitionDelay = '0s';
                card.style.transform = `rotate(${rot}deg) translate(${x}px) scale(${scale})`;
            });
        };

        if (!enteredRef.current && !reduced) {
            const k = scaleK();
            cards.forEach((card, i) => {
                card.style.transition = 'none';
                card.style.opacity = '0';
                card.style.transform = 'rotate(0deg) translate(0px) scale(.86)';
                // Force a reflow so the from-state is committed before the
                // transition is reattached, or the browser coalesces both.
                void card.offsetWidth;
                card.style.transition =
                    'transform .95s cubic-bezier(.17,1.62,.38,.97), opacity .5s ease';
                card.style.transitionDelay = `${ENTRANCE_DELAY + Math.abs(i - 2) * STAGGER}s`;
                card.style.opacity = '1';
                card.style.zIndex = String(10 - Math.abs(i - 2));
                const [rot, restX] = REST[i] || [0, 0];
                card.style.transform = `rotate(${rot}deg) translate(${restX * k}px) scale(1)`;
            });
            enteredRef.current = true;
        } else {
            cards.forEach((card) => {
                card.style.opacity = '1';
                card.style.transition = reduced
                    ? 'none'
                    : 'transform .8s cubic-bezier(.17,1.62,.38,.97)';
            });
            apply(null);
        }

        const onResize = () => apply(null);
        const onPointerOver = (e: PointerEvent) => {
            const card = e.target instanceof Element ? e.target.closest('[data-bc]') : null;
            const idx = card ? cards.indexOf(card as HTMLElement) : -1;
            apply(idx >= 0 ? idx : null);
        };
        const onPointerLeave = () => apply(null);

        window.addEventListener('resize', onResize);
        window.addEventListener('pointerover', onPointerOver);
        window.addEventListener('pointerleave', onPointerLeave);

        return () => {
            window.removeEventListener('resize', onResize);
            window.removeEventListener('pointerover', onPointerOver);
            window.removeEventListener('pointerleave', onPointerLeave);
        };
    }, [images]);

    return (
        <div className="nx-stack" ref={hostRef}>
            {images.map((src, i) => (
                <div
                    key={`${src}-${i}`}
                    data-bc
                    className="nx-stack-card"
                    style={{ backgroundImage: `url("${src}")` }}
                    aria-hidden="true"
                />
            ))}
            {hint && <div className="nx-stack-hint">{hint}</div>}
        </div>
    );
};

export default HeroCardStack;
