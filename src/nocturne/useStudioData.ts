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
                    const fetched = snapshot.docs.map((d) => ({
                        id: d.id,
                        ...d.data(),
                    })) as Service[];
                    setServices(visibleServices(fetched));
                } else {
                    setServices(DEFAULT_SERVICES);
                }
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

export interface GalleryImage {
    id: string;
    src: string;
    category: 'solo' | 'duo' | 'group';
    alt: string;
}

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
                const fetched = snapshot.docs.map((d) => ({
                    id: d.id,
                    ...d.data(),
                })) as GalleryImage[];
                setImages(fetched.length ? fetched : DEFAULT_GALLERY);
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
