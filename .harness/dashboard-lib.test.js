const { isDone, deriveTask, computeBacklog, summarize } = require('./dashboard-lib');

describe('isDone', () => {
  it('is true when TASKS.json status is done', () => {
    expect(isDone({ id: 'T1', status: 'done' }, {})).toBe(true);
  });
  it('is true when the human-done overlay marks it (mirrors loop task_done)', () => {
    expect(isDone({ id: 'T1', status: 'pending' }, { T1: { done: true } })).toBe(true);
  });
  it('is false when neither status nor overlay say done', () => {
    expect(isDone({ id: 'T1', status: 'pending' }, { T1: { done: false } })).toBe(false);
    expect(isDone({ id: 'T1', status: 'pending' }, {})).toBe(false);
  });
});

describe('computeBacklog', () => {
  const tasks = [
    { id: 'T1', status: 'done', gate: null, dependsOn: [] },
    { id: 'T2', status: 'pending', gate: null, dependsOn: ['T1'] }, // ready: dep done
    { id: 'T3', status: 'pending', gate: null, dependsOn: ['T2'] }, // waiting: dep not done
    { id: 'T4', status: 'pending', gate: 'needs-human', dependsOn: [] },
    { id: 'T5', status: 'pending', gate: null, dependsOn: [] }, // blocked via worklog
  ];
  const res = computeBacklog(tasks, { blockedIds: ['T5'] });
  const by = Object.fromEntries(res.map((t) => [t.id, t]));

  it('puts a done task in the done bucket', () => expect(by.T1.bucket).toBe('done'));
  it('marks ready when all deps are done', () => expect(by.T2.bucket).toBe('ready'));
  it('marks waiting when a dep is not done, and lists unmet deps', () => {
    expect(by.T3.bucket).toBe('waiting');
    expect(by.T3.unmetDeps).toEqual(['T2']);
  });
  it('routes a needs-human gate to needs-human', () => expect(by.T4.bucket).toBe('needs-human'));
  it('routes a failed:blocked worklog task to blocked', () => expect(by.T5.bucket).toBe('blocked'));

  it('treats a human-done overlay entry as done (so it unblocks dependents)', () => {
    const r = computeBacklog(
      [
        { id: 'X', status: 'pending', gate: 'needs-human', dependsOn: [] },
        { id: 'Y', status: 'pending', gate: null, dependsOn: ['X'] },
      ],
      { humanDone: { X: { done: true } } }
    );
    const m = Object.fromEntries(r.map((t) => [t.id, t]));
    expect(m.X.bucket).toBe('done');
    expect(m.Y.bucket).toBe('ready'); // dependent unblocked by the overlay
  });

  it('flags a manual-failed task', () => {
    const r = computeBacklog([{ id: 'Z', status: 'done', gate: null, dependsOn: [] }], {
      manualFail: { Z: { failed: true } },
    });
    expect(r[0].manualFailed).toBe(true);
  });

  it('summarize counts buckets', () => {
    const s = summarize(res);
    expect(s.done).toBe(1);
    expect(s.ready).toBe(1);
    expect(s.waiting).toBe(1);
    expect(s['needs-human']).toBe(1);
    expect(s.blocked).toBe(1);
  });
});
