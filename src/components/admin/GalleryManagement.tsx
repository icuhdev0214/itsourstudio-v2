import { useState, useEffect } from 'react';
import { db, storage } from '../../firebase';
import { collection, getDocs, doc, setDoc, deleteDoc, query, orderBy } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { compressImage } from '../../utils/compressImage';
import ConfirmPopup from '../ConfirmPopup';
import './ContentManagement.css'; // Reuse existing styles

interface GalleryItem {
    id: string;
    src: string;
    category: 'solo' | 'duo' | 'group' | 'other';
    alt: string; // Used for caption
    showInCarousel: boolean;
    carouselOrder?: number;
    createdAt: any;
}

interface GalleryManagementProps {
    showToast: (type: 'success' | 'error', title: string, message: string) => void;
}

const GalleryManagement = ({ showToast }: GalleryManagementProps) => {
    const [items, setItems] = useState<GalleryItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [isEditing, setIsEditing] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);

    // Pagination State
    const [currentPage, setCurrentPage] = useState(1);
    const [showAll, setShowAll] = useState(false);
    const ITEMS_PER_PAGE = 3;

    // Form State
    const [formData, setFormData] = useState<Partial<GalleryItem>>({
        category: 'solo',
        alt: '',
        showInCarousel: false,
        carouselOrder: 0
    });

    // Image Upload State
    const [imageFile, setImageFile] = useState<File | null>(null);
    const [imagePreview, setImagePreview] = useState<string>('');
    const [uploading, setUploading] = useState(false);

    // Confirmation Popup State
    const [confirmConfig, setConfirmConfig] = useState({
        isOpen: false,
        title: '',
        message: '',
        onConfirm: () => { },
        isDestructive: false
    });

    const closeConfirm = () => {
        setConfirmConfig(prev => ({ ...prev, isOpen: false }));
    };

    const fetchGallery = async () => {
        setLoading(true);
        try {
            const q = query(collection(db, 'gallery'), orderBy('createdAt', 'desc'));
            const querySnapshot = await getDocs(q);
            const fetchedItems: GalleryItem[] = [];
            querySnapshot.forEach((doc) => {
                fetchedItems.push({ id: doc.id, ...doc.data() } as GalleryItem);
            });
            setItems(fetchedItems);
        } catch (error) {
            console.error("Error fetching gallery:", error);
            showToast('error', 'Error', 'Failed to fetch gallery items');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchGallery();
    }, []);

    // Reset pagination when toggling view or items update (optional but good UX)
    useEffect(() => {
        setCurrentPage(1);
    }, [showAll]);

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        if (file.size > 15 * 1024 * 1024) {
            showToast('error', 'File too large', 'Image must be less than 15MB');
            return;
        }

        const previewUrl = URL.createObjectURL(file);
        if (imagePreview && !editingId) URL.revokeObjectURL(imagePreview); // Clean up old preview if new upload

        setImageFile(file);
        setImagePreview(previewUrl);
    };



    const handleCancel = () => {
        if (imagePreview && !editingId) URL.revokeObjectURL(imagePreview);
        setEditingId(null);
        setFormData({
            category: 'solo',
            alt: '',
            showInCarousel: false,
            carouselOrder: 0
        });
        setImageFile(null);
        setImagePreview('');
        setIsEditing(false);
    };

    const handleDelete = (id: string) => {
        setConfirmConfig({
            isOpen: true,
            title: 'Delete Photo',
            message: 'Are you sure you want to delete this photo from the gallery? This cannot be undone.',
            isDestructive: true,
            onConfirm: async () => {
                try {
                    await deleteDoc(doc(db, 'gallery', id));
                    setItems(prev => prev.filter(i => i.id !== id));
                    showToast('success', 'Deleted', 'Photo removed successfully');
                } catch (error) {
                    console.error("Error deleting item:", error);
                    showToast('error', 'Error', 'Failed to delete photo');
                } finally {
                    closeConfirm();
                }
            }
        });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!imageFile && !editingId) {
            showToast('error', 'Missing Image', 'Please select an image to upload');
            return;
        }

        setUploading(true);
        try {
            let imageUrl = imagePreview;

            // Upload new image if selected
            if (imageFile) {
                const compressedBlob = await compressImage(imageFile);
                const storageRef = ref(storage, `gallery/${Date.now()}_${imageFile.name}`);
                await uploadBytes(storageRef, compressedBlob);
                imageUrl = await getDownloadURL(storageRef);
            }

            const itemData = {
                ...formData,
                src: imageUrl,
                updatedAt: new Date().toISOString()
            };

            if (editingId) {
                await setDoc(doc(db, 'gallery', editingId), itemData, { merge: true });
                showToast('success', 'Updated', 'Gallery item updated successfully');
            } else {
                const newId = `gallery_${Date.now()}`;
                await setDoc(doc(db, 'gallery', newId), {
                    ...itemData,
                    id: newId,
                    createdAt: new Date().toISOString()
                });
                showToast('success', 'Created', 'Photo added to gallery');
            }

            handleCancel();
            fetchGallery();
        } catch (error) {
            console.error("Error saving gallery item:", error);
            showToast('error', 'Error', 'Failed to save photo');
        } finally {
            setUploading(false);
        }
    };

    const handleToggleCarousel = async (item: GalleryItem) => {
        try {
            const newStatus = !item.showInCarousel;
            // Optimistic update
            setItems(prev => prev.map(i => i.id === item.id ? { ...i, showInCarousel: newStatus } : i));

            await setDoc(doc(db, 'gallery', item.id), { showInCarousel: newStatus }, { merge: true });
        } catch (error) {
            console.error("Error toggling carousel status:", error);
            showToast('error', 'Error', 'Failed to update status');
            // Revert on error
            setItems(prev => prev.map(i => i.id === item.id ? { ...i, showInCarousel: !item.showInCarousel } : i));
        }
    };

    // Quick Caption Edit State
    const [quickEditItem, setQuickEditItem] = useState<{ id: string, alt: string, category: string } | null>(null);

    const handleQuickSave = async () => {
        if (!quickEditItem) return;
        try {
            await setDoc(doc(db, 'gallery', quickEditItem.id), {
                alt: quickEditItem.alt,
                category: quickEditItem.category
            }, { merge: true });

            setItems(prev => prev.map(i => i.id === quickEditItem.id ? { ...i, alt: quickEditItem.alt, category: quickEditItem.category as any } : i));
            showToast('success', 'Updated', 'Photo details updated');
            setQuickEditItem(null);
        } catch (error) {
            console.error("Error updating item:", error);
            showToast('error', 'Error', 'Failed to update photo');
        }
    };

    const openQuickEdit = (item: GalleryItem) => {
        setQuickEditItem({
            id: item.id,
            alt: item.alt,
            category: item.category
        });
    };

    if (loading) return <div>Loading gallery...</div>;

    // Derived Logic for Pagination
    const totalPages = Math.ceil(items.length / ITEMS_PER_PAGE);
    const displayedItems = showAll
        ? items
        : items.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

    return (
        <div className="content-card">
            <div className="card-header">
                <h4>Gallery & Carousel</h4>
                <p>Manage gallery photos and select which ones appear in the homepage carousel.</p>
                {!isEditing && (
                    <button className="btn btn-primary" onClick={() => setIsEditing(true)} style={{ marginTop: '1rem' }}>
                        Add New Photo
                    </button>
                )}
            </div>

            <div className="card-body">
                {isEditing ? (
                    <form onSubmit={handleSubmit} className="service-form">
                        <div className="form-grid two-col">
                            <div>
                                <label className="form-label">Category</label>
                                <select
                                    className="form-input"
                                    value={formData.category}
                                    onChange={e => setFormData({ ...formData, category: e.target.value as any })}
                                >
                                    <option value="solo">Solo</option>
                                    <option value="duo">Duo</option>
                                    <option value="group">Group</option>
                                    <option value="other">Other</option>
                                </select>
                            </div>

                            <div>
                                <label className="form-label">Hover Caption / Title</label>
                                <input
                                    type="text"
                                    className="form-input"
                                    value={formData.alt}
                                    onChange={e => setFormData({ ...formData, alt: e.target.value })}
                                    placeholder="e.g. Creative Self Portrait"
                                />
                            </div>
                        </div>

                        <div className="form-group-toggle" style={{ margin: '1.5rem 0' }}>
                            <label className="switch">
                                <input
                                    type="checkbox"
                                    checked={formData.showInCarousel}
                                    onChange={e => setFormData({ ...formData, showInCarousel: e.target.checked })}
                                />
                                <span className="slider"></span>
                            </label>
                            <span className="toggle-label">Show in Homepage Carousel</span>
                        </div>

                        <div className="full-width">
                            <label className="form-label">Photo</label>
                            <div className="image-uploader">
                                {imagePreview ? (
                                    <div className="img-upload-card">
                                        <img src={imagePreview} alt="Preview" />
                                        <div className="img-upload-toolbar">
                                            <button
                                                type="button"
                                                className="img-icon-btn replace"
                                                title="Replace image"
                                                onClick={() => document.getElementById('gallery-photo-upload')?.click()}
                                            >
                                                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#5a5c62" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12a9 9 0 1 1-2.64-6.36"></path><polyline points="21 3 21 9 15 9"></polyline></svg>
                                            </button>
                                            <button
                                                type="button"
                                                className="img-icon-btn remove"
                                                title="Remove image"
                                                onClick={() => {
                                                    setImageFile(null);
                                                    setImagePreview('');
                                                    if (editingId) setFormData(prev => ({ ...prev, src: '' })); // Optional: clear src if you want to force re-upload, mostly for UX
                                                }}
                                            >
                                                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
                                            </button>
                                        </div>
                                    </div>
                                ) : (
                                    <label className="img-upload-dropzone" htmlFor="gallery-photo-upload">
                                        <div className="up-icon"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--color-primary)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="17 8 12 3 7 8"></polyline><line x1="12" y1="3" x2="12" y2="15"></line></svg></div>
                                        <div className="dz-title">Click to upload</div>
                                        <div className="dz-sub">PNG or JPG, up to 15MB</div>
                                    </label>
                                )}
                                <input
                                    id="gallery-photo-upload"
                                    type="file"
                                    accept="image/*"
                                    onChange={handleImageChange}
                                    style={{ display: 'none' }}
                                    disabled={uploading}
                                />
                            </div>
                        </div>

                        <div className="card-actions" style={{ marginTop: '2rem', display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
                            <button
                                type="button"
                                className="btn btn-secondary"
                                onClick={handleCancel}
                                disabled={uploading}
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                className="btn btn-primary"
                                disabled={uploading}
                            >
                                {uploading ? 'Saving...' : (editingId ? 'Update Photo' : 'Add Photo')}
                            </button>
                        </div>
                    </form>
                ) : (
                    <>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                            <button
                                className="btn btn-outline"
                                onClick={() => setShowAll(true)}
                                style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
                            >
                                <span style={{ fontSize: '1.2rem' }}>☷</span> Show All Photos
                            </button>

                            {items.length > 0 && (
                                <span style={{ color: '#736e67', fontSize: '0.9rem' }}>
                                    Total: {items.length}
                                </span>
                            )}
                        </div>

                        {/* Pagination List View (Default) */}
                        <div className="services-list">
                            {displayedItems.length === 0 ? (
                                <p className="text-muted">No photos found. Add one to get started.</p>
                            ) : (
                                displayedItems.map(item => (
                                    <div key={item.id} className="service-item">
                                        <div className="service-item-content">
                                            <div className="service-img" style={{ width: '80px', height: '80px' }}>
                                                <img src={item.src} alt={item.alt} />
                                            </div>
                                            <div>
                                                <h5 className="service-title">
                                                    {item.alt || 'Untitled'}
                                                </h5>
                                                <div className="service-meta">
                                                    {item.category.toUpperCase()}
                                                </div>
                                            </div>
                                        </div>
                                        <div className="actions" style={{ alignItems: 'center' }}>
                                            <div className="form-group-toggle" style={{ margin: 0, marginRight: '1rem' }} title={item.showInCarousel ? "Remove from Carousel" : "Add to Carousel"}>
                                                <label className="switch" style={{ transform: 'scale(0.8)' }}>
                                                    <input
                                                        type="checkbox"
                                                        checked={item.showInCarousel}
                                                        onChange={() => handleToggleCarousel(item)}
                                                    />
                                                    <span className="slider"></span>
                                                </label>
                                                <span className="toggle-label" style={{ fontSize: '0.75rem', color: item.showInCarousel ? 'var(--color-primary)' : '#a89e96', display: 'none' }}>
                                                    {item.showInCarousel ? 'In Carousel' : 'Hidden'}
                                                </span>
                                            </div>
                                            <button
                                                className="action-btn"
                                                title="Edit"
                                                onClick={() => openQuickEdit(item)}
                                            >
                                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#5a5c62" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
                                            </button>
                                            <button
                                                className="action-btn"
                                                title="Delete"
                                                onClick={() => handleDelete(item.id)}
                                            >
                                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="red" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
                                            </button>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>

                        {items.length > ITEMS_PER_PAGE && (
                            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '1rem', marginTop: '2rem' }}>
                                <button
                                    className="btn btn-outline"
                                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                                    disabled={currentPage === 1}
                                    style={{ padding: '0.5rem 1rem', fontSize: '0.9rem' }}
                                >
                                    Previous
                                </button>
                                <span style={{ color: '#736e67', fontWeight: 500 }}>
                                    Page {currentPage} of {totalPages}
                                </span>
                                <button
                                    className="btn btn-outline"
                                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                                    disabled={currentPage === totalPages}
                                    style={{ padding: '0.5rem 1rem', fontSize: '0.9rem' }}
                                >
                                    Next
                                </button>
                            </div>
                        )}

                        {/* Full Screen Grid Modal */}
                        {showAll && (
                            <div className="gallery-grid-modal" onClick={() => setShowAll(false)}>
                                <div className="gallery-grid-container" onClick={e => e.stopPropagation()}>
                                    <div className="gallery-grid-header">
                                        <div>
                                            <h3 style={{ margin: 0 }}>All Gallery Photos</h3>
                                            <p style={{ margin: 0, color: '#736e67', fontSize: '0.9rem' }}>
                                                Manage your entire collection ({items.length} items)
                                            </p>
                                        </div>
                                        <button
                                            className="btn btn-outline"
                                            onClick={() => setShowAll(false)}
                                            style={{ border: 'none', fontSize: '1.5rem', padding: '0.5rem' }}
                                        >
                                            ×
                                        </button>
                                    </div>
                                    <div className="gallery-grid-content">
                                        {items.map(item => (
                                            <div key={item.id} className="gallery-grid-item">
                                                <img src={item.src} alt={item.alt} />
                                                <div className={`gallery-item-status ${item.showInCarousel ? 'active' : ''}`}>
                                                    {item.showInCarousel ? 'In Carousel' : 'Hidden'}
                                                </div>
                                                <div className="gallery-item-overlay">
                                                    <div className="overlay-actions" style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                                        <button onClick={() => { setShowAll(false); openQuickEdit(item); }}>
                                                            Edit
                                                        </button>
                                                        <button
                                                            className="delete-btn"
                                                            onClick={() => handleDelete(item.id)}
                                                        >
                                                            Delete
                                                        </button>
                                                        <button
                                                            onClick={() => handleToggleCarousel(item)}
                                                            style={{ marginTop: '0.5rem', fontSize: '0.8rem', background: item.showInCarousel ? '#dcfce7' : '#f5eadd', color: item.showInCarousel ? '#166534' : '#736e67' }}
                                                        >
                                                            {item.showInCarousel ? 'Remove from Carousel' : 'Add to Carousel'}
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Quick Edit Modal */}
                        {quickEditItem && (
                            <div className="caption-edit-modal" onClick={() => setQuickEditItem(null)}>
                                <div className="caption-edit-card" onClick={e => e.stopPropagation()}>
                                    <h4>Edit Photo Details</h4>

                                    <div style={{ marginBottom: '1.5rem' }}>
                                        <label className="form-label">Category</label>
                                        <select
                                            className="form-input"
                                            value={quickEditItem.category}
                                            onChange={e => setQuickEditItem({ ...quickEditItem, category: e.target.value })}
                                        >
                                            <option value="solo">Solo</option>
                                            <option value="duo">Duo</option>
                                            <option value="group">Group</option>
                                            <option value="other">Other</option>
                                        </select>
                                    </div>

                                    <div style={{ marginBottom: '1.5rem' }}>
                                        <label className="form-label">Hover Caption / Title</label>
                                        <textarea
                                            className="form-input"
                                            value={quickEditItem.alt}
                                            onChange={e => setQuickEditItem({ ...quickEditItem, alt: e.target.value })}
                                            rows={3}
                                            style={{ resize: 'vertical' }}
                                            autoFocus
                                        />
                                        <small style={{ color: '#a89e96', display: 'block', marginTop: '0.5rem' }}>
                                            This text appears when visitors hover over the image.
                                        </small>
                                    </div>

                                    <div className="btn-group">
                                        <button className="btn btn-secondary" onClick={() => setQuickEditItem(null)}>
                                            Cancel
                                        </button>
                                        <button className="btn btn-primary" onClick={handleQuickSave}>
                                            Save Changes
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )}
                    </>
                )}
            </div>

            <ConfirmPopup
                isOpen={confirmConfig.isOpen}
                title={confirmConfig.title}
                message={confirmConfig.message}
                onConfirm={confirmConfig.onConfirm}
                onCancel={closeConfirm}
                isDestructive={confirmConfig.isDestructive}
            />
        </div>
    );
};

export default GalleryManagement;
