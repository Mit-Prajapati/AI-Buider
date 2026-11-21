import { useEffect, useRef } from 'react'
import { XIcon } from 'lucide-react'
import toast from 'react-hot-toast'

const PublishDialog = ({ url, onClose }) => {
  const dialogRef = useRef(null);
  const linkRef = useRef(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    dialog.showModal();
    return () => dialog.close();
  }, []);

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(url);
      toast.success('Public link copied to clipboard!');
    } catch {
      if (!linkRef.current) return;
      linkRef.current.focus();
      linkRef.current.select();
      toast.error('Could not copy automatically. Copy the selected link.');
    }
  };

  return (
    <dialog
      ref={dialogRef}
      aria-labelledby="publish-title"
      aria-describedby="publish-description"
      onCancel={onClose}
      onClick={(event) => {
        if (event.target === event.currentTarget) {
          const bounds = event.currentTarget.getBoundingClientRect();
          if (event.clientX < bounds.left || event.clientX > bounds.right || event.clientY < bounds.top || event.clientY > bounds.bottom) onClose();
        }
      }}
      className="fixed inset-0 m-auto w-[calc(100%-2rem)] max-w-md rounded-xl border border-zinc-200 bg-white p-6 text-zinc-900 shadow-2xl backdrop:bg-black/40 backdrop:backdrop-blur-sm"
    >
      <button type="button" onClick={onClose} aria-label="Close publish dialog" className="absolute right-3 top-3 rounded-md p-1.5 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-700 focus-visible:outline-2 focus-visible:outline-zinc-900">
        <XIcon size={16} />
      </button>
      <h2 id="publish-title" className="pr-6 text-lg font-semibold">Your website is live!</h2>
      <p id="publish-description" className="mt-1 text-sm text-zinc-500">View your published website using the link below.</p>
      <label htmlFor="published-link" className="mt-6 block text-[10px] font-semibold uppercase tracking-wider text-zinc-400">Published link</label>
      <input ref={linkRef} id="published-link" value={url} readOnly onFocus={(event) => event.target.select()} className="mt-2 w-full border-b border-zinc-200 bg-transparent pb-2 text-sm outline-none focus:border-zinc-900" />
      <div className="mt-5 grid grid-cols-2 gap-2">
        <button type="button" onClick={copyLink} className="rounded-lg bg-zinc-950 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-zinc-900">Copy Link</button>
        <a href={url} target="_blank" rel="noopener noreferrer" className="rounded-lg border border-zinc-200 px-4 py-2 text-center text-sm font-medium hover:bg-zinc-50 focus-visible:outline-2 focus-visible:outline-zinc-900">Open Site</a>
      </div>
    </dialog>
  );
};

export default PublishDialog;
