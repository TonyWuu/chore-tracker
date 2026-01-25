import { useState } from 'react';
import './ChoreForm.css';

interface CategoryFormProps {
  onSave: (name: string) => void;
  onClose: () => void;
}

export function CategoryForm({ onSave, onClose }: CategoryFormProps) {
  const [name, setName] = useState('');
  const [mouseDownOnOverlay, setMouseDownOnOverlay] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    onSave(name.trim());
  };

  const handleOverlayMouseDown = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      setMouseDownOnOverlay(true);
    }
  };

  const handleOverlayMouseUp = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget && mouseDownOnOverlay) {
      onClose();
    }
    setMouseDownOnOverlay(false);
  };

  return (
    <div
      className="modal-overlay"
      onMouseDown={handleOverlayMouseDown}
      onMouseUp={handleOverlayMouseUp}
    >
      <div className="modal-content" onMouseDown={() => setMouseDownOnOverlay(false)}>
        <div className="modal-header">
          <h2>Add Category</h2>
          <button className="close-button" onClick={onClose}>
            &times;
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="category-name">Category Name</label>
            <input
              type="text"
              id="category-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Vacuuming, Cleaning, Laundry"
              autoFocus
            />
            <span className="helper-text">This will create a new column</span>
          </div>

          <div className="form-actions">
            <div className="form-actions-right">
              <button type="button" className="cancel-button" onClick={onClose}>
                Cancel
              </button>
              <button type="submit" className="save-button">
                Create Category
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
