import { useEffect, useState } from 'react';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../../firebase';
import {
    DEFAULT_EMAIL_TEMPLATES,
    EMAIL_TEMPLATE_LABELS,
    EMAIL_TEMPLATE_PLACEHOLDERS,
    mergeEmailTemplates
} from '../../utils/emailTemplates';
import type { EmailTemplateKey, EmailTemplateMap } from '../../utils/emailTemplates';
import './ContentManagement.css';

interface EmailTemplateManagementProps {
    showToast: (type: 'success' | 'error', title: string, message: string) => void;
}

const TEMPLATE_KEYS = Object.keys(DEFAULT_EMAIL_TEMPLATES) as EmailTemplateKey[];

const EmailTemplateManagement = ({ showToast }: EmailTemplateManagementProps) => {
    const [templates, setTemplates] = useState<EmailTemplateMap>(DEFAULT_EMAIL_TEMPLATES);
    const [activeTemplate, setActiveTemplate] = useState<EmailTemplateKey>('received');
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        const fetchTemplates = async () => {
            try {
                const docSnap = await getDoc(doc(db, 'siteContent', 'emailTemplates'));
                if (docSnap.exists()) {
                    setTemplates(mergeEmailTemplates(docSnap.data().templates));
                }
            } catch (error) {
                console.error('Error loading email templates:', error);
                showToast('error', 'Error', 'Failed to load email templates');
            } finally {
                setLoading(false);
            }
        };

        fetchTemplates();
    }, [showToast]);

    const updateTemplateField = (field: 'subject' | 'preheader' | 'body', value: string) => {
        setTemplates(prev => ({
            ...prev,
            [activeTemplate]: {
                ...prev[activeTemplate],
                [field]: value
            }
        }));
    };

    const insertPlaceholder = (placeholder: string) => {
        setTemplates(prev => ({
            ...prev,
            [activeTemplate]: {
                ...prev[activeTemplate],
                body: `${prev[activeTemplate].body}${prev[activeTemplate].body.endsWith('\n') ? '' : '\n'}${placeholder}`
            }
        }));
    };

    const resetActiveTemplate = () => {
        setTemplates(prev => ({
            ...prev,
            [activeTemplate]: DEFAULT_EMAIL_TEMPLATES[activeTemplate]
        }));
    };

    const saveTemplates = async () => {
        setSaving(true);
        try {
            await setDoc(doc(db, 'siteContent', 'emailTemplates'), { templates });
            showToast('success', 'Saved', 'Email templates updated successfully');
        } catch (error) {
            console.error('Error saving email templates:', error);
            showToast('error', 'Error', 'Failed to save email templates');
        } finally {
            setSaving(false);
        }
    };

    if (loading) return <div>Loading email templates...</div>;

    const currentTemplate = templates[activeTemplate];

    return (
        <div className="content-card">
            <div className="card-header">
                <h4>Email Templates</h4>
                <p>Edit customer and admin email copy. Booking details are still appended automatically.</p>
            </div>

            <div className="card-body email-template-layout">
                <div className="email-template-list">
                    {TEMPLATE_KEYS.map(templateKey => (
                        <button
                            type="button"
                            key={templateKey}
                            className={`email-template-tab ${activeTemplate === templateKey ? 'active' : ''}`}
                            onClick={() => setActiveTemplate(templateKey)}
                        >
                            {EMAIL_TEMPLATE_LABELS[templateKey]}
                        </button>
                    ))}
                </div>

                <div className="email-template-editor">
                    <div className="form-grid">
                        <div className="full-width">
                            <label className="form-label">Subject</label>
                            <input
                                className="form-input"
                                value={currentTemplate.subject}
                                onChange={(e) => updateTemplateField('subject', e.target.value)}
                            />
                        </div>

                        <div className="full-width">
                            <label className="form-label">Preview Text</label>
                            <input
                                className="form-input"
                                value={currentTemplate.preheader}
                                onChange={(e) => updateTemplateField('preheader', e.target.value)}
                            />
                        </div>

                        <div className="full-width">
                            <label className="form-label">Message Body</label>
                            <textarea
                                className="form-input email-template-body"
                                value={currentTemplate.body}
                                rows={11}
                                onChange={(e) => updateTemplateField('body', e.target.value)}
                            />
                        </div>
                    </div>

                    <div className="placeholder-panel">
                        <div>
                            <h5>Placeholders</h5>
                            <p>Click to insert into the message body.</p>
                        </div>
                        <div className="placeholder-list">
                            {EMAIL_TEMPLATE_PLACEHOLDERS.map(placeholder => (
                                <button
                                    key={placeholder}
                                    type="button"
                                    className="placeholder-chip"
                                    onClick={() => insertPlaceholder(placeholder)}
                                >
                                    {placeholder}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="card-actions email-template-actions">
                        <button type="button" className="btn btn-secondary" onClick={resetActiveTemplate}>
                            Reset This Template
                        </button>
                        <button type="button" className="btn btn-primary" onClick={saveTemplates} disabled={saving}>
                            {saving ? 'Saving...' : 'Save Email Templates'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default EmailTemplateManagement;
