import { doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { DEFAULT_EMAIL_TEMPLATES, mergeEmailTemplates } from './emailTemplates';
import type { EmailTemplateKey } from './emailTemplates';

export const loadEmailTemplate = async (templateKey: EmailTemplateKey) => {
    try {
        const docSnap = await getDoc(doc(db, 'siteContent', 'emailTemplates'));
        if (!docSnap.exists()) return DEFAULT_EMAIL_TEMPLATES[templateKey];

        const templates = mergeEmailTemplates(docSnap.data().templates);
        return templates[templateKey];
    } catch (error) {
        console.error(`Failed to load ${templateKey} email template:`, error);
        return DEFAULT_EMAIL_TEMPLATES[templateKey];
    }
};
