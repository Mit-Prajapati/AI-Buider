import { BotIcon, BotMessageSquare, BotMessageSquareIcon, UserIcon } from 'lucide-react'
import React, { useEffect, useRef } from 'react'
import PromptInput from './PromptInput'

const ChatPannel = ({ messages, onSend, loading }) => {

    const bottomref = useRef(null)

    useEffect(() => {
        bottomref.current?.scrollIntoView({ behavior: "auto" })
    }, [messages, loading])
    return (
        <div className='flex h-full flex-col bg-white m-3 '>
            {/* Messages */}
            <div className='min-h-0 flex-1 overflow-y-auto p-4 '>
                {messages.length === 0 && (
                    <div className='flex h-full items-center justify-center text-center ' >
                        <p className='text-sm text-zinc-400 '>Ask Ai to Modify Your Website</p>
                    </div>
                )}


                {messages.map((msg, i) => {
                    return <div key={i} className='mb-4'>
                        <div className='flex items-start gap-3'>
                            <div className='flex size-7 shrink-0 items-center justify-center rounded-full bg-zinc-100'>
                                {msg.role === "user" ? (
                                    <UserIcon size={14} className='text-zinc-700' />
                                ) : (
                                    <BotMessageSquareIcon size={14} className='text-zinc-700' />
                                )}
                            </div>
                            <div className='flex-1 min-w-0'>

                                <p>
                                    {msg.role === "user" ? "you" : "AI"}
                                </p>
                                <p className='text-sm leading-relaxed text-zinc-700 whitespace-pre-wrap break-words'>

                                    {msg.content.split("-`/").map((text, partIndex) => (
                                        <span key={partIndex} className='block'>
                                            <span className='text-zinc-400'> </span>
                                            {text}
                                        </span>


                                    ))}

                                </p>



                            </div>

                        </div>
                    </div>
                })}

                {loading && (
                    <div className='flex items-start gap-3'>
                        <div className='flex size-7 shrink-0 items-center justify-center rounded-full bg-zinc-100'>
                            <BotIcon size={13} className='text-zinc-900' />
                        </div>
                        <div className='flex-1'>
                            <p className=''>AI</p>
                            <div className='dot-loader'>
                                <span></span>
                                <span></span>
                                <span></span>

                            </div>
                        </div>
                    </div>
                )}
                <div ref={bottomref} />

            </div>

            {/* //Input Feild */}
            <div className=''>
                <PromptInput onSubmit={onSend} loading={loading} placeholder='Ask AI to Modify' autoFocus />
            </div>

        </div>
    )
}

export default ChatPannel
