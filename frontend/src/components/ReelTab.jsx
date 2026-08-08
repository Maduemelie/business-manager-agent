import { Video } from 'lucide-react';

export default function ReelTab({ reelScript }) {
  return (
    <div className="reel-container">
        <div className="reel-title-bar">
            <Video size={24} />
            <h3>Today's Video Concept</h3>
        </div>
        <div className="reel-script-text">
            {reelScript}
        </div>
    </div>
  );
}
