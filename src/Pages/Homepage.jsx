import React from 'react'
import { useNavigate } from 'react-router-dom'
import { Button } from '../Components/ui/button'
import { useTheme } from '../hooks/useTheme'
import { ThemeToggle } from '../Components/ui/theme-toggle'
import logoUrl from '@/assets/logo.png'
import logoLightUrl from '@/assets/logolight.png'

function Homepage() {
  const navigate = useNavigate()
  const { isDark } = useTheme()

  return (
    <div className={`min-h-screen h-screen w-full flex flex-col items-center justify-center relative overflow-hidden transition-colors duration-300 ${
      isDark 
        ? 'bg-black' 
        : 'bg-white'
    }`}>
      {/* Fixed Theme Toggle at Top Right */}
      <div className="fixed top-0 right-0 p-3 sm:p-4 md:p-6 z-50">
        <ThemeToggle />
      </div>
      
      {/* Main Content Container */}
      <div className="flex flex-col items-center justify-center flex-1 w-full max-w-6xl px-8 md:px-12 lg:px-16">
        
        {/* Welcome Text */}
        <div className="text-center mb-8">
          <h1 className={`text-6xl md:text-7xl lg:text-8xl font-extrabold mb-4 tracking-tight leading-tight transition-colors ${
            isDark ? 'text-white' : 'text-black'
          }`}>
            Welcome
          </h1>
          <h2 className={`text-4xl md:text-5xl lg:text-6xl font-bold tracking-wide transition-colors ${
            isDark ? 'text-white opacity-90' : 'text-black opacity-75'
          }`}>
            To
          </h2>
        </div>
        
        {/* Logo */}
        <div className="mb-10">
          <img 
            src={isDark ? logoUrl : logoLightUrl} 
            alt="LIA HUB Logo" 
            className="w-80 md:w-96 lg:w-[28rem] h-auto mx-auto drop-shadow-2xl" 
          />
        </div>
        
        {/* Description */}
        <p className={`text-lg md:text-xl lg:text-2xl mb-12 max-w-4xl mx-auto text-center leading-relaxed px-4 transition-colors ${
          isDark 
            ? 'text-gray-300' 
            : 'text-gray-700'
        }`}>
          Connect, Collaborate, and Grow with LIA HUB – Your ultimate platform for networking, job opportunities, and professional development in the academic and corporate world.
        </p>
        
        {/* CTA Button */}
        <Button
          onClick={() => navigate('/login')}
          style={{
            backgroundColor: isDark ? 'white' : 'black',
            color: isDark ? 'black' : 'white'
          }}
          className="px-12 py-6 md:px-16 md:py-7 text-lg md:text-xl font-bold shadow-2xl transform hover:scale-105 transition-all duration-300 tracking-wide"
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = isDark ? '#f3f4f6' : '#1f2937'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = isDark ? 'white' : 'black'
          }}
        >
          Get Started
        </Button>
      </div>

      {/* Footer - Swedish Text */}
      <div className="absolute bottom-8 w-full text-center">
        <p className={`text-lg md:text-xl font-semibold tracking-wider transition-colors ${
          isDark ? 'text-gray-300' : 'text-gray-700'
        }`}>
          Del av <span className="font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-purple-500 to-pink-500">Ultranous AI</span>
        </p>
      </div>
    </div>
  )
}

export default Homepage