/* Reference content for Infinity Outreach: item details, glossary and roadmap.
   Everything here is drawn from the OptimAI and Nudge Digital playbooks. [pb, section] pairs link into the full plans. */
window.GUIDE = (function () {
  const O = 'optimai', N = 'nudge';
  const detail = {
    /* ---------- OptimAI core ---------- */
    'optimai:disc': {
      what: 'Find and qualify 5 new prospects and write down one real signal for each. A signal is something you actually saw, not a guess about their problems.',
      steps: [
        'Run today’s source (see the focus line at the top): Mon saved LinkedIn search, Tue Google Maps and phone for trades (from week 3), Wed Seek job ads and growth announcements, Thu public requests for help, Fri light discovery only.',
        'Open about 10 profiles. Read the latest post or the company’s service page.',
        'Shortlist 5 that fit: professional services and agencies with 2 to 50 staff first, trades once you reach week 3.',
        'Write the signal as a fact: “job ad for an admin assistant”, “new enquiry form on their site”, “post about a backlog”. Never write a diagnosis.',
        'Add each one on the Pipeline tab with its source and signal. They start at stage Discovered.'],
      done: '5 prospects are in the Pipeline, each with a source and a signal.',
      tips: ['A job ad for admin staff means they have workload. That is an observation, not proof they need automation.'],
      app: 'Pipeline tab, Add a prospect',
      links: [[O, 8, 'Prospect discovery playbooks'], [O, 5, 'Ideal customer profiles']]
    },
    'optimai:out': {
      what: 'Send your day’s new outreach: 5 to 8 LinkedIn connection requests with no pitch, plus up to 3 emails where you have a legitimate basis.',
      steps: [
        'Engage first: leave one useful comment on a post from each person, before or after you connect.',
        'Send 5 to 8 connection requests under 200 characters. Mention something specific you saw. Do not pitch.',
        'When someone accepts, wait a day, then send one conversation message that references something real and asks one question about a workflow.',
        'Only invite a call if they reply with a problem or curiosity.',
        'Email only to an address that is conspicuously published for that person’s role, and only if your message is relevant to that role. Include your name, business and address, plus a working unsubscribe line. Never guess, buy or scrape addresses.',
        'Never send the same message on LinkedIn and email within 5 days.',
        'Add each send to the scorecard with the + buttons, or log it as a touch on the prospect.'],
      done: 'Requests and emails are sent and counted on the scorecard. Each prospect touched is updated.',
      tips: ['Scripts tab has every template ready to copy and personalise.', 'Honour an opt-out within 5 business days.'],
      app: 'Scripts tab, then Today scorecard',
      links: [[O, 11, 'LinkedIn outreach and templates'], [O, 12, 'Email outreach system']]
    },
    'optimai:fu': {
      what: 'Reply to everyone who answered you, then send the follow-ups that are due today. Four touches over about three weeks is the maximum.',
      steps: [
        'Open Follow-ups due on this page. Each one shows how many touches you have used.',
        'Answer every new reply the same day. Classify it: positive, neutral, objection or opt-out.',
        'Press Log touch after you send a follow-up. The app schedules the next one (day 4, then 10, then 21) and stops after touch 4.',
        'Press They replied when someone answers, so the stage and your reply count update.',
        'For objections use the Objections scripts: “we can do it ourselves”, “too expensive”, “not now”, “what about privacy”.'],
      done: 'Nothing is left in Follow-ups due and every reply has an answer.',
      tips: ['After the final touch, stop. Do not keep chasing.'],
      app: 'Follow-ups due list on this page',
      links: [[O, 12, 'Follow-up templates and the 4-touch rule'], [O, 13, 'Discovery calls and pipeline']]
    },
    'optimai:conv': {
      what: 'Move live conversations forward: prepare or hold a 20-minute discovery call, send a summary afterwards, or chase an open proposal.',
      steps: [
        'Before a call, read their site and note the workflow you want to ask about.',
        'On the call, ask how the process works today: who handles it, how often, how long it takes, which tools hold the information, and what a missed follow-up costs.',
        'Map the process as boxes and arrows in five minutes and put the weekly time beside each manual step.',
        'Check feasibility before any proposal: can each system be connected without risky workarounds?',
        'Send the post-call summary the same day (Scripts, Calls group). Ask them to correct anything you got wrong.',
        'A proposal is one page: problem in their words, baseline and assumptions, scope and exclusions, deliverables, timeline, fixed price, support option, privacy handling, next step and expiry.'],
      done: 'Every call has a summary sent and every open proposal has a next date.',
      tips: ['Never say “you will save”. Say “on your figures, a 40 to 80% reduction would be worth $X to $Y a year”.'],
      app: 'Pipeline tab (move stage), Scripts tab (Calls)',
      links: [[O, 13, 'Discovery call questions and proposal structure'], [O, 7, 'Value-based selling']]
    },
    'optimai:part': {
      what: 'One small action with a referral partner: a message, a useful comment or a reply.',
      steps: [
        'Partners are people who already serve your buyers: web developers and designers, bookkeepers and accountants, IT support providers, CRM implementers, business coaches and agencies.',
        'Pick one partner or partner prospect. Send a short message, comment on their post, or reply to something they said.',
        'Weeks 1 to 2: list 20 partner types and shortlist 10. Weeks 3 to 6: send 3 partnership messages a week and book coffees. Weeks 7 to 12: give one tangible help, such as a joint post or a free audit for a partner’s client.',
        'Press Contacted today on the Partners tab so the touch is recorded.'],
      done: 'One partner touch is logged.',
      tips: ['Your pitch to partners: a reliable, fixed-price builder who keeps their client happy, reports back and won’t poach the relationship.'],
      app: 'Partners tab',
      links: [[O, 15, 'Referral partnerships']]
    },
    'optimai:trk': {
      what: 'Keep the tracker accurate and decide tomorrow’s three actions. If it is not written down, it did not happen.',
      steps: [
        'Open every prospect you touched today and update stage, notes, next follow-up date and reply type.',
        'Record the source, signal, date and channel for any new prospect.',
        'Do not move someone to Proposal sent until feasibility is checked.',
        'Scroll to the bottom of this page and write the next working day’s three actions. They appear as tasks on that day.'],
      done: 'Every row touched today is current and tomorrow has three actions.',
      app: 'Pipeline tab, then the three-actions box at the bottom of this page',
      links: [[O, 12, 'Tracking columns'], [O, 13, 'Pipeline stages']]
    },
    /* ---------- OptimAI extra ---------- */
    'optimai:cont': {
      what: 'Draft or schedule the post, newsletter issue or article that is due this week.',
      steps: [
        'Open the Content tab and filter to This week. Pick the idea that is due.',
        'Write it with a hook, a point or two, one concrete step and a question or call to action. Label any hypothetical example clearly.',
        'Never state a result you have not measured, and never name a client without permission.',
        'Set the idea’s status to Drafting, Scheduled or Published. Publishing a post adds to your Posts count.'],
      done: 'This week’s idea is drafted or scheduled.',
      tips: ['One idea can become a founder post, a page post, a newsletter section, an article and a prompt for a community thread. Write the article first and cut the rest from it.'],
      app: 'Content tab',
      links: [[O, 11, '30-day content calendar'], [O, 14, 'Newsletter and articles']]
    },
    'optimai:part2': {
      what: 'A deeper partner action than the daily touch: a partnership message, booking a coffee, or thanking someone who referred work.',
      steps: [
        'Send the Partnership outreach script to a shortlisted partner.',
        'Book a 20-minute chat or coffee with a partner who replied.',
        'Thank any partner who sent you a referral, and record it with the + beside Received on the Partners tab.',
        'If you agree an arrangement, keep it simple: a thank-you fee of 10% of the first project or reciprocal referrals, in a one-page agreement, disclosed where required. The playbook treats this as a hypothesis to test.'],
      done: 'One partner has received a real message, booking or thank-you.',
      app: 'Partners tab, Scripts tab (Partners)',
      links: [[O, 15, 'Referral partnerships']]
    },
    'optimai:sales': {
      what: 'Sales work that only applies once you have calls: deliver a Workflow Audit, write a proposal, or check feasibility. When calls appear, take time from content first.',
      steps: [
        'Workflow Audit: a 60 to 90 minute working session plus a written findings page. It names the three biggest time or revenue leaks, which are worth automating, which are not, and costed options. Findings only, no build.',
        'Proposal: build it from the audit using the one-page structure.',
        'Value: annual value = hours per week x weeks per year x loaded hourly cost x % realistically saved. Payback in months = project cost divided by (annual value / 12). Validate the baseline with the person who does the task.',
        'Feasibility: if you cannot connect the systems safely, narrow the scope or decline.'],
      done: 'The audit, proposal or feasibility check due this week is finished.',
      app: 'Pipeline tab (Audit delivered, Proposal sent)',
      links: [[O, 6, 'Service packaging and offers'], [O, 7, 'Value-based selling'], [O, 13, 'Proposal structure']]
    },
    /* ---------- Nudge core ---------- */
    'nudge:res': {
      what: 'Find and score prospects. For each one log a source link, the trigger and one observable gap, then give it a score out of 100.',
      steps: [
        'Work today’s source: Mon funding news and job posts, Tue founder triggers (funding, launch, hiring), Wed HubSpot directory and agency sites, Thu and Fri light research only.',
        'Funding news: scan Startup Daily, SmartCompany and Capital Brief weekly. Job posts: search “growth marketing” and “marketing operations” with Melbourne.',
        'Spend at most 10 minutes per prospect: what they sell, the trigger, the decision-maker, and one gap you can see from the outside.',
        'Score it (ICP fit 20, buying trigger 20, relevant problem 15, service relevance 10, access to decision-maker 10, urgency 10, commercial potential 10, near-term purchase 5).',
        'Act on the score: 75 or more approach this week, 55 to 74 nurture, under 55 stop researching.',
        'Add it on the Pipeline tab. Adding a prospect counts toward Researched automatically.'],
      done: 'Each prospect has a source link, trigger, observed gap and score.',
      tips: ['Only note what you can observe. Never claim a prospect “needs” you unless a source supports it.'],
      app: 'Pipeline tab, Add a prospect (Score field)',
      links: [[N, 9, 'Lead sourcing engine'], [N, 10, 'Scoring model and CRM design']]
    },
    'nudge:out': {
      what: 'Send up to 5 personalised messages to prospects that scored 75 or more. Each message cites one specific, verified observation.',
      steps: [
        'Pick prospects from the top of your scored list.',
        'Use a script as the skeleton, then add the one verified observation (for example a launch, a funding round or a job post).',
        'Email only to an address published for that person’s role. Sign off with your name, business, ABN and an unsubscribe line. Record the source link and consent basis.',
        'No purchased, scraped or guessed addresses and no LinkedIn automation tools.',
        'Standard sequence: first message, follow-up on day 4, follow-up on day 10, then stop.',
        'Log the send with Log touch on the prospect, or the + on the scorecard.'],
      done: 'Up to 5 sends are out and logged, each with a verified observation.',
      tips: ['If a prospect does not meet the criteria, send fewer messages. Quality and compliance beat quotas.'],
      app: 'Scripts tab, Pipeline tab (Log touch)',
      links: [[N, 12, 'Email outreach, compliance and campaigns A to F'], [N, 11, 'LinkedIn strategy']]
    },
    'nudge:deals': {
      what: 'Active deals and inbound enquiries come first, then due follow-ups. This is the highest priority block of your day.',
      steps: [
        'Answer inbound enquiries and open opportunities first.',
        'Then work Follow-ups due on this page. Press Log touch after each one.',
        'Reply to every message within 24 hours.',
        'Send a recap on the same day as every call. Send quotes within 2 working days.',
        'After the day-10 follow-up, stop. Do not carry on chasing.'],
      done: 'No inbound or due follow-up is waiting.',
      tips: ['Priority order if time is short: active deals and inbound, due follow-ups, new qualified outreach, partner and referral work, content, systems and research.'],
      app: 'Follow-ups due list, Pipeline tab',
      links: [[N, 18, 'Daily execution and priority order'], [N, 5, 'Offers and sales conversion']]
    },
    'nudge:rel': {
      what: 'Build relationships in public or with partners. Either comment on 3 posts or send one partner or referrer message.',
      steps: [
        'Comment on 3 posts from founders, agency owners or program managers on your list. Add a specific insight, not praise.',
        'Reply to every comment and message on your own posts within 24 hours.',
        'When a prospect has engaged twice, send one helpful direct message that offers value, such as a checklist or a 15-minute review. Not a pitch.',
        'Or send one message to a partner or someone who referred you.'],
      done: '3 useful comments, or one partner or referrer message, are done.',
      app: 'Partners tab, Scripts tab',
      links: [[N, 11, 'LinkedIn daily routine'], [N, 6, 'Agency and freelance partnerships']]
    },
    'nudge:crm': {
      what: 'Keep the CRM accurate and decide tomorrow’s three priorities. Three priorities a day is the maximum.',
      steps: [
        'Update every record you touched: source link, score, consent basis, channel, status, next action and its due date.',
        'Record where an email address was published and your consent basis. Mark anyone who unsubscribes.',
        'Write the next working day’s three priorities in the box at the bottom of this page. They appear as tasks on that day.',
        'Do not carry unfinished tasks forward unless they are follow-ups. (This app carries tasks over for you; clear anything you no longer need.)'],
      done: 'Every touched record is current and tomorrow has three priorities.',
      app: 'Pipeline tab, then the three-actions box on this page',
      links: [[N, 10, 'CRM fields and pipeline stages'], [N, 18, 'Overwhelm rules']]
    },
    /* ---------- Nudge extra ---------- */
    'nudge:xr': {
      what: 'An extra 15 minutes of research and scoring on a 120-minute day.',
      steps: ['Source from the funding scan, job posts, HubSpot directory or agency sites.', 'Same rules as core research: 10 minutes per prospect, log source, trigger and gap, then score.'],
      done: 'More prospects are scored and in the Pipeline.',
      links: [[N, 9, 'Lead sourcing engine'], [N, 10, 'Scoring model']]
    },
    'nudge:xo': {
      what: 'An extra 10 minutes of outreach: a fuller batch, still only to prospects that clear the score and consent checks.',
      steps: ['Send to prospects scoring 75 or more only.', 'Check the consent basis for every email before sending.'],
      done: 'Extra sends are logged.',
      links: [[N, 12, 'Email outreach and compliance']]
    },
    'nudge:xf': {
      what: 'An extra 5 minutes on active deals: proposals due, quotes, call prep and discovery calls.',
      steps: ['Send any proposal or quote that is due. Quotes go out within 2 working days.', 'Prepare for tomorrow’s call, or hold today’s call and send the same-day recap.', 'When calls appear, take time from content first.'],
      done: 'Quotes, proposals and call prep are up to date.',
      links: [[N, 18, 'Daily execution'], [N, 5, 'Offers and sales conversion']]
    },
    'nudge:xc': {
      what: 'Draft or schedule the post, article or newsletter edition that is due this week.',
      steps: [
        'Open the Content tab and filter to This week.',
        'Use the post template: hook (one line a stranger would care about), two to four short points, one concrete step, one question or call to action.',
        'Rhythm: 2 to 3 founder posts and 1 company page post a week, one website article every 2 weeks, a newsletter every 2 weeks from week 4 (opted-in subscribers only).',
        'Label hypotheticals. Never name a client or quote a result without permission. Never promise rankings or AI search mentions.',
        'Mark the idea Drafting, Scheduled or Published.'],
      done: 'This week’s content is drafted or scheduled.',
      tips: ['Every repeated question on a call is a candidate topic.'],
      app: 'Content tab',
      links: [[N, 15, 'Founder and company content engine'], [N, 14, 'Articles and SEO'], [N, 13, 'Newsletter']]
    },
    'nudge:xl': {
      what: 'A deeper relationship action: a partner approach, an intro call, a pilot proposal or a thank-you to a referrer. It replaces the 10-minute content-or-relationships slot in the core.',
      steps: [
        'Send a partner approach to an agency you have scored (PR, creative, web, paid media and dev studios fit best).',
        'Book or hold a 20-minute intro call, then send a one-page proposition.',
        'Commercial arrangements to test (all assumptions): white-label at 10 to 15% off retail, a 10% referral fee on the first project, an overflow retainer of 10 hours a month, or a pilot project of A$750 to A$1,800 with no commitment.',
        'Thank anyone who referred work, and record it on the Partners tab.'],
      done: 'One meaningful partner action is done.',
      app: 'Partners tab, Scripts tab',
      links: [[N, 6, 'Agency and freelance partnerships'], [N, 7, 'Technology and AI startup founders']]
    }
  };

  /* ---------- glossary ---------- */
  const T = (k, term, def, links, o) => Object.assign({ k, term, def, links: links || [], aka: [] }, o || {});
  const gloss = [
    T('tracker', 'Tracker', 'The single list where you record every prospect, one row each: source, signal, date, channel, status, reply type and next action. Nudge calls it the CRM and adds company, contact, consent and opportunity fields. In this app the Pipeline tab is your tracker. The daily “Tracker” or “CRM” task means updating every row you touched and writing tomorrow’s three actions.', [[O, 12, 'OptimAI: tracking columns'], [N, 10, 'Nudge: CRM fields']], { aka: ['trackers'], app: 'Pipeline tab' }),
    T('partner', 'Partner', 'A person or business that sends you work or delivers it with you. They are not a customer. OptimAI uses referral partners, such as web developers, bookkeepers, IT providers and agencies whose clients need automation. Nudge uses agency and freelance partners who hand you technical work, either white-label or as a named specialist. Track them on the Partners tab.', [[O, 15, 'OptimAI: referral partnerships'], [N, 6, 'Nudge: agency partnerships']], { aka: ['partners', 'partnership', 'partnerships'], app: 'Partners tab' }),
    T('referral', 'Referral', 'A client or lead introduced to you by someone else. Record referrals sent and received on each partner. The playbooks suggest testing a thank-you fee of 10% of the first project, or swapping referrals, in a one-page agreement.', [[O, 15, 'OptimAI: referral arrangement'], [N, 6, 'Nudge: commercial arrangements']], { aka: ['referrals', 'referrer', 'referrers'] }),
    T('prospect', 'Prospect', 'A person or business you have identified as a possible customer and logged in the tracker. It can be at any stage from Discovered to Lost.', [[O, 13, 'Pipeline stages'], [N, 10, 'Pipeline stages']], { aka: ['prospects'], app: 'Pipeline tab' }),
    T('qualified', 'Qualified', 'A prospect that meets your qualification rules. For the OptimAI entry offer that means a named owner, at least two relevant tools in use, a repeated process, and willingness to give you access within two weeks. For Nudge it starts with a score of 75 or more.', [[O, 6, 'OptimAI: qualify for the entry offer'], [N, 10, 'Nudge: scoring model']], { aka: ['qualify', 'qualification', 'qualifying'] }),
    T('signal', 'Signal', 'Something you actually observed that suggests a need: a job ad for an admin role, a new service page, a funding announcement, a post about a backlog. A signal is a fact you saw, not a diagnosis. Record one for every prospect.', [[O, 8, 'OptimAI: facts vs hypotheses'], [N, 9, 'Nudge: signals of need']], { aka: ['signals', 'observed gap', 'observation', 'observable gap'] }),
    T('icp', 'ICP (ideal customer profile)', 'The kind of business you are targeting: segment, size, location and the problem they have. OptimAI starts with small professional services and agencies, then tests trades. Nudge ranks agency partners and seed to Series A tech and AI founders first.', [[O, 5, 'OptimAI: ICPs'], [N, 4, 'Nudge: ICPs']], { aka: ['ICPs', 'segment', 'segments'] }),
    T('touch', 'Touch', 'One outreach or follow-up message to a prospect. Each prospect has a limit. OptimAI: 4 touches over about 3 weeks. Nudge: the first message plus follow-ups on day 4 and day 10. After the last touch you stop.', [[O, 12, 'OptimAI: coordination and touch limit'], [N, 12, 'Nudge: sequence']], { aka: ['touches'], app: 'Log touch button on a prospect' }),
    T('followup', 'Follow-up', 'A message sent after your first one when there has been no reply. The app schedules them for you: roughly day 4, then day 10, then a final close-the-loop note. Press Log touch after you send one.', [[O, 12, 'OptimAI: follow-up templates'], [N, 12, 'Nudge: follow-up sequence']], { aka: ['follow-ups', 'follow ups', 'follow up', 'follow-up'] }),
    T('reply', 'Reply type', 'How you classify a reply in the tracker: positive, neutral, objection or opt-out. An opt-out must be honoured within 5 business days.', [[O, 12, 'OptimAI: tracking']], { aka: ['reply types'] }),
    T('core60', 'Core 60', 'The minimum daily routine: about 60 minutes covering discover or research, outreach, follow-ups, conversations or relationships, and the tracker. In the playbooks it is the “60-minute day” (OptimAI) or “minimum viable day” (Nudge). Completing it keeps your streak.', [[O, 16, 'OptimAI: daily routines'], [N, 18, 'Nudge: daily execution']], { aka: ['core 60 minutes', 'core 60-minute'] }),
    T('extra', 'Extra (120-minute day)', 'The optional additions when you have a longer day. When calls and proposals appear, take that time from content first.', [[O, 16, 'OptimAI: 120-minute day'], [N, 18, 'Nudge: standard growth day']], { aka: ['120-minute day'] }),
    T('scorecard', 'Scorecard', 'The daily counters on the Today page (requests, emails, replies, calls, posts and so on). They feed your weekly targets, goals, reply rate and XP. Nudge also fills a weekly scorecard every Friday.', [[N, 19, 'Nudge: weekly scorecard'], [O, 19, 'OptimAI: KPI dashboard']], { app: 'Today page, Progress page' }),
    T('carryover', 'Carry-over', 'Tasks you did not finish roll to the next day automatically and are marked “Carried over”. Tomorrow’s three actions also become tasks on that day. This is a feature of this app. Note that the Nudge plan advises not carrying unfinished work forward except follow-ups, so clear anything you no longer need.', [[N, 18, 'Nudge: overwhelm rules']], { app: 'Today page' }),
    T('streak', 'Streak, XP and level', 'App features. XP is earned for ticking tasks, logging activity and moving prospects through the pipeline. Level is based on total XP. Streak counts consecutive weekdays where you finished the core 60 in either playbook. Weekends never break it.', [], { aka: ['XP', 'streak'] }),
    T('discovery', 'Discovery call', 'A 20-minute call to understand how a process works today and whether automation or a tracking and CRM fix is the right answer. You ask the questions and are honest if it is not.', [[O, 13, 'OptimAI: discovery call questions'], [N, 5, 'Nudge: offers and sales conversion']], { aka: ['discovery calls'] }),
    T('audit', 'Workflow Audit', 'OptimAI’s entry offer: a 60 to 90 minute working session plus a written findings page naming the three biggest time or revenue leaks, which are worth automating, and costed options. Findings only, no build. Free for the first 5 to 10 prospects, then $350 to $600 (a hypothesis) credited against a build.', [[O, 6, 'OptimAI: service packaging']], { aka: ['audit', 'workflow audits'] }),
    T('entryoffer', 'Entry offer', 'The small, low-risk first product you lead with. OptimAI leads with the Workflow Audit. Nudge’s likely wedge offers are the A$750 analytics and tracking setup and the A$1,800 HubSpot CRM build (an assumption to test).', [[O, 6, 'OptimAI: service packaging'], [N, 5, 'Nudge: offers']], { aka: ['entry offers', 'wedge offer'] }),
    T('retainer', 'Retainer / ongoing support', 'A recurring monthly arrangement. OptimAI suggests a monthly support plan with no lock-in. Nudge lists a growth retainer from A$2,000 a month and an overflow retainer of 10 hours a month for agencies.', [[O, 6, 'OptimAI: ongoing support'], [N, 6, 'Nudge: overflow retainer']], { aka: ['retainers'] }),
    T('whitelabel', 'White-label', 'Doing technical work for an agency under their brand. The agency quotes and invoices the client and you work behind them. The Nudge plan suggests 10 to 15% off your retail price, and a named-specialist option.', [[N, 6, 'Nudge: partnership arrangements']], { aka: ['white label', 'overflow'] }),
    T('pilot', 'Pilot', 'One paid project of A$750 to A$1,800 with no commitment, used to prove a partnership before agreeing anything bigger.', [[N, 6, 'Nudge: commercial arrangements']], { aka: ['pilots'] }),
    T('proposal', 'Proposal / quote', 'OptimAI’s proposal is one page: problem in their words, baseline and assumptions, scope and exclusions, deliverables, timeline, fixed price, support option, privacy handling, next step and expiry. Nudge sends a quote within 2 working days of the call.', [[O, 13, 'OptimAI: proposal structure'], [N, 18, 'Nudge: daily execution']], { aka: ['proposals', 'quote', 'quotes'] }),
    T('score', 'Prospect score', 'Nudge’s 100-point rating: ICP fit 20, buying trigger 20, evidence of a relevant problem 15, service relevance 10, access to the decision-maker 10, urgency 10, commercial potential 10, likelihood of near-term purchase 5. 75 or more: approach this week. 55 to 74: nurture. Under 55: stop researching. Note: the sourcing summary in Section 9 says 80 or more, but the scoring model in Section 10 says 75, which this app uses.', [[N, 10, 'Nudge: scoring model'], [N, 9, 'Nudge: workflow summary']], { aka: ['scored', 'scoring', 'score'] }),
    T('trigger', 'Trigger', 'A recent event that gives you a reason to get in touch: a funding round, a product launch, hiring a first marketer, or a new market, within roughly the last 90 days.', [[N, 10, 'Nudge: scoring model'], [N, 7, 'Nudge: founders']], { aka: ['triggers', 'trigger-based'] }),
    T('nurture', 'Nurture', 'For prospects that scored 55 to 74: do not pitch yet. Comment, connect and revisit monthly.', [[N, 10, 'Nudge: action tiers']]),
    T('campaign', 'Campaigns A to F', 'Nudge’s six email programs: A agencies, B founders, C launch or growth triggers, D ecosystem organisations, E warm introductions, F dormant opportunities. Each has its own target, research, subject lines, sequence and call to action.', [[N, 12, 'Nudge: email campaigns']], { aka: ['campaign'] }),
    T('consent', 'Consent basis', 'Your reason for being allowed to send a commercial email. Under the Spam Act it can be express consent, or inferred consent (for example an address conspicuously published for that person’s role, with a message relevant to the role). You must be able to prove it, so record the source link, date and basis for each contact. This is guidance from the playbooks, not legal advice.', [[N, 12, 'Nudge: compliance'], [O, 12, 'OptimAI: rules before you send']], { aka: ['consent', 'inferred consent', 'Spam Act', 'spam act'], app: 'Email basis field on a prospect' }),
    T('unsubscribe', 'Unsubscribe line', 'Every commercial message needs a working way to opt out, plus your name and business details. Honour requests within 5 working days and keep the option working for at least 30 days.', [[N, 12, 'Nudge: identify and unsubscribe'], [O, 12, 'OptimAI: rules before you send']], { aka: ['opt-out', 'opt out'] }),
    T('abn', 'ABN', 'Australian Business Number. Nudge’s playbook includes it in the email signature along with name, business and an unsubscribe line.', [[N, 12, 'Nudge: identify and unsubscribe']]),
    T('acma', 'ACMA', 'The Australian Communications and Media Authority, the regulator that publishes guidance on the Spam Act. The playbooks cite its “Avoid sending spam” guidance.', [[N, 12, 'Nudge: compliance']]),
    T('crm', 'CRM', 'Customer relationship management: the tool or sheet where you keep contacts, conversations and deals. Both playbooks suggest a Google Sheet or HubSpot’s free CRM to start. For Nudge, building HubSpot CRMs is also a service you sell.', [[N, 21, 'Nudge: tools'], [O, 20, 'OptimAI: tools']], { aka: ['HubSpot'] }),
    T('ga4', 'GA4 and GTM', 'Google Analytics 4 (website and app analytics) and Google Tag Manager (the tool that fires tracking tags). They are the core of Nudge’s analytics and tracking setup service.', [[N, 14, 'Nudge: tracking audit article']], { aka: ['GA4', 'GTM', 'Segment'] }),
    T('lifecycle', 'Lifecycle email', 'Automated emails triggered by what a user does or does not do, such as a welcome email or a nudge when someone misses their first key action.', [[N, 14, 'Nudge: lifecycle article brief']], { aka: ['lifecycle automation'] }),
    T('activation', 'Activation', 'The first meaningful action a new user takes in a product. Missed activation is a common reason for lifecycle email.', [[N, 14, 'Nudge: lifecycle article brief']]),
    T('attribution', 'Attribution (“direct/none”)', 'Knowing which channel produced a signup. If most traffic shows as “direct/none”, tracking is probably missing campaign tags or losing them in redirects, and the source is not reaching your CRM.', [[N, 11, 'Nudge: Post 8']], { aka: ['direct/none'] }),
    T('baseline', 'Baseline', 'The current cost of a task, validated with the person who does it, before you quote a saving. Use ranges and write the assumption into the proposal.', [[O, 7, 'OptimAI: value-based selling']]),
    T('payback', 'Payback', 'How many months it takes for a project to earn back its cost: project cost divided by (annual value divided by 12). Annual value = hours per week x weeks per year x loaded hourly cost x % realistically saved.', [[O, 7, 'OptimAI: value-based selling']], { aka: ['loaded hourly cost', 'annual value'] }),
    T('hypothetical', 'Hypothetical', 'Any example you have not measured with a real client. The playbooks require you to label it clearly and never present it as a result.', [[O, 11, 'OptimAI: content rules']], { aka: ['hypotheticals', 'hypothesis'] }),
    T('tags', 'Verified, Assumption, Hypothesis', 'Tags in the Nudge plan. Verified means seen in a cited source. Assumption is the author’s reasoning, to be tested. Hypothesis is to be validated through real conversations.', [[N, 1, 'Nudge: how to read this']], { aka: ['[Verified]', '[Assumption]', '[Hypothesis]'] }),
    T('innovationvic', 'Innovation Victoria', 'The Victorian body formed on 30 June 2026 by merging LaunchVic and Breakthrough Victoria. Plans that mention LaunchVic need re-checking against it. Nudge treats its programs as a place to find founders and run a free workshop, and never assumes it will endorse or refer you.', [[N, 8, 'Nudge: Innovation Victoria']], { aka: ['LaunchVic'] }),
    T('newsletter', 'Newsletter and Substack', 'A regular email to people who opted in. Nudge’s plan is a fortnightly newsletter from week 4 and skips Substack for the first 90 days. OptimAI says Substack is fine if you can publish fortnightly for 12 weeks, and to decide at week 12 on subscribers, replies and conversations started.', [[N, 13, 'Nudge: newsletter'], [O, 14, 'OptimAI: newsletter']], { aka: ['Substack'] }),
    T('prep', 'Prep week and Day 1', 'The time before your plan’s start date. Day 1 is the start date you set on the Roadmap page, and the playbooks assume a Monday. Each playbook has its own start date.', [[N, 18, 'Nudge: calendar notes and prep'], [O, 17, 'OptimAI: first 30 days']], { app: 'Roadmap page' })
  ];

  /* ---------- roadmap ---------- */
  const roadmap = {
    optimai: {
      phases: [
        { n: 1, from: 1, to: 30, label: 'Days 1 to 30', name: 'Set up, outreach, validate', text: 'Week 1 setup: decide segments and the first offer, pull competitor data, build the tracker and templates, update LinkedIn, draft landing pages and first posts. Week 2 outreach: 5 to 8 requests a day, two posts, two partner messages. Week 3 validate: see which signals and messages get replies, test trades with 20 Google Maps or phone contacts. Week 4 systemise: review the funnel, keep the best channel, drop the worst, set the goals for days 31 to 60.' },
        { n: 2, from: 31, to: 60, label: 'Days 31 to 60', name: 'Concentrate', text: 'Concentrate on the best segment, tighten the offer, run a second round of outreach, get two partner-sourced introductions, publish the newsletter issues, and review pricing against real delivery hours.' },
        { n: 3, from: 61, to: 90, label: 'Days 61 to 90', name: 'Standardise and decide', text: 'Analyse the margin and repeatability of any projects, offer monthly support, expand to the secondary segment only if the evidence supports it, document onboarding, and set the next 90-day goals.' }
      ],
      weeks: [
        ['Week 1', 'Setup. Success: tracker live, 50 prospects qualified, profile updated.'],
        ['Week 2', 'Outreach. Target: 30 connections sent, 8 to 12 conversations, 2 calls.'],
        ['Week 3', 'Validate. Target: 5 calls in total, 1 audit delivered.'],
        ['Week 4', 'Systemise. Target: 1 proposal sent. The playbook promises activity and learning, not sales.']
      ],
      targetsNote: 'The playbook’s targets are hypotheses: 150 outreach and 25 to 35 conversations in the first 30 days, 6 to 10 calls and 1 to 3 proposals. Replace them with your own data after four weeks.',
      targets: null,
      after: [
        'Set the next 90-day goals from your own numbers. Swap the playbook’s hypotheses for what you actually achieved.',
        'Decide on the newsletter at week 12 using subscribers, replies and conversations started, not vanity growth.',
        'Expand to the secondary segment (trades) only if the evidence supports it.',
        'Offer monthly support to clients you have delivered for, and document your onboarding.',
        'Check margin per project: price against real hours, and re-price after the first three jobs.',
        'Keep the weekly review going. Stop, start, continue.'
      ],
      links: [[O, 17, 'First 30 days'], [O, 18, 'Days 31 to 90'], [O, 19, 'KPI dashboard and weekly review']]
    },
    nudge: {
      phases: [
        { n: 1, from: 1, to: 30, label: 'Days 1 to 30', name: 'Build the habit, test messaging', text: 'Validate the top three ICPs, send about 90 personalised messages (about 65 new plus 25 follow-ups), hold your first discovery calls, ship the partner page and entry offers, publish about 10 posts, and ask for a case study.' },
        { n: 2, from: 31, to: 60, label: 'Days 31 to 60', name: 'Sharpen', text: 'Double down on the channel that produced calls, adjust offers and prices, run partner pilots, publish a case study, and launch the newsletter. Target 20 sends a week, 3 partner conversations a week and at least 2 calls a week. Rewrite any message with under a 3% call rate.' },
        { n: 3, from: 61, to: 90, label: 'Days 61 to 90', name: 'Standardise', text: 'Document what works, convert more calls into proposals, build repeatable partner onboarding, run Campaign F on dormant leads, ask every client for a referral, and write the next-quarter plan from real conversion rates.' }
      ],
      weeks: [
        ['Week 1', 'Tracker built, 25 prospects scored, 5 messages sent, 2 posts'],
        ['Week 2', '15 messages total, 3 partner approaches, first follow-ups, 3 posts'],
        ['Week 3', 'First discovery call(s), Article 1 live, signup form live'],
        ['Week 4', 'Month-1 review, 3 calls held, 1 proposal sent'],
        ['Week 5', '2 proposals, first partner intro call'],
        ['Week 6', 'First project won (target), newsletter 2'],
        ['Week 7', 'Case study published or drafted'],
        ['Week 8', '6 or more calls in total, partner pilot proposed'],
        ['Week 9', 'Reactivate dormant leads (Campaign F)'],
        ['Week 10', 'Second win (target), referral asks'],
        ['Week 11', 'Retainer upsell conversation with first clients'],
        ['Week 12', 'Standardise templates, document the process'],
        ['Week 13', 'Quarter review, Q2 plan']
      ],
      targetsNote: 'Every number is an assumption to recalibrate at day 30 and day 60, using your real conversion rates.',
      targets: { head: ['', '30 days', '60 days', '90 days'], rows: [['New personalised touches (cumulative)', '65', '125', '180'], ['Discovery calls held (cumulative)', '4', '9', '16'], ['Proposals (cumulative)', '2', '6', '10'], ['Wins (cumulative)', '0 to 1', '2 to 3', '4'], ['Contracted revenue (base case)', 'A$0 to 2k', 'A$4 to 6k', 'A$10 to 12k']] },
      after: [
        'Week 13 is the quarter review. Then write the Q2 plan from your real data, not the plan’s assumptions.',
        'Draft Q2 targets from your actual conversion rates (touch to call, call to proposal, proposal to win).',
        'Revisit Substack only if you have 100 or more engaged subscribers and your content already generates calls.',
        'Do not add paid ads, events or Substack until two proposals a month are being won.',
        'Decision rules continue: a channel with 2 or more calls after 40 touches, double it. None after 40 well-targeted touches, change the message once, then stop.',
        'Check capacity: 4 wins at about A$2,000 average needs roughly 40 to 70 delivery hours. A retainer or two partner pilots need a cap.'
      ],
      calendar: 'Calendar note from the plan: all start dates assume you begin on Monday 2 November 2026. Tuesday 3 November is Melbourne Cup Day, a Victorian public holiday, so the first Tuesday session moves to Wednesday.',
      links: [[N, 17, '90-day roadmap'], [N, 18, 'Daily execution and days 1 to 20'], [N, 20, 'KPIs, goals and forecasting'], [N, 19, 'Weekly review']]
    }
  };
  const d90 = [
    'Quarter review written: what worked, what did not, what changes',
    'Real conversion rates calculated (touch to reply, reply to call, call to proposal, proposal to win)',
    'Weakest channel dropped or message rewritten',
    'Case study or proof asset published',
    'Every client asked for a referral',
    'Next 90-day goals set from real data',
    'New start date chosen below'
  ];
  return { detail, gloss, roadmap, d90 };
})();
