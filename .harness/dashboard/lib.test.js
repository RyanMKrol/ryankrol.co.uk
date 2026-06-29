const { isDone, deriveTask, computeBacklog, summarize } = require('./lib');

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
  // T1 done. T2 ready (dep done). T_h needs-human. T_wh waits transitively on T_h (via T2b).
  // T_wl waits only on a buildable task. T5 blocked via worklog.
  const tasks = [
    { id: 'T1', status: 'done', gate: null, dependsOn: [] },
    { id: 'T2', status: 'pending', gate: null, dependsOn: ['T1'] }, // ready: dep done
    { id: 'T_h', status: 'pending', gate: 'needs-human', dependsOn: [] }, // needs-human
    { id: 'T2b', status: 'pending', gate: null, dependsOn: ['T_h'] }, // waiting-human (direct human dep)
    { id: 'T_wh', status: 'pending', gate: null, dependsOn: ['T2b'] }, // waiting-human (transitive)
    { id: 'T_wl', status: 'pending', gate: null, dependsOn: ['T2'] }, // waiting-loop (dep buildable)
    { id: 'T5', status: 'pending', gate: null, dependsOn: [] }, // blocked via worklog
  ];
  const res = computeBacklog(tasks, { blockedIds: ['T5'] });
  const by = Object.fromEntries(res.map((t) => [t.id, t]));

  it('done bucket', () => expect(by.T1.bucket).toBe('done'));
  it('ready when all deps done', () => expect(by.T2.bucket).toBe('ready'));
  it('the needs-human task itself → needs-human', () => expect(by.T_h.bucket).toBe('needs-human'));
  it('a task with a DIRECT needs-human dep → waiting-human', () => expect(by.T2b.bucket).toBe('waiting-human'));
  it('a task TRANSITIVELY blocked by a needs-human → waiting-human', () => expect(by.T_wh.bucket).toBe('waiting-human'));
  it('a task waiting only on a buildable dep → waiting-loop (not the owner\'s concern)', () =>
    expect(by.T_wl.bucket).toBe('waiting-loop'));
  it('failed:blocked worklog task → blocked', () => expect(by.T5.bucket).toBe('blocked'));

  it('a human-done overlay entry counts as done and unblocks dependents', () => {
    const r = computeBacklog(
      [
        { id: 'X', status: 'pending', gate: 'needs-human', dependsOn: [] },
        { id: 'Y', status: 'pending', gate: null, dependsOn: ['X'] },
      ],
      { humanDone: { X: { done: true } } }
    );
    const m = Object.fromEntries(r.map((t) => [t.id, t]));
    expect(m.X.bucket).toBe('done');
    expect(m.Y.bucket).toBe('ready');
  });

  it('flags a manual-failed task', () => {
    const r = computeBacklog([{ id: 'Z', status: 'done', gate: null, dependsOn: [] }], {
      manualFail: { Z: { failed: true } },
    });
    expect(r[0].manualFailed).toBe(true);
  });

  it('a terminal status=failed task → failed bucket, and blocks its dependents (waiting-human)', () => {
    const r = computeBacklog([
      { id: 'F', status: 'failed', gate: null, dependsOn: [] },
      { id: 'G', status: 'pending', gate: null, dependsOn: ['F'] },
    ]);
    const m = Object.fromEntries(r.map((t) => [t.id, t]));
    expect(m.F.bucket).toBe('failed');
    expect(m.F.failed).toBe(true);
    expect(m.G.bucket).toBe('waiting-human'); // a failed dep needs the owner, so G waits on a human
  });

  it('flags a reviewed task from the reviews overlay', () => {
    const r = computeBacklog(
      [
        { id: 'A', status: 'done', gate: null, dependsOn: [] },
        { id: 'B', status: 'done', gate: null, dependsOn: [] },
      ],
      { reviewed: { A: { reviewed: true } } }
    );
    const m = Object.fromEntries(r.map((t) => [t.id, t]));
    expect(m.A.reviewed).toBe(true);
    expect(m.B.reviewed).toBe(false);
  });

  it('summarize counts every bucket', () => {
    const s = summarize(res);
    expect(s.done).toBe(1);
    expect(s.ready).toBe(1);
    expect(s['needs-human']).toBe(1);
    expect(s['waiting-human']).toBe(2);
    expect(s['waiting-loop']).toBe(1);
    expect(s.blocked).toBe(1);
  });
});
