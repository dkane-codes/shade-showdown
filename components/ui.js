// components/ui.js
'use client'

import Link from 'next/link'

// Vibrant Button Components
export function ButtonPrimary({ children, onClick, className = '', ...props }) {
  return (
    <button
      onClick={onClick}
      className={`btn-primary ${className}`}
      {...props}
    >
      {children}
    </button>
  )
}

export function ButtonSecondary({ children, onClick, className = '', ...props }) {
  return (
    <button
      onClick={onClick}
      className={`btn-secondary ${className}`}
      {...props}
    >
      {children}
    </button>
  )
}

export function ButtonGradient({ children, onClick, gradient = 'primary', className = '', ...props }) {
  const gradientClasses = {
    primary: 'bg-gradient-primary',
    secondary: 'bg-gradient-secondary',
    warm: 'bg-gradient-warm',
    cool: 'bg-gradient-cool',
    mixed: 'bg-gradient-mixed'
  }
  
  return (
    <button
      onClick={onClick}
      className={`${gradientClasses[gradient]} text-white px-6 py-3 rounded-lg font-bold transition-all duration-200 hover:scale-105 shadow-lg ${className}`}
      {...props}
    >
      {children}
    </button>
  )
}

// Vibrant Card Components
export function CardVibrant({ children, gradient = 'warm', className = '', ...props }) {
  const gradientClasses = {
    primary: 'bg-gradient-primary',
    secondary: 'bg-gradient-secondary',
    warm: 'bg-gradient-warm',
    cool: 'bg-gradient-cool',
    mixed: 'bg-gradient-mixed'
  }
  
  return (
    <div
      className={`card-glassy ${gradientClasses[gradient]} ${className}`}
      {...props}
    >
      {children}
    </div>
  )
}

export function CardColor({ color, name, hexCode, onClick, isSelected, className = '' }) {
  return (
    <div
      className={`card-glassy cursor-pointer transition-all duration-300 hover:scale-105 ${isSelected ? 'ring-4 ring-black ring-offset-4' : ''} ${className}`}
      onClick={onClick}
    >
      <div
        className="h-32 w-full rounded-lg shadow-inner mb-4"
        style={{ backgroundColor: hexCode }}
      />
      <h3 className="font-bold text-black text-lg text-center">{name}</h3>
      <p className="text-black text-center font-mono text-sm opacity-80">{hexCode}</p>
    </div>
  )
}

// Navigation Components
export function NavLink({ href, children, isActive, icon, className = '' }) {
  return (
    <Link
      href={href}
      className={`flex items-center px-6 py-3 text-left w-full transition-all duration-200 ${
        isActive
          ? 'bg-gradient-secondary text-white border-r-4 border-black shadow-lg'
          : 'text-black hover:bg-gradient-cool hover:text-white'
      } ${className}`}
    >
      {icon && <span className="text-xl mr-3">{icon}</span>}
      <span className="font-bold">{children}</span>
    </Link>
  )
}

// Layout Components
export function PageHeader({ title, subtitle, gradient = 'mixed' }) {
  const gradientClasses = {
    primary: 'bg-gradient-primary',
    secondary: 'bg-gradient-secondary',
    warm: 'bg-gradient-warm',
    cool: 'bg-gradient-cool',
    mixed: 'bg-gradient-mixed'
  }
  
  return (
    <div className={`${gradientClasses[gradient]} p-8 rounded-xl mb-8 text-center`}>
      <h1 className="text-5xl font-bold mb-4 text-white">
        {title.includes('Shade Showdown') ? (
          <>
            {title.split('Shade Showdown')[0]}
            <span className="text-black">Shade Showdown</span>
            {title.split('Shade Showdown')[1]}
          </>
        ) : (
          title
        )}
      </h1>
      {subtitle && (
        <p className="text-xl text-white font-medium">{subtitle}</p>
      )}
    </div>
  )
}

// Utility Components
export function LoadingSpinner({ size = 'md', className = '' }) {
  const sizeClasses = {
    sm: 'w-6 h-6',
    md: 'w-8 h-8',
    lg: 'w-12 h-12'
  }
  
  return (
    <div className={`animate-spin rounded-full border-4 border-black border-t-transparent ${sizeClasses[size]} ${className}`} />
  )
}

export function Badge({ children, variant = 'primary', className = '' }) {
  const variantClasses = {
    primary: 'bg-black text-white',
    secondary: 'bg-white text-black border-2 border-black',
    success: 'bg-green-500 text-white',
    warning: 'bg-yellow-500 text-white',
    danger: 'bg-red-500 text-white'
  }
  
  return (
    <span className={`inline-block px-3 py-1 rounded-full text-sm font-bold ${variantClasses[variant]} ${className}`}>
      {children}
    </span>
  )
}

// Grid Components
export function ColorGrid({ colors, onColorClick, selectedColors = [], className = '' }) {
  return (
    <div className={`grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6 ${className}`}>
      {colors.map((color, index) => (
        <CardColor
          key={color.id}
          color={color}
          name={color.name}
          hexCode={color.hex_code}
          onClick={() => onColorClick?.(color)}
          isSelected={selectedColors.includes(color.id)}
          gradient={index % 4 === 0 ? 'warm' : index % 4 === 1 ? 'cool' : index % 4 === 2 ? 'secondary' : 'primary'}
        />
      ))}
    </div>
  )
}

// Footer Component
export function Footer({ className = '' }) {
  return (
    <footer className={`bg-black text-white p-8 mt-16 ${className}`}>
      <div className="max-w-6xl mx-auto text-center">
        <h3 className="text-2xl font-bold mb-4">Shade Showdown</h3>
        <p className="text-gray-300 mb-4">
          Vote on colors using the Keep, Trade, Cut system
        </p>
        <div className="flex justify-center space-x-4 text-sm text-gray-400">
          <span>Built with Next.js</span>
          <span>•</span>
          <span>Powered by Supabase</span>
          <span>•</span>
          <span>Styled with Tailwind CSS</span>
        </div>
      </div>
    </footer>
  )
}
