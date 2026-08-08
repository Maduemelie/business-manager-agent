import { Image as ImageIcon } from 'lucide-react';

export default function PlaceholderState() {
  return (
    <div className="glass-panel placeholder-panel-wrapper">
       <div className="placeholder-state">
          <ImageIcon size={48} className="placeholder-icon" />
          <h3>No Blueprint Executed Yet</h3>
          <p>Click the button above to generate today's entire content packet.</p>
       </div>
    </div>
  );
}
