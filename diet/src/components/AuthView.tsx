import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useAuth } from '../context/AuthContext';
import { Gender, ActivityLevel, DietGoal, UserProfile } from '../types/diet';
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
  UserPlus,
  LogIn,
  CheckCircle2,
  Sparkles,
  ChevronRight,
  Sliders,
  Check,
  RotateCcw,
  Cloud,
} from 'lucide-react';

interface AuthViewProps {
  onSuccess?: () => void;
}

export const AuthView: React.FC<AuthViewProps> = ({ onSuccess }) => {
  const {
    users,
    login,
    register,
    switchUser,
    updateUser,
    signInWithGoogle,
    pendingGoogleUser,
  } = useAuth();

  const [mode, setMode] = useState<'login' | 'register' | 'calibrate'>(() => {
    return users.length === 0 ? 'register' : 'login';
  });

  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [googleError, setGoogleError] = useState('');

  // Selected user for login calibration
  const [selectedUserForCalib, setSelectedUserForCalib] = useState<UserProfile | null>(null);

  // Auto-fill registration if authenticated via Google
  React.useEffect(() => {
    if (pendingGoogleUser) {
      setName(pendingGoogleUser.name || '');
      setEmail(pendingGoogleUser.email || '');
      setMode('register');
      setRegStep(1);
    }
  }, [pendingGoogleUser]);

  // Calibration state during login
  const [calibHeight, setCalibHeight] = useState(175);
  const [calibWeight, setCalibWeight] = useState(70);
  const [calibGoal, setCalibGoal] = useState<DietGoal>('maintenance');
  const [calibActivity, setCalibActivity] = useState<ActivityLevel>('moderate');

  // Login form state
  const [loginEmail, setLoginEmail] = useState('');
  const [loginError, setLoginError] = useState('');

  // Register form state
  const [regStep, setRegStep] = useState<1 | 2>(1);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [gender, setGender] = useState<Gender>('male');
  const [age, setAge] = useState(26);
  const [heightCm, setHeightCm] = useState(178);
  const [weightKg, setWeightKg] = useState(74);
  const [targetWeightKg, setTargetWeightKg] = useState(72);
  const [activityLevel, setActivityLevel] = useState<ActivityLevel>('moderate');
  const [goal, setGoal] = useState<DietGoal>('maintenance');

  // Live calculation for Register
  const bmr = calculateBMR(gender, weightKg, heightCm, age);
  const tdee = calculateTDEE(gender, weightKg, heightCm, age, activityLevel);
  const targetCalories = calculateTargetCalories(tdee, goal);
  const split = getRecommendedSplit(goal);
  const calculatedTargets = calculateMacrosFromPercentages(
    targetCalories,
    split.proteinPct,
    split.carbsPct,
    split.fatsPct,
    weightKg
  );

  // Live calculation for Login Calibration
  const calibBmr = selectedUserForCalib
    ? calculateBMR(selectedUserForCalib.gender, calibWeight, calibHeight, selectedUserForCalib.age)
    : 1800;
  const calibTdee = calculateTDEE(
    selectedUserForCalib?.gender || 'male',
    calibWeight,
    calibHeight,
    selectedUserForCalib?.age || 26,
    calibActivity
  );
  const calibCalories = calculateTargetCalories(calibTdee, calibGoal);
  const calibSplit = getRecommendedSplit(calibGoal);
  const calibTargets = calculateMacrosFromPercentages(
    calibCalories,
    calibSplit.proteinPct,
    calibSplit.carbsPct,
    calibSplit.fatsPct,
    calibWeight
  );

  // User selects an existing profile to sign in
  const startLoginCalibration = (user: UserProfile) => {
    setSelectedUserForCalib(user);
    setCalibHeight(user.heightCm);
    setCalibWeight(user.weightKg);
    setCalibGoal(user.goal);
    setCalibActivity(user.activityLevel);
    setMode('calibrate');
  };

  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');
    if (!loginEmail.trim()) {
      setLoginError('Please enter your email.');
      return;
    }

    const found = users.find((u) => u.email.toLowerCase() === loginEmail.trim().toLowerCase());
    if (found) {
      startLoginCalibration(found);
    } else {
      setLoginError('No profile found with that email. Try a demo account or register below.');
    }
  };

  const handleApplyCalibrationAndEnter = () => {
    if (!selectedUserForCalib) return;

    // Update user stats with newly verified height, weight, goal, and accurate caloric needs
    updateUser(selectedUserForCalib.id, {
      heightCm: Number(calibHeight),
      weightKg: Number(calibWeight),
      goal: calibGoal,
      activityLevel: calibActivity,
      macroSplit: {
        proteinPct: calibSplit.proteinPct,
        carbsPct: calibSplit.carbsPct,
        fatsPct: calibSplit.fatsPct,
      },
      targets: calibTargets,
    });

    switchUser(selectedUserForCalib.id);
    if (onSuccess) onSuccess();
  };

  const handleQuickSkipCalibration = () => {
    if (!selectedUserForCalib) return;
    switchUser(selectedUserForCalib.id);
    if (onSuccess) onSuccess();
  };

  const handleGoogleSignIn = async () => {
    setGoogleError('');
    setIsGoogleLoading(true);
    try {
      const found = await signInWithGoogle();
      if (found) {
        if (onSuccess) onSuccess();
      }
    } catch (err: any) {
      console.error('Google Sign In Error', err);
      setGoogleError(err?.message || 'Failed to sign in with Google.');
    } finally {
      setIsGoogleLoading(false);
    }
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim()) return;

    await register({
      name: name.trim(),
      email: email.trim(),
      avatarColor: 'from-zinc-400 to-zinc-600',
      gender,
      age: Number(age),
      heightCm: Number(heightCm),
      weightKg: Number(weightKg),
      targetWeightKg: Number(targetWeightKg),
      activityLevel,
      goal,
      dietaryPreferences: ['Custom Plan'],
      macroSplit: {
        proteinPct: split.proteinPct,
        carbsPct: split.carbsPct,
        fatsPct: split.fatsPct,
      },
      targets: calculatedTargets,
    });

    if (onSuccess) onSuccess();
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center p-4 bg-[#09090b] text-zinc-100 relative">
      {/* Subtle architectural ambient highlight */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-gradient-to-b from-white/[0.04] to-transparent rounded-full blur-3xl pointer-events-none" />

      <div className="relative z-10 w-full max-w-lg">
        {/* Brand Lockup */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center h-10 w-10 rounded-xl bg-zinc-100 text-zinc-950 mb-3 shadow-lg shadow-white/5">
            <Flame className="w-5 h-5 fill-zinc-950 stroke-[2.2]" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-white">
            AstraDiet
          </h1>
          <p className="text-xs text-zinc-400 mt-1">
            Precision macronutrient & caloric balance intelligence
          </p>
        </div>

        {/* Card Container */}
        <div className="rounded-2xl border border-white/[0.08] bg-[#111114] p-6 shadow-2xl">
          {/* Cloud Sync with Google */}
          {mode !== 'calibrate' && (
            <div className="mb-5 space-y-2.5">
              <button
                type="button"
                onClick={handleGoogleSignIn}
                disabled={isGoogleLoading}
                className="w-full flex items-center justify-center gap-2.5 rounded-xl border border-white/[0.12] bg-white text-zinc-950 hover:bg-zinc-100 py-2.5 px-4 font-bold transition-all text-xs cursor-pointer shadow-md disabled:opacity-50"
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
                <span>{isGoogleLoading ? 'Connecting to Cloud Sync...' : 'Continue with Google (Sync All Devices)'}</span>
              </button>

              {googleError && (
                <p className="text-[11px] text-rose-400 text-center font-medium bg-rose-500/10 border border-rose-500/20 rounded-lg p-2">
                  {googleError}
                </p>
              )}

              <div className="flex items-center justify-center gap-1.5 text-[11px] text-zinc-400">
                <Cloud className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <span>Cloud syncs meals, weight &amp; macros across your phone, laptop &amp; tablet</span>
              </div>

              <div className="relative flex items-center justify-center pt-2">
                <div className="border-t border-white/[0.08] w-full" />
                <span className="bg-[#111114] px-2.5 text-[10px] uppercase tracking-wider text-zinc-500 font-semibold absolute">
                  or custom profile
                </span>
              </div>
            </div>
          )}

          {mode !== 'calibrate' && (
            <div className="flex rounded-xl bg-zinc-900/90 p-1 border border-white/[0.06] mb-6">
              <button
                onClick={() => {
                  setMode('login');
                  setLoginError('');
                }}
                className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-all flex items-center justify-center gap-1.5 ${
                  mode === 'login'
                    ? 'bg-zinc-800 text-white shadow-sm'
                    : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                <LogIn className="w-3.5 h-3.5" />
                Sign In
              </button>
              <button
                onClick={() => {
                  setMode('register');
                  setRegStep(1);
                }}
                className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-all flex items-center justify-center gap-1.5 ${
                  mode === 'register'
                    ? 'bg-zinc-800 text-white shadow-sm'
                    : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                <UserPlus className="w-3.5 h-3.5" />
                New Account
              </button>
            </div>
          )}

          <AnimatePresence mode="wait">
            {/* LOGIN STATE */}
            {mode === 'login' && (
              <motion.div
                key="login"
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                className="space-y-5"
              >
                {users.length > 0 ? (
                  <div>
                    <span className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider block mb-2.5">
                      Select User Profile
                    </span>
                    <div className="space-y-2">
                      {users.map((u) => (
                        <button
                          key={u.id}
                          type="button"
                          onClick={() => startLoginCalibration(u)}
                          className="w-full flex items-center justify-between p-3 rounded-xl border border-white/[0.06] bg-zinc-900/50 hover:bg-zinc-800/80 hover:border-white/[0.12] transition-all text-left group cursor-pointer"
                        >
                          <div className="flex items-center gap-3">
                            <div className="h-9 w-9 rounded-lg bg-zinc-800 border border-white/[0.08] flex items-center justify-center font-bold text-white text-xs">
                              {u.name[0]}
                            </div>
                            <div>
                              <div className="text-sm font-semibold text-zinc-100 group-hover:text-white transition-colors">
                                {u.name}
                              </div>
                              <div className="text-[11px] text-zinc-400 font-mono">
                                {u.weightKg} kg · {u.targets.calories} kcal · {u.goal.replace('_', ' ')}
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center gap-1 text-xs text-zinc-400 group-hover:text-zinc-100 transition-all font-medium">
                            Verify & Enter
                            <ChevronRight className="w-3.5 h-3.5" />
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-6 px-4 rounded-xl border border-dashed border-white/[0.08] bg-zinc-900/30 space-y-3">
                    <p className="text-xs text-zinc-400">
                      No athlete profiles exist yet. Create your personalized nutrition protocol to begin.
                    </p>
                    <button
                      type="button"
                      onClick={() => {
                        setMode('register');
                        setRegStep(1);
                      }}
                      className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-zinc-100 text-zinc-950 font-bold text-xs hover:bg-white transition-colors cursor-pointer"
                    >
                      <UserPlus className="w-3.5 h-3.5" />
                      Create Athlete Protocol
                    </button>
                  </div>
                )}

                {users.length > 0 && (
                  <>
                    <div className="relative flex items-center justify-center my-4">
                      <div className="border-t border-white/[0.06] w-full" />
                      <span className="bg-[#111114] px-3 text-[11px] uppercase tracking-wider text-zinc-500 font-medium">
                        Or via email
                      </span>
                    </div>

                    <form onSubmit={handleLoginSubmit} className="space-y-3.5">
                  <div>
                    <label className="block text-xs font-medium text-zinc-300 mb-1">
                      Account Email
                    </label>
                    <input
                      type="email"
                      placeholder="you@example.com"
                      value={loginEmail}
                      onChange={(e) => setLoginEmail(e.target.value)}
                      className="w-full rounded-xl border border-white/[0.08] bg-zinc-900/90 px-3.5 py-2.5 text-xs text-zinc-100 placeholder-zinc-500 focus:border-zinc-400 focus:outline-none"
                    />
                  </div>

                  {loginError && (
                    <div className="rounded-xl border border-rose-500/20 bg-rose-500/10 p-2.5 text-xs text-rose-300">
                      {loginError}
                    </div>
                  )}

                  <button
                    type="submit"
                    className="w-full flex items-center justify-center gap-2 rounded-xl bg-zinc-100 text-zinc-950 hover:bg-white py-2.5 font-semibold text-xs transition-all cursor-pointer shadow-sm"
                  >
                    Proceed to Stat Calibration
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </form>
              </>
            )}
              </motion.div>
            )}

            {/* ON-LOGIN BIOMETRICS & CALORIC CALIBRATION STEP */}
            {mode === 'calibrate' && selectedUserForCalib && (
              <motion.div
                key="calibrate"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                className="space-y-4"
              >
                <div className="flex items-center justify-between pb-3 border-b border-white/[0.08]">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="h-2 w-2 rounded-full bg-emerald-400" />
                      <span className="text-xs font-semibold text-zinc-200">
                        Daily Check-in & Calibration
                      </span>
                    </div>
                    <p className="text-[11px] text-zinc-400 mt-0.5">
                      Confirm height, current weight & goal to refresh your accurate caloric baseline.
                    </p>
                  </div>
                  <button
                    onClick={() => setMode('login')}
                    className="text-[11px] text-zinc-400 hover:text-zinc-200 flex items-center gap-1"
                  >
                    <RotateCcw className="w-3 h-3" />
                    Change User
                  </button>
                </div>

                {/* User greeting */}
                <div className="flex items-center gap-3 bg-zinc-900/70 p-3 rounded-xl border border-white/[0.06]">
                  <div className="h-8 w-8 rounded-lg bg-zinc-800 flex items-center justify-center font-bold text-white text-xs">
                    {selectedUserForCalib.name[0]}
                  </div>
                  <div className="flex-1">
                    <span className="text-xs font-bold text-white block">
                      {selectedUserForCalib.name}
                    </span>
                    <span className="text-[10px] text-zinc-400 font-mono">
                      {selectedUserForCalib.gender.toUpperCase()} · {selectedUserForCalib.age} yrs
                    </span>
                  </div>
                </div>

                {/* Biometrics Inputs: Height & Weight */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-zinc-900/60 p-3 rounded-xl border border-white/[0.06]">
                    <label className="text-[11px] text-zinc-400 block mb-1">
                      Current Height (cm)
                    </label>
                    <div className="flex items-center gap-1.5">
                      <input
                        type="number"
                        min="100"
                        max="240"
                        value={calibHeight}
                        onChange={(e) => setCalibHeight(parseInt(e.target.value) || 170)}
                        className="w-full bg-zinc-950 border border-white/[0.08] rounded-lg px-2.5 py-1.5 text-sm font-mono font-bold text-white text-center focus:border-zinc-400 focus:outline-none"
                      />
                      <span className="text-xs text-zinc-500 font-mono">cm</span>
                    </div>
                  </div>

                  <div className="bg-zinc-900/60 p-3 rounded-xl border border-white/[0.06]">
                    <label className="text-[11px] text-zinc-400 block mb-1">
                      Today&apos;s Weight (kg)
                    </label>
                    <div className="flex items-center gap-1.5">
                      <input
                        type="number"
                        step="0.1"
                        min="30"
                        max="250"
                        value={calibWeight}
                        onChange={(e) => setCalibWeight(parseFloat(e.target.value) || 70)}
                        className="w-full bg-zinc-950 border border-white/[0.08] rounded-lg px-2.5 py-1.5 text-sm font-mono font-bold text-white text-center focus:border-zinc-400 focus:outline-none"
                      />
                      <span className="text-xs text-zinc-500 font-mono">kg</span>
                    </div>
                  </div>
                </div>

                {/* Primary Goal Selector */}
                <div>
                  <label className="text-[11px] font-semibold text-zinc-300 block mb-1.5">
                    Select Active Protocol / Goal
                  </label>
                  <div className="grid grid-cols-3 gap-1.5 text-xs">
                    {(
                      [
                        { id: 'weight_loss', label: 'Fat Loss', sub: '-500 kcal' },
                        { id: 'maintenance', label: 'Maintain', sub: 'Equilibrium' },
                        { id: 'muscle_gain', label: 'Muscle Gain', sub: '+450 kcal' },
                        { id: 'mild_loss', label: 'Mild Cut', sub: '-250 kcal' },
                        { id: 'lean_bulk', label: 'Lean Gain', sub: '+250 kcal' },
                        { id: 'keto', label: 'Keto Low-Carb', sub: 'High Fat' },
                      ] as const
                    ).map((g) => (
                      <button
                        type="button"
                        key={g.id}
                        onClick={() => setCalibGoal(g.id)}
                        className={`p-2 rounded-xl border text-left transition-all ${
                          calibGoal === g.id
                            ? 'bg-zinc-800 border-white/[0.2] text-white font-semibold'
                            : 'bg-zinc-900/40 border-white/[0.04] text-zinc-400 hover:text-zinc-200'
                        }`}
                      >
                        <div className="text-[11px]">{g.label}</div>
                        <div className="text-[9px] text-zinc-500 font-mono">{g.sub}</div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Instant Caloric Target Calculation Card */}
                <div className="rounded-xl border border-white/[0.1] bg-zinc-900/90 p-3.5 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-[10px] font-mono uppercase tracking-wider text-zinc-400 block">
                        Calibrated Daily Target
                      </span>
                      <div className="flex items-baseline gap-1.5">
                        <span className="font-mono text-2xl font-extrabold text-white tabular-nums">
                          {calibCalories.toLocaleString()}
                        </span>
                        <span className="text-xs text-zinc-400 font-mono">kcal / day</span>
                      </div>
                    </div>
                    <div className="text-right text-[11px] font-mono text-zinc-400">
                      <div>BMR: {calibBmr} kcal</div>
                      <div>TDEE: {calibTdee} kcal</div>
                    </div>
                  </div>

                  {/* Calculated Macro Targets */}
                  <div className="grid grid-cols-3 gap-1.5 pt-2 border-t border-white/[0.06] text-center font-mono text-xs">
                    <div className="bg-zinc-950/70 p-1.5 rounded-lg border border-white/[0.04]">
                      <span className="text-[10px] text-zinc-400 block">Protein</span>
                      <span className="font-bold text-zinc-100">{calibTargets.protein}g</span>
                    </div>
                    <div className="bg-zinc-950/70 p-1.5 rounded-lg border border-white/[0.04]">
                      <span className="text-[10px] text-zinc-400 block">Carbs</span>
                      <span className="font-bold text-zinc-100">{calibTargets.carbs}g</span>
                    </div>
                    <div className="bg-zinc-950/70 p-1.5 rounded-lg border border-white/[0.04]">
                      <span className="text-[10px] text-zinc-400 block">Fats</span>
                      <span className="font-bold text-zinc-100">{calibTargets.fats}g</span>
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="space-y-2 pt-1">
                  <button
                    onClick={handleApplyCalibrationAndEnter}
                    className="w-full flex items-center justify-center gap-2 rounded-xl bg-zinc-100 text-zinc-950 hover:bg-white py-2.5 font-semibold text-xs transition-all cursor-pointer shadow-sm"
                  >
                    <Check className="w-4 h-4 stroke-[2.5]" />
                    Set Calibrated Targets & Enter Dashboard
                  </button>

                  <button
                    onClick={handleQuickSkipCalibration}
                    className="w-full text-center py-1.5 text-[11px] text-zinc-400 hover:text-zinc-200 transition-colors"
                  >
                    Keep previous targets without changes
                  </button>
                </div>
              </motion.div>
            )}

            {/* REGISTER STATE */}
            {mode === 'register' && (
              <motion.div
                key="register"
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                className="space-y-4"
              >
                <form onSubmit={handleRegisterSubmit} className="space-y-3.5">
                  {regStep === 1 ? (
                    <>
                      <div>
                        <label className="block text-xs font-semibold text-zinc-300 mb-1">
                          Full Name *
                        </label>
                        <input
                          type="text"
                          required
                          placeholder="e.g. Aryan Sharma"
                          value={name}
                          onChange={(e) => setName(e.target.value)}
                          className="w-full rounded-xl border border-white/[0.08] bg-zinc-900 px-3.5 py-2 text-xs text-white focus:border-zinc-400 focus:outline-none"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-zinc-300 mb-1">
                          Email Address *
                        </label>
                        <input
                          type="email"
                          required
                          placeholder="aryan@example.com"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          className="w-full rounded-xl border border-white/[0.08] bg-zinc-900 px-3.5 py-2 text-xs text-white focus:border-zinc-400 focus:outline-none"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-zinc-300 mb-1">
                          Sex
                        </label>
                        <div className="flex gap-2">
                          {(['male', 'female', 'other'] as Gender[]).map((g) => (
                            <button
                              type="button"
                              key={g}
                              onClick={() => setGender(g)}
                              className={`flex-1 py-1.5 text-xs font-semibold capitalize rounded-xl border transition-all ${
                                gender === g
                                  ? 'bg-zinc-800 text-white border-white/[0.2]'
                                  : 'border-white/[0.06] bg-zinc-900 text-zinc-400'
                              }`}
                            >
                              {g}
                            </button>
                          ))}
                        </div>
                      </div>

                      <div className="pt-2">
                        <button
                          type="button"
                          disabled={!name.trim() || !email.trim()}
                          onClick={() => setRegStep(2)}
                          className="w-full flex items-center justify-center gap-2 rounded-xl bg-zinc-100 text-zinc-950 py-2.5 font-semibold text-xs hover:bg-white transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                        >
                          Next: Height, Weight & Goal
                          <ArrowRight className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="grid grid-cols-2 gap-2 bg-zinc-900/70 p-3 rounded-xl border border-white/[0.06]">
                        <div>
                          <label className="block text-[11px] text-zinc-400 mb-1">Age</label>
                          <input
                            type="number"
                            min="14"
                            max="99"
                            value={age}
                            onChange={(e) => setAge(parseInt(e.target.value) || 20)}
                            className="w-full rounded-lg border border-white/[0.08] bg-zinc-950 px-2 py-1 text-xs text-center text-white font-mono"
                          />
                        </div>
                        <div>
                          <label className="block text-[11px] text-zinc-400 mb-1">Height (cm)</label>
                          <input
                            type="number"
                            min="100"
                            max="230"
                            value={heightCm}
                            onChange={(e) => setHeightCm(parseInt(e.target.value) || 170)}
                            className="w-full rounded-lg border border-white/[0.08] bg-zinc-950 px-2 py-1 text-xs text-center text-white font-mono"
                          />
                        </div>
                        <div>
                          <label className="block text-[11px] text-zinc-400 mb-1">Current Wt (kg)</label>
                          <input
                            type="number"
                            min="30"
                            max="250"
                            step="0.5"
                            value={weightKg}
                            onChange={(e) => setWeightKg(parseFloat(e.target.value) || 70)}
                            className="w-full rounded-lg border border-white/[0.08] bg-zinc-950 px-2 py-1 text-xs text-center text-white font-mono"
                          />
                        </div>
                        <div>
                          <label className="block text-[11px] text-zinc-400 mb-1">Goal Wt (kg)</label>
                          <input
                            type="number"
                            min="30"
                            max="250"
                            step="0.5"
                            value={targetWeightKg}
                            onChange={(e) => setTargetWeightKg(parseFloat(e.target.value) || 70)}
                            className="w-full rounded-lg border border-white/[0.08] bg-zinc-950 px-2 py-1 text-xs text-center text-white font-mono"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-zinc-300 mb-1">
                          Primary Goal
                        </label>
                        <div className="grid grid-cols-2 gap-2 text-xs">
                          {[
                            { id: 'weight_loss', label: 'Fat Loss (-500 kcal)' },
                            { id: 'maintenance', label: 'Maintenance' },
                            { id: 'muscle_gain', label: 'Muscle Gain (+450 kcal)' },
                            { id: 'keto', label: 'Keto / Low-Carb' },
                          ].map((item) => (
                            <button
                              type="button"
                              key={item.id}
                              onClick={() => setGoal(item.id as DietGoal)}
                              className={`p-2 rounded-xl border text-center transition-all ${
                                goal === item.id
                                  ? 'bg-zinc-800 border-white/[0.2] text-white font-semibold'
                                  : 'border-white/[0.06] bg-zinc-900 text-zinc-400'
                              }`}
                            >
                              {item.label}
                            </button>
                          ))}
                        </div>
                      </div>

                      <div className="rounded-xl border border-white/[0.08] bg-zinc-900/90 p-3 flex items-center justify-between">
                        <div>
                          <span className="text-[10px] uppercase font-mono text-zinc-400 block">
                            Calculated Target
                          </span>
                          <span className="font-mono text-xl font-bold text-white">
                            {targetCalories} kcal
                          </span>
                        </div>
                        <span className="text-[11px] text-zinc-400 font-mono">
                          P: {calculatedTargets.protein}g · C: {calculatedTargets.carbs}g · F: {calculatedTargets.fats}g
                        </span>
                      </div>

                      <div className="flex gap-2 pt-2">
                        <button
                          type="button"
                          onClick={() => setRegStep(1)}
                          className="px-4 py-2.5 rounded-xl border border-white/[0.08] bg-zinc-800 text-xs font-semibold text-zinc-300 hover:text-white"
                        >
                          Back
                        </button>
                        <button
                          type="submit"
                          className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-zinc-100 text-zinc-950 hover:bg-white py-2.5 font-semibold text-xs transition-all cursor-pointer shadow-sm"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5 stroke-[2.5]" />
                          Create Profile & Launch
                        </button>
                      </div>
                    </>
                  )}
                </form>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
};
