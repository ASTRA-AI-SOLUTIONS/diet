import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useAuth } from '../context/AuthContext';
import { Gender, ActivityLevel, DietGoal } from '../types/diet';
import {
  calculateBMR,
  calculateTDEE,
  calculateTargetCalories,
  calculateMacrosFromPercentages,
  getRecommendedSplit,
} from '../utils/nutritionCalculations';
import {
  Flame,
  ArrowRight,
  Sparkles,
  Cloud,
  CheckCircle2,
  ShieldCheck,
  Smartphone,
  Laptop,
  KeyRound,
  Mail,
  Lock,
} from 'lucide-react';

interface AuthViewProps {
  onSuccess?: () => void;
}

export const AuthView: React.FC<AuthViewProps> = ({ onSuccess }) => {
  const {
    register,
    loginWithCloudId,
    loginWithEmailAndPasscode,
  } = useAuth();

  const [isManualSetup, setIsManualSetup] = useState(false);
  const [showSyncInput, setShowSyncInput] = useState(false);
  const [syncIdInput, setSyncIdInput] = useState('');
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncError, setSyncError] = useState('');

  // Email & Passcode cloud sync login state
  const [athleteName, setAthleteName] = useState('');
  const [athleteEmail, setAthleteEmail] = useState('');
  const [athletePasscode, setAthletePasscode] = useState('');
  const [isEmailLoggingIn, setIsEmailLoggingIn] = useState(false);
  const [emailLoginError, setEmailLoginError] = useState('');

  // Biometrics setup state (used when calibrating athlete profile)
  const [gender, setGender] = useState<Gender>('male');
  const [age, setAge] = useState<string | number>(26);
  const [heightCm, setHeightCm] = useState<string | number>(178);
  const [weightKg, setWeightKg] = useState<string | number>(74);
  const [targetWeightKg, setTargetWeightKg] = useState<string | number>(72);
  const [activityLevel, setActivityLevel] = useState<ActivityLevel>('moderate');
  const [goal, setGoal] = useState<DietGoal>('maintenance');

  // Numeric fallbacks for calculations
  const numAge = typeof age === 'number' ? age : Number(age) || 26;
  const numHeight = typeof heightCm === 'number' ? heightCm : Number(heightCm) || 178;
  const numWeight = typeof weightKg === 'number' ? weightKg : Number(weightKg) || 74;
  const numTargetWeight = typeof targetWeightKg === 'number' ? targetWeightKg : Number(targetWeightKg) || 72;

  // Live calculation for Onboarding Protocol
  const bmr = calculateBMR(gender, numWeight, numHeight, numAge);
  const tdee = calculateTDEE(gender, numWeight, numHeight, numAge, activityLevel);
  const targetCalories = calculateTargetCalories(tdee, goal);
  const split = getRecommendedSplit(goal);
  const calculatedTargets = calculateMacrosFromPercentages(
    targetCalories,
    split.proteinPct,
    split.carbsPct,
    split.fatsPct,
    numWeight
  );

  const handleEmailCloudLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setEmailLoginError('');
    const cleanEmail = athleteEmail.trim().toLowerCase();
    if (!cleanEmail || !cleanEmail.includes('@')) {
      setEmailLoginError('Please enter a valid email address.');
      return;
    }
    setIsEmailLoggingIn(true);
    try {
      const res = await loginWithEmailAndPasscode(cleanEmail, athletePasscode);
      if (res.success) {
        if (onSuccess) onSuccess();
      } else if (res.requiresRegister) {
        // First time user with this email - forward to calibration with email preserved
        setIsManualSetup(true);
      } else if (res.error) {
        setEmailLoginError(res.error);
      }
    } catch {
      setEmailLoginError('Failed to connect to cloud database.');
    } finally {
      setIsEmailLoggingIn(false);
    }
  };

  const handleSyncWithCloudId = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!syncIdInput.trim()) return;
    setIsSyncing(true);
    setSyncError('');
    try {
      const ok = await loginWithCloudId(syncIdInput.trim());
      if (ok) {
        if (onSuccess) onSuccess();
      } else {
        setSyncError('Athlete Sync ID not found in database. Verify the ID or create a new protocol below.');
      }
    } catch {
      setSyncError('Failed to connect to cloud database.');
    } finally {
      setIsSyncing(false);
    }
  };

  const handleCompleteSetup = async (e: React.FormEvent) => {
    e.preventDefault();

    const nameToUse = athleteName.trim() || 'Athlete';
    const emailToUse = athleteEmail.trim() || 'sarovarlakes@gmail.com';

    await register({
      name: nameToUse,
      email: emailToUse,
      avatarColor: 'from-zinc-400 to-zinc-600',
      gender,
      age: numAge,
      heightCm: numHeight,
      weightKg: numWeight,
      targetWeightKg: numTargetWeight,
      activityLevel,
      goal,
      dietaryPreferences: [],
      macroSplit: split,
      targets: calculatedTargets,
      passcode: athletePasscode.trim() || undefined,
    });

    if (onSuccess) onSuccess();
  };

  return (
    <div className="min-h-screen bg-[#09090b] flex flex-col justify-center items-center p-4 sm:p-6 text-zinc-100 antialiased selection:bg-white/20">
      <div className="w-full max-w-lg space-y-6">
        {/* Brand Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center p-3 rounded-2xl bg-zinc-900 border border-white/[0.1] shadow-2xl mb-1">
            <Flame className="w-7 h-7 text-emerald-400 fill-emerald-500/20" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
            AstraDiet
          </h1>
          <p className="text-xs sm:text-sm text-zinc-400 max-w-sm mx-auto">
            Precision Dietary &amp; Glycemic Telemetry with Multi-Device Real-Time Cloud Sync
          </p>
        </div>

        {/* Card Container */}
        <div className="rounded-2xl border border-white/[0.08] bg-[#111114] p-6 shadow-2xl">
          <AnimatePresence mode="wait">
            {!isManualSetup ? (
              /* PRIMARY ATHLETE CLOUD SYNC SCREEN */
              <motion.div
                key="cloud-sync-screen"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                className="space-y-5"
              >
                <div className="text-center space-y-1.5 pb-2 border-b border-white/[0.06]">
                  <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[11px] font-semibold">
                    <Cloud className="w-3.5 h-3.5" />
                    <span>Cross-Device Cloud Synchronization</span>
                  </div>
                  <h2 className="text-base font-bold text-white pt-1">
                    Athlete Cloud Account
                  </h2>
                  <p className="text-xs text-zinc-400">
                    Sign in to sync your nutrition protocol, meals, and hydration across all your devices.
                  </p>
                </div>

                {/* Direct Email & PIN Form */}
                <form onSubmit={handleEmailCloudLogin} className="space-y-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-zinc-300 mb-1">
                      Account Email
                    </label>
                    <div className="relative">
                      <Mail className="w-4 h-4 text-zinc-400 absolute left-3 top-2.5" />
                      <input
                        type="email"
                        required
                        value={athleteEmail}
                        onChange={(e) => setAthleteEmail(e.target.value)}
                        placeholder="athlete@example.com"
                        className="w-full rounded-xl border border-white/[0.1] bg-zinc-950 pl-9 pr-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500 transition-colors"
                      />
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="block text-[11px] font-semibold text-zinc-300">
                        Athlete PIN / Passcode
                      </label>
                      <span className="text-[10px] text-zinc-400">4+ characters</span>
                    </div>
                    <div className="relative">
                      <Lock className="w-4 h-4 text-zinc-400 absolute left-3 top-2.5" />
                      <input
                        type="password"
                        value={athletePasscode}
                        onChange={(e) => setAthletePasscode(e.target.value)}
                        placeholder="e.g. 1234 or your PIN"
                        className="w-full rounded-xl border border-white/[0.1] bg-zinc-950 pl-9 pr-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500 transition-colors"
                      />
                    </div>
                  </div>

                  {emailLoginError && (
                    <div className="text-xs text-rose-400 bg-rose-500/10 border border-rose-500/20 rounded-xl p-2.5 text-center">
                      {emailLoginError}
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={isEmailLoggingIn}
                    className="w-full flex items-center justify-center gap-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-zinc-950 py-2.5 px-4 font-bold transition-all text-xs sm:text-sm cursor-pointer shadow-lg disabled:opacity-50 active:scale-[0.99]"
                  >
                    <span>{isEmailLoggingIn ? 'Syncing with Cloud...' : 'Sign In & Sync Across Devices'}</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </form>

                <div className="relative flex py-1 items-center">
                  <div className="flex-grow border-t border-white/[0.06]"></div>
                  <span className="flex-shrink mx-3 text-[11px] text-zinc-500 uppercase font-mono">or</span>
                  <div className="flex-grow border-t border-white/[0.06]"></div>
                </div>

                <div className="space-y-2">
                  <button
                    type="button"
                    onClick={() => setIsManualSetup(true)}
                    className="w-full flex items-center justify-center gap-2 rounded-xl border border-white/[0.08] bg-zinc-900/80 hover:bg-zinc-800 text-zinc-300 hover:text-white py-2.5 px-4 font-semibold transition-all text-xs cursor-pointer active:scale-[0.99]"
                  >
                    <span>Create New Athlete Protocol</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>

                  {/* Sync with existing Cloud ID toggle */}
                  {showSyncInput ? (
                    <form onSubmit={handleSyncWithCloudId} className="space-y-2 pt-1">
                      <div className="flex gap-2">
                        <input
                          type="text"
                          placeholder="Paste Athlete Sync ID (e.g. ath_...)"
                          value={syncIdInput}
                          onChange={(e) => setSyncIdInput(e.target.value)}
                          className="flex-1 rounded-xl border border-white/[0.1] bg-zinc-950 px-3 py-2 text-xs font-mono text-white focus:outline-none focus:border-emerald-500"
                        />
                        <button
                          type="submit"
                          disabled={isSyncing || !syncIdInput.trim()}
                          className="rounded-xl bg-emerald-500 hover:bg-emerald-400 text-zinc-950 px-4 py-2 text-xs font-bold transition-all disabled:opacity-50 cursor-pointer"
                        >
                          {isSyncing ? 'Syncing...' : 'Sync'}
                        </button>
                      </div>
                      {syncError && (
                        <div className="text-[11px] text-rose-400">{syncError}</div>
                      )}
                      <button
                        type="button"
                        onClick={() => setShowSyncInput(false)}
                        className="text-[11px] text-zinc-400 hover:text-zinc-200 cursor-pointer block"
                      >
                        Cancel Sync
                      </button>
                    </form>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setShowSyncInput(true)}
                      className="w-full flex items-center justify-center gap-2 text-[11px] text-zinc-400 hover:text-zinc-200 py-1 transition-colors cursor-pointer"
                    >
                      <KeyRound className="w-3.5 h-3.5 text-zinc-400" />
                      <span>Sync with Existing Athlete Cloud ID</span>
                    </button>
                  )}
                </div>

                {/* Multi-Device Sync Benefits */}
                <div className="grid grid-cols-2 gap-2.5 pt-1">
                  <div className="flex items-start gap-2.5 p-2.5 rounded-xl bg-zinc-900/50 border border-white/[0.04]">
                    <Smartphone className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                    <div>
                      <div className="text-xs font-semibold text-zinc-200">Mobile Phone</div>
                      <div className="text-[11px] text-zinc-400">Log meals on the go</div>
                    </div>
                  </div>
                  <div className="flex items-start gap-2.5 p-2.5 rounded-xl bg-zinc-900/50 border border-white/[0.04]">
                    <Laptop className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                    <div>
                      <div className="text-xs font-semibold text-zinc-200">Laptop &amp; Tablet</div>
                      <div className="text-[11px] text-zinc-400">Live analytics sync</div>
                    </div>
                  </div>
                </div>
              </motion.div>
            ) : (
              /* ONBOARDING PROTOCOL SETUP */
              <motion.div
                key="onboarding-setup"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                className="space-y-4"
              >
                <div className="pb-3 border-b border-white/[0.08]">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                      <span className="text-xs font-bold uppercase tracking-wider text-emerald-400">
                        Athlete Protocol Setup
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setIsManualSetup(false)}
                      className="text-[11px] text-zinc-400 hover:text-white cursor-pointer"
                    >
                      Back to Sign In
                    </button>
                  </div>
                  <h3 className="text-lg font-bold text-white mt-1">
                    Calibrate Your Athlete Protocol
                  </h3>
                  <p className="text-xs text-zinc-400 mt-0.5">
                    Configure your biological metrics to model exact daily energy expenditure and macronutrient splits.
                  </p>
                </div>

                <form onSubmit={handleCompleteSetup} className="space-y-4">
                  <div className="space-y-2.5">
                    <div className="grid grid-cols-2 gap-2.5">
                      <div>
                        <label className="block text-[11px] text-zinc-300 font-semibold mb-1">
                          Athlete Name
                        </label>
                        <input
                          type="text"
                          value={athleteName}
                          onChange={(e) => setAthleteName(e.target.value)}
                          placeholder="e.g. Sarovar"
                          className="w-full rounded-lg border border-white/[0.08] bg-zinc-950 px-3 py-1.5 text-xs text-white focus:border-zinc-400 focus:outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] text-zinc-300 font-semibold mb-1">
                          Email
                        </label>
                        <input
                          type="email"
                          required
                          value={athleteEmail}
                          onChange={(e) => setAthleteEmail(e.target.value)}
                          placeholder="athlete@domain.com"
                          className="w-full rounded-lg border border-white/[0.08] bg-zinc-950 px-3 py-1.5 text-xs text-white focus:border-zinc-400 focus:outline-none"
                        />
                      </div>
                    </div>
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="block text-[11px] text-zinc-300 font-semibold">
                          Athlete PIN / Passcode (for signing in on other devices)
                        </label>
                        <span className="text-[10px] text-zinc-400">Optional (e.g. 1234)</span>
                      </div>
                      <input
                        type="password"
                        value={athletePasscode}
                        onChange={(e) => setAthletePasscode(e.target.value)}
                        placeholder="e.g. 1234"
                        className="w-full rounded-lg border border-white/[0.08] bg-zinc-950 px-3 py-1.5 text-xs text-white focus:border-zinc-400 focus:outline-none"
                      />
                    </div>
                  </div>
                  {/* Sex Selector */}
                  <div>
                    <label className="block text-xs font-semibold text-zinc-300 mb-1">
                      Biological Sex (for metabolic BMR equation)
                    </label>
                    <div className="flex gap-2">
                      {(['male', 'female', 'other'] as Gender[]).map((g) => (
                        <button
                          type="button"
                          key={g}
                          onClick={() => setGender(g)}
                          className={`flex-1 py-1.5 text-xs font-semibold capitalize rounded-xl border transition-all cursor-pointer ${
                            gender === g
                              ? 'bg-zinc-800 text-white border-white/[0.2] shadow-sm'
                              : 'border-white/[0.06] bg-zinc-900 text-zinc-400 hover:text-zinc-200'
                          }`}
                        >
                          {g}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Biometrics Inputs: Age, Height, Weight, Target Weight */}
                  <div className="grid grid-cols-2 gap-2.5 bg-zinc-900/60 p-3.5 rounded-xl border border-white/[0.06]">
                    <div>
                      <label className="block text-[11px] text-zinc-400 mb-1">Age (years)</label>
                      <input
                        type="number"
                        step="any"
                        value={age}
                        onChange={(e) => setAge(e.target.value)}
                        onBlur={() => {
                          if (age === '' || Number(age) <= 0) setAge(26);
                        }}
                        placeholder="26"
                        className="w-full rounded-lg border border-white/[0.08] bg-zinc-950 px-2.5 py-1.5 text-xs text-center text-white font-mono font-bold focus:border-zinc-400 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] text-zinc-400 mb-1">Height (cm)</label>
                      <input
                        type="number"
                        step="any"
                        value={heightCm}
                        onChange={(e) => setHeightCm(e.target.value)}
                        onBlur={() => {
                          if (heightCm === '' || Number(heightCm) <= 0) setHeightCm(178);
                        }}
                        placeholder="178"
                        className="w-full rounded-lg border border-white/[0.08] bg-zinc-950 px-2.5 py-1.5 text-xs text-center text-white font-mono font-bold focus:border-zinc-400 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] text-zinc-400 mb-1">Current Weight (kg)</label>
                      <input
                        type="number"
                        step="any"
                        value={weightKg}
                        onChange={(e) => setWeightKg(e.target.value)}
                        onBlur={() => {
                          if (weightKg === '' || Number(weightKg) <= 0) setWeightKg(74);
                        }}
                        placeholder="74"
                        className="w-full rounded-lg border border-white/[0.08] bg-zinc-950 px-2.5 py-1.5 text-xs text-center text-white font-mono font-bold focus:border-zinc-400 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] text-zinc-400 mb-1">Target Weight (kg)</label>
                      <input
                        type="number"
                        step="any"
                        value={targetWeightKg}
                        onChange={(e) => setTargetWeightKg(e.target.value)}
                        onBlur={() => {
                          if (targetWeightKg === '' || Number(targetWeightKg) <= 0) setTargetWeightKg(72);
                        }}
                        placeholder="72"
                        className="w-full rounded-lg border border-white/[0.08] bg-zinc-950 px-2.5 py-1.5 text-xs text-center text-white font-mono font-bold focus:border-zinc-400 focus:outline-none"
                      />
                    </div>
                  </div>

                  {/* Physical Activity Level */}
                  <div>
                    <label className="block text-xs font-semibold text-zinc-300 mb-1.5">
                      Physical Activity Level
                    </label>
                    <div className="grid grid-cols-2 sm:grid-cols-5 gap-1 text-xs">
                      {(
                        [
                          { id: 'sedentary', label: 'Sedentary' },
                          { id: 'light', label: 'Light' },
                          { id: 'moderate', label: 'Moderate' },
                          { id: 'very_active', label: 'Very Active' },
                          { id: 'athlete', label: 'Athlete' },
                        ] as const
                      ).map((item) => (
                        <button
                          type="button"
                          key={item.id}
                          onClick={() => setActivityLevel(item.id)}
                          className={`p-2 rounded-xl border text-center transition-all cursor-pointer ${
                            activityLevel === item.id
                              ? 'border-white bg-zinc-100 text-zinc-950 font-bold shadow-sm'
                              : 'border-white/[0.06] bg-zinc-900/60 text-zinc-400 hover:text-zinc-200'
                          }`}
                        >
                          <div className="text-[11px] font-semibold">{item.label}</div>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Diet Goal */}
                  <div>
                    <label className="block text-xs font-semibold text-zinc-300 mb-1.5">
                      Target Nutritional Goal
                    </label>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5 text-xs">
                      {(
                        [
                          { id: 'weight_loss', label: 'Fat Loss (-500 kcal)' },
                          { id: 'mild_loss', label: 'Mild Cut (-250 kcal)' },
                          { id: 'maintenance', label: 'Maintain (0 kcal)' },
                          { id: 'lean_bulk', label: 'Lean Gain (+250 kcal)' },
                          { id: 'muscle_gain', label: 'Muscle Mass (+450 kcal)' },
                          { id: 'keto', label: 'Keto / Low-Carb' },
                        ] as const
                      ).map((g) => (
                        <button
                          type="button"
                          key={g.id}
                          onClick={() => setGoal(g.id)}
                          className={`p-2 rounded-xl border text-left transition-all cursor-pointer ${
                            goal === g.id
                              ? 'border-white bg-zinc-100 text-zinc-950 font-bold shadow-sm'
                              : 'border-white/[0.06] bg-zinc-900/60 text-zinc-400 hover:text-zinc-200'
                          }`}
                        >
                          <span className="text-[11px] block">{g.label}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Live Science Card */}
                  <div className="rounded-xl border border-white/[0.1] bg-zinc-900/90 p-3.5 space-y-2.5">
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="text-[10px] font-mono uppercase tracking-wider text-zinc-400 block">
                          Calibrated Daily Intake
                        </span>
                        <div className="flex items-baseline gap-1.5">
                          <span className="font-mono text-2xl font-extrabold text-white tabular-nums">
                            {targetCalories.toLocaleString()}
                          </span>
                          <span className="text-xs text-zinc-400 font-mono">kcal / day</span>
                        </div>
                      </div>
                      <div className="text-right text-[11px] font-mono text-zinc-400">
                        <div>BMR: {bmr} kcal</div>
                        <div>TDEE: {tdee} kcal</div>
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-1.5 pt-2 border-t border-white/[0.06] text-center font-mono text-xs">
                      <div className="p-1.5 rounded-lg bg-zinc-950/60 border border-white/[0.04]">
                        <span className="text-[10px] text-zinc-500 block">Protein</span>
                        <span className="font-bold text-emerald-400">
                          {calculatedTargets.protein}g
                        </span>
                      </div>
                      <div className="p-1.5 rounded-lg bg-zinc-950/60 border border-white/[0.04]">
                        <span className="text-[10px] text-zinc-500 block">Carbs</span>
                        <span className="font-bold text-amber-400">
                          {calculatedTargets.carbs}g
                        </span>
                      </div>
                      <div className="p-1.5 rounded-lg bg-zinc-950/60 border border-white/[0.04]">
                        <span className="text-[10px] text-zinc-500 block">Fats</span>
                        <span className="font-bold text-zinc-300">
                          {calculatedTargets.fats}g
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Submit Button */}
                  <button
                    type="submit"
                    className="w-full flex items-center justify-center gap-2 rounded-xl bg-zinc-100 text-zinc-950 hover:bg-white py-3 font-bold transition-all text-xs sm:text-sm cursor-pointer shadow-lg active:scale-[0.99]"
                  >
                    <span>Save Protocol &amp; Launch Dashboard</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </form>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
};
