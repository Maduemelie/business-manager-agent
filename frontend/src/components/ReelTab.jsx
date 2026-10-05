import { Video } from 'lucide-react';
import CopyButton from './CopyButton';

export default function ReelTab({ reelScript }) {
  return (
    <div className="reel-container">
        <div className="reel-title-bar">
            <div className="reel-title-left">
                <Video size={24} />
                <h3>Today's Video Concept</h3>
            </div>
            {reelScript && <CopyButton text={reelScript} label="Copy Concept" />}
        </div>
        <div className="reel-script-text">
            {reelScript}
        </div>
    </div>
  );
}
