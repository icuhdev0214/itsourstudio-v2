import { useState, useEffect } from 'react';
import { db } from '../../firebase';
import { collection, query, orderBy, onSnapshot, doc, updateDoc, deleteDoc } from 'firebase/firestore';
import './FeedbackManagement.css';

interface Feedback {
    id: string;
    name: string;
    rating: number;
    message: string;
    showInTestimonials: boolean;
    createdAt?: any;
}

interface FeedbackManagementProps {
    showToast: (type: 'success' | 'error', title: string, message: string) => void;
}

const FeedbackManagement = ({ showToast }: FeedbackManagementProps) => {
    const [feedbacks, setFeedbacks] = useState<Feedback[]>([]);
    const [loading, setLoading] = useState(true);

    // Fetch Feedbacks Real-time
    useEffect(() => {
        const q = query(collection(db, 'feedbacks'), orderBy('createdAt', 'desc'));
        const unsubscribe = onSnapshot(q, (snapshot) => {
            const feedbacksData = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            })) as Feedback[];
            setFeedbacks(feedbacksData);
            setLoading(false);
        }, (error) => {
            console.error("Error fetching feedbacks:", error);
            showToast('error', 'Error', 'Failed to fetch feedbacks');
            setLoading(false);
        });

        return () => unsubscribe();
    }, [showToast]);

    const handleToggleFeedback = async (id: string, currentStatus: boolean) => {
        try {
            await updateDoc(doc(db, 'feedbacks', id), {
                showInTestimonials: !currentStatus
            });
            showToast('success', 'Updated', `Feedback ${!currentStatus ? 'published' : 'hidden'}`);
        } catch (error) {
            console.error("Error updating feedback:", error);
            showToast('error', 'Error', 'Failed to update feedback status');
        }
    };

    const handleDeleteFeedback = async (id: string) => {
        if (window.confirm("Delete this feedback?")) {
            try {
                await deleteDoc(doc(db, 'feedbacks', id));
                showToast('success', 'Deleted', 'Feedback deleted successfully');
            } catch (error) {
                console.error("Error deleting feedback:", error);
                showToast('error', 'Error', 'Failed to delete feedback');
            }
        }
    };

    return (
        <div className="bookings-section feedback-management">
            <div className="bookings-header">
                <h3>Customer Feedbacks</h3>
            </div>

            {/* Desktop Table View */}
            <div className="bookings-table-container desktop-view">
                <table className="bookings-table">
                    <thead>
                        <tr>
                            <th>Date</th>
                            <th>Customer</th>
                            <th>Rating</th>
                            <th>Message</th>
                            <th>Status</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {feedbacks.map((feedback) => (
                            <tr key={feedback.id}>
                                <td>{feedback.createdAt?.toDate ? feedback.createdAt.toDate().toLocaleDateString() : 'N/A'}</td>
                                <td style={{ fontWeight: 500 }}>{feedback.name}</td>
                                <td style={{ color: '#FFD700', letterSpacing: '2px' }}>{'★'.repeat(feedback.rating)}</td>
                                <td style={{ maxWidth: '300px' }} className="message-cell">{feedback.message}</td>
                                <td>
                                    <button
                                        className={`btn ${feedback.showInTestimonials ? 'btn-primary' : 'btn-outline'}`}
                                        style={{ padding: '0.25rem 0.75rem', fontSize: '0.8rem' }}
                                        onClick={() => handleToggleFeedback(feedback.id, feedback.showInTestimonials)}
                                    >
                                        {feedback.showInTestimonials ? 'Published' : 'Hidden'}
                                    </button>
                                </td>
                                <td>
                                    <button
                                        className="action-btn"
                                        title="Delete"
                                        onClick={() => handleDeleteFeedback(feedback.id)}
                                    >
                                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="red" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
                                    </button>
                                </td>
                            </tr>
                        ))}
                        {feedbacks.length === 0 && !loading && (
                            <tr>
                                <td colSpan={6} style={{ textAlign: 'center', padding: '2rem' }}>
                                    No feedbacks found.
                                </td>
                            </tr>
                        )}
                        {loading && (
                            <tr>
                                <td colSpan={6} style={{ textAlign: 'center', padding: '2rem' }}>
                                    Loading...
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            {/* Mobile Card View */}
            <div className="mobile-view feedback-card-list">
                {feedbacks.map((feedback) => (
                    <div key={feedback.id} className="feedback-card">
                        <div className="feedback-card-header">
                            <div className="feedback-user-info">
                                <span className="feedback-name">{feedback.name}</span>
                                <span className="feedback-date">{feedback.createdAt?.toDate ? feedback.createdAt.toDate().toLocaleDateString() : 'N/A'}</span>
                            </div>
                            <div className="feedback-rating">
                                {'★'.repeat(feedback.rating)}
                            </div>
                        </div>

                        <div className="feedback-message">
                            "{feedback.message}"
                        </div>

                        <div className="feedback-actions">
                            <button
                                className={`status-toggle-btn ${feedback.showInTestimonials ? 'published' : 'hidden'}`}
                                onClick={() => handleToggleFeedback(feedback.id, feedback.showInTestimonials)}
                            >
                                {feedback.showInTestimonials ? 'Published' : 'Hidden'}
                            </button>

                            <button
                                className="delete-icon-btn"
                                title="Delete"
                                onClick={() => handleDeleteFeedback(feedback.id)}
                            >
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
                            </button>
                        </div>
                    </div>
                ))}
                {feedbacks.length === 0 && !loading && (
                    <div style={{ textAlign: 'center', padding: '2rem', color: '#888' }}>
                        No feedbacks found.
                    </div>
                )}
            </div>
        </div>
    );
};

export default FeedbackManagement;
