// Thought Mapper engine — fully deterministic (seeded hash PRNG only, no system randomness).
export type Axis = 'risk'|'loss'|'jtc'|'overconf'|'principle'|'zerosum'|'external'|'threat'|'impulse'|'candor'|'control'|'trust';
export type Trigger = 'betrayal'|'status'|'control'|'ambiguity'|'unfair'|'ego';
export type Format = 'scale'|'choice'|'scenario'|'gamble'|'calibration'|'beads'|'open';
export type W = Partial<Record<Axis, number>>;
export interface Opt { label: string; plain?: string; w: W }
export interface Item {
  id: string; format: Format; topic: string; text: string; plain?: string; dense?: string;
  options?: Opt[]; claim?: Axis; claimSign?: number; trigger?: Trigger;
  gamble?: { sure: number; win: number; lose: number; p: number; mixed?: boolean };
  calib?: { answer: number; options: string[]; trap?: boolean };
  beads?: { ratio: number; seq: string };
  custom?: boolean;
}
export interface Resp { id: string; value: any; ms: number; switches: number; conf?: number; draws?: number; skipped?: boolean }
export interface Fit { readingLevel: 'plain'|'dense'; framingStyle: 'concrete'|'abstract'; complexityTier: 1|2|3; score: number }
export const AXES: Axis[] = ['risk','loss','jtc','overconf','principle','zerosum','external','threat','impulse','candor','control','trust'];
export const TRIGGERS: Trigger[] = ['betrayal','status','control','ambiguity','unfair','ego'];
export const AXIS_NAME: Record<Axis,string> = { risk:'Risk appetite', loss:'Loss sensitivity', jtc:'Jumps to conclusions', overconf:'Overconfidence', principle:'Rules over outcomes', zerosum:'Zero-sum lens', external:'Blames outside forces', threat:'Threat scanning', impulse:'Gut-speed deciding', candor:'Raw candor', control:'Need for control', trust:'Default trust' };
export const TRIG_NAME: Record<Trigger,string> = { betrayal:'Betrayal / broken trust', status:'Disrespect / status hits', control:'Losing control', ambiguity:'Not knowing', unfair:'Being exploited / unfairness', ego:'Being exposed as not good enough' };

// ---------- hash / seeded PRNG (deterministic) ----------
export function hash(s: string): number { let h = 2166136261; for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; }
export function rng(seed: number) { let a = seed >>> 0; return () => { a = (a + 0x6D2B79F5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }

// ---------- curated bank ----------
const S = (id: string, topic: string, text: string, claim: Axis, sign: number, plain?: string, trigger?: Trigger): Item => ({ id, format: 'scale', topic, text, plain, claim, claimSign: sign, trigger });
const C = (id: string, format: Format, topic: string, text: string, opts: [string, W][], trigger?: Trigger, plain?: string): Item => ({ id, format, topic, text, plain, trigger, options: opts.map(([label, w]) => ({ label, w })) });
const O = (id: string, topic: string, text: string, trigger?: Trigger, plain?: string): Item => ({ id, format: 'open', topic, text, plain, trigger });

export const BANK: Item[] = [
  S('s-risk','money','I take big swings when the upside is real, even if I could lose a lot.','risk',1,'I go for big wins even when I could lose big.'),
  S('s-jtc','judgment','I usually wait for the full story before I decide what happened.','jtc',-1,'I wait for the whole story before I decide.'),
  S('s-fair','fairness','I stay calm and logical when someone cheats me.','threat',-1,'When someone cheats me, I stay calm.','unfair'),
  S('s-trust','trust','I give people the benefit of the doubt until they prove otherwise.','trust',1,'I trust people until they give me a reason not to.'),
  S('s-ctrl','control','I am fine letting someone else run the plan, even when I think mine is better.','control',-1,'I can let someone else drive, even if my plan is better.','control'),
  S('s-ego','ego','Criticism of my work does not get under my skin.','threat',-1,'When someone rips my work, it doesn\'t bother me.','ego'),
  S('s-honest','candor','I say exactly what I think, even when it costs me.','candor',1,'I say what I really think even if it costs me.'),
  S('s-own','attribution','When things go wrong in my life, it\'s mostly on me.','external',-1,'When my life goes wrong, it\'s mostly on me.'),
  S('s-zero','power','Most of the time, other people winning doesn\'t mean I lose.','zerosum',-1,'Usually, someone else winning doesn\'t mean I lose.'),
  S('s-slow','judgment','I think things over before I act, instead of going with my gut.','impulse',-1,'I think first instead of going on gut.'),
  S('s-rules','principle','I stick to my rules even when breaking one would get a better result.','principle',1,'I keep my rules even when breaking one would work out better.'),
  S('s-status','status','If someone disrespects me in front of others, I let it go.','threat',-1,'If someone disrespects me in public, I let it go.','status'),
  C('c-betray','scenario','betrayal','Your closest friend sold a private story about you to win favor with someone powerful. They apologize and it was genuinely a one-time slip. You:',[['Cut them off permanently, no conversation',{trust:-1,threat:1,principle:.5}],['Make them earn it back slowly',{trust:-.2,control:.6}],['Forgive and move on — one slip isn\'t who they are',{trust:1,threat:-.6}],['Quietly collect leverage on them for later',{zerosum:1,trust:-.8,candor:-.6}]],'betrayal','Your best friend told your secret to get ahead. They\'re sorry and it only happened once. What do you do?'),
  C('c-wallet','scenario','temptation','You find a wallet with $900 cash and an ID. No camera, no witness, rent is due tomorrow. You:',[['Return it all',{principle:1,candor:.4}],['Return it, keep a "finder\'s fee" of $100',{principle:-.3}],['Keep the cash, mail back the ID',{principle:-1,zerosum:.5}],['Depends who they look like they are',{principle:-.6,external:.3}]],undefined,'You find a wallet with $900 and no one saw. Rent is due tomorrow. What do you do?'),
  C('c-credit','scenario','ego','Your boss presents your idea as theirs in a big meeting. It lands huge. You:',[['Call it out right there',{candor:1,threat:.8,impulse:.8}],['Say nothing now, confront them privately',{control:.5,impulse:-.5}],['Let it go — the idea won, that\'s what matters',{principle:-.4,threat:-.6}],['Start quietly working around them',{zerosum:.8,trust:-.7,candor:-.5}]],'status'),
  C('c-sunk','choice','money','You\'ve put 2 years and $40k into a business that\'s still losing money. A neutral expert says the odds of it turning around are about 20%. You:',[['Keep going — I\'m too far in to quit',{loss:1,risk:.4}],['Give it a hard 3-month deadline',{loss:.3,control:.6}],['Shut it down now and redeploy',{loss:-1,principle:-.2}]],undefined,'You\'ve spent 2 years and $40k on a business that still loses money. An expert says it has a 1-in-5 chance to turn around. What do you do?'),
  C('c-power','choice','power','Pick one: be feared and get your way, or be liked and get overridden.',[['Feared',{zerosum:1,control:1}],['Liked',{zerosum:-.6,control:-.6}]]),
  C('c-envy','scenario','envy','A rival you can\'t stand gets the exact win you wanted. Honest first reaction:',[['I hope it falls apart for them',{zerosum:1,candor:1,threat:.6}],['Annoyed, but I use it as fuel',{zerosum:.3,candor:.6}],['Genuinely fine with it',{zerosum:-.8,candor:-.2}]],'status'),
  C('c-plan','choice','control','A trip with friends. You:',[['Plan every stop myself',{control:1}],['Set the big pieces, wing the rest',{control:.2}],['Let others decide, I\'ll show up',{control:-1,trust:.5}]],'control'),
  C('c-text','scenario','ambiguity','Someone important to you hasn\'t replied in 9 hours after reading your message. You:',[['Assume something\'s wrong between us',{jtc:1,threat:1}],['Assume they\'re busy',{jtc:-.5,trust:.8}],['Send another message to find out',{control:.8,impulse:.6}],['Don\'t think about it',{threat:-1}]],'ambiguity','They read your text 9 hours ago and didn\'t reply. What do you think?'),
  C('c-lie','choice','candor','A friend asks if their business idea is good. It\'s bad and they\'ve already quit their job. You:',[['Tell them it\'s bad, straight',{candor:1}],['Point out the biggest problem gently',{candor:.4}],['Encourage them — it\'s too late anyway',{candor:-1,principle:-.4}]]),
  C('c-fault','choice','attribution','You lose a job you wanted to someone less skilled. The main reason is:',[['They played politics / knew someone',{external:1,zerosum:.5}],['I interviewed worse than I thought',{external:-1}],['Bad luck, honestly',{external:.5}]],'unfair'),
  C('c-trolley','scenario','principle','You can lie under oath to save an innocent friend from 5 years in prison. Nobody will ever know.',[['Lie',{principle:-1,trust:.3}],['Tell the truth',{principle:1}]]),
  C('c-revenge','scenario','revenge','Someone wrecked your reputation with a lie. You find proof they cheated on their taxes. You:',[['Report them',{zerosum:.8,threat:.7}],['Hold it as leverage',{control:1,zerosum:.6,candor:-.4}],['Do nothing with it',{zerosum:-.7,principle:.4}]],'betrayal'),
  C('c-humil','scenario','ego','You confidently correct someone in public and it turns out you were wrong. Everyone saw. You:',[['Own it out loud right away',{candor:1,threat:-.5}],['Laugh it off and change subject',{candor:-.3}],['Find a way to say I was partly right',{candor:-.8,threat:.6}],['Replay it in my head for days',{threat:1}]],'ego'),
  C('c-opp','choice','threat','You walk into a room full of strangers. What do you notice first?',[['Who might be a problem',{threat:1}],['Who might be useful or interesting',{threat:-1}],['Where the exits / my people are',{threat:.6,control:.5}]]),
  C('c-cheat','scenario','intimacy','You find strong evidence your partner is hiding something, but not proof. You:',[['Confront with what I have',{jtc:.7,candor:.8}],['Dig quietly until I\'m sure',{jtc:-.6,control:.8,trust:-.5}],['Ask openly without accusing',{trust:.6,candor:.5}],['Pretend I didn\'t see it',{candor:-1,threat:.5}]],'betrayal'),
  C('c-split','choice','fairness','You and a stranger split $100. They offer you $15 and keep $85. If you refuse, you both get nothing.',[['Accept $15 — it\'s free money',{principle:-.6,threat:-.5}],['Refuse — they don\'t get to do that',{principle:.6,threat:.8,zerosum:.5}]],'unfair'),
  C('c-boss','scenario','authority','A rule at work is dumb and slows everyone down. Nobody checks it. You:',[['Ignore it',{principle:-1,control:.5}],['Follow it but complain',{principle:.4}],['Follow it quietly',{principle:.8,control:-.5}],['Push to get it changed',{control:.8,candor:.6}]],'control'),
  C('c-death','choice','mortality','You get told you have 2 years left, healthy until the end. Most of your time goes to:',[['Building something that outlasts me',{control:.6,risk:.3}],['People I love',{trust:.6}],['Doing every wild thing I put off',{risk:1,impulse:.6}],['Fixing old wrongs',{principle:.8}]]),
  C('c-obsess','choice','obsession','An unsolved problem grabs you. You:',[['Can\'t stop until I crack it, even if life suffers',{control:1,risk:.4}],['Work it hard, but put it down at night',{control:.2}],['Lose interest once it gets hard',{control:-.6,impulse:.5}]]),
  C('c-ruth','choice','ambition','Would you quietly sink a coworker\'s project if it guaranteed your promotion and they\'d never find out?',[['Yes',{zerosum:1,principle:-1,candor:1}],['No',{zerosum:-.4,principle:.6}],['Maybe, depends how much I like them',{zerosum:.5,principle:-.5,candor:.6}]]),
  C('c-taboo','choice','taboo','Honestly: have you ever been relieved when someone you knew failed?',[['Yes, and I knew it was ugly',{candor:1,zerosum:.5}],['Yes, but they deserved it',{candor:.6,external:.6}],['No, never',{candor:-.6}]]),
  C('c-loyal','scenario','loyalty','Your brother committed a serious crime that hurt a stranger. Cops ask if you know anything.',[['Cover for him',{principle:-1,trust:.6}],['Tell the truth',{principle:1}],['Say I don\'t know and tell him to turn himself in',{principle:.3,control:.6}]],'betrayal'),
  C('c-angry','choice','anger','When you\'re furious, what happens first?',[['I say it right then',{impulse:1,candor:.8}],['I go cold and quiet',{control:.8,candor:-.4}],['I leave and come back later',{impulse:-.6}],['I plan how to get even',{zerosum:1,impulse:-.4}]]),
  C('c-unknown','scenario','ambiguity','Two jobs: A pays $70k guaranteed. B pays somewhere between $40k and $120k and you won\'t know until you start.',[['A',{risk:-1}],['B',{risk:1}]],'ambiguity'),
  C('c-advice','choice','ego','A younger, less experienced person tells you how to do something you\'re good at — and they\'re right.',[['I take it and thank them',{threat:-.8,candor:.4}],['I take it but it stings',{threat:.4,candor:.6}],['I do it my way anyway',{threat:.8,control:1}]],'ego'),
  C('c-crowd','choice','judgment','Everyone in the room is sure about something you think is wrong.',[['I say so',{candor:1}],['I keep quiet and watch',{candor:-.6}],['I start doubting myself',{external:.5,threat:.5}]]),
  C('c-deal','scenario','money','A deal that looks too good: double your money in 30 days, from someone you trust. You:',[['Put in a small test amount',{risk:.3,control:.5}],['Go big while it lasts',{risk:1,jtc:.7}],['Walk — too good to be true',{risk:-1}]]),
  C('c-forgive','choice','betrayal','Can someone who cheated on you ever be fully trusted again?',[['Yes',{trust:1}],['Partly',{trust:.2}],['Never',{trust:-1,principle:.4}]],'betrayal'),
  C('c-fast','choice','judgment','You read a headline that confirms what you already believed. You:',[['Share it',{jtc:1,impulse:.8}],['Read the whole thing first',{jtc:-.5}],['Look for who\'s pushing back on it',{jtc:-1}]]),
  O('o-hate','status','Describe the last time someone made you feel small. What exactly did they do, and what did you do after?','status','When did someone last make you feel small? What did they do, and what did you do?'),
  O('o-want','ambition','What do you want so badly you\'d be embarrassed to say it out loud? Say it.',undefined,'What do you want so bad you\'d be embarrassed to say it? Say it.'),
  O('o-betray','betrayal','Who betrayed you the worst and what did it teach you about people?','betrayal','Who hurt your trust the most, and what did it teach you?'),
  O('o-wrong','ego','Write about something you were sure about that turned out wrong. Why were you sure?','ego'),
  O('o-ctrl','control','What happens inside you when a plan you made gets taken out of your hands?','control'),
  O('o-unfair','fairness','What is the most unfair thing that\'s happened to you, and whose fault was it?','unfair'),
  O('o-dark','taboo','What is a thought you\'ve had about someone you\'d never admit to them?',undefined,'What\'s a thought about someone you\'d never tell them?'),
];

// ---------- parametric generators (inexhaustible) ----------
const actors = ['your best friend','your partner','your boss','your brother','a coworker you trust','your business partner','your oldest friend','your mom','a mentor','your roommate'];
const breaches = ['lied to you about money','told your secret to someone you dislike','took credit for your work','went behind your back on a decision','mocked you to others','broke a promise that cost you','used your idea without asking','sided with someone who wronged you'];
const stakes = ['in front of people you respect','and it cost you $500','and nobody else knows','and they don\'t think it was a big deal','right before something important for you','and they\'ve done it once before'];
const reacts: [string, W][] = [['Confront them right now',{impulse:.8,candor:.8,threat:.6}],['Pull back quietly and stop trusting them',{trust:-.8,candor:-.5}],['Talk it out once I cool down',{impulse:-.6,trust:.4}],['Let it slide',{threat:-.6,candor:-.4}],['Get even somehow',{zerosum:1,trust:-.6}]];
const trigOf = (b: number): Trigger => (['unfair','betrayal','status','control','status','betrayal','unfair','betrayal'] as Trigger[])[b];

export function genItem(kind: number, n: number): Item { const it = genItem0(kind, n); CACHE.set(it.id, it); return it; }
function genItem0(kind: number, n: number): Item {
  const r = rng(hash(kind + ':' + n)); const pick = <T,>(a: T[]) => a[Math.floor(r() * a.length)];
  if (kind === 0) { // mixed gamble (loss aversion)
    const lose = 20 + Math.floor(r() * 9) * 10; const ratio = [1, 1.25, 1.5, 1.75, 2, 2.5, 3][n % 7]; const win = Math.round(lose * ratio);
    return { id: `g-mix-${lose}-${win}-${n}`, format: 'gamble', topic: 'money', text: `Coin flip: heads you win $${win}, tails you lose $${lose}. Take the bet?`, gamble: { sure: 0, win, lose, p: .5, mixed: true }, options: [{ label: 'Take it', w: {} }, { label: 'Pass', w: {} }] };
  }
  if (kind === 1) { // sure thing vs gamble, gain or loss frame
    const p = [.1, .25, .5, .75, .9][n % 5]; const amt = 100 + Math.floor(r() * 20) * 50; const loss = r() < .5; const sure = Math.round(amt * p);
    const text = loss ? `Choose: lose $${sure} for sure, OR a ${Math.round(p * 100)}% chance to lose $${amt} (otherwise lose nothing).` : `Choose: get $${sure} for sure, OR a ${Math.round(p * 100)}% chance to get $${amt} (otherwise nothing).`;
    return { id: `g-${loss ? 'L' : 'G'}-${p}-${amt}`, format: 'gamble', topic: 'money', text, gamble: { sure: loss ? -sure : sure, win: loss ? 0 : amt, lose: loss ? amt : 0, p }, options: [{ label: 'Sure thing', w: { risk: -1 } }, { label: 'Gamble', w: { risk: 1 } }] };
  }
  if (kind === 2) { // betrayal scenario
    const a = Math.floor(r() * actors.length), b = Math.floor(r() * breaches.length), s = Math.floor(r() * stakes.length);
    return { id: `sc-${a}-${b}-${s}`, format: 'scenario', topic: 'betrayal', trigger: trigOf(b), text: `${cap(actors[a])} ${breaches[b]}, ${stakes[s]}. What do you do?`, options: reacts.map(([label, w]) => ({ label, w })) };
  }
  if (kind === 3) { // calibration: arithmetic / probability trap
    const x = 2 + Math.floor(r() * 18), y = 2 + Math.floor(r() * 9), t = n % 3;
    if (t === 0) { const tot = x * 10 + 10; const ball = 10; const bat = tot + ball; const ans = (bat + 0) ; void ans;
      const total = x + 1; // bat and ball: total $total.10, bat costs $total more
      const correct = 5; const wrong = 10;
      return { id: `cal-bb-${x}`, format: 'calibration', topic: 'judgment', text: `A bat and a ball cost $${total}.10 total. The bat costs $${total} more than the ball. How many cents is the ball?`, calib: { answer: 0, options: [`${correct}¢`, `${wrong}¢`, `${correct + wrong}¢`], trap: true } };
    }
    if (t === 1) { const days = 10 + x; return { id: `cal-lily-${days}`, format: 'calibration', topic: 'judgment', text: `A patch of weeds doubles every day. It covers the whole field on day ${days}. On what day did it cover half?`, calib: { answer: 1, options: [`Day ${Math.round(days / 2)}`, `Day ${days - 1}`, `Day ${days - 2}`], trap: true } }; }
    const pct = [1, 2, 5][n % 3 === 2 ? (x % 3) : 0]; const fp = 10;
    // P(sick|positive) ~ pct*0.9/(pct*0.9 + (100-pct)*fp/100)
    const pp = (pct * .9) / (pct * .9 + (100 - pct) * fp / 100); const bands = ['Under 20%', '40–60%', 'Over 80%']; const ans = pp < .2 ? 0 : pp < .6 ? 1 : 2;
    return { id: `cal-bayes-${pct}-${y}`, format: 'calibration', topic: 'judgment', text: `${pct} in 100 people have a condition. A test catches 90% of real cases but also flags 10% of healthy people. You test positive. Chance you actually have it?`, calib: { answer: ans, options: bands, trap: true } };
  }
  if (kind === 4) { // beads / evidence sampling
    const ratio = [.6, .65, .7, .75, .8][n % 5]; let seq = ''; for (let i = 0; i < 12; i++) seq += r() < ratio ? 'A' : 'B';
    return { id: `bd-${ratio}-${seq}`, format: 'beads', topic: 'judgment', text: `A hidden jar is either mostly RED (${Math.round(ratio * 100)}% red) or mostly BLUE (${Math.round(ratio * 100)}% blue). Draw clues one at a time. Decide when you\'re ready — fewer draws isn\'t scored as "better".`, beads: { ratio, seq } };
  }
  // kind 5: forced-choice value trade-off
  const pairs: [string, W, string, W][] = [
    ['Be right', { candor: .6, threat: .4 }, 'Be at peace', { threat: -.6 }], ['Win the argument', { zerosum: .8 }, 'Keep the friend', { zerosum: -.8 }],
    ['Follow the rule', { principle: 1 }, 'Get the result', { principle: -1 }], ['Know the truth, even if it hurts', { jtc: -.4, candor: .6 }, 'Not know, and be happy', { candor: -.6 }],
    ['Be in charge', { control: 1 }, 'Be free of responsibility', { control: -1 }], ['Move fast and fix later', { impulse: 1, risk: .5 }, 'Move slow and get it right', { impulse: -1 }],
    ['Respected', { threat: .3, control: .4 }, 'Loved', { trust: .5 }], ['Revenge', { zerosum: 1 }, 'Forgetting it ever happened', { zerosum: -.6 }],
    ['Bet on yourself', { risk: .8, external: -.5 }, 'Bet on the system', { risk: -.5, external: .3 }], ['Assume good intent', { trust: 1, threat: -.5 }, 'Assume self-interest', { trust: -1, threat: .5 }],
  ];
  const i = n % pairs.length, j = Math.floor(n / pairs.length) % pairs.length; const [a, wa, b, wb] = pairs[i]; const [c, wc, d, wd] = pairs[(i + 1 + j) % pairs.length];
  const which = (n + j) % 2; const p = which ? [c, wc, d, wd] as const : [a, wa, b, wb] as const; void p;
  return { id: `fc-${i}-${j}`, format: 'choice', topic: 'values', text: `Gun to your head, pick one: ${a} — or — ${b}? (Then the next fork: ${c} vs ${d} is implied by your speed.)`.replace(/ \(Then.*$/, ''), options: [{ label: a, w: wa }, { label: b, w: wb }] };
}
function cap(s: string) { return s[0].toUpperCase() + s.slice(1); }

// ---------- Stage 0: Mind-Fit opener ----------
export interface S0 { id: string; kind: 'pattern'|'verbal'|'logic'|'memory'|'analogy'|'numeric'|'style'; text: string; options: string[]; answer?: number }
export const STAGE0: S0[] = [
  { id: 'z-pat', kind: 'pattern', text: 'Next number: 2, 6, 12, 20, 30, ?', options: ['36', '40', '42', '48'], answer: 2 },
  { id: 'z-verb', kind: 'verbal', text: '"Her praise was faint." Closest meaning:', options: ['She praised loudly', 'She barely praised — it felt like a dig', 'She was tired', 'She praised in secret'], answer: 1 },
  { id: 'z-log', kind: 'logic', text: 'All of Jay\'s cars are red. This car is red. So:', options: ['It\'s Jay\'s', 'It\'s not Jay\'s', 'Can\'t tell'], answer: 2 },
  { id: 'z-mem', kind: 'memory', text: 'Hold this: 7 – 3 – 9 – 1. Now add 2 to each and say them backward.', options: ['3-11-5-9', '3-11-5-9 backwards is 9-5-11-3', '9-5-11-3... no: 3,11,5,9', '3-11-5-9'], answer: 0 },
  { id: 'z-ana', kind: 'analogy', text: 'Seed is to tree as idea is to…', options: ['Brain', 'Invention', 'Thought', 'Paper'], answer: 1 },
  { id: 'z-num', kind: 'numeric', text: 'A shirt is $40, marked 25% off, then 10% off that. Final price?', options: ['$26', '$27', '$28', '$30'], answer: 1 },
  { id: 'z-base', kind: 'logic', text: 'In a town, 90% of cabs are green, 10% blue. A witness who\'s right 80% of the time says the cab was blue. More likely the cab was:', options: ['Blue', 'Green'], answer: 1 },
  { id: 'z-seq', kind: 'pattern', text: 'Which doesn\'t belong: square, triangle, circle, cube?', options: ['Square', 'Triangle', 'Circle', 'Cube'], answer: 3 },
  { id: 'z-style1', kind: 'style', text: 'Which way of asking is easier for you to answer?', options: ['"Your friend borrowed $200 and ghosted you. What do you do?"', '"How do you respond to violations of reciprocal obligations?"'] },
  { id: 'z-style2', kind: 'style', text: 'How do you like questions worded?', options: ['Short and straight', 'Detailed with all the context'] },
];
// fix memory item options to be unambiguous
STAGE0[3].options = ['3-11-5-9', '9-5-11-3', '11-3-9-5', '3-9-5-11'];
STAGE0[3].text = 'Remember: 7, 3, 9, 1. Add 2 to each, then read them in reverse order.'; // 9,5,11,3 -> reversed 3,11,5,9
STAGE0[3].answer = 0;

export interface S0Resp { id: string; choice: number; ms: number }
export function computeFit(rs: S0Resp[]): Fit {
  let correct = 0, scored = 0, fast = 0, concrete = 0, short = 0;
  for (const r of rs) {
    const q = STAGE0.find(x => x.id === r.id); if (!q) continue;
    if (q.kind === 'style') { if (q.id === 'z-style1' && r.choice === 0) concrete++; if (q.id === 'z-style2' && r.choice === 0) short++; continue; }
    scored++; if (r.choice === q.answer) { correct++; if (r.ms < 12000) fast++; }
  }
  const acc = scored ? correct / scored : 0; const score = Math.round((acc * 0.85 + (scored ? fast / scored : 0) * 0.15) * 100);
  const complexityTier = (score >= 75 ? 3 : score >= 45 ? 2 : 1) as 1|2|3;
  const readingLevel = short || complexityTier === 1 ? 'plain' : 'dense';
  return { readingLevel, framingStyle: concrete ? 'concrete' : 'abstract', complexityTier, score };
}
export function fitLabel(f: Fit | null) { if (!f) return 'Not tuned yet'; return `${f.readingLevel === 'plain' ? 'Direct' : 'Detailed'} & ${f.framingStyle === 'concrete' ? 'Concrete' : 'Big-picture'} · level ${f.complexityTier}`; }

// Render question wording for a fit. Same item id, same weights — only wording changes.
export function render(it: Item, fit: Fit | null): string {
  let t = it.text;
  if (!fit) return t;
  if (fit.readingLevel === 'plain' && it.plain) t = it.plain;
  if (fit.readingLevel === 'dense' && it.dense) t = it.dense;
  if (it.format === 'gamble' && fit.complexityTier === 1 && it.gamble) {
    const g = it.gamble; const k = Math.round(g.p * 10);
    t = g.mixed ? `Flip a coin. Heads: you get $${g.win}. Tails: you pay $${g.lose}. Do you flip?` : t.replace(/(\d+)% chance/, `${k} out of 10 chance`);
  }
  if (fit.complexityTier === 3 && it.format === 'gamble' && it.gamble) { const g = it.gamble; const ev = g.mixed ? g.p * g.win - (1 - g.p) * g.lose : (g.win ? g.p * g.win : -g.p * g.lose); t += ` (Expected value of the gamble: ${ev >= 0 ? '+' : '−'}$${Math.abs(Math.round(ev))}.)`; }
  if (fit.framingStyle === 'abstract' && it.format === 'scenario') t += ' Think about what you\'d do as a general rule, not just this one time.';
  if (fit.readingLevel === 'plain') t = t.replace(/genuinely /g, '').replace(/redeploy/g, 'use the money on something else');
  return t;
}
export function renderOpt(o: Opt, fit: Fit | null) { return fit?.readingLevel === 'plain' && o.plain ? o.plain : o.label; }

// ---------- state & Generate ----------
export interface State { seen: string[]; responses: Resp[]; custom: Item[]; pool?: Record<string, Item> }
export const newState = (): State => ({ seen: [], responses: [], custom: [], pool: {} });
const CACHE = new Map<string, Item>();
export function getItem(id: string, st: State): Item | undefined {
  const c = st.pool?.[id] || CACHE.get(id) || st.custom.find(x => x.id === id) || BANK.find(x => x.id === id); if (c) return c;
  for (let k = 0; k < 6; k++) for (let n = 0; n < 400; n++) { const g = genItem(k, n); if (g.id === id) return g; }
}
function itemAxes(it: Item): Axis[] {
  const s = new Set<Axis>(); if (it.claim) s.add(it.claim); it.options?.forEach(o => Object.keys(o.w).forEach(a => s.add(a as Axis)));
  if (it.format === 'gamble') { s.add('risk'); if (it.gamble?.mixed) s.add('loss'); } if (it.format === 'calibration') { s.add('overconf'); s.add('impulse'); } if (it.format === 'beads') s.add('jtc'); if (it.format === 'open') { s.add('candor'); s.add('external'); s.add('threat'); }
  return [...s];
}
export function candidates(st: State, limit = 60): Item[] {
  const seen = new Set(st.seen); const out: Item[] = [];
  for (const it of [...st.custom, ...BANK]) if (!seen.has(it.id)) out.push(it);
  for (let k = 0; k < 6; k++) { let got = 0; for (let n = 0; n < 5000 && got < 4; n++) { const g = genItem(k, n); if (!seen.has(g.id) && !out.some(o => o.id === g.id)) { out.push(g); got++; } } }
  return out;
}
export function generate(st: State, fit: Fit | null = null): Item {
  const ans = st.responses.filter(r => !r.skipped); const axCount: Record<string, number> = {}; const fmtCount: Record<string, number> = {}; const trigCount: Record<string, number> = {};
  for (const r of ans) { const it = getItem(r.id, st); if (!it) continue; itemAxes(it).forEach(a => axCount[a] = (axCount[a] || 0) + 1); fmtCount[it.format] = (fmtCount[it.format] || 0) + 1; if (it.trigger) trigCount[it.trigger] = (trigCount[it.trigger] || 0) + 1; }
  const skipTopics: Record<string, number> = {}; st.responses.filter(r => r.skipped).forEach(r => { const it = getItem(r.id, st); if (it) skipTopics[it.topic] = (skipTopics[it.topic] || 0) + 1; });
  const prof = ans.length >= 3 ? analyze(st) : null; const gapAxes = new Set(prof?.blindSpots.map(b => b.axis) || []);
  let best: Item | null = null, bestScore = -Infinity;
  for (const it of candidates(st)) {
    let sc = 0; for (const a of itemAxes(it)) sc += 1 / (1 + (axCount[a] || 0)) + (gapAxes.has(a) ? 1.2 : 0);
    sc += 1.5 / (1 + (fmtCount[it.format] || 0)); if (it.trigger) sc += .8 / (1 + (trigCount[it.trigger] || 0));
    if (skipTopics[it.topic]) sc -= .4 * skipTopics[it.topic];
    if (fit && fit.complexityTier === 1 && it.format === 'calibration' && it.id.startsWith('cal-bayes')) sc -= .5;
    if (it.custom) sc += 50;
    sc += (hash(it.id + st.seen.length) % 1000) / 1e5; // deterministic tiebreak
    if (sc > bestScore) { bestScore = sc; best = it; }
  }
  return best!;
}
export function markSeen(st: State, id: string): State { const it = getItem(id, st); const pool = { ...(st.pool || {}) }; if (it && !BANK.includes(it)) pool[id] = it; return st.seen.includes(id) ? { ...st, pool } : { ...st, seen: [...st.seen, id], pool }; }
export function skip(st: State, id: string, ms: number): State { return { ...markSeen(st, id), responses: [...st.responses, { id, value: null, ms, switches: 0, skipped: true }] }; }
export function answer(st: State, r: Resp): State { return { ...markSeen(st, r.id), responses: [...st.responses.filter(x => x.id !== r.id), r] }; }

// ---------- open text analyzer ----------
const LEX: Record<string, string[]> = {
  hedge: ['maybe','perhaps','kind of','sort of','i guess','probably','might','i think','possibly','somewhat'],
  absolute: ['always','never','everyone','nobody','completely','totally','every','nothing','all','must'],
  causal: ['because','so','therefore','since','which means','that\'s why','caused','led to'],
  conditional: ['if','unless','when','then','would','could'],
  anger: ['hate','angry','furious','pissed','rage','mad','disgust','sick of','screw'],
  betrayal: ['betray','lied','lie','behind my back','used me','stabbed','cheated','trust'],
  threat: ['afraid','scared','worried','danger','attack','risk','threat','lose'],
  agency: ['i decided','i chose','i did','i made','i built','i left','i told','i will','i took'],
  passive: ['happened to me','was done','got screwed','they made me','i was forced','had no choice','it just'],
  external: ['they','them','their','he','she','people','everyone else','system'],
};
export interface TextSig { words: number; avgSentence: number; counts: Record<string, number>; selfRatio: number; hits: Record<string, string[]> }
export function analyzeText(s: string): TextSig {
  const low = ' ' + s.toLowerCase().replace(/[^a-z' ]+/g, ' ').replace(/\s+/g, ' ') + ' ';
  const words = low.trim() ? low.trim().split(' ').length : 0; const sentences = Math.max(1, (s.match(/[.!?]+/g) || []).length);
  const counts: Record<string, number> = {}, hits: Record<string, string[]> = {};
  for (const [k, list] of Object.entries(LEX)) { counts[k] = 0; hits[k] = []; for (const w of list) { const re = new RegExp(' ' + w.replace(/'/g, "'") + ' ', 'g'); const m = low.match(re); if (m) { counts[k] += m.length; hits[k].push(w); } } }
  const self = (low.match(/ (i|me|my|mine|myself) /g) || []).length; const other = counts.external;
  return { words, avgSentence: +(words / sentences).toFixed(1), counts, selfRatio: self + other ? +(self / (self + other)).toFixed(2) : .5, hits };
}

// ---------- scoring ----------
export interface Finding { kind: string; title: string; plain: string; evidence: string[] }
export interface Profile {
  answered: number; skipped: number; axes: Record<Axis, number | null>; axisN: Record<Axis, number>;
  claimed: Partial<Record<Axis, number>>; blindSpots: { axis: Axis; claimed: number; revealed: number; gap: number; items: string[] }[];
  lambda: number | null; brier: number | null; overconf: number | null; accuracy: number | null; meanDraws: number | null;
  triggers: Record<Trigger, number>; medianMs: number; switchRate: number; text: TextSig | null;
  sufficiency: number; unlocked: boolean; findings: Finding[];
}
const clamp = (x: number) => Math.max(-1, Math.min(1, x));
export function analyze(st: State, fit: Fit | null = null): Profile {
  const ans = st.responses.filter(r => !r.skipped); const sum: Record<string, number> = {}, n: Record<string, number> = {}, src: Record<string, string[]> = {};
  const add = (a: Axis, v: number, id: string) => { sum[a] = (sum[a] || 0) + v; n[a] = (n[a] || 0) + 1; (src[a] = src[a] || []).push(id); };
  const claimed: Partial<Record<Axis, number>> = {}; const mixed: { ratio: number; take: boolean }[] = []; const cal: { conf: number; ok: number }[] = []; const draws: number[] = [];
  const msList = ans.map(r => r.ms).sort((a, b) => a - b); const medianMs = msList.length ? msList[Math.floor(msList.length / 2)] : 0;
  const trig: Record<Trigger, number> = { betrayal: 0, status: 0, control: 0, ambiguity: 0, unfair: 0, ego: 0 }; let allText = ''; const fmts = new Set<string>();
  for (const r of ans) {
    const it = getItem(r.id, st); if (!it) continue; fmts.add(it.format);
    if (it.format === 'scale' && it.claim) { const v = ((r.value - 4) / 3) * (it.claimSign || 1); claimed[it.claim] = v; }
    else if (it.format === 'gamble' && it.gamble) { const take = r.value === 1 || (it.gamble.mixed && r.value === 0);
      if (it.gamble.mixed) { mixed.push({ ratio: it.gamble.win / it.gamble.lose, take: r.value === 0 }); add('risk', r.value === 0 ? .5 : -.5, it.id); }
      else { const v = r.value === 1 ? 1 : -1; add('risk', v, it.id); if (it.gamble.sure < 0) add('loss', v, it.id); } void take; }
    else if (it.format === 'calibration' && it.calib) { const ok = r.value === it.calib.answer ? 1 : 0; const conf = (r.conf ?? 75) / 100; cal.push({ conf, ok }); if (r.ms < medianMs * .7) add('impulse', .6, it.id); }
    else if (it.format === 'beads') { const d = r.draws ?? 0; draws.push(d); add('jtc', d <= 2 ? 1 : d <= 4 ? 0 : -1, it.id); }
    else if (it.format === 'open') { allText += ' ' + String(r.value || ''); }
    else if (it.options) { const o = it.options[r.value]; if (o) for (const [a, w] of Object.entries(o.w)) add(a as Axis, w as number, it.id); }
    if (it.trigger) { let inten = 0; if (it.format === 'scale') inten = it.claimSign === -1 ? (7 - r.value) / 6 : r.value / 7; else if (it.options) { const o = it.options[r.value]; inten = o ? Math.max(0, (o.w.threat || 0) + (o.w.zerosum || 0) * .5 + (o.w.impulse || 0) * .4) : 0; } else if (it.format === 'open') { const t = analyzeText(String(r.value || '')); inten = Math.min(1, (t.counts.anger + t.counts.betrayal + t.counts.absolute) / 4); }
      const lat = medianMs ? Math.min(1, Math.max(0, r.ms / medianMs - 1)) : 0; trig[it.trigger] = +(trig[it.trigger] + inten + .5 * lat + .3 * Math.min(2, r.switches)).toFixed(2); }
  }
  const text = allText.trim() ? analyzeText(allText) : null;
  if (text && text.words > 5) { const t = text.counts; add('candor', clamp((t.absolute + t.anger - t.hedge) / 3), 'open'); add('external', clamp((t.passive * 2 + (1 - text.selfRatio) * 2 - 1 - t.agency) / 3), 'open'); add('threat', clamp((t.threat + t.anger + t.betrayal) / 4 - .2), 'open'); add('jtc', clamp((t.absolute - t.hedge - t.conditional * .5) / 3), 'open'); }
  // loss aversion lambda: midpoint between highest rejected ratio and lowest accepted ratio
  let lambda: number | null = null; if (mixed.length) { const acc = mixed.filter(m => m.take).map(m => m.ratio), rej = mixed.filter(m => !m.take).map(m => m.ratio); const lo = rej.length ? Math.max(...rej) : 0.75, hi = acc.length ? Math.min(...acc) : Math.max(...rej) + 1; lambda = +(((lo + hi) / 2)).toFixed(2); if (lo === 0.75 && acc.length) lambda = +(Math.min(...acc) * .9).toFixed(2); add('loss', clamp((lambda - 1.5) / 1.5), 'mixed-gambles'); }
  let brier: number | null = null, overconf: number | null = null, accuracy: number | null = null;
  if (cal.length) { brier = +(cal.reduce((s, c) => s + (c.conf - c.ok) ** 2, 0) / cal.length).toFixed(3); accuracy = +(cal.reduce((s, c) => s + c.ok, 0) / cal.length).toFixed(2); overconf = +(cal.reduce((s, c) => s + c.conf, 0) / cal.length - accuracy).toFixed(2); add('overconf', clamp(overconf * 2.5), 'calibration'); }
  const meanDraws = draws.length ? +(draws.reduce((a, b) => a + b, 0) / draws.length).toFixed(1) : null;
  const switchRate = ans.length ? +(ans.reduce((s, r) => s + r.switches, 0) / ans.length).toFixed(2) : 0;
  if (ans.length >= 4) { const fastShare = ans.filter(r => r.ms < 4000).length / ans.length; add('impulse', clamp(fastShare * 2 - 1), 'timing'); }
  const axes = {} as Record<Axis, number | null>, axisN = {} as Record<Axis, number>; for (const a of AXES) { axes[a] = n[a] ? +(clamp(sum[a] / n[a])).toFixed(2) : null; axisN[a] = n[a] || 0; }
  const blindSpots = (Object.keys(claimed) as Axis[]).filter(a => axes[a] !== null).map(a => ({ axis: a, claimed: +claimed[a]!.toFixed(2), revealed: axes[a]!, gap: +Math.abs(claimed[a]! - axes[a]!).toFixed(2), items: src[a] || [] })).filter(b => b.gap >= .6).sort((a, b) => b.gap - a.gap);
  const covered = AXES.filter(a => axisN[a] > 0).length + Object.keys(claimed).length * .25; const sufficiency = Math.min(1, +(Math.min(1, ans.length / 9) * .5 + Math.min(1, fmts.size / 4) * .25 + Math.min(1, covered / 8) * .25).toFixed(2));
  const p: Profile = { answered: ans.length, skipped: st.responses.length - ans.length, axes, axisN, claimed, blindSpots, lambda, brier, overconf, accuracy, meanDraws, triggers: trig, medianMs, switchRate, text, sufficiency, unlocked: sufficiency >= 1, findings: [] };
  p.findings = explain(p, st, fit); return p;
}

// ---------- plain-English explanations ----------
const AX_TXT: Record<Axis, [string, string]> = {
  risk: ['You go for the big swing. When there\'s a shot at more, you\'d rather roll than take the sure thing.', 'You play it safe. You\'d rather lock in something certain than chase a bigger maybe.'],
  loss: ['Losing hurts you way more than winning feels good, so you hang on to losing positions or avoid fair bets.', 'Losses don\'t scare you much — you\'ll cut a loss or take a fair bet without flinching.'],
  jtc: ['You lock in your answer early, before the evidence is all in.', 'You wait for more evidence than most people before you decide.'],
  overconf: ['You feel more sure than your answers back up.', 'You\'re less sure of yourself than your track record deserves.'],
  principle: ['You stick to your rules even when bending them would work out better.', 'You go for the result — rules are tools to you, not lines.'],
  zerosum: ['You see a lot of life as win-or-lose: if they get ahead, you fall behind.', 'You see most situations as room for everyone to win.'],
  external: ['When things go wrong, you mostly point to other people or the situation.', 'When things go wrong, you mostly look at your own part in it.'],
  threat: ['You scan for what could go wrong or who could hurt you first.', 'You scan for opportunity first and don\'t sweat threats much.'],
  impulse: ['You decide fast, on gut.', 'You slow down and think it over before you choose.'],
  candor: ['You say the raw thing, even when it\'s ugly.', 'You soften or hold back what you really think.'],
  control: ['You need your hands on the wheel. Losing control of a plan bothers you.', 'You\'re fine letting others drive.'],
  trust: ['You give people trust up front.', 'You hold trust back until people earn it — and pull it fast when they slip.'],
};
const LIFE: Record<Axis, string> = { risk: 'In real life that means bigger wins and bigger wipeouts.', loss: 'In real life that can keep you stuck in bad deals, jobs, or relationships longer than they deserve.', jtc: 'In real life that means you can be fast and right — or fast and wrong, and dug in.', overconf: 'In real life that means you can walk into mistakes without double-checking.', principle: 'In real life people can count on you, but you may leave wins on the table.', zerosum: 'In real life it can make you sharp in competition but cost you allies.', external: 'In real life that protects your pride but can keep you from fixing your part.', threat: 'In real life you see danger coming, but it can wear you out and make people feel judged.', impulse: 'In real life you move quick — and sometimes regret it.', candor: 'In real life people know where they stand with you, and some won\'t like it.', control: 'In real life you get things done your way, but it can strain teamwork.', trust: 'In real life it shapes who stays close to you.' };
export function explain(p: Profile, st: State, fit: Fit | null): Finding[] {
  const f: Finding[] = [];
  for (const a of AXES) { const v = p.axes[a]; if (v === null || Math.abs(v) < .3 || p.axisN[a] < 1) continue; const hi = v > 0; f.push({ kind: 'pattern', title: AXIS_NAME[a] + (hi ? ' — high' : ' — low'), plain: `${AX_TXT[a][hi ? 0 : 1]} The app caught this from ${p.axisN[a]} answer${p.axisN[a] > 1 ? 's' : ''} (score ${v > 0 ? '+' : ''}${v} on a −1 to +1 scale). ${LIFE[a]}`, evidence: [] }); }
  if (p.lambda !== null) f.push({ kind: 'risk', title: `Loss weight: ${p.lambda}×`, plain: `A loss feels about ${p.lambda} times as heavy to you as an equal win. You only took coin flips once the win was about ${p.lambda}× the loss. ${p.lambda > 2 ? 'That\'s more loss-shy than most people (typical is about 2×).' : p.lambda < 1.4 ? 'That\'s braver than most people (typical is about 2×).' : 'That\'s right around normal (about 2×).'}`, evidence: ['mixed coin-flip gambles'] });
  if (p.overconf !== null) f.push({ kind: 'calibration', title: `Confidence vs. reality`, plain: `On trick questions you were ${Math.round((p.overconf + (p.accuracy || 0)) * 100)}% sure on average and right ${Math.round((p.accuracy || 0) * 100)}% of the time. ${p.overconf > .1 ? 'You feel more sure than you should — slow down on questions that seem obvious.' : p.overconf < -.1 ? 'You doubt yourself more than you need to.' : 'Your gut confidence is pretty honest.'} (Brier score ${p.brier}; 0 is perfect, 0.25 is coin-flip guessing.)`, evidence: ['calibration items'] });
  if (p.meanDraws !== null) f.push({ kind: 'jtc', title: `Evidence before deciding: ${p.meanDraws} clues`, plain: `On the hidden-jar test you looked at ${p.meanDraws} clues on average before deciding. ${p.meanDraws <= 2 ? 'That\'s jumping to a conclusion — most careful people look at 4 or more.' : p.meanDraws >= 6 ? 'You want a lot of proof before you commit.' : 'That\'s a normal amount of checking.'}`, evidence: ['jar draws'] });
  for (const b of p.blindSpots) f.push({ kind: 'blindspot', title: `Blind spot: ${AXIS_NAME[b.axis]}`, plain: `You say ${b.claimed > 0 ? 'this is true of you' : 'this is NOT you'} (${b.claimed > 0 ? '+' : ''}${b.claimed}), but your actual choices land at ${b.revealed > 0 ? '+' : ''}${b.revealed}. ${b.claimed > b.revealed ? 'You see more of it in yourself than you actually do.' : 'You do it more than you think you do.'} Caught from: ${b.items.join(', ')}.`, evidence: b.items });
  const trigs = TRIGGERS.map(t => [t, p.triggers[t]] as const).filter(([, v]) => v >= .6).sort((a, b) => b[1] - a[1]);
  for (const [t, v] of trigs) f.push({ kind: 'trigger', title: `Trigger: ${TRIG_NAME[t]}`, plain: `Questions about ${TRIG_NAME[t].toLowerCase()} hit you harder than others (intensity ${v}). You reacted stronger, took longer, or changed your answer on them. In real life, this is the kind of thing that can make you act before you think.`, evidence: [] });
  if (p.text) { const t = p.text; const bits: string[] = []; if (t.counts.absolute > t.counts.hedge) bits.push(`you write in absolutes ("${t.hits.absolute.slice(0, 3).join('", "')}") more than maybes`); if (t.counts.hedge > t.counts.absolute) bits.push(`you hedge a lot ("${t.hits.hedge.slice(0, 3).join('", "')}")`); if (t.counts.passive) bits.push(`you describe things as happening TO you ("${t.hits.passive.join('", "')}")`); if (t.counts.agency) bits.push(`you describe yourself as the one acting ("${t.hits.agency.join('", "')}")`); if (t.counts.anger + t.counts.betrayal) bits.push(`anger/betrayal words show up (${[...t.hits.anger, ...t.hits.betrayal].join(', ')})`); if (t.counts.causal) bits.push(`you explain why things happen ("${t.hits.causal.join('", "')}")`); bits.push(`${Math.round(t.selfRatio * 100)}% of your people-words are about you vs. others`);
    f.push({ kind: 'text', title: 'How you write', plain: `In your own words: ${bits.join('; ')}. Average sentence length ${t.avgSentence} words over ${t.words} words total.`, evidence: Object.entries(t.counts).map(([k, v]) => `${k}=${v}`) }); }
  // Emergent pattern / micro-habit detector: compound rules
  const A = p.axes; const em = (title: string, plain: string) => f.push({ kind: 'emergent', title, plain, evidence: [] });
  if ((A.risk ?? 0) > .3 && (p.lambda ?? 0) > 2) em('Brave with gains, scared of losses', 'You\'ll chase a big win, but a real loss on the table makes you freeze. That combo means you take big shots, then hold on too long when they go bad.');
  if ((A.impulse ?? 0) > .3 && (p.overconf ?? 0) > .1) em('Fast and too sure', 'You answer fast AND feel more sure than your results back up. That\'s the classic setup for confident mistakes.');
  if ((A.trust ?? 0) < -.3 && p.triggers.betrayal >= .6) em('Burned-once guard', 'You hold trust back and betrayal hits hard. That looks like a guard built from getting burned — it protects you but can keep good people out.');
  if ((A.zerosum ?? 0) > .3 && (A.external ?? 0) > .3) em('"They\'re taking from me" loop', 'You see life as win-or-lose and blame outside forces. Together that can feed a loop where everyone looks like competition.');
  if ((A.candor ?? 0) > .3 && p.switchRate > .5) em('Raw, then second-guessing', 'You go for the honest answer, then change it. You know what you think — you just check if it\'s safe to say.');
  if (p.switchRate > .7) em('Answer-switching habit', `You changed answers on about ${p.switchRate} per question. You second-guess yourself a lot — your first gut answer was often different.`);
  const skips: Record<string, number> = {}; st.responses.filter(r => r.skipped).forEach(r => { const it = getItem(r.id, st); if (it) skips[it.topic] = (skips[it.topic] || 0) + 1; });
  for (const [topic, c] of Object.entries(skips)) if (c >= 2) em(`Skips "${topic}" questions`, `You pushed Generate to skip ${c} questions about ${topic}. That can mean it doesn't apply to you — or that it's a spot you don't want to look at.`);
  if ((A.control ?? 0) > .3 && p.triggers.control >= .6) em('Control is a pressure point', 'You need control and losing it is a trigger. When plans get taken from you, expect a strong reaction.');
  if ((A.principle ?? 0) > .3 && (A.zerosum ?? 0) > .3) em('Rules for me, war for them', 'You hold strong rules but see others as competition. You may judge others hard while feeling justified in fighting dirty when wronged.');
  if (fit) f.push({ kind: 'stage0', title: 'Your warm-up baseline', plain: `Your warm-up score was ${fit.score}/100. Questions are tuned ${fit.readingLevel === 'plain' ? 'short and direct' : 'detailed'}, ${fit.framingStyle === 'concrete' ? 'with real-life examples' : 'with big-picture framing'}, at level ${fit.complexityTier} of 3. This only changes the wording — not what's being measured.`, evidence: [] });
  return f;
}
export function report(p: Profile, fit: Fit | null): string {
  const L = [`THOUGHT MAPPER — PLAIN-TEXT BREAKDOWN`, `Answered: ${p.answered} · Skipped: ${p.skipped} · Signal: ${Math.round(p.sufficiency * 100)}% · Tuning: ${fitLabel(fit)}`, ''];
  L.push('SCORES (−1 to +1):'); for (const a of AXES) if (p.axes[a] !== null) L.push(`- ${AXIS_NAME[a]}: ${p.axes[a]} (${p.axisN[a]} answers)`);
  L.push(`- Loss weight λ: ${p.lambda ?? 'n/a'} · Brier: ${p.brier ?? 'n/a'} · Overconfidence: ${p.overconf ?? 'n/a'} · Avg clues before deciding: ${p.meanDraws ?? 'n/a'}`);
  L.push('', 'TRIGGERS:'); for (const t of TRIGGERS) L.push(`- ${TRIG_NAME[t]}: ${p.triggers[t]}`);
  L.push('', 'WHAT IT MEANS:'); for (const x of p.findings) L.push(`* ${x.title}`, `  ${x.plain}`);
  return L.join('\n');
}
export function stage0Export(rs: S0Resp[], fit: Fit): string {
  const L = ['THOUGHT MAPPER — STAGE 0 INTELLIGENCE/FIT EXPORT'];
  for (const r of rs) { const q = STAGE0.find(x => x.id === r.id)!; L.push(`${q.id} [${q.kind}] ${q.text}`, `  answer: ${q.options[r.choice]} · ${r.ms}ms · ${q.answer === undefined ? 'style pick' : r.choice === q.answer ? 'CORRECT' : 'wrong (right: ' + q.options[q.answer] + ')'}`); }
  L.push(`FIT: score=${fit.score} readingLevel=${fit.readingLevel} framingStyle=${fit.framingStyle} complexityTier=${fit.complexityTier}`); return L.join('\n');
}
// Custom pack import: JSON array of Items (format/options/w etc.)
export function importPack(st: State, json: string): State { const arr = JSON.parse(json); const items: Item[] = (Array.isArray(arr) ? arr : arr.items).map((x: Item, i: number) => ({ ...x, id: x.id || 'cust-' + hash(JSON.stringify(x) + i), custom: true })); const ids = new Set(st.custom.map(c => c.id)); return { ...st, custom: [...st.custom, ...items.filter(i => !ids.has(i.id))] }; }
