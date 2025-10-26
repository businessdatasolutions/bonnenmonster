import React from 'react';
import { FuelIcon, SettingsIcon, InstallIcon } from './icons';

interface HeaderProps {
  onSettingsClick: () => void;
  onInstallClick: () => void;
  showInstallButton: boolean;
}

const Header: React.FC<HeaderProps> = ({ onSettingsClick, onInstallClick, showInstallButton }) => {
  return (
    <header className="bg-white shadow-md relative">
      <div className="container mx-auto px-4 py-4 flex items-center justify-center">
        <FuelIcon />
        <h1 className="text-2xl md:text-3xl font-bold text-gray-800 ml-3">
          Tankbon Verwerker
        </h1>
      </div>
      <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center gap-2">
        {showInstallButton && (
          <button 
            onClick={onInstallClick} 
            className="p-2 rounded-full hover:bg-gray-200 transition-colors"
            aria-label="Installeer app"
            title="Installeer app"
          >
            <InstallIcon />
          </button>
        )}
        <button 
          onClick={onSettingsClick} 
          className="p-2 rounded-full hover:bg-gray-200 transition-colors"
          aria-label="Instellingen"
          title="Instellingen"
        >
          <SettingsIcon />
        </button>
      </div>
    </header>
  );
};

export default Header;
