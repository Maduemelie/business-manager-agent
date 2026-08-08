import { Sparkles, Loader2 } from 'lucide-react';

export default function GenerateButton({ loading, onGenerate }) {
  return (
    <button 
      className="btn-primary" 
      onClick={onGenerate} 
      disabled={loading}
    >
      {loading ? (
        <>
          <Loader2 className="spinner" size={24} />
          Crafting Daily Packet...
        </>
      ) : (
        <>
          <Sparkles size={24} />
          Execute Today's Blueprint
        </>
      )}
    </button>
  );
}
