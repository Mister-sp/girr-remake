import React, { useState } from 'react';
import Modal from './Modal';
import { AuthService } from '../services/auth';

export default function ChangePasswordModal({ isOpen, onClose }) {
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setSuccess('');

        if (newPassword !== confirmPassword) {
            setError('Les mots de passe ne correspondent pas');
            return;
        }

        if (newPassword.length < 6) {
            setError('Le nouveau mot de passe doit faire au moins 6 caractères');
            return;
        }

        setLoading(true);
        try {
            const user = AuthService.getCurrentUser();
            await AuthService.changePassword(user.id, currentPassword, newPassword);
            setSuccess('Mot de passe modifié avec succès');
            // Réinitialiser les champs
            setCurrentPassword('');
            setNewPassword('');
            setConfirmPassword('');
            // Fermer le modal après 2 secondes
            setTimeout(() => {
                onClose();
                setSuccess('');
            }, 2000);
        } catch (err) {
            setError(err.response?.data?.error || 'Erreur lors du changement de mot de passe');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title="Changer le mot de passe"
            size="sm"
        >
            <form onSubmit={handleSubmit} className="change-password-form">
                {error && <div className="error-message">{error}</div>}
                {success && <div className="success-message">{success}</div>}
                
                <div className="form-group">
                    <label htmlFor="currentPassword">Mot de passe actuel</label>
                    <input
                        type="password"
                        id="currentPassword"
                        value={currentPassword}
                        onChange={(e) => setCurrentPassword(e.target.value)}
                        required
                        disabled={loading}
                    />
                </div>

                <div className="form-group">
                    <label htmlFor="newPassword">Nouveau mot de passe</label>
                    <input
                        type="password"
                        id="newPassword"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        required
                        disabled={loading}
                        minLength={6}
                    />
                </div>

                <div className="form-group">
                    <label htmlFor="confirmPassword">Confirmer le nouveau mot de passe</label>
                    <input
                        type="password"
                        id="confirmPassword"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        required
                        disabled={loading}
                    />
                </div>

                <div className="modal-actions">
                    <button
                        type="button"
                        onClick={onClose}
                        className="cancel-button"
                        disabled={loading}
                    >
                        Annuler
                    </button>
                    <button
                        type="submit"
                        className="save-button"
                        disabled={loading}
                    >
                        {loading ? 'Modification...' : 'Changer le mot de passe'}
                    </button>
                </div>
            </form>
        </Modal>
    );
}