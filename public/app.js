(function () {
'use strict';

/* ---------- helpers ---------- */
const C = window.CONTENT || { lib: { nudge: [], optimai: [] }, ideas: [], meta: {}, scripts: [] };
const G = window.GUIDE || { detail: {}, gloss: [], roadmap: {}, d90: [] };
const KEY = 'infinity_outreach_v2', OLDKEY = 'optimai_desk_v1';
const $ = s => document.querySelector(s);
const iso = (d = new Date()) => new Date(d.getTime() - d.getTimezoneOffset() * 6e4).toISOString().slice(0, 10);
const parse = s => new Date(s + 'T12:00:00');
const addD = (s, n) => { const d = parse(s); d.setDate(d.getDate() + n); return iso(d); };
const today = () => iso();
const dow = s => parse(s).getDay();
const mondayOf = s => addD(s, -((dow(s) + 6) % 7));
const dnum = s => Math.floor(parse(s).getTime() / 864e5);
const fmt = (s, o) => parse(s).toLocaleDateString('en-AU', o || { weekday: 'short', day: 'numeric', month: 'short' });
const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const uid = () => Math.random().toString(36).slice(2, 9) + Date.now().toString(36).slice(-4);
const isWeekend = s => [0, 6].includes(dow(s));
const nextWorking = s => { let d = addD(s, 1); while (isWeekend(d)) d = addD(d, 1); return d; };
const prevWorking = s => { let d = addD(s, -1); while (isWeekend(d)) d = addD(d, -1); return d; };

/* ---------- reference data ---------- */
const CT = { res: 'Researched', req: 'LinkedIn requests', email: 'Emails', sent: 'Outreach sent', reply: 'Replies', call: 'Calls booked', fu: 'Follow-ups', partner: 'Partner touches', post: 'Posts', hrs: 'Hours logged' };
const XPC = { res: 2, req: 2, email: 3, sent: 3, reply: 5, call: 20, fu: 3, partner: 5, post: 8, hrs: 1 };
const STAGES = ['Discovered', 'Contacted', 'Replied', 'Call booked', 'Call done', 'Audit delivered', 'Proposal sent', 'Won', 'Lost'];
const ORD = STAGES.slice(0, 8);
const SXP = { Discovered: 3, Contacted: 5, Replied: 10, 'Call booked': 30, 'Call done': 55, 'Audit delivered': 85, 'Proposal sent': 125, Won: 225, Lost: 8 };
const CHANNELS = ['LinkedIn', 'Email', 'Phone', 'Referral', 'Event'];
const BASIS = ['n/a (LinkedIn or phone)', 'Role address published', 'Existing relationship', 'Express consent'];
const RANKS = ['Rookie', 'Spark', 'Hustler', 'Closer', 'Rainmaker', 'Legend', 'Infinite'];
const EXTRA_XP = 15, CORE_XP = 10, COREBONUS = 25, FULLBONUS = 25;

const PB = {
  optimai: {
    name: 'OptimAI', tag: 'Workflow automation', max: 4, gaps: { 1: 4, 2: 6, 3: 11 },
    segs: ['Prof. services / agency', 'Trades', 'Other'],
    core: [
      ['disc', 'Discover', 15, 'Run today’s source below (LinkedIn saved search, Seek job ads, Google Maps for trades). Qualify 5 prospects and record one real signal each.'],
      ['out', 'Outreach', 15, '5 to 8 LinkedIn requests, no pitch. Up to 3 emails to role-published addresses with your name, business address and an unsubscribe line.'],
      ['fu', 'Replies and follow-ups', 10, 'Answer every new reply. Send follow-ups due today (day 4, 10, 21). Maximum 4 touches, then stop.'],
      ['conv', 'Conversations', 10, 'Prep or hold a discovery call, send a post-call summary, or chase an open proposal.'],
      ['part', 'Partners', 5, 'One message, comment or reply to a referral partner or partner prospect.'],
      ['trk', 'Tracker', 5, 'Update every row touched (source, signal, channel, status, reply type, next action). Write tomorrow’s three actions.']],
    extra: [
      ['cont', 'Content', 25, 'Draft or schedule the post, newsletter issue or article due this week. Label hypotheticals.'],
      ['part2', 'Partners (deeper)', 15, 'Send a partnership message, book a coffee, or thank a partner who referred.'],
      ['sales', 'Sales work', 20, 'Deliver a Workflow Audit, write a proposal, or check feasibility. When calls appear, take time from content first.']],
    focus: {
      1: 'Source: LinkedIn saved search, shortlist 20 for the week. Plus: set the week’s targets, check Seek job-ad signals.',
      2: 'Source: Google Maps and phone for trades (from week 3). Plus: email batch, founder post.',
      3: 'Source: Seek job ads and growth announcements. Plus: 3 partner messages, page post.',
      4: 'Source: public requests for help (LinkedIn, communities). Plus: discovery calls, audits, proposals.',
      5: 'Light discovery only. Plus: newsletter or article work, KPI check, weekly review.',
      6: 'Weekend: optional tracker tidy only.', 0: 'Weekend: optional tracker tidy only.'},
    counters: ['res', 'req', 'email', 'reply', 'call', 'fu', 'partner', 'post'],
    targets: [['req', 30], ['email', 12], ['reply', 8], ['call', 2], ['partner', 3], ['post', 5], ['proposal', 1]],
    targetNote: 'Weekly targets are hypotheses from the playbook: 25 to 40 requests, 10 to 15 emails, 6 to 10 conversations, 1 to 3 calls, 3 partner messages, 3 founder + 2 page posts, 0 to 1 proposals. Replace with your own data after 4 weeks.',
    rules: [
      'Don’t pitch in a first message. Lead with one relevant question about a workflow.',
      'Never send the same message on LinkedIn and email within 5 days.',
      'No guessed, scraped or bought addresses. Honour opt-outs within 5 business days.',
      'Never claim a saving you haven’t validated with them. Say “on your figures, X to Y would be worth $Z a year”.',
      'No build proposal until you understand the process and know it’s feasible.'],
    decision: [],
    recurring: [
      ['w1', 'week', 'Founder posts (Mon, Wed, Fri)'], ['w2', 'week', 'Page posts (Tue, Thu)'], ['w3', 'week', 'Weekly review (Friday)'],
      ['f1', 'fortnight', 'One newsletter issue'], ['f2', 'fortnight', 'One website article'], ['f3', 'fortnight', 'Repurpose both into LinkedIn posts'],
      ['m1', 'month', 'Review pricing against real delivery hours'], ['m2', 'month', 'Retire the weakest channel'], ['m3', 'month', 'Update case studies and proof'], ['m4', 'month', 'Check Spam Act compliance and your consent records']],
    launch: [
      ['Week 1', [['a1', 'Competitor research (15 providers)'], ['a2', 'Tracker set up'], ['a3', 'LinkedIn profile updated'], ['a4', 'Website fixes']]],
      ['Week 3', [['b1', 'Test trades with 20 contacts']]],
      ['Week 4', [['c1', 'Set days 31 to 60 goals']]]],
    review: ['What did I complete?', 'Which channel gave useful conversations?', 'Which problem got the most interest?', 'Which objection repeated?', 'What changes in the offer?', 'Stop, start, continue?', 'Next week’s three priorities?']

  },
  nudge: {
    name: 'Nudge Digital', tag: 'Founder and agency outreach', max: 3, gaps: { 1: 4, 2: 6 },
    segs: ['Founder (funding, launch, hiring)', 'Agency partner', 'Program manager', 'Other'],
    core: [
      ['res', 'Research and qualify', 10, 'Work today’s source from the weekly rhythm. Log a source link, the trigger and one observable gap for each prospect, then score it out of 100. Stop researching any one prospect after 10 minutes.'],
      ['out', 'Outreach', 15, 'Send up to 5 personalised messages to prospects scoring 75+, each citing one specific verified observation. Email only to addresses published for that role, with your name, business, ABN and an unsubscribe line.'],
      ['deals', 'Active deals and follow-ups', 15, 'Inbound enquiries and open opportunities first. Then follow-ups due today (day 4, day 10, then stop). Same-day recap after every call, quote within 2 working days. Reply to every message within 24 hours.'],
      ['rel', 'Content or relationships', 10, 'Comment on 3 posts from founders, agency owners or program managers on your list (a specific insight, not praise), or send one message to a partner or referrer.'],
      ['crm', 'CRM', 10, 'Update every record touched (source link, score, consent basis, channel, status, next action and due date). Write tomorrow’s three priorities.']],
    extra: [
      ['xr', 'Research and qualify (+15)', 15, 'Source from the funding scan, job posts, HubSpot directory or agency sites.'],
      ['xo', 'Outreach (+10)', 10, 'A fuller batch of personalised sends, still only to prospects that clear the score and consent checks.'],
      ['xf', 'Follow-ups and active deals (+5)', 5, 'Proposals due, quotes, call prep and discovery calls. When calls appear, take time from content first.'],
      ['xc', 'Content', 25, 'Draft or schedule the post, article or newsletter edition due this week. Label hypotheticals.'],
      ['xl', 'Relationships', 15, 'Send a partner approach, book an intro call, send a pilot proposal, or thank a referrer. Content and relationships replace the 10-minute slot in the core.']],
    focus: {
      1: 'Pipeline review and research. Source: funding news (Startup Daily, SmartCompany, Capital Brief), job posts for first marketer hires. Review the pipeline, pick the 5 highest-scoring prospects for the week, 10-minute funding scan.',
      2: 'New outreach and sales conversations. Source: founder triggers (funding, launch, hiring). Founder outreach batch, discovery calls with same-day recaps, quotes due.',
      3: 'Agency partnerships, referrals, founder relationships. Source: HubSpot directory, agency sites (PR, creative, web, dev). Score agencies, 3 partner approaches, follow up partner conversations, check Innovation Victoria programs.',
      4: 'Content creation and distribution. Light research only. Write and schedule posts, article or newsletter edition, company page post reshared by you.',
      5: 'Follow-ups, CRM hygiene, scorecard, next-week plan. Light research only. Fill the scorecard, run the Friday review, set next week’s three priorities.',
      6: 'Weekend: optional tracker tidy only.', 0: 'Weekend: optional tracker tidy only.'},
    counters: ['res', 'sent', 'fu', 'reply', 'call', 'partner', 'post', 'hrs'],
    targets: [['res', 15], ['sent', 15], ['partner', 3], ['call', 1], ['post', 3], ['proposal', 1]],
    targetNote: 'Weekly targets are hypotheses from the playbook: about 15 researched and scored, about 15 qualified outreach, 3 partner conversations from week 2, about 1 discovery call, 2 to 3 founder posts plus 1 company page post. Replace with your own data at day 30 and 60.',
    rules: [
      'Score first. 75+ approach this week, 55 to 74 nurture, under 55 drop.',
      'No purchased, scraped or guessed addresses. No LinkedIn automation tools. Record the source link and consent basis for every contact.',
      'Every email carries your name, business, ABN and a working unsubscribe. Honour opt-outs within 5 working days.',
      'Standard sequence: first message, follow-up day 4, follow-up day 10, then stop. Check the Section 12 table for the exceptions (launch triggers, workshops, dormant leads).',
      'Only note what you can observe from outside. Never claim a prospect “needs” you unless a source supports it.',
      'Never name a client or quote a result without permission. Never promise rankings or AI search mentions.',
      'Three priorities a day, maximum. Don’t carry unfinished work forward unless it’s a follow-up. No new channel without dropping one.',
      'Priority order when time is short: 1 active deals and inbound, 2 due follow-ups, 3 new qualified outreach, 4 partner and referral work, 5 content, 6 systems and research.'],
    decision: [
      'A channel with 2 or more calls after 40 touches: double it.',
      'None after 40 well-targeted touches: change the message once, then stop.',
      'If calls aren’t happening by day 30, the message or segment is wrong, not the volume.',
      'No Substack, paid ads or events until two proposals a month are being won.'],
    recurring: [
      ['w1', 'week', '2 to 3 founder posts and 1 company page post'], ['w2', 'week', '10-minute funding scan'], ['w3', 'week', 'Friday scorecard and review'],
      ['f1', 'fortnight', 'One website article'], ['f2', 'fortnight', 'One newsletter edition (from week 4, opted-in subscribers only)'], ['f3', 'fortnight', 'Repurpose both into LinkedIn posts'],
      ['m1', 'month', 'Month review and ICP decision'], ['m2', 'month', 'Spam Act and consent-records check'], ['m3', 'month', 'Check offer prices against logged delivery hours'], ['m4', 'month', 'Rewrite any message with under 3% call rate'],
      ['q1', 'quarter', '60-minute competitor review: homepage, services, pricing, latest three posts. Update positioning and prices.']],
    launch: [
      ['Prep (Thu 29 and Fri 30 Oct)', [['p1', 'Screenshot LinkedIn company and founder pages'], ['p2', 'Pick two target segments and write each in one sentence'], ['p3', 'Set up the tracker'], ['p4', 'Subscribe to the Innovation Victoria newsletter']]],
      ['Week 1', [['a1', 'Tracker live'], ['a2', '12 prospects verified and scored'], ['a3', 'Headline and About updated'], ['a4', 'Posts 1 and 2'], ['a5', 'First 5 messages sent'], ['a6', 'Ask two clients about a named case study']]],
      ['Week 2', [['b1', 'Follow-ups due'], ['b2', '3 partner approaches'], ['b3', 'Partner page drafted'], ['b4', 'Article 1 finalised']]],
      ['Week 3', [['c1', 'First discovery calls'], ['c2', 'Article 1 live'], ['c3', 'Newsletter signup form with consent wording']]],
      ['Week 4', [['d1', 'Month-1 review'], ['d2', 'About 3 calls held'], ['d3', '1 proposal sent'], ['d4', 'Newsletter Edition 1'], ['d5', 'Set days 31 to 60 priorities']]]],
    review: ['What did I finish?', 'What did I miss and why?', 'What produced replies or calls?', 'What didn’t work?', 'What do I continue, stop or change?', 'What are next week’s three priorities?']

  }
};
const PBS = Object.keys(PB);

const BADGES = [
  ['first', '✨', 'First Spark', 'Add your first prospect', s => s.prospects >= 1],
  ['ten', '🧭', 'Pipeline Builder', '10 prospects tracked', s => s.prospects >= 10],
  ['fifty', '🏗️', 'Pipeline Machine', '50 prospects tracked', s => s.prospects >= 50],
  ['core', '✅', 'Core Complete', 'Finish a full core 60', s => s.coreDays >= 1],
  ['full', '💪', 'Full Day', 'Core plus every extra in one day', s => s.fullDays >= 1],
  ['s3', '🔥', 'On a Roll', '3-day streak', s => s.best >= 3],
  ['s5', '🗓️', 'Perfect Week', '5-day streak', s => s.best >= 5],
  ['s10', '⚡', 'Ten Straight', '10-day streak', s => s.best >= 10],
  ['s20', '🚀', 'Unstoppable', '20-day streak', s => s.best >= 20],
  ['reply', '💬', 'First Reply', 'Someone replied', s => s.reachedReply >= 1],
  ['call', '📞', 'Call Booked', 'Book a call', s => s.tot.call >= 1 || s.reachedCall >= 1],
  ['prop', '📄', 'Proposal Out', 'Send a proposal', s => s.reachedProp >= 1],
  ['win', '🏆', 'First Win', 'Win a client', s => s.won >= 1],
  ['win3', '🥇', 'Hat-trick', 'Win 3 clients', s => s.won >= 3],
  ['o100', '💯', 'Century', '100 outreach messages', s => s.outreach >= 100],
  ['o500', '🌊', 'Outreach Legend', '500 outreach messages', s => s.outreach >= 500],
  ['partner', '🤝', 'Partner Up', 'Add a partner', s => s.partners >= 1],
  ['partner5', '🕸️', 'Connector', '5 partners', s => s.partners >= 5],
  ['refer', '🎁', 'Referral Received', 'Receive a referral', s => s.referrals >= 1],
  ['post10', '📣', 'Voice', 'Publish 10 posts', s => s.tot.post >= 10],
  ['review', '🪞', 'Reflective', 'Complete a weekly review', s => s.reviews >= 1],
  ['launch', '🛫', 'Launched', 'Tick 5 launch items', s => s.launch >= 5],
  ['goal', '🎯', 'Goal Getter', 'Complete a goal', s => s.goalsDone >= 1],
  ['pub', '📝', 'In Print', 'Publish a content idea', s => s.published >= 1],
  ['voice', '✏️', 'Your Voice', 'Edit a playbook script', s => s.scriptEdits >= 1],
  ['lv5', '☔', 'Rainmaker', 'Reach level 5', s => s.lv >= 5]
];

const METRICS = Object.assign({ outreach: 'Outreach (all channels)' }, CT, { prospects: 'Prospects added', proposal: 'Proposals sent', won: 'Wins' });
const METRIC_HELP = {
  outreach: 'Counts every LinkedIn request, email and outreach message you log, from any channel.',
  res: 'Counts automatically each time you add a prospect on the Pipeline tab, plus anything you add with + on the Today scorecard. Use it for prospects researched and qualified.',
  req: 'LinkedIn connection requests. Counts when you add a LinkedIn prospect at a stage past Discovered, press Log touch on a first message, or use + on the scorecard.',
  email: 'Emails sent. Counts when you add an email prospect past Discovered, press Log touch on a first message, or use + on the scorecard.',
  sent: 'Personalised outreach messages sent (Nudge). Counts on LinkedIn and email first touches, or with + on the scorecard.',
  reply: 'Replies received. Press They replied on a prospect, or use + on the scorecard.',
  call: 'Calls booked. Use + on the scorecard when a call is booked.',
  fu: 'Follow-ups sent. Counts each time you press Log touch after the first message.',
  partner: 'Partner touches. Counts when you press Contacted today on the Partners tab.',
  post: 'Posts published. Counts when you set a post idea to Published on the Content tab, or use + on the scorecard.',
  hrs: 'Hours logged, entered with + on the scorecard.',
  prospects: 'Prospects you have added to the Pipeline.',
  proposal: 'Prospects that reached the Proposal sent stage.',
  won: 'Prospects that reached the Won stage.'
};

/* ---------- state ---------- */
const defaultGoals = () => [
  { id: uid(), title: 'Land the first client', metric: 'won', target: 1, period: 'all' },
  { id: uid(), title: 'Book 5 discovery calls', metric: 'call', target: 5, period: 'all' }];

function norm(o) {
  o = o || {};
  const s = Object.assign({ prospects: [], partners: [], days: {}, reviews: {}, tasks: [], plan: {}, planSeeded: {}, rec: {}, launch: {}, scripts: [], scriptEdits: {}, ideaState: {}, ideasUser: [], badges: {}, carried: {}, meta: {}, updatedAt: 0 }, o);
  s.settings = Object.assign({ pb: 'optimai', launchMon: '2026-11-02' }, s.settings || {});
  s.settings.start = Object.assign({ optimai: s.settings.launchMon, nudge: s.settings.launchMon }, s.settings.start || {});
  if (!s.d90 || typeof s.d90 !== 'object' || Array.isArray(s.d90)) s.d90 = {};
  if (!PB[s.settings.pb]) s.settings.pb = 'optimai';
  if (!Array.isArray(s.goals)) s.goals = defaultGoals();
  ['prospects', 'partners', 'tasks', 'scripts', 'ideasUser'].forEach(k => { if (!Array.isArray(s[k])) s[k] = []; });
  s.prospects.forEach(p => {
    p.id = p.id || uid(); p.pb = PB[p.pb] ? p.pb : 'optimai'; p.touches = p.touches || 0;
    if (p.score === undefined) p.score = '';
    if (!Array.isArray(p.hist) || !p.hist.length) p.hist = [{ stage: p.stage || 'Discovered', date: '' }];
    p.created = p.created || '';
    p.email = p.email || ''; p.phone = p.phone || ''; p.li = p.li || '';
  });
  s.partners.forEach(p => { p.id = p.id || uid(); });
  s.tasks.forEach(t => { t.id = t.id || uid(); if (t.note === undefined) t.note = ''; if (!t.created) t.created = t.due || ''; });
  Object.keys(s.days).forEach(dt => {
    const d = s.days[dt] || (s.days[dt] = {});
    d.n = d.n || {}; const c = {};
    Object.keys(d.c || {}).forEach(k => { c[k.includes(':') ? k : 'optimai:' + k] = d.c[k]; });
    d.c = c; delete d.next;
  });
  Object.keys(s.reviews).forEach(w => { const r = s.reviews[w]; if (r && !PBS.some(p => r[p])) s.reviews[w] = { optimai: r }; });
  return s;
}

let S;
(function init() {
  try { const r = localStorage.getItem(KEY); if (r) { S = norm(JSON.parse(r)); return; } } catch (e) {}
  try { const o = localStorage.getItem(OLDKEY); if (o) { S = norm(JSON.parse(o)); return; } } catch (e) {}
  S = norm({});
})();

const ui = { date: '', term: '', gq: '', tab: 'dash', q: '', sf: '', pbf: 'cur', revWk: '', libPb: '', libQ: '', libSec: '', libView: 'plan', ctab: 'ideas', ik: '', is: '', iw: false, iq: '', ipb: 'cur', sg: '', sq: '', spf: 'cur', ask: '', edit: null, fill: null, fillVals: {}, focus: null, menu: false, pal: { open: false, q: '', sel: 0, res: [] } };
let dirty = false, pushTimer = null;

function setStatus(t) { const e = $('#sync'); if (e) e.textContent = t; }
function save() {
  S.updatedAt = Date.now();
  try { localStorage.setItem(KEY, JSON.stringify(S)); } catch (e) {}
  dirty = true; setStatus('Saving…');
  clearTimeout(pushTimer); pushTimer = setTimeout(push, 700);
}
async function push() {
  try {
    const r = await fetch('/api/state', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(S) });
    if (!r.ok) throw new Error(r.status);
    dirty = false; setStatus('Saved ' + new Date().toLocaleTimeString('en-AU', { hour: 'numeric', minute: '2-digit' }));
  } catch (e) { setStatus('Offline: saved on this device'); }
}
async function pull(first) {
  try {
    const r = await fetch('/api/state', { cache: 'no-store' });
    if (!r.ok) throw new Error(r.status);
    const o = await r.json();
    if (o && Array.isArray(o.prospects)) {
      if ((o.updatedAt || 0) > (S.updatedAt || 0) && !dirty) {
        S = norm(o); try { localStorage.setItem(KEY, JSON.stringify(S)); } catch (e) {}
        evalBadges(true); render(); setStatus('Synced');
      } else if ((S.updatedAt || 0) > (o.updatedAt || 0)) { dirty = true; push(); }
      else setStatus('Saved');
    } else if (first) { S.updatedAt = S.updatedAt || Date.now(); dirty = true; push(); }
  } catch (e) { setStatus('Offline: saved on this device'); }
}

/* ---------- derived data ---------- */
const day = d => S.days[d] || (S.days[d] = { c: {}, n: {} });
const ck = (pb, k) => pb + ':' + k;
function coreMins(date, pb) { const d = S.days[date]; return d ? PB[pb].core.reduce((a, c) => a + (d.c[ck(pb, c[0])] ? c[2] : 0), 0) : 0; }
function coreDone(date, pb) { const d = S.days[date]; return !!d && PB[pb].core.every(c => d.c[ck(pb, c[0])]); }
function fullDone(date, pb) { const d = S.days[date]; return coreDone(date, pb) && PB[pb].extra.every(c => d.c[ck(pb, c[0])]); }
const dayComplete = date => PBS.some(pb => coreDone(date, pb));

function dayXP(date) {
  const d = S.days[date]; let x = 0;
  if (d) {
    PBS.forEach(pb => {
      PB[pb].core.forEach(c => { if (d.c[ck(pb, c[0])]) x += CORE_XP; });
      PB[pb].extra.forEach(c => { if (d.c[ck(pb, c[0])]) x += EXTRA_XP; });
      if (coreDone(date, pb)) x += COREBONUS;
      if (fullDone(date, pb)) x += FULLBONUS;
    });
    Object.keys(d.n).forEach(k => { x += (XPC[k] || 0) * d.n[k]; });
  }
  x += S.tasks.filter(t => t.done && t.doneOn === date).length * 5;
  return x;
}
const maxIdx = p => Math.max(-1, ...p.hist.map(h => ORD.indexOf(h.stage)), ORD.indexOf(p.stage));
const reached = (p, stage) => maxIdx(p) >= ORD.indexOf(stage);
function reviewDone(wk, pb) { const r = (S.reviews[wk] || {})[pb] || {}; return Object.keys(r).filter(k => String(r[k]).trim()).length >= 4; }
function calcXP() {
  const dates = new Set(Object.keys(S.days)); S.tasks.forEach(t => { if (t.doneOn) dates.add(t.doneOn); });
  let x = 0; dates.forEach(d => { x += dayXP(d); });
  S.prospects.forEach(p => { const i = maxIdx(p); x += Math.max(i >= 0 ? SXP[ORD[i]] : 0, p.stage === 'Lost' ? SXP.Lost : 0); });
  x += Object.values(S.rec).filter(Boolean).length * 10;
  x += Object.values(S.launch).filter(Boolean).length * 10;
  Object.keys(S.reviews).forEach(wk => PBS.forEach(pb => { if (reviewDone(wk, pb)) x += 20; }));
  S.partners.forEach(p => { x += 5 + (p.rec || 0) * 10; });
  Object.keys(S.ideaState).forEach(id => { const st = S.ideaState[id]; if (st.status === 'Published') { const k = (id.startsWith('n-art') || id.startsWith('o-art')) ? 15 : (id.includes('news') ? 12 : 0); x += k; } });
  x += Object.keys(S.scriptEdits).length * 5;
  return x;
}
const levelOf = xp => { const lv = Math.floor(Math.sqrt(xp / 100)) + 1; return { lv, cur: 100 * (lv - 1) ** 2, next: 100 * lv * lv, name: RANKS[Math.min(lv, RANKS.length) - 1] }; };

function sumRange(from, to) {
  const o = {}; Object.keys(S.days).forEach(dt => { if (dt >= from && dt <= to) { const n = S.days[dt].n; for (const k in n) o[k] = (o[k] || 0) + n[k]; } });
  return o;
}
function streaks() {
  const t = today(); let cur = 0, d = t;
  if (!dayComplete(t)) d = addD(t, -1);
  for (let i = 0; i < 400; i++) { if (dayComplete(d)) cur++; else if (!isWeekend(d)) break; d = addD(d, -1); }
  const keys = Object.keys(S.days).sort(); let best = 0, run = 0;
  if (keys.length) for (let d2 = keys[0]; d2 <= t; d2 = addD(d2, 1)) {
    if (dayComplete(d2)) { run++; best = Math.max(best, run); } else if (isWeekend(d2) || d2 === t) continue; else run = 0;
  }
  return { cur, best: Math.max(best, cur) };
}
function range(period) {
  const t = today();
  if (period === 'week') { const m = mondayOf(t); return [m, addD(m, 6)]; }
  if (period === 'month') return [t.slice(0, 8) + '01', t.slice(0, 8) + '31'];
  return ['0000-00-00', '9999-99-99'];
}
function metricVal(metric, period) {
  const [a, b] = range(period);
  if (metric === 'outreach') return outreachOf(sumRange(a, b));
  if (metric === 'prospects') return S.prospects.filter(p => p.created >= a && p.created <= b && p.created).length + (period === 'all' ? S.prospects.filter(p => !p.created).length : 0);
  if (metric === 'proposal' || metric === 'won') {
    const st = metric === 'won' ? 'Won' : 'Proposal sent';
    if (period === 'all') return S.prospects.filter(p => reached(p, st)).length;
    return S.prospects.filter(p => p.hist.some(h => h.stage === st && h.date >= a && h.date <= b && h.date)).length;
  }
  return sumRange(a, b)[metric] || 0;
}
function stats() {
  const xp = calcXP(), L = levelOf(xp), sk = streaks(), tot = sumRange('0000', '9999');
  let coreDays = 0, fullDays = 0;
  Object.keys(S.days).forEach(dt => PBS.forEach(pb => { if (coreDone(dt, pb)) coreDays++; if (fullDone(dt, pb)) fullDays++; }));
  const wk = Object.keys(S.reviews).reduce((a, w) => a + PBS.filter(pb => reviewDone(w, pb)).length, 0);
  const goalsDone = S.goals.filter(g => metricVal(g.metric, g.period) >= g.target).length;
  return {
    xp, lv: L.lv, L, streak: sk.cur, best: sk.best, tot, coreDays, fullDays,
    prospects: S.prospects.length, reachedReply: S.prospects.filter(p => reached(p, 'Replied')).length,
    reachedCall: S.prospects.filter(p => reached(p, 'Call booked')).length, reachedProp: S.prospects.filter(p => reached(p, 'Proposal sent')).length,
    won: S.prospects.filter(p => reached(p, 'Won')).length, outreach: (tot.req || 0) + (tot.email || 0) + (tot.sent || 0),
    partners: S.partners.length, referrals: S.partners.reduce((a, p) => a + (p.rec || 0), 0), reviews: wk,
    launch: Object.values(S.launch).filter(Boolean).length, goalsDone, published: Object.values(S.ideaState).filter(x => x.status === 'Published').length, scriptEdits: Object.keys(S.scriptEdits).length
  };
}

/* ---------- feedback ---------- */
function toast(t) { const e = document.createElement('div'); e.className = 'toast'; e.textContent = t; $('#toasts').appendChild(e); setTimeout(() => e.remove(), 3300); }
function confetti() {
  if (window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  const c = document.createElement('div'); c.className = 'confetti'; const cols = ['#7c3aed', '#c026d3', '#f59e0b', '#10b981', '#0ea5e9', '#ef4444'];
  for (let i = 0; i < 48; i++) { const s = document.createElement('i'); s.style.cssText = `left:${Math.random() * 100}%;background:${cols[i % 6]};animation-delay:${Math.random() * .4}s;animation-duration:${1.4 + Math.random() * 1.2}s;transform:rotate(${Math.random() * 360}deg)`; c.appendChild(s); }
  document.body.appendChild(c); setTimeout(() => c.remove(), 3200);
}
function evalBadges(silent) {
  const st = stats(); let any = false;
  BADGES.forEach(b => { if (!S.badges[b[0]] && b[4](st)) { S.badges[b[0]] = today(); any = true; if (!silent) { toast('🏅 Badge unlocked: ' + b[2]); confetti(); } } });
  const lv = st.lv;
  if (S.meta.level === undefined) S.meta.level = lv;
  else if (lv > S.meta.level) { S.meta.level = lv; if (!silent) { toast('⬆️ Level ' + lv + ': ' + st.L.name); confetti(); } any = true; }
  else if (lv < S.meta.level) { S.meta.level = lv; any = true; }
  return any;
}
// run a mutation, then save, show XP gained, celebrate, re-render
function act(fn) {
  const t = vdate(), pb = S.settings.pb, bx = calcXP(), bc = coreDone(t, pb);
  const r = fn(); if (r === false) return;
  const ax = calcXP();
  if (ax > bx) toast('+' + (ax - bx) + ' XP');
  if (!bc && coreDone(t, pb)) { toast('🎉 Core 60 complete!'); confetti(); }
  evalBadges(false); save(); render();
}

/* ---------- plan / tasks ---------- */
function seedPlan() {
  const t = today(); let ch = false;
  Object.keys(S.plan).forEach(dt => {
    if (dt <= t && !S.planSeeded[dt]) {
      (S.plan[dt] || []).forEach(x => { if (x && x.trim()) S.tasks.push({ id: uid(), text: x.trim(), due: dt, done: false, doneOn: '', src: 'plan', note: '', created: t }); });
      S.planSeeded[dt] = true; ch = true;
    }
  });
  if (ch) save();
}
const todaysTasks = () => { const t = today(); return S.tasks.filter(x => (!x.done && x.due <= t) || (x.done && x.doneOn === t)).sort((a, b) => (a.done - b.done) || (a.due < b.due ? -1 : 1)); };

/* ---------- views ---------- */
const TABS = [['today', 'Today'], ['pipe', 'Pipeline'], ['partners', 'Partners'], ['scripts', 'Scripts'], ['progress', 'Progress'], ['review', 'Review'], ['book', 'Playbook']];
const bar = (v, t, ok) => `<div class="bar ${ok ? 'ok' : ''}"><i style="width:${Math.min(100, t ? Math.round(v / t * 100) : 0)}%"></i></div>`;
const pbTag = p => PBS.length && `<span class="pill">${esc(PB[p].name)}</span>`;

const vdate = () => ui.date || today();
const relDay = d => { const t = today(); if (d === t) return 'Today'; if (d === addD(t, -1)) return 'Yesterday'; if (d === addD(t, 1)) return 'Tomorrow'; return fmt(d, { weekday: 'long' }); };
function tasksFor(date) {
  const t = today();
  if (date === t) return todaysTasks();
  if (date < t) return S.tasks.filter(x => x.doneOn === date || (!x.done && x.due === date));
  return S.tasks.filter(x => !x.done && x.due === date);
}
const SRC = { manual: 'Added by you', plan: 'Planned as one of the three actions', carry: 'Carried over from a missed core item' };
function detailHTML(pb, key, label) {
  const D = G.detail[pb + ':' + key]; if (!D) return '';
  const links = (D.links || []).map(l => `<button type="button" class="b" data-act="termgo" data-pb="${l[0]}" data-sec="${l[1]}">${esc(PB[l[0]].name.split(' ')[0])} §${l[1]}: ${esc(l[2])}</button>`).join('');
  return `<details class="more"><summary>${label || 'More detail'}</summary><div class="mbody"><p>${gl(D.what)}</p>${D.steps ? `<h5>How to do it</h5><ol>${D.steps.map(x => `<li>${gl(x)}</li>`).join('')}</ol>` : ''}${D.done ? `<p><b>Done when:</b> ${gl(D.done)}</p>` : ''}${(D.tips || []).map(x => `<p class="tip"><b>Tip:</b> ${gl(x)}</p>`).join('')}${D.app ? `<p class="d">In the app: ${esc(D.app)}</p>` : ''}${links ? `<div class="chips">${links}</div>` : ''}</div></details>`;
}
function taskRow(t) {
  const late = !t.done && t.due < today(), core = t.core ? t.core.split(':') : null;
  const det = `<details class="more"><summary>Details</summary><div class="mbody"><div class="kv"><div><span class="d">Due</span><input type="date" data-act="tdue" data-id="${t.id}" value="${t.due}" aria-label="Due date"></div><div><span class="d">Where it came from</span>${esc(SRC[t.src] || SRC.manual)}${t.created ? `<span class="d">Created ${fmt(t.created)}</span>` : ''}</div></div><label class="l" for="tn_${t.id}" style="margin-top:8px">Notes: who, where, what done looks like</label><textarea id="tn_${t.id}" data-act="tnote" data-id="${t.id}" placeholder="Add detail so this task is not vague…">${esc(t.note || '')}</textarea>${core ? detailHTML(core[0], core[1], 'How to do this item') : ''}</div></details>`;
  return `<div class="card task ${t.done ? 'done' : ''} ${late ? 'late' : ''}"><div class="row"><label class="chk grow"><input type="checkbox" data-act="tt" data-id="${t.id}" ${t.done ? 'checked' : ''}><span class="t"><span class="tx">${esc(t.text)}</span>${late ? `<span class="tag">Carried over from ${fmt(t.due)}</span>` : ''}</span></label>${t.done ? '' : `<button class="b x" data-act="snooze" data-id="${t.id}">Tomorrow</button>`}<button class="b x" data-act="deltask" data-id="${t.id}" aria-label="Delete task">✕</button></div>${det}</div>`;
}
function dueList(date) {
  const t = today(), dt = date || t;
  if (dt > t) return S.prospects.filter(p => p.next === dt && !['Won', 'Lost'].includes(p.stage));
  return S.prospects.filter(p => p.next && p.next <= t && !['Won', 'Lost'].includes(p.stage)).sort((a, b) => a.next < b.next ? -1 : 1);
}
function vToday() {
  const rt = today(), t = vdate(), isT = t === rt, fut = t > rt, past = t < rt, pb = S.settings.pb, P = PB[pb], d = S.days[t] || { c: {}, n: {} }, st = stats();
  const mins = coreMins(t, pb), pct = Math.round(mins / 60 * 100), full = P.core.every(c => d.c[ck(pb, c[0])]);
  const nxt = nextWorking(t), plan = S.plan[nxt] || ['', '', ''], pi = planInfo(pb, t);
  const tasks = tasksFor(t), open = tasks.filter(x => !x.done).length;
  const due = isT || fut ? dueList(t) : [];
  const dis = fut ? 'disabled' : '';
  const row = (c, ex) => `<div class="card chkrow ${d.c[ck(pb, c[0])] ? 'done' : ''}"><label class="chk"><input type="checkbox" data-act="chk" data-k="${c[0]}" ${d.c[ck(pb, c[0])] ? 'checked' : ''} ${dis}><span class="t"><b>${c[1]}</b><span class="mins">${ex ? '+' : ''}${c[2]} min</span><span class="d">${gl(c[3])}</span></span></label>${detailHTML(pb, c[0])}</div>`;
  let h = `<div class="datenav"><button class="b" data-act="dnav" data-d="-1" aria-label="Previous day">← ${esc(relDay(addD(t, -1)).slice(0, 9))}</button><div class="dn-mid"><b>${relDay(t)}</b><span class="d">${fmt(t, { weekday: 'long', day: 'numeric', month: 'long' })}</span></div><button class="b" data-act="dnav" data-d="1" aria-label="Next day">${esc(relDay(addD(t, 1)).slice(0, 9))} →</button></div>
 <div class="row" style="margin:6px 0 10px"><label class="l" for="dpick" style="margin:0">Go to date</label><input id="dpick" type="date" data-act="dpick" value="${t}" style="width:auto">${isT ? '' : '<button class="b p" data-act="dtoday">Back to today</button>'}</div>`;
  if (past) h += `<div class="notice">Looking back at ${fmt(t)}. You can still tick things you did that day and the totals will update.</div>`;
  if (fut) h += `<div class="notice">Planning view for ${fmt(t)}. You can see the focus, what is due and set the next three actions. Ticking opens on the day.</div>`;
  h += `<div class="card hero"><div class="ring" style="--p:${pct}"><span>${pct}%</span></div><div class="txt"><b>${fmt(t, { weekday: 'long', day: 'numeric', month: 'long' })}</b><span class="d">${esc(pi.label)}</span><span class="d">${esc(P.focus[dow(t)])}</span><div class="chips"><span class="chip">🔥 ${st.streak}-day streak</span><span class="chip">⭐ ${dayXP(t)} XP ${isT ? 'today' : 'that day'}</span><span class="chip">${full ? '✅ Core done' : mins + ' of 60 min'}</span></div></div></div>`;
  h += `<p class="d" style="margin:-2px 0 10px">“Today” is the date on your device (${esc((Intl.DateTimeFormat().resolvedOptions().timeZone) || 'local time')}). It changes at midnight. Your plan’s Day 1 is set on the <button class="term" data-act="tab" data-k="roadmap">Roadmap</button> page.</p>`;

  const y = prevWorking(t), yd = S.days[y];
  if (isT && yd && !S.carried[y] && !coreDone(y, pb) && (Object.values(yd.c).some(Boolean) || Object.values(yd.n).some(Boolean))) {
    const miss = P.core.filter(c => !yd.c[ck(pb, c[0])]);
    h += `<div class="card row"><div class="grow"><b>Missed on ${fmt(y)}</b><span class="d">${miss.map(c => esc(c[1])).join(', ')}</span></div><button class="b p" data-act="carry" data-y="${y}">Carry over to today</button><button class="b x" data-act="dismisscarry" data-y="${y}">Dismiss</button></div>`;
  }

  h += `<h2>Priorities and carry-overs <small>${open} open</small></h2>`;
  h += tasks.length ? tasks.map(taskRow).join('') : `<div class="card d">Nothing queued for ${isT ? 'today' : fmt(t)}. Add a task below or plan the three actions at the bottom.</div>`;
  h += `<div class="row"><input id="t_text" class="grow" placeholder="Add a task…" aria-label="Task text"><input id="t_due" type="date" value="${t >= rt ? t : rt}" style="width:150px" aria-label="Due date"><button class="b p" data-act="addtask">Add</button></div>`;

  if (!past) {
    h += `<h2>Follow-ups due <small>${due.length}</small></h2>`;
    h += due.length ? due.map(p => `<div class="card due"><div class="row"><div class="grow"><b>${esc(p.name)}</b> ${pbTag(p.pb)}<span class="d">${esc(p.biz)} · ${p.stage} · touch ${p.touches} of ${PB[p.pb].max} · due ${fmt(p.next)}</span>${contactLine(p)}</div>${fut ? '' : `<button class="b p" data-act="touch" data-id="${p.id}">Log touch</button><button class="b" data-act="replied" data-id="${p.id}">They replied</button>`}</div></div>`).join('') : `<div class="card d">Nothing due${fut ? ' on ' + fmt(t) : ''}. Add prospects on the Pipeline tab.</div>`;
  }

  h += `<h2>Core 60 minutes <small>${esc(P.name)}</small></h2>` + bar(mins, 60, full) + `<p class="d" style="margin:-2px 0 8px">Tap “More detail” on any item for the full how-to from the playbook.</p>` + P.core.map(c => row(c, false)).join('');
  h += `<h2>Extra on a 120-minute day</h2>` + P.extra.map(c => row(c, true)).join('');

  h += `<h2>${isT ? 'Today’s' : esc(relDay(t)) + '’s'} scorecard</h2><div class="grid">` + P.counters.map(k => `<div class="card ctr"><div class="d">${CT[k]}</div><div class="n">${d.n[k] || 0}</div><button data-act="ctr" data-k="${k}" data-v="-1" aria-label="Minus ${CT[k]}" ${dis}>−</button><button data-act="ctr" data-k="${k}" data-v="1" aria-label="Plus ${CT[k]}" ${dis}>+</button></div>`).join('') + `</div>`;

  h += `<h2>Three actions for the next working day <small>${fmt(nxt)}</small></h2><p class="sub">These appear in your priorities list on ${fmt(nxt)}. Anything unfinished keeps carrying over until you tick it or move it.</p>`;
  h += [0, 1, 2].map(i => `<input data-act="plan" data-i="${i}" value="${esc(plan[i] || '')}" placeholder="${i + 1}." style="margin-bottom:6px" aria-label="Action ${i + 1}">`).join('');
  h += `<details class="card" style="margin-top:14px"><summary>Rules that never change (${esc(P.name)})</summary><ul>${P.rules.map(r => `<li>${gl(r)}</li>`).join('')}</ul></details>`;
  return h;
}

const scoreInfo = s => s === '' || s == null ? '' : (+s >= 75 ? '<span class="pill ok">Score ' + s + ' · approach</span>' : +s >= 55 ? '<span class="pill warn">Score ' + s + ' · nurture</span>' : '<span class="pill bad">Score ' + s + ' · drop</span>');
function contactLine(p) {
  const bits = [];
  if (p.email) bits.push(`<a href="mailto:${esc(p.email)}">${esc(p.email)}</a>`);
  if (p.phone) bits.push(`<a href="tel:${esc(p.phone.replace(/[^+\d]/g, ''))}">${esc(p.phone)}</a>`);
  if (p.li) bits.push(`<a href="${esc(/^https?:/i.test(p.li) ? p.li : 'https://' + p.li)}" target="_blank" rel="noopener">LinkedIn</a>`);
  return bits.length ? `<span class="contact">${bits.join(' · ')}</span>` : '';
}
function pCard(p) {
  const warn = p.ch === 'Email' && !p.email ? '<span class="pill warn">Add an email address</span>' : (p.email && p.basis.startsWith('n/a') ? '<span class="pill bad">Record the email basis</span>' : '');
  const hasC = p.email || p.phone || p.li;
  return `<div class="card prospect"><div class="phead"><div class="grow"><b>${esc(p.name)}</b> ${pbTag(p.pb)}<span class="d">${esc(p.biz)} · ${esc(p.seg)} · via ${esc(p.ch)}</span>${contactLine(p)}</div>
 <div class="pctl"><select data-act="stage" data-id="${p.id}" aria-label="Stage">${STAGES.map(s => `<option ${s === p.stage ? 'selected' : ''}>${s}</option>`).join('')}</select>
 <input type="date" data-act="due" data-id="${p.id}" value="${p.next || ''}" aria-label="Next follow-up">
 <button class="b" data-act="touch" data-id="${p.id}">Log touch</button><button class="b x" data-act="del" data-id="${p.id}" aria-label="Delete">✕</button></div></div>
 <div class="chips" style="margin:6px 0 2px">${scoreInfo(p.score)}${warn}<span class="pill">Touches ${p.touches}/${PB[p.pb].max}</span></div>
 <span class="d">Source: ${esc(p.src) || '—'} · Signal: ${esc(p.sig) || '—'} · Basis: ${esc(p.basis)}</span>
 <details class="more"><summary>${hasC ? 'Edit contact details' : 'Add contact details'}</summary><div class="mbody"><div class="form">
 <div><label class="l" for="em_${p.id}">Email</label><input id="em_${p.id}" type="email" inputmode="email" autocomplete="off" data-act="pf" data-f="email" data-id="${p.id}" value="${esc(p.email)}" placeholder="name@company.com"></div>
 <div><label class="l" for="ph_${p.id}">Phone</label><input id="ph_${p.id}" type="tel" inputmode="tel" autocomplete="off" data-act="pf" data-f="phone" data-id="${p.id}" value="${esc(p.phone)}" placeholder="0400 000 000"></div>
 <div><label class="l" for="li_${p.id}">LinkedIn URL</label><input id="li_${p.id}" type="url" inputmode="url" autocomplete="off" data-act="pf" data-f="li" data-id="${p.id}" value="${esc(p.li)}" placeholder="linkedin.com/in/…"></div>
 <div><label class="l" for="bs_${p.id}">Email basis (Spam Act)</label><select id="bs_${p.id}" data-act="pbasis" data-id="${p.id}">${BASIS.map(b => `<option ${b === p.basis ? 'selected' : ''}>${esc(b)}</option>`).join('')}</select></div></div>
 <p class="d">Only email an address that is published for the person’s role or that they gave you, and record where you found it in the source field.</p></div></details>
 <textarea data-act="note" data-id="${p.id}" placeholder="Notes: workflow, hours per week, tools, objections" style="margin-top:6px;min-height:44px">${esc(p.note)}</textarea></div>`;
}
function filtered() {
  const pb = S.settings.pb, q = ui.q.toLowerCase();
  return S.prospects.filter(p => (ui.pbf === 'all' || p.pb === pb) && (!ui.sf || p.stage === ui.sf) && (!q || (p.name + ' ' + p.biz + ' ' + p.src + ' ' + p.sig + ' ' + p.note + ' ' + p.email + ' ' + p.phone).toLowerCase().includes(q)));
}
function plist() {
  const l = filtered();
  const cnt = STAGES.map(s => [s, l.filter(p => p.stage === s).length]).filter(x => x[1]);
  return `<div class="row" style="margin-bottom:8px">${cnt.map(([s, n]) => `<span class="pill">${s} ${n}</span>`).join('')}</div>` + (l.length ? l.map(pCard).join('') : '<div class="card d">No prospects match. Qualify five today.</div>');
}
function vPipe() {
  const pb = S.settings.pb, P = PB[pb], n = filtered().length;
  return `<h2>Add a prospect <small>${esc(P.name)}</small></h2><div class="form">
 <div><label class="l">Name</label><input id="f_name"></div><div><label class="l">Business</label><input id="f_biz"></div>
 <div><label class="l" for="f_email">Email</label><input id="f_email" type="email" inputmode="email" autocomplete="off"></div>
 <div><label class="l" for="f_phone">Phone</label><input id="f_phone" type="tel" inputmode="tel" autocomplete="off"></div>
 <div><label class="l" for="f_li">LinkedIn URL</label><input id="f_li" type="url" inputmode="url" autocomplete="off"></div>
 <div><label class="l">Segment</label><select id="f_seg">${P.segs.map(s => `<option>${esc(s)}</option>`).join('')}</select></div>
 <div><label class="l">Source (link or where you found them)</label><input id="f_src"></div>
 <div><label class="l">Observed signal or gap (fact only)</label><input id="f_sig"></div>
 <div><label class="l">Score /100 (75+ approach, 55–74 nurture)</label><input id="f_score" type="number" min="0" max="100" inputmode="numeric"></div>
 <div><label class="l">Channel</label><select id="f_ch">${CHANNELS.map(s => `<option>${s}</option>`).join('')}</select></div>
 <div><label class="l">Email basis (Spam Act)</label><select id="f_basis">${BASIS.map(s => `<option>${s}</option>`).join('')}</select></div>
 <div><label class="l">Stage</label><select id="f_stage">${STAGES.map(s => `<option>${s}</option>`).join('')}</select></div></div>
 <button class="b p" data-act="add">Add prospect</button>
 <h2>Pipeline <small id="pcount">${n}</small></h2>
 <div class="form"><div><label class="l">Search</label><input id="q" value="${esc(ui.q)}" placeholder="Name, business, note…"></div>
 <div><label class="l">Show</label><select data-act="pbf"><option value="cur" ${ui.pbf === 'cur' ? 'selected' : ''}>${esc(P.name)} only</option><option value="all" ${ui.pbf === 'all' ? 'selected' : ''}>Both playbooks</option></select></div>
 <div><label class="l">Stage</label><select data-act="sf"><option value="">All stages</option>${STAGES.map(s => `<option ${ui.sf === s ? 'selected' : ''}>${s}</option>`).join('')}</select></div></div>
 <div id="plist">${plist()}</div>`;
}

function vPartners() {
  let h = `<div class="form"><div><label class="l">Name</label><input id="p_name"></div><div><label class="l">Type</label><input id="p_type" placeholder="Web dev, bookkeeper, IT, agency…"></div><div><label class="l">Next action</label><input id="p_next"></div></div><button class="b p" data-act="addp">Add partner</button><h2>Partners <small>${S.partners.length}</small></h2>`;
  h += S.partners.length ? S.partners.map(p => `<div class="card"><div class="row"><div class="grow"><b>${esc(p.name)}</b> <span class="pill">${esc(p.type) || 'Partner'}</span><span class="d">Last contact: ${p.last ? fmt(p.last) : '—'} · Next: ${esc(p.next) || '—'}</span></div><button class="b p" data-act="ptouch" data-id="${p.id}">Contacted today</button><button class="b x" data-act="delp" data-id="${p.id}" aria-label="Delete">✕</button></div>
 <div class="row" style="margin-top:6px"><span class="d">Referrals sent <b>${p.sent || 0}</b></span><button class="b" data-act="pn" data-f="sent" data-id="${p.id}">+</button><span class="d" style="margin-left:10px">Received <b>${p.rec || 0}</b></span><button class="b" data-act="pn" data-f="rec" data-id="${p.id}">+</button></div>
 <input data-act="pnext" data-id="${p.id}" value="${esc(p.next)}" placeholder="Next action" style="margin-top:6px" aria-label="Next action"></div>`).join('') : '<div class="card d">Shortlist 10 partner types in your first fortnight: web developers, bookkeepers, IT providers, agencies.</div>';
  return h;
}

function weekTargets(pb) {
  return PB[pb].targets.map(([k, t]) => { const v = metricVal(k, 'week'); return `<div class="card"><div class="row"><b class="grow">${METRICS[k]}</b><span>${v} / ${t}</span></div>${bar(v, t, v >= t)}</div>`; }).join('');
}
function vProgress() {
  const st = stats(), pb = S.settings.pb, t = today(), P = PB[pb];
  let h = `<div class="two"><div class="card"><span class="d">Level ${st.lv}</span><div class="big">${st.L.name}</div>${bar(st.xp - st.L.cur, st.L.next - st.L.cur)}<span class="d">${st.xp} XP · ${st.L.next - st.xp} to level ${st.lv + 1}</span></div>
 <div class="card"><span class="d">Streak (weekdays, core 60 done)</span><div class="big">🔥 ${st.streak}</div><span class="d">Best: ${st.best} days · Core days: ${st.coreDays}</span></div></div>`;
  const start = addD(mondayOf(t), -21); let cells = '';
  for (let i = 0; i < 28; i++) {
    const dt = addD(start, i), m = Math.max(...PBS.map(p => coreMins(dt, p))), lv = m >= 60 ? 4 : m >= 40 ? 3 : m >= 20 ? 2 : m > 0 ? 1 : 0;
    cells += `<i class="${lv ? 'l' + lv : ''} ${dt > t ? 'f' : ''} ${dt === t ? 'td' : ''}" title="${fmt(dt)}: ${m} min"></i>`;
  }
  h += `<h2>Last 4 weeks <small>Mon to Sun</small></h2><div class="heat">${cells}</div>`;
  h += `<h2>This week <small>${esc(P.name)} · week of ${fmt(mondayOf(t))}</small></h2>${weekTargets(pb)}<p class="sub">${esc(P.targetNote)}</p>`;
  h += `<h2>Goals</h2>` + (S.goals.length ? S.goals.map(g => { const v = metricVal(g.metric, g.period), ok = v >= g.target; return `<div class="card"><div class="row"><b class="grow">${ok ? '✅ ' : ''}${esc(g.title)}</b><span>${v} / ${g.target}</span><button class="b x" data-act="delgoal" data-id="${g.id}" aria-label="Delete goal">✕</button></div>${bar(v, g.target, ok)}<span class="d">${METRICS[g.metric]} · ${g.period === 'all' ? 'all time' : g.period === 'week' ? 'this week' : 'this month'}</span></div>`; }).join('') : '<div class="card d">No goals yet.</div>');
  h += `<div class="form"><div><label class="l">Goal</label><input id="g_title" placeholder="e.g. 3 proposals this month"></div><div><label class="l">Measure</label><select id="g_metric" data-act="gmetric">${Object.keys(METRICS).map(k => `<option value="${k}">${METRICS[k]}</option>`).join('')}</select></div><div><label class="l">Target</label><input id="g_target" type="number" min="1" value="5"></div><div><label class="l">Period</label><select id="g_period"><option value="week">This week</option><option value="month">This month</option><option value="all">All time</option></select></div></div><p class="d" id="g_hint">${METRIC_HELP.outreach}</p><button class="b p" data-act="addgoal">Add goal</button>`;
  h += `<h2>Badges <small>${Object.keys(S.badges).length} of ${BADGES.length}</small></h2><div class="badges">` + BADGES.map(b => { const on = S.badges[b[0]]; return `<div class="card bdg ${on ? '' : 'off'}" title="${esc(b[3])}"><div class="e">${b[1]}</div><b>${b[2]}</b><span class="d">${on ? 'Earned ' + fmt(on) : esc(b[3])}</span></div>`; }).join('') + `</div>`;
  const w = sumRange(addD(t, -6), t), m = sumRange(addD(t, -29), t), all = st.tot;
  const rate = o => { const s = (o.req || 0) + (o.email || 0) + (o.sent || 0); return s ? Math.round((o.reply || 0) / s * 100) + '%' : '—'; };
  const crate = o => { const s = (o.req || 0) + (o.email || 0) + (o.sent || 0); return s ? (Math.round((o.call || 0) / s * 1000) / 10) + '%' : '—'; };
  h += `<h2>Activity</h2><table><tr><th></th><th>7 days</th><th>30 days</th><th>All</th></tr>` + Object.keys(CT).map(k => `<tr><td>${CT[k]}</td><td>${w[k] || 0}</td><td>${m[k] || 0}</td><td>${all[k] || 0}</td></tr>`).join('') + `<tr><td>Reply rate</td><td>${rate(w)}</td><td>${rate(m)}</td><td>${rate(all)}</td></tr><tr><td>Call rate (calls ÷ outreach)</td><td>${crate(w)}</td><td>${crate(m)}</td><td>${crate(all)}</td></tr></table>`;
  const cnt = s => S.prospects.filter(p => reached(p, s)).length;
  h += `<h2>Funnel (all time)</h2><table><tr><th>Added</th><th>Replied</th><th>Call booked</th><th>Proposal</th><th>Won</th><th>Lost</th></tr><tr><td>${S.prospects.length}</td><td>${cnt('Replied')}</td><td>${cnt('Call booked')}</td><td>${cnt('Proposal sent')}</td><td>${cnt('Won')}</td><td>${S.prospects.filter(p => p.stage === 'Lost').length}</td></tr></table>`;
  if (st.outreach >= 40 && !(all.call || cnt('Call booked'))) h += `<p class="warn">40+ touches and no calls: per the playbook, change the message once, then stop. If calls aren’t happening by day 30, the message or segment is wrong, not the volume.</p>`;
  return h;
}

function periodKey(per) {
  const t = today(), m = mondayOf(t);
  if (per === 'week') return m;
  if (per === 'fortnight') return 'f' + Math.floor(dnum(m) / 14);
  if (per === 'month') return t.slice(0, 7);
  return t.slice(0, 4) + '-Q' + (Math.floor((+t.slice(5, 7) - 1) / 3) + 1);
}
function vBook() {
  const pb = S.settings.pb, P = PB[pb], t = today(), lm = startOf(pb);
  let h = `<p class="sub">${esc(P.name)} · ${esc(P.tag)}. Use the logo buttons in the sidebar to view the other playbook.</p>`;
  h += `<h2>Weekly rhythm</h2><table>${[1, 2, 3, 4, 5].map(i => `<tr class="${dow(t) === i ? 'now' : ''}"><td style="white-space:nowrap"><b>${['', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri'][i]}</b></td><td>${esc(P.focus[i])}</td></tr>`).join('')}</table><p class="sub">Urgent follow-ups and active opportunities override the day’s theme.</p>`;
  h += `<h2>Rules that never change</h2><div class="card"><ul style="margin:0;padding-left:18px">${P.rules.map(r => `<li>${esc(r)}</li>`).join('')}</ul></div>`;
  if (P.decision.length) h += `<h2>Decision rules</h2><div class="card"><ul style="margin:0;padding-left:18px">${P.decision.map(r => `<li>${esc(r)}</li>`).join('')}</ul></div>`;
  h += `<h2>Recurring tasks <small>tick when done for the period</small></h2>`;
  const lab = { week: 'This week', fortnight: 'This fortnight', month: 'This month', quarter: 'This quarter' };
  ['week', 'fortnight', 'month', 'quarter'].forEach(per => {
    const items = P.recurring.filter(r => r[1] === per); if (!items.length) return;
    h += `<div class="card"><b>${lab[per]}</b>` + items.map(r => { const k = ck(pb, r[0]) + ':' + periodKey(per); return `<label class="chk ${S.rec[k] ? 'done' : ''}" style="margin-top:8px"><input type="checkbox" data-act="rec" data-k="${k}" ${S.rec[k] ? 'checked' : ''}><span class="t"><span class="tx">${esc(r[2])}</span></span></label>`; }).join('') + `</div>`;
  });
  h += `<h2>First 30 days</h2><p class="sub">Week 1 starts on ${fmt(lm)}. <button class="b" data-act="tab" data-k="roadmap">Change the start date on Roadmap</button></p>`;
  const wkNow = Math.floor((dnum(t) - dnum(lm)) / 7) + 1;
  P.launch.forEach(([g, items]) => {
    const m = /^Week (\d)/.exec(g), cur = m && +m[1] === wkNow;
    h += `<div class="card ${cur ? 'hero' : ''}"><b>${esc(g)}</b>${cur ? ' <span class="pill">This week</span>' : ''}` + items.map(it => { const k = ck(pb, it[0]); return `<label class="chk ${S.launch[k] ? 'done' : ''}" style="margin-top:8px"><input type="checkbox" data-act="launch" data-k="${k}" ${S.launch[k] ? 'checked' : ''}><span class="t"><span class="tx">${esc(it[1])}</span></span></label>`; }).join('') + `</div>`;
  });
  return h;
}

function vReview() {
  const pb = S.settings.pb, P = PB[pb], t = today();
  const weeks = []; for (let i = 0; i < 8; i++) weeks.push(addD(mondayOf(t), -7 * i));
  const wk = ui.revWk && weeks.includes(ui.revWk) ? ui.revWk : weeks[0], rv = (S.reviews[wk] || {})[pb] || {};
  let h = `<h2>Friday review <small>${esc(P.name)}</small></h2><div class="row" style="margin-bottom:8px"><label class="l grow" style="margin:0">Week of</label><select data-act="revwk" style="width:auto">${weeks.map(w => `<option value="${w}" ${w === wk ? 'selected' : ''}>${fmt(w)}</option>`).join('')}</select></div><p class="sub">Record only what actually happened and keep the evidence. Answer 4 or more questions to earn review XP.</p>`;
  h += P.review.map((q, i) => `<label class="l">${esc(q)}</label><textarea data-act="rev" data-i="${i}" data-wk="${wk}" style="margin-bottom:8px">${esc(rv[i])}</textarea>`).join('');
  h += `<h2>Back up and restore</h2><p class="sub">Your data is saved on the server and in this browser. You can still keep your own copy.</p><div class="row"><button class="b" data-act="export">Download backup</button><label class="b" style="cursor:pointer">Restore from file<input type="file" accept=".json,application/json" data-act="importfile" style="display:none"></label><button class="b x" data-act="reset">Reset everything</button></div>`;
  return h;
}


/* ---------- shell ---------- */
const ICON = {
  dash: '<path d="M3 3h7v9H3zM14 3h7v5h-7zM14 12h7v9h-7zM3 16h7v5H3z"/>',
  today: '<rect x="3" y="3" width="18" height="18" rx="3"/><path d="M8 12l3 3 5-6"/>',
  pipe: '<path d="M3 4h18l-7 9v6l-4 2v-8z"/>',
  partners: '<circle cx="9" cy="8" r="3.5"/><path d="M2 20c0-3.5 3-6 7-6s7 2.5 7 6"/><path d="M17 4.5a3.5 3.5 0 010 7M19 14.5c2 .8 3 2.5 3 5.5"/>',
  content: '<path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 013 3L7 19l-4 1 1-4z"/>',
  scripts: '<path d="M21 12a8 8 0 01-11.5 7.2L3 21l1.8-5.5A8 8 0 1121 12z"/>',
  lib: '<path d="M4 4.5A2.5 2.5 0 016.5 2H20v17H6.5A2.5 2.5 0 004 21.5z"/><path d="M4 21.5A2.5 2.5 0 006.5 19H20"/>',
  progress: '<path d="M4 20V10M10 20V4M16 20v-7M22 20H2"/>',
  review: '<path d="M3 12a9 9 0 109-9 9 9 0 00-6.4 2.6L3 8"/><path d="M3 3v5h5M12 7v5l3 2"/>',
  search: '<circle cx="11" cy="11" r="7"/><path d="M21 21l-4.3-4.3"/>',
  roadmap: '<path d="M3 17l6-6 4 4 8-8"/><path d="M17 7h4v4"/>',
  menu: '<path d="M3 6h18M3 12h18M3 18h18"/>'
};
const ic = n => `<svg class="ic" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${ICON[n]}</svg>`;
const NAV = [['Run', [['dash', 'Dashboard'], ['today', 'Today'], ['pipe', 'Pipeline'], ['partners', 'Partners']]], ['Create', [['content', 'Content'], ['scripts', 'Scripts']]], ['Learn', [['roadmap', 'Roadmap'], ['lib', 'Playbooks'], ['progress', 'Progress'], ['review', 'Review']]]];
const TITLES = { dash: 'Dashboard', today: 'Today', pipe: 'Pipeline', partners: 'Partners', content: 'Content', scripts: 'Scripts', roadmap: 'Roadmap', lib: 'Playbooks', progress: 'Progress', review: 'Review' };

function renderHeader() {
  const st = stats(), pb = S.settings.pb;
  document.documentElement.dataset.pb = pb;
  $('#pbsw').innerHTML = PBS.map(k => `<button class="pbb ${pb === k ? 'on' : ''}" data-act="pb" data-k="${k}" aria-pressed="${pb === k}" title="Work in ${esc(PB[k].name)}"><img src="img/${k}.png" alt="${esc(PB[k].name)}"></button>`).join('');
  $('#xpbox').innerHTML = `<div class="l"><span>Level ${st.lv} · ${st.L.name}</span><span>${st.xp} XP</span></div>${bar(st.xp - st.L.cur, st.L.next - st.L.cur)}<div class="l"><span>🔥 ${st.streak}-day streak</span><span>${st.L.next - st.xp} to go</span></div>`;
  $('#nav').innerHTML = NAV.map(([g, items]) => `<div class="ng">${g}</div>` + items.map(([k, l]) => `<button class="ni ${ui.tab === k ? 'on' : ''}" data-act="tab" data-k="${k}">${ic(k)}<span>${l}</span></button>`).join('')).join('');
  $('#bottom').innerHTML = [['dash', 'Home'], ['today', 'Today'], ['pipe', 'Pipeline'], ['content', 'Content']].map(([k, l]) => `<button class="bi ${ui.tab === k ? 'on' : ''}" data-act="tab" data-k="${k}">${ic(k)}<span>${l}</span></button>`).join('') + `<button class="bi" data-act="menu">${ic('menu')}<span>More</span></button>`;
  $('#page').textContent = TITLES[ui.tab] || '';
  let th = 'auto'; try { th = localStorage.getItem('infinity_theme') || 'auto'; } catch (e) {}
  $('#themesw').innerHTML = [['light', 'Light'], ['auto', 'Auto'], ['dark', 'Dark']].map(([k, l]) => `<button class="${th === k ? 'on' : ''}" data-act="theme" data-k="${k}" aria-pressed="${th === k}">${l}</button>`).join('');
  $('#side').classList.toggle('open', ui.menu); $('#scrim').hidden = !ui.menu;
}

/* ---------- text + search ---------- */
const STOP = new Set('the a an of to do i is it in on for and or my me what how who when which should need this that with at be are can you your'.split(' '));
const tokens = q => q.toLowerCase().replace(/[^a-z0-9$%.\- ]/g, ' ').split(/\s+/).filter(w => w && (w.length > 1) && !STOP.has(w));
const reEsc = s => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
function hl(text, terms) {
  let h = esc(text);
  if (terms && terms.length) { const re = new RegExp('(' + terms.map(reEsc).join('|') + ')', 'gi'); h = h.replace(re, '<mark>$1</mark>'); }
  return h.replace(/\[(Verified|Assumption|Hypothesis)\]/g, (m, w) => `<span class="tg tg-${w[0].toLowerCase()}">${w}</span>`);
}
function snippet(text, terms, n) {
  const low = text.toLowerCase(); let at = -1;
  for (const t of terms) { const i = low.indexOf(t); if (i >= 0 && (at < 0 || i < at)) at = i; }
  const a = Math.max(0, (at < 0 ? 0 : at) - 50), b = Math.min(text.length, a + (n || 170));
  return (a > 0 ? '…' : '') + text.slice(a, b) + (b < text.length ? '…' : '');
}
const blockText = b => b.t === 'table' ? b.head.join(' ') + ' ' + b.rows.map(r => r.join(' ')).join(' ') : b.x;
let IDX = null;
function buildIdx() {
  IDX = [];
  PBS.forEach(pb => (C.lib[pb] || []).forEach(sec => sec.blocks.forEach((b, bi) => { const text = blockText(b); IDX.push({ kind: 'lib', pb, sec: sec.n, bi, title: sec.title, text, low: (sec.title + ' ' + text).toLowerCase(), isH: b.t === 'h' }); })));
}
const mergeScript = s => Object.assign({}, s, S.scriptEdits[s.id] || {}, { edited: !!S.scriptEdits[s.id], builtin: true });
const allScripts = () => C.scripts.map(mergeScript).concat(S.scripts.map(s => Object.assign({ group: 'My scripts' }, s, { builtin: false })));
const mergeIdea = (i, b) => { const st = S.ideaState[i.id] || {}; return Object.assign({}, i, { title: st.title || i.title, body: st.body !== undefined ? st.body : i.body, status: st.status || 'Idea', builtin: b, edited: !!(st.title || st.body !== undefined) }); };
const allIdeas = () => C.ideas.map(i => mergeIdea(i, true)).concat(S.ideasUser.map(i => mergeIdea(i, false)));

function search(q, limit) {
  const terms = tokens(q); if (!terms.length) return { terms, res: [] };
  if (!IDX) buildIdx();
  const cand = [];
  IDX.forEach(it => cand.push({ kind: 'lib', pb: it.pb, sec: it.sec, bi: it.bi, title: PB[it.pb].name + ' · ' + it.sec + '. ' + it.title, text: it.text, low: it.low, w: it.isH ? 2 : 1 }));
  allScripts().forEach(s => cand.push({ kind: 'script', id: s.id, pb: s.pb, title: s.title, text: s.body, low: (s.title + ' ' + s.body + ' ' + s.group).toLowerCase(), w: 2 }));
  allIdeas().forEach(i => cand.push({ kind: 'idea', id: i.id, pb: i.pb, title: i.title, text: i.body || (i.audience || ''), low: (i.title + ' ' + i.body + ' ' + (i.audience || '') + ' ' + i.kind).toLowerCase(), w: 2 }));
  G.gloss.forEach(g => cand.push({ kind: 'term', id: g.k, pb: '', title: g.term, text: g.def, low: (g.term + ' ' + (g.aka || []).join(' ') + ' ' + g.def).toLowerCase(), w: 3 }));
  S.prospects.forEach(p => cand.push({ kind: 'prospect', id: p.id, pb: p.pb, title: p.name + (p.biz ? ' · ' + p.biz : ''), text: [p.stage, p.src, p.sig, p.note].join(' · '), low: [p.name, p.biz, p.src, p.sig, p.note, p.stage, p.email, p.phone].join(' ').toLowerCase(), w: 2 }));
  S.tasks.filter(t => !t.done).forEach(t => cand.push({ kind: 'task', id: t.id, title: t.text, text: 'Task due ' + fmt(t.due), low: t.text.toLowerCase(), w: 2 }));
  S.partners.forEach(p => cand.push({ kind: 'partner', id: p.id, title: p.name, text: p.type + ' · ' + p.next, low: (p.name + ' ' + p.type + ' ' + p.next).toLowerCase(), w: 2 }));
  const score = (c, all) => { let s = 0, hit = 0; terms.forEach(t => { const i = c.low.indexOf(t); if (i >= 0) { hit++; s += c.w + (c.title.toLowerCase().includes(t) ? 3 : 0) + Math.min(3, c.low.split(t).length - 1) * .3; } }); return all ? (hit === terms.length ? s : 0) : (hit >= Math.ceil(terms.length / 2) ? s * hit / terms.length : 0); };
  let res = cand.map(c => [score(c, true), c]).filter(x => x[0] > 0);
  if (!res.length) res = cand.map(c => [score(c, false), c]).filter(x => x[0] > 0);
  res.sort((a, b) => b[0] - a[0]);
  const perSec = {}, out = [];
  for (const [, c] of res) { if (c.kind === 'lib') { const k = c.pb + c.sec; perSec[k] = (perSec[k] || 0) + 1; if (perSec[k] > 2) continue; } out.push(c); if (out.length >= (limit || 30)) break; }
  return { terms, res: out };
}
const KIND = { term: 'Definition', lib: 'Playbook', script: 'Script', idea: 'Content', prospect: 'Prospect', task: 'Task', partner: 'Partner', ask: 'Ask' };

/* ---------- briefing and answers ---------- */
const startOf = pb => (S.settings.start || {})[pb || S.settings.pb] || '2026-11-02';
function planInfo(pb, date) {
  const n = dnum(date) - dnum(startOf(pb)) + 1;
  if (n < 1) return { n, prep: true, after: false, week: 0, phase: 0, dc: 0, toStart: 1 - n, label: 'Prep · Day 1 is ' + fmt(startOf(pb)) };
  if (n > 90) return { n, prep: false, after: true, week: 13, phase: 4, dc: n, label: 'Day ' + n + ' · after the 90-day plan' };
  const phase = n <= 30 ? 1 : n <= 60 ? 2 : 3, week = Math.floor((n - 1) / 7) + 1;
  return { n, prep: false, after: false, week, phase, dc: n, label: 'Day ' + n + ' of 90 · Week ' + week + ' · Phase ' + phase };
}
const weekNow = () => planInfo(S.settings.pb, today()).week;
const outreachOf = o => (o.req || 0) + (o.email || 0) + (o.sent || 0);
const ACTIVE = ['Replied', 'Call booked', 'Call done', 'Audit delivered', 'Proposal sent'];
const DAILY = { optimai: [['req', 5, 'LinkedIn requests'], ['email', 3, 'emails (max)']], nudge: [['sent', 5, 'personalised messages']] };
function weekIdeas(pb) { const w = Math.max(1, weekNow()); return allIdeas().filter(i => i.pb === pb && i.kind === 'post' && i.week === w); }
function briefing() {
  const t = today(), pb = S.settings.pb, P = PB[pb], d = day(t), steps = [];
  const act = S.prospects.filter(p => p.pb === pb && ACTIVE.includes(p.stage));
  if (act.length) steps.push({ n: 'Active deals and inbound', x: act.slice(0, 4).map(p => `${p.name} (${p.stage})`).join(', ') + (act.length > 4 ? ` and ${act.length - 4} more` : ''), go: 'pipe', m: 0 });
  const due = dueList();
  if (due.length) steps.push({ n: `${due.length} follow-up${due.length > 1 ? 's' : ''} due`, x: due.slice(0, 4).map(p => p.name).join(', ') + (due.length > 4 ? '…' : ''), go: 'today', m: 10 });
  const tasks = todaysTasks().filter(x => !x.done);
  if (tasks.length) steps.push({ n: `${tasks.length} open task${tasks.length > 1 ? 's' : ''}`, x: tasks.slice(0, 3).map(x => x.text).join('; ') + (tasks.length > 3 ? '…' : ''), go: 'today', m: 0 });
  P.core.filter(c => !d.c[ck(pb, c[0])]).forEach(c => steps.push({ n: c[1], x: c[3], go: 'today', m: c[2], core: true }));
  const posts = weekIdeas(pb).filter(i => i.status !== 'Published');
  if (posts.length && !isWeekend(t)) steps.push({ n: 'Content this week', x: posts.slice(0, 2).map(i => i.title).join('; '), go: 'content', m: 0 });
  const mins = steps.filter(s => s.core).reduce((a, s) => a + s.m, 0);
  return { steps, mins, focus: P.focus[dow(t)], done: P.core.every(c => d.c[ck(pb, c[0])]) };
}
function briefHTML(b, short) {
  if (!b.steps.length) return '<p class="sub">Nothing outstanding. Core 60 is done and there are no follow-ups or tasks open. Use spare time on content or partners.</p>';
  return `<ol class="steps">${b.steps.slice(0, short ? 5 : 20).map(s => `<li><div><b>${esc(s.n)}</b>${s.m ? `<span class="mins">${s.m} min</span>` : ''}<span class="d">${esc(short ? s.x.slice(0, 110) + (s.x.length > 110 ? '…' : '') : s.x)}</span></div><button class="b" data-act="tab" data-k="${s.go}">Open</button></li>`).join('')}</ol>`;
}
function answer(q) {
  const ql = q.toLowerCase(), pb = S.settings.pb, P = PB[pb], t = today();
  const link = (kind, label, attrs) => `<button class="b" data-act="${kind}" ${attrs || ''}>${esc(label)}</button>`;
  let h = '', title = '';
  const dm = /\b(what is|what's|what are|define|meaning of)\b/.test(ql) && !/\b(my|due|today|this week)\b/.test(ql) ? G.gloss.find(g => [g.term.toLowerCase()].concat((g.aka || []).map(x => x.toLowerCase())).some(n => /^\w/.test(n) && new RegExp('\\b' + reEsc(n) + '\\b').test(ql))) : null;
  if (dm) {
    title = dm.term; h = `<p>${esc(dm.def)}</p>${dm.app ? `<p class="d">In the app: ${esc(dm.app)}</p>` : ''}<div class="chips">${dm.links.map(planBtn).join('')}</div><p style="margin-top:8px"><button class="b" data-act="termgloss">All terms</button></p>`;
  } else if (/\b(today|do now|priorit|my day|to do)\b|what.*(need|should).*(do|work)/.test(ql) && !/\b(post|script|write|say|reply)\b/.test(ql)) {
    const b = briefing(); title = 'Your day, in playbook order';
    h = `<p class="sub">${esc(P.name)} · ${fmt(t, { weekday: 'long', day: 'numeric', month: 'long' })}. ${esc(b.focus)}</p>` + briefHTML(b) + (b.mins ? `<p class="d">About ${b.mins} minutes of core work left.</p>` : '<p class="d">Core 60 is complete.</p>') + `<p class="d">Order follows the playbook: active deals and inbound, due follow-ups, then new outreach, partners and content.</p>`;
  } else if (/follow/.test(ql)) {
    const due = dueList(), up = S.prospects.filter(p => p.next > t && !['Won', 'Lost'].includes(p.stage)).sort((a, b) => a.next < b.next ? -1 : 1).slice(0, 5); title = 'Follow-ups';
    h = (due.length ? due.map(p => `<div class="row sm"><b class="grow">${esc(p.name)} <span class="d" style="display:inline">${esc(p.biz)} · touch ${p.touches} of ${PB[p.pb].max}</span></b><button class="b p" data-act="touch" data-id="${p.id}">Log touch</button></div>`).join('') : '<p class="sub">Nothing due today.</p>') + (up.length ? `<h4>Coming up</h4>` + up.map(p => `<div class="d">${fmt(p.next)} · ${esc(p.name)} (${esc(p.biz)})</div>`).join('') : '');
  } else if (/week|target|track|progress|how am i|kpi|score/.test(ql)) {
    title = 'This week against targets'; h = weekTargets(pb);
  } else if (/post|content|write|publish|article|newsletter|linkedin post/.test(ql) && !/script/.test(ql)) {
    const ideas = allIdeas().filter(i => i.pb === pb && i.status !== 'Published' && (i.week === Math.max(1, weekNow()) || i.week === 0)).slice(0, 6); title = 'Content to work on';
    h = ideas.length ? ideas.map(i => `<div class="row sm"><div class="grow"><b>${esc(i.title)}</b><span class="d">${esc(i.kind)}${i.week ? ' · week ' + i.week : ''} · ${esc(i.status)}</span></div><button class="b" data-act="openidea" data-id="${i.id}">Open</button></div>`).join('') : '<p class="sub">No ideas queued for this week. Add one on the Content page.</p>';
  } else {
    const r = search(q, 6); title = r.res.length ? `Best matches for “${q}”` : 'Nothing found';
    h = r.res.length ? r.res.map((c, i) => `<div class="row sm"><div class="grow"><b>${esc(c.title)}</b><span class="d">${esc(KIND[c.kind])} · ${esc(snippet(c.text, r.terms, 120))}</span></div><button class="b" data-act="gosearch" data-q="${esc(q)}" data-i="${i}">Open</button></div>`).join('') : '<p class="sub">Try different words, or search the full playbooks from the Playbooks page.</p>';
  }
  return `<div class="card ans"><div class="row"><b class="grow">${esc(title)}</b><button class="b x" data-act="clearask" aria-label="Close answer">✕</button></div>${h}<p class="d" style="margin-top:8px">Answered from your tracker and playbooks. No AI model is called.</p></div>`;
}

/* ---------- dashboard ---------- */
function barsSVG(vals, labels) {
  const mx = Math.max(5, ...vals), w = 300, h = 90, bw = w / vals.length;
  return `<svg viewBox="0 0 ${w} ${h + 16}" class="chart" role="img" aria-label="Outreach per day, last ${vals.length} days">` + vals.map((v, i) => { const bh = Math.round(v / mx * h); return `<rect x="${i * bw + 3}" y="${h - bh}" width="${bw - 6}" height="${Math.max(bh, 2)}" rx="3" class="${i === vals.length - 1 ? 'cur' : ''}"><title>${labels[i]}: ${v}</title></rect><text x="${i * bw + bw / 2}" y="${h + 12}" text-anchor="middle">${labels[i].slice(0, 1)}</text>`; }).join('') + `</svg>`;
}
function vDash() {
  const t = today(), pb = S.settings.pb, P = PB[pb], st = stats(), b = briefing(), pi = planInfo(pb, t);
  const mins = coreMins(t, pb), pct = Math.round(mins / 60 * 100);
  const hr = new Date().getHours(), greet = hr < 12 ? 'Good morning' : hr < 18 ? 'Good afternoon' : 'Good evening';
  const wk = sumRange(mondayOf(t), addD(mondayOf(t), 6)), tgt = P.targets.reduce((a, x) => a + (['req', 'email', 'sent'].includes(x[0]) ? x[1] : 0), 0);
  const act = S.prospects.filter(p => p.pb === pb && !['Won', 'Lost'].includes(p.stage)).length;
  const tile = (l, v, sub, go) => `<button class="tile" data-act="tab" data-k="${go}"><span class="d">${l}</span><span class="big">${v}</span><span class="d">${sub}</span></button>`;
  let h = `<div class="dhead"><div><h1>${greet}</h1><p class="sub" style="margin:0">${fmt(t, { weekday: 'long', day: 'numeric', month: 'long' })} · ${esc(P.name)} · ${esc(pi.label)}</p></div></div>`;
  if (pi.after) h += `<div class="notice">You are past day 90. Open the Roadmap to run your quarter review and start the next cycle. <button class="b p" data-act="tab" data-k="roadmap">Open Roadmap</button></div>`;
  else if (!pi.prep && pi.n >= 84) h += `<div class="notice">${90 - pi.n === 0 ? 'Today is day 90.' : (90 - pi.n) + ' day' + (90 - pi.n === 1 ? '' : 's') + ' until day 90.'} See what comes next on the <button class="term" data-act="tab" data-k="roadmap">Roadmap</button>.</div>`;
  else if (pi.prep) h += `<div class="notice">Prep week: Day 1 is ${fmt(startOf(pb), { weekday: 'long', day: 'numeric', month: 'long' })}. Change it on the <button class="term" data-act="tab" data-k="roadmap">Roadmap</button> page.</div>`;
  h += `<div class="card askbox"><label class="l" for="ask_q">Ask your playbooks and tracker</label><div class="row"><input id="ask_q" class="grow" value="${esc(ui.ask)}" placeholder="What do I need to do today?" autocomplete="off"><button class="b p" data-act="ask">Ask</button></div><div class="chips">${['What do I need to do today?', 'Who do I follow up?', 'How am I tracking this week?', 'What should I post?', 'What is a tracker?'].map(x => `<button class="chip" data-act="askchip" data-q="${esc(x)}">${esc(x)}</button>`).join('')}</div></div>`;
  if (ui.ask) h += answer(ui.ask);
  h += `<div class="tiles">` + tile('Outreach this week', `${outreachOf(wk)}<small>/${tgt}</small>`, 'messages sent', 'progress') + tile('Replies', wk.reply || 0, 'this week', 'pipe') + tile('Calls booked', wk.call || 0, 'this week', 'pipe') + tile('Proposals', metricVal('proposal', 'week'), `${st.won} won all time`, 'pipe') + tile('Open pipeline', act, 'active prospects', 'pipe') + tile('Streak', `${st.streak}<small> days</small>`, `best ${st.best}`, 'progress') + `</div>`;

  const goalRow = g => { const v = metricVal(g.metric, g.period), ok = v >= g.target; return `<div class="trow"><span>${ok ? '✅ ' : ''}${esc(g.title)}</span><span>${v} / ${g.target}</span></div>${bar(v, g.target, ok)}`; };
  const wg = S.goals.filter(g => g.period === 'week'), og = S.goals.filter(g => g.period !== 'week');
  h += `<div class="cols"><div class="card"><div class="row"><b class="grow">Today’s plan</b><div class="ring sm" style="--p:${pct}"><span>${pct}%</span></div></div><p class="d" style="margin:4px 0 8px">${esc(b.focus)}</p>${briefHTML(b, true)}<button class="b p" data-act="tab" data-k="today">Open Today</button></div>`;
  h += `<div class="card"><div class="row"><b class="grow">Weekly goals</b><button class="b" data-act="tab" data-k="progress">Edit goals</button></div>${P.targets.map(([k, tg]) => { const v = metricVal(k, 'week'); return `<div class="trow"><span>${METRICS[k]}</span><span>${v} / ${tg}</span></div>${bar(v, tg, v >= tg)}`; }).join('')}${wg.map(goalRow).join('')}${og.length ? `<h4>Longer-term goals</h4>${og.map(goalRow).join('')}` : ''}<p class="d" style="margin-top:8px">Targets are the playbook’s hypotheses, to be replaced with your own data.</p></div></div>`;

  const dayStatus = dt => { const m = coreMins(dt, pb), done = coreDone(dt, pb); if (done) return ['Core done', 'ok']; if (dt === t) return [m ? m + ' of 60 min' : 'Today', 'warn']; if (dt < t) return m ? [m + ' of 60 min', 'warn'] : ['Missed', 'bad']; return ['Upcoming', '']; };
  const mon = mondayOf(t);
  h += `<div class="card"><div class="row"><b class="grow">This week at a glance <span class="d" style="display:inline">· ${fmt(mon)} to ${fmt(addD(mon, 6))}</span></b></div><p class="d" style="margin:2px 0 6px">Each day has a different focus. Tap a day to open it.</p>` + [0, 1, 2, 3, 4].map(i => { const dt = addD(mon, i), [lab, cls] = dayStatus(dt); return `<button class="wrow ${dt === t ? 'now' : ''}" data-act="gotoday" data-date="${dt}"><span class="wd"><b>${fmt(dt, { weekday: 'short' })}</b><span class="d">${fmt(dt, { day: 'numeric', month: 'short' })}</span></span><span class="wf">${esc(P.focus[i + 1])}</span><span class="pill ${cls}">${lab}</span></button>`; }).join('') + `<p class="d" style="margin:8px 0 0">${esc(P.focus[6])}</p></div>`;

  const days = [], labs = []; for (let i = 13; i >= 0; i--) { const dt = addD(t, -i), o = (S.days[dt] || { n: {} }).n; days.push(outreachOf(o)); labs.push(fmt(dt, { weekday: 'short' })); }
  const stg = STAGES.map(s => [s, S.prospects.filter(p => p.pb === pb && p.stage === s).length]), mxs = Math.max(1, ...stg.map(x => x[1]));
  h += `<div class="cols"><div class="card"><b>Outreach, last 14 days</b>${barsSVG(days, labs)}</div><div class="card"><b>Pipeline by stage</b>${stg.map(([s, n]) => `<div class="fn"><span>${s}</span><div class="fb"><i style="width:${Math.round(n / mxs * 100)}%"></i></div><span>${n}</span></div>`).join('')}</div></div>`;
  const ideas = weekIdeas(pb).slice(0, 4), up = S.prospects.filter(p => p.next && p.next > t && !['Won', 'Lost'].includes(p.stage)).sort((a, b) => a.next < b.next ? -1 : 1).slice(0, 5);
  h += `<div class="cols"><div class="card"><div class="row"><b class="grow">Content, week ${Math.max(1, weekNow())}</b><button class="b" data-act="tab" data-k="content">All ideas</button></div>${ideas.length ? ideas.map(i => `<div class="row sm"><div class="grow">${esc(i.title)}<span class="d">${esc(i.channel || '')} · ${esc(i.status)}</span></div><button class="b" data-act="openidea" data-id="${i.id}">Open</button></div>`).join('') : '<p class="sub">No post ideas for this week.</p>'}</div>`;
  h += `<div class="card"><b>Upcoming follow-ups</b>${up.length ? up.map(p => `<div class="row sm"><div class="grow">${esc(p.name)}<span class="d">${esc(p.biz)} · ${esc(p.stage)}</span></div><span class="pill">${fmt(p.next)}</span></div>`).join('') : '<p class="sub">None scheduled. Log a touch on a prospect to schedule the next.</p>'}</div></div>`;
  const bd = BADGES.filter(x => S.badges[x[0]]).sort((a, b) => S.badges[a[0]] < S.badges[b[0]] ? 1 : -1).slice(0, 6);
  h += `<div class="card"><div class="row"><b class="grow">Recent badges</b><button class="b" data-act="tab" data-k="progress">All badges</button></div><div class="chips">${bd.length ? bd.map(x => `<span class="chip" title="${esc(x[3])}">${x[1]} ${x[2]}</span>`).join('') : '<span class="d">Finish your first core 60 to start earning badges.</span>'}</div></div>`;
  return h;
}

/* ---------- playbooks (library) ---------- */
const DOCS = { nudge: ['Nudge Digital: 90-Day Business Development Operating System', 'Prepared 28 October 2026 · Version 1 · 36 pages'], optimai: ['OptimAI Business Development Playbook', 'Prepared 28 October 2026 · 21 pages'] };
function renderBlock(lp, sec, b, bi, terms) {
  const id = `b-${lp}-${sec.n}-${bi}`, f = ui.focus === id ? ' focus' : '';
  if (b.t === 'h') return `<h3 class="bh${f}" id="${id}">${hl(b.x, terms)}</h3>`;
  if (b.t === 'q') return `<div class="quote${f}" id="${id}"><pre>${hl(b.x, terms)}</pre><div class="row"><button class="b" data-act="copy" data-t="${esc(b.x)}">Copy</button><button class="b" data-act="savescript" data-lp="${lp}" data-s="${sec.n}" data-b="${bi}">Save as my script</button></div></div>`;
  if (b.t === 'table') return `<div class="tw${f}" id="${id}"><table class="lt"><thead><tr>${b.head.map(x => `<th>${hl(x, terms)}</th>`).join('')}</tr></thead><tbody>${b.rows.map(r => `<tr>${r.map((x, i) => `<td${i === 0 ? ' class="c0"' : ''}>${hl(x, terms)}</td>`).join('')}</tr>`).join('')}</tbody></table></div>`;
  return `<p class="${f}" id="${id}">${hl(b.x, terms)}</p>`;
}
function libBody() {
  const lp = ui.libPb || S.settings.pb, secs = C.lib[lp] || [], terms = tokens(ui.libQ), searching = terms.length > 0;
  const blockHit = b => { const l = blockText(b).toLowerCase(); return terms.every(t => l.includes(t)); };
  const hits = secs.map(s => searching ? s.blocks.map((b, i) => [b, i]).filter(([b]) => blockHit(b)) : []);
  const cur = ui.libSec && ui.libSec !== 'all' ? secs.find(s => String(s.n) === String(ui.libSec)) : null;
  const toc = secs.map((s, i) => `<button class="toc-i ${cur && cur.n === s.n ? 'on' : ''}" data-act="libsec" data-s="${s.n}"><span class="tn">${s.n}</span><span class="grow">${esc(s.title)}</span>${searching && hits[i].length ? `<span class="pill">${hits[i].length}</span>` : ''}</button>`).join('');
  let body = '';
  if (searching && !cur) {
    const total = hits.reduce((a, x) => a + x.length, 0);
    body = `<p class="sub">${total} match${total === 1 ? '' : 'es'} for “${esc(ui.libQ)}” in ${esc(PB[lp].name)}.</p>` + secs.map((s, i) => hits[i].length ? `<div class="card"><div class="row"><b class="grow">${s.n}. ${esc(s.title)}</b><button class="b" data-act="libsec" data-s="${s.n}">Open section</button></div>${hits[i].slice(0, 6).map(([b, bi]) => `<div class="hit"><div class="d">${hl(snippet(blockText(b), terms, 260), terms)}</div></div>`).join('')}${hits[i].length > 6 ? `<span class="d">+ ${hits[i].length - 6} more in this section</span>` : ''}</div>` : '').join('') || '<div class="card d">No matches. Try fewer or different words.</div>';
  } else if (cur) {
    const i = secs.indexOf(cur), pv = secs[i - 1], nx = secs[i + 1];
    body = `<div class="secnav row"><button class="b" data-act="libsec" data-s="all">${searching ? 'Back to results' : 'All sections'}</button><span class="grow"></span>${pv ? `<button class="b" data-act="libsec" data-s="${pv.n}">← ${pv.n}</button>` : ''}${nx ? `<button class="b" data-act="libsec" data-s="${nx.n}">${nx.n} →</button>` : ''}</div><h2 class="sech">${cur.n}. ${esc(cur.title)}</h2>` + cur.blocks.map((b, bi) => renderBlock(lp, cur, b, bi, terms)).join('') + `<div class="secnav row">${pv ? `<button class="b" data-act="libsec" data-s="${pv.n}">← ${esc(pv.title)}</button>` : ''}<span class="grow"></span>${nx ? `<button class="b" data-act="libsec" data-s="${nx.n}">${esc(nx.title)} →</button>` : ''}</div>`;
  } else {
    body = `<div class="secgrid">` + secs.map(s => { const first = (s.blocks.find(b => b.t === 'p') || { x: '' }).x; return `<button class="card seccard" data-act="libsec" data-s="${s.n}"><span class="tn">${s.n}</span><b>${esc(s.title)}</b><span class="d">${esc(first.slice(0, 120))}${first.length > 120 ? '…' : ''}</span></button>`; }).join('') + `</div>`;
  }
  return `<div class="libgrid"><aside class="toc"><label class="l tocsel" for="libsel">Section</label><select id="libsel" class="tocsel" data-act="libselect"><option value="all">All sections</option>${secs.map(s => `<option value="${s.n}" ${cur && cur.n === s.n ? 'selected' : ''}>${s.n}. ${esc(s.title)}</option>`).join('')}</select><div class="tocl">${toc}</div></aside><div class="libmain">${body}</div></div>`;
}
function vLib() {
  const lp = ui.libPb || S.settings.pb;
  let h = `<div class="seg" role="tablist"><button class="${ui.libView === 'plan' ? 'on' : ''}" data-act="libview" data-k="plan">Full plan</button><button class="${ui.libView === 'os' ? 'on' : ''}" data-act="libview" data-k="os">Operating system</button><button class="${ui.libView === 'gloss' ? 'on' : ''}" data-act="libview" data-k="gloss">Glossary</button></div>`;
  if (ui.libView === 'os') return h + vBook();
  if (ui.libView === 'gloss') return h + vGloss();
  h += `<div class="row" style="margin:12px 0"><div class="pbtabs">${PBS.map(k => `<button class="${lp === k ? 'on' : ''}" data-act="libpb" data-k="${k}"><img src="img/${k}.png" alt="${esc(PB[k].name)}"></button>`).join('')}</div><div class="grow"><b>${esc(DOCS[lp][0])}</b><span class="d">${DOCS[lp][1]}</span></div></div>`;
  h += `<div class="searchrow"><span class="si">${ic('search')}</span><input id="libq" type="search" value="${esc(ui.libQ)}" placeholder="Search this plan: pricing, Spam Act, follow-up, ICP…" autocomplete="off"></div><div id="libbody">${libBody()}</div>`;
  return h;
}

/* ---------- scripts (editable) ---------- */
const PH = /\[[^\]\n]{1,60}\]|\{[^}\n]{1,60}\}/g;
function fillText(body) { return body.replace(PH, m => (ui.fillVals[m] || '').trim() || m); }
function scriptCard(s) {
  const f = ui.focus === 'sc-' + s.id ? ' focus' : '', ed = ui.edit === 's:' + s.id;
  if (ed) return `<div class="card sc${f}" id="sc-${s.id}"><label class="l" for="se_t">Title</label><input id="se_t" value="${esc(s.title)}"><label class="l" for="se_g" style="margin-top:8px">Group</label><input id="se_g" value="${esc(s.group)}" list="sgroups"><label class="l" for="se_b" style="margin-top:8px">Message</label><textarea id="se_b" rows="8">${esc(s.body)}</textarea><div class="row" style="margin-top:8px"><button class="b p" data-act="savescriptedit" data-id="${s.id}">Save</button><button class="b" data-act="canceledit">Cancel</button>${s.builtin && s.edited ? `<button class="b x" data-act="resetscript" data-id="${s.id}">Restore playbook original</button>` : ''}</div></div>`;
  const phs = [...new Set(s.body.match(PH) || [])];
  const fill = ui.fill === s.id ? `<div class="fill"><div class="form">${phs.map(p => `<div><label class="l">${esc(p)}</label><input data-act="fillv" data-k="${esc(p)}" value="${esc(ui.fillVals[p] || '')}"></div>`).join('') || '<span class="d">No placeholders in this script.</span>'}</div><pre id="fillprev">${esc(fillText(s.body))}</pre><div class="row"><button class="b p" data-act="copyfilled" data-id="${s.id}">Copy filled</button><button class="b" data-act="closefill">Close</button></div></div>` : '';
  return `<div class="card sc${f}" id="sc-${s.id}"><div class="row"><div class="grow"><b>${esc(s.title)}</b> <span class="pill">${esc(s.group)}</span>${s.edited ? ' <span class="pill warn">Edited</span>' : ''}${s.pb ? ` <span class="pill">${esc(PB[s.pb].name)}</span>` : ''}</div><button class="b" data-act="copy" data-t="${esc(s.body)}">Copy</button><button class="b" data-act="fill" data-id="${s.id}">Personalise</button><button class="b" data-act="editscript" data-id="${s.id}">Edit</button>${s.builtin ? '' : `<button class="b x" data-act="delscript" data-id="${s.id}" aria-label="Delete">✕</button>`}</div><pre>${esc(s.body)}</pre>${fill}</div>`;
}
function scriptsList() {
  const pb = S.settings.pb, q = tokens(ui.sq);
  let l = allScripts().filter(s => (ui.spf === 'all' || !s.pb || s.pb === pb) && (!ui.sg || s.group === ui.sg) && (!q.length || q.every(t => (s.title + ' ' + s.body + ' ' + s.group).toLowerCase().includes(t))));
  return l.length ? l.map(scriptCard).join('') : '<div class="card d">No scripts match.</div>';
}
function vScripts() {
  const pb = S.settings.pb, P = PB[pb], base = allScripts().filter(s => ui.spf === 'all' || !s.pb || s.pb === pb), groups = [...new Set(base.map(s => s.group))];
  return `<p class="sub">Scripts come from the ${esc(P.name)} playbook. Edit any of them, save your own, and use Personalise to fill the [placeholders] before you copy. Edits are saved and the playbook original can be restored.</p>
 <div class="form"><div><label class="l" for="sq">Search scripts</label><input id="sq" type="search" value="${esc(ui.sq)}" placeholder="follow-up, objection, partner…"></div><div><label class="l" for="spf">Show</label><select id="spf" data-act="spf"><option value="cur" ${ui.spf === 'cur' ? 'selected' : ''}>${esc(P.name)} only</option><option value="all" ${ui.spf === 'all' ? 'selected' : ''}>Both playbooks</option></select></div></div>
 <div class="chips" style="margin-bottom:10px"><button class="chip ${!ui.sg ? 'on' : ''}" data-act="sgroup" data-k="">All</button>${groups.map(g => `<button class="chip ${ui.sg === g ? 'on' : ''}" data-act="sgroup" data-k="${esc(g)}">${esc(g)}</button>`).join('')}</div>
 <datalist id="sgroups">${groups.map(g => `<option value="${esc(g)}">`).join('')}</datalist><div id="slist">${scriptsList()}</div>
 <h2>New script</h2><div class="card"><label class="l" for="s_title">Title</label><input id="s_title"><label class="l" for="s_group" style="margin-top:8px">Group</label><input id="s_group" list="sgroups" value="My scripts"><label class="l" for="s_body" style="margin-top:8px">Message</label><textarea id="s_body" rows="5" placeholder="Hi [Name], …"></textarea><button class="b p" style="margin-top:8px" data-act="addscript">Save script</button></div>`;
}

/* ---------- content ---------- */
const STATUS = ['Idea', 'Drafting', 'Scheduled', 'Published'];
const KINDS = [['', 'All'], ['post', 'Posts'], ['article', 'Articles'], ['newsletter', 'Newsletter']];
function ideaCard(i) {
  const f = ui.focus === 'id-' + i.id ? ' focus' : '', ed = ui.edit === 'i:' + i.id;
  if (ed) return `<div class="card idea${f}" id="id-${i.id}"><label class="l" for="ie_t">Title</label><input id="ie_t" value="${esc(i.title)}"><label class="l" for="ie_b" style="margin-top:8px">Draft</label><textarea id="ie_b" rows="12">${esc(i.body)}</textarea><div class="row" style="margin-top:8px"><button class="b p" data-act="saveidea" data-id="${i.id}">Save</button><button class="b" data-act="canceledit">Cancel</button>${i.builtin && i.edited ? `<button class="b x" data-act="resetidea" data-id="${i.id}">Restore playbook original</button>` : ''}</div></div>`;
  const meta = [i.week ? 'Week ' + i.week : '', i.channel, i.audience, i.service, i.cta ? 'CTA: ' + i.cta : ''].filter(Boolean);
  return `<div class="card idea${f}" id="id-${i.id}"><div class="row"><div class="grow"><b>${esc(i.title)}</b><div class="chips" style="margin-top:4px"><span class="pill">${esc(i.kind)}</span><span class="pill">${esc(PB[i.pb].name)}</span>${i.edited ? '<span class="pill warn">Edited</span>' : ''}${meta.map(m => `<span class="chip">${esc(m)}</span>`).join('')}</div></div><select data-act="istatus" data-id="${i.id}" aria-label="Status" style="width:auto" class="st st-${i.status.toLowerCase()}">${STATUS.map(s => `<option ${s === i.status ? 'selected' : ''}>${s}</option>`).join('')}</select></div>${i.body ? `<details ${ui.focus === 'id-' + i.id ? 'open' : ''}><summary>Draft</summary><pre>${esc(i.body)}</pre></details>` : '<p class="d" style="margin:6px 0 0">No draft yet. Press Edit to write one.</p>'}<div class="row" style="margin-top:8px">${i.body ? `<button class="b" data-act="copy" data-t="${esc(i.body)}">Copy draft</button>` : ''}<button class="b" data-act="editidea" data-id="${i.id}">Edit</button>${i.builtin ? '' : `<button class="b x" data-act="delidea" data-id="${i.id}" aria-label="Delete idea">✕</button>`}</div></div>`;
}
function ideasList() {
  const pb = S.settings.pb, q = tokens(ui.iq), w = Math.max(1, weekNow());
  const l = allIdeas().filter(i => (ui.ipb === 'all' || i.pb === pb) && (!ui.ik || i.kind === ui.ik) && (!ui.is || i.status === ui.is) && (!ui.iw || i.week === w) && (!q.length || q.every(t => (i.title + ' ' + i.body + ' ' + (i.audience || '')).toLowerCase().includes(t))));
  return `<p class="d">${l.length} idea${l.length === 1 ? '' : 's'}</p>` + (l.length ? l.map(ideaCard).join('') : '<div class="card d">No ideas match these filters.</div>');
}
function vContent() {
  const pb = S.settings.pb, P = PB[pb], M = C.meta[pb] || { pillars: [], cadence: [], templates: [], calendar: { head: [], rows: [] } }, w = weekNow();
  let h = `<div class="seg">${[['ideas', 'Ideas'], ['calendar', 'Calendar'], ['plan', 'Pillars and templates']].map(([k, l]) => `<button class="${ui.ctab === k ? 'on' : ''}" data-act="ctab" data-k="${k}">${l}</button>`).join('')}</div>`;
  if (ui.ctab === 'ideas') {
    h += `<div class="form" style="margin-top:12px"><div><label class="l" for="iq">Search ideas</label><input id="iq" type="search" value="${esc(ui.iq)}" placeholder="tracking, CRM, hiring…"></div><div><label class="l" for="ipb">Show</label><select id="ipb" data-act="ipb"><option value="cur" ${ui.ipb === 'cur' ? 'selected' : ''}>${esc(P.name)} only</option><option value="all" ${ui.ipb === 'all' ? 'selected' : ''}>Both playbooks</option></select></div><div><label class="l" for="ist">Status</label><select id="ist" data-act="is"><option value="">All</option>${STATUS.map(s => `<option ${ui.is === s ? 'selected' : ''}>${s}</option>`).join('')}</select></div></div>`;
    h += `<div class="chips" style="margin-bottom:10px">${KINDS.map(([k, l]) => `<button class="chip ${ui.ik === k ? 'on' : ''}" data-act="ikind" data-k="${k}">${l}</button>`).join('')}<button class="chip ${ui.iw ? 'on' : ''}" data-act="iweek">This week (week ${Math.max(1, w)})</button></div><div id="ilist">${ideasList()}</div>`;
    h += `<h2>Add your own idea</h2><div class="card"><div class="form"><div><label class="l" for="ni_t">Title</label><input id="ni_t"></div><div><label class="l" for="ni_k">Type</label><select id="ni_k"><option value="post">Post</option><option value="article">Article</option><option value="newsletter">Newsletter</option></select></div></div><label class="l" for="ni_b">Notes or draft</label><textarea id="ni_b" rows="4"></textarea><button class="b p" style="margin-top:8px" data-act="addidea">Add idea</button></div>`;
  } else if (ui.ctab === 'calendar') {
    const cal = M.calendar || { head: [], rows: [] }, ideas = allIdeas().filter(i => i.pb === pb);
    h += `<p class="sub" style="margin-top:12px">${esc(P.name)} content calendar from the playbook. ${w < 1 ? 'Week 1 starts ' + fmt(startOf(pb)) + '.' : 'You are in week ' + w + '.'} Change the start date on the Roadmap page.</p>` + cal.rows.map(r => {
      const n = +r[0], here = n === w, li = ideas.filter(i => i.kind === 'post' && i.week === n);
      return `<div class="card ${here ? 'hero' : ''}"><div class="row"><b class="grow">Week ${esc(r[0])}${r[1] && cal.head[1] === 'Theme' ? ' · ' + esc(r[1]) : ''}</b>${here ? '<span class="pill">This week</span>' : ''}</div><div class="kv">${cal.head.slice(1).map((hd, k) => (hd === 'Theme' ? '' : `<div><span class="d">${esc(hd)}</span>${esc(r[k + 1])}</div>`)).join('')}</div>${li.length ? `<div class="chips">${li.map(i => `<button class="chip" data-act="openidea" data-id="${i.id}">${esc(i.title.slice(0, 48))}${i.title.length > 48 ? '…' : ''} · ${esc(i.status)}</button>`).join('')}</div>` : ''}</div>`;
    }).join('');
  } else {
    h += `<h2>Content pillars</h2><div class="card"><ul class="plain">${M.pillars.map(p => `<li>${esc(p)}</li>`).join('')}</ul></div><h2>Channels and cadence</h2><div class="tw"><table class="lt"><thead><tr><th>Channel</th><th>Purpose</th><th>Cadence</th></tr></thead><tbody>${M.cadence.map(r => `<tr>${r.map(x => `<td>${esc(x)}</td>`).join('')}</tr>`).join('')}</tbody></table></div><h2>Templates and rules</h2>${M.templates.map(t => `<div class="card"><b>${esc(t[0])}</b><p style="margin:4px 0 0">${esc(t[1])}</p></div>`).join('')}<p class="sub">${esc(M.names || '')}</p>`;
  }
  return h;
}

/* ---------- search palette ---------- */
function palRender() {
  const p = ui.pal, box = $('#pal');
  box.hidden = !p.open; document.body.classList.toggle('modal', p.open || !!ui.term);
  if (!p.open) return;
  const r = search(p.q, 24); let res = r.res;
  if (/^(what|how|who|when|which|where|should|can)\b|\?$/i.test(p.q.trim())) res = [{ kind: 'ask', title: 'Ask: ' + p.q.trim(), text: 'Answer from your tracker and playbooks' }].concat(res);
  p.res = res; p.terms = r.terms; if (p.sel >= res.length) p.sel = 0;
  $('#palres').innerHTML = !p.q.trim() ? `<div class="pe">Search playbooks, scripts, content ideas, prospects and tasks. Questions work too: try “what do I need to do today?”</div>` : res.length ? res.map((c, i) => `<button class="pr ${i === p.sel ? 'on' : ''}" data-act="palgo" data-i="${i}"><span class="pk">${KIND[c.kind]}</span><span class="grow"><b>${hl(c.title, r.terms)}</b><span class="d">${hl(snippet(c.text || '', r.terms, 130), r.terms)}</span></span></button>`).join('') : `<div class="pe">No results for “${esc(p.q)}”.</div>`;
}
function openPal(q) { ui.pal = { open: true, q: q || '', sel: 0, res: [] }; $('#palq').value = ui.pal.q; palRender(); setTimeout(() => $('#palq').focus(), 20); }
function closePal() { ui.pal.open = false; palRender(); }
function goResult(c, terms) {
  if (c.kind === 'term') { ui.pal.open = false; palRender(); openTerm(c.id); return; }
  ui.menu = false; ui.pal.open = false; ui.focus = null;
  if (c.kind === 'ask') { ui.tab = 'dash'; ui.ask = ui.pal.q.trim(); }
  else if (c.kind === 'lib') { ui.tab = 'lib'; ui.libView = 'plan'; ui.libPb = c.pb; ui.libSec = String(c.sec); ui.libQ = (terms || []).join(' '); ui.focus = c.bi !== undefined ? `b-${c.pb}-${c.sec}-${c.bi}` : null; }
  else if (c.kind === 'script') { ui.tab = 'scripts'; ui.sq = ''; ui.sg = ''; ui.spf = 'all'; ui.focus = 'sc-' + c.id; }
  else if (c.kind === 'idea') { ui.tab = 'content'; ui.ctab = 'ideas'; ui.iq = ''; ui.ik = ''; ui.is = ''; ui.iw = false; ui.ipb = 'all'; ui.focus = 'id-' + c.id; }
  else if (c.kind === 'prospect') { ui.tab = 'pipe'; ui.pbf = 'all'; ui.q = c.title.split(' · ')[0]; ui.sf = ''; }
  else if (c.kind === 'partner') ui.tab = 'partners'; else ui.tab = 'today';
  palRender(); render();
  if (ui.focus) setTimeout(() => { const e = document.getElementById(ui.focus); if (e) e.scrollIntoView({ block: 'center' }); }, 30); else window.scrollTo(0, 0);
}

/* ---------- glossary, terms and roadmap ---------- */
const GLMAP = {}, GLNAMES = [];
G.gloss.forEach(g => (g.aka || []).concat(/^[A-Za-z0-9 \-]+$/.test(g.term) ? [g.term] : []).forEach(n => { if (/^\W/.test(n)) return; GLMAP[n.toLowerCase()] = g.k; GLNAMES.push(n); }));
GLNAMES.sort((a, b) => b.length - a.length);
const GLRE = GLNAMES.length ? new RegExp('\\b(' + GLNAMES.map(reEsc).join('|') + ')(?![\\w-])', 'gi') : null;
function gl(text) {
  let h = esc(text); if (!GLRE) return h; const seen = {};
  return h.replace(GLRE, m => { const k = GLMAP[m.toLowerCase()]; if (!k || seen[k]) return m; seen[k] = 1; return `<button type="button" class="term" data-act="term" data-k="${k}">${m}</button>`; });
}
const planBtn = l => `<button type="button" class="b" data-act="termgo" data-pb="${l[0]}" data-sec="${l[1]}">${esc(PB[l[0]].name.split(' ')[0])} §${l[1]}: ${esc(l[2])}</button>`;
function openTerm(k) { ui.term = k; renderTerm(); }
function closeTerm() { ui.term = ''; renderTerm(); }
function renderTerm() {
  const box = $('#termpop'); if (!box) return;
  const g = ui.term && G.gloss.find(x => x.k === ui.term);
  box.hidden = !g; document.body.classList.toggle('modal', !!g || ui.pal.open);
  if (!g) return;
  $('#termbody').innerHTML = `<div class="tb-h"><b>${esc(g.term)}</b><button class="b x" data-act="termclose" aria-label="Close">✕</button></div><p>${esc(g.def)}</p>${g.app ? `<p class="d">In the app: ${esc(g.app)}</p>` : ''}${g.links.length ? `<h4>Read more in the playbook</h4><div class="chips">${g.links.map(planBtn).join('')}</div>` : ''}<p style="margin:12px 0 0"><button class="b" data-act="termgloss">All terms</button></p>`;
}
function glossList() {
  const q = tokens(ui.gq);
  const l = G.gloss.filter(g => !q.length || q.every(t => (g.term + ' ' + g.def + ' ' + (g.aka || []).join(' ')).toLowerCase().includes(t))).sort((a, b) => a.term.localeCompare(b.term));
  return `<p class="d">${l.length} term${l.length === 1 ? '' : 's'}</p>` + (l.length ? l.map(g => `<div class="card gl ${ui.focus === 'gl-' + g.k ? 'focus' : ''}" id="gl-${g.k}"><b>${esc(g.term)}</b><p style="margin:4px 0 6px">${esc(g.def)}</p>${g.app ? `<p class="d">In the app: ${esc(g.app)}</p>` : ''}${g.links.length ? `<div class="chips">${g.links.map(planBtn).join('')}</div>` : ''}</div>`).join('') : '<div class="card d">No terms match.</div>');
}
function vGloss() {
  return `<p class="sub" style="margin-top:12px">Plain-English definitions of the words used in the checklists and playbooks. Underlined words in the checklists open these too.</p><div class="searchrow"><span class="si">${ic('search')}</span><input id="gq" type="search" value="${esc(ui.gq)}" placeholder="tracker, partner, ICP, consent…" autocomplete="off"></div><div id="glist">${glossList()}</div>`;
}
function vRoadmap() {
  const pb = S.settings.pb, P = PB[pb], R = G.roadmap[pb] || { phases: [], weeks: [], after: [], links: [] }, t = today(), pi = planInfo(pb, t), sd = startOf(pb);
  let tz = 'local time'; try { tz = Intl.DateTimeFormat().resolvedOptions().timeZone || tz; } catch (e) {}
  const endD = addD(sd, 89); let nm = addD(endD, 1); while (dow(nm) !== 1) nm = addD(nm, 1);
  let h = `<div class="card hero"><div class="txt"><b>${esc(P.name)} · ${esc(pi.label)}</b><span class="d">${pi.prep ? pi.toStart + ' day' + (pi.toStart === 1 ? '' : 's') + ' until Day 1. You can use the app now.' : pi.after ? 'Your 90 days ended ' + fmt(endD) + '.' : 'Day 90 is ' + fmt(endD) + '.'}</span>${bar(Math.min(90, Math.max(0, pi.n)), 90)}</div></div>`;
  h += `<h2>When does the plan start?</h2><div class="card"><label class="l" for="sd">Day 1 of the ${esc(P.name)} plan</label><div class="row"><input id="sd" type="date" data-act="startdate" data-pb="${pb}" value="${sd}" style="width:auto"><span class="d">${fmt(sd, { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</span></div><ul class="plain" style="margin-top:10px"><li><b>Today</b> is the date on your device (${esc(tz)}). It changes at midnight, and the Today page uses it.</li><li><b>Day 1</b> is the date you pick here. Both playbooks assume a Monday. Before it you are in prep, and the app works as normal.</li><li>Each playbook has its own start date. Switch playbook in the sidebar to set the other one.</li><li>To look at other days, use Yesterday, Tomorrow or the date picker at the top of the Today page.</li></ul>${R.calendar ? `<p class="d" style="margin-top:8px">${esc(R.calendar)}</p>` : ''}</div>`;
  h += `<h2>The three phases</h2>` + R.phases.map(ph => { const cur = pi.phase === ph.n, len = ph.to - ph.from + 1, prog = pi.n >= ph.from ? Math.min(len, pi.n - ph.from + 1) : 0; return `<div class="card ${cur ? 'hero' : ''}" style="display:block"><div class="row"><b class="grow">${esc(ph.label)}: ${esc(ph.name)}</b>${cur ? '<span class="pill">You are here</span>' : pi.n > ph.to ? '<span class="pill ok">Done</span>' : ''}</div><p style="margin:6px 0 0">${gl(ph.text)}</p>${bar(prog, len, pi.n > ph.to)}<span class="d">${fmt(addD(sd, ph.from - 1))} to ${fmt(addD(sd, ph.to - 1))}</span></div>`; }).join('');
  h += `<h2>Week by week</h2><div class="tw"><table class="lt"><thead><tr><th>Week</th><th>Milestone</th></tr></thead><tbody>${R.weeks.map((w, i) => `<tr class="${pi.week === i + 1 && !pi.after ? 'now' : ''}"><td class="c0">${esc(w[0])}</td><td>${gl(w[1])}</td></tr>`).join('')}</tbody></table></div>`;
  if (R.targets) h += `<h2>Targets</h2><div class="tw"><table class="lt"><thead><tr>${R.targets.head.map(x => `<th>${esc(x)}</th>`).join('')}</tr></thead><tbody>${R.targets.rows.map(r => `<tr>${r.map((x, i) => `<td class="${i ? '' : 'c0'}">${esc(x)}</td>`).join('')}</tr>`).join('')}</tbody></table></div>`;
  h += `<p class="d">${esc(R.targetsNote || '')}</p>`;
  h += `<h2>What happens after day 90</h2><div class="card"><ul class="plain">${R.after.map(x => `<li>${gl(x)}</li>`).join('')}</ul></div>`;
  h += `<h2>Day 90 review checklist</h2><div class="card">${G.d90.map((x, i) => { const k = `d90:${pb}:${sd}:${i}`; return `<label class="chk ${S.d90[k] ? 'done' : ''}" style="margin-top:${i ? 8 : 0}px"><input type="checkbox" data-act="d90" data-k="${k}" ${S.d90[k] ? 'checked' : ''}><span class="t"><span class="tx">${esc(x)}</span></span></label>`; }).join('')}</div>`;
  h += `<div class="card"><label class="l" for="nc_date">Start the next 90-day cycle on</label><div class="row"><input id="nc_date" type="date" value="${nm}" style="width:auto"><button class="b p" data-act="newcycle">Start new cycle</button></div><p class="d" style="margin-top:6px">Your prospects, history, XP and badges are kept. Only Day 1 of the plan changes, so the phases and the content calendar restart.</p></div>`;
  h += `<h2>Read the full plan</h2><div class="chips">${R.links.map(planBtn).join('')}</div>`;
  return h;
}

/* ---------- main render ---------- */
function render() {
  const y = window.scrollY;
  seedPlan(); renderHeader();
  try { $('#view').innerHTML = ({ dash: vDash, today: vToday, pipe: vPipe, partners: vPartners, content: vContent, scripts: vScripts, roadmap: vRoadmap, lib: vLib, progress: vProgress, review: vReview })[ui.tab](); }
  catch (e) { $('#view').innerHTML = '<div class="card">Something went wrong drawing this page: ' + esc(e.message) + '</div>'; console.error(e); }
  window.scrollTo(0, y);
}

/* ---------- actions ---------- */
const prospect = id => S.prospects.find(p => p.id === id);
function setStage(p, stage) { if (p.stage !== stage) { p.stage = stage; p.hist.push({ stage, date: today() }); } if (['Won', 'Lost'].includes(stage)) p.next = ''; }
function outKey(pb, ch) { if (ch !== 'LinkedIn' && ch !== 'Email') return null; return pb === 'nudge' ? 'sent' : ch === 'LinkedIn' ? 'req' : 'email'; }
function bump(k, n, date) { const d = day(date || today()); d.n[k] = Math.max(0, (d.n[k] || 0) + (n || 1)); }
function touch(p) {
  const t = today(); p.touches++;
  const gap = PB[p.pb].gaps[p.touches]; p.next = gap ? addD(t, gap) : '';
  if (p.stage === 'Discovered') setStage(p, 'Contacted');
  bump(p.touches === 1 ? (outKey(p.pb, p.ch) || 'fu') : 'fu');
}
function copy(txt, btn) {
  const done = () => { if (btn) { const o = btn.textContent; btn.textContent = 'Copied'; setTimeout(() => { btn.textContent = o; }, 1200); } };
  const fb = () => { const a = document.createElement('textarea'); a.value = txt; document.body.appendChild(a); a.select(); try { document.execCommand('copy'); done(); } catch (e) {} a.remove(); };
  try { navigator.clipboard.writeText(txt).then(done, fb); } catch (e) { fb(); }
}
function download() {
  const b = new Blob([JSON.stringify(S, null, 1)], { type: 'application/json' }), a = document.createElement('a');
  a.href = URL.createObjectURL(b); a.download = 'infinity-outreach-backup-' + today() + '.json'; a.click(); setTimeout(() => URL.revokeObjectURL(a.href), 2000);
}
function restore(o) {
  if (!o || !Array.isArray(o.prospects)) { alert('That is not a valid backup.'); return; }
  if (!confirm('Replace everything in the app with this backup?')) return;
  S = norm(o); S.meta = {}; evalBadges(true); save(); render(); toast('Backup restored');
}
const val = id => ($('#' + id) ? $('#' + id).value.trim() : '');
const ideaById = id => allIdeas().find(i => i.id === id);
const idState = id => S.ideaState[id] || (S.ideaState[id] = {});
function doAsk(q) { ui.ask = (q || '').trim(); render(); }

document.addEventListener('click', e => {
  const b = e.target.closest('[data-act]'); if (!b) return;
  const a = b.dataset.act, id = b.dataset.id, t = today(), pb = S.settings.pb;
  const nav = fn => { fn(); render(); };
  switch (a) {
    case 'tab': ui.tab = b.dataset.k; if (ui.tab === 'today') ui.date = ''; ui.menu = false; ui.focus = null; render(); window.scrollTo(0, 0); return;
    case 'menu': ui.menu = !ui.menu; renderHeader(); return;
    case 'theme': { const k = b.dataset.k; try { if (k === 'auto') localStorage.removeItem('infinity_theme'); else localStorage.setItem('infinity_theme', k); } catch (e) {} if (k === 'auto') delete document.documentElement.dataset.theme; else document.documentElement.dataset.theme = k; renderHeader(); return; }
    case 'pb': S.settings.pb = b.dataset.k; ui.libPb = ''; save(); render(); return;
    case 'copy': copy(b.dataset.t, b); return;
    case 'export': download(); return;
    case 'search': openPal(''); return;
    case 'palclose': closePal(); return;
    case 'palgo': goResult(ui.pal.res[+b.dataset.i], ui.pal.terms); return;
    case 'ask': doAsk($('#ask_q').value); return;
    case 'askchip': doAsk(b.dataset.q); return;
    case 'clearask': ui.ask = ''; render(); return;
    case 'gosearch': { const r = search(b.dataset.q, 6); goResult(r.res[+b.dataset.i], r.terms); return; }
    case 'libsec': nav(() => { ui.libSec = b.dataset.s; ui.focus = null; }); window.scrollTo(0, 0); return;
    case 'libview': nav(() => { ui.libView = b.dataset.k; }); return;
    case 'libpb': nav(() => { ui.libPb = b.dataset.k; ui.libSec = ''; }); return;
    case 'ctab': nav(() => { ui.ctab = b.dataset.k; }); return;
    case 'ikind': ui.ik = b.dataset.k; render(); return;
    case 'iweek': ui.iw = !ui.iw; render(); return;
    case 'sgroup': ui.sg = b.dataset.k; render(); return;
    case 'openidea': goResult({ kind: 'idea', id }, []); return;
    case 'editscript': ui.edit = 's:' + id; render(); return;
    case 'editidea': ui.edit = 'i:' + id; render(); return;
    case 'canceledit': ui.edit = null; render(); return;
    case 'fill': ui.fill = id; ui.fillVals = {}; render(); return;
    case 'closefill': ui.fill = null; render(); return;
    case 'copyfilled': { const s = allScripts().find(x => x.id === id); copy(fillText(s.body), b); return; }
    case 'clearfocus': return;
    case 'dnav': ui.date = addD(vdate(), +b.dataset.d); if (ui.date === today()) ui.date = ''; render(); return;
    case 'dtoday': ui.date = ''; render(); return;
    case 'gotoday': ui.date = b.dataset.date === today() ? '' : b.dataset.date; ui.tab = 'today'; render(); window.scrollTo(0, 0); return;
    case 'term': openTerm(b.dataset.k); return;
    case 'termclose': closeTerm(); return;
    case 'termgo': closeTerm(); goResult({ kind: 'lib', pb: b.dataset.pb, sec: +b.dataset.sec }, []); return;
    case 'termgloss': closeTerm(); ui.tab = 'lib'; ui.libView = 'gloss'; ui.gq = ''; ui.focus = null; ui.menu = false; render(); window.scrollTo(0, 0); return;
  }
  const map = {
    touch: () => touch(prospect(id)),
    replied: () => { const p = prospect(id); setStage(p, 'Replied'); p.next = ''; bump('reply'); },
    ctr: () => bump(b.dataset.k, +b.dataset.v, vdate()),
    newcycle: () => { const v = val('nc_date'); if (!v) return false; S.settings.start[pb] = v; ui.date = ''; toast('New cycle starts ' + fmt(v)); },
    del: () => { if (!confirm('Delete this prospect?')) return false; S.prospects = S.prospects.filter(p => p.id !== id); },
    add: () => {
      const name = val('f_name'); if (!name) { $('#f_name').focus(); return false; }
      const sc = val('f_score');
      const p = { id: uid(), pb, name, email: val('f_email'), phone: val('f_phone'), li: val('f_li'), biz: val('f_biz'), seg: val('f_seg'), src: val('f_src'), sig: val('f_sig'), score: sc === '' ? '' : Math.max(0, Math.min(100, +sc)), ch: val('f_ch'), basis: val('f_basis'), stage: val('f_stage'), touches: 0, next: '', note: '', created: t, hist: [] };
      p.hist.push({ stage: p.stage, date: t });
      if (p.stage !== 'Discovered') { p.touches = 1; p.next = PB[pb].gaps[1] ? addD(t, PB[pb].gaps[1]) : ''; const k = outKey(pb, p.ch); if (k) bump(k); }
      bump('res'); S.prospects.unshift(p);
    },
    addp: () => { const n = val('p_name'); if (!n) return false; S.partners.unshift({ id: uid(), name: n, type: val('p_type'), next: val('p_next'), sent: 0, rec: 0, last: '' }); },
    pn: () => { const p = S.partners.find(x => x.id === id); p[b.dataset.f] = (p[b.dataset.f] || 0) + 1; },
    ptouch: () => { S.partners.find(x => x.id === id).last = t; bump('partner'); },
    delp: () => { if (!confirm('Delete this partner?')) return false; S.partners = S.partners.filter(p => p.id !== id); },
    addtask: () => { const x = val('t_text'); if (!x) { $('#t_text').focus(); return false; } S.tasks.push({ id: uid(), text: x, due: val('t_due') || t, done: false, doneOn: '', src: 'manual', note: '', created: t }); },
    deltask: () => { S.tasks = S.tasks.filter(x => x.id !== id); },
    snooze: () => { S.tasks.find(x => x.id === id).due = nextWorking(t); },
    carry: () => { const y = b.dataset.y; PB[pb].core.forEach(c => { if (!(S.days[y].c[ck(pb, c[0])])) S.tasks.push({ id: uid(), text: 'Missed ' + fmt(y, { weekday: 'short' }) + ': ' + c[1], due: t, done: false, doneOn: '', src: 'carry', note: '', created: t, core: pb + ':' + c[0] }); }); S.carried[y] = true; },
    dismisscarry: () => { S.carried[b.dataset.y] = true; },
    addgoal: () => { const ti = val('g_title'); if (!ti) { $('#g_title').focus(); return false; } S.goals.push({ id: uid(), title: ti, metric: val('g_metric'), target: Math.max(1, +val('g_target') || 1), period: val('g_period') }); },
    delgoal: () => { S.goals = S.goals.filter(g => g.id !== id); },
    addscript: () => { const ti = val('s_title'), bo = val('s_body'); if (!ti || !bo) return false; S.scripts.push({ id: 'u' + uid(), pb, group: val('s_group') || 'My scripts', title: ti, body: bo }); },
    delscript: () => { if (!confirm('Delete this script?')) return false; S.scripts = S.scripts.filter(s => s.id !== id); },
    savescriptedit: () => {
      const ti = val('se_t'), bo = $('#se_b').value, g = val('se_g') || 'My scripts'; if (!ti || !bo.trim()) return false;
      const cs = C.scripts.find(s => s.id === id);
      if (cs) { if (ti === cs.title && bo === cs.body && g === cs.group) delete S.scriptEdits[id]; else S.scriptEdits[id] = { title: ti, body: bo, group: g }; }
      else { const u = S.scripts.find(s => s.id === id); u.title = ti; u.body = bo; u.group = g; }
      ui.edit = null; toast('Script saved');
    },
    resetscript: () => { delete S.scriptEdits[id]; ui.edit = null; },
    savescript: () => {
      const sec = (C.lib[b.dataset.lp] || []).find(s => String(s.n) === b.dataset.s), blk = sec.blocks[+b.dataset.b];
      let title = 'From ' + PB[b.dataset.lp].name + ' §' + sec.n, i = +b.dataset.b - 1; if (sec.blocks[i] && sec.blocks[i].t === 'h') title = sec.blocks[i].x.replace(/[:()]+$/, '');
      S.scripts.push({ id: 'u' + uid(), pb: b.dataset.lp, group: 'My scripts', title, body: blk.x }); toast('Saved to Scripts');
    },
    istatus: () => 0,
    saveidea: () => {
      const ti = val('ie_t'), bo = $('#ie_b').value; if (!ti) return false;
      const bi = C.ideas.find(i => i.id === id);
      if (bi) { const st = idState(id); st.title = ti === bi.title ? undefined : ti; st.body = bo === bi.body ? undefined : bo; if (st.title === undefined) delete st.title; if (st.body === undefined) delete st.body; }
      else { const u = S.ideasUser.find(i => i.id === id); u.title = ti; u.body = bo; }
      ui.edit = null; toast('Idea saved');
    },
    resetidea: () => { const st = S.ideaState[id] || {}; delete st.title; delete st.body; ui.edit = null; },
    addidea: () => { const ti = val('ni_t'); if (!ti) { $('#ni_t').focus(); return false; } S.ideasUser.unshift({ id: 'u' + uid(), pb, kind: val('ni_k'), title: ti, body: $('#ni_b').value, week: 0 }); },
    delidea: () => { if (!confirm('Delete this idea?')) return false; S.ideasUser = S.ideasUser.filter(i => i.id !== id); delete S.ideaState[id]; }
  };
  if (map[a]) act(map[a]);
});

document.addEventListener('change', e => {
  const b = e.target.closest('[data-act]'); if (!b) return;
  const a = b.dataset.act, id = b.dataset.id, t = today(), pb = S.settings.pb;
  if (a === 'pbf') { ui.pbf = b.value; render(); return; }
  if (a === 'dpick') { ui.date = !b.value || b.value === today() ? '' : b.value; render(); return; }
  if (a === 'gmetric') { const h = $('#g_hint'); if (h) h.textContent = METRIC_HELP[b.value] || ''; return; }
  if (a === 'sf') { ui.sf = b.value; render(); return; }
  if (a === 'spf') { ui.spf = b.value; ui.sg = ''; render(); return; }
  if (a === 'ipb') { ui.ipb = b.value; render(); return; }
  if (a === 'is') { ui.is = b.value; render(); return; }
  if (a === 'revwk') { ui.revWk = b.value; render(); return; }
  if (a === 'libselect') { ui.libSec = b.value; ui.focus = null; render(); window.scrollTo(0, 0); return; }
  if (a === 'importfile') { const f = b.files[0]; if (!f) return; const r = new FileReader(); r.onload = () => { try { restore(JSON.parse(r.result)); } catch (x) { alert('That is not a valid backup.'); } }; r.readAsText(f); b.value = ''; return; }
  const map = {
    chk: () => { day(vdate()).c[ck(pb, b.dataset.k)] = b.checked; },
    startdate: () => { if (b.value) S.settings.start[b.dataset.pb] = b.value; },
    d90: () => { if (b.checked) S.d90[b.dataset.k] = true; else delete S.d90[b.dataset.k]; },
    pbasis: () => { prospect(id).basis = b.value; },
    tdue: () => { if (b.value) S.tasks.find(x => x.id === id).due = b.value; },
    tt: () => { const x = S.tasks.find(q => q.id === id); x.done = b.checked; x.doneOn = b.checked ? t : ''; },
    stage: () => setStage(prospect(id), b.value),
    due: () => { prospect(id).next = b.value; },
    rec: () => { if (b.checked) S.rec[b.dataset.k] = true; else delete S.rec[b.dataset.k]; },
    launch: () => { if (b.checked) S.launch[b.dataset.k] = true; else delete S.launch[b.dataset.k]; },
    istatus: () => {
      const i = ideaById(id), st = idState(id), was = st.status || 'Idea'; st.status = b.value;
      if (b.value === 'Published' && was !== 'Published' && i.kind === 'post' && !st.counted) { bump('post'); st.counted = true; }
      if (b.value !== 'Published') { /* keep counted flag so toggling does not double count */ }
    }
  };
  if (map[a]) act(map[a]);
});

document.addEventListener('input', e => {
  const id = e.target.id;
  if (id === 'q') { ui.q = e.target.value; const l = $('#plist'); if (l) { l.innerHTML = plist(); $('#pcount').textContent = filtered().length; } return; }
  if (id === 'libq') { ui.libQ = e.target.value; ui.focus = null; if (tokens(ui.libQ).length) ui.libSec = ui.libSec === 'all' ? 'all' : ''; const l = $('#libbody'); if (l) l.innerHTML = libBody(); return; }
  if (id === 'sq') { ui.sq = e.target.value; const l = $('#slist'); if (l) l.innerHTML = scriptsList(); return; }
  if (id === 'iq') { ui.iq = e.target.value; const l = $('#ilist'); if (l) l.innerHTML = ideasList(); return; }
  if (id === 'gq') { ui.gq = e.target.value; const l = $('#glist'); if (l) l.innerHTML = glossList(); return; }
  if (id === 'palq') { ui.pal.q = e.target.value; ui.pal.sel = 0; palRender(); return; }
  const b = e.target.closest('[data-act]'); if (!b) return;
  const a = b.dataset.act, i = b.dataset.id;
  if (a === 'fillv') { ui.fillVals[b.dataset.k] = b.value; const s = allScripts().find(x => x.id === ui.fill), p = $('#fillprev'); if (s && p) p.textContent = fillText(s.body); return; }
  if (a === 'pf') { prospect(i)[b.dataset.f] = b.value.trim(); save(); return; }
  if (a === 'tnote') { S.tasks.find(x => x.id === i).note = b.value; save(); return; }
  if (a === 'plan') { const k = nextWorking(vdate()); const arr = S.plan[k] || (S.plan[k] = ['', '', '']); arr[+b.dataset.i] = b.value; delete S.planSeeded[k]; }
  else if (a === 'note') prospect(i).note = b.value;
  else if (a === 'pnext') S.partners.find(x => x.id === i).next = b.value;
  else if (a === 'rev') { const w = b.dataset.wk, pb = S.settings.pb; ((S.reviews[w] = S.reviews[w] || {})[pb] = S.reviews[w][pb] || {})[b.dataset.i] = b.value; }
  else return;
  save();
});
document.addEventListener('change', e => { if (e.target.dataset && e.target.dataset.act === 'rev') { evalBadges(false); save(); renderHeader(); } });

document.addEventListener('keydown', e => {
  const p = ui.pal;
  if (e.key === 'Escape' && ui.term) { closeTerm(); return; }
  if (e.target.id === 'ask_q' && e.key === 'Enter') { e.preventDefault(); doAsk(e.target.value); return; }
  if (p.open) {
    if (e.key === 'Escape') { closePal(); return; }
    if (e.key === 'ArrowDown') { e.preventDefault(); p.sel = Math.min(p.res.length - 1, p.sel + 1); palRender(); const el = $('.pr.on'); if (el) el.scrollIntoView({ block: 'nearest' }); return; }
    if (e.key === 'ArrowUp') { e.preventDefault(); p.sel = Math.max(0, p.sel - 1); palRender(); const el = $('.pr.on'); if (el) el.scrollIntoView({ block: 'nearest' }); return; }
    if (e.key === 'Enter' && p.res[p.sel]) { e.preventDefault(); goResult(p.res[p.sel], p.terms); return; }
    return;
  }
  const typing = /^(INPUT|TEXTAREA|SELECT)$/.test((e.target.tagName || ''));
  if ((e.key === '/' && !typing) || ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k')) { e.preventDefault(); openPal(''); }
});

document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'visible') pull(false); else if (dirty) push(); });
window.addEventListener('online', () => { if (dirty) push(); else pull(false); });
window.addEventListener('pagehide', () => { if (dirty) push(); });

/* ---------- start ---------- */
evalBadges(true); render(); setStatus('Connecting…'); pull(true);
let lastDay = today(); setInterval(() => { if (today() !== lastDay) { lastDay = today(); render(); } }, 60000);
})();
