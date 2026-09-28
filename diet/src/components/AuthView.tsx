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
} from 'lucide-react';

interface AuthViewProps {
  onSuccess?: () => void;
}

export const AuthView: React.FC<AuthViewProps> = ({ onSuccess }) => {
  const { signInWithGoogle, register, pendingGoogleUser } = useAuth();

  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [googleError, setGoogleError] = useState('');

  // Biometrics setup state (used when first signing in with Google)
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

  const handleGoogleSignIn = async () => {
    setGoogleError('');
    setIsGoogleLoading(true);
    try {
      const found = await signInWithGoogle();
      if (found) {
        if (onSuccess) onSuccess();
      }
    } catch (err: unknown) {
      console.error('Google Sign In Error', err);
      const msg = err instanceof Error ? err.message : 'Failed to sign in with Google.';
      setGoogleError(msg);
    } finally {
      setIsGoogleLoading(false);
    }
  };

  const handleCompleteSetup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pendingGoogleUser) return;

    await register({
      name: pendingGoogleUser.name || 'Athlete',
      email: pendingGoogleUser.email,
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
            {!pendingGoogleUser ? (
              /* PRIMARY GOOGLE SIGN-IN SCREEN */
              <motion.div
                key="google-sign-in"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                className="space-y-6"
              >
                <div className="text-center space-y-1.5 pb-2 border-b border-white/[0.06]">
                  <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[11px] font-semibold">
                    <Cloud className="w-3.5 h-3.5" />
                    <span>Real-Time Cloud Synchronization</span>
                  </div>
                  <h2 className="text-base font-bold text-white pt-1">
                    Sign In to AstraDiet
                  </h2>
                  <p className="text-xs text-zinc-400">
                    Your athlete profile, meal journal, macros, and hydration synchronize across all your devices in real-time.
                  </p>
                </div>

                {/* Google Sign In Button */}
                <div className="space-y-3">
                  <button
                    type="button"
                    onClick={handleGoogleSignIn}
                    disabled={isGoogleLoading}
                    className="w-full flex items-center justify-center gap-3 rounded-xl border border-white/[0.12] bg-white text-zinc-950 hover:bg-zinc-100 py-3 px-4 font-bold transition-all text-xs sm:text-sm cursor-pointer shadow-lg disabled:opacity-50 active:scale-[0.99]"
                  >
                    <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
                      <path
                        fill="#4285F4"
                        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                      />
                      <path
                        fill="#34A853"
                        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                      />
                      <path
                        fill="#FBBC05"
                        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                      />
                      <path
                        fill="#EA4335"
                        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                      />
                    </svg>
                    <span>
                      {isGoogleLoading ? 'Connecting to Cloud Account...' : 'Continue with Google'}
                    </span>
                  </button>

                  {googleError && (
                    <div className="text-xs text-rose-400 text-center font-medium bg-rose-500/10 border border-rose-500/20 rounded-xl p-3">
                      {googleError}
                    </div>
                  )}
                </div>

                {/* Multi-Device Sync Benefits */}
                <div className="grid grid-cols-2 gap-2.5 pt-2">
                  <div className="flex items-start gap-2.5 p-3 rounded-xl bg-zinc-900/50 border border-white/[0.04]">
                    <Smartphone className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                    <div>
                      <div className="text-xs font-semibold text-zinc-200">Mobile Phone</div>
                      <div className="text-[11px] text-zinc-400">Log meals on the go instantly</div>
                    </div>
                  </div>
                  <div className="flex items-start gap-2.5 p-3 rounded-xl bg-zinc-900/50 border border-white/[0.04]">
                    <Laptop className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                    <div>
                      <div className="text-xs font-semibold text-zinc-200">Laptop &amp; Tablet</div>
                      <div className="text-[11px] text-zinc-400">View live charts &amp; analytics</div>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-center gap-1.5 text-[11px] text-zinc-400 pt-1">
                  <ShieldCheck className="w-3.5 h-3.5 text-zinc-400" />
                  <span>Secure Firebase Cloud Authentication &amp; Encrypted Database</span>
                </div>
              </motion.div>
            ) : (
              /* ONBOARDING PROTOCOL SETUP FOR NEW GOOGLE USER */
              <motion.div
                key="onboarding-setup"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                className="space-y-4"
              >
                <div className="pb-3 border-b border-white/[0.08]">
                  <div className="flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                    <span className="text-xs font-bold uppercase tracking-wider text-emerald-400">
                      Cloud Account Connected
                    </span>
                  </div>
                  <h3 className="text-lg font-bold text-white mt-1">
                    Complete Your Athlete Protocol
                  </h3>
                  <div className="flex items-center gap-1.5 text-xs text-zinc-400 mt-1">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                    <span className="font-semibold text-zinc-200">{pendingGoogleUser.name}</span>
                    <span>({pendingGoogleUser.email})</span>
                  </div>
                </div>

                <form onSubmit={handleCompleteSetup} className="space-y-4">
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
