import { useEffect, useRef, useState } from 'react'
import { ArrowRightIcon, CloudUploadIcon, Loader2Icon, MicIcon } from 'lucide-react'

const PromptInput = ({ onSubmit, onFileChange, onMicClick, loading = false, placeholder = "Describe the website you want to build", large = false, autoFocus = false, varient = "default" }) => {


    const [value, setValue] = useState("");
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState("");
    const submitInProgress = useRef(false);
    const textareaRef = useRef(null);
    const busy = loading || submitting;


    useEffect(() => {
        if (autoFocus && textareaRef.current) {
            textareaRef.current.focus();
        }
    }, [autoFocus]);

    const handleSubmit = async (event) => {
        event.preventDefault();
        const prompt = value.trim();
        if (!prompt || loading || submitInProgress.current) return;

        if (typeof onSubmit !== "function") {
            setError("Unable to submit: no submit handler is configured.");
            return;
        }

        submitInProgress.current = true;
        setSubmitting(true);
        setError("");
        try {
            const result = await onSubmit(prompt);
            if (result !== false) setValue("");
        } catch (err) {
            setError(err?.response?.data?.error || err?.message || "Unable to submit. Please try again.");
        } finally {
            submitInProgress.current = false;
            setSubmitting(false);
        }
    };

    const handleKeyDown = (event) => {
        if (event.key !== "Enter" || event.shiftKey || event.nativeEvent.isComposing || event.keyCode === 229) return;

        event.preventDefault();
        if (event.repeat || busy || submitInProgress.current) return;
        event.currentTarget.form?.requestSubmit();
    };

    if (varient === "glasss") {
        return (
            <form onSubmit={handleSubmit} className='w-full' aria-busy={busy}>
                <div className={`rounded-2xl border p-3 shadow-sm transition focus-within:ring-2 border-white/20 bg-white/10 text-white backdrop-blur-md focus-within:ring-white/30`}>
                    <textarea
                        ref={textareaRef}
                        aria-label='Website description'
                        value={value}
                        onChange={(event) => setValue(event.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder={placeholder}
                        autoFocus={autoFocus}
                        disabled={busy}
                        rows={large ? 5 : 3}
                        className={`block w-full resize-y bg-transparent p-2 text-sm leading-relaxed outline-none disabled:opacity-60 sm:text-base placeholder:text-zinc-300`}
                    />
                    <div className='mt-2 flex items-center justify-between gap-3'>
                        <label className={`relative flex size-10 items-center justify-center rounded-xl transition focus-within:ring-2 focus-within:ring-zinc-400 ${busy || !onFileChange ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'} text-zinc-200 hover:bg-white/10`} title={onFileChange ? 'Upload a reference file' : 'File upload is not connected yet'}>
                            <CloudUploadIcon size={18} aria-hidden='true' />
                            <input
                                type='file'
                                aria-label='Upload a reference file'
                                onChange={onFileChange}
                                disabled={busy || !onFileChange}
                                className='absolute inset-0 w-full cursor-pointer opacity-0 disabled:cursor-not-allowed'
                            />
                        </label>
                        <div className='flex items-center gap-2'>
                            <button
                                type='button'
                                onClick={onMicClick}
                                disabled={busy || !onMicClick}
                                aria-label='Use microphone'
                                title={onMicClick ? 'Use microphone' : 'Microphone is not connected yet'}
                                className={`flex size-10 items-center justify-center rounded-xl transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-zinc-400 disabled:cursor-not-allowed disabled:opacity-50 text-zinc-200 hover:bg-white/10`}
                            >
                                <MicIcon size={18} aria-hidden='true' />
                            </button>
                            <button
                                type='submit'
                                disabled={busy || !value.trim()}
                                aria-label={busy ? 'Submitting prompt' : 'Submit prompt'}
                                className='flex size-10 items-center justify-center rounded-xl bg-white text-zinc-900 shadow-sm ring-1 ring-zinc-200 transition hover:bg-zinc-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-zinc-400 disabled:cursor-not-allowed disabled:opacity-50'
                            >
                                {busy ? <Loader2Icon size={18} className='animate-spin' aria-hidden='true' /> : <ArrowRightIcon size={18} aria-hidden='true' />}
                            </button>
                        </div>
                    </div>
                </div>
                {error && <p role='alert' className='mt-2 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700'>{error}</p>}
            </form>
        )
    }



    return (
        <form onSubmit={handleSubmit} aria-busy={busy} className={`bg-white border border-zinc-200 rounded-xl flex flex-wrap items-end gap-2  focus-within:ring-1  focus-within:ring-zinc-300 transition ${large ? "p-4" : "p-3"}`}>

            <textarea
                ref={textareaRef}
                aria-label='Website description'
                value={value}
                onChange={(event) => setValue(event.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={placeholder}
                autoFocus={autoFocus}
                disabled={busy}
                rows={large ? 5 : 1}
                className={`block min-w-0 flex-1 resize-none bg-transparent text-zinc-900 leading-relaxed outline-none placeholder:text-zinc-400 disabled:cursor-not-allowed disabled:opacity-60 ${large ? 'min-h-32 p-2 text-base' : 'min-h-10 px-2 py-2 text-sm'}`}
            />

            <button type='submit'
                aria-label={busy ? 'Submitting prompt' : 'Submit prompt'}
                disabled={!value.trim() || busy}
                className={`flex shrink-0 items-center justify-center rounded-lg bg-orange-600 text-white transition enabled:hover:bg-orange-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-orange-600 disabled:cursor-not-allowed disabled:opacity-50 ${large ? 'size-12' : 'size-10'}`}
                style={{
                    width: large ? 36 : 24,
                    height: large ? 36 : 24,
                }}>
                {busy ? <Loader2Icon size={large ? 20 : 15} className='animate-spin' /> :
                    <ArrowRightIcon size={large ? 20 : 15} />
                }
            </button>



            {error && <p role='alert' className='w-full rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700'>{error}</p>}
        </form>
    )
}




export default PromptInput
