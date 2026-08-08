import StrategyBanner from './StrategyBanner';
import ContentTabs from './ContentTabs';
import MainPostTab from './MainPostTab';
import WhatsAppTab from './WhatsAppTab';
import ReelTab from './ReelTab';

export default function ContentPanel({ postData, activeTab, onTabChange, apiBaseUrl }) {
  return (
    <div className="glass-panel content-panel-wrapper">
      <StrategyBanner 
        weekOfMonth={postData.week_of_month} 
        activeCategory={postData.active_category} 
        theme={postData.theme} 
      />

      <ContentTabs 
        activeTab={activeTab} 
        onTabChange={onTabChange} 
        hasReel={!!postData.reel_script} 
      />

      <div className="tab-content">
        {activeTab === 'main' && (
          <MainPostTab postData={postData} apiBaseUrl={apiBaseUrl} />
        )}
        {activeTab === 'whatsapp' && (
          <WhatsAppTab sequence={postData.whatsapp_sequence} />
        )}
        {activeTab === 'reel' && postData.reel_script && (
          <ReelTab reelScript={postData.reel_script} />
        )}
      </div>
    </div>
  );
}
