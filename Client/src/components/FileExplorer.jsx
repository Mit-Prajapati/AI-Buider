import React, { useMemo } from 'react'
import { FileCodeIcon, FileTextIcon, FolderOpenIcon } from 'lucide-react'


function buildTree(paths) {
    const tree = [];

    for (const filePath of paths) {
        const parts = filePath.split('/').filter(Boolean);
        let children = tree;

        parts.forEach((name, index) => {
            const isDir = index < parts.length - 1;
            let node = children.find((entry) => entry.name === name && entry.isDir === isDir);

            if (!node) {
                node = {
                    name,
                    path: !isDir
                        ? filePath
                        : `${filePath.startsWith('/') ? '/' : ''}${parts.slice(0, index + 1).join('/')}`,
                    isDir,
                    children: [],
                };
                children.push(node);
            }

            children = node.children;
        });
    }

    return tree;
}

function getFileIcon(name) {
    if (name.endsWith('.css')) return <FileTextIcon size={14} className='shrink-0 text-sky-500' />;
    if (name.endsWith('.jsx') || name.endsWith('.js')) return <FileCodeIcon size={14} className='shrink-0 text-amber-500' />;
    if (name.endsWith('.json')) return <FileTextIcon size={14} className='shrink-0 text-emerald-500' />;
    return <FileTextIcon size={14} className='shrink-0 text-zinc-400' />;
}

const TreeItem = ({ node, activeFile, onFileSelect, depth = 0 }) => {
    const isActive = node.path === activeFile;

    if (node.isDir) {
        return (
            <div>
                <div
                    className='flex items-center gap-2 py-1 px-2 text-xs text-zinc-400 select-none'
                    style={{ paddingLeft: `${depth * 12 + 8}px` }}
                    title={node.path}
                >
                    <FolderOpenIcon size={34} className='shrink-0 text-zinc-800 opacity-60' />
                    <span className='truncate'>{node.name}</span>
                </div>
                {node.children.map((child) => (
                    <TreeItem
                        key={child.path}
                        node={child}
                        activeFile={activeFile}
                        onFileSelect={onFileSelect}
                        depth={depth + 1}
                    />
                ))}
            </div>
        )
    }

    return (
        <button
            type='button'
            onClick={() => onFileSelect(node.path)}
            aria-current={isActive ? 'true' : undefined}
            title={node.path}
            style={{ paddingLeft: `${depth * 12 + 8}px` }}
            className={`flex w-full items-center gap-2 rounded px-2 py-1 text-left text-xs cursor-pointer ${isActive ? 'bg-zinc-100 font-medium text-zinc-900' : 'text-zinc-600 hover:bg-zinc-50 hover:text-zinc-900'}`}
        >
            {getFileIcon(node.name)}
            <span className='truncate'>{node.name}</span>
        </button>
    )
}

const FileExplorer = ({ files, activeFile, onFileSelect }) => {


    const tree = useMemo(() => buildTree(Object.keys(files)), [files])

    return (
        <div className='h-full overflow-y-auto bg-white py-3'>
            <p className='px-4 mb-2 text-xs font-medium uppercase tracking-wide text-zinc-400'>Files</p>
            {tree.map((node) => (
                <TreeItem
                    key={node.path}
                    node={node}
                    activeFile={activeFile}
                    onFileSelect={onFileSelect}
                />
            ))}
        </div>
    )
}

export default FileExplorer
