import React from 'react';
import { motion } from 'motion/react';
import { useDiet } from '../context/DietContext';
import { Astra3DCard } from './Astra3DCard';
import { Flame, ShieldAlert, Sparkles, TrendingUp, AlertTriangle } from 'lucide-react';
import confetti from 'canvas-confetti';

export const Macro3DGauge: React.FC = () => {
  const { summary } = useDiet();
  const { calories, protein, carbs, fats, fiber, water } = summary;

  // Calculate macro calorie contributions
  const proteinKcal = protein.consumed * 4;
  const carbsKcal = carbs.consumed * 4;
  const fatsKcal = fats.consumed * 9;
  const totalMacroKcal = proteinKcal + carbsKcal + fatsKcal || 1;

  const proteinRatioPct = Math.round((proteinKcal / totalMacroKcal) * 100);
  const carbsRatioPct = Math.round((carbsKcal / totalMacroKcal) * 100);
  const fatsRatioPct = Math.max(0, 100 - proteinRatioPct - carbsRatioPct);

  // SVG Ring Calculations
  const radius = 78;
  const circumference = 2 * Math.PI * radius;
  const progressRatio = calories.target > 0 ? calories.consumed / calories.target : 0;
  const baseStrokeDash = Math.min(progressRatio, 1) * circumference;
  const strokeDashoffset = circumference - baseStrokeDash;

  // Exceeded arc if calories > target
  const excessRatio = Math.max(0, progressRatio - 1);
  const excessStrokeDash = Math.min(excessRatio, 1) * circumference;
  const excessStrokeDashoffset = circumference - excessStrokeDash;

  const triggerConfetti = () => {
    confetti({
      particleCount: 50,
      spread: 60,
      origin: { y: 0.7 },
      colors: ['#10b981', '#f59e0b', '#f4f4f5', '#a1a1aa'],
    });
  };

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
      {/* 3D Calorie Orbit Ring Card (lg:col-span-5) */}
      <div className="lg:col-span-5">
        <Astra3DCard
          glowColor={calories.isExceeded ? 'rgba(244, 63, 94, 0.12)' : 'rgba(255, 255, 255, 0.08)'}
          className="flex flex-col items-center justify-between p-6 text-center"
        >
          {/* Header */}
          <div className="flex w-full items-center justify-between pb-3 border-b border-white/[0.08] text-xs font-medium text-zinc-400">
            <span className="flex items-center gap-1.5 text-zinc-300 font-semibold tracking-wide uppercase text-[11px]">
              <Flame className="w-4 h-4 text-zinc-400" />
              Caloric Equilibrium
            </span>
            <div className="flex items-center gap-2">
              <span className="font-mono tabular-nums text-zinc-400 text-xs">
                Target: {calories.target.toLocaleString()} kcal
              </span>
            </div>
          </div>

          {/* 3D Radial Circle Display */}
          <div className="relative my-4 flex items-center justify-center">
            {/* Subtle Ambient Aura */}
            <div
              className={`absolute h-44 w-44 rounded-full blur-2xl transition-all duration-700 pointer-events-none opacity-40 ${
                calories.isExceeded
                  ? 'bg-rose-500/20'
                  : calories.percentage >= 95
                  ? 'bg-emerald-500/20'
                  : 'bg-zinc-700/20'
              }`}
            />

            <svg className="h-56 w-56 -rotate-90 transform" viewBox="0 0 200 200">
              {/* Background Track */}
              <circle
                cx="100"
                cy="100"
                r={radius}
                fill="transparent"
                stroke="currentColor"
                strokeWidth="12"
                className="text-zinc-800/80"
              />

              {/* Base Progress Circle */}
              <motion.circle
                cx="100"
                cy="100"
                r={radius}
                fill="transparent"
                stroke={calories.isExceeded ? 'url(#caloriesExceededGradient)' : 'url(#caloriesGradient)'}
                strokeWidth="12"
                strokeLinecap="round"
                strokeDasharray={circumference}
                initial={{ strokeDashoffset: circumference }}
                animate={{ strokeDashoffset }}
                transition={{ duration: 1.1, ease: [0.16, 1, 0.3, 1] }}
              />

              {/* Excess Overlay Ring if over target */}
              {calories.isExceeded && (
                <motion.circle
                  cx="100"
                  cy="100"
                  r={radius}
                  fill="transparent"
                  stroke="url(#excessGradient)"
                  strokeWidth="12"
                  strokeLinecap="round"
                  strokeDasharray={circumference}
                  initial={{ strokeDashoffset: circumference }}
                  animate={{ strokeDashoffset: excessStrokeDashoffset }}
                  transition={{ duration: 0.9, ease: 'easeOut', delay: 0.2 }}
                />
              )}

              {/* Minimalist SVG Gradients */}
              <defs>
                <linearGradient id="caloriesGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#ffffff" />
                  <stop offset="100%" stopColor="#d4d4d8" />
                </linearGradient>
                <linearGradient id="caloriesExceededGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#f59e0b" />
                  <stop offset="100%" stopColor="#f43f5e" />
                </linearGradient>
                <linearGradient id="excessGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#f43f5e" />
                  <stop offset="100%" stopColor="#fb7185" />
                </linearGradient>
              </defs>
            </svg>

            {/* Inner Content */}
            <div className="absolute flex flex-col items-center justify-center text-center">
              <span className="text-[11px] uppercase tracking-wider text-zinc-500 font-medium">Consumed</span>
              <motion.span
                key={calories.consumed}
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="font-mono text-4xl font-extrabold tracking-tight text-white tabular-nums"
              >
                {calories.consumed.toLocaleString()}
              </motion.span>
              <span className="text-xs text-zinc-400 font-mono">kcal</span>

              {/* Status Indicator */}
              <div className="mt-2">
                {calories.isExceeded ? (
                  <span className="inline-flex items-center gap-1 rounded-full bg-rose-500/10 border border-rose-500/20 px-2.5 py-0.5 text-xs font-semibold text-rose-300">
                    <ShieldAlert className="w-3 h-3 text-rose-400" />
                    +{calories.exceeded.toLocaleString()} kcal Over
                  </span>
                ) : calories.percentage >= 95 ? (
                  <button
                    onClick={triggerConfetti}
                    title="Click for celebration!"
                    className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-0.5 text-xs font-semibold text-emerald-300 hover:bg-emerald-500/20 transition-colors cursor-pointer"
                  >
                    <Sparkles className="w-3 h-3 text-emerald-400" />
                    Target Reached ({calories.percentage}%)
                  </button>
                ) : (
                  <span className="inline-flex items-center gap-1 rounded-full bg-zinc-800 border border-white/[0.08] px-2.5 py-0.5 text-xs font-medium text-zinc-300">
                    <TrendingUp className="w-3 h-3 text-zinc-400" />
                    {calories.remaining.toLocaleString()} kcal Left
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Calorie Stats Breakdown Footer */}
          <div className="grid w-full grid-cols-3 gap-2 pt-4 border-t border-white/[0.08] text-center">
            <div className="rounded-xl bg-zinc-900/60 p-2 border border-white/[0.06]">
              <div className="text-[11px] text-zinc-500">Consumed</div>
              <div className="font-mono text-sm font-semibold text-zinc-200 tabular-nums">
                {calories.consumed.toLocaleString()}
              </div>
            </div>
            <div className="rounded-xl bg-zinc-900/60 p-2 border border-white/[0.06]">
              <div className="text-[11px] text-zinc-500">Target</div>
              <div className="font-mono text-sm font-semibold text-zinc-300 tabular-nums">
                {calories.target.toLocaleString()}
              </div>
            </div>
            <div
              className={`rounded-xl p-2 border transition-colors ${
                calories.isExceeded
                  ? 'bg-rose-950/20 border-rose-800/30 text-rose-300'
                  : 'bg-zinc-900/60 border-white/[0.06] text-zinc-200'
              }`}
            >
              <div className="text-[11px] text-zinc-500">
                {calories.isExceeded ? 'Exceeded' : 'Remaining'}
              </div>
              <div className="font-mono text-sm font-semibold tabular-nums">
                {calories.isExceeded
                  ? `+${calories.exceeded.toLocaleString()}`
                  : calories.remaining.toLocaleString()}
              </div>
            </div>
          </div>
        </Astra3DCard>
      </div>

      {/* 3D Macro Bars & Distribution (lg:col-span-7) */}
      <div className="flex flex-col justify-between gap-4 lg:col-span-7">
        {/* Macro Trio Cards: Protein, Carbs, Fats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* PROTEIN CARD */}
          <Astra3DCard
            depth={8}
            className="flex flex-col justify-between p-4"
          >
            <div>
              <div className="flex items-center justify-between text-xs mb-2">
                <span className="font-semibold text-emerald-400 tracking-wider text-[11px] uppercase">
                  Protein
                </span>
                <span className="font-mono text-xs text-zinc-400 tabular-nums">
                  {protein.percentage}%
                </span>
              </div>

              <div className="flex items-baseline gap-1">
                <span className="font-mono text-2xl font-bold text-white tabular-nums">
                  {protein.consumed}
                </span>
                <span className="font-mono text-xs text-zinc-500">/ {protein.target}g</span>
              </div>
            </div>

            <div className="mt-4">
              {/* Progress Bar */}
              <div className="relative h-1.5 w-full overflow-hidden rounded-full bg-zinc-800">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${Math.min(protein.percentage, 100)}%` }}
                  transition={{ duration: 0.8, ease: 'easeOut' }}
                  className={`h-full rounded-full ${
                    protein.isExceeded
                      ? 'bg-amber-400'
                      : 'bg-emerald-500'
                  }`}
                />
              </div>

              <div className="mt-2 flex items-center justify-between text-[11px] font-mono">
                {protein.isExceeded ? (
                  <span className="text-amber-400 flex items-center gap-1">
                    <AlertTriangle className="w-3 h-3" />
                    +{protein.exceeded}g surplus
                  </span>
                ) : (
                  <span className="text-zinc-400">
                    {protein.remaining}g remain
                  </span>
                )}
                <span className="text-zinc-500">{proteinKcal} kcal</span>
              </div>
            </div>
          </Astra3DCard>

          {/* CARBOHYDRATES CARD */}
          <Astra3DCard
            depth={8}
            className="flex flex-col justify-between p-4"
          >
            <div>
              <div className="flex items-center justify-between text-xs mb-2">
                <span className="font-semibold text-amber-400 tracking-wider text-[11px] uppercase">
                  Carbohydrates
                </span>
                <span className="font-mono text-xs text-zinc-400 tabular-nums">
                  {carbs.percentage}%
                </span>
              </div>

              <div className="flex items-baseline gap-1">
                <span className="font-mono text-2xl font-bold text-white tabular-nums">
                  {carbs.consumed}
                </span>
                <span className="font-mono text-xs text-zinc-500">/ {carbs.target}g</span>
              </div>
            </div>

            <div className="mt-4">
              {/* Progress Bar */}
              <div className="relative h-1.5 w-full overflow-hidden rounded-full bg-zinc-800">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${Math.min(carbs.percentage, 100)}%` }}
                  transition={{ duration: 0.8, ease: 'easeOut' }}
                  className={`h-full rounded-full ${
                    carbs.isExceeded
                      ? 'bg-rose-400'
                      : 'bg-amber-500'
                  }`}
                />
              </div>

              <div className="mt-2 flex items-center justify-between text-[11px] font-mono">
                {carbs.isExceeded ? (
                  <span className="text-rose-400 flex items-center gap-1">
                    <AlertTriangle className="w-3 h-3" />
                    +{carbs.exceeded}g surplus
                  </span>
                ) : (
                  <span className="text-zinc-400">
                    {carbs.remaining}g remain
                  </span>
                )}
                <span className="text-zinc-500">{carbsKcal} kcal</span>
              </div>
            </div>
          </Astra3DCard>

          {/* HEALTHY FATS CARD */}
          <Astra3DCard
            depth={8}
            className="flex flex-col justify-between p-4"
          >
            <div>
              <div className="flex items-center justify-between text-xs mb-2">
                <span className="font-semibold text-zinc-300 tracking-wider text-[11px] uppercase">
                  Healthy Fats
                </span>
                <span className="font-mono text-xs text-zinc-400 tabular-nums">
                  {fats.percentage}%
                </span>
              </div>

              <div className="flex items-baseline gap-1">
                <span className="font-mono text-2xl font-bold text-white tabular-nums">
                  {fats.consumed}
                </span>
                <span className="font-mono text-xs text-zinc-500">/ {fats.target}g</span>
              </div>
            </div>

            <div className="mt-4">
              {/* Progress Bar */}
              <div className="relative h-1.5 w-full overflow-hidden rounded-full bg-zinc-800">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${Math.min(fats.percentage, 100)}%` }}
                  transition={{ duration: 0.8, ease: 'easeOut' }}
                  className={`h-full rounded-full ${
                    fats.isExceeded
                      ? 'bg-rose-400'
                      : 'bg-zinc-400'
                  }`}
                />
              </div>

              <div className="mt-2 flex items-center justify-between text-[11px] font-mono">
                {fats.isExceeded ? (
                  <span className="text-rose-400 flex items-center gap-1">
                    <AlertTriangle className="w-3 h-3" />
                    +{fats.exceeded}g surplus
                  </span>
                ) : (
                  <span className="text-zinc-400">
                    {fats.remaining}g remain
                  </span>
                )}
                <span className="text-zinc-500">{fatsKcal} kcal</span>
              </div>
            </div>
          </Astra3DCard>
        </div>

        {/* Macro Distribution Ratio Bar & Fiber Card */}
        <Astra3DCard className="p-4" depth={8}>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 mb-3 border-b border-white/[0.08]">
            <div>
              <h4 className="text-xs font-semibold text-zinc-200 uppercase tracking-wider">
                Macro Energy Composition
              </h4>
              <p className="text-[11px] text-zinc-400">
                Caloric contribution ratio by macronutrient
              </p>
            </div>
            <div className="flex items-center gap-3 text-xs font-mono">
              <span className="text-emerald-400 font-medium">Protein: {proteinRatioPct}%</span>
              <span className="text-zinc-600">·</span>
              <span className="text-amber-400 font-medium">Carbs: {carbsRatioPct}%</span>
              <span className="text-zinc-600">·</span>
              <span className="text-zinc-300 font-medium">Fats: {fatsRatioPct}%</span>
            </div>
          </div>

          {/* Segmented Distribution Bar */}
          <div className="h-2.5 w-full overflow-hidden rounded-full bg-zinc-800 flex">
            <motion.div
              style={{ width: `${proteinRatioPct}%` }}
              className="h-full bg-emerald-500 transition-all duration-500"
              title={`Protein: ${proteinRatioPct}%`}
            />
            <motion.div
              style={{ width: `${carbsRatioPct}%` }}
              className="h-full bg-amber-500 transition-all duration-500"
              title={`Carbs: ${carbsRatioPct}%`}
            />
            <motion.div
              style={{ width: `${fatsRatioPct}%` }}
              className="h-full bg-zinc-400 transition-all duration-500"
              title={`Fats: ${fatsRatioPct}%`}
            />
          </div>

          {/* Secondary Micronutrients: Dietary Fiber & Water summary */}
          <div className="mt-4 grid grid-cols-2 gap-3 pt-3 border-t border-white/[0.06] text-xs">
            <div className="flex items-center justify-between rounded-lg bg-zinc-900/60 p-2.5 border border-white/[0.04]">
              <div>
                <span className="text-[11px] text-zinc-500 block">Dietary Fiber</span>
                <span className="font-mono text-sm font-semibold text-emerald-400 tabular-nums">
                  {fiber.consumed}g
                </span>
                <span className="text-zinc-500 font-mono text-[10px]"> / {fiber.target}g target</span>
              </div>
              <span className="text-xs font-mono font-medium text-zinc-400">
                {fiber.percentage}%
              </span>
            </div>

            <div className="flex items-center justify-between rounded-lg bg-zinc-900/60 p-2.5 border border-white/[0.04]">
              <div>
                <span className="text-[11px] text-zinc-500 block">Hydration Intake</span>
                <span className="font-mono text-sm font-semibold text-zinc-200 tabular-nums">
                  {(water.consumed / 1000).toFixed(2)}L
                </span>
                <span className="text-zinc-500 font-mono text-[10px]">
                  {' '}
                  / {(water.target / 1000).toFixed(1)}L
                </span>
              </div>
              <span className="text-xs font-mono font-medium text-zinc-400">
                {water.percentage}%
              </span>
            </div>
          </div>
        </Astra3DCard>
      </div>
    </div>
  );
};
