import { useState, useEffect } from 'react';
import { db, storage } from '../../firebase';
import { collection, getDocs, doc, getDoc, setDoc, deleteDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { compressImage } from '../../utils/compressImage';
import { sortServices } from '../../utils/serviceCatalog';
import ConfirmPopup from '../ConfirmPopup';
import './ContentManagement.css'; // Reuse existing styles or create specific ones

interface Service {
    id: string;
    title: string;
    price: string;
    duration: string;
    description: string;
    features: string[];
    imageMain: string;
    imageDetail: string;
    imageAction: string;
    isBestSelling: boolean;
    isVisible: boolean;
    order: number;
    addOns?: ServiceAddOn[];
}

interface ServiceAddOn {
    id: string;
    name: string;
    price: string;
    isEnabled: boolean;
}

interface ExtensionOption {
    id: string;
    duration: number;
    price: string;
    label: string;
    isEnabled: boolean;
}

const DEFAULT_EXTENSION_OPTIONS: ExtensionOption[] = [
    { id: 'none', duration: 0, price: '0', label: 'No Extension', isEnabled: true },
    { id: 'plus-15', duration: 15, price: '150', label: '+15 mins', isEnabled: true },
    { id: 'plus-30', duration: 30, price: '300', label: '+30 mins', isEnabled: true },
    { id: 'plus-45', duration: 45, price: '450', label: '+45 mins', isEnabled: true },
    { id: 'plus-60', duration: 60, price: '600', label: '+60 mins', isEnabled: true }
];

const DEFAULT_SERVICES_SEED: Service[] = [
    {
        id: 'solo',
        title: 'Solo Package',
        price: '₱299',
        duration: '15 Minutes',
        description: 'Perfect for a quick profile update or self-portrait session.',
        features: [
            '1 Person',
            '10 min shoot + 5 min selection',
            '1 Background selection',
            '10 Raw soft copies',
            '1 4R print'
        ],
        imageMain: '/gallery/solo1.webp',
        imageDetail: '/gallery/solo2.webp',
        imageAction: '/gallery/solo3.webp',
        isBestSelling: false,
        isVisible: true,
        order: 1
    },
    {
        id: 'basic',
        title: 'Basic Package',
        price: '₱399',
        duration: '25 Minutes',
        description: 'Our most popular choice for couples and duos.',
        features: [
            '1-2 People',
            '15 min shoot + 10 min selection',
            '1 Background selection',
            '15 Raw soft copies',
            '2 strips print',
            'Free use of props & wardrobe'
        ],
        imageMain: '/gallery/duo1.webp',
        imageDetail: '/gallery/duo2.webp',
        imageAction: '/gallery/duo3.webp',
        isBestSelling: true,
        isVisible: true,
        order: 2
    },
    {
        id: 'transfer',
        title: 'Just Transfer',
        price: '₱549',
        duration: '30 Minutes',
        description: 'Get all your raw photos without prints.',
        features: [
            '1-2 People',
            '20 min shoot + 10 min transfer',
            '1 Background selection',
            'All Raw soft copies',
            'No prints included'
        ],
        imageMain: '/gallery/solo4.webp',
        imageDetail: '/gallery/solo5.webp',
        imageAction: '/gallery/solo1.webp',
        isBestSelling: false,
        isVisible: true,
        order: 3
    },
    {
        id: 'standard',
        title: 'Standard Package',
        price: '₱699',
        duration: '45 Minutes',
        description: 'More time, more photos, more memories.',
        features: [
            '1-4 People',
            '25 min shoot + 20 min selection',
            '2 Background selections',
            '20 Raw soft copies',
            '4 strips print',
            'Free use of props & wardrobe'
        ],
        imageMain: '/gallery/group1.webp',
        imageDetail: '/gallery/group2.webp',
        imageAction: '/gallery/group3.webp',
        isBestSelling: false,
        isVisible: true,
        order: 4
    },
    {
        id: 'birthday',
        title: 'Birthday Package',
        price: '₱599',
        duration: '45 Minutes',
        description: 'Celebrate your special day with a fun shoot!',
        features: [
            '1 Person (Birthday Celebrant)',
            '25 min shoot + 20 min selection',
            'Unlimited Backgrounds',
            'All Raw soft copies',
            '1 A4 print + 2 strips',
            'Free use of birthday props'
        ],
        imageMain: '/gallery/solo2.webp',
        imageDetail: '/gallery/solo3.webp',
        imageAction: '/gallery/solo4.webp',
        isBestSelling: false,
        isVisible: true,
        order: 5
    },
    {
        id: 'family',
        title: 'Family Package',
        price: '₱1,249',
        duration: '50 Minutes',
        description: 'Capture beautiful family portraits.',
        features: [
            'Up to 6 People',
            '30 min shoot + 20 min selection',
            'Unlimited Backgrounds',
            'All Raw soft copies',
            '2 A5 prints + 4 strips',
            'Free use of props'
        ],
        imageMain: '/gallery/group4.webp',
        imageDetail: '/gallery/group5.webp',
        imageAction: '/gallery/group1.webp',
        isBestSelling: false,
        isVisible: true,
        order: 6
    },
    {
        id: 'barkada',
        title: 'Barkada Package',
        price: '₱1,949',
        duration: '50 Minutes',
        description: 'The ultimate group experience for friends.',
        features: [
            'Up to 8 People',
            '30 min shoot + 20 min selection',
            'Unlimited Backgrounds',
            'All Raw soft copies',
            '8 strips print',
            '2 A5 prints & 2 4R prints'
        ],
        imageMain: '/gallery/group2.webp',
        imageDetail: '/gallery/group3.webp',
        imageAction: '/gallery/group4.webp',
        isBestSelling: false,
        isVisible: true,
        order: 7
    }
];

interface ServicesManagementProps {
    showToast: (type: 'success' | 'error', title: string, message: string) => void;
}

const ServicesManagement = ({ showToast }: ServicesManagementProps) => {
    const [services, setServices] = useState<Service[]>([]);
    const [loading, setLoading] = useState(true);
    const [isEditing, setIsEditing] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [extensionOptions, setExtensionOptions] = useState<ExtensionOption[]>(DEFAULT_EXTENSION_OPTIONS);
    const [savingExtensionOptions, setSavingExtensionOptions] = useState(false);

    // Form State
    const [formData, setFormData] = useState<Service>({
        id: '',
        title: '',
        price: '',
        duration: '',
        description: '',
        features: [],
        imageMain: '',
        imageDetail: '',
        imageAction: '',
        isBestSelling: false,
        isVisible: true,
        order: 0,
        addOns: []
    });

    // Image Upload State
    const [uploadingImage, setUploadingImage] = useState<string | null>(null);

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

    useEffect(() => {
        fetchServices();
        fetchExtensionOptions();
    }, []);

    const fetchExtensionOptions = async () => {
        try {
            const docSnap = await getDoc(doc(db, 'siteContent', 'extensionOptions'));
            if (docSnap.exists()) {
                const options = docSnap.data().options;
                if (Array.isArray(options) && options.length > 0) {
                    setExtensionOptions(options.map((option: any) => ({
                        id: String(option.id || `extension-${option.duration}`),
                        duration: Number(option.duration) || 0,
                        price: String(option.price ?? '0'),
                        label: String(option.label || (Number(option.duration) === 0 ? 'No Extension' : `+${Number(option.duration)} mins`)),
                        isEnabled: option.isEnabled !== false
                    })).sort((a: ExtensionOption, b: ExtensionOption) => a.duration - b.duration));
                }
            }
        } catch (error) {
            console.error("Error fetching extension options:", error);
            showToast('error', 'Error', 'Failed to load extra time options');
        }
    };

    const handleExtensionOptionChange = (index: number, field: keyof ExtensionOption, value: string | number | boolean) => {
        setExtensionOptions(prev => prev.map((option, optionIndex) => (
            optionIndex === index ? { ...option, [field]: value } : option
        )));
    };

    const handleAddExtensionOption = () => {
        setExtensionOptions(prev => [
            ...prev,
            {
                id: `extension-${Date.now()}`,
                duration: 15,
                price: '0',
                label: '+15 mins',
                isEnabled: true
            }
        ]);
    };

    const handleRemoveExtensionOption = (index: number) => {
        setExtensionOptions(prev => prev.filter((_, optionIndex) => optionIndex !== index));
    };

    const handleSaveExtensionOptions = async () => {
        setSavingExtensionOptions(true);
        try {
            const normalizedOptions = extensionOptions
                .map(option => {
                    const duration = Number(option.duration) || 0;
                    return {
                        ...option,
                        id: option.id || `extension-${duration}`,
                        duration,
                        price: String(option.price || '0').trim(),
                        label: option.label.trim() || (duration === 0 ? 'No Extension' : `+${duration} mins`)
                    };
                })
                .filter(option => option.duration === 0 || Number(option.price.replace(/\D/g, '')) >= 0)
                .sort((a, b) => a.duration - b.duration);

            const hasNoExtension = normalizedOptions.some(option => option.duration === 0);
            const options = hasNoExtension
                ? normalizedOptions
                : [{ id: 'none', duration: 0, price: '0', label: 'No Extension', isEnabled: true }, ...normalizedOptions];

            await setDoc(doc(db, 'siteContent', 'extensionOptions'), { options });
            setExtensionOptions(options);
            showToast('success', 'Saved', 'Extra time options updated successfully');
        } catch (error) {
            console.error("Error saving extension options:", error);
            showToast('error', 'Error', 'Failed to save extra time options');
        } finally {
            setSavingExtensionOptions(false);
        }
    };

    const fetchServices = async () => {
        try {
            const snapshot = await getDocs(collection(db, 'services'));

            if (snapshot.empty) {
                // Initial seed if empty? Or just leave empty.
                // For now, let's just leave it empty or maybe the user will manually add them.
                setServices([]);
            } else {
                const fetchedServices = snapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data()
                })) as Service[];
                setServices(sortServices(fetchedServices));
            }
        } catch (error) {
            console.error("Error fetching services:", error);
            showToast('error', 'Error', 'Failed to load services');
        } finally {
            setLoading(false);
        }
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value, type } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'number' ? Number(value) : value
        }));
    };

    const handleFeaturesChange = (value: string) => {
        setFormData(prev => ({
            ...prev,
            features: value.split('\n').filter(f => f.trim() !== '')
        }));
    };

    const handleAddOnChange = (index: number, field: keyof ServiceAddOn, value: string | boolean) => {
        setFormData(prev => ({
            ...prev,
            addOns: (prev.addOns || []).map((addOn, addOnIndex) => (
                addOnIndex === index ? { ...addOn, [field]: value } : addOn
            ))
        }));
    };

    const handleAddAddOn = () => {
        setFormData(prev => ({
            ...prev,
            addOns: [
                ...(prev.addOns || []),
                {
                    id: `addon-${Date.now()}`,
                    name: '',
                    price: '',
                    isEnabled: true
                }
            ]
        }));
    };

    const handleRemoveAddOn = (index: number) => {
        setFormData(prev => ({
            ...prev,
            addOns: (prev.addOns || []).filter((_, addOnIndex) => addOnIndex !== index)
        }));
    };

    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>, imageField: 'imageMain' | 'imageDetail' | 'imageAction') => {
        const file = e.target.files?.[0];
        if (!file) return;

        if (file.size > 15 * 1024 * 1024) {
            showToast('error', 'File too large', 'Image must be less than 15MB');
            return;
        }

        setUploadingImage(imageField);
        try {
            const compressedBlob = await compressImage(file);
            const storageRef = ref(storage, `services/${Date.now()}_${file.name}`);
            await uploadBytes(storageRef, compressedBlob);
            const url = await getDownloadURL(storageRef);

            setFormData(prev => ({ ...prev, [imageField]: url }));
            showToast('success', 'Uploaded', 'Image uploaded successfully');
        } catch (error) {
            console.error("Error uploading image:", error);
            showToast('error', 'Error', 'Failed to upload image');
        } finally {
            setUploadingImage(null);
        }
    };

    const handleEdit = (service: Service) => {
        setFormData(service);
        setEditingId(service.id);
        setIsEditing(true);
    };

    const handleCancel = () => {
        setFormData({
            id: '',
            title: '',
            price: '',
            duration: '',
            description: '',
            features: [],
            imageMain: '',
            imageDetail: '',
            imageAction: '',
            isBestSelling: false,
            isVisible: true,
            order: services.length,
            addOns: []
        });
        setEditingId(null);
        setIsEditing(false);
    };

    const handleDelete = (id: string) => {
        setConfirmConfig({
            isOpen: true,
            title: 'Delete Service',
            message: 'Are you sure you want to delete this service? This action cannot be undone.',
            isDestructive: true,
            onConfirm: async () => {
                try {
                    await deleteDoc(doc(db, 'services', id));
                    setServices(prev => prev.filter(s => s.id !== id));
                    showToast('success', 'Deleted', 'Service deleted successfully');
                } catch (error) {
                    console.error("Error deleting service:", error);
                    showToast('error', 'Error', 'Failed to delete service');
                } finally {
                    closeConfirm();
                }
            }
        });
    };

    const saveService = async () => {
        try {
            const serviceData = {
                ...formData,
                addOns: (formData.addOns || [])
                    .map(addOn => ({
                        ...addOn,
                        id: addOn.id || `addon-${Date.now()}`,
                        name: addOn.name.trim(),
                        price: addOn.price.trim()
                    }))
                    .filter(addOn => addOn.name && addOn.price)
            };

            // If creating new, check ID uniqueness
            if (!editingId) {
                const exists = services.some(s => s.id === serviceData.id);
                if (exists) {
                    showToast('error', 'Duplicate ID', 'A service with this ID already exists');
                    return;
                }
            }

            await setDoc(doc(db, 'services', serviceData.id), serviceData);

            showToast('success', 'Saved', `Service ${editingId ? 'updated' : 'created'} successfully`);
            fetchServices(); // Refresh list
            handleCancel();
        } catch (error) {
            console.error("Error saving service:", error);
            showToast('error', 'Error', 'Failed to save service');
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        // Basic validation
        if (!formData.title || !formData.id) {
            showToast('error', 'Validation', 'Please fill in required fields (ID, Title)');
            return;
        }

        // Check for empty price
        if (!formData.price || formData.price.trim() === '') {
            setConfirmConfig({
                isOpen: true,
                title: 'No Price Specified',
                message: 'You are about to save this package without a price. The price will be hidden on the public site. Do you want to continue?',
                isDestructive: false,
                onConfirm: async () => {
                    await saveService();
                    closeConfirm();
                }
            });
            return;
        }

        await saveService();
    };

    const handleLoadDefaults = () => {
        setConfirmConfig({
            isOpen: true,
            title: 'Load Default Services',
            message: 'This will overwrite your current list with the default packages. Are you sure you want to continue?',
            isDestructive: false,
            onConfirm: async () => {
                setLoading(true);
                try {
                    for (const service of DEFAULT_SERVICES_SEED) {
                        await setDoc(doc(db, 'services', service.id), service);
                    }
                    showToast('success', 'Loaded', 'Default services loaded successfully');
                    fetchServices();
                } catch (error) {
                    console.error("Error loading defaults:", error);
                    showToast('error', 'Error', 'Failed to load default services');
                } finally {
                    setLoading(false);
                    closeConfirm();
                }
            }
        });
    };

    if (loading) return <div>Loading services...</div>;

    return (
        <div className="content-card">
            <div className="card-header">
                <h4>Services Management</h4>
                <p>Add, edit, or remove services and packages.</p>
                {!isEditing && (
                    <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
                        <button
                            className="btn btn-primary"
                            onClick={() => {
                                handleCancel(); // Reset form
                                setIsEditing(true);
                            }}
                        >
                            + Add New Service
                        </button>
                        {services.length === 0 && (
                            <button
                                className="btn btn-outline"
                                onClick={handleLoadDefaults}
                            >
                                Load Default Services
                            </button>
                        )}
                    </div>
                )}
            </div>

            <div className="card-body">
                {!isEditing && (
                    <div className="admin-settings-panel">
                        <div className="add-ons-admin-header">
                            <div>
                                <h5>Extra Time Options</h5>
                                <p>These options appear in the booking date and time step.</p>
                            </div>
                            <button type="button" className="btn btn-outline" onClick={handleAddExtensionOption}>
                                + Add Option
                            </button>
                        </div>

                        <div className="extension-admin-list">
                            {extensionOptions.map((option, index) => (
                                <div className="extension-admin-row" key={option.id || index}>
                                    <div>
                                        <label className="form-label">Label</label>
                                        <input
                                            type="text"
                                            className="form-input"
                                            value={option.label}
                                            onChange={(e) => handleExtensionOptionChange(index, 'label', e.target.value)}
                                            placeholder="+15 mins"
                                        />
                                    </div>
                                    <div>
                                        <label className="form-label">Duration</label>
                                        <input
                                            type="number"
                                            className="form-input"
                                            value={option.duration}
                                            min="0"
                                            onChange={(e) => handleExtensionOptionChange(index, 'duration', Number(e.target.value))}
                                        />
                                    </div>
                                    <div>
                                        <label className="form-label">Price</label>
                                        <input
                                            type="text"
                                            className="form-input"
                                            value={option.price}
                                            onChange={(e) => handleExtensionOptionChange(index, 'price', e.target.value)}
                                            placeholder="150"
                                        />
                                    </div>
                                    <label className="add-on-enabled-toggle">
                                        <input
                                            type="checkbox"
                                            checked={option.isEnabled}
                                            disabled={option.duration === 0}
                                            onChange={(e) => handleExtensionOptionChange(index, 'isEnabled', e.target.checked)}
                                        />
                                        Enabled
                                    </label>
                                    <button
                                        type="button"
                                        className="btn btn-sm btn-danger"
                                        onClick={() => handleRemoveExtensionOption(index)}
                                        disabled={option.duration === 0}
                                    >
                                        Delete
                                    </button>
                                </div>
                            ))}
                        </div>

                        <div className="card-actions compact-actions">
                            <button
                                type="button"
                                className="btn btn-primary"
                                onClick={handleSaveExtensionOptions}
                                disabled={savingExtensionOptions}
                            >
                                {savingExtensionOptions ? 'Saving...' : 'Save Extra Time Options'}
                            </button>
                        </div>
                    </div>
                )}

                {isEditing ? (
                    <form onSubmit={handleSubmit} className="service-form">
                        <div className="form-grid two-col">
                            <div>
                                <label className="form-label">Service ID (slug)</label>
                                <input
                                    type="text"
                                    className="form-input"
                                    name="id"
                                    value={formData.id}
                                    onChange={handleInputChange}
                                    disabled={!!editingId} // Cannot change ID once created
                                    placeholder="e.g., solo-package"
                                    required
                                />
                            </div>
                            <div>
                                <label className="form-label">Title</label>
                                <input
                                    type="text"
                                    className="form-input"
                                    name="title"
                                    value={formData.title}
                                    onChange={handleInputChange}
                                    placeholder="e.g., Solo Package"
                                    required
                                />
                            </div>
                            <div>
                                <label className="form-label">Price</label>
                                <input
                                    type="text"
                                    className="form-input"
                                    name="price"
                                    value={formData.price}
                                    onChange={handleInputChange}
                                    placeholder="e.g., ₱299"
                                    required
                                />
                            </div>
                            <div>
                                <label className="form-label">Duration</label>
                                <input
                                    type="text"
                                    className="form-input"
                                    name="duration"
                                    value={formData.duration}
                                    onChange={handleInputChange}
                                    placeholder="e.g., 15 Minutes"
                                />
                            </div>
                            <div>
                                <label className="form-label">Order (Sort)</label>
                                <input
                                    type="number"
                                    className="form-input"
                                    name="order"
                                    value={formData.order}
                                    onChange={handleInputChange}
                                />
                            </div>
                            <div className="form-group-toggle" style={{ display: 'flex', alignItems: 'center', marginTop: '2rem' }}>
                                <label className="switch">
                                    <input
                                        type="checkbox"
                                        checked={formData.isBestSelling}
                                        onChange={(e) => setFormData(prev => ({ ...prev, isBestSelling: e.target.checked }))}
                                    />
                                    <span className="slider round"></span>
                                </label>
                                <span className="toggle-label" style={{ marginLeft: '10px' }}>Best Selling Badge</span>
                            </div>
                            <div className="form-group-toggle" style={{ display: 'flex', alignItems: 'center', marginTop: '2rem' }}>
                                <label className="switch">
                                    <input
                                        type="checkbox"
                                        checked={formData.isVisible}
                                        onChange={(e) => setFormData(prev => ({ ...prev, isVisible: e.target.checked }))}
                                    />
                                    <span className="slider round"></span>
                                </label>
                                <span className="toggle-label" style={{ marginLeft: '10px' }}>Visible (Show on Site)</span>
                            </div>
                        </div>

                        <div className="full-width" style={{ marginTop: '1rem' }}>
                            <label className="form-label">Description</label>
                            <textarea
                                className="form-input"
                                name="description"
                                value={formData.description}
                                onChange={handleInputChange}
                                rows={3}
                            />
                        </div>

                        <div className="full-width" style={{ marginTop: '1rem' }}>
                            <label className="form-label">Features (One per line)</label>
                            <textarea
                                className="form-input"
                                value={formData.features.join('\n')}
                                onChange={(e) => handleFeaturesChange(e.target.value)}
                                rows={5}
                                placeholder="1 Person&#10;10 min shoot..."
                            />
                        </div>

                        <div className="full-width add-ons-admin-section" style={{ marginTop: '2rem' }}>
                            <div className="add-ons-admin-header">
                                <div>
                                    <h5>Add-ons</h5>
                                    <p>Optional extras customers can select for this service.</p>
                                </div>
                                <button type="button" className="btn btn-outline" onClick={handleAddAddOn}>
                                    + Add Add-on
                                </button>
                            </div>

                            {(formData.addOns || []).length === 0 ? (
                                <p className="text-muted">No add-ons configured for this service yet.</p>
                            ) : (
                                <div className="add-ons-admin-list">
                                    {(formData.addOns || []).map((addOn, index) => (
                                        <div className="add-on-admin-row" key={addOn.id || index}>
                                            <div>
                                                <label className="form-label">Add-on Name</label>
                                                <input
                                                    type="text"
                                                    className="form-input"
                                                    value={addOn.name}
                                                    onChange={(e) => handleAddOnChange(index, 'name', e.target.value)}
                                                    placeholder="e.g., Extra Hour"
                                                />
                                            </div>
                                            <div>
                                                <label className="form-label">Price</label>
                                                <input
                                                    type="text"
                                                    className="form-input"
                                                    value={addOn.price}
                                                    onChange={(e) => handleAddOnChange(index, 'price', e.target.value)}
                                                    placeholder="e.g., ₱500"
                                                />
                                            </div>
                                            <label className="add-on-enabled-toggle">
                                                <input
                                                    type="checkbox"
                                                    checked={addOn.isEnabled}
                                                    onChange={(e) => handleAddOnChange(index, 'isEnabled', e.target.checked)}
                                                />
                                                Enabled
                                            </label>
                                            <button type="button" className="btn btn-sm btn-danger" onClick={() => handleRemoveAddOn(index)}>
                                                Delete
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Images Section */}
                        <div className="full-width" style={{ marginTop: '2rem' }}>
                            <h5 style={{ marginBottom: '1rem' }}>Preview Images</h5>
                            <div className="images-grid">
                                {/* Main Image */}
                                <div>
                                    <label className="form-label">Main Image</label>
                                    <div className="image-uploader">
                                        {formData.imageMain ? (
                                            <div className="preview-image-container">
                                                <img src={formData.imageMain} alt="Main" className="preview-img" />
                                                <button type="button" onClick={() => setFormData(prev => ({ ...prev, imageMain: '' }))} className="btn-remove-img" style={{ position: 'absolute', top: 5, right: 5, background: 'rgba(0,0,0,0.5)', color: 'white', borderRadius: '50%', border: 'none', width: '24px', height: '24px' }}>×</button>
                                            </div>
                                        ) : (
                                            <input type="file" accept="image/*" onChange={(e) => handleImageUpload(e, 'imageMain')} className="form-input" disabled={uploadingImage === 'imageMain'} />
                                        )}
                                        {uploadingImage === 'imageMain' && <small>Uploading...</small>}
                                    </div>
                                </div>

                                {/* Detail Image */}
                                <div>
                                    <label className="form-label">Detail Image</label>
                                    <div className="image-uploader">
                                        {formData.imageDetail ? (
                                            <div className="preview-image-container">
                                                <img src={formData.imageDetail} alt="Detail" className="preview-img" />
                                                <button type="button" onClick={() => setFormData(prev => ({ ...prev, imageDetail: '' }))} className="btn-remove-img" style={{ position: 'absolute', top: 5, right: 5, background: 'rgba(0,0,0,0.5)', color: 'white', borderRadius: '50%', border: 'none', width: '24px', height: '24px' }}>×</button>
                                            </div>
                                        ) : (
                                            <input type="file" accept="image/*" onChange={(e) => handleImageUpload(e, 'imageDetail')} className="form-input" disabled={uploadingImage === 'imageDetail'} />
                                        )}
                                        {uploadingImage === 'imageDetail' && <small>Uploading...</small>}
                                    </div>
                                </div>

                                {/* Action Image */}
                                <div>
                                    <label className="form-label">Action Image</label>
                                    <div className="image-uploader">
                                        {formData.imageAction ? (
                                            <div className="preview-image-container">
                                                <img src={formData.imageAction} alt="Action" className="preview-img" />
                                                <button type="button" onClick={() => setFormData(prev => ({ ...prev, imageAction: '' }))} className="btn-remove-img" style={{ position: 'absolute', top: 5, right: 5, background: 'rgba(0,0,0,0.5)', color: 'white', borderRadius: '50%', border: 'none', width: '24px', height: '24px' }}>×</button>
                                            </div>
                                        ) : (
                                            <input type="file" accept="image/*" onChange={(e) => handleImageUpload(e, 'imageAction')} className="form-input" disabled={uploadingImage === 'imageAction'} />
                                        )}
                                        {uploadingImage === 'imageAction' && <small>Uploading...</small>}
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="card-actions" style={{ marginTop: '2rem', display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
                            <button
                                type="button"
                                className="btn btn-secondary"
                                onClick={handleCancel}
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                className="btn btn-primary"
                            >
                                {editingId ? 'Update Service' : 'Create Service'}
                            </button>
                        </div>
                    </form>
                ) : (
                    <div className="services-list">
                        {services.length === 0 ? (
                            <p className="text-muted">No services found. Add one to get started.</p>
                        ) : (
                            services.map(service => (
                                <div key={service.id} className="service-item">
                                    <div className="service-item-content">
                                        <div className="service-img">
                                            {service.imageMain && <img src={service.imageMain} alt={service.title} />}
                                        </div>
                                        <div>
                                                <h5 className="service-title">{service.title}</h5>
                                                <div className="service-meta">
                                                    {service.price} • {service.duration}
                                                </div>
                                                {(service.addOns || []).length > 0 && (
                                                    <div className="service-meta">
                                                        {(service.addOns || []).filter(addOn => addOn.isEnabled).length} active add-on(s)
                                                    </div>
                                                )}
                                            </div>
                                    </div>
                                    <div className="actions">
                                        <button
                                            className="btn btn-sm"
                                            style={{
                                                background: 'transparent',
                                                border: '1px solid #94a3b8',
                                                color: '#64748b',
                                                padding: '0.4rem 1rem',
                                                borderRadius: '6px',
                                                cursor: 'pointer',
                                                transition: 'all 0.2s'
                                            }}
                                            onMouseOver={(e) => {
                                                e.currentTarget.style.borderColor = '#0ea5e9';
                                                e.currentTarget.style.color = '#0ea5e9';
                                            }}
                                            onMouseOut={(e) => {
                                                e.currentTarget.style.borderColor = '#94a3b8';
                                                e.currentTarget.style.color = '#64748b';
                                            }}
                                            onClick={() => handleEdit(service)}
                                        >
                                            Edit
                                        </button>
                                        <button
                                            className="btn btn-sm"
                                            style={{
                                                background: 'transparent',
                                                border: '1px solid #ef4444',
                                                color: '#ef4444',
                                                padding: '0.4rem 1rem',
                                                borderRadius: '6px',
                                                cursor: 'pointer',
                                                transition: 'all 0.2s'
                                            }}
                                            onMouseOver={(e) => {
                                                e.currentTarget.style.background = 'rgba(239, 68, 68, 0.1)';
                                            }}
                                            onMouseOut={(e) => {
                                                e.currentTarget.style.background = 'transparent';
                                            }}
                                            onClick={() => handleDelete(service.id)}
                                        >
                                            Delete
                                        </button>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
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

export default ServicesManagement;
