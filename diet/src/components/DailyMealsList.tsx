import React from 'react';
import { useDiet } from '../context/DietContext';
import { MealType, MealEntry } from '../types/diet';
import { Astra3DCard } from './Astra3DCard';
import { formatTimeTo12Hour, calculateMealGlycemicProfile } from '../utils/glycemicCalculations';
import {
  Plus,
  Trash2,
  Coffee,
  Utensils,
  Moon,
  Apple,
  Clock,
  Zap,
  Activity,
} from 'lucide-react';

interface DailyMealsListProps {
  onOpenLogger: (mealType: MealType) => void;
  onOpenGlycemicModal?: (meal: MealEntry) => void;
}

export const DailyMealsList: React.FC<DailyMealsListProps> = ({
  onOpenLogger,
  onOpenGlycemicModal,
}) => {
  const { currentDayMeals, deleteMeal, addMeal } = useDiet();

  const mealSections: {
    type: MealType;
    title: string;
    icon: React.ReactNode;
    color: string;
    accentBg: string;
  }[] = [
    {
      type: 'breakfast',
      title: 'Breakfast',
      icon: <Coffee className="w-3.5 h-3.5 text-zinc-300" />,
      color: 'text-zinc-300',
      accentBg: 'bg-zinc-800 border-white/[0.08]',
    },
    {
      type: 'lunch',
      title: 'Lunch',
      icon: <Utensils className="w-3.5 h-3.5 text-emerald-400" />,
      color: 'text-emerald-400',
      accentBg: 'bg-emerald-500/10 border-emerald-500/20',
    },
    {
      type: 'dinner',
      title: 'Dinner',
      icon: <Moon className="w-3.5 h-3.5 text-amber-400" />,
      color: 'text-amber-400',
      accentBg: 'bg-amber-500/10 border-amber-500/20',
    },
    {
      type: 'snacks',
      title: 'Snacks & Fuel',
      icon: <Apple className="w-3.5 h-3.5 text-zinc-400" />,
      color: 'text-zinc-400',
      accentBg: 'bg-zinc-800 border-white/[0.08]',
    },
  ];

  const handleDuplicate = (meal: MealEntry) => {
    addMeal({
      date: meal.date,
      mealType: meal.mealType,
      foodName: `${meal.foodName}`,
      servings: meal.servings,
      servingUnit: meal.servingUnit,
      grams: meal.grams,
      calories: meal.calories,
      protein: meal.protein,
      carbs: meal.carbs,
      fats: meal.fats,
      fiber: meal.fiber,
      mealTime: meal.mealTime,
    });
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-base font-bold text-white tracking-tight">
            Daily Meal Breakdown
          </h3>
          <p className="text-xs text-zinc-400">
            Chronological nutrient journal with glycemic surge &amp; mileage window telemetry
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {mealSections.map(({ type, title, icon, accentBg }) => {
          const mealsOfType = currentDayMeals.filter((m) => m.mealType === type);

          const totalCal = mealsOfType.reduce((acc, m) => acc + m.calories, 0);
          const totalP = Math.round(mealsOfType.reduce((acc, m) => acc + m.protein, 0) * 10) / 10;
          const totalC = Math.round(mealsOfType.reduce((acc, m) => acc + m.carbs, 0) * 10) / 10;
          const totalF = Math.round(mealsOfType.reduce((acc, m) => acc + m.fats, 0) * 10) / 10;

          return (
            <Astra3DCard
              key={type}
              depth={6}
              className="flex flex-col justify-between p-4"
            >
              {/* Header */}
              <div className="flex items-center justify-between pb-3 border-b border-white/[0.08]">
                <div className="flex items-center gap-2">
                  <div className={`p-1.5 rounded-lg border ${accentBg}`}>{icon}</div>
                  <div>
                    <h4 className="text-sm font-semibold text-white">{title}</h4>
                    <span className="text-[11px] font-mono text-zinc-400">
                      {mealsOfType.length} {mealsOfType.length === 1 ? 'item' : 'items'}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <span className="font-mono text-sm font-bold text-white tabular-nums block">
                      {totalCal} <span className="text-[10px] text-zinc-400 font-normal">kcal</span>
                    </span>
                    <span className="text-[10px] font-mono text-zinc-400">
                      P: {totalP}g · C: {totalC}g · F: {totalF}g
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onOpenLogger(type);
                    }}
                    className="flex h-7 w-7 items-center justify-center rounded-lg bg-zinc-800 border border-white/[0.08] text-zinc-300 hover:bg-zinc-100 hover:text-zinc-950 transition-colors cursor-pointer active:scale-95 shadow-sm"
                    title={`Add food to ${title}`}
                  >
                    <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
                  </button>
                </div>
              </div>

              {/* Items List */}
              <div className="my-3 flex-1 space-y-2.5 min-h-[90px]">
                {mealsOfType.length === 0 ? (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onOpenLogger(type);
                    }}
                    className="w-full flex flex-col items-center justify-center h-24 rounded-xl border border-dashed border-white/[0.08] bg-zinc-900/30 text-center p-3 cursor-pointer hover:border-white/20 hover:bg-zinc-900/50 transition-colors active:scale-[0.99]"
                  >
                    <span className="text-xs text-zinc-500">No {title.toLowerCase()} logged yet</span>
                    <span className="text-[11px] text-zinc-300 mt-1 flex items-center gap-1 font-semibold">
                      <Plus className="w-3.5 h-3.5 text-emerald-400 stroke-[3]" /> Log {title} item
                    </span>
                  </button>
                ) : (
                  mealsOfType.map((meal) => {
                    const timeDisplay = meal.mealTime || meal.timeLogged;
                    const profile = timeDisplay
                      ? calculateMealGlycemicProfile({
                          mealTime: timeDisplay,
                          carbs: meal.carbs,
                          protein: meal.protein,
                          fats: meal.fats,
                          fiber: meal.fiber,
                          calories: meal.calories,
                          grams: meal.grams,
                          foodName: meal.foodName,
                        })
                      : null;

                    return (
                      <div
                        key={meal.id}
                        className="group flex flex-col gap-2 rounded-xl bg-zinc-900/60 p-2.5 border border-white/[0.04] hover:bg-zinc-800/60 hover:border-white/[0.1] transition-all text-xs"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex-1 pr-2">
                            <div className="font-medium text-zinc-100 flex items-center gap-1.5 flex-wrap">
                              <span>{meal.foodName}</span>
                              <span className="text-[10px] text-zinc-500 font-mono">
                                ({meal.grams}g)
                              </span>
                              {timeDisplay && (
                                <span className="inline-flex items-center gap-1 text-[10px] font-mono text-zinc-400 bg-zinc-800/80 px-1.5 py-0.2 rounded border border-white/[0.04]">
                                  <Clock className="w-2.5 h-2.5" />
                                  {formatTimeTo12Hour(timeDisplay)}
                                </span>
                              )}
                            </div>
                            <div className="font-mono text-[11px] text-zinc-400 mt-0.5">
                              <span className="text-emerald-400">P: {meal.protein}g</span> ·{' '}
                              <span className="text-amber-400">C: {meal.carbs}g</span> ·{' '}
                              <span className="text-zinc-300">F: {meal.fats}g</span>
                              {meal.fiber > 0 && (
                                <> · <span className="text-emerald-300">Fib: {meal.fiber}g</span></>
                              )}
                            </div>
                          </div>

                          <div className="flex items-center gap-2">
                            <span className="font-mono text-xs font-semibold text-white tabular-nums bg-zinc-800/80 px-2 py-0.5 rounded border border-white/[0.06]">
                              {meal.calories} kcal
                            </span>
                            <div className="flex items-center sm:opacity-0 group-hover:opacity-100 transition-opacity">
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDuplicate(meal);
                                }}
                                className="p-1 rounded text-zinc-400 hover:text-white cursor-pointer active:scale-90"
                                title="Repeat item"
                              >
                                <Plus className="w-3 h-3" />
                              </button>
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  deleteMeal(meal.id);
                                }}
                                className="p-1 rounded text-zinc-400 hover:text-rose-400 cursor-pointer active:scale-90"
                                title="Remove entry"
                              >
                                <Trash2 className="w-3 h-3" />
                              </button>
                            </div>
                          </div>
                        </div>

                        {/* Glycemic & Workout Window Indicator Badge */}
                        {profile && (
                          <div className="flex items-center justify-between pt-1.5 border-t border-white/[0.04] text-[10px]">
                            <button
                              type="button"
                              onClick={() => onOpenGlycemicModal?.(meal)}
                              className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-lg bg-emerald-500/10 text-emerald-300 hover:bg-emerald-500/20 border border-emerald-500/20 transition-colors font-mono cursor-pointer"
                              title="Click to view detailed Blood Glucose &amp; Mileage Timeline"
                            >
                              <Zap className="w-3 h-3 text-amber-400" />
                              <span>Mileage: {profile.workoutWindow.startTime} – {profile.workoutWindow.endTime}</span>
                            </button>

                            <button
                              type="button"
                              onClick={() => onOpenGlycemicModal?.(meal)}
                              className="text-zinc-400 hover:text-zinc-200 transition-colors font-mono flex items-center gap-1 cursor-pointer"
                            >
                              <Activity className="w-3 h-3 text-emerald-400" />
                              <span>Peak +{profile.peakGlucoseRiseMgDl} mg/dL</span>
                            </button>
                          </div>
                        )}
                      </div>
                    );
                  })
                )}
              </div>

              {/* Footer Quick Action */}
              <button
                onClick={() => onOpenLogger(type)}
                className="w-full flex items-center justify-center gap-1.5 py-1.5 rounded-lg border border-dashed border-white/[0.08] text-xs font-medium text-zinc-400 hover:text-white hover:border-white/20 transition-all cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                Add food to {title}
              </button>
            </Astra3DCard>
          );
        })}
      </div>
    </div>
  );
};
