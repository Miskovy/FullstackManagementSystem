"use client"

import { useSearchParams } from "next/navigation"
import { login, signup } from "./actions"
import { useState, Suspense } from "react"

function LoginForm() {
  const searchParams = useSearchParams()
  const error = searchParams.get("error")
  const [isLogin, setIsLogin] = useState(true)

  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-24 bg-zinc-950 text-white">
      <div className="w-full max-w-sm rounded-lg border border-zinc-800 bg-zinc-900 p-8 shadow-xl">
        <h1 className="text-2xl font-semibold tracking-tight text-center mb-6">
          {isLogin ? "Welcome back" : "Create an account"}
        </h1>
        {error && (
            <div className="mb-4 bg-red-900/50 text-red-400 p-3 rounded-md text-sm text-center">
                {error}
            </div>
        )}
        <form className="space-y-4">
          {!isLogin && (
             <div className="space-y-2">
               <label className="text-sm font-medium leading-none" htmlFor="full_name">Full Name</label>
               <input 
                 className="flex h-10 w-full rounded-md border border-zinc-800 bg-zinc-950 px-3 py-2 text-sm placeholder:text-zinc-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-800" 
                 id="full_name" name="full_name" required={!isLogin} type="text" 
               />
             </div>
          )}
          <div className="space-y-2">
            <label className="text-sm font-medium leading-none" htmlFor="email">Email</label>
            <input 
              className="flex h-10 w-full rounded-md border border-zinc-800 bg-zinc-950 px-3 py-2 text-sm placeholder:text-zinc-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-800" 
              id="email" name="email" type="email" required 
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium leading-none" htmlFor="password">Password</label>
            <input 
               className="flex h-10 w-full rounded-md border border-zinc-800 bg-zinc-950 px-3 py-2 text-sm placeholder:text-zinc-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-800" 
               id="password" name="password" type="password" required 
            />
          </div>

          <div className="pt-2">
              <button 
                formAction={isLogin ? login : signup} 
                className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-white text-zinc-950 hover:bg-zinc-200 h-10 px-4 py-2 w-full"
              >
                {isLogin ? "Log in" : "Sign up"}
              </button>
          </div>
        </form>

        <div className="mt-6 text-center text-sm">
            <button 
              type="button" 
              onClick={() => setIsLogin(!isLogin)} 
              className="text-zinc-400 hover:text-white"
            >
                {isLogin ? "Don't have an account? Sign up" : "Already have an account? Log in"}
            </button>
        </div>
      </div>
    </div>
  )
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="flex min-h-screen items-center justify-center bg-zinc-950 text-white">Loading...</div>}>
      <LoginForm />
    </Suspense>
  )
}
