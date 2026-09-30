import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { DietProvider, useDiet } from './context/DietContext';
import { AuthView } from './components/AuthView';
import { TopNav } from './components/TopNav';
import { Macro3DGauge } from './components/Macro3DGauge';
import { DailyMealsList } from './components/DailyMealsList';
import { WaterTracker3D } from './components/WaterTracker3D';
import { MealLoggerModal } from './components/MealLoggerModal';
import { ProfileModal } from './components/ProfileModal';
import { AnalyticsView } from './components/AnalyticsView';
import { FoodLibraryView } from './components/FoodLibraryView';
import { DataBackupModal } from './components/DataBackupModal';
import { GlycemicWorkoutTimelineCard } from './components/GlycemicWorkoutTimelineCard';
import { MealGlycemicModal } from './components/MealGlycemicModal';
import { FoodItem, MealType, MealEntry } from './types/diet';
import { formatDateToIso } from './utils/nutritionCalculations';
import {
  Calendar,
  ChevronLeft,
  ChevronRight,
  LayoutDashboard,
  UtensilsCrossed,
  LineChart,
  LibraryBig,
  Settings
} from 'lucide-react';

const MainDashboard: React.FC = () => {
  const { currentUser, authLoading, firebaseUser } = useAuth();
  const { selectedDate, jumpToToday, prevDay, nextDay, quickAddFood } =
    useDiet();

  const [activeSection, setActiveSection] = useState<'dashboard' | 'meals' | 'database' | 'analytics'>('dashboard');
  const [isMealLoggerOpen, setIsMealLoggerOpen] = useState(false);
  const [loggerInitialMealType, setLoggerInitialMealType] = useState<MealType>('breakfast');
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isBackupOpen, setIsBackupOpen] = useState(false);
  const [selectedMealForGlycemic, setSelectedMealForGlycemic] = useState<MealEntry | null>(null);

  if (authLoading) {
    return (
      <div className="min-h-screen bg-[#09090b] flex flex-col items-center justify-center text-zinc-400">
        <div className="h-8 w-8 rounded-full border-2 border-emerald-500 border-t-transparent animate-spin mb-3" />
        <span className="text-xs font-mono tracking-wider uppercase text-zinc-500">Connecting to AstraDiet Cloud Sync...</span>
      </div>
    );
  }

  if (!currentUser) {
    return <AuthView />;
  }

  const handleOpenMealLogger = (type: MealType = 'breakfast') => {
    setLoggerInitialMealType(type);
    setIsMealLoggerOpen(true);
  };

  const handleAddFoodFromLibrary = (food: FoodItem, mealType: MealType) => {
    quickAddFood(food, mealType);
  };

  const isToday = selectedDate === formatDateToIso(new Date());

  return (
    <div className="min-h-screen bg-[#09090b] text-zinc-100 flex flex-col antialiased selection:bg-white/20 selection:text-white">
      {/* Top Bar adhering to Top Bar Contract */}
      <TopNav
        activeSection={activeSection}
        setActiveSection={setActiveSection}
        onOpenMealLogger={() => handleOpenMealLogger('breakfast')}
        onOpenProfile={() => setIsProfileOpen(true)}
        onOpenBackup={() => setIsBackupOpen(true)}
      />

      {/* Main Viewport Container */}
      <main className="flex-1 mx-auto w-full max-w-7xl px-4 sm:px-6 py-6 pb-24 md:pb-6 space-y-6">
        {/* Contextual Header & Date Controls */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-white/[0.08]">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[11px] uppercase tracking-wider font-semibold text-zinc-400">
                Active Protocol
              </span>
              <span className="text-xs text-zinc-600">·</span>
              <span className="text-xs text-zinc-400 capitalize font-medium">
                {currentUser.goal.replace('_', ' ')} Phase
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight mt-0.5">
              Welcome, {currentUser.name}
            </h1>
          </div>

          {/* Date Selector Pill */}
          <div className="flex items-center gap-2 self-start sm:self-auto">
            <div className="flex items-center rounded-xl bg-zinc-900 border border-white/[0.08] p-1 text-xs">
              <button
                onClick={prevDay}
                className="p-1 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors cursor-pointer"
                title="Previous Day"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={jumpToToday}
                className={`px-3 py-1 font-mono text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
                  isToday
                    ? 'bg-zinc-800 text-white border border-white/[0.1]'
                    : 'text-zinc-400 hover:text-white'
                }`}
              >
                <Calendar className="w-3.5 h-3.5 inline mr-1.5 opacity-70" />
                {isToday ? 'Today' : selectedDate}
              </button>
              <button
                onClick={nextDay}
                className="p-1 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors cursor-pointer"
                title="Next Day"
              >
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>

        {/* Section View Routing */}
        {activeSection === 'dashboard' && (
          <div className="space-y-6">
            {/* Primary 3D Macro Gauge Dashboard (Consumed vs Target vs Remaining / Exceeded) */}
            <Macro3DGauge />

            {/* Glycemic Absorption & Workout Fueling Timeline Card */}
            <GlycemicWorkoutTimelineCard
              onSelectMeal={(meal) => setSelectedMealForGlycemic(meal)}
            />

            {/* Split Row: Hydration Chamber + Daily Meals Breakdown */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              <div className="lg:col-span-4">
                <WaterTracker3D />
              </div>
              <div className="lg:col-span-8">
                <DailyMealsList
                  onOpenLogger={handleOpenMealLogger}
                  onOpenGlycemicModal={(meal) => setSelectedMealForGlycemic(meal)}
                />
              </div>
            </div>
          </div>
        )}

        {activeSection === 'meals' && (
          <div className="max-w-4xl mx-auto space-y-6">
            <GlycemicWorkoutTimelineCard
              onSelectMeal={(meal) => setSelectedMealForGlycemic(meal)}
            />
            <DailyMealsList
              onOpenLogger={handleOpenMealLogger}
              onOpenGlycemicModal={(meal) => setSelectedMealForGlycemic(meal)}
            />
          </div>
        )}

        {activeSection === 'analytics' && <AnalyticsView />}

        {activeSection === 'database' && (
          <FoodLibraryView onAddFood={handleAddFoodFromLibrary} />
        )}
      </main>

      
      {/* Mobile Bottom Navigation Bar */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-[#09090b]/95 backdrop-blur-md border-t border-white/[0.08] px-2 py-2 pb-[env(safe-area-inset-bottom,12px)] flex items-center justify-around shadow-2xl">
        <button
          onClick={() => setActiveSection('dashboard')}
          className={`flex flex-col items-center justify-center p-2 rounded-xl transition-all cursor-pointer ${activeSection === 'dashboard' ? 'text-emerald-400 bg-emerald-400/10' : 'text-zinc-500 hover:text-zinc-300'}`}
        >
          <LayoutDashboard className="w-5 h-5 mb-1" />
          <span className="text-[10px] font-medium">Home</span>
        </button>
        <button
          onClick={() => setActiveSection('meals')}
          className={`flex flex-col items-center justify-center p-2 rounded-xl transition-all cursor-pointer ${activeSection === 'meals' ? 'text-emerald-400 bg-emerald-400/10' : 'text-zinc-500 hover:text-zinc-300'}`}
        >
          <UtensilsCrossed className="w-5 h-5 mb-1" />
          <span className="text-[10px] font-medium">Meals</span>
        </button>
        
        {/* Floating Action Button for Log Meal in Mobile */}
        <div className="relative -top-5">
          <button
            onClick={() => handleOpenMealLogger('breakfast')}
            className="flex items-center justify-center w-12 h-12 bg-white text-zinc-950 rounded-full shadow-[0_0_20px_rgba(255,255,255,0.3)] hover:scale-105 active:scale-95 transition-all cursor-pointer"
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14"/><path d="M12 5v14"/></svg>
          </button>
        </div>

        <button
          onClick={() => setActiveSection('analytics')}
          className={`flex flex-col items-center justify-center p-2 rounded-xl transition-all cursor-pointer ${activeSection === 'analytics' ? 'text-emerald-400 bg-emerald-400/10' : 'text-zinc-500 hover:text-zinc-300'}`}
        >
          <LineChart className="w-5 h-5 mb-1" />
          <span className="text-[10px] font-medium">Trends</span>
        </button>
        <button
          onClick={() => setActiveSection('database')}
          className={`flex flex-col items-center justify-center p-2 rounded-xl transition-all cursor-pointer ${activeSection === 'database' ? 'text-emerald-400 bg-emerald-400/10' : 'text-zinc-500 hover:text-zinc-300'}`}
        >
          <LibraryBig className="w-5 h-5 mb-1" />
          <span className="text-[10px] font-medium">Library</span>
        </button>
      </div>

      {/* Modals */}
      <MealLoggerModal
        isOpen={isMealLoggerOpen}
        onClose={() => setIsMealLoggerOpen(false)}
        initialMealType={loggerInitialMealType}
      />

      <MealGlycemicModal
        meal={selectedMealForGlycemic}
        isOpen={!!selectedMealForGlycemic}
        onClose={() => setSelectedMealForGlycemic(null)}
      />

      <ProfileModal
        isOpen={isProfileOpen}
        onClose={() => setIsProfileOpen(false)}
      />

      <DataBackupModal
        isOpen={isBackupOpen}
        onClose={() => setIsBackupOpen(false)}
      />

      {/* Subtle Footer */}
      <footer className="border-t border-white/[0.08] py-6 text-center text-xs text-zinc-500">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>AstraDiet · Precision Dietary &amp; Glycemic Telemetry</span>
          <span>Deployable anywhere · Vercel Ready</span>
        </div>
      </footer>
    </div>
  );
};

export default function App() {
  return (
    <AuthProvider>
      <DietProvider>
        <MainDashboard />
      </DietProvider>
    </AuthProvider>
  );
}
