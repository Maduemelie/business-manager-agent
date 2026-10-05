import { useState } from 'react';
import Header from './components/Header';
import OfflineStatusBanner from './components/OfflineStatusBanner';
import BackupControls from './components/BackupControls';
import GenerateButton from './components/GenerateButton';
import ErrorMessage from './components/ErrorMessage';
import ContentPanel from './components/ContentPanel';
import PlaceholderState from './components/PlaceholderState';
import BusinessTracker from './components/BusinessTracker';
import { useContentGenerator } from './hooks/useContentGenerator';
import './index.css';

function App() {
  const { loading, postData, error, generateContent, reloadContent } = useContentGenerator();
  const [activeTab, setActiveTab] = useState('main');
  const [appMode, setAppMode] = useState('blueprint'); // 'blueprint' or 'business'

  const handleGenerate = async () => {
    const perfumeId = postData?.perfume_id;
    await generateContent(perfumeId);
    setActiveTab('main');
  };

  const handleDataRestored = async () => {
    await reloadContent();
    setActiveTab('main');
  };

  return (
    <div className="dashboard-container">
      <Header />
      
      <div className="tabs-header mb-6 w-full max-w-4xl">
        <button 
          className={`tab-btn ${appMode === 'blueprint' ? 'active' : ''}`} 
          onClick={() => setAppMode('blueprint')}
        >
          Daily Blueprint
        </button>
        <button 
          className={`tab-btn ${appMode === 'business' ? 'active' : ''}`} 
          onClick={() => setAppMode('business')}
        >
          Business Tracker
        </button>
      </div>

      <OfflineStatusBanner />
      <BackupControls onDataRestored={handleDataRestored} />
      
      {appMode === 'blueprint' ? (
        <>
          <GenerateButton 
            loading={loading} 
            onGenerate={handleGenerate} 
            perfumeName={postData && !postData.is_generic ? postData.perfume_name : null}
          />

          {error && <ErrorMessage message={error} />}

          {postData && !loading ? (
            <ContentPanel 
              postData={postData} 
              activeTab={activeTab} 
              onTabChange={setActiveTab} 
            />
          ) : (
            !loading && <PlaceholderState />
          )}
        </>
      ) : (
        <BusinessTracker />
      )}
    </div>
  );
}

export default App;
