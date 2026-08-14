import { Sparkles, Loader2, RotateCcw } from 'lucide-react';

export default function GenerateButton({ loading, onGenerate, perfumeName }) {
  return (
    <button 
      className="btn-primary" 
      onClick={onGenerate} 
      disabled={loading}
    >
      {loading ? (
        <>
          <Loader2 className="spinner" size={24} />
          {perfumeName ? `Regenerating for ${perfumeName}...` : 'Crafting Daily Packet...'}
        </>
      ) : perfumeName ? (
        <>
          <RotateCcw size={24} />
          Regenerate Blueprint ({perfumeName})
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
