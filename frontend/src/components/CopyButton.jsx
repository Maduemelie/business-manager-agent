import { useState } from 'react';
import { Copy, CheckCircle2 } from 'lucide-react';

export default function CopyButton({ text, label }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <button className="copy-btn" onClick={handleCopy}>
      {copied ? <CheckCircle2 size={18} color="#a78bfa" /> : <Copy size={18} />}
      {label && <span className="copy-btn-label">{label}</span>}
    </button>
  );
}
