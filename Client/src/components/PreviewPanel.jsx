import { useEffect, useState } from 'react'
import { FolderTreeIcon, MessageSquareIcon } from 'lucide-react'
import FileExplorer from './FileExplorer'
import SandpackErrorModal from './SandpackErrorModal'
import { detectDependencies } from '../utils/sandpackUtils'
import { SandpackCodeEditor, SandpackLayout, SandpackPreview, SandpackProvider, useSandpack } from '@codesandbox/sandpack-react'

const previewResources = ['https://cdn.jsdelivr.net/npm/@tailwindcss/browser@4'];

function ProjectCode({ activeFile }) {
  const { sandpack: { activeFile: editorFile, files, setActiveFile } } = useSandpack();

  useEffect(() => {
    if (activeFile !== editorFile && Object.hasOwn(files, activeFile)) {
      setActiveFile(activeFile);
    }
  }, [activeFile, editorFile, files, setActiveFile]);

  return <SandpackCodeEditor showLineNumbers showTabs={false} readOnly />;
}

const PreviewPanel = ({ files = {}, projectId, activeFile, setActiveFile, showCode = false, onShowCode, progress, children }) => {
  const [leftTab, setLeftTab] = useState('chat');
  const fileMap = Object.fromEntries(Object.entries(files).map(([path, file]) => [path, typeof file === 'string' ? file : file?.code ?? file?.content ?? '']));
  const manifestText = fileMap['/package.json'] ?? fileMap['package.json'];
  let manifest = {};
  let invalidManifest = false;
  if (manifestText !== undefined) {
    try {
      manifest = JSON.parse(manifestText);
      if (!manifest || typeof manifest !== 'object' || Array.isArray(manifest)) {
        invalidManifest = true;
        manifest = {};
      }
    } catch {
      invalidManifest = true;
    }
  }
  const declaredDependencies = {
    ...manifest.dependencies,
    ...manifest.devDependencies,
  };
  const detectedDependencies = detectDependencies(fileMap);
  const previewSetup = {
    dependencies: {
      ...Object.fromEntries(Object.entries(detectedDependencies).filter(([name]) => !Object.hasOwn(declaredDependencies, name))),
      ...manifest.dependencies,
    },
    devDependencies: manifest.devDependencies ?? {},
  };

  return (
      <div className='min-h-0 flex-1 flex flex-col overflow-hidden md:flex-row'>

        {/* Left side */}
        {children && <div className="h-1/2 min-h-0 w-full shrink-0 flex flex-col border-b border-zinc-200 bg-white md:h-auto md:w-80 md:border-b-0 md:border-r">
          {progress}
          {/* Sidebar tabs */}
          <div className="flex border-b border-zinc-200">
            <button
              onClick={() => setLeftTab("chat")}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 text-xs font-medium cursor-pointer ${leftTab === "chat" ? "text-zinc-900 border-b-2 border-zinc-900" : "text-zinc-400 hover:text-zinc-700"}`}
            >
              <MessageSquareIcon size={13} /> Chat
            </button>

            <button
              onClick={() => setLeftTab("files")}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 text-xs font-medium cursor-pointer ${leftTab === "files" ? "text-zinc-900 border-b-2 border-zinc-900" : "text-zinc-400 hover:text-zinc-700"}`}
            >
              <FolderTreeIcon size={13} /> Files
            </button>
          </div>
          {/*SideBar Content */}


          <div className='flex-1 overflow-hidden'>
            <div hidden={leftTab !== 'chat'} className='h-full'>
              {children}
            </div>
            {leftTab === 'files' && (
                <FileExplorer
                  files={files}
                  activeFile={activeFile}
                  onFileSelect={setActiveFile}
                />
            )}

          </div>


        </div>}

        {/* Preview/Code area */}
        <main className='min-h-0 min-w-0 flex-1 overflow-hidden' aria-label={showCode ? 'Project code' : 'Project preview'}>
          {invalidManifest ? (
            <p role='alert' className='flex h-full items-center justify-center text-sm text-red-600'>Invalid project package.json.</p>
          ) : Object.keys(files).length > 0 ? (
            <SandpackProvider
              key={projectId}
              template='react'
              files={fileMap}
              customSetup={previewSetup}
              options={{ activeFile, externalResources: previewResources }}
            >
              <SandpackErrorModal onShowCode={onShowCode} />
              <SandpackLayout>
                {showCode ? (
                  <ProjectCode activeFile={activeFile} />
                ) : (
                  <SandpackPreview showOpenInCodeSandbox={false} />
                )}
              </SandpackLayout>
            </SandpackProvider>
          ) : (
            <p className='flex h-full items-center justify-center text-sm text-zinc-500'>
              No project files to preview yet.
            </p>
          )}
        </main>

      </div>
  );
};

export default PreviewPanel;
