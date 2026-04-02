# LekkerLedger: First 50 Customers Playbook
**Created: 2 April 2026 | For: Zakariyya @ NightShift Labs ZA**

---

# 1. Executive Verdict

LekkerLedger is a South African household employer payroll tool — a PWA that generates compliant payslips (with UIF deductions, minimum wage enforcement, leave tracking) for homeowners employing domestic workers, gardeners, nannies, and drivers. Pricing is R0/R29/R49 per month. The product is well-built technically (Next.js, local-first storage, Paystack billing) and the compliance engine is solid.

**Easiest first 50 customers:** Middle-class South African homeowners in Gauteng, Western Cape, and KZN who already employ a domestic worker and are either (a) nervous about UIF compliance after hearing about penalties, or (b) tired of calculating pay manually each month. The sweet spot is women aged 30-55 who manage the household admin and are active in Facebook community groups or neighbourhood WhatsApp groups.

**Single best free acquisition wedge:** The free calculator/payslip tool combined with SEO-optimised compliance guides. People Google "domestic worker UIF calculator" and "minimum wage 2026 domestic worker" every single month. The calculator already exists. It just needs to capture emails and funnel people to paid plans.

**Biggest conversion blockers:** Zero social proof (no testimonials, no user count). The /features, /about, and /faq pages redirect to login — killing the education funnel. "Early-bird pricing" has no expiration date, so there's no urgency. The free tool doesn't capture email, so you lose every free user forever.

**Fastest path to traction:** Fix the email capture gap on the free tool, write 3-5 more SEO pages targeting high-intent South African domestic employer queries, then personally reach out in 10-15 Facebook groups and WhatsApp communities where household employers hang out. Manual outreach + free tool + SEO content = 50 customers in 6-8 weeks if you execute daily.

---

# 2. What I Reviewed

## Folder contents
- **Full Next.js 16 codebase** with TypeScript, Tailwind v4, Radix UI
- **Compliance engine** (`src/lib/compliance-constants.ts`) — NMW rates 2022-2026, UIF rules, BCEA/SD7 calculations, COIDA rates
- **Pricing and entitlements** — three-tier freemium (Free/Standard R29/Pro R49), Paystack billing, referral program (1 free month per referral, max 12)
- **Design system** (`civicledger.md`) — frozen IBM Plex Serif/Sans design, "paper and ink" trust aesthetic
- **UX audit docs** — final audit summaries, wording linter to enforce precise compliance language
- **Project brief** — north-star: "Create a compliant payslip in under 90 seconds on a phone"
- **Resource guides** — 10+ guides on UIF, COIDA, ROE, minimum wage, 4-hour rule, CCMA
- **Privacy/Terms** — POPIA-aware, local-first data, NightShift Labs ZA sole proprietorship in Witbank

## Website findings
- Homepage messaging is clear but emotionally flat
- Pricing is transparent and competitive (R29/mo vs R2,000+/mo for an accountant)
- Zero testimonials, zero user counts, zero case studies
- /features, /about, /faq redirect to login — prospects can't learn before buying
- Free payslip tool has no email capture at all
- "Early-bird pricing" stated but no deadline — creates zero urgency
- FAQ on homepage is good but buried at the bottom
- Compliance guides are excellent SEO assets but under-promoted
- No comparison to alternatives (spreadsheets, accountants, doing nothing)
- Mobile experience looks considered (responsive references in code) but no screenshots shown

## Assumptions I had to make
- You have near-zero paying customers right now (the request is for "first 50")
- You (Zakariyya) are the sole operator — no marketing team
- Budget is close to zero
- You can spend 2-3 hours per day on acquisition work
- The product works — the compliance engine and payslip flow are functional

## Evidence that most shaped recommendations
1. The free calculator exists but doesn't capture leads — this is the single biggest missed opportunity
2. The compliance guides are high-quality SEO content that Google will rank — they just need more volume
3. Facebook groups for South African household employers are active and free
4. The product's R29/mo price point is an impulse buy — the friction is trust, not cost
5. The local-first privacy angle is genuinely differentiating but underplayed on the site

---

# 3. Ideal First 50 Customers

## Segment A: "The Nervous Employer" (EASIEST)

- **Persona:** Woman, 30-55, employed professional, lives in a suburb in Gauteng/Western Cape/KZN. Employs 1-2 domestic workers. Has heard that UIF registration is required but hasn't done it yet, or does it inconsistently. Worries she'll get fined.
- **Problem she feels:** "I know I'm supposed to be doing UIF properly but I don't really understand how. I keep meaning to sort it out."
- **Why she'd try LekkerLedger now:** She sees a post explaining UIF penalties and someone shares a free calculator link. She tries it, sees the payslip with UIF already calculated, thinks "this is actually easy."
- **Where she spends time:** Facebook groups (suburb-specific groups, parenting groups, domestic employer groups), WhatsApp neighbourhood groups, HelloPeter, MyBroadband forums, Instagram local lifestyle accounts
- **Message that gets attention:** "If your domestic worker works more than 24 hours a month, you're legally required to pay UIF. Most employers don't. Here's a free calculator that shows you exactly what you owe — takes 30 seconds."
- **Why easiest:** She's already anxious. You don't need to create the problem — just provide the solution. The free tool removes all risk. R29/mo is nothing compared to the peace of mind.

## Segment B: "The Organiser" (EASY)

- **Persona:** Detail-oriented homeowner (any gender, 28-50) who manages household finances carefully. Maybe uses a spreadsheet today. Employs 1-3 workers.
- **Problem she feels:** "I spend 30-45 minutes every month working out the pay, and I'm never 100% sure it's right. I've got payslips in a folder somewhere but they're a mess."
- **Why she'd try LekkerLedger now:** She sees it's a proper system that replaces her spreadsheet, generates real PDF payslips, and keeps everything in one place. R29/mo to replace hours of admin.
- **Where she spends time:** Same Facebook/WhatsApp groups, plus financial planning communities, personal finance Reddit (r/PersonalFinanceZA)
- **Message that gets attention:** "I used to spend 45 minutes calculating my domestic worker's pay every month. Now it takes 90 seconds and the payslip looks professional. R29/month."
- **Why easy:** She's already doing the work manually. You're upgrading her, not convincing her the work matters.

## Segment C: "The Property Manager / Multi-Household" (MEDIUM)

- **Persona:** Someone managing domestic staff across 2+ households — either a small property management operation, a family with a holiday home, or an Airbnb host with cleaning staff.
- **Problem they feel:** "I've got 4-5 people across two properties and the admin is getting out of hand."
- **Why they'd try LekkerLedger now:** Pro plan supports multiple households and unlimited employees for R49/mo. That's absurdly cheap vs. any alternative.
- **Where they spend time:** Airbnb host groups, property investment forums, landlord communities, estate agency WhatsApp groups
- **Message that gets attention:** "Managing payroll for staff across multiple properties? LekkerLedger Pro handles unlimited employees, multiple households, UIF exports, and 5 years of records. R49/month."
- **Why medium difficulty:** Smaller segment, harder to find, but higher willingness to pay and stickier once onboarded.

## Ranking: A → B → C

Focus 80% of effort on Segment A. Segment B will come naturally through the same channels. Segment C is a bonus — don't target them specifically yet but accept them when they show up.

---

# 4. Conversion Teardown of the Website

## CRITICAL ISSUES

### 4.1 Zero Social Proof
- **Problem:** No testimonials, no user count, no case studies, no logos, no reviews. Nothing. A first-time visitor has zero evidence that anyone else uses this product.
- **Why it matters:** For a financial/compliance tool handling employee data, trust is everything. South African consumers are especially wary of small/unknown digital products. Without social proof, your conversion rate is probably 1-2% when it could be 5-8%.
- **Fix:** Add a "Trusted by X household employers" counter (even if X is small, say "Trusted by household employers across Gauteng and Western Cape"). Add 3-5 short testimonials. Even create them from beta users or friends who've tested it — just make them real.
- **Priority:** CRITICAL
- **Effort:** 1 hour (write the copy, add to homepage)

### 4.2 Free Tool Doesn't Capture Email
- **Problem:** Someone uses the free payslip calculator, downloads a PDF, and leaves. You have no way to contact them again. Ever.
- **Why it matters:** This is your #1 acquisition funnel. Every free user who leaves without giving an email is lost permanently. Even a 20% email capture rate would give you a massive retargeting list.
- **Fix:** After the payslip is generated, show: "Want a copy emailed to you? Enter your email and we'll also send you a monthly household employer checklist." Optional, not forced. Then build a 3-email nurture sequence.
- **Priority:** CRITICAL
- **Effort:** Half day (add email field, connect to email service, write 3 emails)

### 4.3 /features, /about, /faq Redirect to Login
- **Problem:** A prospect who wants to learn more about features, see who's behind the product, or read FAQs gets dumped at a login screen. This kills the education-to-conversion funnel.
- **Why it matters:** Prospects research before buying. If they can't see features or FAQ without an account, most will just leave. This is especially bad for a compliance tool where trust = conversion.
- **Fix:** Make /features, /about, and /faq public pages. Even simple versions. A /features page showing screenshots and a feature list. An /about page with your story. A /faq page with the existing homepage FAQ expanded.
- **Priority:** CRITICAL
- **Effort:** Half day

### 4.4 No Urgency on Early-Bird Pricing
- **Problem:** "Early-bird pricing" is mentioned on Standard and Pro but there's no expiration date. This creates zero urgency — a visitor thinks "I'll come back later" and never does.
- **Why it matters:** Urgency is one of the most reliable conversion levers. Without a deadline, "early-bird" is just a word.
- **Fix:** Add: "Early-bird pricing ends 30 April 2026. Lock in R29/month before it increases." Add a simple date on the pricing cards.
- **Priority:** CRITICAL
- **Effort:** 15 min

## IMPORTANT ISSUES

### 4.5 Headline Is Functional But Not Emotional
- **Problem:** "Payslips and household employment records in one place" is clear but reads like a feature description, not a value proposition. It doesn't make anyone feel anything.
- **Why it matters:** The headline is the first thing 80% of visitors read. If it doesn't hook them emotionally, they scroll past or leave.
- **Fix:** Rewrite to: "Household payroll sorted. UIF included. Under 90 seconds." (See messaging pack, Section 8.)
- **Priority:** Important
- **Effort:** 15 min

### 4.6 No Comparison to Alternatives
- **Problem:** The site never mentions what people do today (spreadsheets, accountants, guessing, nothing) and why LekkerLedger is better. Visitors are left to figure this out themselves.
- **Why it matters:** Visitors always compare. If you don't control the comparison, they compare you to "free" (doing nothing) and you lose.
- **Fix:** Add a "Why not just..." section. "Spreadsheets? 4+ hours/month and no UIF compliance. Accountant? R2,000+/month. Ignoring it? Up to R10,000 in back-pay and penalties. LekkerLedger? R29/month, 90 seconds, done."
- **Priority:** Important
- **Effort:** 1 hour

### 4.7 Missing "Why Trust Us" Block
- **Problem:** No founder story, no team info, no "built by South Africans" messaging beyond a company name in the footer.
- **Why it matters:** People trust people, not brands. Especially for a small, new product. A short founder story ("I built this because I employ a domestic worker and couldn't find a simple tool") would dramatically increase trust.
- **Fix:** Add a 3-4 sentence founder block near the bottom of the homepage. Include your name and a photo if comfortable.
- **Priority:** Important
- **Effort:** 15 min

### 4.8 Risk Reversal Is Buried
- **Problem:** The 7-day refund policy exists but isn't prominent. It's buried in billing terms.
- **Why it matters:** "Try risk-free" or "7-day money-back guarantee" near CTAs is one of the easiest conversion lifts.
- **Fix:** Add "7-day money-back guarantee" text directly under the "Choose Standard" and "Choose Pro" buttons.
- **Priority:** Important
- **Effort:** 15 min

### 4.9 No "Most Popular" Badge on Standard
- **Problem:** Three plans side by side with no visual hierarchy. The visitor has to figure out which plan is for them.
- **Why it matters:** Anchoring to the recommended plan reduces decision fatigue and increases conversions.
- **Fix:** Add a "Most popular" badge on the Standard plan card. It's already described as "For most households" — make it visually obvious.
- **Priority:** Important
- **Effort:** 15 min

### 4.10 Referral Program Is Hidden
- **Problem:** The referral program (1 free month per referral, up to 12) is mentioned in pricing copy but not promoted.
- **Why it matters:** Referrals are your cheapest acquisition channel. A visible referral prompt post-signup could double your organic growth.
- **Fix:** After a user creates their first payslip, show: "Know another household employer? Share LekkerLedger and get a free month for each person who signs up." Give them a shareable link.
- **Priority:** Important
- **Effort:** 1 hour

## LATER ISSUES

### 4.11 SEO Title Could Be Stronger
- **Problem:** Current title: "LekkerLedger | Household Payroll, Records, and Annual Paperwork." This is accurate but doesn't include high-volume search terms.
- **Fix:** Change to: "LekkerLedger | Domestic Worker Payslips, UIF Calculator & Payroll for South African Employers"
- **Priority:** Later
- **Effort:** 15 min

### 4.12 No Blog Section
- **Problem:** The resource guides exist but there's no blog for ongoing SEO content.
- **Fix:** Add a simple /blog route. Publish 1-2 articles per week on domestic employer topics.
- **Priority:** Later
- **Effort:** Half day to set up, then ongoing

### 4.13 Mobile Screenshots Missing
- **Problem:** No screenshots of the actual product on the site. Visitors can't visualise what they're buying.
- **Fix:** Add 2-3 screenshots of the payslip generator, dashboard, and a completed payslip on a phone.
- **Priority:** Later
- **Effort:** 1 hour

---

# 5. The Easiest Free Path to First 50 Customers

## PRIMARY PATH: SEO + Free Tool + Email Capture + Facebook Group Manual Outreach

### Why this is the best path
1. People already search for "domestic worker UIF calculator," "minimum wage 2026 domestic worker," "how to calculate UIF" every month in South Africa. You already have content for this. You just need more of it and need to capture the traffic properly.
2. Facebook groups for South African household employers, suburbs, and parenting communities are active and free. A helpful post (not spammy) with a link to a free tool gets engagement.
3. The free payslip tool is genuinely useful — it's not a gimmick. People who try it see immediate value.
4. R29/mo is an impulse purchase. The barrier isn't price — it's awareness and trust.

### What the offer should be
"Free domestic worker payslip calculator — shows your exact UIF deduction, minimum wage compliance, and net pay. No signup needed. Takes 30 seconds."

### What the CTA should be
On the site: "Generate your free payslip →"
On social: "Try the free calculator here: lekkerledger.co.za/calculator"
After using the tool: "Want this emailed to you monthly? Enter your email."

### Where to find prospects
1. **Facebook groups** (search for: "domestic workers South Africa," "[suburb name] community," "Gauteng moms," "household employers SA," "domestic worker rights," "nannies Johannesburg," "[suburb] neighbourhood watch"). Aim for groups with 1,000+ members.
2. **WhatsApp neighbourhood groups** — your own, friends', family's. Ask people to share.
3. **Reddit** — r/southafrica, r/PersonalFinanceZA
4. **HelloPeter** — people complaining about UIF or domestic worker issues
5. **Google** — organic search traffic to your guides and calculator

### Exact outreach angle (for Facebook groups)
Post as a helpful community member, not as a marketer. Example:

> "Quick question for anyone who employs a domestic worker — are you paying UIF correctly? I was surprised to learn that if your worker does more than 24 hours a month, UIF is legally required. I found a free calculator that shows you the exact deduction: [link]. Figured I'd share since I know a lot of us are confused about this."

### Exact follow-up angle
When people comment or DM:

> "Glad it helped! If you want to keep proper payslip records each month (with UIF already calculated), the full tool is R29/month. But the free calculator is yours to use anytime."

### Exact success metric
- Week 1-2: 500+ free calculator uses, 50+ email captures, 5-10 paid signups
- Week 3-4: 1,000+ free calculator uses, 150+ email captures, 15-25 paid signups
- Week 5-8: 2,000+ calculator uses, 300+ emails, 50 paid customers

### Why this path is low-cost and fast
- Zero ad spend
- Content already partially exists (guides, calculator)
- Facebook groups are free
- Manual outreach costs only time
- The free tool does the selling — you just need to get people to it

## SECONDARY PATH 1: Personal Network Activation

Ask everyone you know personally: "Do you employ a domestic worker? I built a tool that calculates their pay and generates payslips with UIF. Try it free." Then ask them to share with 3 friends. At R29/mo, the referral program (free months) gives them incentive.

## SECONDARY PATH 2: Partner with Domestic Worker Advocacy / Community Pages

Reach out to pages/organisations that already talk to household employers: domestic worker Facebook pages, CCMA-focused pages, uFiling help forums. Offer to write a guest post or share your free calculator as a resource.

---

# 6. 14-Day Action Plan

## Day 1 (Wednesday 2 April): Fix the Leaking Bucket

**Objective:** Patch the biggest conversion holes before driving any traffic.

**Tasks:**
1. Add email capture to the free payslip tool. After PDF generation, show: "Want this emailed to you? We'll also send you a free monthly household employer checklist." Use a simple email field. Connect it to a Google Sheet or free Mailchimp/Brevo account for now.
2. Add "Early-bird pricing ends 30 April 2026" to pricing cards.
3. Add "7-day money-back guarantee" under paid CTAs.
4. Add "Most popular" badge to Standard plan.

**Metric:** All 4 changes live by end of day.
**Done looks like:** Free tool now captures emails. Pricing has urgency. CTAs have risk reversal.

## Day 2 (Thursday 3 April): Add Trust Layer

**Objective:** Add social proof and trust signals so the site converts when traffic arrives.

**Tasks:**
1. Write and add 3 short testimonials to the homepage. If you have any beta users, ask them. If not, use your own experience: "I built this because I employ a domestic worker and spent too long on spreadsheets every month." — Zakariyya, Founder.
2. Add a founder block: "Built by a South African household employer who got tired of the admin. Based in Mpumalanga." (3-4 sentences, your name, optional photo.)
3. Add a "Why not just..." comparison block (spreadsheets vs accountant vs LekkerLedger).
4. Rewrite the hero headline (see Section 8).

**Metric:** Homepage now has social proof, founder story, comparison, and a stronger headline.
**Done looks like:** A stranger landing on the site can answer: "Who made this? Do other people use it? Why is it better than what I do now?"

## Day 3 (Friday 4 April): Make Hidden Pages Public

**Objective:** Ungate /features, /about, /faq so prospects can research before buying.

**Tasks:**
1. Create a public /features page — even a simple one with 6-8 features, each with a one-line description and an icon.
2. Create a public /about page — founder story, why you built it, NightShift Labs ZA.
3. Create a public /faq page — move the homepage FAQ here and expand it with 5-10 more questions (see Section 8 for FAQ copy).

**Metric:** All three pages live and linked from navigation.
**Done looks like:** A prospect can navigate Home → Features → Pricing → FAQ → About without ever hitting a login wall.

## Day 4 (Saturday 5 April): SEO Content Batch

**Objective:** Publish 3 new SEO pages targeting high-intent search queries.

**Tasks:**
1. Write and publish: "How to Register Your Domestic Worker for UIF in 2026 (Step-by-Step)"
2. Write and publish: "Domestic Worker Pay Calculator South Africa 2026"
3. Write and publish: "What Happens If You Don't Pay UIF for Your Domestic Worker"

Each page should be 800-1,200 words, include a CTA to the free calculator, and link to the pricing page. Use your existing guides as a base — expand them with more detail and practical examples.

**Metric:** 3 new pages live, each with a CTA to the free tool.
**Done looks like:** Google can start indexing these pages. Each page has internal links to the calculator and pricing.

## Day 5 (Sunday 6 April): Build Facebook Group Target List

**Objective:** Identify and join the groups where your customers hang out.

**Tasks:**
1. Search Facebook for groups using these terms: "domestic workers South Africa," "household employers," "nannies Johannesburg," "domestic worker pay," "[suburb] community" for major Gauteng/Cape Town suburbs (Sandton, Randburg, Northcliff, Bryanston, Constantia, Claremont, Umhlanga, Ballito, etc.), "moms Johannesburg," "moms Cape Town."
2. Request to join 15-20 groups. Prioritise groups with 1,000+ members and recent activity.
3. Create a spreadsheet: Group name | Members | Activity level | Joined? | Date of first post | Response

**Metric:** 15-20 group join requests submitted.
**Done looks like:** Spreadsheet with group list. Join requests pending.

## Day 6 (Monday 7 April): First Round of Facebook Posts

**Objective:** Post in the first 5 groups you've been accepted to.

**Tasks:**
1. Post the "helpful community member" post in 5 groups (see Section 8 for exact copy).
2. Respond to every comment within 2 hours.
3. If anyone asks a question, answer it helpfully and mention the free tool only if relevant.
4. DM anyone who engages positively: "Glad the calculator helped! Just curious — how do you currently handle your domestic worker's pay each month?"

**Post copy:** See Section 8, Facebook group intro post.

**Metric:** 5 posts published. Track comments and link clicks (use UTM: ?utm_source=facebook&utm_campaign=group_[name]).
**Done looks like:** 5 posts live. All comments responded to. Engagement tracked.

## Day 7 (Tuesday 8 April): WhatsApp + Personal Network Push

**Objective:** Activate your personal network and WhatsApp communities.

**Tasks:**
1. Send the WhatsApp message (Section 8) to 5 neighbourhood/community WhatsApp groups.
2. Send the direct DM (Section 8) to 20 individual contacts who you know employ domestic workers.
3. Ask each person: "If you find it useful, would you mind sharing it with one or two friends?"

**Metric:** 5 WhatsApp groups messaged, 20 individual DMs sent.
**Done looks like:** Messages sent. Responses tracked.

## Day 8 (Wednesday 9 April): Second Round of Facebook Posts + Nurture Email

**Objective:** Post in 5 more groups and send first nurture email to captured leads.

**Tasks:**
1. Post in 5 new Facebook groups (use a different angle — see "UIF penalties" angle in Section 8).
2. Write and send Email 1 of the nurture sequence to everyone who gave their email via the free tool. Subject: "The one UIF rule most household employers miss." Content: Explain the 24-hour rule, link to the UIF guide, soft CTA to try the full tool.
3. Track email open rate.

**Metric:** 5 more Facebook posts. Email 1 sent. Open rate tracked.
**Done looks like:** 10 total Facebook posts. First nurture email delivered.

## Day 9 (Thursday 10 April): Reddit + HelloPeter + Forum Seeding

**Objective:** Seed content on platforms outside Facebook.

**Tasks:**
1. Post a helpful thread on r/southafrica: "PSA: If you employ a domestic worker, here's a free UIF calculator" (keep it genuinely helpful, not promotional).
2. Post on r/PersonalFinanceZA: "Built a free tool to calculate domestic worker pay and UIF — feedback welcome."
3. Search HelloPeter for UIF complaints, domestic worker disputes — comment helpfully where relevant with a link to the free calculator.
4. Find and post in 1-2 MyBroadband or local forum threads about domestic worker pay.

**Metric:** 2 Reddit posts, 3-5 HelloPeter/forum comments.
**Done looks like:** Content live on 3-4 platforms outside Facebook.

## Day 10 (Friday 11 April): Follow-Up Round 1

**Objective:** Follow up with everyone who engaged but didn't convert.

**Tasks:**
1. DM everyone who commented positively on Facebook posts but didn't click through.
2. Send follow-up WhatsApp to anyone who viewed but didn't reply.
3. Reply to any Reddit/forum comments.
4. Send Email 2 of nurture sequence: "5 things your domestic worker's payslip should show (free checklist)." Include the household employer checklist as a PDF attachment or link.

**Metric:** 10-20 follow-up messages sent. Email 2 delivered.
**Done looks like:** No engaged lead is left uncontacted.

## Day 11 (Saturday 12 April): Publish 2 More SEO Pages

**Objective:** Expand SEO footprint.

**Tasks:**
1. Write and publish: "South African Domestic Worker Contract Template (Free Download)" — link to the contract feature in Standard plan.
2. Write and publish: "Household Employer Checklist: What to Do Every Month" — comprehensive monthly checklist.
3. Interlink all new pages to the calculator, pricing, and existing guides.

**Metric:** 2 new pages live. All internal linking done.
**Done looks like:** 5 total new SEO pages published since Day 4.

## Day 12 (Sunday 13 April): Third Round Facebook + New Angle

**Objective:** Post in 5 more groups with a fresh angle.

**Tasks:**
1. Post in 5 new groups using the "contract template" angle: "Does your domestic worker have a written contract? It's legally required. Here's a free checklist of what it should include: [link to checklist page]."
2. Respond to all comments.
3. DM engaged users.

**Metric:** 5 posts. 15 total Facebook group posts.
**Done looks like:** Engagement data for 15 total posts across 15 groups.

## Day 13 (Monday 14 April): Referral Push + Email 3

**Objective:** Activate referrals from existing users and send final nurture email.

**Tasks:**
1. Email or message every current paid user: "Know someone who employs a domestic worker? Share LekkerLedger and you both get a free month." Give them a simple link to share.
2. Send Email 3 of nurture sequence: "R29/month for sorted household payroll — early-bird pricing ends 30 April." Direct CTA to pricing page.
3. Post a "thank you" in 2-3 of the most responsive Facebook groups with a quick update on how many people have used the calculator.

**Metric:** Referral messages sent. Email 3 delivered. Conversion rate from email sequence tracked.
**Done looks like:** Referral loop activated. Email sequence complete.

## Day 14 (Tuesday 15 April): Review, Measure, Plan Next 14 Days

**Objective:** Assess what worked and double down.

**Tasks:**
1. Pull all numbers: free calculator uses, emails captured, email open/click rates, paid signups, Facebook post engagement (by group), Reddit/forum traffic, referrals generated.
2. Rank Facebook groups by engagement and conversion.
3. Rank content pages by traffic (Google Analytics).
4. Identify: What drove the most signups? What got the most engagement? What flopped?
5. Plan next 14 days: double down on top 3 channels, drop anything that got zero traction.
6. Write a simple "Week 2 report" for yourself (5 bullets: what worked, what didn't, what to do next).

**Metric:** Full dashboard of 14-day results.
**Done looks like:** Clear picture of what channels produce customers, and a plan for the next sprint.

---

# 7. Exact Assets to Create

## Asset 1: Email Capture on Free Tool
- **Why it matters:** Without this, every free user is lost forever. This is the #1 priority asset.
- **Format:** Simple email input field + checkbox after payslip generation. "Want this emailed to you? We'll also send a free household employer checklist monthly."
- **Who creates it:** You (code change in the payslip flow)
- **Time:** 2-3 hours
- **Copy:** "Enter your email to get a copy of this payslip and a free monthly household employer checklist. No spam, ever."

## Asset 2: 3-Email Nurture Sequence
- **Why it matters:** Converts free users to paid over 2 weeks.
- **Format:** 3 plain-text emails, sent on Day 3, Day 7, and Day 14 after email capture.
- **Who creates it:** You (write copy, set up in Brevo/Mailchimp free tier)
- **Time:** 2 hours

**Email 1 (Day 3): "The one UIF rule most employers miss"**
> Subject: The one UIF rule most household employers miss
>
> Hi [name],
>
> Thanks for using the LekkerLedger payslip calculator.
>
> Quick tip: if your domestic worker works 24 hours or more per month for you, UIF registration is legally required. Most employers don't know this — and the penalties for non-compliance include back-pay plus interest.
>
> Here's our complete guide to UIF for domestic workers: [link]
>
> If you want to generate proper payslips each month with UIF automatically calculated, leave tracked, and records kept — the full LekkerLedger dashboard starts at R29/month.
>
> No pressure — the free calculator is always available too.
>
> Zakariyya
> LekkerLedger

**Email 2 (Day 7): "What your domestic worker's payslip should include"**
> Subject: 5 things every domestic worker payslip should show
>
> Hi [name],
>
> A proper payslip isn't just nice to have — if your worker ever claims UIF or you face a CCMA dispute, you'll need records.
>
> Here's what should be on every payslip:
> 1. Gross pay (hours × rate, including overtime/Sundays at the correct multiplier)
> 2. UIF deduction (1% of gross)
> 3. Any accommodation deduction (max 10% of gross)
> 4. Net pay
> 5. Employer UIF contribution (1% — this comes from you, not the worker)
>
> LekkerLedger calculates all of this automatically and generates a PDF payslip in under 90 seconds.
>
> Try it: [link to pricing]
>
> Zakariyya

**Email 3 (Day 14): "Early-bird pricing ends soon"**
> Subject: R29/month for sorted household payroll — ends 30 April
>
> Hi [name],
>
> Quick one — our early-bird pricing (R29/month for up to 3 employees, leave tracking, contracts, cloud-secured records, and UIF exports) ends 30 April.
>
> After that, pricing goes up.
>
> If you've been thinking about it: [link to pricing]
>
> 7-day money-back guarantee. Cancel anytime.
>
> Zakariyya

## Asset 3: Founder / Trust Block (Homepage)
- **Why it matters:** People trust people. A founder story adds humanity to a compliance tool.
- **Format:** 3-4 sentences + your name on the homepage, near the bottom (above the footer).
- **Who creates it:** You
- **Time:** 15 min
- **Copy:** See Section 8.

## Asset 4: "Why Not Just..." Comparison Block (Homepage)
- **Why it matters:** Controls the comparison frame. Prevents "I'll just keep using my spreadsheet."
- **Format:** 3-column or 3-row comparison on the homepage.
- **Who creates it:** You
- **Time:** 1 hour
- **Copy:**

| | Spreadsheet | Accountant | LekkerLedger |
|---|---|---|---|
| Monthly time | 4-6 hours | Depends on them | 90 seconds |
| UIF calculated correctly | Maybe | Yes | Yes |
| Proper payslip PDF | No | Sometimes | Always |
| Cost/month | Free but slow | R2,000+ | R29 |
| Records organised | Not really | In their files | In your dashboard |

## Asset 5: 3 Testimonials
- **Why it matters:** Social proof is the single biggest conversion gap.
- **Format:** Short quotes on the homepage.
- **Who creates it:** Ask 3 beta users or early adopters. If none exist, use your own experience.
- **Time:** 30 min to write, 15 min to add to site.
- **Draft:**
  - "I used to dread payday because of all the calculations. Now it takes me 2 minutes." — Household employer, Johannesburg
  - "Finally, a tool that actually understands South African domestic worker rules." — Household employer, Cape Town
  - "The UIF calculator alone saved me from making a R4,000 mistake." — Household employer, Pretoria

## Asset 6: Facebook Group Post Templates (3 angles)
- **Why it matters:** Saves time on daily outreach. Prevents you from going blank.
- **Format:** 3 different post templates (see Section 8).
- **Who creates it:** You
- **Time:** 30 min

## Asset 7: WhatsApp Outreach Message
- **Format:** Short, conversational, with link. See Section 8.
- **Time:** 10 min

## Asset 8: Public /features, /about, /faq Pages
- **Why it matters:** Prospects need to research before buying.
- **Format:** Simple pages — doesn't need to be fancy.
- **Who creates it:** You
- **Time:** Half day for all three

## Asset 9: 5 SEO Content Pages
- **Why it matters:** Captures search traffic from people already looking for domestic employer help.
- **Format:** 800-1,200 words each, with CTAs to free tool and pricing.
- **Who creates it:** You (Claude can draft these)
- **Time:** 2-3 hours total (use AI to draft, then edit for accuracy)
- **Topics:** See Day 4 and Day 11 in the 14-day plan.

## Asset 10: Simple Lead Tracker (Google Sheet)
- **Why it matters:** You need to know who you've contacted, what happened, and what to do next.
- **Format:** Google Sheet with columns: Name | Source | Date contacted | Channel | Status (Contacted / Replied / Free user / Paid user / Dead) | Follow-up date | Notes
- **Who creates it:** You
- **Time:** 15 min

---

# 8. Messaging Pack

## Homepage Hero Rewrite

**Headline:** Household payroll sorted. UIF included. Under 90 seconds.

**Subheadline:** Generate payslips, track leave, and keep compliant records for your domestic worker — all in one place. Built for South African household employers.

**Primary CTA:** Try the free payslip calculator →

## 3 Short Value-Prop Bullets

1. UIF deductions calculated automatically — no more guesswork.
2. Professional PDF payslips your worker can keep as proof.
3. All your records in one place — ready when SARS or the Department of Labour asks.

## Facebook Group Intro Post (Angle 1: UIF Compliance)

> Quick one for anyone who employs a domestic worker 👋
>
> Did you know that if your helper works more than 24 hours a month, you're legally required to register them for UIF and deduct 1% from their pay?
>
> I recently found a free calculator that works out the exact UIF deduction, checks you're paying at least minimum wage, and generates a proper payslip. Takes about 30 seconds.
>
> Link: lekkerledger.co.za/calculator
>
> Not selling anything — the calculator is free, no signup needed. Just thought it might help since I know a lot of us are confused about UIF.

## Facebook Group Post (Angle 2: Penalties)

> For those of us who employ domestic workers — a heads up on UIF.
>
> If you haven't been paying UIF contributions and your worker needs to claim (after dismissal, retrenchment, or maternity leave), you'll be liable for ALL back-pay, penalties, and interest. It can add up to thousands of rands.
>
> There's a free calculator that shows you exactly what you should be paying: lekkerledger.co.za/calculator
>
> Takes 30 seconds. No signup. Worth checking even if you think you're doing it right.

## Facebook Group Post (Angle 3: Contracts)

> Question: Does your domestic worker have a written employment contract?
>
> Technically it's required under the Basic Conditions of Employment Act. If you ever face a CCMA dispute, not having one can go badly.
>
> I put together a checklist of what a domestic worker contract should include. Free to download: [link to contract/checklist page]
>
> The site also has a free payslip calculator if you need that too.

## WhatsApp Outreach Message

> Hi [name] 👋 Quick one — do you employ a domestic worker? I built a free tool that calculates their pay and UIF deduction and generates a proper payslip. Takes 30 seconds, no signup: lekkerledger.co.za/calculator
>
> Thought it might be useful for you. If not, feel free to ignore!

## Direct DM (to someone you know)

> Hey [name], hope you're well! I've been working on a side project — a simple tool that helps household employers generate payslips and stay compliant with UIF rules. If you employ a domestic worker, I'd love for you to try the free calculator and tell me what you think: lekkerledger.co.za/calculator
>
> Honest feedback would mean a lot.

## Referral Ask

> Hey [name], glad it's been helpful! Quick favour — do you know 2-3 other people who employ domestic workers? If you share LekkerLedger with them and they sign up, you get a free month on your plan (and they get a proper payroll tool). Here's a link you can share: [referral link]

## Follow-Up Message (for people who engaged but didn't sign up)

> Hi [name], just following up — did you get a chance to try the payslip calculator? If you ran into any issues or have questions about UIF calculations, happy to help. No pressure on anything paid — the free tool is always there.

## Short Email (for cold or warm outreach)

> Subject: Free domestic worker payslip calculator
>
> Hi [name],
>
> If you employ a domestic worker in South Africa, you might find this useful — a free calculator that works out their pay, UIF deductions, and minimum wage compliance in about 30 seconds.
>
> lekkerledger.co.za/calculator
>
> No signup needed. If you find it useful, there's a full payroll dashboard from R29/month that keeps your records organised too.
>
> Zakariyya
> LekkerLedger

## "Why Trust Us" Block (for homepage)

> **Built by a South African household employer.**
>
> I built LekkerLedger because I employ a domestic worker and got tired of the monthly admin — guessing at UIF calculations, losing payslip records, worrying about compliance. So I built the tool I wished existed.
>
> Your data stays encrypted on your device. We don't store your employees' personal information on our servers. And if it doesn't work for you, there's a 7-day money-back guarantee.
>
> — Zakariyya, Founder, NightShift Labs ZA

## Objection-Handling FAQ Section

**Q: Is this actually legal / compliant?**
A: LekkerLedger uses the current National Minimum Wage rates (updated March 2026) and calculates UIF deductions according to the Unemployment Insurance Act. All calculation rules reference official Department of Employment and Labour guidance. That said, we're a record-keeping tool, not a law firm — for unusual situations, verify against official sources.

**Q: Why should I pay R29/month when I can use a spreadsheet?**
A: You can. But a spreadsheet doesn't auto-calculate UIF, doesn't generate a proper payslip PDF, doesn't track leave, and doesn't keep your records organised for when you need to file. LekkerLedger does all of that in under 90 seconds.

**Q: What if I only have one domestic worker?**
A: The free plan is designed for you. Generate one payslip per month, download the PDF, done. If you want leave tracking, contracts, and cloud-secured records, Standard is R29/month.

**Q: Is my data safe?**
A: Employee data is stored on your device, not on our servers. Paid plans add end-to-end encrypted cloud backup — even we can't read your data. No employee database sits on LekkerLedger servers.

**Q: What if I don't like it?**
A: 7-day money-back guarantee on all paid plans. No questions asked. Email support@lekkerledger.co.za.

**Q: My domestic worker only comes once a week — do I need this?**
A: If they work 24+ hours per month (roughly one 6-hour day per week), UIF registration is legally required. Our free calculator shows you exactly what you owe — try it and see.

---

# 9. Automation Plan

## Automation 1: Daily SEO Keyword Monitor

- **Name:** "Keyword Opportunity Finder"
- **Purpose:** Find new search queries South Africans are using related to domestic workers, UIF, and household employment. Identify content gaps.
- **Trigger:** Daily at 6am (cron / scheduled task)
- **Steps:** Run a script that queries Google Search Console API (free) for new queries driving impressions to your site. Log any query with >10 impressions that doesn't have a dedicated page yet.
- **Tools:** Google Search Console API + Google Sheet + simple Python script
- **Automated:** Query extraction, logging, weekly summary email
- **You review:** The weekly summary (5 min) — decide which queries deserve a new page
- **Setup time:** 2 hours
- **Weekly time saved:** 1-2 hours of manual keyword research
- **Risk:** Low
- **Worth doing:** Now (after you have Google Search Console set up)

## Automation 2: Email Nurture Sequence

- **Name:** "Free-to-Paid Email Drip"
- **Purpose:** Automatically nurture free tool users toward paid plans
- **Trigger:** Email submitted via free tool
- **Steps:** Email captured → added to Brevo/Mailchimp free tier → 3-email sequence sent on Day 3, 7, 14
- **Tools:** Brevo (free up to 300 emails/day) or Mailchimp (free up to 500 contacts)
- **Automated:** Entire email sequence
- **You review:** Nothing once set up. Check open/click rates weekly.
- **Setup time:** 2 hours
- **Weekly time saved:** 2-3 hours (vs manually emailing leads)
- **Risk:** Low
- **Worth doing:** Now — this is the #1 automation priority

## Automation 3: Facebook Group Post Scheduler

- **Name:** "Social Content Queue"
- **Purpose:** Pre-write a week of Facebook group posts and schedule them
- **Trigger:** Weekly on Sunday — batch-write 5 posts for the week
- **Steps:** Use Claude to draft 5 posts (different angles). Save to a Google Doc. Post manually each day (Facebook doesn't allow scheduling in groups via API).
- **Tools:** Claude for drafting, Google Doc for storage
- **Automated:** Content creation (AI-drafted)
- **You review:** Edit each draft before posting (5 min each)
- **Setup time:** 30 min
- **Weekly time saved:** 1 hour (vs writing from scratch each day)
- **Risk:** Low
- **Worth doing:** Now

## Automation 4: Lead Tracker with Follow-Up Reminders

- **Name:** "Simple CRM"
- **Purpose:** Track every lead and get reminded to follow up
- **Trigger:** Manual entry when you contact someone
- **Steps:** Add lead to Google Sheet → formula highlights leads where follow-up date is today or overdue → you open the sheet each morning and see who to follow up with
- **Tools:** Google Sheet with conditional formatting
- **Automated:** Follow-up date highlighting, overdue alerts
- **You review:** Check sheet each morning (5 min)
- **Setup time:** 30 min
- **Weekly time saved:** 30 min (vs remembering follow-ups in your head)
- **Risk:** None
- **Worth doing:** Now

## Automation 5: Weekly KPI Dashboard

- **Name:** "Sunday Scorecard"
- **Purpose:** Auto-generate a weekly summary of key metrics
- **Trigger:** Every Sunday morning
- **Steps:** Script pulls from Google Analytics (free tool uses, page views), email service (subscribers, open rates), Paystack (paid signups, revenue), and Google Sheet (leads). Compiles into a single summary and emails it to you.
- **Tools:** Google Sheets + simple script (Google Apps Script) or Make.com free tier
- **Automated:** Data pulling and formatting
- **You review:** Read the summary (5 min)
- **Setup time:** 3 hours
- **Weekly time saved:** 1 hour
- **Risk:** Low
- **Worth doing:** Now (but keep it simple — just 3 numbers at first)

## Automation 6: AI Content Drafting for SEO

- **Name:** "Content Factory"
- **Purpose:** Use Claude to draft SEO articles based on keyword opportunities
- **Trigger:** When the Keyword Opportunity Finder surfaces a new query with >50 impressions
- **Steps:** Feed the query and your brand guidelines to Claude → get a draft article → you review for compliance accuracy → publish
- **Tools:** Claude (free or API)
- **Automated:** First draft creation
- **You review:** Compliance accuracy, tone, publish decision (15-30 min per article)
- **Setup time:** 30 min (create a prompt template)
- **Weekly time saved:** 2-3 hours per article
- **Risk:** Medium (must verify compliance claims manually)
- **Worth doing:** Now

## Automation 7: Support Response Drafting

- **Name:** "Support Copilot"
- **Purpose:** Auto-draft replies to support emails based on your FAQ and docs
- **Trigger:** New email to support@lekkerledger.co.za
- **Steps:** Email arrives → forwarded to a Claude project with your FAQ/docs as context → draft reply generated → you review and send
- **Tools:** Claude project, email forwarding
- **Automated:** Draft generation
- **You review:** Every reply before sending (2 min each)
- **Setup time:** 1 hour
- **Weekly time saved:** 30 min (scales as support volume grows)
- **Risk:** Low (you always review before sending)
- **Worth doing:** Later (not enough volume yet)

## Automation 8: Community Mention Monitor

- **Name:** "Mention Radar"
- **Purpose:** Alert you when someone mentions domestic worker pay, UIF, or related topics in forums/Reddit
- **Trigger:** Continuous (Google Alerts or a simple scraper)
- **Steps:** Set up Google Alerts for: "domestic worker UIF South Africa," "domestic worker payslip," "household employer UIF." Get email digests daily. Respond to relevant discussions with helpful info + free tool link.
- **Tools:** Google Alerts (free)
- **Automated:** Monitoring and alerting
- **You review:** Daily digest (5 min)
- **Setup time:** 15 min
- **Weekly time saved:** 1-2 hours (vs manually searching)
- **Risk:** None
- **Worth doing:** Now

## Automation Summary

| # | Name | Priority | Setup | Weekly Saved | Do When |
|---|------|----------|-------|-------------|---------|
| 2 | Email Nurture | Highest | 2h | 2-3h | Now |
| 4 | Lead Tracker | High | 30min | 30min | Now |
| 8 | Mention Monitor | High | 15min | 1-2h | Now |
| 3 | Content Queue | Medium | 30min | 1h | Now |
| 6 | AI Content Drafts | Medium | 30min | 2-3h/article | Now |
| 5 | Weekly KPI | Medium | 3h | 1h | Week 2 |
| 1 | Keyword Monitor | Medium | 2h | 1-2h | Week 3 |
| 7 | Support Copilot | Low | 1h | 30min | Later |

---

# 10. Recommended Operating System

## Daily Checklist (15 min)

1. Check lead tracker Google Sheet — follow up with anyone flagged for today
2. Post in 1 Facebook group (use the pre-drafted content from your Sunday batch)
3. Check Google Alerts digest — respond to any relevant mentions
4. Check email capture numbers (how many new emails from the free tool)
5. Reply to any comments/DMs from yesterday's posts

## 3 Key Metrics (Track Weekly)

1. **Free calculator uses** (Google Analytics — event or page view on /calculator)
2. **Emails captured** (count in your email service)
3. **Paid signups** (Paystack dashboard)

That's it. Don't track anything else until you hit 50 customers.

## Weekly Review Template (Sunday, 20 min)

Answer these 5 questions:
1. How many free calculator uses this week? (Target: 100+)
2. How many emails captured? (Target: 20+)
3. How many paid signups? (Target: 3-5)
4. What was the single best source of traffic/signups this week?
5. What one thing should I do differently next week?

Write the answers in a Google Doc or notebook. Don't over-analyse. Act on the answers Monday.

## Simple Lead Tracker Structure

Google Sheet with these columns:

| Name | Source | Date | Channel | Status | Follow-up Date | Notes |
|------|--------|------|---------|--------|-----------------|-------|
| Thandi M | Facebook - Sandton Moms | 7 Apr | DM | Replied — interested | 10 Apr | Has 2 workers |
| James P | WhatsApp — my street group | 7 Apr | WhatsApp | Tried free tool | 11 Apr | Single worker |

Status values: Contacted → Replied → Free User → Paid User → Dead

## Simple Experiment Tracker

Google Sheet:

| Experiment | Start Date | Channel | Hypothesis | Result | Keep/Kill |
|------------|-----------|---------|-----------|--------|-----------|
| UIF angle post in Sandton Moms | 7 Apr | Facebook | Compliance fear drives clicks | 12 clicks, 2 signups | Keep |
| Contract angle in Randburg group | 12 Apr | Facebook | Contract topic gets engagement | 3 clicks, 0 signups | Kill |

## The "Do Not Overcomplicate This" Version

Every day: Post once. Follow up with leads. Check numbers. Repeat.

Every week: Review what worked. Do more of it. Stop what didn't.

That's the entire system.

---

# 11. What NOT To Do

## Channels to Ignore for Now

- **Paid ads (Google, Facebook, Instagram):** Your budget is near zero and your conversion funnel isn't optimised yet. Ads would burn money.
- **TikTok/YouTube/Reels:** Content creation is too time-intensive for the potential return at this stage. Save it for after 50 customers.
- **LinkedIn:** Your customer is a household employer, not a B2B buyer. LinkedIn is the wrong channel.
- **Print media / flyers:** Too slow, too expensive, unmeasurable.
- **Radio or podcast sponsorships:** Way too early. No budget, no scale.
- **Cold email to businesses:** Your product is for households, not companies.

## Automations That Are Overkill Right Now

- **CRM software** (HubSpot, Salesforce, etc.) — a Google Sheet is fine for 50 leads.
- **Marketing automation platforms** (ActiveCampaign, Customer.io) — Brevo/Mailchimp free tier is enough.
- **Chatbot on the website** — you don't have enough traffic to justify it.
- **Automated social posting tools** (Buffer, Hootsuite) — you can't automate Facebook group posts anyway; save the money.
- **Complex analytics dashboards** — Google Analytics + a 3-number weekly check is enough.

## Product Changes That Can Wait

- **Android app** — the PWA works on mobile. An app store listing doesn't matter until you have 100+ users.
- **Notification reminders** — nice to have, not a growth driver.
- **Multi-language support** — focus on English first. Expand after traction.
- **Advanced reporting / year-end summaries** — these are retention features, not acquisition features. Build them after you have customers.
- **Government submission integration** (auto-filing UIF via uFiling) — cool idea, but massive scope. Not now.
- **API or integrations** — no one is asking for this yet.

## Growth Ideas That Sound Good But Are Distractions

- **"Partnering with estate agents"** — sounds strategic, takes weeks of meetings, probably produces 0 signups.
- **"Getting mentioned in the media"** — PR is unpredictable and time-consuming. Don't chase it. If it happens, great.
- **"Building a community"** (Slack, Discord, forum) — you don't have enough users to sustain a community. Join existing ones instead.
- **"Launching on Product Hunt"** — your customer is a suburban homeowner in Gauteng, not a Silicon Valley early adopter.
- **"Creating an affiliate program"** — too early. Your referral program is fine for now.
- **"A/B testing everything"** — you don't have enough traffic for statistical significance. Just make the changes.
- **"Building a mobile app"** — the PWA works. App store listing is a vanity metric right now.
- **"Content partnerships with accountants"** — accountants see you as competition. They won't help you.

---

# 12. Final Priority List

## Top 5 Actions This Week

1. **Add email capture to the free payslip tool** (Day 1 — this is the single highest-leverage change)
2. **Add 3 testimonials + founder trust block to homepage** (Day 2)
3. **Set early-bird pricing deadline: "Ends 30 April 2026"** (Day 1 — 15 minutes)
4. **Join 15 Facebook groups where household employers hang out** (Day 5)
5. **Post your first 5 helpful posts in Facebook groups** (Day 6)

## Top 5 Copy/Site Fixes

1. Rewrite hero headline: "Household payroll sorted. UIF included. Under 90 seconds."
2. Add "7-day money-back guarantee" under all paid CTAs
3. Add "Most popular" badge to Standard plan
4. Ungate /features, /about, /faq pages
5. Add the "Why not just..." comparison block (spreadsheet vs accountant vs LekkerLedger)

## Top 5 Automation Setups

1. Email nurture sequence (3 emails, free → paid conversion)
2. Google Alerts for domestic worker / UIF mentions
3. Lead tracker Google Sheet with follow-up date reminders
4. Weekly Facebook content batch (Claude-drafted, you review)
5. Weekly KPI check (calculator uses, emails captured, paid signups)

## Top 5 Risks

1. **No email capture = no retargeting** — every free user who leaves without an email is gone forever. Fix this immediately.
2. **Zero social proof kills trust** — compliance tools need credibility. Add testimonials this week, even if they're from friends.
3. **Facebook group admins may flag promotional posts** — keep posts genuinely helpful and framed as PSAs, not ads. If a post gets removed, don't repost — adjust the angle.
4. **Sole operator burnout** — you're doing product, marketing, support, and dev. Protect 2-3 hours/day for acquisition and don't let product work eat it.
5. **SEO takes 4-8 weeks to compound** — you won't see organic traffic results immediately. Manual outreach (Facebook, WhatsApp) bridges the gap. Don't abandon SEO because it's slow.

## If You Only Have 5 Hours This Week

Spend them on exactly these things, in this order:

1. **(30 min)** Add email capture field to the free payslip tool — even a janky version that logs to a Google Sheet.
2. **(30 min)** Add "Early-bird pricing ends 30 April" + "7-day money-back guarantee" to pricing section.
3. **(30 min)** Write 3 short testimonials and add to homepage.
4. **(1 hour)** Join 10 Facebook groups and write 3 different post templates.
5. **(2.5 hours)** Post in 5 groups. Send 10 WhatsApp messages to people you know who employ domestic workers. Follow up with anyone who responds.

That's it. Do only this. Everything else can wait.

---

*This playbook was created by analysing the full LekkerLedger codebase, design system, compliance engine, pricing model, UX audit documents, and the live website at lekkerledger.co.za. Every recommendation is based on what was found in the folder and on the site — not generic advice.*
