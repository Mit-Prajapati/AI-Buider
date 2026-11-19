import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Eye, EyeOff, Loader2 } from 'lucide-react'
import LoginLeft from '../components/LoginLeft';
import { useAppContext } from '../context/AppContext';

const AuthPage = ({ mode }) => {
  const { login, register } = useAppContext();
  const navigate = useNavigate();

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const isLogin = mode === "login";

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (loading) return;
    setError("");
    setLoading(true);

    try {
      if (isLogin) {
        await login(email, password);
      } else {
        await register(name, email, password);
      }
      navigate("/", { replace: true });
    } catch (err) {
      setError(err.message || "Unable to submit. Please try again.");
    } finally {
      setLoading(false);
    }
  }
  return (
    <div className='min-h-screen bg-white flex text-zinc-900 font-sans'>
      {/* Left Pannel Branding */}
      <LoginLeft />


      {/* Right  Pannel Form */}
      <div className='flex-1 flex items-center justify-center p-8 ' >
        <div className='w-full max-w-sm'>

          <div className='mb-10'>
            <h1 className='text-3xl font-medium tracking-tight text-zinc-900 mb-1.5 font-sans'>{isLogin ? "Sign in" : "Create an Account"}</h1>
            <p className='text-sm text-zinc-400'>
              {isLogin ? "Enter Your Crenditionals To access The WebsiteBuilder." : "Get Started By the Entering Your registraction Details."}
            </p>

          </div>

          {error && <div role='alert' className='mb-6 p-3 border border-red-200 bg-red-50 text-red-700 text-xs rounded'>{error}</div>}
          <form className='space-y-6' onSubmit={handleSubmit}>
            <div>
              <label htmlFor='name' className='block text-sm font-medium text-zinc-900 mb-2'>Name</label>
              <input
                id='name'
                name='name'
                type='text'
                required
                autoComplete='name'
                placeholder='Enter your full name'
                value={name}
                onChange={(event) => setName(event.target.value)}
                className='w-full rounded-lg border border-zinc-200 bg-white px-4 py-3 text-sm text-zinc-900 placeholder:text-zinc-400 outline-none transition focus:border-zinc-900 focus:ring-2 focus:ring-zinc-900/10'
              />
            </div>

            <div>
              <label htmlFor='email' className='block text-sm font-medium text-zinc-900 mb-2'>Email</label>
              <input
                id='email'
                name='email'
                type='email'
                required
                autoComplete='email'
                placeholder='Enter your email address'
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                className='w-full rounded-lg border border-zinc-200 bg-white px-4 py-3 text-sm text-zinc-900 placeholder:text-zinc-400 outline-none transition focus:border-zinc-900 focus:ring-2 focus:ring-zinc-900/10'
              />
            </div>

            <div>
              <label htmlFor='password' className='block text-sm font-medium text-zinc-900 mb-2'>Password</label>
              <div className='relative'>
                <input
                  id='password'
                  name='password'
                  type={showPassword ? 'text' : 'password'}
                  required
                  autoComplete={isLogin ? 'current-password' : 'new-password'}
                  placeholder='Enter your password'
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  className='w-full rounded-lg border border-zinc-200 bg-white pl-4 pr-12 py-3 text-sm text-zinc-900 placeholder:text-zinc-400 outline-none transition focus:border-zinc-900 focus:ring-2 focus:ring-zinc-900/10'
                />
                <button
                  type='button'
                  onClick={() => setShowPassword((visible) => !visible)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  aria-pressed={showPassword}
                  aria-controls='password'
                  className='absolute right-1 top-1/2 -translate-y-1/2 flex size-10 items-center justify-center rounded-md text-zinc-400 transition hover:text-zinc-900 focus-visible:outline-2 focus-visible:outline-zinc-900 cursor-pointer'
                >
                  {showPassword ? <EyeOff size={18} aria-hidden='true' /> : <Eye size={18} aria-hidden='true' />}
                </button>
              </div>
            </div>

            <button
              type='submit'
              disabled={loading}
              aria-busy={loading}
              className='flex w-full items-center justify-center gap-2 rounded-lg bg-orange-600 px-4 py-3 text-sm font-medium text-white shadow-sm transition duration-200 ease-out enabled:hover:bg-orange-700 enabled:hover:shadow-md motion-safe:enabled:hover:-translate-y-0.5 motion-safe:enabled:active:translate-y-0 motion-safe:enabled:active:scale-[0.98] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-orange-600 disabled:opacity-50 disabled:cursor-not-allowed motion-reduce:transition-none cursor-pointer'
            >
              {loading && <Loader2 size={18} className='motion-safe:animate-spin' aria-hidden='true' />}
              {loading ? 'Please wait...' : isLogin ? 'Sign in' : 'Create an Account'}
            </button>
          </form>

          <p className='mt-6 text-sm text-zinc-400'>
            {isLogin ? (
              <>
                New to Builder AI? {""}
                <Link to="/ragister" className="text-zinc-900 font-medium hover:underline">
                  Create An Account :)
                </Link>
              </>
            ) :
              (
                <>
                  Already Have an Accouunt ?   {""}
                  <Link to="/" className="text-zinc-900 font-medium hover:underline">
                    Sign in here :)
                  </Link>

                </>
              )
            }
          </p>

        </div>
      </div>

    </div>
  )
}

export default AuthPage
