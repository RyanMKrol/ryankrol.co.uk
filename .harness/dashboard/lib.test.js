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
  // T_wl waits only on a buildable task (must be entirely omitted). T5 blocked via worklog.
  const tasks = [
    { id: 'T1', status: 'done', gate: null, dependsOn: [] },
    { id: 'T2', status: 'pending', gate: null, dependsOn: ['T1'] }, // ready: dep done
    { id: 'T_h', status: 'pending', gate: 'needs-human', dependsOn: [] }, // needsHuman
    { id: 'T2b', status: 'pending', gate: null, dependsOn: ['T_h'] }, // waiting (direct human dep)
    { id: 'T_wh', status: 'pending', gate: null, dependsOn: ['T2b'] }, // waiting (transitive)
    { id: 'T_wl', status: 'pending', gate: null, dependsOn: ['T2'] }, // waiting-loop: omitted entirely
    { id: 'T5', status: 'pending', gate: null, dependsOn: [] }, // needsHuman via worklog-blocked
  ];
  const res = computeBacklog(tasks, { blockedIds: ['T5'] });
  const by = Object.fromEntries(res.map((t) => [t.id, t]));

  it('done bucket', () => expect(by.T1.bucket).toBe('done'));
  it('ready when all deps done', () => expect(by.T2.bucket).toBe('ready'));
  it('the needs-human task itself → needsHuman', () => expect(by.T_h.bucket).toBe('needsHuman'));
  it('a task with a DIRECT needs-human dep → waiting', () => expect(by.T2b.bucket).toBe('waiting'));
  it('a task TRANSITIVELY blocked by a needs-human → waiting', () => expect(by.T_wh.bucket).toBe('waiting'));
  it('a task waiting only on a buildable dep is excluded entirely (not ready, not waiting)', () => {
    expect(by.T_wl).toBeUndefined();
  });
  it('failed:blocked worklog task → needsHuman, flagged blocked:true', () => {
    expect(by.T5.bucket).toBe('needsHuman');
    expect(by.T5.blocked).toBe(true);
  });

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

  it('a terminal status=failed task → done bucket alongside status=done, flagged failed:true', () => {
    const r = computeBacklog([
      { id: 'F', status: 'failed', gate: null, dependsOn: [] },
      { id: 'H', status: 'done', gate: null, dependsOn: [] },
      { id: 'G', status: 'pending', gate: null, dependsOn: ['F'] },
    ]);
    const m = Object.fromEntries(r.map((t) => [t.id, t]));
    expect(m.F.bucket).toBe('done');
    expect(m.F.failed).toBe(true);
    expect(m.H.bucket).toBe('done');
    expect(m.G.bucket).toBe('waiting'); // a failed dep needs the owner, so G waits on a human
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

  it('summarize counts every bucket in the new four-bucket model', () => {
    const s = summarize(res);
    expect(s.done).toBe(1);
    expect(s.ready).toBe(1);
    expect(s.needsHuman).toBe(2); // T_h + T5
    expect(s.waiting).toBe(2); // T2b + T_wh
    expect(s['waiting-loop']).toBeUndefined();
  });

  it('done bucket sorts not-reviewed first, then ascending numeric task id within each group', () => {
    const r = computeBacklog(
      [
        { id: 'T005', status: 'done', gate: null, dependsOn: [] },
        { id: 'T002', status: 'done', gate: null, dependsOn: [] },
        { id: 'T010', status: 'done', gate: null, dependsOn: [] },
      ],
      { reviewed: { T005: { reviewed: true } } }
    );
    const doneIds = r.filter((t) => t.bucket === 'done').map((t) => t.id);
    expect(doneIds).toEqual(['T002', 'T010', 'T005']);
  });
});
