'use client';
import { useEffect, useMemo, useRef, useState } from 'react';
import * as E from '../lib/engine.ts';
type Run = { at: string; profile: E.Profile };
const LS = (k: string, v?: any) => { if (v === undefined) { try { return JSON.parse(localStorage.getItem('tm-' + k) || 'null'); } catch { return null; } } localStorage.setItem('tm-' + k, JSON.stringify(v)); };
const copy = (t: string) => navigator.clipboard?.writeText(t).then(() => alert('Copied'), () => prompt('Copy this:', t));
const dl = (name: string, t: string) => { const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([t], { type: 'text/plain' })); a.download = name; a.click(); };

export default function Page() {
  const [ready, setReady] = useState(false); const [st, setSt] = useState<E.State>(E.newState()); const [fit, setFit] = useState<E.Fit | null>(null);
  const [s0, setS0] = useState<E.S0Resp[]>([]); const [mode, setMode] = useState<'s0' | 'gen' | 'map' | 'lab'>('gen'); const [s0i, setS0i] = useState(-1);
  const [cur, setCur] = useState<E.Item | null>(null); const [val, setVal] = useState<any>(null); const [sw, setSw] = useState(0); const [conf, setConf] = useState(75);
  const [draws, setDraws] = useState(0); const t0 = useRef(Date.now()); const [runs, setRuns] = useState<Run[]>([]); const [pack, setPack] = useState('');
  useEffect(() => { const s = LS('state'); if (s) setSt(s); const f = LS('fit'); if (f) setFit(f); else { setMode('s0'); } setS0(LS('s0') || []); setRuns(LS('runs') || []); setReady(true); if ('serviceWorker' in navigator) navigator.serviceWorker.register('/sw.js').catch(() => {}); }, []);
  useEffect(() => { if (ready) LS('state', st); }, [st, ready]);
  const prof = useMemo(() => E.analyze(st, fit), [st, fit]);
  const reset = () => { setVal(null); setSw(0); setConf(75); setDraws(0); t0.current = Date.now(); };
  const push = () => { // Generate: skip current unanswered card, serve a fresh unseen one
    let s = st; if (cur) s = E.skip(s, cur.id, Date.now() - t0.current);
    const n = E.generate(s, fit); s = E.markSeen(s, n.id); setSt(s); setCur(n); reset(); };
  const submit = () => { if (!cur) return; const r: E.Resp = { id: cur.id, value: val, ms: Date.now() - t0.current, switches: sw, conf, draws };
    setSt(E.answer(st, r)); setCur(null); reset(); };
  const choose = (v: any) => { if (val !== null && val !== v) setSw(sw + 1); setVal(v); };
  const startS0 = () => { setS0([]); setS0i(0); setMode('s0'); t0.current = Date.now(); };
  const s0pick = (c: number) => { const q = E.STAGE0[s0i]; const nx = [...s0, { id: q.id, choice: c, ms: Date.now() - t0.current }]; setS0(nx); t0.current = Date.now();
    if (s0i + 1 >= E.STAGE0.length) { const f = E.computeFit(nx); setFit(f); LS('fit', f); LS('s0', nx); setS0i(E.STAGE0.length); } else setS0i(s0i + 1); };
  const s0text = fit && s0.length ? E.stage0Export(s0, fit) : '';
  const saveRun = () => { const r = [...runs, { at: new Date().toLocaleString(), profile: prof }]; setRuns(r); LS('runs', r); };
  if (!ready) return <div className="w">Loading…</div>;
  const canSubmit = cur && (cur.format === 'beads' ? val !== null : cur.format === 'open' ? (val || '').trim().length > 3 : val !== null);
  return <div className="w">
    <h1>Thought Mapper</h1>
    <div><span className="badge">Tuned to your style: {E.fitLabel(fit)}</span> <button onClick={startS0}>Recalibrate</button>{s0text && <button onClick={() => copy(s0text)}>Copy Intelligence Test Export</button>}</div>
    <div className="tabs"><button className={mode === 'gen' ? 'sel' : ''} onClick={() => setMode('gen')}>Generate</button><button className={mode === 'map' ? 'sel' : ''} onClick={() => setMode('map')}>Your Map</button><button className={mode === 'lab' ? 'sel' : ''} onClick={() => setMode('lab')}>Lab</button></div>
    <div className="card"><div className="muted">Signal gathered: {Math.round(prof.sufficiency * 100)}% · {prof.answered} answered · {prof.skipped} skipped {prof.unlocked ? '· Full map unlocked ✓' : '· keep going to unlock your map'}</div><div className="bar"><i style={{ width: prof.sufficiency * 100 + '%' }} /></div></div>

    {mode === 's0' && <div className="card">
      {s0i < 0 && <><h3>Stage 0: Warm-up (under a minute)</h3><p>10 quick questions so the app can word everything the way that's easiest for you. It's not a school test — just go with what you see.</p><button className="gen" onClick={startS0}>Start warm-up</button>{fit && <button onClick={() => setMode('gen')}>Skip — already tuned</button>}</>}
      {s0i >= 0 && s0i < E.STAGE0.length && <><div className="muted">{s0i + 1} / {E.STAGE0.length}</div><h3>{E.STAGE0[s0i].text}</h3>{E.STAGE0[s0i].options.map((o, i) => <button key={i} className="opt" onClick={() => s0pick(i)}>{o}</button>)}</>}
      {s0i >= E.STAGE0.length && fit && <><h3>Done. Score {fit.score}/100</h3><p>Questions will now be worded: <b>{E.fitLabel(fit)}</b>. Same deep measuring — just easier wording for you.</p>
        <button className="gen" onClick={() => copy(s0text)}>Copy Intelligence Test Export</button><button onClick={() => dl('stage0.txt', s0text)}>Download .txt</button><button onClick={() => dl('stage0.json', JSON.stringify({ responses: s0, fit }, null, 2))}>Download .json</button><button onClick={() => { setMode('gen'); setS0i(-1); }}>Go to Generate</button><pre>{s0text}</pre></>}
    </div>}

    {mode === 'gen' && <>
      <button className="gen" onClick={push}>Generate</button>
      <div className="muted">Can't answer or doesn't fit you? Just push Generate again — it never repeats.</div>
      {cur && <div className="card"><div className="muted">{cur.format} · {cur.topic}{cur.custom ? ' · custom pack' : ''}</div><h3>{E.render(cur, fit)}</h3>
        {cur.format === 'scale' && <div>{[1, 2, 3, 4, 5, 6, 7].map(v => <button key={v} className={val === v ? 'sel' : ''} onClick={() => choose(v)}>{v}</button>)}<div className="muted">1 = not me at all · 7 = exactly me</div></div>}
        {(cur.options && cur.format !== 'scale') && cur.options.map((o, i) => <button key={i} className={'opt ' + (val === i ? 'sel' : '')} onClick={() => choose(i)}>{E.renderOpt(o, fit)}</button>)}
        {cur.format === 'calibration' && <>{cur.calib!.options.map((o, i) => <button key={i} className={'opt ' + (val === i ? 'sel' : '')} onClick={() => choose(i)}>{o}</button>)}<div>How sure are you? {conf}%</div><input type="range" min={50} max={100} value={conf} onChange={e => setConf(+e.target.value)} /></>}
        {cur.format === 'beads' && <><div style={{ fontSize: 26, letterSpacing: 4 }}>{cur.beads!.seq.slice(0, draws).split('').map((c, i) => <span key={i} style={{ color: c === 'A' ? '#ef4444' : '#3b82f6' }}>●</span>)}</div>
          {draws < 12 && <button onClick={() => setDraws(draws + 1)}>Draw a clue ({draws})</button>}<button className={val === 'A' ? 'sel' : ''} onClick={() => choose('A')}>It's RED</button><button className={val === 'B' ? 'sel' : ''} onClick={() => choose('B')}>It's BLUE</button></>}
        {cur.format === 'open' && <textarea rows={5} value={val || ''} onChange={e => setVal(e.target.value)} placeholder="Say it straight. Nobody sees this but you." />}
        <div><button className="sel" disabled={!canSubmit} onClick={submit}>Lock answer</button></div></div>}
      {prof.unlocked && <div className="card"><h3>Your map is unlocked — see "Your Map". Keep generating to sharpen it.</h3></div>}
    </>}

    {mode === 'map' && <MapView p={prof} fit={fit} />}

    {mode === 'lab' && <div className="card"><h3>Iteration Lab</h3>
      <button onClick={saveRun}>Save this run</button><button onClick={() => dl('thought-mapper.json', JSON.stringify({ st, fit, s0, runs }, null, 2))}>Export all JSON</button>
      <button onClick={() => { const t = prompt('Paste full export JSON'); if (t) { const d = JSON.parse(t); if (d.st) setSt(d.st); if (d.fit) { setFit(d.fit); LS('fit', d.fit); } } }}>Import JSON</button>
      <button onClick={() => { if (confirm('Wipe all answers?')) { setSt(E.newState()); setCur(null); } }}>Reset answers</button>
      <h3>Paste / Import Custom Pack</h3><textarea rows={5} value={pack} onChange={e => setPack(e.target.value)} placeholder='[{"id":"my-1","format":"choice","topic":"money","text":"...","options":[{"label":"A","w":{"risk":1}},{"label":"B","w":{"risk":-1}}]}]' />
      <button onClick={() => { try { setSt(E.importPack(st, pack)); setPack(''); alert('Pack added — it will be served first by Generate.'); } catch (e) { alert('Bad JSON: ' + e); } }}>Import Pack</button>
      <div className="muted">{st.custom.length} custom items loaded · {E.BANK.length} curated + endless generated items</div>
      <h3>Saved runs ({runs.length})</h3>{runs.length >= 2 && <Diff a={runs[runs.length - 2]} b={runs[runs.length - 1]} />}
      {runs.map((r, i) => <div key={i} className="muted">{r.at} — {r.profile.answered} answered</div>)}
      <h3>Question weights</h3><pre>{E.BANK.slice(0, 200).map(b => `${b.id} [${b.format}/${b.topic}${b.trigger ? '/trigger:' + b.trigger : ''}] ${b.claim ? 'claims ' + b.claim + (b.claimSign! > 0 ? '+' : '−') : (b.options || []).map(o => o.label.slice(0, 24) + ' ' + JSON.stringify(o.w)).join(' | ')}`).join('\n')}</pre>
    </div>}
  </div>;
}
function Diff({ a, b }: { a: Run; b: Run }) { return <pre>{E.AXES.map(x => `${E.AXIS_NAME[x]}: ${a.profile.axes[x] ?? '–'} → ${b.profile.axes[x] ?? '–'}`).join('\n')}</pre>; }
function MapView({ p, fit }: { p: E.Profile; fit: E.Fit | null }) {
  const rep = E.report(p, fit); const N = E.AXES.length, R = 110, cx = 140, cy = 130;
  const pt = (i: number, v: number) => { const a = (Math.PI * 2 * i) / N - Math.PI / 2, r = R * (v + 1) / 2; return [cx + r * Math.cos(a), cy + r * Math.sin(a)]; };
  const poly = E.AXES.map((x, i) => pt(i, p.axes[x] ?? 0).join(',')).join(' ');
  const lam = p.lambda ?? 2.0; const curve = Array.from({ length: 41 }, (_, i) => { const x = (i - 20) / 20; const y = x >= 0 ? Math.pow(x, .88) : -lam * Math.pow(-x, .88); return `${140 + x * 120},${100 - y * 30}`; }).join(' ');
  const tmax = Math.max(1, ...E.TRIGGERS.map(t => p.triggers[t]));
  return <>
    {!p.unlocked && <div className="card">Keep pushing Generate — the full map unlocks once there's enough signal. Early reads below.</div>}
    <div className="card"><button className="gen" onClick={() => copy(rep)}>Copy Plain-Text Full Breakdown</button></div>
    <div className="card"><h3>What the app sees in you</h3>{p.findings.length === 0 && <div className="muted">Answer a few more questions.</div>}{p.findings.map((f, i) => <div key={i} className={'f ' + f.kind}><b>{f.title}</b><div>{f.plain}</div></div>)}</div>
    <div className="card"><h3>Thinking shape</h3><svg viewBox="0 0 280 270" width="100%">{[-1, 0, 1].map(v => <polygon key={v} points={E.AXES.map((_, i) => pt(i, v).join(',')).join(' ')} fill="none" stroke="#262c3d" />)}<polygon points={poly} fill="#7c3aed55" stroke="#a78bfa" />{E.AXES.map((x, i) => { const [a, b] = pt(i, 1.25); return <text key={x} x={a} y={b} fontSize="8" fill="#97a0b5" textAnchor="middle">{E.AXIS_NAME[x]}</text>; })}</svg></div>
    <div className="card"><h3>How losses vs wins feel (λ={p.lambda ?? 'not measured yet'})</h3><svg viewBox="0 0 280 200" width="100%"><line x1="20" y1="100" x2="260" y2="100" stroke="#33405e" /><line x1="140" y1="10" x2="140" y2="190" stroke="#33405e" /><polyline points={curve} fill="none" stroke="#22c55e" strokeWidth="2" /><text x="200" y="90" fill="#97a0b5" fontSize="9">wins</text><text x="40" y="120" fill="#97a0b5" fontSize="9">losses</text></svg></div>
    <div className="card"><h3>What you say vs what you do</h3>{Object.keys(p.claimed).length === 0 && <div className="muted">No self-rating questions answered yet.</div>}{(Object.keys(p.claimed) as E.Axis[]).map(a => <div key={a}><div className="muted">{E.AXIS_NAME[a]}: say {p.claimed[a]!.toFixed(2)} · do {p.axes[a] ?? '–'}</div><svg viewBox="0 0 200 16" width="100%"><rect x="0" y="6" width="200" height="4" fill="#232a3d" /><circle cx={100 + p.claimed[a]! * 95} cy="8" r="5" fill="#f59e0b" />{p.axes[a] !== null && <circle cx={100 + p.axes[a]! * 95} cy="8" r="5" fill="#2f6df6" />}</svg></div>)}<div className="muted">orange = what you say · blue = what your choices show</div></div>
    <div className="card"><h3>Trigger heat</h3>{E.TRIGGERS.map(t => <div key={t}><div className="muted">{E.TRIG_NAME[t]} — {p.triggers[t]}</div><div className="bar"><i style={{ width: (p.triggers[t] / tmax) * 100 + '%', background: '#ef4444' }} /></div></div>)}<div className="muted">Median answer time {Math.round(p.medianMs / 100) / 10}s · answer changes per question {p.switchRate}</div></div>
    <div className="card"><pre>{rep}</pre></div></>;
}
