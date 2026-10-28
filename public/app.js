(function () {
'use strict';

/* ---------- helpers ---------- */
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
    counters: ['req', 'email', 'reply', 'call', 'fu', 'partner', 'post'],
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
    review: ['What did I complete?', 'Which channel gave useful conversations?', 'Which problem got the most interest?', 'Which objection repeated?', 'What changes in the offer?', 'Stop, start, continue?', 'Next week’s three priorities?'],
    scripts: [
      ['Connection request', 'Hi {Name}, I help small Melbourne {type of firm} cut admin. Your recent post on {topic} caught my eye. Would be good to connect.'],
      ['They accept (send next day)', 'Thanks for connecting, {Name}. Quick question, no pitch: when a new enquiry comes in at {Business}, how does it get from the inbox to someone following it up? I’m mapping how firms your size handle this and happy to share what I’m seeing.'],
      ['They share a problem', 'That’s useful, thanks. A lot of firms land in the same spot. Would a 20-minute call make sense? I’ll ask how it works today and tell you honestly if automation is the right fix. Does Tuesday or Thursday suit?'],
      ['“What do you do / how much?”', 'Short version: I set up simple automation on tools you already use, fixed price from ${X}, live in a few weeks, no lock-in. The useful next step is a 20-minute look at your actual process. When suits?'],
      ['“We can do it ourselves”', 'Often true, and a good option. If you like, I’ll review your plan and flag the parts that usually break. No charge.'],
      ['“Too expensive”', 'Fair. Let’s put your weekly hours next to the price and see if it pays back. If it doesn’t, don’t do it.'],
      ['“Not now”', 'No problem at all. Can I check back in {month}?'],
      ['“What about privacy?”', 'Good question. Before we start I document what data touches which system and who has access, then you approve it.'],
      ['Gone quiet (day 4)', 'Hi {Name}, no rush. I put together a one-page example of how a {type of firm} could track enquiries and follow-ups in one place. Want me to send it?'],
      ['Final message (day 21)', 'I’ll close this out so I’m not cluttering your inbox. If {workflow} becomes a priority, I’m at optimai.com.au. Thanks for your time.'],
      ['Email: introduction', 'Subject: Quick question about {Business} enquiries\n\nHi {Name}, I’m Aaron from OptimAI in Melbourne. I help small {type of firm} cut repetitive admin. I noticed {Business} takes enquiries through {form/phone}, and wondered how they get followed up once they arrive. If it’s already smooth, ignore this. If not, I can give a 15-minute outside view, free.\n\nAaron, OptimAI, {business address}\nNot interested? Reply “unsubscribe”.'],
      ['After a call', 'Thanks for the time today. Summary: {process}, {hours per week}, {tools}, {concerns}. My recommendation: {option}. Next step: {audit or proposal} by {date}. Tell me if I got anything wrong.'],
      ['Partner outreach', 'Hi {Name}, I build automations for the small businesses your clients resemble. When your clients mention admin overload, I’d like to be someone you can hand them to. Open to a 20-minute chat on whether that’d be useful to you?']]
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
    review: ['What did I finish?', 'What did I miss and why?', 'What produced replies or calls?', 'What didn’t work?', 'What do I continue, stop or change?', 'What are next week’s three priorities?'],
    scripts: [
      ['First message (starter)', 'Hi {Name}, I noticed {one specific verified observation, with where you saw it}. {One relevant question about it}? No pitch, just curious how you’re handling it.'],
      ['Email: first message (starter)', 'Subject: {Specific observation}\n\nHi {Name}, I noticed {one specific verified observation}. {One relevant question}?\n\n{Your name}, {Business}, ABN {ABN}\nNot relevant? Reply “unsubscribe” and I won’t contact you again.'],
      ['Follow-up day 4 (starter)', 'Hi {Name}, following up on my note about {observation}. Happy to share {one useful, specific thing} if it helps. No worries if the timing’s off.'],
      ['Follow-up day 10, last (starter)', 'Hi {Name}, last note from me on {topic} so I’m not cluttering your inbox. If it becomes a priority, you know where I am.'],
      ['Same-day call recap (starter)', 'Thanks for the time today, {Name}. What I heard: {goal}, {constraints}, {timeline}. Next step: {action} by {date}. Tell me if I got anything wrong.'],
      ['Partner approach (starter)', 'Hi {Name}, I’ve been following {their work}. I work with {type of founder}, and your clients look like a good fit for a referral both ways. Open to a 20-minute intro call?']]
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
  ['lv5', '☔', 'Rainmaker', 'Reach level 5', s => s.lv >= 5]
];

const METRICS = Object.assign({}, CT, { prospects: 'Prospects added', proposal: 'Proposals sent', won: 'Wins' });

/* ---------- state ---------- */
const defaultGoals = () => [
  { id: uid(), title: 'Land the first client', metric: 'won', target: 1, period: 'all' },
  { id: uid(), title: 'Book 5 discovery calls', metric: 'call', target: 5, period: 'all' }];

function norm(o) {
  o = o || {};
  const s = Object.assign({ prospects: [], partners: [], days: {}, reviews: {}, tasks: [], plan: {}, planSeeded: {}, rec: {}, launch: {}, scripts: [], badges: {}, carried: {}, meta: {}, updatedAt: 0 }, o);
  s.settings = Object.assign({ pb: 'optimai', launchMon: '2026-11-02' }, s.settings || {});
  if (!PB[s.settings.pb]) s.settings.pb = 'optimai';
  if (!Array.isArray(s.goals)) s.goals = defaultGoals();
  ['prospects', 'partners', 'tasks', 'scripts'].forEach(k => { if (!Array.isArray(s[k])) s[k] = []; });
  s.prospects.forEach(p => {
    p.id = p.id || uid(); p.pb = PB[p.pb] ? p.pb : 'optimai'; p.touches = p.touches || 0;
    if (p.score === undefined) p.score = '';
    if (!Array.isArray(p.hist) || !p.hist.length) p.hist = [{ stage: p.stage || 'Discovered', date: '' }];
    p.created = p.created || '';
  });
  s.partners.forEach(p => { p.id = p.id || uid(); });
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

const ui = { tab: 'today', q: '', sf: '', pbf: 'cur', revWk: '' };
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
    launch: Object.values(S.launch).filter(Boolean).length, goalsDone
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
  const t = today(), pb = S.settings.pb, bx = calcXP(), bc = coreDone(t, pb);
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
      (S.plan[dt] || []).forEach(x => { if (x && x.trim()) S.tasks.push({ id: uid(), text: x.trim(), due: dt, done: false, doneOn: '', src: 'plan' }); });
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

function renderHeader() {
  const st = stats(), pb = S.settings.pb;
  document.documentElement.dataset.pb = pb;
  $('#pbsw').innerHTML = PBS.map(k => `<button data-act="pb" data-k="${k}" class="${pb === k ? 'on' : ''}">${esc(PB[k].name)}</button>`).join('');
  $('#xpbox').innerHTML = `<div class="l"><span>Lv ${st.lv} · ${st.L.name}</span><span>🔥 ${st.streak} · ${st.xp} XP</span></div>${bar(st.xp - st.L.cur, st.L.next - st.L.cur)}`;
  $('#nav').innerHTML = TABS.map(([k, l]) => `<button data-act="tab" data-k="${k}" class="${ui.tab === k ? 'on' : ''}">${l}</button>`).join('');
}

function taskRow(t) {
  const late = !t.done && t.due < today();
  return `<div class="card ${t.done ? 'done' : ''} ${late ? 'late' : ''} row"><label class="chk grow"><input type="checkbox" data-act="tt" data-id="${t.id}" ${t.done ? 'checked' : ''}><span class="t"><span class="tx">${esc(t.text)}</span>${late ? `<span class="tag">Carried over from ${fmt(t.due)}</span>` : ''}</span></label>${t.done ? '' : `<button class="b x" data-act="snooze" data-id="${t.id}">Tomorrow</button>`}<button class="b x" data-act="deltask" data-id="${t.id}" aria-label="Delete task">✕</button></div>`;
}
function dueList() {
  const t = today(); return S.prospects.filter(p => p.next && p.next <= t && !['Won', 'Lost'].includes(p.stage)).sort((a, b) => a.next < b.next ? -1 : 1);
}

function vToday() {
  const t = today(), pb = S.settings.pb, P = PB[pb], d = day(t), st = stats();
  const mins = coreMins(t, pb), pct = Math.round(mins / 60 * 100), full = P.core.every(c => d.c[ck(pb, c[0])]);
  const nxt = nextWorking(t), plan = S.plan[nxt] || ['', '', ''];
  const tasks = todaysTasks(), open = tasks.filter(x => !x.done).length;
  const due = dueList();
  const row = (c, ex) => `<label class="card chk ${d.c[ck(pb, c[0])] ? 'done' : ''}"><input type="checkbox" data-act="chk" data-k="${c[0]}" ${d.c[ck(pb, c[0])] ? 'checked' : ''}><span class="t"><b>${c[1]}</b><span class="mins">${ex ? '+' : ''}${c[2]} min</span><span class="d">${esc(c[3])}</span></span></label>`;
  let h = `<div class="card hero"><div class="ring" style="--p:${pct}"><span>${pct}%</span></div><div class="txt"><b>${fmt(t, { weekday: 'long', day: 'numeric', month: 'long' })}</b><span class="d">${esc(P.focus[dow(t)])}</span><div class="chips"><span class="chip">🔥 ${st.streak}-day streak</span><span class="chip">⭐ ${dayXP(t)} XP today</span><span class="chip">${full ? '✅ Core done' : mins + ' of 60 min'}</span></div></div></div>`;

  // yesterday missed
  const y = prevWorking(t), yd = S.days[y];
  if (yd && !S.carried[y] && !coreDone(y, pb) && (Object.values(yd.c).some(Boolean) || Object.values(yd.n).some(Boolean))) {
    const miss = P.core.filter(c => !yd.c[ck(pb, c[0])]);
    h += `<div class="card row"><div class="grow"><b>Missed on ${fmt(y)}</b><span class="d">${miss.map(c => esc(c[1])).join(', ')}</span></div><button class="b p" data-act="carry" data-y="${y}">Carry over to today</button><button class="b x" data-act="dismisscarry" data-y="${y}">Dismiss</button></div>`;
  }

  h += `<h2>Priorities and carry-overs <small>${open} open</small></h2>`;
  h += tasks.length ? tasks.map(taskRow).join('') : '<div class="card d">Nothing queued. Add a task below or plan tomorrow’s three at the bottom.</div>';
  h += `<div class="row"><input id="t_text" class="grow" placeholder="Add a task…" aria-label="Task text"><input id="t_due" type="date" value="${t}" style="width:150px" aria-label="Due date"><button class="b p" data-act="addtask">Add</button></div>`;

  h += `<h2>Follow-ups due <small>${due.length}</small></h2>`;
  h += due.length ? due.map(p => `<div class="card due row"><div class="grow"><b>${esc(p.name)}</b> ${pbTag(p.pb)}<span class="d">${esc(p.biz)} · ${p.stage} · touch ${p.touches} of ${PB[p.pb].max} · due ${fmt(p.next)}</span></div><button class="b p" data-act="touch" data-id="${p.id}">Log touch</button><button class="b" data-act="replied" data-id="${p.id}">They replied</button></div>`).join('') : '<div class="card d">Nothing due. Add prospects on the Pipeline tab.</div>';

  h += `<h2>Core 60 minutes <small>${esc(P.name)}</small></h2>` + bar(mins, 60, full) + P.core.map(c => row(c, false)).join('');
  h += `<h2>Extra on a 120-minute day</h2>` + P.extra.map(c => row(c, true)).join('');

  h += `<h2>Today’s scorecard</h2><div class="grid">` + P.counters.map(k => `<div class="card ctr"><div class="d">${CT[k]}</div><div class="n">${d.n[k] || 0}</div><button data-act="ctr" data-k="${k}" data-v="-1" aria-label="Minus ${CT[k]}">−</button><button data-act="ctr" data-k="${k}" data-v="1" aria-label="Plus ${CT[k]}">+</button></div>`).join('') + `</div>`;

  h += `<h2>Next working day’s three actions <small>${fmt(nxt)}</small></h2><p class="sub">These appear in your priorities list on ${fmt(nxt)}. Anything unfinished keeps carrying over until you tick it or move it.</p>`;
  h += [0, 1, 2].map(i => `<input data-act="plan" data-i="${i}" value="${esc(plan[i] || '')}" placeholder="${i + 1}." style="margin-bottom:6px" aria-label="Action ${i + 1}">`).join('');
  h += `<details class="card" style="margin-top:14px"><summary>Rules that never change (${esc(P.name)})</summary><ul>${P.rules.map(r => `<li>${esc(r)}</li>`).join('')}</ul></details>`;
  return h;
}

const scoreInfo = s => s === '' || s == null ? '' : (+s >= 75 ? '<span class="pill ok">Score ' + s + ' · approach</span>' : +s >= 55 ? '<span class="pill warn">Score ' + s + ' · nurture</span>' : '<span class="pill bad">Score ' + s + ' · drop</span>');
function pCard(p) {
  const warn = p.ch === 'Email' && p.basis.startsWith('n/a') ? '<span class="pill bad">Add email basis</span>' : '';
  return `<div class="card"><div class="row"><div class="grow"><b>${esc(p.name)}</b> ${pbTag(p.pb)}<span class="d">${esc(p.biz)} · ${esc(p.seg)} · via ${esc(p.ch)}</span></div>
 <select data-act="stage" data-id="${p.id}" style="width:auto" aria-label="Stage">${STAGES.map(s => `<option ${s === p.stage ? 'selected' : ''}>${s}</option>`).join('')}</select>
 <input type="date" data-act="due" data-id="${p.id}" value="${p.next || ''}" style="width:150px" aria-label="Next follow-up">
 <button class="b" data-act="touch" data-id="${p.id}">Log touch</button><button class="b x" data-act="del" data-id="${p.id}" aria-label="Delete">✕</button></div>
 <div class="chips" style="margin:6px 0 2px">${scoreInfo(p.score)}${warn}<span class="pill">Touches ${p.touches}/${PB[p.pb].max}</span></div>
 <span class="d">Source: ${esc(p.src) || '—'} · Signal: ${esc(p.sig) || '—'} · Basis: ${esc(p.basis)}</span>
 <textarea data-act="note" data-id="${p.id}" placeholder="Notes: workflow, hours per week, tools, objections" style="margin-top:6px;min-height:44px">${esc(p.note)}</textarea></div>`;
}
function filtered() {
  const pb = S.settings.pb, q = ui.q.toLowerCase();
  return S.prospects.filter(p => (ui.pbf === 'all' || p.pb === pb) && (!ui.sf || p.stage === ui.sf) && (!q || (p.name + ' ' + p.biz + ' ' + p.src + ' ' + p.sig + ' ' + p.note).toLowerCase().includes(q)));
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

function vScripts() {
  const pb = S.settings.pb, P = PB[pb], mine = S.scripts.filter(s => s.pb === pb);
  const card = (t, b, id) => `<div class="card scr"><div class="row"><b class="grow">${esc(t)}</b><button class="b" data-act="copy" data-t="${esc(b)}">Copy</button>${id ? `<button class="b x" data-act="delscript" data-id="${id}" aria-label="Delete">✕</button>` : ''}</div><pre>${esc(b)}</pre></div>`;
  return `<p class="sub">Replace the {placeholders}. Add a specific, true detail before you send. ${pb === 'nudge' ? 'These are starter templates; edit them to your voice.' : ''}</p>` +
    P.scripts.map(s => card(s[0], s[1])).join('') +
    `<h2>Your own scripts <small>${esc(P.name)}</small></h2>` + mine.map(s => card(s.title, s.body, s.id)).join('') +
    `<div class="card"><label class="l">Title</label><input id="s_title"><label class="l" style="margin-top:6px">Message</label><textarea id="s_body"></textarea><button class="b p" style="margin-top:8px" data-act="addscript">Save script</button></div>`;
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
  h += `<div class="form"><div><label class="l">Goal</label><input id="g_title" placeholder="e.g. 3 proposals this month"></div><div><label class="l">Measure</label><select id="g_metric">${Object.keys(METRICS).map(k => `<option value="${k}">${METRICS[k]}</option>`).join('')}</select></div><div><label class="l">Target</label><input id="g_target" type="number" min="1" value="5"></div><div><label class="l">Period</label><select id="g_period"><option value="week">This week</option><option value="month">This month</option><option value="all">All time</option></select></div></div><button class="b p" data-act="addgoal">Add goal</button>`;
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
  const pb = S.settings.pb, P = PB[pb], t = today(), lm = S.settings.launchMon;
  let h = `<p class="sub">${esc(P.name)} · ${esc(P.tag)}. Use the switcher at the top to view the other playbook.</p>`;
  h += `<h2>Weekly rhythm</h2><table>${[1, 2, 3, 4, 5].map(i => `<tr class="${dow(t) === i ? 'now' : ''}"><td style="white-space:nowrap"><b>${['', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri'][i]}</b></td><td>${esc(P.focus[i])}</td></tr>`).join('')}</table><p class="sub">Urgent follow-ups and active opportunities override the day’s theme.</p>`;
  h += `<h2>Rules that never change</h2><div class="card"><ul style="margin:0;padding-left:18px">${P.rules.map(r => `<li>${esc(r)}</li>`).join('')}</ul></div>`;
  if (P.decision.length) h += `<h2>Decision rules</h2><div class="card"><ul style="margin:0;padding-left:18px">${P.decision.map(r => `<li>${esc(r)}</li>`).join('')}</ul></div>`;
  h += `<h2>Recurring tasks <small>tick when done for the period</small></h2>`;
  const lab = { week: 'This week', fortnight: 'This fortnight', month: 'This month', quarter: 'This quarter' };
  ['week', 'fortnight', 'month', 'quarter'].forEach(per => {
    const items = P.recurring.filter(r => r[1] === per); if (!items.length) return;
    h += `<div class="card"><b>${lab[per]}</b>` + items.map(r => { const k = ck(pb, r[0]) + ':' + periodKey(per); return `<label class="chk ${S.rec[k] ? 'done' : ''}" style="margin-top:8px"><input type="checkbox" data-act="rec" data-k="${k}" ${S.rec[k] ? 'checked' : ''}><span class="t"><span class="tx">${esc(r[2])}</span></span></label>`; }).join('') + `</div>`;
  });
  h += `<h2>First 30 days</h2><div class="row" style="margin-bottom:8px"><label class="l grow" style="margin:0">Week 1 starts on (Monday)</label><input type="date" data-act="launchMon" value="${lm}" style="width:160px"></div>`;
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

function render() {
  const y = window.scrollY;
  seedPlan(); renderHeader();
  try { $('#view').innerHTML = ({ today: vToday, pipe: vPipe, partners: vPartners, scripts: vScripts, progress: vProgress, review: vReview, book: vBook })[ui.tab](); }
  catch (e) { $('#view').innerHTML = '<div class="card">Something went wrong drawing this tab: ' + esc(e.message) + '</div>'; console.error(e); }
  window.scrollTo(0, y);
}

/* ---------- actions ---------- */
const prospect = id => S.prospects.find(p => p.id === id);
function setStage(p, stage) { if (p.stage !== stage) { p.stage = stage; p.hist.push({ stage, date: today() }); } if (['Won', 'Lost'].includes(stage)) p.next = ''; }
function outKey(pb, ch) { if (ch !== 'LinkedIn' && ch !== 'Email') return null; return pb === 'nudge' ? 'sent' : ch === 'LinkedIn' ? 'req' : 'email'; }
function bump(k, n) { const d = day(today()); d.n[k] = Math.max(0, (d.n[k] || 0) + (n || 1)); }
function touch(p) {
  const t = today(); p.touches++;
  const gap = PB[p.pb].gaps[p.touches]; p.next = gap ? addD(t, gap) : '';
  if (p.stage === 'Discovered') setStage(p, 'Contacted');
  bump(p.touches === 1 ? (outKey(p.pb, p.ch) || 'fu') : 'fu');
}
function copy(txt, btn) {
  const done = () => { btn.textContent = 'Copied'; setTimeout(() => { btn.textContent = 'Copy'; }, 1200); };
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

document.addEventListener('click', e => {
  const b = e.target.closest('[data-act]'); if (!b) return;
  const a = b.dataset.act, id = b.dataset.id, t = today(), pb = S.settings.pb;
  if (a === 'tab') { ui.tab = b.dataset.k; render(); window.scrollTo(0, 0); return; }
  if (a === 'pb') { S.settings.pb = b.dataset.k; save(); render(); return; }
  if (a === 'copy') { copy(b.dataset.t, b); return; }
  if (a === 'export') { download(); return; }
  if (a === 'reset') { if (confirm('Delete ALL data (prospects, history, XP)? This cannot be undone.') && confirm('Really delete everything?')) { S = norm({}); S.updatedAt = Date.now(); evalBadges(true); save(); render(); } return; }
  const map = {
    touch: () => touch(prospect(id)),
    replied: () => { const p = prospect(id); setStage(p, 'Replied'); p.next = ''; bump('reply'); },
    ctr: () => bump(b.dataset.k, +b.dataset.v),
    del: () => { if (!confirm('Delete this prospect?')) return false; S.prospects = S.prospects.filter(p => p.id !== id); },
    add: () => {
      const name = val('f_name'); if (!name) { $('#f_name').focus(); return false; }
      const sc = val('f_score');
      const p = { id: uid(), pb, name, biz: val('f_biz'), seg: val('f_seg'), src: val('f_src'), sig: val('f_sig'), score: sc === '' ? '' : Math.max(0, Math.min(100, +sc)), ch: val('f_ch'), basis: val('f_basis'), stage: val('f_stage'), touches: 0, next: '', note: '', created: t, hist: [] };
      p.hist.push({ stage: p.stage, date: t });
      if (p.stage !== 'Discovered') { p.touches = 1; p.next = PB[pb].gaps[1] ? addD(t, PB[pb].gaps[1]) : ''; const k = outKey(pb, p.ch); if (k) bump(k); }
      S.prospects.unshift(p);
    },
    addp: () => { const n = val('p_name'); if (!n) return false; S.partners.unshift({ id: uid(), name: n, type: val('p_type'), next: val('p_next'), sent: 0, rec: 0, last: '' }); },
    pn: () => { const p = S.partners.find(x => x.id === id); p[b.dataset.f] = (p[b.dataset.f] || 0) + 1; },
    ptouch: () => { S.partners.find(x => x.id === id).last = t; bump('partner'); },
    delp: () => { if (!confirm('Delete this partner?')) return false; S.partners = S.partners.filter(p => p.id !== id); },
    addtask: () => { const x = val('t_text'); if (!x) { $('#t_text').focus(); return false; } S.tasks.push({ id: uid(), text: x, due: val('t_due') || t, done: false, doneOn: '', src: 'manual' }); },
    deltask: () => { S.tasks = S.tasks.filter(x => x.id !== id); },
    snooze: () => { S.tasks.find(x => x.id === id).due = nextWorking(t); },
    carry: () => { const y = b.dataset.y; PB[pb].core.forEach(c => { if (!(S.days[y].c[ck(pb, c[0])])) S.tasks.push({ id: uid(), text: 'Missed ' + fmtShort(y) + ': ' + c[1], due: t, done: false, doneOn: '', src: 'carry' }); }); S.carried[y] = true; },
    dismisscarry: () => { S.carried[b.dataset.y] = true; },
    addgoal: () => { const ti = val('g_title'); if (!ti) { $('#g_title').focus(); return false; } S.goals.push({ id: uid(), title: ti, metric: val('g_metric'), target: Math.max(1, +val('g_target') || 1), period: val('g_period') }); },
    delgoal: () => { S.goals = S.goals.filter(g => g.id !== id); },
    addscript: () => { const ti = val('s_title'), bo = val('s_body'); if (!ti || !bo) return false; S.scripts.push({ id: uid(), pb, title: ti, body: bo }); },
    delscript: () => { S.scripts = S.scripts.filter(s => s.id !== id); }
  };
  if (map[a]) act(map[a]);
});
const fmtShort = s => fmt(s, { weekday: 'short' });

document.addEventListener('change', e => {
  const b = e.target.closest('[data-act]'); if (!b) return;
  const a = b.dataset.act, id = b.dataset.id, t = today(), pb = S.settings.pb;
  if (a === 'pbf') { ui.pbf = b.value; render(); return; }
  if (a === 'sf') { ui.sf = b.value; render(); return; }
  if (a === 'revwk') { ui.revWk = b.value; render(); return; }
  if (a === 'importfile') { const f = b.files[0]; if (!f) return; const r = new FileReader(); r.onload = () => { try { restore(JSON.parse(r.result)); } catch (x) { alert('That is not a valid backup.'); } }; r.readAsText(f); b.value = ''; return; }
  const map = {
    chk: () => { day(t).c[ck(pb, b.dataset.k)] = b.checked; },
    tt: () => { const x = S.tasks.find(q => q.id === id); x.done = b.checked; x.doneOn = b.checked ? t : ''; },
    stage: () => setStage(prospect(id), b.value),
    due: () => { prospect(id).next = b.value; },
    rec: () => { if (b.checked) S.rec[b.dataset.k] = true; else delete S.rec[b.dataset.k]; },
    launch: () => { if (b.checked) S.launch[b.dataset.k] = true; else delete S.launch[b.dataset.k]; },
    launchMon: () => { if (b.value) S.settings.launchMon = b.value; }
  };
  if (map[a]) act(map[a]);
});

document.addEventListener('input', e => {
  const q = e.target.id === 'q'; if (q) { ui.q = e.target.value; const l = $('#plist'); if (l) { l.innerHTML = plist(); $('#pcount').textContent = filtered().length; } return; }
  const b = e.target.closest('[data-act]'); if (!b) return;
  const a = b.dataset.act, id = b.dataset.id;
  if (a === 'plan') { const k = nextWorking(today()); const arr = S.plan[k] || (S.plan[k] = ['', '', '']); arr[+b.dataset.i] = b.value; delete S.planSeeded[k]; }
  else if (a === 'note') prospect(id).note = b.value;
  else if (a === 'pnext') S.partners.find(x => x.id === id).next = b.value;
  else if (a === 'rev') { const w = b.dataset.wk, pb = S.settings.pb; ((S.reviews[w] = S.reviews[w] || {})[pb] = S.reviews[w][pb] || {})[b.dataset.i] = b.value; }
  else return;
  save();
});
document.addEventListener('change', e => { if (e.target.dataset && e.target.dataset.act === 'rev') { const before = S.meta.level; evalBadges(false); save(); renderHeader(); } });

document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'visible') pull(false); else if (dirty) push(); });
window.addEventListener('online', () => { if (dirty) push(); else pull(false); });
window.addEventListener('pagehide', () => { if (dirty) push(); });

/* ---------- start ---------- */
evalBadges(true); render(); setStatus('Connecting…'); pull(true);
// re-render at midnight rollover so carry-overs appear without a reload
let lastDay = today(); setInterval(() => { if (today() !== lastDay) { lastDay = today(); render(); } }, 60000);
})();
