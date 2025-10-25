import { useState } from 'react';
import ThemeToggle from './ThemeToggle';

// Professional SVG Icons
const MenuIcon = () => (
  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
  </svg>
);

const TradingIcon = () => (
  <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 24 24">
    <path d="M16 6l2.29 2.29-4.88 4.88-4-4L2 16.59 3.41 18l6-6 4 4 6.3-6.29L22 12V6z"/>
  </svg>
);

const Header = ({ onMenuClick }) => {
  return (
    <header className="bg-gradient-to-r from-slate-800/90 to-slate-900/90 backdrop-blur-sm border-b border-slate-700/50 px-6 py-4 shadow-lg">
      <div className="flex items-center justify-between">
        {/* Professional Menu Button */}
        <button
          onClick={onMenuClick}
          className="group relative p-2 text-slate-300 hover:text-blue-400 transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-blue-500/50 rounded-lg hover:bg-slate-700/50"
          aria-label="Toggle menu"
        >
          <MenuIcon />
          <div className="absolute inset-0 bg-blue-500/10 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
        </button>

        {/* Professional App Title */}
        <div className="flex items-center space-x-3">
          <div className="relative">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 via-purple-500 to-cyan-500 rounded-xl flex items-center justify-center shadow-lg">
              <TradingIcon />
            </div>
            <div className="absolute -top-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-slate-900 animate-pulse"></div>
          </div>
          <div>
            <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-400 via-purple-400 to-cyan-400 bg-clip-text text-transparent">
              Trade Tracker
            </h1>
            <p className="text-xs text-slate-400 -mt-1">Professional Analytics</p>
          </div>
        </div>

        {/* Status Indicator and Theme Toggle */}
        <div className="flex items-center space-x-4">
          <ThemeToggle />
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            <span className="text-sm text-slate-400 font-medium">Live</span>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
