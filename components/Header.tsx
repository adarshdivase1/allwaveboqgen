import React from 'react';

interface HeaderProps {
    onClearProject: () => void;
}

const Header: React.FC<HeaderProps> = ({ onClearProject }) => {
  return (
    <header className="bg-slate-900/80 backdrop-blur-sm sticky top-0 z-40 border-b border-slate-700">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center">
            <h1 className="text-2xl font-bold text-white">
              <span className="text-blue-400">Gen</span>BOQ
            </h1>
            <p className="ml-4 text-sm text-slate-400 hidden md:block">
              AI-Powered AV Bill of Quantities Generator
            </p>
          </div>
          <button
            onClick={onClearProject}
            className="px-3 py-1.5 text-xs font-medium rounded-md text-slate-300 bg-slate-700 hover:bg-slate-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-900 focus:ring-red-500"
          >
            Clear Project
          </button>
        </div>
      </div>
    </header>
  );
};

export default Header;