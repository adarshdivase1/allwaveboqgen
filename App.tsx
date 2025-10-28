
import React, { useState, useEffect, useCallback } from 'react';
import { v4 as uuidv4 } from 'uuid';
import Header from './components/Header';
import RequirementInput from './components/RequirementInput';
import BoqDisplay from './components/BoqDisplay';
import ClientDetails from './components/ClientDetails';
import RoomCard from './components/RoomCard';
import TabButton from './components/TabButton';
import Questionnaire from './components/Questionnaire';
import RefineModal from './components/RefineModal';
import CurrencySelector from './components/CurrencySelector';
import AuthGate from './components/AuthGate';
import { generateBoq, refineBoq } from './services/geminiService';
import { questionnaire } from './data/questionnaireData';
import { exportToXlsx } from './utils/exportToXlsx';
import { fetchExchangeRates } from './utils/currency';
import type { Room, BoqItem, ClientDetails as ClientDetailsType, Currency } from './types';

const App: React.FC = () => {
  const [rooms, setRooms] = useState<Room[]>([]);
  const [activeRoomId, setActiveRoomId] = useState<string | null>(null);
  const [clientDetails, setClientDetails] = useState<ClientDetailsType>({
    projectName: 'New AV Project',
    clientName: '',
    preparedBy: 'GenBOQ',
    date: new Date().toISOString().split('T')[0],
    designEngineer: '',
    accountManager: '',
    keyClientPersonnel: '',
    location: '',
    keyComments: '',
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [inputMode, setInputMode] = useState<'text' | 'questionnaire'>('text');
  const [isRefineModalOpen, setIsRefineModalOpen] = useState(false);
  const [currency, setCurrency] = useState<Currency>('USD');
  const [exchangeRates, setExchangeRates] = useState<Record<Currency, number> | null>(null);
  const [questionnaireAnswers, setQuestionnaireAnswers] = useState<Record<string, string>>({});

  useEffect(() => {
    const getRates = async () => {
      const rates = await fetchExchangeRates();
      setExchangeRates(rates);
    };
    getRates();
  }, []);

  const activeRoom = rooms.find(room => room.id === activeRoomId);

  const handleGenerateBoq = async (requirements: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const boq = await generateBoq(requirements);
      const newRoomName = (inputMode === 'questionnaire' && questionnaireAnswers.roomType)
        ? questionnaire.find(s => s.title === 'Room Details')?.questions.find(q => q.id === 'roomType')?.options?.find(o => o.value === questionnaireAnswers.roomType)?.label || `Room ${rooms.length + 1}`
        : `Room ${rooms.length + 1}`;
      
      const newRoom: Room = { id: uuidv4(), name: newRoomName, requirements, boq };
      setRooms(prev => [...prev, newRoom]);
      setActiveRoomId(newRoom.id);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unknown error occurred.');
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleRefineBoq = async (refinementPrompt: string) => {
    if (!activeRoom) return;
    setIsLoading(true);
    setError(null);
    try {
      const refinedBoq = await refineBoq(activeRoom.boq, refinementPrompt);
      handleUpdateBoq(refinedBoq);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unknown error occurred.');
    } finally {
      setIsLoading(false);
      setIsRefineModalOpen(false);
    }
  };

  const handleUpdateBoq = useCallback((updatedBoq: BoqItem[]) => {
    if (!activeRoomId) return;
    setRooms(prevRooms => prevRooms.map(r => r.id === activeRoomId ? { ...r, boq: updatedBoq } : r));
  }, [activeRoomId]);

  const handleUpdateRoom = useCallback((updatedRoom: Room) => {
     setRooms(prevRooms => prevRooms.map(r => r.id === updatedRoom.id ? updatedRoom : r));
  }, []);

  const handleDeleteRoom = (roomId: string) => {
    setRooms(prev => prev.filter(r => r.id !== roomId));
    if (activeRoomId === roomId) {
      const remainingRooms = rooms.filter(r => r.id !== roomId);
      setActiveRoomId(remainingRooms.length > 0 ? remainingRooms[0].id : null);
    }
  };

  const handleExport = () => {
    if (!exchangeRates) {
      setError("Exchange rates not loaded yet.");
      return;
    }
    if (rooms.length > 0) {
      exportToXlsx(rooms, clientDetails, currency, exchangeRates[currency]);
    } else {
      setError("There is no BOQ data to export.");
    }
  };

  return (
    <AuthGate>
        <div className="bg-slate-900 text-slate-200 min-h-screen font-sans">
          <Header />
          <main className="container mx-auto p-4 sm:p-6 lg:p-8">
            <div className="space-y-8">
              <ClientDetails details={clientDetails} onDetailsChange={setClientDetails} disabled={isLoading} currency={currency} />

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
                <div className="bg-slate-800/50 p-6 rounded-lg border border-slate-700 space-y-4">
                  <div className="border-b border-slate-700 mb-4 flex justify-between items-center">
                    <div className="flex">
                      <TabButton isActive={inputMode === 'text'} onClick={() => setInputMode('text')}>
                        Describe Requirements
                      </TabButton>
                      <TabButton isActive={inputMode === 'questionnaire'} onClick={() => setInputMode('questionnaire')}>
                        Guided Questionnaire
                      </TabButton>
                    </div>
                    <div className="pb-2">
                       <CurrencySelector selectedCurrency={currency} onCurrencyChange={setCurrency} disabled={!exchangeRates || isLoading} />
                    </div>
                  </div>
                  {inputMode === 'text' ? (
                    <RequirementInput onSubmit={handleGenerateBoq} isLoading={isLoading} />
                  ) : (
                    <Questionnaire questionnaire={questionnaire} onSubmit={handleGenerateBoq} isLoading={isLoading} onAnswerChange={(id, val) => setQuestionnaireAnswers(prev => ({...prev, [id]: val}))}/>
                  )}
                </div>

                <div className="space-y-6 h-full flex flex-col">
                   <div className="flex-shrink-0">
                    <h2 className="text-2xl font-bold text-white mb-4">Generated Rooms</h2>
                    {rooms.length > 0 ? (
                       <div className="flex flex-wrap gap-3">
                         {rooms.map(room => (
                          <RoomCard
                            key={room.id}
                            room={room}
                            isActive={room.id === activeRoomId}
                            onSelect={() => setActiveRoomId(room.id)}
                            onUpdate={handleUpdateRoom}
                            onDelete={() => handleDeleteRoom(room.id)}
                          />
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-8 bg-slate-800/50 rounded-lg border border-dashed border-slate-700">
                        <p className="text-slate-400">Your generated rooms will appear here.</p>
                      </div>
                    )}
                  </div>
                   <div className="flex-grow min-h-[500px]">
                      <BoqDisplay
                        room={activeRoom}
                        onUpdateBoq={handleUpdateBoq}
                        onRefine={() => setIsRefineModalOpen(true)}
                        onExport={handleExport}
                        currency={currency}
                        exchangeRate={exchangeRates ? exchangeRates[currency] : 1}
                        isLoading={isLoading}
                      />
                  </div>
                </div>
              </div>
               {error && (
                <div className="fixed bottom-4 right-4 bg-red-800/90 text-white p-4 rounded-lg shadow-lg border border-red-600 max-w-sm">
                  <div className="flex justify-between items-center">
                    <p className="font-semibold">Error</p>
                    <button onClick={() => setError(null)} className="ml-4 font-bold">&times;</button>
                  </div>
                  <p className="text-sm mt-1">{error}</p>
                </div>
              )}
            </div>
          </main>
          <RefineModal
            isOpen={isRefineModalOpen}
            onClose={() => setIsRefineModalOpen(false)}
            onSubmit={handleRefineBoq}
            isLoading={isLoading}
          />
        </div>
    </AuthGate>
  );
};

export default App;
