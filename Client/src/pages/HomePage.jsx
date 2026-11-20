import { useEffect } from 'react'
import { useAppContext } from '../context/AppContext'
import PromptInput from '../components/PromptInput'
import { homeTags } from '../assets/assets'
import { Link } from 'react-router-dom'
import { ArrowRightIcon, ClockIcon, TrashIcon } from 'lucide-react'
import moment from 'moment'

const HomePage = () => {


  const { user, projects, loadingProjects, generatingProject, loadProjects, handleGenerate, handleDelete, logout } = useAppContext()

  useEffect(() => {
    loadProjects()
  }, [loadProjects])

  return (
    <div className="h-screen overflow-y-scroll text-white font-sans bg-[url('/bg-img.png')]  bg-cover bg-center bg-no-repeat">

      {/* Nav  Tg */}

      <nav className='sticky top-0 z-10 flex items-center justify-between px-6 py-4'>

        <div className='flex items-center gap-2'>

          <img src="/logo.svg" alt="logo" className='size-6' />
          <span className='text-xl font-semibold tracking-tight' >Builder AI</span>

        </div>
        <div className='flex items-center gap-4  text-sm font-medium text-zinc-300'>
          <span>{user?.name}</span>
          <button onClick={logout} className='py-1.5 px-3 border border-white/20 text-white   hover:bg-white/10 text-xs rounded-md cursor-pointer bg-transperent'>
            Sign Out
          </button>

        </div>

      </nav>
      {/* Hero Section */}

      <div className=' flex-1 flex flex-col items-center  justify-center px-6 pb-20 mt-8 xl:mt-28'>

        <div className='w-full  max-w-2xl flex flex-col items-center'>
          {/* Promo Badge */}
          <div className='mb-6 inline-flex max-w-full items-center gap-3 rounded-full border border-white/20 bg-white/10 py-1.5 pl-1.5 pr-4 shadow-sm backdrop-blur-md'>
            <span className='shrink-0 rounded-full bg-white px-2.5 py-1 text-[10px] font-bold tracking-wider text-zinc-900'>PROMO</span>
            <span className='text-xs font-medium text-zinc-200 sm:text-sm'>Crete Your First Projrct For Free</span>
          </div>

          {/* Title */}

          <h1 className='mb-5 text-center text-4xl font-semibold leading-tight tracking-tight text-white sm:text-5xl md:text-6xl'>
            Lets Build Your App Togather
          </h1>
          <p className='mb-8 max-w-xl text-center text-sm leading-relaxed text-zinc-300 sm:text-base md:text-lg'>
            Describe Your idea and Watch AI Design,Structure and launch Your Website instantaly.
          </p>

          {/* Prompt input Feild With glassmorphic Varient */}

          <div className='w-full mt-6'>
            <PromptInput
              onSubmit={handleGenerate}
              loading={generatingProject}
              placeholder="Describe Your Idea"
              varient="glasss"
              autoFocus
            />

          </div>

          {/* Scrolling Marquee Tags */}

          <div className="masked-marquee w-full mt-4 max-w-2xl overflow-hidden py-1">

            <div className="animate-marquee gap-3">
              {homeTags.map((tag, i) => (
                <button key={i} type="button"
                  onClick={() => handleGenerate(tag)}
                  disabled={generatingProject}
                  className="shrink-0 whitespace-nowrap rounded-full border border-white/20 bg-white/5 px-4 py-2 text-xs font-medium text-zinc-300 backdrop-blur-sm transition enabled:cursor-pointer enabled:hover:border-white/40 enabled:hover:bg-white/10 enabled:hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white disabled:cursor-not-allowed disabled:opacity-50"




                >


                  {tag}


                </button>
              ))}


            </div>

          </div>





          {/* All Projects Section */}

          {!loadingProjects && projects.length > 0 && (
            <div className='mt-12 w-full max-w-2xl'>
              <div className='flex items-center justify-between pb-3 mb-3 border-b border-white/10'>
                <p className='text-xs font-medium uppercase text-zinc-100 tracking-widest'>All Projects</p>
                <span className='text-xs font-medium text-zinc-400'>
                  {projects.length} {projects.length === 1 ? "Project" : "Projects"}
                </span>
              </div>
              <div className='space-y-2 max-h-[80vh] overflow-y-auto pr-1'>
                {projects.map((project) => (
                  <div key={project._id} className='group relative flex items-center justify-between gap-2 rounded-lg border border-white/10 bg-white/5 px-4 py-3 text-sm text-zinc-200 transition hover:bg-white/10'>

                    <Link to={`/builder/${project._id}`} className='flex min-w-0 flex-1 items-center gap-10 rounded focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white'>

                    <div className="flex-1 min-w-0 text-left">

                      <p className='truncate text-sm font-medium text-white'>{project.name}</p>
                      <div className="flex flex-wrap items-center gap-3 mt-0.5">

                        <span className='inline-flex items-center gap-1.5 text-xs text-white/60'>
                          <ClockIcon size={14} className='shrink-0' aria-hidden='true' />
                          {moment(project.updatedAt || project.createdAt).fromNow()}
                        </span>

                        <span className='text-xs text-white/60 font-medium'>v{project.version}</span>



                      </div>



                    </div>
                      <ArrowRightIcon size={14} className="shrink-0 text-zinc-200 group-hover:text-white" />
                    </Link>
                    <div className='absolute right-10 flex shrink-0 items-center gap-2'>
                      <button type='button' aria-label={`Delete ${project.name}`} onClick={(e) => {
                        e.stopPropagation();
                        handleDelete(project._id)
                      }} className=' p-1.5 rounded-md text-zinc-200 hover:text-red-400 hover:bg-white/10 opacity-0 group-hover:opacity-100 focus-visible:opacity-100 transition-opacity'>
                        <TrashIcon size={14} className="text-zinc-200 group-hover:text-white" />
                      </button>



                    </div>

                  </div>
                ))}


              </div>


            </div>
          )}


        </div>

      </div>

    </div>
  )
}

export default HomePage
