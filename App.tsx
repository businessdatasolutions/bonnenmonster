
import React, { useState, useCallback, useEffect } from 'react';
import { analyzeReceipt } from './services/geminiService';
import { saveToBaserow } from './services/baserowService';
import type { ReceiptData, BaserowConfig } from './types';
import Header from './components/Header';
import ImageUploader from './components/ImageUploader';
import ReceiptDataDisplay from './components/ReceiptDataDisplay';
import LoadingSpinner from './components/LoadingSpinner';
import SettingsModal from './components/SettingsModal';
import { ResetIcon } from './components/icons';

interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{
    outcome: 'accepted' | 'dismissed';
    platform: string;
  }>;
  prompt(): Promise<void>;
}

const App: React.FC = () => {
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [extractedData, setExtractedData] = useState<ReceiptData | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [baserowConfig, setBaserowConfig] = useState<BaserowConfig | null>(null);
  const [installPrompt, setInstallPrompt] = useState<BeforeInstallPromptEvent | null>(null);

  useEffect(() => {
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setInstallPrompt(e as BeforeInstallPromptEvent);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  useEffect(() => {
    try {
      const savedConfig = localStorage.getItem('baserowConfig');
      if (savedConfig) {
        setBaserowConfig(JSON.parse(savedConfig));
      }
    } catch (e) {
      console.error("Failed to parse Baserow config from localStorage", e);
      localStorage.removeItem('baserowConfig');
    }
  }, []);

  const handleImageSelect = (file: File) => {
    handleReset();
    setImageFile(file);
    setPreviewUrl(URL.createObjectURL(file));
  };

  const handleAnalyze = useCallback(async () => {
    if (!imageFile) {
      setError('Selecteer eerst een afbeelding.');
      return;
    }

    setIsLoading(true);
    setError(null);
    setExtractedData(null);

    try {
      const reader = new FileReader();
      reader.readAsDataURL(imageFile);
      reader.onloadend = async () => {
        try {
          const base64String = (reader.result as string).split(',')[1];
          if (!base64String) {
             throw new Error('Kon afbeelding niet converteren.');
          }
          const data = await analyzeReceipt(base64String, imageFile.type);
          setExtractedData(data);
        } catch (err: any) {
          console.error(err);
          setError(`Analyse mislukt: ${err.message}`);
        } finally {
           setIsLoading(false);
        }
      };
      reader.onerror = () => {
        setError('Fout bij het lezen van het bestand.');
        setIsLoading(false);
      }

    // FIX: Added curly braces to the catch block to correctly scope the error handling logic.
    } catch (err: any) {
      console.error(err);
      setError(`Analyse mislukt: ${err.message}`);
      setIsLoading(false);
    }
  }, [imageFile]);

  const handleReset = () => {
    setImageFile(null);
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }
    setPreviewUrl(null);
    setExtractedData(null);
    setIsLoading(false);
    setError(null);
  };

  const handleSaveSettings = (config: BaserowConfig) => {
    setBaserowConfig(config);
    localStorage.setItem('baserowConfig', JSON.stringify(config));
    setIsSettingsOpen(false);
  };
  
  const handleSaveToBaserow = async (data: ReceiptData) => {
    if (!baserowConfig || !baserowConfig.apiKey || !baserowConfig.tableId) {
      setIsSettingsOpen(true);
      throw new Error("Baserow configuratie is niet ingesteld.");
    }
    await saveToBaserow(data, baserowConfig);
  };

  const handleInstallClick = async () => {
    if (!installPrompt) return;
    await installPrompt.prompt();
    const { outcome } = await installPrompt.userChoice;
    if (outcome === 'accepted') {
      setInstallPrompt(null);
    }
  };

  const isBaserowConfigured = !!(baserowConfig?.apiKey && baserowConfig?.tableId);

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Header 
        onSettingsClick={() => setIsSettingsOpen(true)}
        onInstallClick={handleInstallClick}
        showInstallButton={!!installPrompt}
      />
      {isSettingsOpen && (
        <SettingsModal
          config={baserowConfig}
          onSave={handleSaveSettings}
          onClose={() => setIsSettingsOpen(false)}
        />
      )}
      <main className="flex-grow container mx-auto p-4 md:p-8 flex flex-col items-center justify-center">
        <div className="w-full max-w-2xl bg-white rounded-2xl shadow-xl p-6 md:p-8 transition-all duration-300">
          {!previewUrl && !extractedData && (
            <ImageUploader onImageSelect={handleImageSelect} disabled={isLoading} />
          )}

          {previewUrl && !extractedData && (
            <div className="text-center">
              <h2 className="text-xl font-semibold text-gray-700 mb-4">Voorbeeld van bon</h2>
              <img src={previewUrl} alt="Voorbeeld van bon" className="max-h-80 w-auto mx-auto rounded-lg border-2 border-gray-200 shadow-sm" />
              <div className="mt-6 flex flex-col sm:flex-row justify-center gap-4">
                <button
                  onClick={handleAnalyze}
                  disabled={isLoading}
                  className="w-full sm:w-auto bg-primary text-white font-bold py-3 px-6 rounded-lg hover:bg-primary-hover transition-colors duration-200 disabled:bg-gray-400 flex items-center justify-center"
                >
                  {isLoading ? <LoadingSpinner /> : 'Analyseer Bon'}
                </button>
                <button
                  onClick={handleReset}
                  disabled={isLoading}
                  className="w-full sm:w-auto bg-gray-200 text-gray-700 font-bold py-3 px-6 rounded-lg hover:bg-gray-300 transition-colors duration-200 disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  <ResetIcon /> Annuleren
                </button>
              </div>
            </div>
          )}

          {isLoading && !extractedData && (
             <div className="flex flex-col items-center justify-center p-8">
              <LoadingSpinner />
              <p className="mt-4 text-gray-600 animate-pulse">Bon wordt geanalyseerd...</p>
            </div>
          )}

          {error && (
            <div className="mt-4 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg relative text-center" role="alert">
              <strong className="font-bold">Fout!</strong>
              <span className="block sm:inline ml-2">{error}</span>
            </div>
          )}

          {extractedData && (
            <ReceiptDataDisplay
              data={extractedData}
              onReset={handleReset}
              onSaveToBaserow={handleSaveToBaserow}
              isBaserowConfigured={isBaserowConfigured}
            />
          )}
        </div>
      </main>
      <footer className="text-center p-4 text-gray-500 text-sm">
        <p>Gemaakt met React, Tailwind CSS, en Gemini AI.</p>
      </footer>
    </div>
  );
};

export default App;
