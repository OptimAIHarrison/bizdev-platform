/* Ready-to-post drafts. Each one is a full piece you can edit and publish.
   slot: 'me' = personal/founder profile post, 'page' = company page post, 'article' = long form.
   Where a real detail is needed it is shown in [square brackets]. Examples marked hypothetical must stay labelled as such. */
(function () {
  const C = window.CONTENT = window.CONTENT || { lib: { nudge: [], optimai: [] }, ideas: [], meta: {}, scripts: [] };
  let n = 0;
  const R = (pb, slot, kind, title, channel, cta, body) => C.ideas.push({ id: 'r-' + pb[0] + '-' + (++n), pb, kind, title, body: body.trim(), week: 0, channel, audience: pb === 'optimai' ? 'Small and medium business owners' : 'Founders and startups', cta, meta: { ready: true, slot } });

  /* ===================== OPTIMAI: ME POSTS (founder profile) ===================== */
  const OP = 'LinkedIn (founder profile)';
  R('optimai', 'me', 'founder', 'The Tuesday afternoon test', OP, 'Comment your task', `
Most small businesses don't need an "AI strategy".

They need their Tuesday afternoon back.

Here's the test I use with business owners:

1. What task do you dread that comes round every week?
2. Does it take 20 minutes or more?
3. Are the steps roughly the same each time?
4. Is the information already digital (email, spreadsheet, form)?

Four yes answers? That's a good first candidate for automation or AI.

One or two? Leave it alone. Not everything needs a tool.

The goal isn't clever technology. It's fewer hours on work that doesn't need you.

What's your Tuesday afternoon task? Tell me below and I'll tell you honestly whether AI helps.`);
  R('optimai', 'me', 'founder', 'Stop buying AI tools. Write down your week.', OP, 'DM "week" for the template', `
Before you buy another AI subscription, try this for five working days.

Keep a plain list. Every time you do something you've done before, write one line:

"Typed the same reply to a quote enquiry."
"Copied invoice details from email into the spreadsheet."
"Chased a customer for a signed form."

On Friday, count the lines. Circle the three that repeat most.

Those three are your shopping list. Not the tool's feature list. Yours.

Most owners I speak to find 80% of their time sink is five or six repeating jobs. Fix one and the week feels different.

Want my one-page template for this? Send me a message with the word "week".`);
  R('optimai', 'me', 'founder', 'The prompt I use to turn a voice note into a client email', OP, 'Save this and try it', `
A small thing I use almost every day.

I record a messy voice note after a call. Then I paste the transcript into an AI assistant with this prompt:

"You are helping me write to a client. Turn these rough notes into a clear, friendly email under 150 words. Include: what we agreed, what happens next, and who does what. Do not add anything I did not say. Notes: [paste]"

Two minutes to edit, and the email is done.

Three rules I stick to:
• I always read it before sending.
• I remove names or sensitive details first if I'm not sure where the data goes.
• I keep the tone mine: I tell the tool to be warm and direct.

Small win, but it adds up to a few hours a month.

What's one small writing job you'd hand off first?`);
  R('optimai', 'me', 'founder', 'What AI should not do in your business', OP, 'Agree or disagree?', `
I help businesses use AI. Here's what I tell them not to hand over:

• Sending payments or approving invoices without a person checking.
• Hiring or firing decisions.
• Replying to an upset customer without anyone reading it first.
• Anything involving health, legal or financial advice for a client.
• Pasting personal customer data into a tool you haven't checked.

AI is great for first drafts, sorting, summarising and moving data between tools.

It's a tool you supervise, not a colleague you hand the keys to.

Being clear about the limits is what makes the useful parts safe to use.

Anything you'd add to the list?`);
  R('optimai', 'me', 'founder', 'Copy and paste is a process, not a job', OP, 'What do you copy and paste most?', `
If someone in your business spends an hour a day copying information from one place to another, that isn't a job.

It's a process nobody has fixed yet.

Common examples:
→ Enquiry email into a spreadsheet
→ Spreadsheet into an invoice
→ Invoice into the accounting software
→ Status update back into an email

Each step is small. Together they eat a week every month.

The fix usually isn't AI. It's a form, a rule, or connecting two tools you already pay for.

AI helps when the input is messy, like an email written in a hurry.

What's the copy-and-paste task in your business?`);
  R('optimai', 'me', 'founder', 'A small automation I would set up for a trades business (hypothetical)', OP, 'Want this mapped for your business?', `
A hypothetical example, to show what "small" looks like.

Imagine a five-person electrical business. Enquiries arrive by phone, text, email and a web form. Quotes go out two or three days later.

Here's the lightest fix I'd try:

1. One web form for all enquiries, with photos allowed.
2. An instant reply: "Thanks, we've got it, here's what happens next."
3. The enquiry lands in a shared sheet with a status column.
4. A reminder to the owner if no quote has gone out after 24 hours.
5. A follow-up after three days if the customer hasn't replied.

No custom software. A form, a sheet and a few rules. A couple of hours to set up.

AI helps with one step: drafting the quote email from the job notes.

This is an example, not a result. If you run a trades business, what slows your quotes down?`);
  R('optimai', 'me', 'founder', 'Who gets the alert when the automation breaks?', OP, 'Share your answer', `
The riskiest automation in a business is the one nobody remembers building.

It runs quietly for months. Then one day a connection expires and enquiries stop flowing into the sheet. Nobody notices for two weeks.

Before I build anything, I ask three boring questions:

1. Who owns this?
2. What happens when it fails?
3. Who gets the alert, and how?

If those answers aren't written down, I'm not done.

Boring, yes. But it's the difference between a tool that helps and a mystery that bites you later.

Do you know every automation running in your business today?`);
  R('optimai', 'me', 'founder', 'A five-line AI policy for a small team', OP, 'Copy it and adapt it', `
You don't need a 20-page AI policy. You need five lines everyone remembers.

Here's the one I suggest to small teams:

1. We use approved tools only: [list them].
2. We never paste customer personal data, passwords or financials into a tool that isn't approved.
3. A person checks anything AI writes before it goes to a customer.
4. If AI helped with the work, we say so when it matters.
5. If unsure, ask [name].

Pin it in your team chat. Review it every quarter.

It's not perfect. But a short policy people follow beats a long one nobody reads.

Feel free to copy and adapt. What would you add?`);
  R('optimai', 'me', 'founder', 'Why I started OptimAI', OP, 'Tell me your story too', `
I kept meeting small business owners who spent hours every week on copying, chasing and re-typing, while being told they needed a big "digital transformation".

That never made sense to me.

Most of them needed something much smaller: find the one job that drains them, fix it properly, and show the result. Then decide on the next one.

So I started OptimAI. The idea is simple: make AI and automation practical and affordable for small and medium businesses. No jargon, no hype, and no tool for the sake of a tool.

[Add one sentence about your own background and what you saw first-hand.]

If you run a small business, what's the one task you'd happily never do again?`);
  R('optimai', 'me', 'founder', 'The ROI maths on one hour a week', OP, 'Do your own sums below', `
Quick maths that changed how I talk about AI.

One hour saved a week is about 50 hours a year.

If your time (or your team's) is worth $60 an hour, that's $3,000.

If the fix costs $30 a month and two hours to set up, it pays for itself in the first month or two.

Notice what I didn't do: promise you a number. Use your own hourly cost and your own task. Be suspicious of anyone, me included, who quotes savings without asking what your time is worth.

The best candidates are small, frequent and boring.

What would you do with 50 extra hours this year?`);

  /* ===================== OPTIMAI: COMPANY PAGE POSTS ===================== */
  const OPG = 'LinkedIn (company page)';
  R('optimai', 'page', 'page', 'What is a Workflow Audit?', OPG, 'Book a 20-minute audit', `
What is a Workflow Audit?

It's a 20-minute call where we map one repetitive job in your business and tell you honestly if AI or automation can help.

What we do:
✔ Walk through the task step by step
✔ Estimate the time it takes today
✔ Rank the steps by effort and payoff
✔ Suggest the simplest fix, which is sometimes "do nothing"

What you get:
A one-page summary you can keep, with or without us.

No jargon. No pressure. No obligation.

Book a Workflow Audit with OptimAI: [link]`);
  R('optimai', 'page', 'page', 'Five tasks that are usually safe to automate first', OPG, 'Which would you pick?', `
Starting with AI and automation? Pick a low-risk task first.

Five that are usually safe to try:

1. Meeting notes turned into action lists
2. First drafts of routine emails (a person edits before sending)
3. Enquiry forms that drop into a shared sheet
4. Reminders for overdue invoices or quotes
5. Weekly summary reports pulled from a spreadsheet

Why these? They're frequent, easy to check, and a mistake won't hurt a customer.

Which would save you the most time?

OptimAI helps small and medium businesses start small and build from there.`);
  R('optimai', 'page', 'page', 'AI myths we hear from business owners', OPG, 'Which myth did you believe?', `
Four AI myths we hear all the time:

Myth: "It will replace my staff."
Reality: It usually removes tasks, not people.

Myth: "I need lots of data."
Reality: Many useful uses need none.

Myth: "It's too expensive."
Reality: Many tools cost $20 to $60 a month per person.

Myth: "It's always right."
Reality: It isn't. Always check.

Which one did you believe?

At OptimAI we make AI practical for small teams.`);
  R('optimai', 'page', 'page', 'Tool tip: turn meeting notes into tasks', OPG, 'Try it this week', `
Tool tip for busy teams.

After your next meeting, paste the notes into an AI assistant and ask:

"List the decisions made, the action items, who owns each one and any deadlines. Use a table."

Check the output, fix anything it got wrong, and send it to the team.

Time to try: about five minutes.
Time saved: usually 15 or more.

A reminder: don't paste anything confidential into a tool your business hasn't approved.

Have a tip you'd like us to test? Tell us below.`);
  R('optimai', 'page', 'page', 'A one-page AI policy for small teams', OPG, 'Comment "policy" for the template', `
You don't need a long policy. You need one page.

Our template covers:
• Which tools are approved
• What never goes in
• Who checks AI output before it goes to a customer
• When to tell people AI was used
• Who to ask when unsure

It fits on a single page and takes about 30 minutes to adapt.

Want the template? Comment "policy" or message us.

OptimAI: practical AI for small and medium businesses.`);
  R('optimai', 'page', 'page', 'Free report: where could AI save your business time?', OPG, 'Request your report', `
Where could AI and automation save your business time?

We put together a short, plain-English report that shows:
• The common repetitive tasks in small businesses
• How to score them by time saved and effort
• A simple way to pick your first one

It's free and takes about ten minutes to read.

Request your copy: [link]

OptimAI helps small and medium businesses use AI without the jargon.`);

  /* ===================== OPTIMAI: FULL ARTICLES ===================== */
  R('optimai', 'article', 'linkedin', 'Where should a small business start with AI? A 30-day plan', 'LinkedIn article', 'Book a Workflow Audit', `
Where should a small business start with AI? A 30-day plan

Most small business owners I talk to feel pulled in two directions. Everyone says they should be using AI. Nobody says where to start. So they either do nothing, or they buy a tool and watch it gather dust.

Here is a simple 30-day plan that avoids both.

WEEK 1: LIST THE REPEATING WORK
For five working days, keep a running list of tasks you've done before. "Typed the same reply to a quote enquiry." "Copied invoice details into the sheet." Don't judge them yet. At the end of the week, count how often each appears and roughly how long it takes.

WEEK 2: PICK ONE AND WRITE THE STEPS
Choose the task that is frequent, takes at least 20 minutes, has similar steps each time and starts with digital information. Write the steps in plain language, as if explaining to a new starter. Then ask three questions. Does it need judgement, or is it routine? What happens if it goes wrong? Who owns it?

WEEK 3: TRY THE SIMPLEST TOOL THAT COULD WORK
Use a ladder. A template solves repeated writing. A rule or automation solves repeated moving of data. AI helps with messy language, such as summarising or drafting. Start on the lowest rung that works. If you already use Microsoft 365 or Google Workspace, test the built-in assistant first. Run the new way alongside the old way for a week, and have a person check every output.

WEEK 4: MEASURE AND DECIDE
Count the minutes saved and the errors found. Then make one of three decisions: keep it, change it, or stop. Stopping is a success. You learned cheaply.

THE RULES THAT KEEP YOU SAFE
Keep personal customer data out of tools you haven't checked. Read everything AI writes before a customer sees it. Write down who owns each automation and who gets the alert when it fails.

WHAT TO EXPECT
You won't transform your business in a month. You might get back a few hours a week, and you will have a method you can repeat. That is a very good start.

If you'd like help choosing your first task, OptimAI runs a free 20-minute Workflow Audit. We'll map one task and tell you honestly whether AI helps. [link]`);
  R('optimai', 'article', 'linkedin', 'The honest guide to automating enquiry follow-up', 'LinkedIn article', 'Request a follow-up review', `
The honest guide to automating enquiry follow-up

Every small business has the same leak. An enquiry arrives. Someone means to reply. Two days pass. The customer has already spoken to your competitor.

You don't need a big system to fix it. You need a few small habits that happen on their own.

STEP 1: ONE PLACE FOR ENQUIRIES
Whether they arrive by phone, text, email or a web form, record each one in a single shared sheet or CRM. Include date, name, contact, what they asked for and a status column: New, Replied, Quoted, Won, Lost.

STEP 2: AN INSTANT, HONEST REPLY
Set up an automatic acknowledgement: "Thanks, we've got your enquiry. Here is what happens next and when you'll hear from us." It takes ten minutes and prevents silence.

STEP 3: A REMINDER FOR YOU
If an enquiry is still marked New after 24 hours, you get an alert. Not the customer. You.

STEP 4: QUOTES THAT DON'T SIT
If a quote is sent and there's no reply, a reminder after three days and again after seven. The wording should be human. A short, helpful note beats a stiff template.

WHERE AI HELPS
AI is useful for drafting the quote email from your job notes, and for sorting enquiries into types. It should not send anything unreviewed.

WHAT TO MEASURE
Count enquiries received, replied within one working day, quotes sent and quotes won. Check it monthly. Small changes show up quickly.

WHAT CAN GO WRONG
Reminders firing at the wrong time. A form that stops working. A customer who feels they're being chased. Test it yourself, and review it after a month.

None of this needs custom software. If you'd like a hand mapping your enquiry process, we're happy to help. [link]`);
  R('optimai', 'article', 'linkedin', 'A one-page AI policy for a small team (with template)', 'LinkedIn article', 'Download the template', `
A one-page AI policy for a small team (with template)

If your staff use AI tools, you already have an AI policy. It's just unwritten. A short, clear policy protects your customers, your business and your people.

Here is a simple approach that fits on one page.

1. APPROVED TOOLS
List the tools the business has chosen, and who can use them. Check each tool's data settings, such as whether your inputs are used for training and whether you can switch that off.

2. WHAT NEVER GOES IN
Customer personal information, passwords, bank details, health information and anything covered by a confidentiality agreement. If unsure, remove names and details first, or don't use the tool.

3. HUMAN REVIEW
A person must read and approve anything AI writes before it reaches a customer. AI can draft. People decide.

4. DISCLOSURE
Decide when you'll tell clients or readers that AI helped. Many businesses disclose when it materially shaped the work.

5. WHO TO ASK
Name one person who answers questions and updates the policy.

6. REVIEW
Look at the policy every quarter. Tools change fast.

A SHORT VERSION FOR YOUR TEAM CHAT
"We use approved tools only. We never paste personal customer data into them. A person checks everything before it goes out. If unsure, ask [name]."

THINGS PEOPLE FORGET
Free accounts often have different data terms from business accounts. Browser extensions can read what's on screen. Saved prompts can contain sensitive details.

A policy isn't about slowing people down. It's what lets them use AI with confidence.

Want the editable template? Message me or OptimAI and we'll send it over. [link]`);

  /* ===================== NUDGE: ME POSTS (founder profile) ===================== */
  R('nudge', 'me', 'founder', 'Your analytics probably lie. Run this 10-minute test.', OP, 'Try it and tell me what broke', `
Quick test most founders skip.

You'll need a private browser window and a test email address.

1. Visit your site from a campaign link (add a utm_source to the URL).
2. Sign up or fill in a form with your test email.
3. Check your analytics. Did the visit show with the right source?
4. Check your CRM or email tool. Is the contact there with the same source?
5. Check you were counted once, not three times.

If any step failed, your reports are guessing. And so is your ad spend.

Most of the issues I see aren't fancy. A form that drops the source. A trial that fires twice. Two tools that never talk to each other.

Fix measurement first. Spend second.

Try it today. Then tell me which step broke.`);
  R('nudge', 'me', 'founder', 'Positioning in one sentence', OP, 'Post yours below', `
If you can't say what you do in one sentence, your marketing will be expensive.

Here's the template I give founders:

"We help [who] get [result] without [pain]."

Example (hypothetical): "We help seed-stage SaaS founders see which channels create customers, without hiring an analyst."

Three checks:
1. Could a stranger repeat it back?
2. Does your customer say "that's me"?
3. Is the result something they'd pay for?

Write it. Put it on your homepage and your LinkedIn headline. Then watch which conversations get easier.

Drop your sentence below. I'll give honest feedback on a few.`);
  R('nudge', 'me', 'founder', 'What I would do with your first $2,000 of marketing', OP, 'Disagree? Say why.', `
Opinion time. A founder asks where to spend the first $2,000 on marketing.

Not ads. Here's my order:

1. $0: Write down who you help and what changes for them. (An afternoon.)
2. $0 to $200: Get tracking right. Analytics, a CRM and sources on every form.
3. $300: A clean landing page with one clear action.
4. $200: A welcome email sequence so new signups hear from you.
5. The rest: Test ONE channel for four to six weeks.

Why this order? Ads multiply whatever you already have. If your message is fuzzy and your tracking is broken, ads multiply the mess.

Disagree? I'd like to hear what you'd do differently.`);
  R('nudge', 'me', 'founder', 'Why founder LinkedIn beats a company page early on', OP, 'What has worked for you?', `
For a young company, a founder's profile usually does more than the company page.

Why:
• People follow people, not logos.
• A founder can share an honest opinion. A page tends to sound like an ad.
• Conversations happen in comments and messages, and that's where sales start.

That doesn't mean ignore the page. Use it for offers, proof and partner posts, and share them from your profile.

A simple rhythm: 2 to 3 founder posts a week, one page post, and 15 minutes a day replying to people.

What has worked for you: profile, page or both?`);
  R('nudge', 'me', 'founder', 'Start your email list at 20 people', OP, 'Reply if you want a checklist', `
"I'll start an email list when I have more traffic."

I hear this a lot. It's backwards.

Start with 20. Seriously.

Your first 20 subscribers will reply to your emails, tell you what they care about and give you the best content ideas you'll ever get.

The simplest setup:
1. A signup form on your site.
2. A welcome email that says who you are and what to expect.
3. One useful email a fortnight.
4. A question at the end of each one.

Don't wait for scale. Start the habit now.

How many people are on your list today?`);
  R('nudge', 'me', 'founder', 'The marketing week I would run as a solo founder', OP, 'What does your week look like?', `
If I were a solo founder with about six hours a week for marketing, I'd do this:

Monday (30 min): Check last week's numbers. Signups by source, replies, calls booked.
Tuesday (60 min): Write and publish one post from a real customer question.
Wednesday (60 min): One outreach batch to people who fit.
Thursday (60 min): Improve one page or one email.
Friday (60 min): Write the next newsletter and log what I learned.
Plus 15 minutes a day replying to comments and messages.

It's small, repeatable and measured. Not glamorous. It works because it happens every week.

What does your marketing week look like?`);
  R('nudge', 'me', 'founder', 'Five questions to answer before you hire a marketing agency', OP, 'Save this for later', `
Before you hire an agency, answer these five questions.

1. Who exactly is our customer?
2. What do we want them to do after they find us?
3. Can we see where our customers come from today?
4. Who on our team will own this internally?
5. How will we know in 90 days whether it's working?

If you can't answer them, you're about to pay someone to guess.

Good agencies will ask you these anyway. Great ones help you answer them.

Save this for your next call with an agency.`);
  R('nudge', 'me', 'founder', 'The funnel leak nobody checks: form to CRM', OP, 'Does your form pass the test?', `
A common pattern in startup marketing.

The website gets traffic. The form gets submissions. The sales team says the leads are poor.

Often, the leads are fine. The problem is the handover:
• The form doesn't pass the source to the CRM.
• New leads wait in an inbox.
• Nobody owns the first reply.
• Follow-up depends on memory.

Fixing it takes a few hours: one form, one CRM, one source field, one owner and a reminder.

You may find your marketing was working better than your reports said.

Does your form pass the source to your CRM? Check today.`);
  R('nudge', 'me', 'founder', 'What I tell founders about AI search', OP, 'Share what you are seeing', `
Founders ask me how to "rank in ChatGPT".

My honest answer: nobody can guarantee it. Anyone who does is guessing.

What does seem sensible:
• Clear pages that state plainly what you do and for whom.
• Consistent naming across your site, profiles and listings.
• Honest comparison and explainer content.
• Evidence: case studies, real numbers (when you have them).
• Good basics: fast pages, clean structure.

None of this is new. It's good marketing, done carefully.

Treat AI search as another place people ask questions, not a trick to game.

What are you seeing in your own business?`);
  R('nudge', 'me', 'founder', 'Why Nudge exists', OP, 'Tell me your biggest marketing question', `
Many startups have a strong product and a messy marketing setup.

Leads live in three places. Nobody knows which channel works. Emails go out when someone remembers.

Nudge exists to fix that. We help founders and startups build the plumbing (tracking, CRM and lifecycle email) and the story (positioning and content), so growth can be measured.

We keep it practical, honest and focused on what moves the numbers.

[Add one sentence about why this matters to you.]

If you're a founder, what's the biggest marketing question on your mind right now?`);

  /* ===================== NUDGE: COMPANY PAGE POSTS ===================== */
  R('nudge', 'page', 'page', 'Free 20-minute marketing and tracking review', OPG, 'Book your review', `
Free 20-minute marketing and tracking review for founders.

In 20 minutes we'll look at:
✔ Whether your message is clear to a stranger
✔ Whether your tracking can be trusted
✔ Whether leads reach your CRM with a source
✔ The first three fixes, ranked by effort and impact

You'll get a short written summary afterwards.

No pitch. No obligation.

Book a review with Nudge Digital: [link]`);
  R('nudge', 'page', 'page', 'The five-question tracking check', OPG, 'Save and share with your team', `
Five questions to check your tracking.

1. Can you see which channel produced each signup?
2. Does the source reach your CRM with the contact?
3. Is a trial start counted once?
4. Can you separate paid, organic, referral and direct?
5. Does one named person own the setup?

Hesitated on two or more? Fix measurement before spending on ads.

Nudge Digital helps founders build marketing they can measure.`);
  R('nudge', 'page', 'page', 'The first five lifecycle emails to build', OPG, 'Which one are you missing?', `
The first five lifecycle emails every SaaS should build:

1. Welcome: who we are and what to do first
2. Activation nudge: help them reach first value
3. Feature highlight: one useful thing they may have missed
4. Trial ending: clear next step, no tricks
5. Win-back: a respectful note to inactive users

Start with the welcome email. Add one a month.

Which one are you missing?

Nudge Digital builds lifecycle email for startups.`);
  R('nudge', 'page', 'page', 'For agencies: add specialist services without hiring', OPG, 'Book a partner call', `
Agency owners: want to offer tracking, CRM or lifecycle email without hiring?

Our partner programme gives you:
• A specialist team you can refer to or white-label
• A clear handover process
• Transparent pricing and reporting
• Monthly check-ins

We work best when scopes are written down and both sides know who does what.

Book a partner call: [link]`);
  R('nudge', 'page', 'page', 'Nudge Notes: a fortnightly email for founders', OPG, 'Subscribe', `
Introducing Nudge Notes.

A short email every fortnight for founders and startup teams. Each edition has:
• One practical fix for your funnel
• One template you can copy
• One lesson from a real conversation

No spam. No hype. Unsubscribe any time.

Subscribe here: [link]`);
  R('nudge', 'page', 'page', 'Product launch checklist', OPG, 'Save this for launch day', `
Launching soon? A short checklist.

BEFORE
☐ Waitlist and launch page live
☐ Tracking tested end to end
☐ Welcome and launch emails written
☐ Posts scheduled
☐ Partners briefed

DURING
☐ Founder posts each day
☐ Reply to every comment
☐ Share partner and customer posts

AFTER
☐ Thank-you emails
☐ Review the numbers
☐ Write down what you'd change

Save it for your next launch. Nudge Digital helps startups get ready.`);

  /* ===================== NUDGE: FULL ARTICLES ===================== */
  R('nudge', 'article', 'linkedin', 'Positioning in one sentence: a founder guide', 'LinkedIn article', 'Book a review', `
Positioning in one sentence: a founder guide

Most startup marketing problems are positioning problems wearing a disguise. Ads don't convert. Emails get ignored. Sales calls feel hard. Behind many of them is the same issue: a stranger can't tell what you do, who it's for or why it matters.

Here is a practical way to fix it in an afternoon.

THE SENTENCE
"We help [who] get [result] without [pain]."

WHO
Be specific. "Small businesses" is not a who. "Seed-stage B2B SaaS founders with no marketing hire" is. If you can picture the person, you can write to them.

RESULT
Describe what changes for them, not what you do. "Know which channels create customers" beats "analytics consulting".

PAIN
Name what they dread. Hiring an analyst. Waiting six months. Learning a new tool. This is the part that makes people nod.

A HYPOTHETICAL EXAMPLE
"We help seed-stage SaaS founders see which channels create customers, without hiring an analyst."

THREE CHECKS
1. Can a stranger repeat it back after five seconds?
2. Would your best customer say, "That's me"?
3. Is the result something they'd pay for?

WHERE TO USE IT
Your homepage headline, your LinkedIn headline, the first line of your outreach and your newsletter welcome email. Use the same words everywhere. Consistency is what makes people remember you.

HOW TO TEST IT
Show the sentence to five people who fit your audience. Ask what they think you do. If their answers differ from yours, edit and repeat.

Nobody gets it perfect the first time. The goal is a clear starting point that you improve with real conversations.

If you'd like a second pair of eyes on yours, Nudge Digital offers a free 20-minute marketing and tracking review. [link]`);
  R('nudge', 'article', 'linkedin', 'The first five lifecycle emails every SaaS startup needs', 'LinkedIn article', 'Request an email review', `
The first five lifecycle emails every SaaS startup needs

Most founders send emails when they remember. Lifecycle email is the opposite: a small set of messages that go out automatically at the moments when people need them. You can build the first five in a week.

1. THE WELCOME EMAIL (send immediately)
Purpose: tell people who you are, what to do first and how to get help. Keep it under 150 words. Ask one question, such as "What are you hoping to solve?" and invite replies. Metric to watch: reply rate.

2. THE ACTIVATION NUDGE (day 2 or 3)
Purpose: help them reach first value. If someone signed up but hasn't done the key action, point them to it with a single link. Metric: percentage who complete the key action.

3. THE FEATURE HIGHLIGHT (day 7)
Purpose: show one useful thing they may have missed, with a short example. Don't list every feature. Metric: clicks and feature use.

4. THE TRIAL-ENDING EMAIL (two to three days before the end)
Purpose: give a clear next step. Be honest about what happens when the trial ends. Metric: trial-to-paid conversion.

5. THE WIN-BACK EMAIL (30 days of inactivity)
Purpose: a short, respectful note asking whether they'd like help or whether you should stop emailing. Metric: reactivations and unsubscribes.

BEFORE YOU BUILD
Check that you can identify each person's stage, that unsubscribes work, and that your sending rules follow the Spam Act and any privacy rules that apply to you.

HOW TO MEASURE
Track opens loosely (privacy features distort them), and focus on replies, clicks, activation and conversion.

START SMALL
Build the welcome email this week. Add one email a month. Review what people reply to, and let that guide the next message.

Want help planning yours? Nudge Digital builds lifecycle email for startups. [link]`);
  R('nudge', 'article', 'linkedin', 'Marketing for founders with no budget: a four-week plan', 'LinkedIn article', 'Book a review', `
Marketing for founders with no budget: a four-week plan

You don't need a big budget to learn what works. You need a clear message, working tracking and a steady weekly habit. Here's a four-week plan for a founder with around six hours a week.

WEEK 1: CLARITY AND MEASUREMENT
Write your one-sentence positioning ("We help [who] get [result] without [pain]"). Set up analytics, and make sure every form passes its source to a CRM or spreadsheet. Test it in a private window. Outcome: a clear message and numbers you can trust.

WEEK 2: TALK TO PEOPLE
List 30 people who fit your audience. Connect with ten, message five, and book two conversations. Write down every question they ask. These are your first content ideas. Outcome: real language from real customers.

WEEK 3: SHOW UP
Publish three LinkedIn posts from the questions you collected. Start a simple welcome email for new signups. Reply to every comment. Outcome: a visible voice and an email habit.

WEEK 4: IMPROVE ONE THING
Look at the numbers. Which post got replies? Which conversation led to a call? Which page lost people? Improve one page, one email and one message. Outcome: a clear next step for month two.

WHAT TO SKIP
Paid ads until the message and tracking are solid. Fifty blog posts. Complicated tools. Anything you can't measure.

WHAT TO EXPECT
Not overnight growth. You should end the month with a clearer message, reliable numbers, a handful of real conversations and a rhythm you can repeat.

If you'd like help setting up the basics, Nudge Digital offers a free 20-minute marketing and tracking review. [link]`);

  /* shared labels used by the app */
  C.meta = C.meta || {};
})();
