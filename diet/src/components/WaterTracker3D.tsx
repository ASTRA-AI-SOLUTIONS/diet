import React from 'react';
import { motion } from 'motion/react';
import { useDiet } from '../context/DietContext';
import { Astra3DCard } from './Astra3DCard';
import { Droplet, Plus, Minus, Sparkles } from 'lucide-react';
import confetti from 'canvas-confetti';

export const WaterTracker3D: React.FC = () => {
  const { currentDayWater, addWaterForDay, summary } = useDiet();
  const waterTarget = summary.water.target || 2500;
  const percentage = Math.min(100, Math.round((currentDayWater / waterTarget) * 100));
  const isGoalReached = currentDayWater >= waterTarget;

  const handleAdd = (amount: number) => {
    const nextTotal = currentDayWater + amount;
    addWaterForDay(amount);

    if (currentDayWater < waterTarget && nextTotal >= waterTarget) {
      confetti({
        particleCount: 40,
        spread: 50,
        origin: { y: 0.8 },
        colors: ['#38bdf8', '#0284c7', '#f4f4f5'],
      });
    }
  };

  return (
    <Astra3DCard
      depth={6}
      className="p-5 flex flex-col justify-between"
    >
      <div className="flex items-center justify-between pb-3 border-b border-white/[0.08]">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-zinc-800 border border-white/[0.08] text-zinc-300">
            <Droplet className="w-4 h-4 fill-zinc-400/20" />
          </div>
          <div>
            <h4 className="text-sm font-semibold text-white">Hydration Chamber</h4>
            <span className="text-[11px] text-zinc-400">Cellular water balance</span>
          </div>
        </div>

        <div className="text-right">
          <span className="font-mono text-sm font-bold text-white tabular-nums">
            {currentDayWater.toLocaleString()}{' '}
            <span className="text-xs text-zinc-400 font-normal">/ {waterTarget.toLocaleString()} ml</span>
          </span>
          <div className="text-[11px] font-mono text-zinc-400">
            {isGoalReached ? (
              <span className="text-emerald-400 font-semibold flex items-center gap-1 justify-end">
                <Sparkles className="w-3 h-3" /> Target Met
              </span>
            ) : (
              <span>{Math.max(0, waterTarget - currentDayWater)} ml left</span>
            )}
          </div>
        </div>
      </div>

      {/* 3D Liquid Level Visualization */}
      <div className="my-5 flex items-center gap-5">
        <div className="relative h-32 w-16 rounded-2xl border border-white/[0.12] bg-zinc-950 p-1 overflow-hidden shadow-inner flex flex-col justify-end">
          {/* Internal measuring marks */}
          <div className="absolute inset-0 flex flex-col justify-between py-2 px-1 pointer-events-none opacity-20">
            <div className="w-full border-t border-zinc-500" />
            <div className="w-2/3 border-t border-zinc-500" />
            <div className="w-full border-t border-zinc-500" />
            <div className="w-2/3 border-t border-zinc-500" />
            <div className="w-full border-t border-zinc-500" />
          </div>

          {/* Animated Liquid */}
          <motion.div
            initial={{ height: 0 }}
            animate={{ height: `${percentage}%` }}
            transition={{ duration: 0.6, ease: 'easeOut' }}
            className="w-full rounded-xl bg-gradient-to-t from-sky-700 via-sky-500 to-sky-400 shadow-md relative overflow-hidden"
          >
            {/* Wave crest shimmer */}
            <div className="absolute inset-x-0 top-0 h-1 bg-white/40 animate-pulse" />
          </motion.div>
        </div>

        {/* Quick Log Buttons */}
        <div className="flex-1 space-y-2">
          <div className="text-xs text-zinc-400">Quick Increment:</div>
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => handleAdd(250)}
              className="flex items-center justify-center gap-1 rounded-xl border border-white/[0.08] bg-zinc-900/90 px-3 py-2 text-xs font-semibold text-zinc-200 hover:bg-zinc-800 hover:text-white transition-all cursor-pointer"
            >
              <Plus className="w-3 h-3" />
              +250 ml
            </button>
            <button
              onClick={() => handleAdd(500)}
              className="flex items-center justify-center gap-1 rounded-xl border border-white/[0.08] bg-zinc-900/90 px-3 py-2 text-xs font-semibold text-zinc-200 hover:bg-zinc-800 hover:text-white transition-all cursor-pointer"
            >
              <Plus className="w-3 h-3" />
              +500 ml
            </button>
            <button
              onClick={() => handleAdd(750)}
              className="flex items-center justify-center gap-1 rounded-xl border border-white/[0.08] bg-zinc-900/90 px-3 py-2 text-xs font-semibold text-zinc-200 hover:bg-zinc-800 hover:text-white transition-all cursor-pointer"
            >
              <Plus className="w-3 h-3" />
              +750 ml
            </button>
            <button
              onClick={() => handleAdd(-250)}
              disabled={currentDayWater <= 0}
              className="flex items-center justify-center gap-1 rounded-xl border border-white/[0.04] bg-zinc-950 px-3 py-2 text-xs font-medium text-zinc-500 hover:text-zinc-300 transition-all cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
            >
              <Minus className="w-3 h-3" />
              -250 ml
            </button>
          </div>
        </div>
      </div>
    </Astra3DCard>
  );
};
