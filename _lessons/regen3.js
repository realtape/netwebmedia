// Regenerates 3 broken lesson JSON files using proper JS (avoids shell quoting issues)
const fs = require('fs');
const path = require('path');
const dir = path.join(__dirname);

const courses = [
  {
    course_id: 9,
    slug: 'video-factory',
    lessons: [
      {
        title: 'The AI Video Production Pipeline',
        title_es: 'El Pipeline de Producción de Video con IA',
        description: 'Build a repeatable end-to-end system for producing professional marketing videos without a traditional production crew.',
        description_es: 'Construye un sistema repetible de extremo a extremo para producir videos de marketing profesionales sin un equipo de producción tradicional.',
        content: `<h2>From Idea to Published Video in Hours, Not Weeks</h2>
<p>Traditional video production follows a painful waterfall: script → storyboard → shoot → edit → review → publish. Each handoff adds days. AI-powered video factories compress this into a single continuous pipeline that a solo operator or small team can run repeatedly at scale.</p>
<p>The modern AI video stack has four layers working in concert. The <strong>ideation layer</strong> uses language models to generate scripted concepts from a brief — you input a topic, target audience, and desired outcome, and the model outputs multiple angle options with hooks, body points, and CTAs. The <strong>synthesis layer</strong> converts approved scripts into video using avatar-based tools (HeyGen, Synthesia) or B-roll assemblers (Pictory, InVideo AI). The <strong>enhancement layer</strong> adds captions, brand overlays, background music, and motion graphics automatically. The <strong>distribution layer</strong> packages finished assets per platform spec and schedules publishing.</p>
<h3>Setting Up Your Factory Template</h3>
<p>The most important investment is a reusable template library. A good factory template includes: opening card with brand colors and logo, avatar or presenter zone with clean background, lower-third style for key points, branded transition frames, and an end-card with CTA and contact info. Build these once in your editor of choice and save them as project templates. Every new video starts from a template, never from scratch.</p>
<p>For script-to-video workflows, structure your prompt templates to always specify: video length target (60s, 90s, 3min), tone (educational, promotional, testimonial), audience pain point to address, single call to action, and three to five key proof points. Feeding this structure consistently into your LLM produces scripts that need minimal editing before feeding to the synthesis layer.</p>
<h3>Quality Gates</h3>
<p>Automation without quality control produces garbage at scale. Build two gates into your pipeline. Gate 1 is the script review: run every script through a readability check (aim for Flesch-Kincaid grade 8-10 for business content) and a brand voice check against your style guide. Gate 2 is the render review: a 30-second spot-check of the synthesized video for lip sync quality, correct brand colors, and audio levels before scheduling.</p>
<p>With a mature template library and clear prompt standards, a well-configured factory can produce four to six finished, publish-ready videos per day with two hours of operator time. That is the economics of content at scale.</p>`,
        type: 'video',
        duration_minutes: 18,
        order_index: 1
      },
      {
        title: 'Hook Science: The First 3 Seconds',
        title_es: 'La Ciencia del Hook: Los Primeros 3 Segundos',
        description: 'Master the psychological principles that make viewers stop scrolling and watch your video through to the CTA.',
        description_es: 'Domina los principios psicológicos que hacen que los espectadores dejen de hacer scroll y vean tu video hasta el CTA.',
        content: `<h2>Why 94% of Viewers Decide in 3 Seconds</h2>
<p>Platform algorithms and human psychology share the same brutal truth: if a video does not earn attention in the first three seconds, it is invisible. The hook is not a nice-to-have — it is the entire product. A mediocre video with a great hook outperforms a great video with a mediocre hook every single time, because a mediocre video that gets watched beats a great video that gets skipped.</p>
<p>Research across short-form platforms consistently shows a three-second threshold where the majority of drop-off occurs. The viewers who make it past three seconds watch, on average, 65% of the video. The viewers who do not make it to three seconds contribute nothing — no engagement signal, no algorithm boost, no conversion.</p>
<h3>The Six Hook Archetypes</h3>
<p><strong>Pattern interrupt:</strong> Opens with something visually or tonally unexpected — a surprising statistic on screen, a loud sound, an unusual visual angle. Works because the brain is wired to notice change. Best for cold audiences who do not yet know your brand.</p>
<p><strong>Direct promise:</strong> States the outcome the viewer will get immediately. "By the end of this video you will know exactly how to..." Converts best with warm audiences who have seen you before and trust you to deliver.</p>
<p><strong>Pain agitation:</strong> Names the specific frustration the viewer is experiencing right now. "Tired of posting every day and getting zero leads?" Creates instant identification and emotional resonance.</p>
<p><strong>Curiosity gap:</strong> Opens a question it promises to close. "There is one mistake 80% of businesses make with their ads — and it is costing them thousands." Triggers the Zeigarnik effect — the brain cannot let open loops close without resolution.</p>
<p><strong>Social proof drop:</strong> Leads with a result. "This strategy added 47 leads to our pipeline last month." Anchors credibility before the viewer has a reason to doubt.</p>
<p><strong>Controversy:</strong> States a position that challenges conventional wisdom. "Cold calling is dead — here is what replaced it." Triggers engagement from both believers and skeptics.</p>
<h3>Testing and Iteration</h3>
<p>A/B test hooks systematically. Produce the same video body with three different hooks (same script from second 4 onward, different openings). Run all three for 48 hours. The winner becomes your standard opener for that topic type. Over 20 tests you will develop a clear picture of which archetypes resonate with your specific audience, which is far more valuable than any general best practice guide.</p>`,
        type: 'video',
        duration_minutes: 22,
        order_index: 2
      },
      {
        title: 'Content Repurposing: One Video, Ten Assets',
        title_es: 'Reutilización de Contenido: Un Video, Diez Activos',
        description: 'Build a systematic repurposing workflow that extracts maximum value from every piece of video content you produce.',
        description_es: 'Construye un flujo de trabajo sistemático de reutilización que extrae el máximo valor de cada pieza de contenido de video que produces.',
        content: `<h2>The Repurposing Multiplier</h2>
<p>Creating one piece of cornerstone video content and publishing it once is the most expensive and least efficient approach to content marketing. The same production effort that creates one YouTube video can — with a systematic repurposing workflow — produce ten to fifteen discrete content assets across platforms. This is how small teams compete with larger content operations on a fraction of the budget.</p>
<p>The repurposing mindset shifts the question from "what should I post today?" to "how many ways can I deploy this asset?" Every long-form video is a content mine. Your job is to extract the ore efficiently.</p>
<h3>The Core Repurposing Stack</h3>
<p>Start with a <strong>pillar video</strong> — typically eight to twenty minutes for YouTube or a recorded webinar. This is your highest-information-density asset and the source for everything else.</p>
<p>From the pillar, extract: three to five <strong>short-form clips</strong> (60-90 seconds) — the strongest moments, statistics, or demonstrations. These go to TikTok, Instagram Reels, YouTube Shorts, and LinkedIn Video. Next, pull the <strong>audio track</strong> and clean it for podcast publication or an embedded audio version on your website. Run the transcript through an AI summarizer to generate a <strong>long-form blog post</strong> (1,500-2,000 words). From the blog, extract five <strong>standalone social captions</strong> — one insight per post. Take the key framework or model from the video and turn it into an <strong>infographic</strong>. Finally, compile the most valuable insights into a <strong>newsletter issue</strong> or email sequence entry.</p>
<h3>Automation Touchpoints</h3>
<p>Several steps in this workflow can be partially automated. Transcript generation: upload finished video to Descript, Otter.ai, or use Whisper via API — transcript is ready in minutes. AI summarization: feed the transcript to Claude with a structured prompt specifying output format (blog post, bullet list, social captions). Clip identification: tools like Opus Clip or Munch use AI to scan transcripts and identify high-engagement segments automatically.</p>
<p>The human layer adds brand voice editing, selects which clips actually fit platform culture, and makes the judgment calls about what is genuinely valuable versus what is just content noise. Automate the mechanical work; preserve human judgment for the strategic choices.</p>
<h3>Publishing Calendar Integration</h3>
<p>Map your repurposed assets to a rolling 21-day publish calendar. Pillar video publishes day 1. Three short clips publish days 3, 7, and 12. Blog post publishes day 5. Newsletter feature publishes day 8. Infographic publishes day 15. Social captions drip across the remaining days. This single recording session fills three weeks of multi-platform presence.</p>`,
        type: 'lesson',
        duration_minutes: 20,
        order_index: 3
      },
      {
        title: 'Platform Distribution and Algorithm Optimization',
        title_es: 'Distribución en Plataformas y Optimización de Algoritmos',
        description: 'Learn the platform-specific specs, timing strategies, and algorithmic triggers that maximize organic reach for every video you publish.',
        description_es: 'Aprende las especificaciones específicas de cada plataforma, las estrategias de timing y los disparadores algorítmicos que maximizan el alcance orgánico de cada video que publicas.',
        content: `<h2>Platforms Are Not Interchangeable — Treat Each as Its Own Medium</h2>
<p>The fastest way to underperform across all platforms simultaneously is to post the same video natively cross-published without adaptation. Each platform has its own algorithm, its own audience behavior patterns, and its own content format expectations. Ignoring these differences means your content is technically present everywhere but performing poorly everywhere.</p>
<h3>YouTube: The Long-Game Platform</h3>
<p>YouTube rewards watch time percentage and click-through rate on thumbnails. Minimum viable optimization: custom thumbnail (high contrast, minimal text, human face when possible), title that contains primary keyword within first 40 characters, description with keyword in first two sentences, timestamps for videos over five minutes (this directly affects Chapter navigation and search visibility), and tags that are specific rather than generic.</p>
<p>The algorithm promotes videos with strong signals in the first 24 to 48 hours. This means your subscriber list, email list, and community notifications matter enormously. Seed engagement by notifying warm audiences at publish time rather than relying on cold discovery.</p>
<h3>LinkedIn: Professional Context Wins</h3>
<p>LinkedIn's algorithm strongly preferences native video (uploaded directly, not YouTube links). It also surfaces content that generates comments over content that generates likes — because comments require higher cognitive investment, LinkedIn interprets them as higher-quality engagement. Design your LinkedIn video to end with a genuine question that invites disagreement or experience-sharing, not a yes/no question.</p>
<p>Optimal LinkedIn video length is 90 seconds to three minutes for thought leadership content. Captions are non-negotiable — studies show 85% of LinkedIn video is watched without sound. Post during business hours Tuesday through Thursday for professional audiences.</p>
<h3>Instagram Reels and TikTok</h3>
<p>Both platforms use interest graphs, not social graphs, meaning your content can reach completely cold audiences if it earns engagement in the first hour. The critical metric is completion rate — percentage of viewers who watch the full video. This is why the three-second hook and a tight edit that eliminates every redundant frame are so important here.</p>
<p>Trending audio on both platforms receives an algorithmic boost — check the trending audio section and identify sounds that are relevant (not random) to your content. Relevant hashtags (three to five, not twenty) still provide modest discoverability lift on both platforms.</p>
<h3>Publishing Cadence and Consistency</h3>
<p>Consistency signals to algorithms that your account is active and delivers reliable content. A sustainable cadence beats a burst-and-rest pattern. One high-quality short-form video per weekday plus one long-form per week is a realistic target for a team with a functioning production pipeline. Track your best-performing days and times in each platform's native analytics, then concentrate your publishing in those windows.</p>`,
        type: 'lesson',
        duration_minutes: 25,
        order_index: 4
      }
    ]
  },
  {
    course_id: 16,
    slug: 'ai-sdr',
    lessons: [
      {
        title: 'The Four-Layer AI SDR Stack',
        title_es: 'El Stack de IA SDR de Cuatro Capas',
        description: 'Understand the complete architecture of a modern AI-powered sales development system and how each layer contributes to pipeline generation.',
        description_es: 'Comprende la arquitectura completa de un sistema de desarrollo de ventas moderno impulsado por IA y cómo cada capa contribuye a la generación de pipeline.',
        content: `<h2>Why Human-Only SDR Teams Have a Ceiling</h2>
<p>A skilled human SDR can research twenty to thirty prospects per day, craft personalized outreach, manage follow-up sequences, and handle responses. This ceiling exists because research, writing, and sequencing are all time-intensive manual tasks. When you scale by adding SDRs, you multiply cost linearly while capability scales at best linearly. The AI SDR model breaks this linear constraint: research, personalization, and sequencing can scale without proportional headcount growth, while humans focus exclusively on the high-value activities that require genuine emotional intelligence — conversations, objection handling, and relationship building.</p>
<p>The AI SDR stack is not a single tool. It is a four-layer architecture where each layer handles a distinct part of the pipeline generation process.</p>
<h3>Layer 1: Intelligent Prospecting</h3>
<p>AI prospecting tools (Clay, Apollo, ZoomInfo with AI enrichment, or custom scrapers) identify and qualify leads based on fit criteria before any human attention is spent. You define ideal customer profile attributes — company size, tech stack, growth signals, hiring patterns, recent funding, job title changes — and the system surfaces accounts that match. This layer produces a prioritized prospect list rather than a raw list, meaning SDR time is concentrated on the highest-probability accounts from the start.</p>
<h3>Layer 2: Deep Prospect Research</h3>
<p>Once accounts are identified, AI research tools gather context that personalizes outreach. This includes recent press releases, LinkedIn activity, job postings (which reveal strategic priorities), earnings call summaries, product reviews, and competitive displacement signals. The output is a prospect brief — two to three paragraphs of relevant context that a human can scan in thirty seconds and a language model can use to generate personalized messaging.</p>
<h3>Layer 3: Personalized Sequence Generation</h3>
<p>Language models convert prospect briefs into multi-touch outreach sequences — initial cold email, follow-up one, follow-up two, LinkedIn connection note, and optional direct mail or phone call cue. The personalization is genuine because it references real context about the prospect, not just their first name. AI-generated sequences informed by good research convert two to four times better than template blasts.</p>
<h3>Layer 4: Response Management and Routing</h3>
<p>AI monitors sequence responses and classifies them: positive interest, request to reschedule, competitor mention, objection, or unsubscribe. Positive responses trigger immediate human SDR or AE notification for same-day follow-up. Objections can be partially handled by AI-suggested reply options for the human to review and send. This layer ensures no response is missed and human attention is directed where it creates the most value.</p>`,
        type: 'lesson',
        duration_minutes: 20,
        order_index: 1
      },
      {
        title: 'Prospect Research Automation',
        title_es: 'Automatización de la Investigación de Prospectos',
        description: 'Build automated research workflows that deliver deep account intelligence to your team before the first touch.',
        description_es: 'Construye flujos de trabajo de investigación automatizados que entreguen inteligencia profunda de cuentas a tu equipo antes del primer contacto.',
        content: `<h2>Research Is the Variable That Separates Good SDRs from Great Ones</h2>
<p>Generic outreach converts at 0.5% to 1%. Highly researched, relevantly personalized outreach converts at 3% to 8%. The math is simple: research is the highest-leverage activity in the prospecting workflow. The problem is that deep research on twenty accounts per day is a full-time job that leaves no time for actual outreach. Automation solves this by handling the mechanical data gathering, leaving humans to apply judgment and voice to the insights.</p>
<h3>Signal Categories Worth Tracking</h3>
<p><strong>Hiring signals</strong> are among the strongest buying intent indicators. A company hiring its first VP of Marketing signals budget and strategic investment in growth. A company posting five sales roles simultaneously signals aggressive expansion. A company with layoffs in its engineering team may be cost-cutting and receptive to efficiency solutions. Job postings are public, machine-readable, and updated continuously — they are the most accessible high-signal data source available.</p>
<p><strong>Technology stack signals</strong> reveal what the prospect already uses and what gaps exist. Tools like BuiltWith, Clearbit, or HG Insights detect installed technologies from publicly accessible site code. If a prospect uses Salesforce but no marketing automation platform, that is a gap. If they use a competitor's product, that is a displacement opportunity.</p>
<p><strong>Funding and growth signals</strong> from Crunchbase, PitchBook, or press coverage indicate when companies have capital to deploy and strategic imperatives to grow. Companies that raised 60 to 180 days ago are actively spending; those that raised over 18 months ago may have already allocated budget.</p>
<p><strong>Content and leadership signals</strong> from LinkedIn and Twitter/X activity reveal what the decision maker is thinking about publicly. If a CMO has posted three times this month about attribution problems, and you solve attribution problems, that is a precise conversation entry point.</p>
<h3>Building Your Research Automation Stack</h3>
<p>A practical research automation setup uses Clay or a similar data enrichment platform as the central hub. Connect data sources: Apollo or ZoomInfo for contact data, LinkedIn Sales Navigator for behavioral signals, Crunchbase for funding, and a web scraper for press releases and news. Build enrichment workflows that trigger when a new account is added to a campaign — the system automatically gathers all signal categories and writes a structured brief to a designated field or document.</p>
<p>The output of good research automation is a brief a human SDR can read in under two minutes that tells them: what the company does, why they might need your solution right now, what the decision maker cares about publicly, and one or two specific conversation angles that are relevant to both.</p>`,
        type: 'lesson',
        duration_minutes: 22,
        order_index: 2
      },
      {
        title: 'Cold Email Sequence Architecture',
        title_es: 'Arquitectura de Secuencias de Email Frío',
        description: 'Design multi-touch cold email sequences that generate replies without burning your domain reputation.',
        description_es: 'Diseña secuencias de email frío de múltiples toques que generan respuestas sin quemar la reputación de tu dominio.',
        content: `<h2>Cold Email Is a Deliverability and Relevance Problem</h2>
<p>Most cold email programs fail for one of two reasons: the emails never reach the inbox (deliverability failure) or the emails reach the inbox but fail to earn a reply (relevance failure). Technical setup solves the first problem. Research-informed personalization solves the second. Both problems are solvable — most teams just have not solved them systematically.</p>
<h3>Deliverability Foundation</h3>
<p>Before sending a single cold email, verify your sending infrastructure is correctly configured. Every sending domain needs SPF, DKIM, and DMARC records correctly set and passing verification (use MXToolbox to check). Send from a subdomain (mail.yourcompany.com) rather than your root domain to protect your brand domain's reputation. Warm up new sending domains gradually — start at 20-30 emails per day, increase 20% per week over four to six weeks before reaching volume.</p>
<p>Maintain list hygiene rigorously. Use an email verification service (NeverBounce, ZeroBounce, or Kickbox) to verify addresses before sending. Remove hard bounces immediately. Keep your bounce rate below 2% and your spam complaint rate below 0.1%. These thresholds directly determine whether Gmail and Outlook route your messages to inbox or spam.</p>
<h3>The Five-Touch Sequence Structure</h3>
<p><strong>Touch 1 — The Relevant Cold Open:</strong> Short (five to seven sentences), highly specific to one piece of research, one clear question or observation, no attachments, no calendar links, no pitch. Subject line references something specific about them, not a generic benefit. Goal: earn a reply, any reply.</p>
<p><strong>Touch 2 (day 3) — The Value Add:</strong> A brief (do not call it a case study) reference to a result you achieved for a similar company, with the mechanism described in one sentence. Ask if this challenge resonates for them.</p>
<p><strong>Touch 3 (day 7) — The Different Angle:</strong> Approach from a completely different angle — a different pain point, a different business outcome, a different stakeholder who might care. This touch catches prospects who did not respond to the first angle because it did not resonate.</p>
<p><strong>Touch 4 (day 14) — The Direct Ask:</strong> Acknowledge this is your final planned follow-up. Make a direct, low-friction ask — a 15-minute call, a quick yes/no on whether this is relevant, or an intro to the right person if you have the wrong contact. Directness converts at this stage because prospects respect honesty.</p>
<p><strong>Touch 5 (day 21) — The Break-Up:</strong> Close the loop with a light, non-pushy message that says you are removing them from your sequence and wish them well. This counterintuitively generates replies from prospects who were not ready before but are now compelled to respond because they feel they owe a response or the timing has finally aligned.</p>`,
        type: 'lesson',
        duration_minutes: 25,
        order_index: 3
      },
      {
        title: 'Meeting Qualification and Handoff',
        title_es: 'Calificación de Reuniones y Transferencia',
        description: 'Build the qualification frameworks and handoff processes that ensure every booked meeting converts to a genuine pipeline opportunity.',
        description_es: 'Construye los marcos de calificación y los procesos de transferencia que garantizan que cada reunión agendada se convierta en una oportunidad genuina en el pipeline.',
        content: `<h2>Booked Meetings Are Not Pipeline — Qualified Meetings Are</h2>
<p>An SDR function that books 40 meetings per month where 10 are with the right people is more valuable than one that books 80 meetings where 5 are qualified. Show rates, pipeline conversion, and ultimately closed revenue are the true metrics of SDR performance — not activity volume or raw meeting count. This means qualification is not something that happens during the discovery call; it is something that happens before the meeting is ever confirmed.</p>
<h3>The Pre-Meeting Qualification Checklist</h3>
<p>Every meeting confirmation should include a lightweight qualification check. This is not a full discovery — it is a brief pre-screening that protects your AE's time and increases show rates by ensuring the prospect is genuinely interested and relevant. The qualification framework should verify four things:</p>
<p><strong>Authority:</strong> Is this person a decision maker or a strong influencer in the buying process? If they are an individual contributor with no budget authority, who is the decision maker and should they be included in the meeting?</p>
<p><strong>Need:</strong> Have they expressed or confirmed a pain point that your solution addresses? Do not force pain — if there is no genuine need, the meeting is a waste for both parties.</p>
<p><strong>Timeline:</strong> Are they actively evaluating solutions now, or is this exploratory for a future quarter? Both can be valuable pipeline, but they require different handling. Active evaluators need urgency; future-quarter opportunities need nurturing.</p>
<p><strong>Budget:</strong> You do not need an exact number pre-meeting, but a sense of whether budget exists and is allocated makes a significant difference in how the discovery call is structured.</p>
<h3>The Handoff Brief</h3>
<p>When a meeting is confirmed and qualified, the SDR prepares a two-page handoff brief for the AE. This document includes: company overview and why they were targeted, research insights gathered during prospecting, the conversation thread that led to the meeting (exactly what was said), the qualification signals captured, hypotheses about pain points to probe, and competitive intelligence if a competitor was mentioned. AEs who receive good briefings convert discovery calls to next steps at significantly higher rates than those going in cold.</p>
<p>Build this handoff brief as a template in your CRM so it is a structured fill-in-the-blank, not a freeform writing exercise. The structure ensures consistent quality regardless of which SDR booked the meeting.</p>`,
        type: 'lesson',
        duration_minutes: 20,
        order_index: 4
      }
    ]
  },
  {
    course_id: 22,
    slug: 'ai-copilot',
    lessons: [
      {
        title: 'Three-Layer Copilot Architecture',
        title_es: 'Arquitectura de Copiloto de Tres Capas',
        description: 'Design a personal AI copilot system that integrates with your existing tools and amplifies your capacity across every business function.',
        description_es: 'Diseña un sistema de copiloto de IA personal que se integra con tus herramientas existentes y amplifica tu capacidad en cada función de negocio.',
        content: `<h2>A Copilot Is Not a Tool — It Is a System</h2>
<p>The word "copilot" is overused to describe chatbots, autocomplete features, and simple AI assistants. A genuine business copilot is something more architecturally significant: a persistent, context-aware AI layer that sits across your workflows and augments your decision-making and execution capacity. The difference between a tool and a copilot is that a copilot knows your context, your history, and your objectives — it does not require you to re-explain yourself every session.</p>
<p>Building this kind of copilot requires intentional design across three layers: memory, context, and action.</p>
<h3>Layer 1: Memory Architecture</h3>
<p>A copilot without memory is a very expensive search engine. Memory gives your copilot continuity — the ability to reference past decisions, ongoing projects, established preferences, and accumulated knowledge without you re-entering it each session. There are three memory types to design for.</p>
<p><strong>Persistent memory</strong> is facts and preferences that do not change frequently: your company description, your target customers, your brand voice guidelines, your pricing structure, your team members and their roles. This lives in a structured document your copilot can always reference — a master context file.</p>
<p><strong>Project memory</strong> is current work-in-progress: active campaigns, open deals, pending decisions, current sprint goals. This updates weekly or monthly. Many teams maintain this as a living document in Notion or a shared doc that is always included in system prompts.</p>
<p><strong>Conversational memory</strong> is the history of interactions within a session or project thread. Some AI platforms provide this natively; for others, you maintain a running log that gets prepended to new sessions.</p>
<h3>Layer 2: Context Injection</h3>
<p>The quality of your copilot's output is directly proportional to the quality of context it has access to. Context injection means systematically providing relevant information before asking for work. A well-designed context injection protocol includes: role definition (who the copilot is acting as), audience description (who the output is for), relevant background documents, examples of desired output style, constraints and requirements, and the specific task.</p>
<p>Build context injection templates for your most common use cases — drafting proposals, analyzing data, planning campaigns, reviewing contracts — so you are not rebuilding context from scratch each time.</p>
<h3>Layer 3: Action Integration</h3>
<p>The highest-leverage copilots connect to external tools via APIs and can take actions on your behalf — drafting emails in your sent folder, creating calendar events, updating CRM records, generating reports, or triggering workflows. This layer transforms the copilot from an advisor into an operator. Start with one or two integrations where automation saves the most time, then expand systematically.</p>`,
        type: 'lesson',
        duration_minutes: 22,
        order_index: 1
      },
      {
        title: 'Daily Workflow Automation',
        title_es: 'Automatización del Flujo de Trabajo Diario',
        description: 'Map your highest-frequency daily tasks and implement AI copilot workflows that handle or accelerate each one.',
        description_es: 'Mapea tus tareas diarias de mayor frecuencia e implementa flujos de trabajo de copiloto de IA que manejen o aceleren cada una.',
        content: `<h2>Start with a Time Audit, Not a Tool Selection</h2>
<p>Most copilot implementations fail because they start with "what can AI do?" rather than "where does my time actually go?" The highest-value automation targets the tasks you perform most frequently and that benefit most from scale — not the tasks that seem most impressive to automate. A week-long time audit before building any workflow reveals where the real leverage is.</p>
<p>Common high-frequency, high-leverage targets found in business leader time audits: email drafting and triage, meeting preparation and follow-up, content creation and editing, data analysis and reporting, research and competitive intelligence, and internal communication and updates. Your specific distribution will differ, but these categories account for 40 to 60 percent of most knowledge workers' days.</p>
<h3>Email Triage and Response Workflow</h3>
<p>Email is the highest-volume daily task for most business leaders and one of the most interruptive. A copilot-assisted email workflow has three steps. First, a triage pass: the copilot categorizes incoming email into action required, FYI only, and can delegate — this takes two minutes rather than the typical 20-minute reactive inbox scan. Second, a draft pass: for every email requiring a response, the copilot drafts a reply based on your voice and context. You review, edit where needed, and send — converting a five-minute composition task into a 30-second review task. Third, a batch processing window: rather than checking email continuously, you process in two or three focused batches per day using this workflow.</p>
<h3>Meeting Preparation Automation</h3>
<p>The average professional spends 12 minutes preparing for a one-hour meeting and arrives without adequate context. A copilot preparation workflow takes that to three minutes of review time. Before any meeting with an external party, the copilot gathers: LinkedIn profile of each attendee, company news from the past 30 days, previous meeting notes and outcomes, relevant CRM history, and open action items. This is compiled into a two-page brief that you read in the three minutes before joining. The quality of your questions and insights in the meeting improves dramatically because you arrived with full context.</p>
<h3>Content and Communication Templates</h3>
<p>Identify the five to ten types of content you produce most frequently: client proposals, internal strategy memos, sales follow-up emails, social posts, weekly reports. Build a copilot prompt template for each — a structured prompt that provides the necessary context and format guidelines. When you need to produce that content type, you fill in the variables (client name, topic, key points) and the copilot produces a first draft in 30 seconds rather than a blank page that takes 20 minutes to fill. The template encodes your expertise and voice so the output requires only light editing, not substantial rewriting.</p>`,
        type: 'lesson',
        duration_minutes: 20,
        order_index: 2
      },
      {
        title: 'AI-Assisted Communication at Scale',
        title_es: 'Comunicación Asistida por IA a Escala',
        description: 'Use your AI copilot to maintain high-quality, personalized communication with clients, prospects, and partners at a volume that would be impossible manually.',
        description_es: 'Usa tu copiloto de IA para mantener comunicación de alta calidad y personalizada con clientes, prospectos y socios a un volumen que sería imposible manualmente.',
        content: `<h2>The Scale Problem in Business Relationships</h2>
<p>High-quality business relationships require consistent, relevant, personalized communication. The problem is that the number of relationships worth maintaining grows faster than the time available to maintain them. A business owner or executive trying to stay meaningfully in touch with 200 clients, 300 prospects, 50 partners, and their own team is facing a mathematically impossible task without leverage. AI-assisted communication is the leverage that makes this possible.</p>
<p>The goal is not to fake human connection with automation — it is to ensure that every genuine relationship gets the attention it deserves by removing the mechanical friction from communication. The AI handles research, drafting, and scheduling; the human handles judgment, relationship nuance, and the final send decision.</p>
<h3>Client Communication Cadence</h3>
<p>Define a communication cadence for each tier of client relationship. Strategic accounts (top 20% of revenue) might warrant weekly touchpoints; active clients bi-weekly or monthly; past clients and at-risk clients quarterly. Your copilot can manage a reminder system that surfaces when each relationship is due for contact, gathers relevant context about the client since the last interaction, and drafts a personalized touchpoint message for your review.</p>
<p>A monthly client check-in that used to require 10 minutes of research plus 15 minutes of writing per client — consuming three hours for 12 clients — becomes a 20-minute review-and-send session where the copilot has done all the drafting work. You spend the saved 2.5 hours on higher-value activities.</p>
<h3>Prospect Nurturing at Scale</h3>
<p>Most sales pipelines have 10 to 20 times more prospects in slow-burn nurture than in active evaluation. These relationships require consistent value delivery to stay warm — sharing relevant articles, commenting on their content, sending industry insights, acknowledging milestones. Manually, this is impossible at volume. With a copilot, you build nurture playbooks: trigger conditions (prospect posts on LinkedIn, company announces funding, industry report publishes) mapped to appropriate response templates. The copilot monitors triggers and queues responses for your review and approval before sending.</p>
<h3>Maintaining Voice Consistency</h3>
<p>The risk in AI-assisted communication is losing your authentic voice. The mitigation is intentional voice calibration. Spend two to three hours at the beginning of your copilot implementation writing five to ten examples of how you naturally communicate in different contexts — casual client updates, formal proposals, motivational team messages, direct sales follow-ups. These examples become your voice training set. Review copilot drafts specifically for voice accuracy, not just content accuracy, and flag deviations consistently. After 30 to 40 edited examples, the copilot develops a strong model of your specific communication style.</p>`,
        type: 'lesson',
        duration_minutes: 24,
        order_index: 3
      },
      {
        title: 'Copilot ROI Scorecard and Continuous Improvement',
        title_es: 'Scorecard de ROI del Copiloto y Mejora Continua',
        description: 'Measure the real business impact of your AI copilot implementation and build a continuous improvement process that compounds returns over time.',
        description_es: 'Mide el impacto empresarial real de tu implementación de copiloto de IA y construye un proceso de mejora continua que multiplica los retornos con el tiempo.',
        content: `<h2>If You Cannot Measure It, You Cannot Improve It</h2>
<p>AI copilot implementations that are not measured tend to drift — initial enthusiasm drives adoption, but without clear metrics, usage patterns decay and the investment underdelivers. Measuring your copilot's business impact creates accountability, surfaces what is working versus what is not, and builds the case for expanding the implementation to more use cases or team members.</p>
<h3>Time Recovery Metrics</h3>
<p>The most tangible and easily measured copilot impact is time recovery — hours saved per week per knowledge worker. Track this by comparing time spent on specific task categories before and after copilot implementation using time tracking tools or simple self-reporting. Useful benchmarks to track: time to produce a client proposal (before vs. after), time to prepare for a meeting, time to clear the email inbox, time to produce a weekly report, and time to research a new prospect account.</p>
<p>A realistic copilot implementation saves four to eight hours per week for a knowledge worker who uses it consistently. At an average loaded employee cost of $50 to $100 per hour, the ROI calculation is straightforward: eight hours saved at $75/hour average = $600 per week per user, $31,200 per year. Compare that against the cost of your AI platform subscription and implementation time.</p>
<h3>Quality Metrics</h3>
<p>Time savings alone do not capture the full picture. Track quality improvements: client satisfaction scores on communication quality, proposal win rates, email response rates from prospects, and self-assessment of output quality versus time spent. The goal is not just doing things faster — it is doing things better and faster.</p>
<h3>The Monthly Copilot Review</h3>
<p>Establish a 30-minute monthly review cadence for your copilot implementation. Review what workflows are being used, which are being skipped (and why), where output quality is high versus where it needs improvement, and what new use cases could be added. The most effective copilot implementations are not static — they are continuously refined as you develop better prompts, better context documents, better integration workflows, and a deeper understanding of where AI genuinely helps versus where it adds friction.</p>
<p>The compounding effect is significant: a copilot implementation that saves five hours per week in month one, seven hours in month three (as prompts improve), and ten hours in month six (as integrations deepen) is not a linear improvement — it is a compounding capability. Teams that invest in continuous improvement of their AI workflows consistently outperform those who deploy-and-forget, often by a factor of two to three in realized ROI within 12 months.</p>`,
        type: 'lesson',
        duration_minutes: 22,
        order_index: 4
      }
    ]
  }
];

let count = 0;
for (const course of courses) {
  const json = JSON.stringify(course, null, 2);
  const outPath = require('path').join(__dirname, course.slug + '.json');
  require('fs').writeFileSync(outPath, json, 'utf8');
  // Verify
  try {
    JSON.parse(json);
    console.log('OK:', course.slug + '.json (' + course.lessons.length + ' lessons)');
    count++;
  } catch(e) {
    console.log('ERROR:', course.slug, e.message);
  }
}
console.log('\nWrote', count, 'files successfully.');
