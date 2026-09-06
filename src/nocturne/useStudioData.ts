import { useEffect, useState } from 'react';
import { collection, onSnapshot, orderBy, query, getDocs, doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { visibleServices } from '../utils/serviceCatalog';
import { DEFAULT_SERVICES, type Service } from '../pages/Services';

/**
 * Live studio data for the Nocturne pages, read from the same Firestore
 * collections the admin writes to. Each hook falls back to the built-in
 * defaults so a cold or offline load still renders a complete page.
 */

export const useServices = () => {
    const [services, setServices] = useState<Service[]>(DEFAULT_SERVICES);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const unsubscribe = onSnapshot(
            collection(db, 'services'),
            (snapshot) => {
                if (!snapshot.empty) {
                    const fetched = visibleServices(
                        snapshot.docs.map((d) => ({ id: d.id, ...d.data() })) as Service[],
                    );
                    setServices(fetched);
                    setLoading(false);

                    // Text and prices come from Firestore and are trustworthy;
                    // the image URLs may point at a bucket that is not serving.
                    const sample = fetched.find((service) => REMOTE.test(service.imageMain ?? ''));
                    if (sample) {
                        void storageIsServing(sample.imageMain).then((serving) => {
                            if (serving) return;
                            setServices((current) =>
                                current.map((service) => {
                                    const local = DEFAULT_SERVICES.find((d) => d.id === service.id)
                                        ?? DEFAULT_SERVICES[0];
                                    return {
                                        ...service,
                                        imageMain: local.imageMain,
                                        imageDetail: local.imageDetail,
                                        imageAction: local.imageAction,
                                    };
                                }),
                            );
                        });
                    }
                    return;
                }

                setServices(DEFAULT_SERVICES);
                setLoading(false);
            },
            (error) => {
                console.error('Failed to fetch services, using defaults:', error);
                setLoading(false);
            },
        );

        return () => unsubscribe();
    }, []);

    return { services, loading };
};

/* ── Storage availability ──────────────────────────────────────────────────
 * Firestore and Cloud Storage are separate products with separate entitlements,
 * so the database can answer perfectly while every image URL it hands back is
 * dead. That is the live failure mode today: the project sits on the Spark
 * plan, which lost Cloud Storage in Sept 2024, so every /gallery object returns
 * HTTP 402 and the browser blocks it (ERR_BLOCKED_BY_ORB) — leaving a wall of
 * empty tiles.
 *
 * One canary image settles it for the whole session: the bucket is either
 * serving or it is not. When it is not, each hook keeps the admin's text and
 * swaps in the photography bundled under /public.
 */

const REMOTE = /^https?:\/\//i;

const canLoadImage = (src: string, timeoutMs = 8000): Promise<boolean> =>
    new Promise((resolve) => {
        if (typeof Image === 'undefined') return resolve(true);
        const img = new Image();
        let settled = false;
        const done = (ok: boolean) => {
            if (settled) return;
            settled = true;
            img.onload = img.onerror = null;
            resolve(ok);
        };
        img.onload = () => done(true);
        img.onerror = () => done(false);
        img.src = src;
        setTimeout(() => done(false), timeoutMs);
    });

let storageProbe: Promise<boolean> | null = null;

/** True when remote images load. Probed once per session, then cached. */
const storageIsServing = (sampleSrc: string): Promise<boolean> => {
    if (!REMOTE.test(sampleSrc)) return Promise.resolve(true);
    if (!storageProbe) {
        storageProbe = canLoadImage(sampleSrc).then((ok) => {
            if (!ok) {
                console.warn(
                    'Cloud Storage images are not loading (the project is on the Spark plan, ' +
                    'which no longer includes Cloud Storage). Falling back to the photos ' +
                    'bundled in /public. Upgrade to Blaze to restore uploaded images.',
                );
            }
            return ok;
        });
    }
    return storageProbe;
};

/** The admin writes a fourth category, 'other'. It has to survive the trip or
 *  those photos become unreachable by any filter. */
export type GalleryCategory = 'solo' | 'duo' | 'group' | 'other';

export interface GalleryImage {
    id: string;
    src: string;
    category: GalleryCategory;
    alt: string;
}

const CATEGORIES: GalleryCategory[] = ['solo', 'duo', 'group', 'other'];

/** The admin's alt field defaults to '' and is usually left blank, which left
 *  the lightbox captioned " (1 / 26)" and screen readers hearing "View ". Fall
 *  back to the category, the way the admin's own list falls back to
 *  'Untitled'. */
const CATEGORY_LABEL: Record<GalleryCategory, string> = {
    solo: 'Solo session',
    duo: 'Duo session',
    group: 'Group session',
    other: 'Studio session',
};

const normaliseImage = (raw: Partial<GalleryImage> & { id: string }): GalleryImage => {
    const category = CATEGORIES.includes(raw.category as GalleryCategory)
        ? (raw.category as GalleryCategory)
        : 'other';
    return {
        id: raw.id,
        src: raw.src ?? '',
        category,
        alt: (raw.alt ?? '').trim() || CATEGORY_LABEL[category],
    };
};

/* The studio's own shots, shipped in /public/gallery. Used when the Firestore
   collection is empty or unreachable, so the wall is never blank — the same
   contract DEFAULT_SERVICES gives the packages. */
const DEFAULT_GALLERY: GalleryImage[] = [
    ['solo1', 'solo', 'Solo session'],
    ['duo1', 'duo', 'Duo session'],
    ['group1', 'group', 'Group session'],
    ['solo2', 'solo', 'Solo session'],
    ['duo2', 'duo', 'Duo session'],
    ['group2', 'group', 'Group session'],
    ['solo3', 'solo', 'Solo session'],
    ['duo3', 'duo', 'Duo session'],
    ['group3', 'group', 'Group session'],
    ['solo4', 'solo', 'Solo session'],
    ['duo4', 'duo', 'Duo session'],
    ['group4', 'group', 'Group session'],
    ['solo5', 'solo', 'Solo session'],
    ['duo5', 'duo', 'Duo session'],
    ['group5', 'group', 'Group session'],
].map(([slug, category, alt]) => ({
    id: slug,
    src: `/gallery/${slug}.webp`,
    category: category as GalleryImage['category'],
    alt,
}));

export const useGallery = () => {
    const [images, setImages] = useState<GalleryImage[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        let cancelled = false;

        /* Firestore retries a failed read indefinitely rather than rejecting, so
           an unreachable backend would leave the wall on its loading state for
           good. Show the defaults after a beat; a late real response still wins. */
        const timeout = setTimeout(() => {
            if (cancelled) return;
            setImages((current) => (current.length ? current : DEFAULT_GALLERY));
            setLoading(false);
        }, 6000);

        const fetchGallery = async () => {
            try {
                const q = query(collection(db, 'gallery'), orderBy('createdAt', 'desc'));
                const snapshot = await getDocs(q);
                if (cancelled) return;
                const fetched = snapshot.docs
                    .map((d) => normaliseImage({ id: d.id, ...d.data() }))
                    // A document with no src renders as an empty tile that
                    // still occupies a slot and opens a blank lightbox.
                    .filter((image) => image.src);

                if (!fetched.length) {
                    setImages(DEFAULT_GALLERY);
                    return;
                }

                // Records are fine but their images may not be: check before
                // painting a wall of empty tiles.
                const serving = await storageIsServing(fetched[0].src);
                if (cancelled) return;
                setImages(serving ? fetched : DEFAULT_GALLERY);
            } catch (error) {
                console.error('Error fetching gallery, using defaults:', error);
                if (!cancelled) setImages(DEFAULT_GALLERY);
            } finally {
                if (!cancelled) setLoading(false);
            }
        };

        fetchGallery();
        return () => {
            cancelled = true;
            clearTimeout(timeout);
        };
    }, []);

    return { images, loading };
};

export interface AboutContent {
    title: string;
    body: string;
    image1: string;
    image2: string;
    image3: string;
}

const DEFAULT_ABOUT: AboutContent = {
    title: 'The room is yours for the whole slot',
    body:
        'Lighting is set before you walk in. You choose the backdrop, hold the remote, and shoot until the timer runs out. Selection time is built into every package, so you leave with the frames you picked, not the ones we picked for you.',
    image1: '/about1.webp',
    image2: '/about2.webp',
    image3: '/about3.webp',
};

export const useAbout = () => {
    const [about, setAbout] = useState<AboutContent>(DEFAULT_ABOUT);

    useEffect(() => {
        let cancelled = false;

        const fetchAbout = async () => {
            try {
                const snap = await getDoc(doc(db, 'siteContent', 'about'));
                if (cancelled || !snap.exists()) return;
                const data = snap.data() as Partial<AboutContent>;
                // Merge rather than replace: the admin's About document does not
                // carry every field the Nocturne section renders.
                setAbout((current) => ({ ...current, ...data }));
            } catch (error) {
                console.error('Error fetching about content:', error);
            }
        };

        fetchAbout();
        return () => {
            cancelled = true;
        };
    }, []);

    return about;
};

/** Peso formatting for prices that may arrive as "₱299", "299" or 299. */
export const peso = (value: string | number): string => {
    if (typeof value === 'number') return `₱${value.toLocaleString('en-US')}`;
    const trimmed = String(value).trim();
    if (trimmed.startsWith('₱')) return trimmed;
    const numeric = Number(trimmed.replace(/[^\d.]/g, ''));
    return Number.isFinite(numeric) && trimmed !== ''
        ? `₱${numeric.toLocaleString('en-US')}`
        : trimmed;
};
