import { CheckCircle2Icon, CircleAlertIcon, Loader2Icon } from 'lucide-react';

const busyStatuses = ['pending', 'generating', 'updating', 'revising'];

export default function AgentProgressDashboard({ project, busy = false }) {
  const status = project.status;
  const failed = status === 'failed' || status === 'error';
  const running = busy || busyStatuses.includes(status);
  const complete = ['completed', 'ready'].includes(status);
  const title = failed ? 'Project needs attention' : running ? 'Working on your project' : complete ? 'Project ready' : 'Project status';
  const Icon = failed ? CircleAlertIcon : running ? Loader2Icon : CheckCircle2Icon;

  return (
    <section aria-label='Agent progress' className='shrink-0 border-b border-zinc-200 bg-zinc-50 px-4 py-3'>
      <div role='status' className='flex items-center gap-2 text-sm font-semibold'>
        <Icon size={16} aria-hidden='true' className={running ? 'animate-spin' : failed ? 'text-red-600' : 'text-zinc-600'} />
        {title}
      </div>
      <p className='mt-1 text-xs text-zinc-500'>
        {failed ? 'Review the conversation and send a new request to try again.' : running ? 'Updates will appear here as the project changes.' : `${Object.keys(project.files || {}).length} files · Version ${project.version ?? 1}`}
      </p>
    </section>
  );
}
