import { BookOpen } from 'lucide-react';
import CopyButton from './CopyButton';

export default function MainPostTab({ postData }) {
  const handleImageError = (e) => {
    e.currentTarget.onerror = null;
    e.currentTarget.src = '/images/default_perfume.jpg';
  };

  return (
    <div className="content-display">
      {postData.image_url ? (
        <div className="image-container">
          <img 
            src={postData.image_url} 
            alt={postData.perfume_name || 'Featured Fragrance'} 
            onError={handleImageError}
          />
        </div>
      ) : (
        <div className="image-container education-post-placeholder">
          <div className="education-post-placeholder-inner">
            <BookOpen size={48} className="education-post-icon" />
            <h3 className="education-post-title">Educational / Text Post</h3>
            <p className="education-post-subtitle">No product image required.</p>
          </div>
        </div>
      )}
      
      <div className="caption-container">
        <h2>
          {postData.perfume_name} 
          {postData.brand && postData.brand !== "SirviniStyles" && (
            <span className="brand-suffix">by {postData.brand}</span>
          )}
        </h2>
        
        {postData.is_generic && (
          <div className="generic-notice-banner">
            ℹ️ This is a brand-building post (No hard selling).
          </div>
        )}

        <div className="caption-text">
          {postData.main_post}
        </div>
        
        <div className="copy-btn-main-wrapper">
          <CopyButton text={postData.main_post} label="Copy Caption" />
        </div>
      </div>
    </div>
  );
}
