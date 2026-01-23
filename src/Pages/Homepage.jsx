import React from 'react'
import { useNavigate } from 'react-router-dom'
import { Button } from '../Components/ui/button'
import logoUrl from '@/assets/logo.png'

function Homepage() {
  const navigate = useNavigate()

  return (
    <div className="min-h-screen h-screen w-full bg-primary-foreground flex flex-col items-center justify-center relative overflow-hidden">
      {/* Main Content Container */}
      <div className="flex flex-col items-center justify-center flex-1 w-full max-w-6xl px-8 md:px-12 lg:px-16">
        
        {/* Welcome Text */}
        <div className="text-center mb-8">
          <h1 className="text-6xl md:text-7xl lg:text-8xl font-extrabold text-white mb-4 tracking-tight leading-tight">
            Welcome
          </h1>
          <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white tracking-wide opacity-90">
            To
          </h2>
        </div>
        
        {/* Logo */}
        <div className="mb-10">
          <img 
            src={logoUrl} 
            alt="LIA HUB Logo" 
            className="w-80 md:w-96 lg:w-[28rem] h-auto mx-auto drop-shadow-2xl" 
          />
        </div>
        
        {/* Description */}
        <p className="text-gray-300 text-lg md:text-xl lg:text-2xl mb-12 max-w-4xl mx-auto text-center leading-relaxed px-4">
          Connect, Collaborate, and Grow with LIA HUB – Your ultimate platform for networking, job opportunities, and professional development in the academic and corporate world.
        </p>
        
        {/* CTA Button */}
        <Button
          onClick={() => navigate('/login')}
          className="bg-white text-black px-12 py-6 md:px-16 md:py-7 text-lg md:text-xl font-bold shadow-2xl hover:shadow-white/20 transform hover:scale-105 transition-all duration-300 tracking-wide"
        >
          Get Started
        </Button>
      </div>

      {/* Footer - Swedish Text */}
      <div className="absolute bottom-8 w-full text-center">
        <p className="text-gray-300 text-lg md:text-xl font-semibold tracking-wider">
          Del av <span className="font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-purple-500 to-pink-500">Ultranous AI</span>
        </p>
      </div>
    </div>
  )
}

export default Homepage