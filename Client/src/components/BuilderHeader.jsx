import { ArrowLeftIcon, CodeIcon, DownloadIcon, ExternalLink, EyeIcon, GlobeIcon, Loader2Icon } from 'lucide-react'
import React from 'react'

const BuilderHeader = ({
    projectName,
    version,
    showCode,
    publishing,
    exporting = false,
    onToggleShowCode,
    onOpenPreview,
    onPublish,
    onDownload,
    onBack,
    onLogout,
}) => {
    return (
        <header className="h-12 shrink-0 flex items-center justify-between gap-2 border-b  px-3 border-zinc-200 bg-white">

            <div className="flex items-center gap-2">
                <button
                    onClick={onBack}
                    className="p-1.5 rounded-md text-zinc-400 hover:text-zinc-100 cursor-pointer">
                    <ArrowLeftIcon size={18} className="text-zinc-400 hover:text-zinc-600" aria-hidden="true" />
                </button>
                <img src="/logo.svg" alt="" className="invert size-5" />
                <span className="text-sm font-semibold truncate max-w-38">
                    v{version}
                </span>
            </div>

            <div className="flex items-center gap-1.5">
                <button onClick={onToggleShowCode}
                    className={`inline-flex items-center  justify-center gap1.5 py-1.5 px-3 border border-zinc-200 text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900 text-xs font-medium rounded-lg cursor-pointer bg-white ${showCode ? "bg-zinc-100 text-zinc-900" : ""}`}
                >
                    {
                        showCode ? (
                            <>
                                <EyeIcon size={13} /> Preview
                            </>
                        ) : (
                            <>
                                <CodeIcon size={13} /> Code
                            </>
                        )
                    }

                </button>

                <button
                    onClick={onOpenPreview}
                    className="inline-flex items-center  justify-center gap1.5 py-1.5 px-3 border border-zinc-200 text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900 text-xs font-medium rounded-lg cursor-pointer bg-white">

                    <ExternalLink size={13} /> Open Preview

                </button>

                <button
                    onClick={onPublish} disabled={publishing}
                    className="inline-flex items-center  justify-center gap1.5 py-1.5 px-3 border border-zinc-200 text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900 text-xs font-medium rounded-lg cursor-pointer bg-white"
                >
                    {publishing ? <Loader2Icon size={13} className='animate-spin' /> : <GlobeIcon size={13} />} Publish
                </button>

                <button
                    onClick={onDownload}
                    disabled={exporting}
                    aria-busy={exporting}
                    className='inline-flex items-center  justify-center gap1.5 py-1.5 px-3 border border-zinc-200 text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900 text-xs font-medium rounded-lg cursor-pointer bg-white disabled:opacity-50 disabled:cursor-wait'
                >
                    {exporting ? <Loader2Icon size={13} className='animate-spin' /> : <DownloadIcon size={13} />}
                    {exporting ? 'Exporting...' : 'Export'}

                </button>


                <button
                    onClick={onLogout}
                    className='inline-flex items-center  justify-center gap1.5 py-1.5 px-3 border border-zinc-200 text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900 text-xs font-medium rounded-lg cursor-pointer bg-white'
                >
                    Sign Out

                </button>


            </div>

        </header>
    )
}

export default BuilderHeader
