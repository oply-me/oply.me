# OPLY.ME — COMPLETE A2Z AI TOOLS SAAS BUILD PROMPT

Build a production-ready full-stack AI SaaS platform called **Oply** at:

https://oply.me

Oply is a collection of simple, polished AI productivity tools under one account.

The core concept:

> **Oply — AI tools for getting things done.**

Users can discover individual tools, use them from a unified workspace, and purchase AI credits with a **one-time payment**.

There must be NO mandatory monthly subscription for the MVP.

Users buy credits once and use those credits across the entire Oply ecosystem.

The architecture must make it extremely easy to launch new tools every week/month.

============================================================

1. PRODUCT VISION
   ============================================================

Oply should become a large ecosystem of small, useful AI tools.

The platform should eventually contain categories such as:

AI
SEO
Marketing
Business
E-commerce
Writing
Creators
Productivity
Developer
Utilities

However, do NOT build 50 tools initially.

Launch with 10 polished tools.

The architecture must allow additional tools to be added without redesigning the entire application.

Core experience:

Visitor
→ discovers tool
→ tries tool
→ creates account
→ receives/buys credits
→ uses tools
→ saves results
→ returns to dashboard
→ discovers more tools
→ purchases additional credits

============================================================
2. INITIAL 10 TOOLS
===================

Launch Oply with exactly these 10 tools:

1. AI Writer
2. AI Rewriter
3. AI Summarizer
4. Prompt Generator
5. Prompt Optimizer
6. SEO Meta Generator
7. Schema Generator
8. Product Description Generator
9. Reply Generator
10. Blog Outline Generator

Every tool must have:

* Dedicated URL
* Dedicated SEO landing page
* Tool icon
* Tool name
* Short description
* Category
* Credit cost
* Input interface
* Output interface
* Generate action
* Copy action
* Regenerate action
* Save action
* Usage tracking
* History integration
* Related tools
* FAQ section
* SEO metadata

============================================================
3. FUTURE TOOL SYSTEM
=====================

Build the application around a reusable tool registry.

DO NOT hardcode every tool directly into the UI.

Create a central tool configuration system.

Conceptually:

tools = [
{
id: "ai-writer",
name: "AI Writer",
slug: "ai-writer",
category: "AI",
description: "...",
creditCost: 20,
inputType: "...",
enabled: true
}
]

The tool registry should control:

* Name
* Slug
* Description
* Category
* Icon
* Credit cost
* Status
* System prompt
* Input fields
* Output type
* SEO title
* SEO description
* Featured status
* Sort order

This makes adding future tools easy.

Future tools should be addable through configuration/database rather than rewriting the frontend.

============================================================
4. BRAND
========

Brand:

OPLY

Domain:

oply.me

Main tagline:

"AI tools for getting things done."

Secondary:

"Simple AI tools. One workspace."

Alternative:

"Your everyday AI toolkit."

Brand personality:

* Clean
* Smart
* Friendly
* Modern
* Premium
* Useful
* Minimal

Avoid making Oply look like a generic AI chatbot.

Oply should look like a modern productivity SaaS.

============================================================
5. DESIGN DIRECTION
===================

Create an extremely polished SaaS interface.

Visual references:

* Linear
* Notion
* Raycast
* Vercel
* Stripe
* modern AI productivity apps

Do not copy their branding or layouts.

Use the same level of simplicity and polish.

Design principles:

* Lots of whitespace
* Strong typography
* Subtle borders
* Subtle shadows
* Clean cards
* Minimal gradients
* Small radius
* Excellent alignment
* Fast animations
* Responsive layout

Support:

Light mode
Dark mode
System mode

Default should be based on system preference.

============================================================
6. COLOR SYSTEM
===============

Use a neutral interface with one Oply accent color.

Do not use rainbow gradients.

Dark mode:

Near-black background
Dark gray cards
Subtle borders
White primary text
Muted gray secondary text
Oply accent

Light mode:

White background
Light gray cards
Dark text
Muted gray secondary text
Oply accent

Create CSS variables for the entire design system.

Do not hardcode colors throughout individual components.

============================================================
7. TYPOGRAPHY
=============

Use a modern sans-serif font.

Typography should feel premium.

Hero:

Desktop:
56–72px

Mobile:
38–44px

Tool headings:
32–40px

Dashboard headings:
24–32px

Body:
15–17px

Small labels:
12–14px

Use excellent line-height and spacing.

============================================================
8. LOGO
=======

Create a minimal Oply wordmark.

Text:

OPLY

Also create an abstract/simple O icon suitable for:

* favicon
* app icon
* sidebar
* mobile navigation
* browser tab

Logo must work in both light and dark modes.

============================================================
9. PUBLIC SITE STRUCTURE
========================

Create:

/
/tools
/tools/[slug]
/categories/[category]
/pricing
/features
/about
/faq
/contact
/privacy
/terms
/refund-policy

Authenticated:

/dashboard
/dashboard/tools
/dashboard/history
/dashboard/favorites
/dashboard/projects
/dashboard/credits
/dashboard/billing
/dashboard/settings

Authentication:

/login
/signup
/forgot-password
/reset-password

Admin:

/admin
/admin/users
/admin/orders
/admin/payments
/admin/tools
/admin/usage
/admin/credits
/admin/settings

============================================================
10. HOMEPAGE
============

Create an extremely polished homepage.

NAVBAR

Left:

Oply logo

Center:

Tools
Categories
Pricing

Right:

Log in
Get Credits

Mobile:

Logo
Menu button

============================================================
11. HERO
========

Badge:

"Simple AI tools. One workspace."

Headline:

"AI tools for getting things done."

Supporting text:

"Write, rewrite, summarize, optimize and create with simple AI tools — all from one Oply account."

Primary CTA:

"Explore AI Tools"

Secondary CTA:

"Get Lifetime Access"

Below CTA:

"One-time payment • No monthly subscription"

Add a large interactive-looking AI command box:

"What do you want to do?"

Example placeholder:

"Rewrite this product description..."

Button:

"Ask Oply"

This should look like the central product feature.

============================================================
12. TOOL DISCOVERY
==================

Homepage section:

"Everything you need, in one place."

Display categories:

AI
SEO
Marketing
Business
E-commerce
Creator

For launch, only show categories that have tools.

Each category contains tool cards.

Tool card:

Icon
Tool name
Description
Credit cost
"Open Tool"

Hover:

Subtle lift
Border highlight
Arrow animation

============================================================
13. FEATURED TOOLS
==================

Show 6 featured tools.

Examples:

AI Writer
Prompt Optimizer
SEO Meta Generator
Product Description
Reply Generator
AI Summarizer

Each card should link to its dedicated tool page.

============================================================
14. HOW OPLY WORKS
==================

Three/four steps:

01
Choose a tool

02
Enter your content

03
Generate with AI

04
Copy, save or export

Make this section visually simple.

============================================================
15. CREDIT MODEL
================

Explain:

"Buy credits once. Use them across Oply."

Do NOT market unlimited AI.

Example:

"Every tool uses a small number of credits. Your balance is shared across your entire Oply account."

============================================================
16. PRICING
===========

Plans:

STARTER

$9 one-time

500 credits

PRO

$19 one-time

2,500 credits

LIFETIME

$49 one-time

10,000 credits

FOUNDER

$99 one-time

30,000 credits

Highlight Lifetime as:

"Most Popular"

Features:

✓ One-time payment
✓ No recurring subscription
✓ Use across all Oply tools
✓ Generation history
✓ Favorites
✓ Future tools
✓ Account dashboard

Do not claim unlimited usage.

============================================================
17. CRYPTO PAYMENT
==================

Build a proper payment abstraction.

The exact crypto payment provider must be configurable.

DO NOT hardcode a wallet address into the frontend.

Create:

PaymentService

with methods:

createPayment()
getPaymentStatus()
verifyWebhook()
processWebhook()

Environment variables:

CRYPTO_PAYMENT_API_KEY=
CRYPTO_PAYMENT_SECRET=
CRYPTO_PAYMENT_WEBHOOK_SECRET=

Payment flow:

User selects plan
↓
Backend validates plan
↓
Backend creates pending order
↓
Backend creates crypto checkout
↓
User pays
↓
Provider confirms payment
↓
Provider sends webhook
↓
Backend verifies webhook signature
↓
Backend checks order
↓
Backend marks payment completed
↓
Backend adds credits atomically
↓
User receives credits

NEVER add credits because the user returned to a success URL.

Credits must only be added after verified backend confirmation.

============================================================
18. PAYMENT IDEMPOTENCY
=======================

Webhook processing must be idempotent.

Store:

provider_event_id

with UNIQUE constraint.

If the same event arrives twice:

Do not add credits twice.

Order status values:

pending
processing
completed
failed
expired
refunded

============================================================
19. CRYPTO PAYMENT UI
=====================

Checkout page:

Plan selected
Amount
Credits received

Payment method:

Crypto

Show supported currencies/networks dynamically based on configured provider.

Example:

USDT
USDC
BTC

Do not promise support for a network unless the provider is configured for it.

Display:

Order ID
Payment status
Countdown if provider supports expiration

Statuses:

Waiting for payment
Payment detected
Confirming
Payment completed
Payment failed
Payment expired

============================================================
20. TOOL PAGE TEMPLATE
======================

Every tool page must use the same premium layout.

Example:

/tools/ai-writer

Top:

Breadcrumb

AI Tools → AI Writer

Title:

"AI Writer"

Description:

"Create high-quality content with AI in seconds."

Tool workspace:

LEFT:

Input fields

RIGHT:

Output

Top of workspace:

Credit cost:
20 credits

Generate button:

"Generate"

============================================================
21. AI WRITER
=============

Inputs:

Topic
Audience
Tone
Length
Instructions

Tone:

Professional
Friendly
Casual
Persuasive
Creative
Technical

Length:

Short
Medium
Long

Output:

Generated content.

Actions:

Copy
Regenerate
Shorten
Expand
Improve
Save

============================================================
22. AI REWRITER
===============

Input:

Large text area.

Options:

Natural
Professional
Simple
Concise
Persuasive
SEO-friendly

Output:

Rewritten content.

Actions:

Copy
Regenerate
Save

============================================================
23. AI SUMMARIZER
=================

Input:

Text.

Modes:

TL;DR
Bullet Points
Short Summary
Detailed Summary

Output:

Summary.

Actions:

Copy
Save
Regenerate

============================================================
24. PROMPT GENERATOR
====================

Inputs:

What do you want to accomplish?

AI platform:

ChatGPT
Claude
Gemini
General AI
Image AI
Coding AI

Style:

Professional
Creative
Technical
Detailed

Output:

Structured optimized prompt.

Include:

Role
Context
Task
Requirements
Output format
Constraints

Actions:

Copy
Save
Regenerate

============================================================
25. PROMPT OPTIMIZER
====================

User pastes an existing prompt.

Oply analyzes it.

Show:

Original Prompt

Optimized Prompt

Improvements:

Clarity
Context
Structure
Constraints
Output format

Actions:

Copy optimized prompt
Regenerate
Save

============================================================
26. SEO META GENERATOR
======================

Inputs:

Page topic
Primary keyword
Secondary keywords
Search intent
Page type

Generate:

SEO title
Meta description
Suggested slug
Open Graph title
Open Graph description

Also show character counts.

Example:

SEO Title
54 / 60 characters

Meta Description
151 / 160 characters

Actions:

Copy
Regenerate
Save

============================================================
27. SCHEMA GENERATOR
====================

Create a schema generator.

Schema types:

Article
Product
FAQ
LocalBusiness
Organization
Person
Event
SoftwareApplication
Breadcrumb
WebSite

Inputs dynamically change depending on schema type.

Output:

Formatted JSON-LD.

Actions:

Copy JSON-LD
Download
Validate structure

IMPORTANT:

Do not claim Google's rich result eligibility simply because JSON-LD was generated.

============================================================
28. PRODUCT DESCRIPTION GENERATOR
=================================

Inputs:

Product name
Product type
Features
Benefits
Target audience
Brand tone

Generate:

Short description
Long description
Bullet points
SEO title
Meta description
Product tags
CTA

Actions:

Copy
Save
Regenerate

============================================================
29. REPLY GENERATOR
===================

Inputs:

Message to reply to
Relationship/context
Tone

Tone:

Professional
Friendly
Short
Polite
Firm
Customer Support

Generate:

Suggested reply.

Optional output:

Short
Standard
Detailed

Actions:

Copy
Regenerate
Save

============================================================
30. BLOG OUTLINE GENERATOR
==========================

Inputs:

Topic
Target audience
Primary keyword
Content goal

Generate:

H1
Introduction idea
H2 sections
H3 sections
Key points
Conclusion
FAQ ideas

Actions:

Copy
Save
Regenerate

============================================================
31. ASK OPLY
============

Create a central AI assistant.

Route:

/dashboard/ask

User can simply type:

"Write a professional reply to this client."

or:

"Create SEO metadata for this product."

Oply should classify the request and either:

1. Execute the appropriate tool
   OR
2. Ask a minimal clarification question.

The UI should show:

Detected task:
Reply Generator

Estimated cost:
5 credits

[Continue]

The system must not allow users to bypass credit validation.

============================================================
32. TOOL CATEGORIES
===================

Create:

AI
SEO
Marketing
Business
E-commerce
Creator
Productivity
Developer
Utilities

Only show categories with active tools.

============================================================
33. SEARCH
==========

Create global tool search.

Search by:

Tool name
Description
Category
Keywords

Example:

User types:

"seo"

Results:

SEO Meta Generator
Schema Generator
Blog Outline Generator

Create keyboard shortcut:

Cmd/Ctrl + K

============================================================
34. DASHBOARD
=============

Route:

/dashboard

Sidebar:

Oply

Dashboard
All Tools
Projects
History
Favorites

Credits

Billing

Settings

Bottom:

Help
Theme
Profile

Main:

"Good morning, [Name]."

"What would you like to create?"

Large Ask Oply command bar.

Credit balance:

8,420 credits

Button:

Buy Credits

Then:

Popular Tools

Recently Used

Favorites

============================================================
35. DASHBOARD TOOL DISCOVERY
============================

Create:

/dashboard/tools

Show all tools.

Filters:

All
AI
SEO
Marketing
Business
E-commerce
Creator

Search.

Sort:

Popular
Newest
A-Z

============================================================
36. HISTORY
===========

Route:

/dashboard/history

Display:

Tool
Input preview
Output preview
Credits
Date
Status

Filters:

Tool
Date
Category

Actions:

Open
Copy
Delete

============================================================
37. FAVORITES
=============

Route:

/dashboard/favorites

Users can save AI generations.

Display:

Tool
Result preview
Date

Actions:

Open
Copy
Delete
Unfavorite

============================================================
38. PROJECTS
============

Create lightweight projects.

Example:

"My Website"
"My Shopify Store"
"SEO Client A"

A project can contain:

Saved generations
Favorites
Notes

Do not overcomplicate this feature.

============================================================
39. CREDITS PAGE
================

Route:

/dashboard/credits

Show:

Current balance

Credit usage this month

Recent transactions

Purchase credits

Explain:

"Credits are shared across all Oply tools."

============================================================
40. CREDIT LEDGER
=================

Create a secure ledger.

Tables:

credit_balances
credit_transactions

Transaction types:

purchase
usage
refund
bonus
admin_adjustment

Each transaction contains:

id
user_id
type
amount
balance_after
reference_id
description
created_at

Every balance modification must create a ledger transaction.

Never allow the client to directly modify balance.

============================================================
41. ATOMIC CREDIT DEDUCTION
===========================

Before AI generation:

1. Authenticate user.
2. Determine tool.
3. Load authoritative credit cost.
4. Check balance.
5. Deduct/reserve credits atomically.
6. Execute AI request.
7. Save generation.
8. If generation fails, refund credits.
9. Return result.

Prevent:

Negative balances
Double spending
Concurrent request exploits

Use PostgreSQL transaction/RPC/locking where appropriate.

============================================================
42. AI SERVICE
==============

Create a reusable server-side AI service.

Structure:

lib/ai/
client.ts
models.ts
prompts.ts
tools.ts
usage.ts
moderation.ts

Never expose AI credentials in client code.

Environment:

AI_API_KEY=

Create an abstraction that allows additional AI providers later.

Potential architecture:

AIProvider

OpenAIProvider
GeminiProvider
AnthropicProvider

Do not require all providers for MVP.

============================================================
43. AI COST TRACKING
====================

Track:

Model
Tool
Input tokens if available
Output tokens if available
Estimated cost
User
Timestamp

Store usage data for admin analytics.

Label cost:

"Estimated AI cost"

Do not claim exact accounting if the provider reports estimates.

============================================================
44. AI FAILURE REFUND
=====================

If credits are deducted and the AI provider fails:

Automatically refund the reserved credits.

Create:

usage transaction
refund transaction

The user's final balance must remain correct.

============================================================
45. AUTHENTICATION
==================

Use Supabase Auth.

Support:

Email/password
Magic link if practical

Routes:

/login
/signup
/forgot-password
/reset-password

After signup:

/dashboard

Protect all dashboard routes.

============================================================
46. USER PROFILE
================

Profile fields:

id
email
full_name
avatar_url
role
created_at
updated_at

Users can update:

Name
Avatar
Password
Theme
Preferences

Users cannot change:

Role
Credits
Payment status

============================================================
47. DATABASE
============

Use Supabase PostgreSQL.

Tables:

profiles

credit_balances

credit_transactions

tools

tool_categories

orders

payment_events

ai_generations

favorites

projects

project_items

contact_messages

ai_usage

site_settings

============================================================
48. TOOLS TABLE
===============

Fields:

id
slug
name
description
category_id
icon
credit_cost
system_prompt
input_schema
output_type
seo_title
seo_description
featured
enabled
sort_order
created_at
updated_at

This table should allow admin-controlled tool activation.

============================================================
49. TOOL CATEGORIES TABLE
=========================

Fields:

id
slug
name
description
icon
enabled
sort_order

============================================================
50. ORDERS
==========

Fields:

id
user_id
plan_id
amount
currency
credits
status
payment_provider
provider_payment_id
created_at
updated_at

Do not trust plan price or credit quantity from frontend.

Backend must load the authoritative plan configuration.

============================================================
51. PAYMENT EVENTS
==================

Fields:

id
provider_event_id UNIQUE
event_type
payload JSONB
processed
created_at

Store webhook events safely.

Do not expose sensitive payment payloads to users.

============================================================
52. AI GENERATIONS
==================

Fields:

id
user_id
tool_id
project_id
input_text
output_text
credits_used
model
status
created_at

Allow users to access only their own generations.

============================================================
53. FAVORITES
=============

Fields:

id
user_id
generation_id
created_at

Unique constraint:

user_id + generation_id

============================================================
54. PROJECTS
============

Fields:

id
user_id
name
description
created_at
updated_at

Project items:

id
project_id
generation_id
created_at

============================================================
55. ROW LEVEL SECURITY
======================

Enable RLS on all user-owned tables.

Users can only read/write their own:

Profile
Generations
Favorites
Projects
Orders
Credit transactions

Users must NEVER be able to:

Modify credit balances
Mark payments completed
Change roles
Read other users' generations
Read other users' orders
Read admin data

Admin access must be checked server-side.

============================================================
56. ADMIN DASHBOARD
===================

Route:

/admin

Only role=admin.

Dashboard cards:

Total users
New users
Total revenue
Completed orders
Credits sold
Credits consumed
AI generations
Estimated AI cost

Show:

Revenue
AI cost
Payment fees
Estimated gross margin

============================================================
57. ADMIN USERS
===============

Display:

Name
Email
Role
Credits
Joined
Status

Actions:

View
Add credits
Remove credits
Disable account

Manual credit adjustment must create:

admin_adjustment

ledger entry.

============================================================
58. ADMIN ORDERS
================

Show:

Order ID
User
Plan
Amount
Credits
Payment provider
Payment ID
Status
Date

Filters:

Completed
Pending
Failed
Refunded

============================================================
59. ADMIN TOOLS
===============

Create:

/admin/tools

Admin can:

Enable/disable tool
Change tool description
Change credit cost
Change featured status
Change sort order
Change category

Allow editing system prompts only for authorized admin users.

Changes should be logged if practical.

============================================================
60. ADDING FUTURE TOOLS
=======================

This is a major requirement.

The system should be designed so a new tool can be added through:

Admin → Tools → Add Tool

Fields:

Name
Slug
Category
Description
Icon
Credit cost
System prompt
Input fields
Output type
SEO title
SEO description
Featured
Enabled

For tools requiring custom UI, allow a component identifier.

Example:

component:

"standard-text"
"seo-generator"
"schema-generator"
"structured-output"

The system should use reusable components wherever possible.

============================================================
61. TOOL TEMPLATE SYSTEM
========================

Create reusable templates.

StandardTextTool

StructuredFormTool

SEOOutputTool

JSONOutputTool

LongFormTool

ReplyTool

PromptTool

This means future tools can reuse existing layouts.

============================================================
62. NEW TOOL LAUNCH WORKFLOW
============================

Admin should be able to:

1. Create tool
2. Choose category
3. Enter description
4. Set credit cost
5. Add prompt
6. Configure fields
7. Add SEO metadata
8. Preview
9. Enable
10. Publish

Once enabled:

Automatically appear in:

/tools
category page
search
dashboard
related tools

============================================================
63. SEO ARCHITECTURE
====================

Every tool gets its own indexable landing page.

Example:

/tools/ai-writer
/tools/prompt-optimizer
/tools/schema-generator

Each page should contain:

Title
Description
Tool interface
Benefits
How it works
Examples
FAQ
Related tools
CTA

Use server-rendered content where appropriate.

============================================================
64. TOOL SEO
============

Example:

URL:

/tools/seo-meta-generator

Title:

AI Meta Description Generator — Oply

Description:

"Generate SEO titles and meta descriptions with Oply's simple AI SEO tools."

Each tool gets unique SEO content.

Do NOT create hundreds of thin doorway pages.

Only publish useful tools with genuinely useful content.

============================================================
65. CATEGORY SEO
================

Create:

/categories/ai
/categories/seo
/categories/marketing
/categories/business
/categories/ecommerce

Each category page:

Category heading
Description
Tool cards
Related tools
FAQ
CTA

============================================================
66. STRUCTURED DATA
===================

Add appropriate JSON-LD where relevant:

Organization
WebSite
SoftwareApplication
BreadcrumbList
FAQPage where genuinely applicable

Do not create fake ratings/reviews.

============================================================
67. SITEMAP
===========

Generate dynamic sitemap.

Include:

Homepage
Pricing
Tools
Active tool pages
Active category pages
Public informational pages

Exclude:

Dashboard
Admin
Login
Account
Private pages

============================================================
68. ROBOTS
==========

Do not index:

/dashboard
/admin
/login
/signup
/account
/api

============================================================
69. CONTACT
===========

/contact

Fields:

Name
Email
Message

Save to:

contact_messages

Use configurable support email.

============================================================
70. LEGAL
=========

Create:

Privacy Policy
Terms of Service
Refund Policy

Make them editable later.

Refund policy should clearly explain digital AI credits and circumstances for refunds.

Do not make unsupported legal claims.

============================================================
71. BILLING PAGE
================

/dashboard/billing

Show:

Current plan
Credits
Orders
Payment history
Transaction IDs
Dates
Statuses

Button:

Buy Credits

============================================================
72. RESPONSIVE DESIGN
=====================

Must work perfectly on:

375px mobile
390px mobile
768px tablet
1024px laptop
1440px desktop
1920px desktop

Dashboard:

Desktop:
Sidebar

Mobile:
Drawer

Tool interface:

Desktop:
Two columns

Mobile:
One column

No horizontal overflow.

============================================================
73. ACCESSIBILITY
=================

Use:

Semantic HTML
ARIA labels
Keyboard navigation
Focus states
Accessible forms
Proper contrast
Screen reader support

All interactive elements must be keyboard accessible.

============================================================
74. LOADING UX
==============

Use skeletons where appropriate.

AI generation:

Button:

"Generating..."

Disable duplicate submission.

Output area:

Show animated loading state.

Do not freeze entire page.

============================================================
75. ERROR UX
============

Never show raw server errors.

Insufficient credits:

"Not enough credits for this tool."

CTA:

"Buy Credits"

AI failure:

"We couldn't generate your result. Your credits were not charged."

Payment pending:

"Your payment is being confirmed."

Generic:

"Something went wrong. Please try again."

============================================================
76. TOASTS
==========

Use toast notifications:

Copied
Saved
Deleted
Payment confirmed
Credits added
Generation completed
Generation failed

============================================================
77. SECURITY
============

Implement:

Authentication
Authorization
RLS
Server-side API keys
Input validation
Zod schemas
Rate limiting
Request size limits
Webhook verification
Idempotency
Atomic credit deduction
CSRF protection where applicable
Secure headers
Content security considerations

Never expose:

AI API keys
Payment secrets
Supabase service role key

============================================================
78. RATE LIMITING
=================

Protect AI endpoints.

Example:

Authenticated users:

Limited AI requests per minute.

Different limits can eventually be applied based on plan.

Use a service abstraction so Redis/Upstash can be added later.

============================================================
79. INPUT LIMITS
================

Set maximum input sizes.

For example:

Short tools:
10,000 characters

Long-form tools:
30,000 characters

Make limits configurable.

Display remaining character count.

============================================================
80. ABUSE PROTECTION
====================

Implement basic protection against:

Spam generation
Repeated requests
Concurrent generation abuse
Prompt flooding
Oversized inputs

Do not allow unauthenticated users to consume expensive AI resources.

============================================================
81. PROJECT STRUCTURE
=====================

Use a clean structure similar to:

app/
page.tsx
pricing/
tools/
categories/
dashboard/
admin/
login/
signup/
api/

components/
ui/
marketing/
tools/
dashboard/
billing/
admin/

lib/
ai/
auth/
credits/
payments/
tools/
security/
seo/

config/
site.ts
pricing.ts
tools.ts

supabase/
migrations/
seed/

============================================================
82. CONFIGURATION
=================

Create:

config/site.ts

config/pricing.ts

config/categories.ts

config/tools.ts

Centralize:

Brand name
Domain
Pricing
Credit costs
Categories
Tool settings

Do not duplicate values across components.

============================================================
83. PRICING CONFIG
==================

Plans:

starter:
price = 9
credits = 500

pro:
price = 19
credits = 2500

lifetime:
price = 49
credits = 10000

founder:
price = 99
credits = 30000

These values should be server authoritative.

============================================================
84. INITIAL CREDIT COSTS
========================

Initial values:

AI Writer:
20

AI Rewriter:
5

AI Summarizer:
10

Prompt Generator:
5

Prompt Optimizer:
10

SEO Meta Generator:
10

Schema Generator:
10

Product Description:
15

Reply Generator:
5

Blog Outline:
15

Make costs configurable.

============================================================
85. TOOL RESULT ACTIONS
=======================

Every result should have:

Copy
Save
Regenerate

Depending on tool:

Shorten
Expand
Improve
Download

Show:

"Used 10 credits"

============================================================
86. FREE DEMO
=============

Optionally allow visitors to preview selected tools.

If enabled:

Give a very small free demo.

Do not allow unlimited anonymous AI usage.

Example:

One limited demo generation per IP/session.

After demo:

"Create a free account to continue."

If this is too expensive to operate, disable anonymous AI generation entirely.

============================================================
87. ACCOUNT EXPERIENCE
======================

User menu:

Profile
Credits
Billing
History
Favorites
Settings
Log out

Show credit balance globally.

Example:

8,420 credits

Clicking it opens credits page.

============================================================
88. NOTIFICATION SYSTEM
=======================

For MVP, use in-app toasts.

Architecture should allow future:

Email notifications
Payment confirmation emails
Low credit notifications
Product announcements

============================================================
89. ANALYTICS
=============

Add privacy-conscious product analytics.

Track events such as:

tool_viewed
tool_started
generation_started
generation_completed
generation_failed
credit_purchase_started
payment_completed
tool_favorited

Do not collect unnecessary sensitive content.

============================================================
90. ADMIN ANALYTICS
===================

Dashboard charts:

Users over time
Revenue over time
AI usage over time
Most used tools
Credits consumed by tool
Estimated AI cost
Top plans

Use simple charts.

============================================================
91. PRODUCT METRICS
===================

Track:

DAU
WAU
MAU
Tool usage
Conversion rate
Purchase conversion
Credits consumed
Credits purchased
Average order value
Revenue per user

Do not present fake numbers.

============================================================
92. FEATURED TOOLS
==================

Admin can mark tools:

featured = true

Featured tools appear on homepage.

============================================================
93. NEW TOOL BADGE
==================

Allow:

new_until

When a tool is recently launched, show:

"New"

Automatically remove the badge after configured period.

============================================================
94. COMING SOON TOOLS
=====================

Create a configurable future tools system.

Example cards:

AI Alt Text
YouTube Generator
Landing Page Generator
Social Post Generator
Proposal Generator
Local SEO Generator
Ad Copy Generator
Brand Generator

Display:

"Coming Soon"

Do not make nonfunctional buttons look functional.

============================================================
95. FUTURE TOOL ROADMAP
=======================

Prepare categories for future expansion.

PHASE 2:

AI:
AI Chat
Email Writer
Document Generator

SEO:
FAQ Generator
Alt Text Generator
Internal Link Suggestions
Keyword Cluster Generator

Marketing:
Ad Copy
Social Post
Landing Page Copy

Business:
Proposal Generator
Pitch Generator
Project Brief

E-commerce:
Product SEO
Product Tags
Product Ad Copy

Creator:
YouTube Titles
YouTube Description
Video Script
Thumbnail Text

Developer:
Regex Generator
JSON Formatter
SQL Generator
README Generator

Do not implement these in the initial build unless they can be created without compromising the MVP.

============================================================
96. TOOL DISCOVERY ENGINE
=========================

Every tool page should display:

"Related tools"

Example:

AI Writer:

Related:
AI Rewriter
Blog Outline
Prompt Generator

SEO Meta:

Related:
Schema Generator
Blog Outline
Prompt Optimizer

Product Description:

Related:
SEO Meta Generator
AI Writer
Reply Generator

This creates strong internal linking.

============================================================
97. TOOL LANDING PAGE CONTENT
=============================

Every tool page should have:

Hero
Tool interface
Benefits
How it works
Example
FAQ
Related tools
Pricing CTA

Example:

"AI Rewriter"

Hero:

"Rewrite any text in seconds."

Subtext:

"Make your writing clearer, more natural or more professional with Oply."

Then the actual tool.

============================================================
98. EXAMPLE CONTENT
===================

Do not use lorem ipsum.

Use realistic examples.

AI Writer:

"Write a product launch announcement for a SaaS company."

SEO:

"AI productivity tools"

Product:

"Minimalist leather wallet"

Reply:

"Client asking whether the website will be ready Friday."

Prompt:

"Create a modern SaaS landing page."

============================================================
99. COPYWRITING
===============

Keep all copy concise.

Avoid exaggerated claims such as:

"Best AI in the world"
"100% human"
"Guaranteed rankings"
"Guaranteed sales"
"Unlimited AI"

Use honest product language.

============================================================
100. PERFORMANCE
================

Optimize:

Server rendering
Code splitting
Lazy loading
Font loading
Image optimization
API requests
Database queries

Do not load every tool component on the homepage.

============================================================
101. CACHING
============

Cache public:

Tool listings
Category listings
Pricing configuration where safe

Do not cache:

Private user data
Credit balances
Payment status
Sensitive AI results

============================================================
102. API DESIGN
===============

Create:

POST /api/ai/generate

GET /api/tools

GET /api/tools/[slug]

GET /api/credits

GET /api/history

POST /api/favorites

DELETE /api/favorites/[id]

POST /api/payments/create

GET /api/payments/[id]

POST /api/payments/webhook

Admin endpoints protected separately.

============================================================
103. AI GENERATION REQUEST
==========================

Conceptually:

POST /api/ai/generate

Body:

{
toolId,
input,
options,
projectId
}

Backend:

Validate
Authenticate
Load tool
Validate tool enabled
Load credit cost
Check credits
Reserve credits
Call AI
Store generation
Finalize transaction
Return output

Never trust:

creditCost
model
price
credits

from client.

============================================================
104. PAYMENT REQUEST
====================

Conceptually:

POST /api/payments/create

Body:

{
planId
}

Backend:

Authenticate
Validate planId
Load plan server-side
Create order
Create payment provider checkout
Return checkout URL

============================================================
105. WEBHOOK
============

POST:

/api/payments/webhook

Verify:

Signature
Event ID
Order ID
Payment status
Amount
Currency

Then:

If completed:
mark order completed
add credits
create transaction

If already completed:
do nothing

============================================================
106. ADMIN SECURITY
===================

Admin routes require:

Authenticated user
role=admin

Never rely solely on hiding admin links.

Every admin API must independently verify authorization.

============================================================
107. ENVIRONMENT VARIABLES
==========================

Create:

.env.example

Include:

NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

AI_API_KEY=

CRYPTO_PAYMENT_API_KEY=
CRYPTO_PAYMENT_SECRET=
CRYPTO_PAYMENT_WEBHOOK_SECRET=

NEXT_PUBLIC_APP_URL=https://oply.me

SUPPORT_EMAIL=

ANALYTICS_KEY=

============================================================
108. DEVELOPMENT PAYMENT MODE
=============================

Create a development-only payment simulator.

Only active when:

NODE_ENV !== production

or an explicit development flag is enabled.

Example:

DEV_PAYMENT_MODE=false

Never expose a production backdoor.

============================================================
109. TESTING
============

Create tests for:

Authentication
Credit deduction
Credit refund
Concurrent credit spending
Payment webhook
Webhook idempotency
RLS
Admin authorization
Tool configuration
AI failure handling

Critical tests:

User cannot give themselves credits.

User cannot mark order completed.

Duplicate webhook cannot give duplicate credits.

User cannot access another user's generation.

User cannot access admin API.

============================================================
110. DATABASE MIGRATIONS
========================

Provide Supabase migrations.

Do not merely describe the database.

Create actual SQL migrations.

Include:

Tables
Indexes
Constraints
RLS policies
Functions/RPCs where required

============================================================
111. SEED DATA
==============

Seed:

Categories
10 initial tools
Pricing plans if stored in DB
Site configuration

Do not seed fake users, fake revenue or fake analytics.

============================================================
112. EMPTY STATES
=================

Create polished empty states.

History:

"No generations yet."

Favorites:

"No saved results yet."

Projects:

"Create your first project."

Credits:

"You're running low on credits."

============================================================
113. 404
========

Create branded 404:

"Looks like this tool doesn't exist."

Buttons:

Explore Tools
Go Home

============================================================
114. ERROR PAGE
===============

Create branded error state:

"Something went wrong."

Button:

Try Again

============================================================
115. COOKIE/PRIVACY
===================

If analytics/cookies require consent under applicable law, create a configurable consent mechanism.

Do not collect unnecessary personal data.

============================================================
116. FOOTER
===========

Footer:

OPLY

"AI tools for getting things done."

Columns:

Tools
AI
SEO
Marketing
Business

Product
Pricing
Features
Roadmap

Company
About
Contact

Legal
Privacy
Terms
Refund Policy

Bottom:

© Oply. All rights reserved.

============================================================
117. PWA / APP-LIKE EXPERIENCE
==============================

Prepare the dashboard for future PWA support.

Use:

app icons
manifest where appropriate
mobile-friendly navigation

Do not make PWA installation mandatory.

============================================================
118. EMAIL ARCHITECTURE
=======================

Prepare an email service abstraction.

Future emails:

Welcome
Payment confirmation
Credits added
Low credits
Password reset
Product updates

Do not require email provider integration for initial MVP unless credentials are available.

============================================================
119. PRODUCT ANNOUNCEMENTS
==========================

Prepare a simple admin-controlled announcement system.

Admin can create:

Title
Message
Link
Start date
End date
Enabled

Show announcement banner on dashboard.

Useful for:

"New tool launched 🎉"

============================================================
120. ROADMAP PAGE
=================

Create:

/roadmap

Sections:

Now
Next
Later

Example:

NOW

10 AI tools
Credit system
Crypto payments
Dashboard

NEXT

AI Chat
YouTube tools
Marketing tools
E-commerce tools

LATER

API
Chrome extension
Team workspace
Automation

Do not promise exact dates.

============================================================
121. REFERRAL ARCHITECTURE
==========================

Prepare database architecture for future referrals.

Do not fully implement unless requested.

Potential:

referral_codes
referrals
referral_rewards

Future model:

Invite friend
Friend buys credits
Both receive bonus credits

============================================================
122. COUPON ARCHITECTURE
========================

Prepare for future coupons.

Fields:

code
discount_type
discount_value
max_uses
expires_at
enabled

Do not implement complex coupon UI unless needed.

============================================================
123. API ACCESS FUTURE
======================

Design the credit system so future API users can consume credits.

Future:

API keys
Usage limits
API documentation
Credit consumption

Do not expose API keys now.

============================================================
124. NO SUBSCRIPTION DEPENDENCY
===============================

The initial product must function completely without recurring subscriptions.

The core database and payment architecture should not assume subscriptions.

============================================================
125. CRYPTO-FIRST BUT PAYMENT-AGNOSTIC
======================================

Crypto is the initial payment method.

However, create:

PaymentProvider interface

so later providers can be added:

CryptoProvider
StripeProvider
RazorpayProvider
OtherProvider

Do not hardwire the entire application to one payment provider.

============================================================
126. CURRENCY
=============

Display pricing in USD by default.

Payment provider may support other settlement currencies.

Store:

amount
currency

Do not assume all crypto payments equal exactly USD value without provider confirmation.

============================================================
127. REFUNDS
============

If a payment is refunded:

Update order:

refunded

Create credit refund transaction.

If credits have already been consumed, implement a configurable refund policy rather than blindly creating unlimited negative balances.

Do not automatically promise refunds in all situations.

============================================================
128. LOW CREDIT WARNING
=======================

When balance is below configurable threshold:

Show:

"You're running low on credits."

Button:

"Buy Credits"

============================================================
129. CREDIT DISPLAY
===================

Global header:

8,420 credits

Use number formatting:

8,420

When low:

show warning state.

============================================================
130. ONBOARDING
===============

After signup:

Welcome to Oply.

Ask:

"What do you want to use Oply for?"

Options:

SEO
Writing
Business
Marketing
E-commerce
AI prompts
Just exploring

Use this to personalize tool recommendations.

Allow Skip.

============================================================
131. PERSONALIZED DASHBOARD
===========================

Based on onboarding preference:

Show recommended tools.

Example:

SEO user:

SEO Meta Generator
Schema Generator
Blog Outline

E-commerce:

Product Description
SEO Meta Generator
AI Writer

Business:

Reply Generator
AI Writer
Blog Outline

============================================================
132. TOOL FAVORITES
===================

Allow users to favorite tools themselves as well as generated results.

Example:

Tool card:

☆ Favorite

============================================================
133. RECENT TOOLS
=================

Dashboard should show:

Recently Used

Example:

AI Writer
2 hours ago

Prompt Optimizer
Yesterday

SEO Meta Generator
3 days ago

============================================================
134. TOOL USAGE
===============

Show users:

Most used tools

This week:

AI Writer
32 uses

Prompt Optimizer
17 uses

Do not expose sensitive usage information.

============================================================
135. UX DETAILS
===============

Every action should feel fast.

Use:

Optimistic UI where safe
Skeleton loading
Smooth transitions
Keyboard shortcuts
Copy feedback
Auto-focus

Keyboard:

Cmd/Ctrl + K:
Search tools

Escape:
Close modal

============================================================
136. MODALS
===========

Use modals for:

Delete confirmation
Purchase confirmation
Save to project
Keyboard shortcuts
Payment status where appropriate

Do not overuse modals.

============================================================
137. SECURITY HEADERS
=====================

Configure appropriate security headers.

Examples:

X-Content-Type-Options
Referrer-Policy
Permissions-Policy
Content-Security-Policy where compatible

Do not break legitimate AI/payment functionality.

============================================================
138. LOGGING
============

Server-side logging should record:

Request ID
User ID where appropriate
Tool
Payment ID
Errors

Do not log:

API keys
Passwords
Payment secrets
Full sensitive user content unnecessarily

============================================================
139. OBSERVABILITY
==================

Prepare for:

Error monitoring
Performance monitoring
API failures
Payment failures

Do not create fake monitoring data.

============================================================
140. PRODUCTION CHECKLIST
=========================

Before considering the app complete, verify:

AUTH
✓ Signup
✓ Login
✓ Logout
✓ Password reset
✓ Protected routes

DATABASE
✓ Migrations
✓ RLS
✓ Indexes
✓ Constraints

AI
✓ Server-side API
✓ Tool registry
✓ Credit validation
✓ Atomic deduction
✓ Refund on failure
✓ Usage tracking

PAYMENTS
✓ Order creation
✓ Crypto checkout
✓ Webhook
✓ Signature verification
✓ Idempotency
✓ Credit allocation

DASHBOARD
✓ Balance
✓ Tools
✓ History
✓ Favorites
✓ Billing
✓ Projects

ADMIN
✓ Authorization
✓ Users
✓ Orders
✓ Payments
✓ Tools
✓ Credits
✓ Analytics

SEO
✓ Metadata
✓ Sitemap
✓ Robots
✓ Canonicals
✓ JSON-LD
✓ Tool landing pages

UX
✓ Mobile
✓ Desktop
✓ Dark mode
✓ Loading states
✓ Error states
✓ Empty states
✓ Accessibility

============================================================
141. LAUNCH STRATEGY BUILT INTO PRODUCT
=======================================

The application should be designed for continuous tool launches.

Each month:

1. Add new tool configuration.
2. Create/reuse tool template.
3. Add SEO content.
4. Test.
5. Mark as featured/new.
6. Publish.
7. Show announcement.
8. Add related-tool links.
9. Track usage.
10. Keep or remove based on actual usage.

The system should make this process simple.

============================================================
142. INITIAL TOOL ROADMAP
=========================

After launch, prepare these tools in this order:

MONTH 1:

AI Email Writer
FAQ Generator
YouTube Title Generator
Social Caption Generator

MONTH 2:

Alt Text Generator
Ad Copy Generator
Landing Page Copy Generator
Proposal Generator

MONTH 3:

Product SEO Generator
Local SEO Generator
Keyword Cluster Generator
Internal Link Generator

MONTH 4:

Brand Name Generator
Pitch Generator
Project Brief Generator
Document Generator

MONTH 5:

YouTube Description Generator
Video Script Generator
AI Chat
Content Repurposer

Do not build them now unless requested.

============================================================
143. CONTENT REPURPOSER — FUTURE
================================

Prepare architecture for:

One input:

Blog/article/video transcript

Output:

LinkedIn post
Twitter/X post
Instagram caption
Facebook post
Email
Short summary

This can later become one of Oply's strongest tools.

============================================================
144. OPLY AI FUTURE
===================

The long-term centerpiece is:

"Ask Oply"

User describes the outcome.

Oply determines the best workflow.

Example:

"I have a new product and need everything for launch."

Oply:

1. Product description
2. SEO metadata
3. Social caption
4. Email
5. Ad copy

Show:

Workflow detected

Estimated credits:

65

[Run Workflow]

For MVP, keep this functionality simple.

============================================================
145. DESIGN DETAILS
===================

Cards:

16–24px padding

Borders:

subtle

Buttons:

medium height

Inputs:

comfortable 44–48px

Textareas:

minimum 160px

Tool output:

minimum 300px

Use consistent spacing.

============================================================
146. NO CLUTTER
===============

Do not place:

10 banners
10 popups
fake testimonials
fake trust logos
aggressive upsells

Oply should feel calm and premium.

============================================================
147. CONVERSION
===============

Primary conversion:

Buy credits.

Secondary:

Create account.

Use CTAs:

Explore Tools
Try Oply
Get Credits
Get Lifetime Access

Avoid:

BUY NOW!!!
LIMITED!!!
ACT NOW!!!

Unless a real promotion exists.

============================================================
148. FOOTER CTA
===============

At bottom of major public pages:

"Ready to get more done?"

"Explore Oply's AI tools."

[Explore Tools]

============================================================
149. FINAL TECH REQUIREMENT
===========================

Do NOT build a static mockup.

Build a real full-stack application.

Required:

Next.js
TypeScript
Tailwind
shadcn/ui
Supabase
Supabase Auth
PostgreSQL
RLS
Server-side AI
Secure credit ledger
Crypto payment abstraction
Webhook processing
Admin system
SEO
Responsive UI

============================================================
150. IMPLEMENTATION PRIORITY
============================

Build in these phases.

PHASE 1:
Foundation

* Next.js
* TypeScript
* Tailwind
* shadcn
* Theme
* Layout
* Navigation
* Components

PHASE 2:
Database

* Supabase
* Auth
* Tables
* RLS
* Migrations
* Seed

PHASE 3:
Public website

* Homepage
* Tools
* Categories
* Pricing
* FAQ
* Legal

PHASE 4:
Dashboard

* Dashboard
* Tools
* History
* Favorites
* Projects
* Credits
* Billing

PHASE 5:
AI

* AI service
* Tool registry
* 10 tools
* Credit system
* Usage tracking
* Refund handling

PHASE 6:
Payments

* Crypto provider abstraction
* Checkout
* Orders
* Webhook
* Verification
* Idempotency
* Credit allocation

PHASE 7:
Admin

* Users
* Orders
* Payments
* Tools
* Credits
* Analytics

PHASE 8:
SEO

* Tool pages
* Category pages
* Metadata
* Sitemap
* Robots
* Schema

PHASE 9:
Security

* Rate limits
* Input validation
* Security headers
* Authorization
* Abuse prevention

PHASE 10:
QA

Test:

Mobile
Desktop
Authentication
AI generation
Credits
Payment
Webhook
Admin
RLS
SEO
Error handling

============================================================
151. CRITICAL RULES
===================

RULE 1:

Never expose API secrets in browser code.

RULE 2:

Never trust frontend credit values.

RULE 3:

Never trust frontend payment status.

RULE 4:

Never allow users to modify their own credits.

RULE 5:

Never credit an account based only on a success URL.

RULE 6:

Verify crypto payment webhooks.

RULE 7:

Make webhook processing idempotent.

RULE 8:

Refund credits when an AI generation fails after reservation.

RULE 9:

Never create fake testimonials, reviews, revenue or user numbers.

RULE 10:

Never claim unlimited AI.

RULE 11:

Every tool must have a useful dedicated SEO page.

RULE 12:

Every new tool should be compatible with the central tool registry.

RULE 13:

Do not make future tools appear functional until implemented.

RULE 14:

Do not hardcode pricing in multiple locations.

RULE 15:

Do not hardcode credit costs in multiple locations.

RULE 16:

Use server-side authoritative configuration for pricing and credit costs.

RULE 17:

Use RLS for user-owned data.

RULE 18:

Admin authorization must be checked server-side.

RULE 19:

Do not log secrets or unnecessary sensitive content.

RULE 20:

Prioritize a polished, simple user experience over adding unnecessary features.

============================================================
152. FINAL RESULT
=================

The final application should feel like:

"One beautifully designed home for small AI tools."

A visitor should understand Oply within 5 seconds.

The homepage should communicate:

AI tools
Simple
Useful
One account
One credit balance
One-time payments

The user should be able to discover tools like:

AI Writer
Prompt Optimizer
SEO Meta Generator
Schema Generator
Product Description
Reply Generator
and more.

The system should be ready to grow from:

10 tools

to:

30 tools

to:

100+ tools

without requiring a complete architectural rewrite.

The core long-term loop is:

DISCOVER
↓
TRY
↓
SIGN UP
↓
BUY CREDITS
↓
USE TOOL
↓
SAVE RESULT
↓
DISCOVER ANOTHER TOOL
↓
RETURN
↓
BUY MORE CREDITS

Build Oply.me around this loop.

============================================================
153. DEFINITION OF DONE
=======================

Do not stop at creating the homepage.

The project is complete only when:

* The public website works.
* Authentication works.
* Supabase works.
* RLS works.
* Dashboard works.
* All 10 initial tools have working interfaces.
* AI generation architecture works.
* Credits work securely.
* Failed generations refund credits.
* Crypto payment integration architecture is implemented.
* Webhook verification exists.
* Duplicate webhooks cannot duplicate credits.
* Orders work.
* Billing works.
* History works.
* Favorites work.
* Admin works.
* Tool registry works.
* SEO pages work.
* Sitemap works.
* Mobile UI works.
* Dark/light theme works.
* Error states work.
* Loading states work.
* Empty states work.
* No fake production functionality exists.

If a third-party service requires credentials that are not available, implement the complete integration interface, configuration, server-side flow, webhook endpoint and clear setup instructions, but do not pretend the service is live.

The final product must be deployable to:

https://oply.me

and designed from day one to become a continuously expanding AI tools platform.
