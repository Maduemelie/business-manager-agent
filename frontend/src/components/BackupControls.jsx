import { useState, useRef } from 'react';
import { Download, Upload, Trash2, CheckCircle2, AlertCircle } from 'lucide-react';
import { exportAppData, downloadBackupFile, importAppData } from '../services/backupService';
import { clearAllStores } from '../services/db';

/**
 * Backup controls component providing Export, Import, and Clear Data functionality.
 * Features luxury glassmorphic styling, responsive layout, and clean user feedback.
 * 
 * @param {Object} props
 * @param {Function} [props.onDataRestored] - Callback triggered when data is successfully imported or cleared
 */
export default function BackupControls({ onDataRestored }) {
  const [isExporting, setIsExporting] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [feedback, setFeedback] = useState(null); // { type: 'success' | 'error', text: string }
  const fileInputRef = useRef(null);

  const clearFeedbackAfterDelay = () => {
    setTimeout(() => {
      setFeedback((current) => (current?.type === 'success' ? null : current));
    }, 5000);
  };

  const handleExport = async () => {
    try {
      setIsExporting(true);
      setFeedback(null);
      const payload = await exportAppData();
      downloadBackupFile(payload);
      setFeedback({
        type: 'success',
        text: 'Backup exported successfully! File downloaded.'
      });
      clearFeedbackAfterDelay();
    } catch (err) {
      console.error('Export error:', err);
      setFeedback({
        type: 'error',
        text: `Export failed: ${err.message || 'Unknown error occurred.'}`
      });
    } finally {
      setIsExporting(false);
    }
  };

  const handleFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setIsImporting(true);
      setFeedback(null);

      const fileContent = await file.text();
      const result = await importAppData(fileContent);

      if (result.success) {
        setFeedback({
          type: 'success',
          text: `Import successful! Restored ${result.stats.posts} posts and ${result.stats.perfumes} perfumes.`
        });
        clearFeedbackAfterDelay();

        if (typeof onDataRestored === 'function') {
          await onDataRestored();
        }
      }
    } catch (err) {
      console.error('Import error:', err);
      setFeedback({
        type: 'error',
        text: `Import failed: ${err.message || 'Invalid backup file or corrupted format.'}`
      });
    } finally {
      setIsImporting(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleClearData = async () => {
    const confirmed = window.confirm(
      'Are you sure you want to clear all local data? This will reset your catalog, posts, and history.'
    );
    if (!confirmed) return;

    try {
      setFeedback(null);
      await clearAllStores();
      setFeedback({
        type: 'success',
        text: 'All local database stores have been cleared.'
      });
      clearFeedbackAfterDelay();

      if (typeof onDataRestored === 'function') {
        await onDataRestored();
      }
    } catch (err) {
      console.error('Clear data error:', err);
      setFeedback({
        type: 'error',
        text: `Failed to clear storage: ${err.message}`
      });
    }
  };

  return (
    <div className="backup-controls-wrapper" data-testid="backup-controls">
      <div className="backup-buttons-group">
        <button
          className="btn-backup-action btn-export"
          data-testid="export-backup-btn"
          onClick={handleExport}
          disabled={isExporting || isImporting}
          title="Export complete database backup as JSON"
        >
          <Download size={16} aria-hidden="true" />
          <span>{isExporting ? 'Exporting...' : 'Export Backup'}</span>
        </button>

        <button
          className="btn-backup-action btn-import"
          data-testid="import-backup-btn"
          onClick={() => fileInputRef.current?.click()}
          disabled={isExporting || isImporting}
          title="Import database backup from JSON file"
        >
          <Upload size={16} aria-hidden="true" />
          <span>{isImporting ? 'Importing...' : 'Import Backup'}</span>
        </button>

        <input
          ref={fileInputRef}
          type="file"
          accept=".json,application/json"
          style={{ display: 'none' }}
          data-testid="import-backup-input"
          id="backup-file-input"
          aria-label="Upload Backup JSON File"
          onChange={handleFileChange}
        />

        <button
          className="btn-backup-action btn-clear"
          data-testid="clear-data-btn"
          onClick={handleClearData}
          disabled={isExporting || isImporting}
          title="Clear all local data"
        >
          <Trash2 size={16} aria-hidden="true" />
          <span>Clear Data</span>
        </button>
      </div>

      {feedback && (
        <div
          className={
            feedback.type === 'success'
              ? 'backup-message success-message'
              : 'backup-error error-message-panel error-banner'
          }
          data-testid={feedback.type === 'success' ? 'backup-message' : 'backup-error'}
          role={feedback.type === 'success' ? 'status' : 'alert'}
          aria-live="polite"
        >
          {feedback.type === 'success' ? (
            <CheckCircle2 size={18} className="feedback-icon" aria-hidden="true" />
          ) : (
            <AlertCircle size={18} className="feedback-icon" aria-hidden="true" />
          )}
          <span className="feedback-text">{feedback.text}</span>
        </div>
      )}
    </div>
  );
}
