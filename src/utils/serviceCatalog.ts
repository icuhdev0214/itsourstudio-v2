export interface SortableService {
    id: string;
    title?: string;
    order?: number | string;
    isVisible?: boolean;
}

export const sortServices = <T extends SortableService>(services: T[]): T[] => (
    [...services].sort((a, b) => {
        const aOrder = Number.isFinite(Number(a.order)) ? Number(a.order) : Number.MAX_SAFE_INTEGER;
        const bOrder = Number.isFinite(Number(b.order)) ? Number(b.order) : Number.MAX_SAFE_INTEGER;

        if (aOrder !== bOrder) return aOrder - bOrder;
        return String(a.title || '').localeCompare(String(b.title || ''));
    })
);

export const visibleServices = <T extends SortableService>(services: T[]): T[] => (
    sortServices(services).filter(service => service.isVisible !== false)
);
