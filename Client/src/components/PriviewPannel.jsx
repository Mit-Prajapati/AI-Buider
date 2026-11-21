import { useEffect, useState } from 'react'
import { FolderTreeIcon, MessageSquareIcon } from 'lucide-react'
import FileExplorer from './FileExplorer'
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

const PriviewPannel = ({ files = {}, projectId, activeFile, setActiveFile, showCode = false, children }) => {
  const [leftTab, setLeftTab] = useState('chat');

  return (
      <div className='flex-1 flex overflow-hidden'>

        {/* Left side */}
        {children && <div className="w-80 shrink-0 flex flex-col border-r border-zinc-200 bg-white">
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
            {
              leftTab === 'chat' ? (
                children
              ) : (
                <FileExplorer
                  files={files}
                  activeFile={activeFile}
                  onFileSelect={setActiveFile}
                />
              )
            }

          </div>


        </div>}

        {/* Preview/Code area */}
        <main className='min-w-0 flex-1 overflow-hidden' aria-label={showCode ? 'Project code' : 'Project preview'}>
          {Object.keys(files).length > 0 ? (
            <SandpackProvider
              key={projectId}
              template='react'
              files={files}
              options={{ activeFile, externalResources: previewResources }}
            >
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

export default PriviewPannel;
