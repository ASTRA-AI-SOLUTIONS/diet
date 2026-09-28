import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useAuth } from '../context/AuthContext';
import {
  Gender,
  ActivityLevel,
  DietGoal,
} from '../types/diet';
import {
  calculateBMR,
  calculateTDEE,
  calculateTargetCalories,
  calculateMacrosFromPercentages,
  getRecommendedSplit,
} from '../utils/nutritionCalculations';
import { X, Check, Trash2, AlertTriangle } from 'lucide-react';

interface ProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialShowDelete?: boolean;
}

export const ProfileModal: React.FC<ProfileModalProps> = ({ isOpen, onClose, initialShowDelete = false }) => {
  const { currentUser, updateCurrentUser, deleteAccount } = useAuth();

  const [showDeleteConfirm, setShowDeleteConfirm] = useState(initialShowDelete);

  const [name, setName] = useState('');
  const [gender, setGender] = useState<Gender>('male');
  const [age, setAge] = useState<string | number>(28);
  const [heightCm, setHeightCm] = useState<string | number>(180);
  const [weightKg, setWeightKg] = useState<string | number>(78);
  const [targetWeightKg, setTargetWeightKg] = useState<string | number>(75);
  const [activityLevel, setActivityLevel] = useState<ActivityLevel>('moderate');
  const [goal, setGoal] = useState<DietGoal>('maintenance');

  // Macro percentages
  const [proteinPct, setProteinPct] = useState(30);
  const [carbsPct, setCarbsPct] = useState(40);
  const [fatsPct, setFatsPct] = useState(30);

  // Manual targets override toggle
  const [useCustomCalories, setUseCustomCalories] = useState(false);
  const [customCaloriesInput, setCustomCaloriesInput] = useState<string | number>(2000);

  // Initialize from currentUser
  useEffect(() => {
    if (currentUser) {
      setName(currentUser.name);
      setGender(currentUser.gender);
      setAge(currentUser.age);
      setHeightCm(currentUser.heightCm);
      setWeightKg(currentUser.weightKg);
      setTargetWeightKg(currentUser.targetWeightKg);
      setActivityLevel(currentUser.activityLevel);
      setGoal(currentUser.goal);
      setProteinPct(currentUser.macroSplit.proteinPct);
      setCarbsPct(currentUser.macroSplit.carbsPct);
      setFatsPct(currentUser.macroSplit.fatsPct);
      setCustomCaloriesInput(currentUser.targets.calories);
    }
  }, [currentUser, isOpen]);

  // Numerical conversions for math
  const numAge = typeof age === 'number' ? age : Number(age) || 28;
  const numHeight = typeof heightCm === 'number' ? heightCm : Number(heightCm) || 180;
  const numWeight = typeof weightKg === 'number' ? weightKg : Number(weightKg) || 78;
  const numTargetWeight = typeof targetWeightKg === 'number' ? targetWeightKg : Number(targetWeightKg) || 75;
  const numCustomCalories = typeof customCaloriesInput === 'number' ? customCaloriesInput : Number(customCaloriesInput) || 2000;

  // Real-time calculations
  const bmr = calculateBMR(gender, numWeight, numHeight, numAge);
  const tdee = calculateTDEE(gender, numWeight, numHeight, numAge, activityLevel);
  const calculatedCalories = useCustomCalories
    ? numCustomCalories
    : calculateTargetCalories(tdee, goal);

  const calculatedTargets = calculateMacrosFromPercentages(
    calculatedCalories,
    proteinPct,
    carbsPct,
    fatsPct,
    numWeight
  );

  const handleGoalChange = (newGoal: DietGoal) => {
    setGoal(newGoal);
    const recommended = getRecommendedSplit(newGoal);
    setProteinPct(recommended.proteinPct);
    setCarbsPct(recommended.carbsPct);
    setFatsPct(recommended.fatsPct);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;

    updateCurrentUser({
      name: name.trim() || currentUser.name,
      gender,
      age: numAge,
      heightCm: numHeight,
      weightKg: numWeight,
      targetWeightKg: numTargetWeight,
      activityLevel,
      goal,
      macroSplit: {
        proteinPct,
        carbsPct,
        fatsPct,
      },
      targets: calculatedTargets,
    });

    onClose();
  };

  const handleDeleteProfile = () => {
    if (!currentUser) return;
    deleteAccount(currentUser.id);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md">
        <motion.div
          initial={{ opacity: 0, scale: 0.96, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.96, y: 10 }}
          transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
          className="relative flex flex-col w-full max-w-xl max-h-[92vh] overflow-hidden rounded-2xl border border-white/[0.08] bg-[#111114] text-zinc-100 shadow-2xl"
        >
          {/* Header */}
          <div className="flex items-center justify-between border-b border-white/[0.08] px-6 py-4">
            <div>
              <h3 className="text-base font-bold text-white tracking-tight">
                Personal Nutrition Protocol
              </h3>
              <p className="text-xs text-zinc-400">
                Calibrate biometric formulas (Mifflin-St Jeor), caloric demand, and macro distribution
              </p>
            </div>
            <button
              onClick={onClose}
              className="rounded-lg p-1.5 text-zinc-400 hover:bg-zinc-800 hover:text-white transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Form Body */}
          <form onSubmit={handleSave} className="flex-1 overflow-y-auto p-6 space-y-4">
            {/* Basic Info */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-zinc-300 mb-1">
                  Full Name
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full rounded-xl border border-white/[0.08] bg-zinc-900/90 px-3.5 py-2 text-xs text-white focus:border-zinc-400 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-zinc-300 mb-1">
                  Biological Sex
                </label>
                <div className="flex items-center gap-1.5">
                  {(['male', 'female', 'other'] as Gender[]).map((g) => (
                    <button
                      type="button"
                      key={g}
                      onClick={() => setGender(g)}
                      className={`flex-1 py-2 text-xs font-semibold capitalize rounded-xl border transition-all cursor-pointer ${
                        gender === g
                          ? 'bg-zinc-100 text-zinc-950 border-white font-bold shadow-sm'
                          : 'border-white/[0.06] bg-zinc-900/80 text-zinc-400 hover:text-zinc-200'
                      }`}
                    >
                      {g}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Anthropometrics */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 bg-zinc-950/70 p-3 rounded-xl border border-white/[0.06]">
              <div>
                <label className="block text-[10px] text-zinc-400 mb-1">Age (yrs)</label>
                <input
                  type="number"
                  step="any"
                  value={age}
                  onChange={(e) => setAge(e.target.value)}
                  onBlur={() => {
                    if (age === '' || Number(age) <= 0) setAge(28);
                  }}
                  className="w-full rounded-lg border border-white/[0.08] bg-zinc-900 px-2 py-1 text-xs font-mono text-white text-center focus:border-zinc-400 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[10px] text-zinc-400 mb-1">Height (cm)</label>
                <input
                  type="number"
                  step="any"
                  value={heightCm}
                  onChange={(e) => setHeightCm(e.target.value)}
                  onBlur={() => {
                    if (heightCm === '' || Number(heightCm) <= 0) setHeightCm(180);
                  }}
                  className="w-full rounded-lg border border-white/[0.08] bg-zinc-900 px-2 py-1 text-xs font-mono text-white text-center focus:border-zinc-400 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[10px] text-zinc-400 mb-1">Weight (kg)</label>
                <input
                  type="number"
                  step="any"
                  value={weightKg}
                  onChange={(e) => setWeightKg(e.target.value)}
                  onBlur={() => {
                    if (weightKg === '' || Number(weightKg) <= 0) setWeightKg(78);
                  }}
                  className="w-full rounded-lg border border-white/[0.08] bg-zinc-900 px-2 py-1 text-xs font-mono text-white text-center focus:border-zinc-400 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[10px] text-zinc-400 mb-1">Target Wt (kg)</label>
                <input
                  type="number"
                  step="any"
                  value={targetWeightKg}
                  onChange={(e) => setTargetWeightKg(e.target.value)}
                  onBlur={() => {
                    if (targetWeightKg === '' || Number(targetWeightKg) <= 0) setTargetWeightKg(75);
                  }}
                  className="w-full rounded-lg border border-white/[0.08] bg-zinc-900 px-2 py-1 text-xs font-mono text-white text-center focus:border-zinc-400 focus:outline-none"
                />
              </div>
            </div>

            {/* Activity Level */}
            <div>
              <label className="block text-xs font-medium text-zinc-300 mb-1.5">
                Physical Activity Level
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-1.5 text-xs">
                {(
                  [
                    { id: 'sedentary', label: 'Sedentary', sub: 'Desk work' },
                    { id: 'light', label: 'Light', sub: '1-3 days/wk' },
                    { id: 'moderate', label: 'Moderate', sub: '3-5 days/wk' },
                    { id: 'very_active', label: 'Very Active', sub: '6-7 days/wk' },
                    { id: 'athlete', label: 'Athlete', sub: '2x/day' },
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
                    <div className="text-[9px] opacity-70">{item.sub}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Diet Goal */}
            <div>
              <label className="block text-xs font-medium text-zinc-300 mb-1.5">
                Nutritional Objective
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5 text-xs">
                {(
                  [
                    { id: 'weight_loss', label: 'Fat Loss (-500 kcal)' },
                    { id: 'mild_loss', label: 'Mild Cut (-250 kcal)' },
                    { id: 'maintenance', label: 'Maintenance (0 kcal)' },
                    { id: 'lean_bulk', label: 'Lean Gain (+250 kcal)' },
                    { id: 'muscle_gain', label: 'Muscle Mass (+450 kcal)' },
                    { id: 'keto', label: 'Keto / Low-Carb' },
                  ] as const
                ).map((g) => (
                  <button
                    type="button"
                    key={g.id}
                    onClick={() => handleGoalChange(g.id)}
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

            {/* Live Science Breakdown (BMR, TDEE, Target) */}
            <div className="grid grid-cols-3 gap-2 rounded-xl bg-zinc-950/80 p-3 border border-white/[0.06] text-center">
              <div>
                <span className="text-[10px] uppercase tracking-wider text-zinc-500 block">
                  BMR
                </span>
                <span className="font-mono text-sm font-bold text-zinc-300 tabular-nums">
                  {bmr} kcal
                </span>
              </div>
              <div>
                <span className="text-[10px] uppercase tracking-wider text-zinc-500 block">
                  TDEE
                </span>
                <span className="font-mono text-sm font-bold text-zinc-300 tabular-nums">
                  {tdee} kcal
                </span>
              </div>
              <div className="bg-zinc-900 rounded-lg p-1 border border-white/[0.08]">
                <span className="text-[10px] uppercase tracking-wider text-zinc-400 font-bold block">
                  Target Need
                </span>
                <span className="font-mono text-sm font-bold text-white tabular-nums">
                  {calculatedCalories} kcal
                </span>
              </div>
            </div>

            {/* Macro Split Sliders / Presets */}
            <div className="space-y-3 pt-2 border-t border-white/[0.08]">
              <div className="flex items-center justify-between">
                <label className="text-xs font-medium text-zinc-300">
                  Macro Distribution Ratio
                </label>
                <span className="text-xs font-mono text-zinc-500">
                  Total: {proteinPct + carbsPct + fatsPct}%
                </span>
              </div>

              {/* Quick Split Buttons */}
              <div className="flex flex-wrap gap-1.5 text-xs">
                <button
                  type="button"
                  onClick={() => {
                    setProteinPct(30);
                    setCarbsPct(40);
                    setFatsPct(30);
                  }}
                  className="px-2.5 py-1 rounded-lg bg-zinc-900 border border-white/[0.06] text-zinc-300 hover:text-white cursor-pointer text-xs"
                >
                  Balanced (30/40/30)
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setProteinPct(35);
                    setCarbsPct(35);
                    setFatsPct(30);
                  }}
                  className="px-2.5 py-1 rounded-lg bg-zinc-900 border border-white/[0.06] text-zinc-300 hover:text-white cursor-pointer text-xs"
                >
                  High Protein (35/35/30)
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setProteinPct(25);
                    setCarbsPct(5);
                    setFatsPct(70);
                  }}
                  className="px-2.5 py-1 rounded-lg bg-zinc-900 border border-white/[0.06] text-zinc-300 hover:text-white cursor-pointer text-xs"
                >
                  Keto (25/5/70)
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setProteinPct(30);
                    setCarbsPct(45);
                    setFatsPct(25);
                  }}
                  className="px-2.5 py-1 rounded-lg bg-zinc-900 border border-white/[0.06] text-zinc-300 hover:text-white cursor-pointer text-xs"
                >
                  Performance (30/45/25)
                </button>
              </div>

              {/* Sliders */}
              <div className="space-y-2 bg-zinc-950/70 p-3 rounded-xl border border-white/[0.06] text-xs">
                <div>
                  <div className="flex justify-between font-mono mb-1 text-[11px]">
                    <span className="text-emerald-400 font-semibold">Protein ({proteinPct}%)</span>
                    <span className="text-white font-bold">{calculatedTargets.protein}g</span>
                  </div>
                  <input
                    type="range"
                    min="10"
                    max="60"
                    step="5"
                    value={proteinPct}
                    onChange={(e) => setProteinPct(parseInt(e.target.value))}
                    className="w-full accent-emerald-400"
                  />
                </div>

                <div>
                  <div className="flex justify-between font-mono mb-1 text-[11px]">
                    <span className="text-amber-400 font-semibold">Carbs ({carbsPct}%)</span>
                    <span className="text-white font-bold">{calculatedTargets.carbs}g</span>
                  </div>
                  <input
                    type="range"
                    min="5"
                    max="70"
                    step="5"
                    value={carbsPct}
                    onChange={(e) => setCarbsPct(parseInt(e.target.value))}
                    className="w-full accent-amber-400"
                  />
                </div>

                <div>
                  <div className="flex justify-between font-mono mb-1 text-[11px]">
                    <span className="text-zinc-300 font-semibold">Fats ({fatsPct}%)</span>
                    <span className="text-white font-bold">{calculatedTargets.fats}g</span>
                  </div>
                  <input
                    type="range"
                    min="10"
                    max="75"
                    step="5"
                    value={fatsPct}
                    onChange={(e) => setFatsPct(parseInt(e.target.value))}
                    className="w-full accent-zinc-400"
                  />
                </div>
              </div>
            </div>

            {/* Save Button */}
            <div className="pt-2">
              <button
                type="submit"
                className="w-full flex items-center justify-center gap-2 rounded-xl bg-zinc-100 text-zinc-950 hover:bg-white py-2.5 font-bold transition-all text-xs cursor-pointer shadow-sm"
              >
                <Check className="w-4 h-4 stroke-[3]" />
                Update Profile &amp; Sync Dashboard Targets
              </button>
            </div>

            {/* Danger Zone: Delete Profile Option */}
            <div className="pt-4 border-t border-rose-500/20">
              {!showDeleteConfirm ? (
                <button
                  type="button"
                  onClick={() => setShowDeleteConfirm(true)}
                  className="w-full flex items-center justify-center gap-2 rounded-xl border border-rose-500/30 bg-rose-500/10 text-rose-300 hover:bg-rose-500/20 hover:border-rose-500/50 py-2.5 font-semibold transition-all text-xs cursor-pointer"
                >
                  <Trash2 className="w-4 h-4 text-rose-400" />
                  Delete User Profile
                </button>
              ) : (
                <div className="rounded-xl border border-rose-500/40 bg-rose-950/40 p-4 space-y-3">
                  <div className="flex items-start gap-2.5">
                    <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                    <div>
                      <h4 className="text-xs font-bold text-rose-200">
                        Permanently Delete Profile &ldquo;{currentUser?.name}&rdquo;?
                      </h4>
                      <p className="text-[11px] text-zinc-400 mt-1 leading-relaxed">
                        This action will wipe your personal profile, targets, and biometrics. This cannot be undone.
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center justify-end gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => setShowDeleteConfirm(false)}
                      className="px-3 py-1.5 rounded-lg border border-white/[0.08] bg-zinc-800 text-zinc-300 hover:bg-zinc-700 text-xs font-medium cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={handleDeleteProfile}
                      className="px-3.5 py-1.5 rounded-lg bg-rose-600 text-white hover:bg-rose-500 text-xs font-bold cursor-pointer transition-colors shadow-sm"
                    >
                      Confirm Delete Profile
                    </button>
                  </div>
                </div>
              )}
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
