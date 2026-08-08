export default function ContentTabs({ activeTab, onTabChange, hasReel }) {
  return (
    <div className="tabs-header">
      <button 
          className={`tab-btn ${activeTab === 'main' ? 'active' : ''}`}
          onClick={() => onTabChange('main')}
      >
          📸 Main Feed
      </button>
      <button 
          className={`tab-btn ${activeTab === 'whatsapp' ? 'active' : ''}`}
          onClick={() => onTabChange('whatsapp')}
      >
          💬 WhatsApp Series
      </button>
      {hasReel && (
          <button 
              className={`tab-btn ${activeTab === 'reel' ? 'active' : ''}`}
              onClick={() => onTabChange('reel')}
          >
              🎬 Reel Script
          </button>
      )}
    </div>
  );
}
