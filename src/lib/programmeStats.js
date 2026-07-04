const PROGRAMMES = ['push', 'pull', 'legs'];

/**
 * Classify a workout as push/pull/legs by substring match on the title.
 * @param {Object} workout
 * @returns {'push'|'pull'|'legs'|null}
 */
export function classifyProgramme(workout) {
  const title = (workout.title || '').toLowerCase();
  for (const prog of PROGRAMMES) {
    if (title.includes(prog)) return prog;
  }
  return null;
}

/**
 * Aggregate per-session and summary stats for one programme.
 * @param {Object[]} workouts - full workout list (may contain all programmes)
 * @param {'push'|'pull'|'legs'|'all'} programme
 * @returns {{ sessions, frequencyByMonth, totals }}
 */
export function aggregateProgramme(workouts, programme) {
  const filtered = workouts
    .filter(w =>
      programme === 'all' ? classifyProgramme(w) !== null : classifyProgramme(w) === programme
    )
    .sort((a, b) => {
      const ta = a.start_time || a.workoutDate || '';
      const tb = b.start_time || b.workoutDate || '';
      return ta < tb ? -1 : ta > tb ? 1 : 0;
    });

  const sessions = filtered.map(w => ({
    date: w.start_time || w.workoutDate,
    volume: w.totalVolume ?? 0,
    workingSets: w.totalWorkingSets ?? 0,
  }));

  const frequencyMap = {};
  for (const w of filtered) {
    const ts = w.start_time || w.workoutDate || '';
    const month = ts.slice(0, 7); // 'YYYY-MM'
    if (month) frequencyMap[month] = (frequencyMap[month] || 0) + 1;
  }
  const frequencyByMonth = Object.entries(frequencyMap)
    .sort(([a], [b]) => (a < b ? -1 : 1))
    .map(([month, count]) => ({ month, count }));

  const workoutCount = filtered.length;
  const totalVolume = filtered.reduce((sum, w) => sum + (w.totalVolume ?? 0), 0);
  const avgVolumePerWorkout = workoutCount > 0 ? Math.round(totalVolume / workoutCount) : 0;

  return {
    sessions,
    frequencyByMonth,
    totals: { workouts: workoutCount, totalVolume, avgVolumePerWorkout },
  };
}
