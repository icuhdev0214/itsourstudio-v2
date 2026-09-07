import { useEffect, useRef } from 'react';

/**
 * The square bracket reticle that eases onto any `[data-target]` element the
 * pointer is over, and shrinks to a small box otherwise.
 *
 * Ported from `setupTarget()` in the Nocturne design source. Purely decorative
 * and pointer-events-none; it reads the DOM but never captures input.
 */
const TargetReticle = () => {
    const boxRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const box = boxRef.current;
        if (!box) return;

        let cur = { x: -100, y: -100, w: 26, h: 26 };
        let tgt = { ...cur };
        let active = false;
        let raf = 0;

        const onPointerMove = (e: PointerEvent) => {
            const el =
                e.target instanceof Element ? e.target.closest('[data-target]') : null;
            if (el) {
                const r = el.getBoundingClientRect();
                tgt = { x: r.left - 7, y: r.top - 7, w: r.width + 14, h: r.height + 14 };
                active = true;
            } else {
                tgt = { x: e.clientX - 13, y: e.clientY - 13, w: 26, h: 26 };
                active = false;
            }
            box.style.opacity = '1';
        };

        const tick = () => {
            const k = active ? 0.26 : 0.34;
            cur.x += (tgt.x - cur.x) * k;
            cur.y += (tgt.y - cur.y) * k;
            cur.w += (tgt.w - cur.w) * k;
            cur.h += (tgt.h - cur.h) * k;
            box.style.transform = `translate(${cur.x}px,${cur.y}px)`;
            box.style.width = `${cur.w}px`;
            box.style.height = `${cur.h}px`;
            raf = requestAnimationFrame(tick);
        };

        window.addEventListener('pointermove', onPointerMove);
        raf = requestAnimationFrame(tick);

        return () => {
            cancelAnimationFrame(raf);
            window.removeEventListener('pointermove', onPointerMove);
        };
    }, []);

    return (
        <div ref={boxRef} className="nocturne-reticle" aria-hidden="true">
            <i className="tl" />
            <i className="tr" />
            <i className="bl" />
            <i className="br" />
        </div>
    );
};

export default TargetReticle;
