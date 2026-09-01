import { useEffect, useState } from 'react';

/**
 * Capability + preference gate for the Nocturne WebGL layers.
 *
 * The design ships two shader effects. Neither is load-bearing: the hero
 * falls back to a CSS gradient and the pointer falls back to the native
 * cursor, so every branch here is safe to resolve to `false`.
 *
 * Resolved on the client only, and re-resolved when the visitor changes
 * their motion preference or plugs in a mouse.
 */

const REDUCED_MOTION = '(prefers-reduced-motion: reduce)';
const FINE_POINTER = '(hover: hover) and (pointer: fine)';

/** WebGL2 probe. Cached — creating throwaway contexts is not free, and a
 *  browser that lacks WebGL2 will not grow it mid-session. */
let webglSupport: boolean | null = null;
const supportsWebGL = (): boolean => {
    if (webglSupport !== null) return webglSupport;
    try {
        const canvas = document.createElement('canvas');
        webglSupport = !!canvas.getContext('webgl2');
    } catch {
        webglSupport = false;
    }
    return webglSupport;
};

/** Coarse low-power heuristic. `deviceMemory` is Chromium-only, so absence
 *  is treated as "fine" rather than "weak" — we only bail on a device that
 *  actively reports being small. */
const isLowPowerDevice = (): boolean => {
    const nav = navigator as Navigator & { deviceMemory?: number };
    if (typeof nav.deviceMemory === 'number' && nav.deviceMemory > 0 && nav.deviceMemory <= 4) return true;
    if (typeof nav.hardwareConcurrency === 'number' && nav.hardwareConcurrency > 0 && nav.hardwareConcurrency <= 2) return true;
    return false;
};

export interface NocturneEffects {
    /** Animated shader background behind the hero. */
    waves: boolean;
    /** Trailing glow cursor + the square target reticle that tracks it. */
    cursor: boolean;
}

const OFF: NocturneEffects = { waves: false, cursor: false };

export const useEffectsEnabled = (): NocturneEffects => {
    // Start disabled so server-rendered / first-paint output is the static
    // fallback, then upgrade once we know what the device can do.
    const [effects, setEffects] = useState<NocturneEffects>(OFF);

    useEffect(() => {
        if (typeof window === 'undefined' || !window.matchMedia) return;

        const motion = window.matchMedia(REDUCED_MOTION);
        const pointer = window.matchMedia(FINE_POINTER);

        const resolve = () => {
            if (motion.matches || !supportsWebGL() || isLowPowerDevice()) {
                setEffects(OFF);
                return;
            }
            setEffects({
                waves: true,
                // A custom cursor hides the native one, so it is only ever
                // appropriate where there is a real pointer to replace.
                cursor: pointer.matches,
            });
        };

        resolve();
        motion.addEventListener('change', resolve);
        pointer.addEventListener('change', resolve);
        return () => {
            motion.removeEventListener('change', resolve);
            pointer.removeEventListener('change', resolve);
        };
    }, []);

    return effects;
};
