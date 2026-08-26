import { useState } from 'react';
import Header from './components/Header';
import OfflineStatusBanner from './components/OfflineStatusBanner';
import BackupControls from './components/BackupControls';
import GenerateButton from './components/GenerateButton';
import ErrorMessage from './components/ErrorMessage';
import ContentPanel from './components/ContentPanel';
import PlaceholderState from './components/PlaceholderState';
import { useContentGenerator } from './hooks/useContentGenerator';
import './index.css';

function App() {
  const { loading, postData, error, generateContent, reloadContent } = useContentGenerator();
  const [activeTab, setActiveTab] = useState('main');

  const handleGenerate = async () => {
    const perfumeId = postData?.perfume_id;
    await generateContent(perfumeId);
    setActiveTab('main'); // Reset tab switcher back to main feed
  };

  const handleDataRestored = async () => {
    await reloadContent();
    setActiveTab('main');
  };

  return (
    <div className="dashboard-container">
      <Header />
      <OfflineStatusBanner />
      <BackupControls onDataRestored={handleDataRestored} />
      
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
    </div>
  );
}

export default App;
