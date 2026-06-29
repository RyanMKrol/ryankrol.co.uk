import { classifyProgramme, aggregateProgramme } from './programmeStats';

// Synthetic workout factory
function workout({ title, start_time, totalVolume = 0, totalWorkingSets = 0 }) {
  return { title, start_time, totalVolume, totalWorkingSets };
}

const WORKOUTS = [
  workout({ title: 'Push A',   start_time: '2024-01-05T10:00:00Z', totalVolume: 5000, totalWorkingSets: 10 }),
  workout({ title: 'Pull B',   start_time: '2024-01-06T10:00:00Z', totalVolume: 4000, totalWorkingSets: 9 }),
  workout({ title: 'Legs C',   start_time: '2024-01-07T10:00:00Z', totalVolume: 6000, totalWorkingSets: 12 }),
  workout({ title: 'PUSH Day', start_time: '2024-01-10T10:00:00Z', totalVolume: 5500, totalWorkingSets: 11 }),
  workout({ title: 'Rest Day', start_time: '2024-01-11T10:00:00Z', totalVolume: 0,    totalWorkingSets: 0 }),
  workout({ title: 'pull session', start_time: '2024-02-01T10:00:00Z', totalVolume: 3000, totalWorkingSets: 8 }),
];

describe('classifyProgramme', () => {
  it('returns push for push-titled workouts (case-insensitive)', () => {
    expect(classifyProgramme({ title: 'Push A' })).toBe('push');
    expect(classifyProgramme({ title: 'PUSH Day' })).toBe('push');
  });

  it('returns pull for pull-titled workouts', () => {
    expect(classifyProgramme({ title: 'Pull B' })).toBe('pull');
    expect(classifyProgramme({ title: 'pull session' })).toBe('pull');
  });

  it('returns legs for legs-titled workouts', () => {
    expect(classifyProgramme({ title: 'Legs C' })).toBe('legs');
    expect(classifyProgramme({ title: 'LEGS Heavy' })).toBe('legs');
  });

  it('returns null for non-programme titles', () => {
    expect(classifyProgramme({ title: 'Rest Day' })).toBeNull();
    expect(classifyProgramme({ title: 'Cardio' })).toBeNull();
    expect(classifyProgramme({ title: '' })).toBeNull();
  });
});

describe('aggregateProgramme', () => {
  it('only includes workouts from the requested programme', () => {
    const result = aggregateProgramme(WORKOUTS, 'push');
    expect(result.sessions).toHaveLength(2);
    result.sessions.forEach(s => {
      expect(s.date).toBeTruthy();
    });
  });

  it('returns sessions sorted date ascending', () => {
    const result = aggregateProgramme(WORKOUTS, 'push');
    const dates = result.sessions.map(s => s.date);
    expect(dates).toEqual([...dates].sort());
  });

  it('maps session fields correctly', () => {
    const result = aggregateProgramme(WORKOUTS, 'push');
    expect(result.sessions[0]).toMatchObject({
      date: '2024-01-05T10:00:00Z',
      volume: 5000,
      workingSets: 10,
    });
  });

  it('computes frequencyByMonth correctly', () => {
    const result = aggregateProgramme(WORKOUTS, 'pull');
    expect(result.frequencyByMonth).toEqual([
      { month: '2024-01', count: 1 },
      { month: '2024-02', count: 1 },
    ]);
  });

  it('computes totals with correct avg (rounded)', () => {
    const result = aggregateProgramme(WORKOUTS, 'push');
    expect(result.totals.workouts).toBe(2);
    expect(result.totals.totalVolume).toBe(10500);
    expect(result.totals.avgVolumePerWorkout).toBe(5250);
  });

  it('returns empty structures when no workouts match', () => {
    const result = aggregateProgramme(WORKOUTS, 'legs');
    // only one legs workout
    expect(result.totals.workouts).toBe(1);
    const noMatch = aggregateProgramme([], 'push');
    expect(noMatch.sessions).toEqual([]);
    expect(noMatch.frequencyByMonth).toEqual([]);
    expect(noMatch.totals).toEqual({ workouts: 0, totalVolume: 0, avgVolumePerWorkout: 0 });
  });
});
