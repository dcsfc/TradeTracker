import { useEffect } from 'react';

// Professional SVG Icons
const DashboardIcon = () => (
  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
    <path d="M3 13h8V3H3v10zm0 8h8v-6H3v6zm10 0h8V11h-8v10zm0-18v6h8V3h-8z"/>
  </svg>
);

const AddTradeIcon = () => (
  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
    <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"/>
  </svg>
);

const AIPredictionIcon = () => (
  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.94-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z"/>
  </svg>
);

const BreakoutStrategyIcon = () => (
  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
    <path d="M3 3v18h18V3H3zm16 16H5V5h14v14zm-8-2h2v-2h-2v2zm0-4h2V9h-2v4zm0-6h2V5h-2v2z"/>
  </svg>
);

const CloseIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
  </svg>
);

const Sidebar = ({ isOpen, onClose, onSelect, currentPage }) => {
  // Close sidebar when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (isOpen && !event.target.closest('.sidebar-content')) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.body.style.overflow = 'hidden'; // Prevent background scrolling
    } else {
      document.body.style.overflow = 'unset';
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  // Close sidebar on escape key
  useEffect(() => {
    const handleEscape = (event) => {
      if (event.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isOpen, onClose]);

  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: <DashboardIcon />, description: 'Analytics & Overview' },
    { id: 'add-trade', label: 'Add Trade', icon: <AddTradeIcon />, description: 'Record New Trade' },
    { id: 'ai-prediction', label: 'AI Market Prediction', icon: <AIPredictionIcon />, description: 'AI-Powered Market Analysis' },
    { id: 'breakout-strategy', label: 'Breakout Strategy', icon: <BreakoutStrategyIcon />, description: 'Trading Breakout Analysis' },
  ];

  const handleItemClick = (itemId) => {
    onSelect(itemId);
    onClose();
  };

  return (
    <>
      {/* Professional Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 transition-opacity duration-300"
          onClick={onClose}
        />
      )}

      {/* Professional Sidebar */}
      <div
        className={`fixed top-0 left-0 h-full z-50 sidebar-content w-3/4 md:w-80 transition-transform duration-300 ease-in-out ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="h-full bg-gradient-to-br from-slate-800/95 to-slate-900/95 backdrop-blur-sm text-white rounded-r-3xl shadow-2xl flex flex-col border-r border-slate-700/50">
          {/* Professional Sidebar Header */}
          <div className="flex items-center justify-between p-6 border-b border-slate-700/50">
            <div>
              <h2 className="text-xl font-bold text-slate-200">Navigation</h2>
              <p className="text-sm text-slate-400">Trading Platform</p>
            </div>
            <button
              onClick={onClose}
              className="group relative p-2 text-slate-300 hover:text-red-400 transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-red-500/50 rounded-lg hover:bg-slate-700/50"
              aria-label="Close menu"
            >
              <CloseIcon />
              <div className="absolute inset-0 bg-red-500/10 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            </button>
          </div>

          {/* Professional Menu Items */}
          <nav className="p-6 flex-1 overflow-y-auto">
            <ul className="space-y-3">
              {menuItems.map((item) => (
                <li key={item.id}>
                  <button
                    onClick={() => handleItemClick(item.id)}
                    className={`group w-full flex items-center space-x-4 px-4 py-4 text-left rounded-xl transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-blue-500/50 ${
                      currentPage === item.id
                        ? 'bg-gradient-to-r from-blue-500/20 to-purple-500/20 border border-blue-500/30 shadow-lg shadow-blue-500/10'
                        : 'hover:bg-slate-700/50 hover:shadow-lg hover:shadow-slate-500/10'
                    }`}
                  >
                    <div className={`p-2 rounded-lg transition-colors duration-300 ${
                      currentPage === item.id 
                        ? 'bg-blue-500/20 text-blue-400' 
                        : 'bg-slate-700/50 text-slate-300 group-hover:bg-blue-500/20 group-hover:text-blue-400'
                    }`}>
                      {item.icon}
                    </div>
                    <div className="flex-1">
                      <div className={`font-semibold transition-colors duration-300 ${
                        currentPage === item.id ? 'text-blue-400' : 'text-slate-200 group-hover:text-blue-400'
                      }`}>
                        {item.label}
                      </div>
                      <div className="text-xs text-slate-400 mt-1">
                        {item.description}
                      </div>
                    </div>
                    {currentPage === item.id && (
                      <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse"></div>
                    )}
                  </button>
                </li>
              ))}
            </ul>
          </nav>

          {/* Professional Sidebar Footer */}
          <div className="p-6 border-t border-slate-700/50">
            <div className="text-center">
              <div className="text-sm font-semibold text-slate-200 mb-1">Trade Tracker Pro</div>
              <div className="text-xs text-slate-400">Professional Analytics Platform</div>
              <div className="flex items-center justify-center mt-3 space-x-2">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                <span className="text-xs text-slate-400">System Online</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default Sidebar;
