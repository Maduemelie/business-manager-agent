import CopyButton from './CopyButton';

export default function WhatsAppTab({ sequence }) {
  return (
    <div className="whatsapp-container">
        <p className="whatsapp-subtitle">
            Post these throughout the day to stay visible on your WhatsApp Status.
        </p>
        {sequence?.map((status, index) => (
            <div key={index} className="whatsapp-card">
                <div className="whatsapp-time">{status.time}</div>
                <div className="whatsapp-content">{status.content}</div>
                
                {status.image_suggestion && (
                    <div className="whatsapp-suggestion-block">
                        <strong>📸 Visual Idea:</strong> {status.image_suggestion}
                    </div>
                )}

                <CopyButton text={status.content} />
            </div>
        ))}
    </div>
  );
}
