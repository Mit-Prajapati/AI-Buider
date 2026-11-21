import { useEffect, useRef, useState } from 'react';
import { useSandpack } from '@codesandbox/sandpack-react';
import { XIcon } from 'lucide-react';

function ErrorDialog({ error, onClose, onRetry, onShowCode }) {
  const dialogRef = useRef(null);
  const [retrying, setRetrying] = useState(false);
  const [retryError, setRetryError] = useState('');

  useEffect(() => {
    const dialog = dialogRef.current;
    dialog.showModal();
    return () => dialog.close();
  }, []);

  const retry = async () => {
    setRetrying(true);
    setRetryError('');
    try {
      await onRetry();
      onClose();
    } catch {
      setRetryError('Could not restart the preview. Please try again.');
    } finally {
      setRetrying(false);
    }
  };

  return (
    <dialog ref={dialogRef} onCancel={onClose} aria-labelledby='preview-error-title' className='fixed inset-0 m-auto w-[calc(100%-2rem)] max-w-lg rounded-xl border border-zinc-200 bg-white p-6 text-zinc-900 shadow-xl backdrop:bg-black/40'>
      <button onClick={onClose} aria-label='Close preview error' className='absolute right-3 top-3 rounded p-2 hover:bg-zinc-100'><XIcon size={16} /></button>
      <h2 id='preview-error-title' className='pr-8 text-lg font-semibold'>Preview could not run</h2>
      <p className='mt-2 text-sm text-zinc-500'>Review the error below. You can inspect the code or ask for a correction in chat.</p>
      <pre className='my-4 max-h-64 overflow-auto whitespace-pre-wrap break-words rounded-lg bg-red-50 p-3 text-xs text-red-800'>{error.message || error.title || 'An unexpected preview error occurred.'}</pre>
      {retryError && <p role='alert' className='mb-3 text-sm text-red-600'>{retryError}</p>}
      <div className='flex flex-wrap gap-2'>
        <button disabled={retrying} onClick={retry} className='rounded-lg bg-zinc-950 px-4 py-2 text-sm text-white disabled:opacity-50'>{retrying ? 'Restarting…' : 'Retry preview'}</button>
        {onShowCode && <button onClick={() => { onShowCode(); onClose(); }} className='rounded-lg border border-zinc-200 px-4 py-2 text-sm'>View code</button>}
      </div>
    </dialog>
  );
}

export default function SandpackErrorModal({ onShowCode }) {
  const { sandpack } = useSandpack();
  const [dismissedError, setDismissedError] = useState(null);
  const error = sandpack.error;
  if (!error || error === dismissedError) return null;
  return <ErrorDialog error={error} onClose={() => setDismissedError(error)} onRetry={sandpack.runSandpack} onShowCode={onShowCode} />;
}
