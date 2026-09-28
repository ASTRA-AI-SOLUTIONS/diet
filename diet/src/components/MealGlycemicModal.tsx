import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { MealEntry } from '../types/diet';
import {
  calculateMealGlycemicProfile,
  formatTimeTo12Hour,
} from '../utils/glycemicCalculations';
import {
  X,
  Zap,
  Activity,
  ShieldCheck,
  AlertTriangle,
  Flame,
  Info,
  Clock,
  Sparkles,
  Footprints,
} from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ReferenceLine,
} from 'recharts';

interface MealGlycemicModalProps {
  meal: MealEntry | null;
  isOpen: boolean;
  onClose: () => void;
}

export const MealGlycemicModal: React.FC<MealGlycemicModalProps> = ({
  meal,
  isOpen,
  onClose,
}) => {
  if (!isOpen || !meal) return null;

  const timeUsed = meal.mealTime || meal.timeLogged || '12:00';
  const profile = calculateMealGlycemicProfile({
    mealTime: timeUsed,
    carbs: meal.carbs,
    protein: meal.protein,
    fats: meal.fats,
    fiber: meal.fiber,
    calories: meal.calories,
    grams: meal.grams,
    foodName: meal.foodName,
  });

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md">
        <motion.div
          initial={{ opacity: 0, scale: 0.96, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.96, y: 10 }}
          transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
          className="relative flex flex-col w-full max-w-2xl max-h-[92vh] overflow-hidden rounded-2xl border border-white/[0.08] bg-[#111114] text-zinc-100 shadow-2xl"
        >
          {/* Header */}
          <div className="flex items-center justify-between border-b border-white/[0.08] px-6 py-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="flex items-center gap-1 text-[11px] font-mono text-zinc-400 uppercase tracking-wider">
                  <Clock className="w-3.5 h-3.5 text-zinc-400" />
                  Consumed at {formatTimeTo12Hour(timeUsed)}
                </span>
                <span className="text-zinc-600">·</span>
                <span className="text-xs px-2 py-0.5 rounded-full bg-zinc-800 border border-white/[0.06] text-zinc-300 font-medium">
                  {profile.glycemicImpactCategory}
                </span>
              </div>
              <h3 className="text-base font-bold text-white tracking-tight mt-1 flex items-center gap-2">
                <Activity className="w-4 h-4 text-emerald-400" />
                Glycemic Absorption &amp; Mileage Planner: {meal.foodName}
              </h3>
            </div>
            <button
              onClick={onClose}
              className="rounded-lg p-1.5 text-zinc-400 hover:bg-zinc-800 hover:text-white transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Modal Content */}
          <div className="flex-1 overflow-y-auto p-6 space-y-5">
            {/* Top Macro Summary Bar */}
            <div className="grid grid-cols-4 gap-2 text-center">
              <div className="rounded-xl bg-zinc-950/70 p-2.5 border border-white/[0.06]">
                <span className="text-[10px] text-zinc-500 block uppercase font-mono">Net Carbs</span>
                <span className="font-mono text-base font-bold text-amber-400 tabular-nums">
                  {profile.netCarbs}g
                </span>
                <span className="text-[10px] text-zinc-500 block font-mono">({meal.carbs}g total)</span>
              </div>
              <div className="rounded-xl bg-zinc-950/70 p-2.5 border border-white/[0.06]">
                <span className="text-[10px] text-zinc-500 block uppercase font-mono">Protein Buffer</span>
                <span className="font-mono text-base font-bold text-emerald-400 tabular-nums">
                  {meal.protein}g
                </span>
                <span className="text-[10px] text-zinc-500 block font-mono">Incretin primer</span>
              </div>
              <div className="rounded-xl bg-zinc-950/70 p-2.5 border border-white/[0.06]">
                <span className="text-[10px] text-zinc-500 block uppercase font-mono">Fats (CCK)</span>
                <span className="font-mono text-base font-bold text-zinc-300 tabular-nums">
                  {meal.fats}g
                </span>
                <span className="text-[10px] text-zinc-500 block font-mono">Gastric brake</span>
              </div>
              <div className="rounded-xl bg-zinc-950/70 p-2.5 border border-white/[0.06]">
                <span className="text-[10px] text-zinc-500 block uppercase font-mono">Dietary Fiber</span>
                <span className="font-mono text-base font-bold text-emerald-300 tabular-nums">
                  {meal.fiber}g
                </span>
                <span className="text-[10px] text-zinc-500 block font-mono">Gel matrix</span>
              </div>
            </div>

            {/* Prime Mileage Target Callout Box */}
            <div className="rounded-xl border border-emerald-500/20 bg-emerald-950/15 p-4 space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-emerald-500/20 pb-3">
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-lg bg-emerald-500/20 text-emerald-300">
                    <Footprints className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400">
                      Calculated Pre-Mileage Timing
                    </span>
                    <h4 className="text-sm font-bold text-white">
                      {profile.workoutWindow.headline}
                    </h4>
                  </div>
                </div>

                <div className="text-right">
                  <span className="text-[10px] text-zinc-400 block font-mono">Estimated Glucose Peak:</span>
                  <span className="font-mono text-xs font-bold text-emerald-300">
                    {profile.estimatedPeakTime} (+{profile.peakGlucoseRiseMgDl} mg/dL)
                  </span>
                </div>
              </div>

              {/* Mileage Modality Specific Windows */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                <div className="bg-zinc-900/80 rounded-lg p-2.5 border border-white/[0.06]">
                  <span className="text-[11px] font-semibold text-zinc-200 flex items-center gap-1.5 mb-1">
                    <Zap className="w-3.5 h-3.5 text-amber-400" />
                    Strength &amp; Heavy Resistance:
                  </span>
                  <p className="text-[11px] text-zinc-400">{profile.workoutWindow.heavyLiftingWindow}</p>
                </div>
                <div className="bg-zinc-900/80 rounded-lg p-2.5 border border-white/[0.06]">
                  <span className="text-[11px] font-semibold text-zinc-200 flex items-center gap-1.5 mb-1">
                    <Flame className="w-3.5 h-3.5 text-rose-400" />
                    Tempo &amp; High-Output Mileage:
                  </span>
                  <p className="text-[11px] text-zinc-400">{profile.workoutWindow.hiitCardioWindow}</p>
                </div>
              </div>
            </div>

            {/* Postprandial Blood Glucose & Energy Availability Curve */}
            <div className="rounded-xl border border-white/[0.08] bg-zinc-900/60 p-4 space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                <div>
                  <h4 className="text-xs font-bold text-white tracking-wide uppercase">
                    Postprandial Glycemic Curve &amp; Phase Progression
                  </h4>
                  <p className="text-[11px] text-zinc-400">
                    Modeled blood glucose trajectory (mg/dL) based on meal macronutrient matrix
                  </p>
                </div>
                <div className="flex items-center gap-3 text-[11px] font-mono">
                  <span className="flex items-center gap-1 text-emerald-400">
                    <span className="w-2 h-2 rounded-full bg-emerald-400" />
                    Optimal Mileage
                  </span>
                  <span className="flex items-center gap-1 text-zinc-400">
                    <span className="w-2 h-2 rounded-full bg-zinc-500" />
                    Digestive / Base
                  </span>
                </div>
              </div>

              {/* Recharts Area Chart */}
              <div className="w-full h-48 pt-2">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart
                    data={profile.curve}
                    margin={{ top: 10, right: 10, left: -25, bottom: 0 }}
                  >
                    <defs>
                      <linearGradient id="glucoseGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.4} />
                        <stop offset="95%" stopColor="#10b981" stopOpacity={0.0} />
                      </linearGradient>
                    </defs>
                    <XAxis
                      dataKey="timeLabel"
                      stroke="#71717a"
                      tick={{ fill: '#71717a', fontSize: 10, fontFamily: 'monospace' }}
                      tickLine={{ stroke: '#3f3f46' }}
                      interval={2}
                    />
                    <YAxis
                      stroke="#71717a"
                      domain={['dataMin - 5', 'dataMax + 10']}
                      tick={{ fill: '#71717a', fontSize: 10, fontFamily: 'monospace' }}
                      tickLine={{ stroke: '#3f3f46' }}
                    />
                    <Tooltip
                      content={({ active, payload }) => {
                        if (!active || !payload || !payload.length) return null;
                        const data = payload[0].payload;
                        return (
                          <div className="rounded-xl border border-white/[0.1] bg-[#141417] p-2.5 shadow-xl text-xs space-y-1 font-mono">
                            <div className="text-zinc-400 font-bold">{data.timeLabel} ({data.minute}m post-meal)</div>
                            <div className="text-emerald-400 font-bold">
                              {data.absoluteEstimatedGlucose} mg/dL (+{data.glucoseRiseMgDl} rise)
                            </div>
                            <div className="text-[10px] text-zinc-300 font-sans">{data.phaseLabel}</div>
                          </div>
                        );
                      }}
                    />
                    <ReferenceLine
                      y={profile.baselineGlucose}
                      stroke="#52525b"
                      strokeDasharray="3 3"
                      label={{
                        value: `Baseline (${profile.baselineGlucose} mg/dL)`,
                        position: 'insideBottomLeft',
                        fill: '#71717a',
                        fontSize: 9,
                        fontFamily: 'monospace',
                      }}
                    />
                    <ReferenceLine
                      x={profile.workoutWindow.startTime}
                      stroke="#10b981"
                      strokeDasharray="2 2"
                      strokeWidth={1.5}
                    />
                    <ReferenceLine
                      x={profile.workoutWindow.endTime}
                      stroke="#10b981"
                      strokeDasharray="2 2"
                      strokeWidth={1.5}
                    />
                    <Area
                      type="monotone"
                      dataKey="absoluteEstimatedGlucose"
                      stroke="#10b981"
                      strokeWidth={2}
                      fillOpacity={1}
                      fill="url(#glucoseGradient)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>

              {/* Timeline Phase Legend */}
              <div className="grid grid-cols-3 gap-2 pt-2 border-t border-white/[0.06] text-center text-[11px]">
                <div className="bg-zinc-950/60 p-2 rounded-lg">
                  <span className="text-zinc-500 block text-[10px]">0 - {profile.workoutWindow.startMinutesFromMeal}m</span>
                  <span className="font-semibold text-zinc-400">Splanchnic Digestion</span>
                  <span className="text-[10px] text-zinc-500 block">Stomach transit</span>
                </div>
                <div className="bg-emerald-950/30 border border-emerald-500/20 p-2 rounded-lg">
                  <span className="text-emerald-400 block text-[10px] font-bold">
                    {profile.workoutWindow.startMinutesFromMeal}m - {profile.workoutWindow.endMinutesFromMeal}m
                  </span>
                  <span className="font-bold text-emerald-300">Optimal Mileage</span>
                  <span className="text-[10px] text-emerald-400/80 block">Prime glycogen / endurance</span>
                </div>
                <div className="bg-zinc-950/60 p-2 rounded-lg">
                  <span className="text-zinc-500 block text-[10px]">&gt; {profile.workoutWindow.endMinutesFromMeal}m</span>
                  <span className="font-semibold text-zinc-400">Baseline Return</span>
                  <span className="text-[10px] text-zinc-500 block">Steady recovery</span>
                </div>
              </div>
            </div>

            {/* Physiological Deceleration & Buffering Factors */}
            <div className="space-y-2">
              <h4 className="text-xs font-bold text-white tracking-wide uppercase flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-zinc-400" />
                Digestion &amp; Glycemic Rate Modulators (Active in this Meal)
              </h4>
              <div className="space-y-2">
                {profile.factors.map((f, i) => (
                  <div
                    key={i}
                    className={`rounded-xl p-3 border text-xs flex items-start gap-3 ${
                      f.type === 'caution'
                        ? 'bg-rose-500/10 border-rose-500/20 text-rose-200'
                        : 'bg-zinc-900/60 border-white/[0.06] text-zinc-300'
                    }`}
                  >
                    <div className="mt-0.5 shrink-0">
                      {f.type === 'caution' ? (
                        <AlertTriangle className="w-4 h-4 text-rose-400" />
                      ) : (
                        <Info className="w-4 h-4 text-zinc-400" />
                      )}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between gap-2 flex-wrap mb-0.5">
                        <span className="font-semibold text-white">{f.name}</span>
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-zinc-800 border border-white/[0.08] text-zinc-300">
                          {f.badge}
                        </span>
                      </div>
                      <p className="text-[11px] text-zinc-400">{f.effect}</p>
                      <p className="text-[10px] text-zinc-500 mt-0.5 font-mono">{f.detail}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Actionable Guidance & Hydration */}
            <div className="rounded-xl bg-zinc-950/80 p-3.5 border border-white/[0.06] space-y-2 text-xs">
              <div className="font-semibold text-zinc-200 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-zinc-400" />
                Mileage Fueling &amp; Hydration Advice
              </div>
              <ul className="space-y-1 text-zinc-400 text-[11px] list-disc list-inside">
                {profile.workoutWindow.guidance.map((g, idx) => (
                  <li key={idx}>{g}</li>
                ))}
                <li>{profile.hydrationTip}</li>
              </ul>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
