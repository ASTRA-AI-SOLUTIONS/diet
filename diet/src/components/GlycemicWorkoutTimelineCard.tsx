import React, { useState, useMemo } from 'react';
import { useDiet } from '../context/DietContext';
import { MealEntry } from '../types/diet';
import { Astra3DCard } from './Astra3DCard';
import {
  calculateMealGlycemicProfile,
  formatTimeTo12Hour,
} from '../utils/glycemicCalculations';
import {
  Activity,
  Clock,
  Zap,
  ChevronRight,
  Sparkles,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Footprints,
} from 'lucide-react';

interface GlycemicWorkoutTimelineCardProps {
  onSelectMeal: (meal: MealEntry) => void;
}

export const GlycemicWorkoutTimelineCard: React.FC<GlycemicWorkoutTimelineCardProps> = ({
  onSelectMeal,
}) => {
  const { currentDayMeals } = useDiet();

  // User test mileage time planner
  const [plannedMileageTime, setPlannedMileageTime] = useState<string>(() => {
    const now = new Date();
    // Default to +2 hours from now or 17:30
    return `${String((now.getHours() + 2) % 24).padStart(2, '0')}:00`;
  });

  // Calculate glycemic profiles for all timed meals
  const mealProfiles = useMemo(() => {
    return currentDayMeals
      .map((meal) => {
        const time = meal.mealTime || meal.timeLogged || '12:00';
        const profile = calculateMealGlycemicProfile({
          mealTime: time,
          carbs: meal.carbs,
          protein: meal.protein,
          fats: meal.fats,
          fiber: meal.fiber,
          calories: meal.calories,
          grams: meal.grams,
          foodName: meal.foodName,
        });
        return { meal, profile, time };
      })
      .sort((a, b) => a.time.localeCompare(b.time));
  }, [currentDayMeals]);

  // Mileage timing evaluation for plannedMileageTime
  const mileageEvaluation = useMemo(() => {
    if (!mealProfiles.length) {
      return {
        status: 'fasted',
        headline: 'Fasted / Baseline State',
        detail: 'No meals logged yet today. If doing intense mileage, consider a 30-40g pre-mileage carbohydrate & protein meal 60-90 minutes prior.',
        badgeColor: 'text-amber-400 bg-amber-500/10 border-amber-500/20',
      };
    }

    // Find the latest meal consumed prior to plannedMileageTime
    const precedingMeals = mealProfiles.filter((item) => item.time <= plannedMileageTime);
    if (!precedingMeals.length) {
      return {
        status: 'fasted_morning',
        headline: 'Morning Fasted / Pre-Breakfast Mileage',
        detail: 'Starting mileage before your first logged meal. Ideal for steady-state aerobic burn or fat oxidation. For fast tempo mileage, consider a light carb source or amino acids.',
        badgeColor: 'text-zinc-300 bg-zinc-800 border-white/[0.08]',
      };
    }

    const latest = precedingMeals[precedingMeals.length - 1];
    const [wH, wM] = plannedMileageTime.split(':').map((n) => parseInt(n, 10));
    const [mH, mM] = latest.time.split(':').map((n) => parseInt(n, 10));
    const elapsedMinutes = (wH * 60 + wM) - (mH * 60 + mM);

    const { startMinutesFromMeal, endMinutesFromMeal } = latest.profile.workoutWindow;

    if (elapsedMinutes < startMinutesFromMeal) {
      const waitRemaining = startMinutesFromMeal - elapsedMinutes;
      return {
        status: 'digesting',
        headline: `Digestive Transit Phase (${latest.meal.foodName})`,
        detail: `Too close to your ${latest.meal.mealType} at ${formatTimeTo12Hour(latest.time)}. Stomach is actively churning with ${latest.meal.fats}g fat & ${latest.meal.protein}g protein. Wait another ~${waitRemaining} min (until ${latest.profile.workoutWindow.startTime}) before putting in mileage to avoid cramps or sluggishness.`,
        badgeColor: 'text-amber-400 bg-amber-500/10 border-amber-500/20',
      };
    } else if (elapsedMinutes >= startMinutesFromMeal && elapsedMinutes <= endMinutesFromMeal) {
      return {
        status: 'prime',
        headline: `⚡ Prime Mileage & Glucose Window!`,
        detail: `Powered by ${latest.meal.foodName}. Circulating blood glucose is near its peak (+${latest.profile.peakGlucoseRiseMgDl} mg/dL) while gastric fullness is cleared. High glycogen availability and optimal muscular endurance for mileage.`,
        badgeColor: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
      };
    } else {
      const hoursPast = Math.round((elapsedMinutes / 60) * 10) / 10;
      return {
        status: 'late',
        headline: `Post-Absorptive Sustained Phase (${hoursPast}h post-meal)`,
        detail: `Blood glucose from ${latest.meal.foodName} has returned toward baseline. Energy is steady, but for high-intensity or long mileage, a fast-absorbing 20g carb (banana, rice cake, or intra-mileage fuel) is recommended.`,
        badgeColor: 'text-sky-400 bg-sky-500/10 border-sky-500/20',
      };
    }
  }, [mealProfiles, plannedMileageTime]);

  return (
    <Astra3DCard depth={8} className="p-5 space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-white/[0.08]">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1 rounded-md bg-zinc-800 border border-white/[0.08] text-zinc-300">
              <Activity className="w-3.5 h-3.5 text-emerald-400" />
            </span>
            <h3 className="text-sm font-bold text-white tracking-tight">
              Glycemic Absorption &amp; Mileage Fueling Timeline
            </h3>
          </div>
          <p className="text-xs text-zinc-400 mt-0.5">
            Biologically calculated blood glucose peaks and optimal mileage windows based on meal macros
          </p>
        </div>

        {/* Mileage Planner Quick Time Picker */}
        <div className="flex items-center gap-2 text-xs">
          <span className="text-zinc-400 flex items-center gap-1 font-mono">
            <Footprints className="w-3.5 h-3.5 text-zinc-400" />
            Plan Mileage:
          </span>
          <input
            type="time"
            value={plannedMileageTime}
            onChange={(e) => setPlannedMileageTime(e.target.value)}
            className="rounded-lg border border-white/[0.1] bg-zinc-900 px-2 py-1 text-xs font-mono font-bold text-white focus:outline-none cursor-pointer"
          />
        </div>
      </div>

      {/* Planned Mileage Readiness Banner */}
      <div className="rounded-xl border border-white/[0.06] bg-zinc-900/60 p-4 space-y-2">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            {mileageEvaluation.status === 'prime' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            ) : mileageEvaluation.status === 'digesting' ? (
              <AlertCircle className="w-4 h-4 text-amber-400 shrink-0" />
            ) : (
              <Sparkles className="w-4 h-4 text-sky-400 shrink-0" />
            )}
            <span className="text-xs font-bold text-white">
              Status for Mileage at {formatTimeTo12Hour(plannedMileageTime)}:
            </span>
          </div>

          <span
            className={`text-[10px] font-mono font-semibold px-2 py-0.5 rounded-full border ${mileageEvaluation.badgeColor}`}
          >
            {mileageEvaluation.headline}
          </span>
        </div>

        <p className="text-xs text-zinc-400 leading-relaxed pl-6">
          {mileageEvaluation.detail}
        </p>
      </div>

      {/* Meals Chronological Fueling Cards */}
      <div className="space-y-3">
        <span className="text-xs font-semibold uppercase tracking-wider text-zinc-400 block">
          Today&apos;s Meal Fueling Trajectory ({mealProfiles.length} logged meals)
        </span>

        {mealProfiles.length === 0 ? (
          <div className="text-center py-6 border border-dashed border-white/[0.08] rounded-xl text-zinc-500 text-xs">
            No timed meals logged for this day yet. Log a meal with a consumption time to see real-time glycemic curves and pre-mileage windows.
          </div>
        ) : (
          <div className="space-y-2.5">
            {mealProfiles.map(({ meal, profile, time }) => (
              <div
                key={meal.id}
                onClick={() => onSelectMeal(meal)}
                className="group flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 rounded-xl border border-white/[0.04] bg-zinc-950/60 hover:bg-zinc-900/70 hover:border-white/[0.1] transition-all cursor-pointer"
              >
                {/* Left: Meal description & timing */}
                <div className="flex items-start gap-3">
                  <div className="flex flex-col items-center justify-center p-2 rounded-xl bg-zinc-900 border border-white/[0.06] text-center min-w-[58px]">
                    <Clock className="w-3.5 h-3.5 text-zinc-400 mb-0.5" />
                    <span className="font-mono text-xs font-bold text-white">
                      {time}
                    </span>
                    <span className="text-[9px] text-zinc-500 uppercase font-mono">{meal.mealType}</span>
                  </div>

                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <h4 className="text-xs font-bold text-white group-hover:text-zinc-100 transition-colors">
                        {meal.foodName}
                      </h4>
                      <span className="text-[10px] px-1.5 py-0.2 rounded bg-zinc-800 border border-white/[0.06] text-zinc-300 font-mono">
                        {profile.glycemicImpactCategory}
                      </span>
                    </div>

                    {/* Macros summary */}
                    <div className="mt-1 flex items-center gap-2 text-[11px] font-mono text-zinc-400">
                      <span className="text-amber-400">{meal.carbs}g Carbs</span>
                      <span className="text-zinc-600">·</span>
                      <span className="text-emerald-400">{meal.protein}g Prot</span>
                      <span className="text-zinc-600">·</span>
                      <span className="text-zinc-300">{meal.fats}g Fats</span>
                      {meal.fiber > 0 && (
                        <>
                          <span className="text-zinc-600">·</span>
                          <span className="text-emerald-300">{meal.fiber}g Fiber</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                {/* Right: Calculated Prime Mileage Window Badge */}
                <div className="flex items-center justify-between sm:justify-end gap-3 pt-2 sm:pt-0 border-t sm:border-t-0 border-white/[0.04]">
                  <div className="text-left sm:text-right">
                    <div className="flex items-center sm:justify-end gap-1 text-[11px] font-semibold text-emerald-400">
                      <Zap className="w-3 h-3 text-amber-400" />
                      <span>Mileage: {profile.workoutWindow.startTime} – {profile.workoutWindow.endTime}</span>
                    </div>
                    <span className="text-[10px] text-zinc-400 font-mono block">
                      Peak: ~{profile.estimatedPeakTime} (+{profile.peakGlucoseRiseMgDl} mg/dL)
                    </span>
                  </div>

                  <span className="p-1.5 rounded-lg bg-zinc-800 text-zinc-400 group-hover:text-white transition-colors">
                    <ChevronRight className="w-4 h-4" />
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Physiological Explanatory Footer */}
      <div className="pt-2 border-t border-white/[0.06] flex items-center justify-between text-[11px] text-zinc-400">
        <span className="flex items-center gap-1.5">
          <ShieldCheck className="w-3.5 h-3.5 text-zinc-400" />
          Factored: Viscous Fiber, Protein Incretins (GLP-1), &amp; Lipid CCK Gastric Deceleration
        </span>
        <span className="font-mono text-zinc-400 hidden sm:inline">Click any meal for full glycemic curve</span>
      </div>
    </Astra3DCard>
  );
};
