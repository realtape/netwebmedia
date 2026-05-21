import os, sys

# All major hand-edits from live hub pages have been backported into this generator
# as of 2026-05-06. Sections now generated from data:
#   - Niche-specific Schema.org JSON-LD in <head> (LodgingBusiness, MedicalOrganization, etc.)
#   - FAQPage JSON-LD in <head> (sourced from FAQ_DATA dict)
#   - Resources section (auto-built from BLOG_SLUG_MAP)
#   - FAQ interactive <details> section (sourced from FAQ_DATA dict)
# Re-running this script SHOULD now produce output equivalent to the live pages.
# Diff before committing regenerated pages — small whitespace/wording drift is normal.

NAV = """<nav class="navbar has-lang-bar" id="navbar">
  <div class="container">
    <div class="navbar-inner">
      <a href="https://netwebmedia.com" class="nav-logo">
        <span class="logo-wordmark"><span class="logo-net">net</span><span class="logo-web">web</span><span class="logo-media">media</span></span>
      </a>
      <div class="nav-links">
        <a href="https://netwebmedia.com/about.html" data-en="About" data-es="Nosotros">About</a>
        <div class="nav-item">
          <a href="https://netwebmedia.com/services.html" data-en="Services" data-es="Servicios">Services</a>
          <div class="nav-dropdown">
            <a href="https://netwebmedia.com/services.html#fractional-cmo">&#9733; Fractional CMO</a>
            <a href="https://netwebmedia.com/services.html#ai-automations">AI Automations</a>
            <a href="https://netwebmedia.com/services.html#ai-agents">AI Agents</a>
            <a href="https://netwebmedia.com/services.html#paid-ads">Paid Ads</a>
            <a href="https://netwebmedia.com/services.html#ai-seo">AI SEO &amp; Content</a>
            <a href="https://netwebmedia.com/services.html#social">Social Media</a>
            <a href="https://netwebmedia.com/email-marketing.html">Email Marketing</a>
          </div>
        </div>
        <div class="nav-item">
          <a href="https://netwebmedia.com/industries/" data-en="Industries" data-es="Industrias">Industries</a>
          <div class="nav-dropdown">
            <a href="https://netwebmedia.com/industries/hospitality/">&#127970; <span data-en="Tourism &amp; Hospitality" data-es="Turismo y Hospitalidad">Tourism &amp; Hospitality</span></a>
            <a href="https://netwebmedia.com/industries/restaurants/">&#127829; <span data-en="Restaurants &amp; F&amp;B" data-es="Restaurantes y F&amp;B">Restaurants &amp; F&amp;B</span></a>
            <a href="https://netwebmedia.com/industries/healthcare/">&#129657; <span data-en="Health &amp; Medical" data-es="Salud y Medicina">Health &amp; Medical</span></a>
            <a href="https://netwebmedia.com/industries/beauty/">&#10024; <span data-en="Beauty &amp; Wellness" data-es="Belleza y Bienestar">Beauty &amp; Wellness</span></a>
            <a href="https://netwebmedia.com/industries/smb/">&#128200; <span data-en="Small &amp; Medium Business" data-es="Pequeña y Mediana Empresa">Small &amp; Medium Business</span></a>
            <a href="https://netwebmedia.com/industries/legal-services/">&#9878; <span data-en="Law Firms &amp; Legal" data-es="Firmas Legales">Law Firms &amp; Legal</span></a>
            <a href="https://netwebmedia.com/industries/real-estate/">&#127968; <span data-en="Real Estate" data-es="Bienes Ra&iacute;ces">Real Estate</span></a>
            <a href="https://netwebmedia.com/industries/local-services/">&#127979; <span data-en="Local Specialist Services" data-es="Servicios Especialistas Locales">Local Specialist Services</span></a>
            <a href="https://netwebmedia.com/industries/automotive/">&#128664; <span data-en="Automotive" data-es="Automotriz">Automotive</span></a>
            <a href="https://netwebmedia.com/industries/education/">&#127979; <span data-en="Education &amp; Training" data-es="Educaci&oacute;n y Formaci&oacute;n">Education &amp; Training</span></a>
            <a href="https://netwebmedia.com/industries/events-weddings/">&#127881; <span data-en="Events &amp; Weddings" data-es="Eventos y Bodas">Events &amp; Weddings</span></a>
            <a href="https://netwebmedia.com/industries/finance/">&#128200; <span data-en="Financial Services" data-es="Servicios Financieros">Financial Services</span></a>
            <a href="https://netwebmedia.com/industries/home-services/">&#128295; <span data-en="Home Services" data-es="Servicios del Hogar">Home Services</span></a>
            <a href="https://netwebmedia.com/industries/wine-agriculture/">&#127863; <span data-en="Wine &amp; Agriculture" data-es="Vino y Agricultura">Wine &amp; Agriculture</span></a>
          </div>
        </div>
        <a href="https://netwebmedia.com/partners.html" data-en="Partners" data-es="Socios">Partners</a>
        <a href="https://netwebmedia.com/blog.html" data-en="Blog" data-es="Blog">Blog</a>
        <a href="https://netwebmedia.com/faq.html" data-en="Q&amp;A" data-es="Preguntas">Q&amp;A</a>
        <a href="https://netwebmedia.com/contact.html" data-en="Contact" data-es="Contacto">Contact</a>
      </div>
      <div class="nav-ctas">
        <a href="https://netwebmedia.com/contact.html" class="btn-nav-solid" data-en="Free 48-Hour Written Audit" data-es="Auditor&iacute;a Gratis de 48 Horas">Free 48-Hour Written Audit</a>
      </div>
      <button class="nav-hamburger" id="navHamburger" aria-label="Open menu">
        <span></span><span></span><span></span>
      </button>
    </div>
  </div>
</nav>"""

# Blog slug map: folder → pillar post slug prefix (used to auto-generate resources section)
BLOG_SLUG_MAP = {
    "hospitality":    "tourism",
    "healthcare":     "health",
    "beauty":         "beauty",
    "restaurants":    "restaurants",
    "smb":            "smb",
    "legal-services": "law-firms",
    "real-estate":    "real-estate",
    "local-services": "local-specialist",
    "automotive":     "automotive",
    "education":      "education",
    "events-weddings":"events-weddings",
    "finance":        "financial-services",
    "home-services":  "home-services",
    "wine-agriculture":"wine-agriculture",
}

# Schema.org type per folder — used in <head> JSON-LD for structured data enrichment
SCHEMA_TYPE_MAP = {
    "hospitality":    "LodgingBusiness",
    "healthcare":     "MedicalOrganization",
    "beauty":         "HealthAndBeautyBusiness",
    "restaurants":    "Restaurant",
    "smb":            "Organization",
    "legal-services": "LegalService",
    "real-estate":    "RealEstateAgent",
    "local-services": "LocalBusiness",
    "automotive":     "AutomotiveService",
    "education":      "EducationalOrganization",
    "events-weddings":"EventVenue",
    "finance":        "FinancialService",
    "home-services":  "HomeAndConstructionBusiness",
    "wine-agriculture":"Winery",
}

# FAQ data per niche — extracted from live hub pages 2026-05-06.
# Used to generate <details> accordion + FAQPage JSON-LD schema in <head>.
FAQ_DATA = {
    'hospitality': [
        ('How does AEO differ from Google Hotel search optimization?',
         "Google Hotels is a marketplace where OTAs dominate with high ad spend. AEO gets you cited directly by ChatGPT, Perplexity, and Google AI Overviews when travelers ask questions. AEO bypasses the OTA commission entirely because you're the answer, not a link they click."),
        ('What schema markup do hotels need for AEO?',
         'Start with: LodgingBusiness (on your homepage), HotelRoom (on room-type pages), FAQPage (for common guest questions), and LocalBusiness (address, phone, hours). FAQPage is the highest-ROI — it directly feeds AI training data and RAG systems.'),
        ('How long does it take to appear in ChatGPT or Perplexity answers?',
         'First citations: 60—90 days after optimizing your schema and content. Consistent visibility: 4—6 months. A real boutique hotel in Chile saw measurable citations in 41 days, but that required full implementation. The faster your setup, the faster the citations.'),
        ('Can small independent hotels compete with Marriott or Hilton in AEO?',
         "Yes — more than in traditional search. AI systems prioritize specific, differentiated properties over generic brands. A 15-room boutique in Sedona answering 'best pet-friendly luxury hotel in Sedona' with detail beats Marriott's generic response every time. This is where small properties have the advantage."),
        ("What's the ROI of AEO vs OTA commissions?",
         'OTAs charge 15—25% commission per booking. AEO costs $1,500—3,000 to set up, then $500—2,000/mo. If AEO improves direct bookings by just 10—15%, that ROI is 150—200% within 90 days, with ongoing margin improvement. For boutique hotels, AEO ROI typically outpaces paid ads and matches or beats OTA economics.'),
    ],
    'healthcare': [
        ('What schema markup does a medical practice need to appear in AI health answers?',
         'Start with: MedicalOrganization (practice address, phone, specialties), Physician (doctor names, board certifications, practice areas), MedicalSpecialty (conditions and treatments), and FAQPage (common patient questions answered by board-certified providers). FAQPage schema is highest-ROI—it creates a direct pipeline from your Q&A into AI knowledge bases. If you only implement one, start there.'),
        ('How does AEO differ from ranking on WebMD or Healthline for medical queries?',
         "WebMD and Healthline rank on Google for health keywords and get human clicks. AEO gets you cited inside AI-generated answers when patients ask ChatGPT or Claude directly. AEO is the new citation channel—your practice name appears in the AI's response as a trusted source. You're not competing for rankings; you're competing to be the authority that AI picks to answer the question."),
        ('Can a solo practitioner or small clinic compete with hospital systems in AI search?',
         "Yes. Small practices have an advantage: lower competition in specialty + geography combinations. A solo cardiologist in Denver targeting 'arrhythmia treatment Denver' is competing with fewer practices for AI citations than would compete in a major metro. AEO is fastest-growing channel for small practices because barrier to entry is low (good content + schema) and competitive intensity hasn't caught up yet."),
        ('Is there a HIPAA concern with AEO content strategy for healthcare providers?',
         "No. HIPAA protects patient records, not medical information. You can publish educational guides about conditions, treatments, and procedures without identifying anyone. Never mention specific patients, case details, or PHI (protected health information). Anonymous case studies are fine ('A 65-year-old with hypertension...'—no names, no identifiers). Your AEO content should be general medical education, which is both HIPAA-compliant and AI-preferred."),
        ('How long does healthcare AEO take to drive new patient appointments?',
         'First citations: 8-12 weeks after publishing AEO-optimized content. Measurable appointment impact: 3-6 months. Compounding visibility: 6-12+ months. Early movers have huge advantage—the longer your content has been in AI training data, the more consistent the citations. Practices that started AEO in January 2026 are already seeing 2-5 AI-driven patient inquiries per week.'),
        ('Should healthcare practices create separate AEO content for different treatments or conditions?',
         "Yes. Create treatment-specific FAQs: 'Root canal vs. extraction,' 'Preventive dental care costs,' 'Signs your pet needs urgent care.' AI assistants cite condition-specific content. A dental practice with 10 condition FAQs gets cited 5x more than a practice with generic 'dental FAQ' content."),
        ('What appointment scheduling information should healthcare practices include in AEO content?',
         "Answer common questions: 'How long does an appointment take?' 'Can I book online or do I need to call?' 'Do you take my insurance?' 'What's your cancellation policy?' AI assistants cite practices that remove friction from the booking journey. Specific answers increase conversion from AI recommendation to actual appointment."),
        ('How should healthcare practices handle insurance and payment information in AEO?',
         "List accepted insurances, explain payment plans, and mention whether you're in-network for major carriers. AI assistants cite this information when patients ask 'Which dentist takes my insurance near me?' Clear payment info reduces patient anxiety and increases appointment completion."),
        ("Can NetWebMedia's CRM automate patient appointment reminders and recalls?",
         "Yes. NetWebMedia's CRM automates appointment reminders via SMS/email, reducing no-shows by 30-50%. For AI-referred patients, the CRM ensures they get onboarded and scheduled properly. It also manages recall sequences (annual checkups, cleanings) so you never miss a revenue opportunity."),
    ],
    'beauty': [
        ('What schema markup do salons and spas need to appear in AI beauty recommendations?',
         "Salons need BeautySalon schema with services list (specific treatment names), staff bios with specializations, pricing ranges, and booking URL. Spas use SpaOrTherapy. Both need FAQPage targeting queries like 'best balayage salon near me' or 'top-rated facial spa in [city]' — these are high-intent questions AI assistants answer from schema-rich sources."),
        ('How do beauty businesses compete with Yelp and StyleSeat in AI search?',
         "Yelp and StyleSeat aggregate reviews — AI cites them for ratings. But for specific service expertise questions ('who does keratin treatments in [city]?'), local business websites with detailed FAQPage schema and staff specialization content outperform aggregators. Build content around your signature techniques, products used, and stylist certifications — that specificity wins AI citations."),
        ('Can a solo esthetician or 1-chair salon appear in AI beauty recommendations?',
         'Absolutely. Solo operators win AEO by owning a specialty niche — a solo esthetician who publishes detailed content about chemical peels, specific skin conditions, and aftercare outperforms a large spa with generic service descriptions. AI rewards depth and expertise signals. One highly specialized FAQ page about your core treatment often beats 10 generic service pages.'),
        ('How fast do beauty businesses see results from AEO optimization?',
         'Beauty businesses with strong visual content and reviews typically see AI citation improvements within 6—10 weeks. The fastest wins come from: (1) adding BeautySalon schema to GBP, (2) publishing 3—5 FAQs per signature service, (3) getting stylists to publish before/after content with technique descriptions. By month 3, most clients see 15—25% more AI-referred discovery sessions.'),
        ('Should beauty businesses focus on Instagram followers or AI search visibility?',
         'Both. Instagram builds brand loyalty and community. AI search builds qualified discovery — clients actively looking for appointments. A salon with 10K followers but low AI visibility underperforms a salon with 2K followers but top 3 AI citations in their city. The best beauty businesses run both: Instagram for engagement, AEO for intent-driven traffic.'),
        ("What's the fastest way for salons to get booked after appearing in AI search?",
         "First, make booking easy — one-click scheduling from schema markup or GBP. Second, have a live chat or SMS response system so inquiries don't wait 24 hours. Third, use a CRM to track inquiry sources. NetWebMedia's CRM captures all inbound leads, scores urgency, and sends automated follow-ups so no appointment opportunity slips away."),
        ('How should salons handle price transparency in AEO content?',
         "Publish price ranges in schema markup ('$80—$250 for color services depending on length and technique'). Avoid hardcoding exact prices — services vary. AI assistants cite price transparency as a trust signal. Salons with clear, realistic pricing see 30% more first-time bookings than those without published rates."),
        ("Can NetWebMedia's CRM help beauty businesses with client retention?",
         "Yes. The CRM automates rebooking reminders, birthday specials, and loyalty rewards. For a salon averaging 4-week cycles between appointments, automated 'your usual appointment is ready to book' messages drive 20—30% more repeat bookings. Combined with AI-referred new clients, this multiplies revenue per chair."),
    ],
    'restaurants': [
        ('What schema markup do restaurants need to appear in AI food recommendations?',
         "Restaurants need Restaurant schema with cuisine type, menu (ideally linked to a Menu schema object), price range, hours, and neighborhood. Add FAQPage targeting questions like 'best vegan restaurant in [city]' or 'which restaurant has the best pasta near downtown?' The menu schema is highest-value — AI assistants cite specific dish descriptions when recommending restaurants to diners with dietary needs."),
        ('How do independent restaurants compete with Yelp and OpenTable in AI search?',
         "Yelp and OpenTable dominate for pure discovery queries. But AI assistants cite local restaurant websites for specific questions: 'Which restaurants in [city] are good for a gluten-free birthday dinner?' AI picks the restaurant with detailed menu descriptions, dietary accommodation policies, and atmosphere descriptions — not just aggregate ratings. Your website content depth beats aggregator breadth."),
        ('Do restaurants need to optimize for voice search differently than text search for AEO?',
         "Voice queries are longer and more conversational — 'Hey Siri, what's a romantic Italian restaurant open late tonight near downtown?' vs 'Italian restaurant near me.' Your FAQ content should mirror spoken questions, not typed keywords. Include time-specific FAQs ('Are you open for lunch on Sundays?'), occasion FAQs ('Do you accommodate large groups?'), and dietary FAQs ('Do you have options for vegans?')."),
        ('How quickly can a restaurant start appearing in AI dining recommendations?',
         'Restaurants with complete GBP profiles and menu uploads see first AI citations within 3—6 weeks. The fastest path: complete your Google Business Profile with hours, menu photos, and reply to all reviews. Then publish 5 FAQs about your cuisine, dietary options, and reservation process. Most restaurant clients see measurable AI citation increases within 60 days.'),
        ("What's the best way to present dietary information for AI recommendations?",
         "Create specific FAQ pages for dietary needs: vegan, gluten-free, keto, halal, kosher. Don't just list 'we have options' — describe actual dishes by name. AI assistants cite specific menu item answers. 'We serve a gluten-free risotto with wild mushrooms' gets cited more often than 'gluten-free options available.'"),
        ('Should restaurants optimize AEO differently for delivery vs. dine-in?',
         "Yes. Create separate content: dine-in FAQs about atmosphere, chef specials, and reservation policies; delivery FAQs about packaging, timing, and delivery areas. AI assistants segment queries — 'best restaurant for a romantic dinner' vs 'best Thai delivery near me' — so content should reflect the intent."),
        ('How do seasonal menus affect AEO strategy?',
         'Update your FAQ and schema when the menu changes. Include seasonal specials and limited-time items. AI assistants track freshness — outdated menu information loses citations. Keep your GBP and website menus in sync so AI sees consistency.'),
        ('Can NetWebMedia help restaurants manage reviews and AI visibility together?',
         "Yes. NetWebMedia's CRM captures diner email addresses and enrolls them in post-visit review requests. Higher review velocity improves your Google rating, which AI assistants cite. The CRM also tracks sentiment and helps you respond to feedback—public responses to negative reviews boost AEO rankings."),
    ],
    'smb': [
        ("What's the minimum AEO investment for a small business with a tight budget?",
         "The AEO minimum viable investment is $0 to start and $200-$500/month to scale. Free foundation: Complete your Google Business Profile (every field), add 5 FAQs to your website using free LocalBusiness schema (Google's Structured Data Markup Helper is free), and respond to all reviews. Once that's done and driving results, invest $200-$300/month in monthly FAQ content to expand your citation coverage. Most SMBs see positive ROI on this minimum investment within 60 days."),
        ('Which AI assistants should small businesses focus on for citation optimization?',
         "Focus on Google AI Overviews first — it drives the most traffic for local business queries and pulls from Google Search + GBP data you already control. Then ChatGPT (optimize your website content for factual, FAQ-style answers — ChatGPT cites well-structured HTML content). Perplexity AI is a growing source — it cites website content that directly answers questions. Don't try to optimize for all platforms simultaneously; master Google AI first, then expand."),
        ('How do small businesses measure AEO performance?',
         "Track these metrics: (1) Google Search Console — look for increases in featured snippet appearances and People Also Ask appearances; (2) 'How did you find us?' survey at point of contact — AI assistants will start appearing as a source; (3) Direct website traffic from non-search-engine referrers (AI assistants appear as direct traffic); (4) Branded search volume growth in GSC — AI citations increase brand awareness, which drives more direct brand searches. Month-over-month improvement in these 4 metrics indicates AEO traction."),
        ('Can a small business compete with large national brands in AI recommendations?',
         "Yes — and small businesses often win. AI assistants prioritize local relevance and specificity over brand recognition for local queries. A local hardware store that publishes detailed FAQs about specific home repair projects ('How do I fix a leaking faucet with a Moen faucet?') gets cited alongside or above Home Depot for that specific query. The key: go deeper on specific topics than the national brand can profitably go. Your niche expertise beats their scale for specialized local queries."),
        ("What's the AEO strategy for small businesses that lack deep financial resources?",
         "Start free, then layer strategically. Free foundation: claim and optimize your Google Business Profile, add 5 FAQs using Schema Markup Generator, and respond to all reviews. At $200—300/mo add monthly niche-specific FAQ content. This low-cost sequence works for SMBs because AI assistants reward specificity over spend. NetWebMedia's AEO Starter plan automates this foundation for businesses that want hands-off execution."),
        ('How often should small businesses update their AEO content to stay competitive?',
         "Monthly FAQ additions create consistent citation momentum. One new FAQ per week (4/month) signals to AI crawlers that your business is actively answering customer questions. Quarterly deep-dives into underperforming categories ensure you're tracking what prospects actually ask about. Most SMBs see measurable ranking improvements within 6 weeks of starting a monthly content cadence."),
        ("What's the long-term ROI window for small business AEO investment?",
         'Early SMBs that invest from month 1 see 15—25% revenue lift by month 6, compounding to 40—60% by year 2. The break-even point is typically month 2—3 when AI-referred inquiries start converting into customers. One high-value customer acquisition covers 6—12 months of AEO expense, making AEO one of the fastest-paying marketing channels for SMBs under budget constraints.'),
        ('Should small businesses hire an agency or build AEO in-house?',
         "Both can work. In-house AEO (hiring one marketing person) costs $40K—$70K/year + tools but gives you direct control. Fractional CMO services ($249—$999/mo) offer expertise without full-time overhead. Most SMBs under $5M revenue choose fractional services initially because one AEO hire can't deliver the strategic breadth (schema optimization, content, paid ads, CRM). Revisit in-house hires once AEO proves ROI and you're ready to scale."),
    ],
    'legal-services': [
        ('What schema markup does a law firm need to appear in AI legal recommendations?',
         "Law firms need LegalService schema (a subtype of LocalBusiness) with: practice areas (as specific as possible — 'workers' compensation' not just 'personal injury'), attorney bar numbers and state admissions, case types handled, contingency vs. hourly fee structure, and geographic coverage. Attorney bio pages need Person + LegalService schema. FAQPage targeting the questions clients ask before hiring ('Do I need a lawyer for my car accident?', 'What does a personal injury attorney cost?') creates direct AI citation pipelines."),
        ('How do small law firms compete with large firms and legal directories in AI search?',
         "Small firms win on practice area depth and geographic specificity. Avvo and FindLaw rank for general 'find a lawyer' queries. A solo personal injury attorney in Phoenix publishes 15 FAQ pages about Arizona-specific personal injury law — AI assistants cite this depth for 'Arizona personal injury attorney' queries. Large firms can't match the specificity of a true specialist. Own your practice area + jurisdiction combination and publish the deepest content available."),
        ('Are there ethics rules that restrict AEO content for attorneys?',
         "Yes — bar association advertising rules apply. In most states: you cannot guarantee outcomes, claim 'specialist' status without certification, make comparative claims without substantiation, or use testimonials that imply likely results. Compliant AEO content: educational explanations of legal processes, general information about case types, attorney credentials and experience, and FAQ-style answers about legal procedures (not outcomes). This educational approach is both ethics-compliant and AI-preferred — AI assistants cite educational legal content at 4x the rate of promotional content."),
        ('How fast do law firms see results from AEO investment?',
         'Law firms with complete GBP profiles see first AI citation improvements within 6—10 weeks. The intake inquiry cycle varies by practice area: personal injury and criminal defense clients decide within days; estate planning and business law clients research for weeks to months. Most law firm clients see 20—30% more AI-referred consultation requests by month 3 in high-urgency practice areas (PI, criminal, family law) and month 5—6 for planning practices (estate, business).'),
        ("What's the difference between AEO and Google local pack ranking for law firms?",
         "Google Local Pack appears for 'personal injury lawyer near me' — AEO appears when someone asks ChatGPT 'best PI attorney for my case type.' Local Pack drives foot traffic and calls in the next hour. AEO drives qualified consultations from people already in research mode. Smart firms own both: GBP for immediate traffic, AEO content for trust-building in the consideration phase."),
        ('How should law firms handle confidentiality in AEO case study content?',
         "Never name clients or disclose case details. Instead: 'We recovered $X for a client injured in a [vehicle type] collision' or 'Successfully defended a C-suite executive in an employment dispute.' De-identified case studies with outcomes are AI-preferred because they demonstrate expertise without breaching confidentiality or bar ethics rules."),
        ('Which practice areas see the fastest AEO ROI?',
         'High-urgency areas: personal injury, criminal defense, family law. These clients need help now and turn to AI for trusted referrals. Clients researching for weeks (estate planning, corporate law) convert more slowly but with higher lifetime value. Personal injury firms typically see measurable AI-driven leads within 6 weeks; business law firms in 3—4 months.'),
        ("Should law firms use NetWebMedia's CRM for client intake?",
         "NetWebMedia's CRM captures incoming inquiries, scores them by urgency, and routes them to the right attorney. It integrates with email, SMS, and intake forms so no leads fall through the cracks. For firms running AEO, the CRM ensures every AI-referred prospect gets qualified and followed up — multiplying your AEO ROI."),
    ],
    'real-estate': [
        ('What schema markup do real estate agents need to appear in AI buyer and seller recommendations?',
         "Real estate agents need RealEstateAgent schema with: state license number, specializations (buyer's agent, seller's agent, luxury, investment, first-time buyers), service area (specific neighborhoods and ZIP codes), years of experience, and certifications (ABR, CRS, SRES). FAQPage targeting buyer questions ('What's the average home price in [neighborhood]?', 'How do I find the right real estate agent?') and seller questions ('When is the best time to sell a home in [city]?') creates direct AI citation pipelines during the research phase."),
        ('How do independent real estate agents compete with Zillow and Realtor.com in AI search?',
         "Zillow and Realtor.com own listing aggregation queries. Independent agents win on agent-selection and neighborhood expertise queries: 'Which real estate agent specializes in first-time buyers in [city]?' or 'Best agent for selling a historic home in [neighborhood]?' Build 10 hyperlocal neighborhood guides with real market data (average price per sqft, school ratings, walkability scores, recent notable sales). This content depth creates AI citations that aggregators can never replicate because it requires local expertise."),
        ('Should real estate agents create content for buyers or sellers to maximize AEO?',
         "Create both — but start with buyer content. Buyers ask more AI questions during their longer research phase (6-18 months). Seller content is highest-value at decision points: 'Should I sell now or wait?', 'How do I choose the right listing agent?' Publish 70% buyer content (neighborhood guides, market data, process education) and 30% seller content (pricing strategy, staging guides, agent selection criteria). By month 6, both sides create a full-funnel AI citation presence that compounds into referrals."),
        ('How quickly do real estate agents see ROI from AEO content investment?',
         'Real estate AEO has a longer conversion cycle than other local businesses. AI citations appear within 6—10 weeks. First AI-referred leads typically appear within 3-4 months. Full ROI realization takes 9—12 months because the buyer/seller decision cycle is long. However, the lifetime value is significant: one buyer or seller transaction covers 12—24 months of AEO investment. Agents who start AEO in Q1 consistently report their strongest AI-referred pipelines in Q4 of the same year.'),
        ("What's the minimum AEO investment for an independent real estate agent?",
         'Independent agents can start AEO with $0—$300/month. Free: optimize your GBP with hyperlocal neighborhood tags, add 8—10 FAQs about buyer/seller questions, and request reviews from past clients. At $200—300/mo, add monthly content targeting agent-selection queries. This lean approach works for agents because locality matters more than brand in AI recommendations. One referred transaction pays back 12+ months of AEO investment.'),
        ('How should real estate agents structure AEO content for different buyer journey stages?',
         "Map content to the 6—18 month buyer journey: Awareness (months 1—3: neighborhood market data, price trends), Consideration (months 4—12: home buying guides, agent comparison content), Decision (months 12—18: moving guides, closing FAQs). This staged approach ensures you're cited at every research stage. Agents who layer content across all three stages see 2—3x more AI-referred inquiries than those who focus only on decision-stage content."),
        ('Can teams of agents share one AEO strategy or does each agent need independent content?',
         "Brokerages benefit from team AEO (shared market data, office content) while individual agents win with personal specialization content. A brokerage publishes city-level market data; Agent A publishes 15 FAQs about 'luxury homes in [neighborhood]', Agent B publishes 15 about 'first-time buyers in [different neighborhood].' This hybrid approach amplifies the team's citation coverage across all buyer types without duplicating effort."),
        ("What's the difference between AEO and SEO for real estate agents?",
         "SEO (Google ranking) gets agents found when someone actively searches 'homes for sale in [neighborhood].' AEO gets agents recommended when someone asks Claude 'best agent for buying a home in [city]' — the research phase, not the action phase. Both matter, but AEO reaches prospects 6—18 months earlier in the buyer journey. Agents who own both channels capture demand at every research stage."),
    ],
    'local-services': [
        ('What schema markup do local specialist businesses need to appear in AI recommendations?',
         "Local specialists use LocalBusiness with specialty-specific subtypes: Florist, PetStore, Locksmith, TutoringService, Notary. Critical schema fields: specialty description (your differentiator), service area by neighborhood, emergency availability (if applicable), and certification/license information. FAQPage schema targeting hyperlocal queries — 'emergency locksmith in [neighborhood]?', 'certified dog groomer near [zip code]?' — creates the highest AI citation density because these are exact questions AI assistants answer for emergency and comparison decisions."),
        ('How do local specialists win against national chains in AI search?',
         "Specialists win on specificity and local expertise. A national chain publishes generic service descriptions. A local specialist publishes: specific neighborhoods served (named blocks and intersections), equipment brands used, certification bodies, response time guarantees, and 5-star reviews from recognized community members. AI assistants favor this specificity when answering 'which [specialist] in [neighborhood] is trusted?' The more granular your content, the higher your AI citation rate."),
        ('Should local specialists focus on emergency queries or planned-purchase queries for AEO?',
         "Focus on emergency queries first — they have the highest AI citation potential because customers make fast decisions based on AI recommendations. 'Emergency [service] open now near me' queries convert at 60-80% — the customer needs help immediately and takes the first AI-recommended option. Once emergency query coverage is complete, layer in planned-purchase content: 'best [specialist] for [specific occasion/need]' targets customers earlier in the decision journey with higher long-term LTV."),
        ('How fast do local specialists see ROI from AEO investment?',
         "Local specialists see faster AEO ROI than most business types because emergency-query citations convert immediately. A locksmith cited by AI for 'emergency locksmith open now' gets a call within minutes of the citation. Most specialists see 10—20% more AI-referred contacts within 60 days. Emergency-service specialists (locksmiths, tow trucks, after-hours plumbers) often see results within the first week of GBP optimization + FAQPage schema implementation."),
        ("What's the most cost-effective way to start AEO for a local specialist on a tight budget?",
         "Start at $0 with: GBP optimization, 5 FAQs answering your most-asked questions, and requesting reviews from every completed job. At $150—200/mo, add monthly emergency-query content ('emergency [service] near me', '[service] same-day availability'). This minimal investment works because specialists answer high-intent questions. One emergency-query conversion pays back months of AEO investment immediately."),
        ('How do local specialists measure AEO success beyond just inquiry volume?',
         "Track: (1) call-to-conversion rate from 'emergency' vs. planned queries (emergency should convert 60—80%), (2) average job value from AI-referred vs. referral customers, (3) repeat/referral rate from AI-sourced customers. Emergency specialists often see higher lifetime value from AI customers because they're already committed to solving a problem. Most specialists report 35—50% higher job values from AI-referred customers vs. cold walk-ins."),
        ('Can local specialists use AEO to expand their service area without hiring more staff?',
         "Yes, through smart geographic targeting. Publish content for adjacent neighborhoods and ZIP codes you can serve within your response-time SLA. AI cites local specialists based on 'emergency [service] in [neighborhood]' queries; you control the geographic footprint via your FAQ content. Many specialists use this to expand 20—30% geographically without adding headcount, by improving utilization of existing capacity and managing demand via price-per-area tiers."),
        ('Should local specialists hire a fractional CMO or build AEO in-house?',
         "Most specialists lack marketing expertise — your edge is your craft, not marketing strategy. Fractional CMO services ($249—$999/mo) handle schema markup, FAQ research, competitor tracking, and ROI measurement while you focus on delivery. In-house works only if you can dedicate 10—12 hours/week to marketing. For specialists with 1-3 staff, fractional ownership costs less than hiring and gets expert-level results faster. NetWebMedia's AEO Starter covers AEO + SEO + content strategy at $249/mo — designed for local specialists who can't justify full-time marketing hires."),
    ],
    'automotive': [
        ('What schema markup does an auto business need to appear in AI assistant recommendations?',
         'Dealerships need AutoDealer schema with inventory count, brands carried, financing options, and service center hours. Repair shops need AutoRepair with certified technicians, makes serviced, and warranty info. Detail shops use LocalBusiness with specialties. All three need FAQPage schema targeting how customers phrase questions to voice and AI assistants.'),
        ('How long does it take for an auto business to start appearing in AI search results?',
         'Schema markup and FAQ content typically starts influencing AI citations within 4—8 weeks. Google Business Profile updates are picked up faster — sometimes within days. The full AEO flywheel (schema + content + reviews + citations) builds momentum over 90 days.'),
        ('Can a single-location auto shop compete with dealership chains in AI search?',
         'Yes — and independent shops often win AEO faster than chains. AI assistants favor specificity and depth over brand recognition. A local shop with detailed content about the specific makes they service beats a chain that publishes generic content at scale.'),
        ('Should auto businesses focus on Google Maps or AI assistants for local discovery?',
         'Both — but in sequence. Google Maps (local SEO) still drives the majority of walk-in and service calls and should be your foundation. Once your GBP is optimized and you have 50+ reviews, layer in AEO content. The two compound: AI assistants pull from GBP signals, so strong local SEO accelerates your AEO results. Start with Maps, then add AI content layer within 60 days.'),
        ("What's the minimum AEO investment for an independent auto shop?",
         "Independent shops can start at $0—$250/month. Free: claim GBP, add 8 FAQs about common repairs for the makes you service, and request reviews. At $150—250/mo, add monthly content targeting 'best [make] mechanic in [city]' and service-specific queries. Independent shops win in AEO because AI rewards specificity — a shop with detailed Honda-specific content beats a franchise with generic 'auto repair' content."),
        ('How should dealerships structure AEO content differently from repair shops?',
         'Dealerships target buyer research (model comparisons, financing, test drive scheduling). Repair shops target maintenance queries (diagnostics, common failures, cost estimates). Dealerships publish 60% buyer-education, 30% inventory-specific, 10% service-continuity content. Repair shops reverse: 60% service how-to, 30% maintenance schedule, 10% parts education. Both win by matching content to the actual questions AI assistants receive in each category.'),
        ('Can service departments at dealerships compete with independent repair shops in AEO?',
         "Yes, but they must hyperspecialize. Dealership service wins on OEM warranty content, recall information, and multi-brand experience. Independent shops win on cost transparency and specific-model depth. Dealerships should publish FAQs about 'warranty coverage for [model]' and 'why [model] needs [service] at [mileage]'. This specificity beats generic 'dealership service' positioning in AI citations."),
        ('Should auto businesses hire a fractional CMO or manage AEO and marketing in-house?',
         "Auto businesses split between sales (inventory, test drives, financing) and service (repairs, maintenance, upsells). In-house marketing works only if you can dedicate 15—20 hours/week to content, schema, reviews, and ad optimization across both channels. Most independent shops lack this bandwidth. Fractional CMO services ($249—$999/mo) handle schema setup, FAQ research, local SEO, and AEO strategy while your team focuses on customer delivery. NetWebMedia's AEO Starter covers AEO + SEO + monthly content at $249/mo for shops, with CMO Growth adding Google + Meta campaigns for dealers. For single-location shops, fractional beats hiring because costs are lower and expertise is higher."),
    ],
    'education': [
        ('What schema markup does a school or training center need to appear in AI education recommendations?',
         "Schools need EducationalOrganization schema with accreditation body, grade levels or age ranges, curriculum type (IB, Montessori, etc.), and geographic area served. Training centers and bootcamps use Course schema with job placement rates, average salary outcomes, and prerequisites. FAQPage schema targeting admission questions ('What's the acceptance rate?', 'Do you offer financial aid?') creates the highest-value AI citations."),
        ('How do small private schools compete with large universities in AI search?',
         "Small schools win by owning niche + geography combinations. A Montessori school in Austin targeting 'Montessori K-8 Austin Texas' competes with far fewer institutions than 'private school Austin.' AI assistants favor specificity — schools with detailed content about their methodology, class sizes, teacher credentials, and outcomes outperform larger institutions with generic marketing copy."),
        ('Can online courses and bootcamps appear in AI recommendations alongside traditional universities?',
         "Yes — and they often rank faster because they publish outcome data that traditional universities don't. AI assistants cite bootcamps that publish: job placement rates by company name, average starting salary, alumni LinkedIn profiles, and course completion rates. This outcome-specificity is what AI rewards. A bootcamp with 94% job placement rate within 6 months cited in its schema beats a university's brand recognition every time."),
        ('How fast do educational institutions see results from AEO optimization?',
         "Schools with complete GBP profiles and detailed FAQ content see first AI citations within 6—10 weeks. The admission inquiry cycle is long (3—12 months), so early visibility compounds significantly. Most education clients see 20—35% more AI-referred inquiry form submissions by month 3. Boarding schools and specialized programs see faster results because they're answering uniquely specific questions."),
        ("What's the minimum AEO investment for a tutor or small training center?",
         "Tutors and small centers can start at $0—$200/month. Free: optimize GBP with subject specialties, add 8 FAQs answering questions parents/students ask ('How do I know if my kid needs tutoring?', 'What's your tutoring methodology?'), and request reviews. At $150—200/mo, add monthly content targeting grade-specific and subject-specific search terms. This lean approach works because education AI citations reward outcome data and specificity."),
        ('Should education providers publish outcome data in their AEO content?',
         "Yes — it's the highest-leverage data for education AEO. Publish: student grade improvement (before/after), test score gains (SAT, ACT, etc.), college admission rates, job placement rates (for vocational programs), and alumni success. AI assistants cite outcome-specific content 4—5x more than generic 'we have experienced teachers' claims. Schools with published outcomes rank 60% higher in AI citations than those without."),
        ('How do small schools differentiate in AEO against large public school districts?',
         "Small schools win through pedagogical specificity. A Montessori school publishes detailed FAQs about 'how Montessori develops independence' and 'Montessori vs. traditional learning outcomes.' A coding bootcamp publishes 'job placement by employer' and 'average starting salary by role.' Large districts publish generic district-wide content. AI assistants prioritize specific methodology + outcome data over scale, making small schools highly competitive."),
        ('Should education providers hire a fractional CMO or manage AEO marketing in-house?',
         "Education marketing requires expertise in both enrollment funnels and AEO positioning — most school administrators and educators lack this bandwidth. In-house works only if you can dedicate 12—15 hours/week to content, GBP optimization, and enrollment email sequences. For most schools and tutoring centers, fractional CMO services ($249—$999/mo) handle schema setup, FAQ research, enrollment automation, and outcome data positioning while your team focuses on teaching and student success. NetWebMedia's AEO Starter covers AEO + SEO + monthly enrollment content at $249/mo for tutors and small centers, with CMO Growth adding Google + Meta paid ads for schools. Fractional ownership costs less than hiring a full marketing coordinator and provides expert-level strategy."),
    ],
    'events-weddings': [
        ('What schema markup do wedding venues and event planners need for AI recommendations?',
         "Wedding venues need EventVenue schema with capacity, catering options (in-house vs. outside), parking, accommodation options, and pricing range. Event planners use EventPlanner LocalBusiness with specializations (weddings, corporate, social), client types served, and geographic coverage. FAQPage schema targeting planning questions ('How far in advance should I book a wedding venue?', 'What's included in a wedding planner fee?') creates the highest-value AI citations because couples ask these questions during active research."),
        ('How do local venues compete with The Knot and WeddingWire in AI wedding search?',
         "The Knot and WeddingWire dominate listing aggregation. But AI assistants cite local venues and planners for specific questions: 'What's the best outdoor wedding venue in [city] that allows outside catering?' or 'Which wedding planners in [city] specialize in small intimate weddings?' These hyper-specific queries are answered from your website content, not aggregator profiles. Build content around your unique differentiators: venue capacity range, signature amenities, preferred vendor relationships, and real couple testimonials."),
        ('How early should couples find an event vendor through AI search?',
         "AI-influenced wedding vendor discovery starts 12—18 months before the event date. Couples use AI assistants during the initial inspiration phase, not just when booking. This means your AEO content should answer early-stage questions ('What's the average cost of a wedding venue in [city]?') as well as late-stage comparison questions ('What's included at [your venue name] vs. [competitor]?'). Early-stage AI citations build brand familiarity — couples who discovered you through AI are 3x more likely to book a site visit."),
        ('How fast do wedding and event businesses see results from AEO investment?',
         'Wedding and event businesses typically see AI citation improvements within 6—10 weeks. The conversion cycle is longer (3—18 months to booking), so early AEO investment has compounding value. Venues and planners who start AEO in Q1 see increased inquiry volume in Q3—Q4 as early-stage research couples move to decision stage. Most clients see 15—25% more AI-referred inquiries by month 4, with full ROI realized within 12 months.'),
        ("What's the minimum AEO investment for a wedding vendor on a budget?",
         "Wedding vendors can start at $0—$250/month. Free: optimize GBP with detailed 'about us' and high-quality photos, add 8 FAQs answering common planning questions ('What does a wedding photographer cost?', 'When should I book a venue?'), request reviews. At $150—250/mo, add monthly content about wedding trends, planning timelines, and vendor coordination. This lean investment works because AI citations in wedding planning are high-value (one booked wedding pays back 6—12 months of AEO expense)."),
        ('Should event vendors publish pricing in their AEO content?',
         "Yes, but strategically. Publish pricing ranges ('$2,000—$5,000 for a 50-person wedding') rather than per-unit rates to position your mid-market positioning. AI assistants cite content that answers 'how much does [service] cost?' more frequently. Couples using AI are already budget-aware; transparent pricing attracts aligned prospects. Venues and planners with published pricing ranges see 25—35% higher inquiry-to-consult conversion rates."),
        ('How do wedding vendors differentiate their AEO against each other in the same city?',
         "Differentiate through style, specialization, and outcome stories. A photographer publishing 'bohemian wedding photography' + detailed FAQs about bohemian aesthetics beats generic 'wedding photography' positioning. A venue publishing 'intimate 25—75 guest wedding venue' with photos + FAQs about close-knit celebrations beats a competitor listing just 'wedding venue.' AI assistants cite specific positioning (style + capacity + specialty) 3x more than generic categorical positioning."),
        ('Should wedding and event businesses hire a fractional CMO or build marketing in-house?',
         "Wedding and events businesses juggle vendor relationships, client timelines, and seasonal peaks — in-house marketing doesn't fit. Fractional CMO services ($249—$999/mo) handle AEO content, vendor positioning, seasonal promotion campaigns, and early-funnel couple discovery while your team focuses on execution and client experience. Wedding professionals who tried in-house marketing report 40—60% less operational stress when using fractional strategy. NetWebMedia's AEO Starter covers AEO + SEO + content at $249/mo for individual vendors, with CMO Growth adding paid ads for venue/planner scale."),
    ],
    'finance': [
        ('What schema markup does a financial advisor or CPA firm need to appear in AI recommendations?',
         "Financial service providers need FinancialService schema with services offered (tax planning, wealth management, retirement planning), regulatory certifications (CFP, CPA, CFA, RIA registration), geographic area served, and minimum asset requirements if applicable. FAQPage schema targeting client decision questions — 'What's the difference between a CFP and a CFA?', 'When do I need a financial advisor vs. a CPA?' — creates the highest-value AI citations because these are exactly what clients ask before selecting a firm."),
        ('How do financial firms navigate compliance requirements while creating AEO content?',
         "AEO content for financial services must be educational, not advisory. Publish content that explains concepts (how Roth conversions work, what a fiduciary duty means) rather than specific recommendations ('you should invest in X'). This is both SEC/FINRA-compliant and AI-preferred — AI assistants cite educational financial content at 3x the rate of sales content. Your compliance-safe educational library IS your AEO strategy."),
        ('Can independent RIAs and solo CFPs compete with Fidelity and Vanguard in AI search?',
         "Yes — and they win on local and specialty queries. Fidelity owns 'what is an index fund.' A solo CFP in Denver owns 'fee-only financial planner for tech professionals in Denver' or 'retirement planning for federal employees Colorado.' AI assistants cite local specialists for geo-specific and niche queries at higher rates than national brands. The more specific your specialty and market, the faster your AEO compounds."),
        ('How long does it take for financial services firms to see AI citation results?',
         'Financial service AI citations typically appear within 8—12 weeks for educational content. The compliance review cycle can slow publishing — budget 2—3 weeks for content approval. The fastest path: publish a 10-question FAQ about your specialty, add FinancialService schema to your GBP and website, and get listed on NAPFA, FPA, or XYPN directories (AI pulls from these). Most clients see measurable AI-referred contact form submissions by month 4.'),
        ("What's the minimum AEO investment for a solo financial advisor or small CPA firm?",
         "Solo practitioners can start at $0—$300/month. Free: optimize GBP with certifications and specialties, publish 8 compliance-approved FAQs about your niche (e.g., 'early retirement planning for doctors'), claim NAPFA/FPA/XYPN profile. At $200—300/mo, add monthly educational content about niche financial topics. This works because financial clients seeking specialists prefer detailed niche expertise over generalists. One acquired client justifies 6—12 months of AEO investment."),
        ('How should financial firms position themselves as specialists in AEO content?',
         "Define your ideal client + area of expertise explicitly. 'Fee-only CFP specializing in physicians' healthcare transition planning' outranks 'financial planner' in AI citations 10x. Publish 15—20 FAQs specifically addressing physician challenges (tax-efficient investing, disability insurance, partnership buy-sell agreements). AI assistants match specific audience + specific problem to your content. Specialists are cited by name when AI assistants answer targeted questions."),
        ('Should financial advisors include client testimonials in AEO content?',
         "Include anonymized outcome data, not personal testimonials. 'We helped 120+ clients average 22% portfolio growth in 2024' is better than a named client quote (which can trigger compliance issues). Quantified outcomes ('avg retirement readiness improved 35%', 'tax savings average $8K/client/year') are what AI assistants cite. Compliance-safe outcome metrics build trust for prospecting without regulatory risk."),
        ('Should financial services firms hire a fractional CMO or manage marketing in-house?',
         "Financial advisors and CPAs operate under compliance constraints — in-house marketing means someone juggling regulatory review cycles, compliance-safe content, and limited subject-matter expertise. Fractional CMO services ($249—$999/mo) handle compliance-approved educational content, AEO strategy, and lead nurture while your advisors focus on clients. The compliance review cycle alone (2—3 weeks per content piece) makes fractional ownership faster and more efficient than in-house. NetWebMedia's AEO Starter covers AEO + SEO + compliance-approved educational content at $249/mo, with CMO Growth adding ads for practice scale."),
    ],
    'home-services': [
        ('What schema markup do home service businesses need to appear in AI emergency and service recommendations?',
         "Plumbers and HVAC companies need Plumber/HVACBusiness schema with license numbers, service area radius, emergency availability (24/7 or not), and brand certifications (Trane, Carrier, etc.). General contractors use GeneralContractor schema. All home service businesses need FAQPage targeting emergency queries ('Is there a plumber available tonight?') and comparison queries ('Licensed vs. unlicensed contractor — what's the difference?'). These are the exact questions AI answers first."),
        ('How do local home service businesses compete with HomeAdvisor and Angi in AI search?',
         "HomeAdvisor and Angi dominate lead aggregation. But when someone asks AI 'best plumber near me' for a recommendation (not just a list), AI cites the business with the most authoritative content — license information, years in business, specific service descriptions, and verified reviews from multiple platforms. Your website with deep technical FAQs about your services outperforms aggregator profiles for recommendation queries."),
        ('Do service area businesses without a physical storefront show up in AI recommendations?',
         "Yes. Service area businesses (SABs) can fully optimize for AEO without a storefront. Key signals: Google Business Profile with service area set (not address), Schema.org with areaServed property listing specific cities/ZIP codes, and content mentioning exact neighborhoods and service zones. For emergency services, add availability schema and response time information — AI cites these details when answering 'emergency plumber open now near [location]' queries."),
        ('How fast do home service businesses see results from AEO investment?',
         'Home service businesses with complete GBP profiles see first AI citation improvements within 3—5 weeks. Emergency service keywords (plumber, electrician, HVAC repair) are high-intent and high-competition, so results vary by market density. In suburban markets with moderate competition, most clients see 20—30% more AI-referred calls by month 2. In dense urban markets, plan for a 90-day build before significant AI citation volume.'),
        ("What's the minimum AEO investment for a home service contractor on a budget?",
         "Home service contractors can start at $0—$200/month. Free: optimize GBP with service areas and certifications, add 8 FAQs answering common customer questions ('How much does [service] cost?', 'Do you offer emergency service?'), request Google reviews aggressively. At $150—200/mo, add monthly content about seasonal maintenance ('spring HVAC maintenance checklist'). This minimal investment works because emergency service queries convert immediately — one job pays back months of AEO investment."),
        ('Should home service businesses publish pricing information in AEO content?',
         "Publish service call fees and typical repair ranges (not per-hour rates, which vary by complexity). 'Service call fee: $75, typical plumbing repairs: $150—$800' attracts budget-aware customers and filters low-intent inquiries. Home service customers using AI are already committed to solving a problem; transparent pricing increases conversion. Contractors with published pricing see 30—40% higher inquiry-to-job conversion rates."),
        ('Can home service contractors use AEO to expand beyond their current service territory?',
         "Yes, if you're willing to expand operations. Use AEO content to map demand in adjacent ZIP codes — publish content targeting those areas. Monitor AI-referred inquiries from new zones. Once demand validates the expansion, hire and train local techs. Many contractors use AEO data to drive strategic expansion decisions — let customer demand via AI citations guide growth, rather than guessing. This transforms AEO from a lead channel into a market research tool."),
        ('Should home service contractors hire a fractional CMO or manage AEO and marketing in-house?',
         "Home service contractors work in the field — in-house marketing means someone dividing time between jobs and content creation (which doesn't work). Fractional CMO services ($249—$999/mo) handle GBP optimization, emergency-query content, paid ad management, and AI SDR for lead response while you focus on delivery and team management. Most contractors report that outsourcing marketing frees 10—15 hours/week that previously got stolen from billable jobs. NetWebMedia's AEO Starter covers AEO + SEO + monthly content at $249/mo, with CMO Growth adding Google Local Service Ads + AI SDR for immediate booking."),
    ],
    'wine-agriculture': [
        ('What schema markup do wineries and farms need to appear in AI tourism and food recommendations?',
         "Wineries need Winery schema (a subtype of FoodEstablishment) with tasting room hours, tour types, varietals produced, price range, and reservation requirements. Farms with direct sales need FarmersMarket or LocalBusiness with produce types, CSA availability, and pickup/delivery area. Both benefit from TouristAttraction schema if experiences are offered. FAQPage targeting visitor questions ('Do you need reservations for a tasting?' 'What varietals are you known for?') creates the highest AI citation density for tourism queries."),
        ('How do small wineries and farms compete with large estates in AI search?',
         "Small producers win on authenticity and specificity. Large estates publish generic marketing content; small producers can publish deep content about their specific growing methods, soil composition, vintage stories, and winemaker philosophy. AI assistants cite this depth of expertise when answering 'which winery has the most unique story near [city]?' or 'best natural wine producers in [wine region]?' Own your story — it's the content large estates can't replicate."),
        ('Can wine clubs and CSA subscriptions benefit from AEO?',
         "Yes. Wine club and CSA queries have high AI citation potential: 'Best wine club for natural wines delivered to California' or 'Organic CSA box delivery near [city]' are queries AI answers from schema-rich producer websites. Publish detailed subscription program content: what's included, delivery frequency, customization options, and cancellation policies. Add SubscriptionService schema if available, or describe subscription programs in your FAQPage. These queries convert at 2—3x the rate of general discovery queries."),
        ('How fast do wine country businesses see results from AEO investment?',
         'Wineries and farms with strong TripAdvisor and Google reviews typically see AI citation improvements within 4—8 weeks. Tourism-season timing matters: AEO content published in Q1 compounds through the spring-summer peak season. Most wine country clients see 20—30% more AI-referred tasting room reservations by month 3. Farm businesses see CSA sign-up increases of 15—25% within 60 days of AEO implementation.'),
        ("What's the minimum AEO investment for a small winery or farm?",
         "Small producers can start at $0—$250/month. Free: optimize GBP with accurate hours, location, produce/varietal list; add 8 FAQs about tasting reservations, farm boxes, or wine selections; get TripAdvisor/Google reviews. At $150—250/mo, add monthly content about your unique story (soil, growing methods, winemaker philosophy). Agriculture and wine AI citations reward authenticity and specificity — your story is what large competitors can't replicate, so lead with it."),
        ("How should wineries and farms position themselves as 'local experts' in AEO content?",
         "Publish expert content about your region's terroir, climate, seasonal produce, and production methods. A Napa winery should publish 15 FAQs about 'Napa Valley Cabernet Sauvignon' including soil types, vintage variations, aging potential. A farm should publish about 'local seasonal eating' with specific crop stories. AI assistants cite regional experts when answering 'what should I eat/drink from [region]?' positioning. Being the regional authority outranks being a generic wine/farm producer by 10x in AI citations."),
        ('Can wine clubs and CSA farms use AEO to reach customers beyond their region?',
         "Yes. Wine clubs and CSAs with shipping/delivery can target national AI queries: 'best natural wine club for delivery' or 'organic CSA boxes available nationally.' Publish detailed delivery area content (states, ZIP codes) and subscription program FAQs. National wine club queries convert at 3—5x the rate of tasting-room-only content because subscribers are already committed to a recurring purchase model. Expand your AEO territory to match your actual shipping footprint."),
        ('Should wine and agricultural producers hire a fractional CMO or manage marketing in-house?',
         "Wine and agriculture business owners focus on production, harvests, and seasonal operations — marketing in-house diverts 15—20 hours/week from core operations. Fractional CMO services ($249—$999/mo) handle AEO content strategy, DTC channel setup, wine club automation, and seasonal campaigns while you manage the vineyard or farm. The ROI is immediate: one wine club subscriber or CSA signup justifies months of marketing investment. NetWebMedia's AEO Starter covers AEO + SEO + terroir/story content at $249/mo, with CMO Growth adding e-commerce email automation + paid ads for DTC channel scaling."),
    ],
}

VERTICALS = [
  {
    "slug": "hospitality", "folder": "hospitality", "emoji": "&#127970;",
    "title": "AI Marketing for Hotels &amp; Hospitality",
    "meta_desc": "Fill more rooms, cut OTA dependency, and dominate local search. AI-powered fractional CMO for hotels, boutique chains, and hospitality groups — from $249/mo.",
    "eyebrow_en": "Hospitality", "eyebrow_es": "Hospitalidad",
    "h1_line1_en": "Fill More Rooms.", "h1_line1_es": "Llena M&aacute;s Habitaciones.",
    "h1_hl_en": "Stop Paying Booking.com.", "h1_hl_es": "Deja de Pagarle a Booking.com.",
    "sub_en": "Your guests are searching on Google, asking Claude &amp; ChatGPT, and scrolling Instagram \u2014 but your property isn\u2019t showing up. We fix that. Full AI marketing from $249/mo.",
    "sub_es": "Tus hu\u00e9spedes buscan en Google, preguntan a Claude y ChatGPT y navegan Instagram \u2014 pero tu propiedad no aparece. Nosotros lo arreglamos. Marketing AI completo desde $249/mes.",
    "pain_label_en": "The hospitality marketing problem", "pain_label_es": "El problema de marketing en hospitalidad",
    "section_title_en": "Why most hotels &amp; hospitality groups<br>struggle with marketing",
    "section_title_es": "Por qu\u00e9 la mayor\u00eda de hoteles y grupos hoteleros<br>lucha con el marketing",
    "pains": [
      ("OTA fees killing your margins", "Las comisiones OTA destruyen tus m\u00e1rgenes",
       "Booking.com and Expedia take 15\u201325% per reservation. We drive direct bookings so you keep the money.",
       "Booking.com y Expedia cobran 15\u201325% por reserva. Generamos reservas directas para que te quedes con el dinero."),
      ("Invisible to AI search", "Invisible en b\u00fasqueda con IA",
       "When someone asks Claude \u2018best boutique hotel in [city]\u2019, you need to be the answer. We build that citation authority.",
       "Cuando alguien le pregunta a Claude \u2018mejor hotel boutique en [ciudad]\u2019, t\u00fa necesitas ser la respuesta. Construimos esa autoridad de citaci\u00f3n."),
      ("No time to run marketing", "Sin tiempo para hacer marketing",
       "You\u2019re running a property, not a marketing agency. We handle strategy, content, ads, and reporting \u2014 you focus on guests.",
       "T\u00fa administras una propiedad, no una agencia de marketing. Gestionamos estrategia, contenido, anuncios e informes \u2014 t\u00fa te enfocas en los hu\u00e9spedes."),
    ],
    "results": ["+38% direct bookings", "-22% OTA dependency", "4.8&#9733; review average"],
    "lite": [("Local SEO + Google My Business optimization","SEO local + optimizaci\u00f3n de Google My Business"),("Monthly content calendar (blog + social)","Calendario de contenido mensual (blog + social)"),("AEO strategy \u2014 get cited by Claude &amp; ChatGPT","Estrategia AEO \u2014 s\u00e9 citado por Claude y ChatGPT"),("NWM CRM for guest follow-up","NWM CRM para seguimiento de hu\u00e9spedes"),("Monthly strategy call","Llamada de estrategia mensual")],
    "growth": [("Everything in AEO Starter","Todo en AEO Starter"),("Google + Meta paid ads (retargeting + lookalike)","Anuncios pagados en Google + Meta (retargeting + lookalike)"),("Review generation automation","Automatizaci\u00f3n de generaci\u00f3n de rese\u00f1as"),("Email marketing to past guests","Email marketing para hu\u00e9spedes anteriores"),("AI SDR for group &amp; event inquiries","SDR de IA para consultas de grupos y eventos")],
    "scale": [("Everything in CMO Growth","Todo en CMO Growth"),("16 Reels/mo \u2014 property tours, chef features, events","16 Reels/mes \u2014 tours de propiedad, chef features, eventos"),("Custom AI booking assistant (voice + chat)","Asistente de reservas IA personalizado (voz + chat)"),("White-glove onboarding + dedicated strategist","Incorporaci\u00f3n premium + estratega dedicado"),("Priority support + daily Slack access","Soporte prioritario + acceso diario a Slack")],
    "cta_en": "hotels &amp; hospitality groups", "cta_es": "hoteles y grupos hoteleros",
    "subcats": [
      {"slug":"hotels","emoji":"&#127970;","name_en":"Hotels","name_es":"Hoteles","desc_en":"Fill rooms, cut OTA fees","desc_es":"Llena habitaciones, reduce comisiones OTA"},
      {"slug":"boutique","emoji":"&#128717;","name_en":"Boutique Hotels","name_es":"Hoteles Boutique","desc_en":"Unique stays, premium rates","desc_es":"Estad\u00edas \u00fanicas, tarifas premium"},
      {"slug":"resorts","emoji":"&#127796;","name_en":"Resorts","name_es":"Resorts","desc_en":"All-season occupancy","desc_es":"Ocupaci\u00f3n en toda temporada"},
    ],
  },
  {
    "slug": "healthcare", "folder": "healthcare", "emoji": "&#129657;",
    "title": "AI Marketing for Healthcare Clinics",
    "meta_desc": "More appointments, fewer no-shows. AI-powered marketing for dental, veterinary, and medical aesthetics clinics — from $249/mo.",
    "eyebrow_en": "Healthcare", "eyebrow_es": "Salud",
    "h1_line1_en": "More Appointments.", "h1_line1_es": "M\u00e1s Citas.",
    "h1_hl_en": "Less Empty Chairs.", "h1_hl_es": "Sillas Siempre Llenas.",
    "sub_en": "Patients are asking AI assistants which clinic to trust. Your competitors are showing up \u2014 you\u2019re not. We build the digital presence that fills your schedule.",
    "sub_es": "Los pacientes preguntan a asistentes de IA qu\u00e9 cl\u00ednica elegir. Tus competidores aparecen \u2014 t\u00fa no. Construimos la presencia digital que llena tu agenda.",
    "pain_label_en": "The healthcare marketing problem", "pain_label_es": "El problema de marketing en salud",
    "section_title_en": "Why most dental, veterinary &amp; aesthetics clinics<br>struggle with marketing",
    "section_title_es": "Por qu\u00e9 la mayor\u00eda de cl\u00ednicas dentales, veterinarias y de est\u00e9tica<br>lucha con el marketing",
    "pains": [
      ("Empty slots draining revenue", "Espacios vac\u00edos drenando ingresos",
       "An unfilled appointment is pure lost income. We run the campaigns and automations that keep your calendar full.",
       "Una cita sin llenar es ingreso puro perdido. Ejecutamos las campa\u00f1as y automatizaciones que mantienen tu calendario lleno."),
      ("Losing patients to AI search", "Perdiendo pacientes ante b\u00fasqueda IA",
       "Claude and ChatGPT are now the first stop for healthcare recommendations. We optimize your clinic to be the trusted answer.",
       "Claude y ChatGPT son ahora la primera parada para recomendaciones de salud. Optimizamos tu cl\u00ednica para ser la respuesta de confianza."),
      ("No-shows and low retention", "Inasistencias y baja retenci\u00f3n",
       "We build automated recall sequences and loyalty touchpoints that keep patients coming back \u2014 and referring others.",
       "Construimos secuencias de recordatorio automatizadas y puntos de fidelizaci\u00f3n que mantienen a los pacientes regresando \u2014 y refiriendo a otros."),
    ],
    "results": ["+52% new patient inquiries", "-31% no-show rate", "Top 3 in local AI search"],
    "lite": [("Local SEO + Google My Business management","SEO local + gesti\u00f3n de Google My Business"),("Monthly health &amp; wellness content","Contenido mensual de salud y bienestar"),("AEO optimization \u2014 be recommended by AI assistants","Optimizaci\u00f3n AEO \u2014 s\u00e9 recomendado por asistentes IA"),("NWM CRM for patient follow-up sequences","NWM CRM para secuencias de seguimiento de pacientes"),("Monthly strategy note","Nota de estrategia mensual")],
    "growth": [("Everything in AEO Starter","Todo en AEO Starter"),("Google Ads (search + display) &amp; Meta retargeting","Google Ads (b\u00fasqueda + display) y retargeting en Meta"),("Automated appointment reminder &amp; recall sequences","Recordatorios de citas automatizados y secuencias de recall"),("Review generation on Google &amp; Healthgrades","Generaci\u00f3n de rese\u00f1as en Google y Healthgrades"),("AI SDR for new patient lead qualification","SDR de IA para calificaci\u00f3n de leads de nuevos pacientes")],
    "scale": [("Everything in CMO Growth","Todo en CMO Growth"),("Video factory \u2014 16 patient education Reels/mo","F\u00e1brica de video \u2014 16 Reels educativos/mes"),("Custom AI patient intake assistant","Asistente de IA personalizado para ingreso de pacientes"),("White-glove onboarding + dedicated account strategist","Incorporaci\u00f3n premium + estratega de cuenta dedicado"),("Priority support + daily Slack access","Soporte prioritario + acceso diario a Slack")],
    "cta_en": "dental, veterinary &amp; aesthetics clinics", "cta_es": "cl\u00ednicas dentales, veterinarias y de est\u00e9tica",
    "subcats": [
      {"slug":"dental","emoji":"&#129463;","name_en":"Dental","name_es":"Dental","desc_en":"New patients, fewer no-shows","desc_es":"Nuevos pacientes, menos inasistencias"},
      {"slug":"vet","emoji":"&#128062;","name_en":"Veterinary","name_es":"Veterinaria","desc_en":"Loyal pet owners for life","desc_es":"Due\u00f1os de mascotas fieles de por vida"},
      {"slug":"aesthetics","emoji":"&#128137;","name_en":"Medical Aesthetics","name_es":"Est\u00e9tica M\u00e9dica","desc_en":"Premium clients, full schedule","desc_es":"Clientes premium, agenda llena"},
    ],
  },
  {
    "slug": "beauty", "folder": "beauty", "emoji": "&#10024;",
    "title": "AI Marketing for Beauty &amp; Wellness",
    "meta_desc": "Pack your chair every day. AI marketing for salons, spas, and barbershops — grow bookings, build loyalty, and dominate local search from $249/mo.",
    "eyebrow_en": "Beauty &amp; Wellness", "eyebrow_es": "Belleza y Bienestar",
    "h1_line1_en": "Pack Your Chair.", "h1_line1_es": "Llena Tu Silla.",
    "h1_hl_en": "Every Single Day.", "h1_hl_es": "Todos los D\u00edas.",
    "sub_en": "Word of mouth only gets you so far. We build the online machine that turns Instagram followers into booked clients \u2014 and booked clients into loyal regulars.",
    "sub_es": "El boca a boca solo te lleva hasta cierto punto. Construimos la m\u00e1quina online que convierte seguidores de Instagram en clientes agendados \u2014 y clientes en habituales leales.",
    "pain_label_en": "The beauty &amp; wellness marketing problem", "pain_label_es": "El problema de marketing en belleza y bienestar",
    "section_title_en": "Why most salons, spas &amp; barbershops<br>struggle with marketing",
    "section_title_es": "Por qu\u00e9 la mayor\u00eda de salones, spas y barber\u00edas<br>lucha con el marketing",
    "pains": [
      ("Slow weeks killing cash flow", "Las semanas lentas matan el flujo de caja",
       "Unpredictable bookings mean unpredictable income. We build always-on campaigns that fill your calendar even on slow Tuesdays.",
       "Las reservas impredecibles significan ingresos impredecibles. Construimos campa\u00f1as siempre activas que llenan tu calendario incluso los martes lentos."),
      ("Instagram reach that doesn\u2019t convert", "Alcance de Instagram que no convierte",
       "Likes don\u2019t pay rent. We turn your social presence into a direct booking engine with paid retargeting and AI-driven follow-up.",
       "Los likes no pagan la renta. Convertimos tu presencia social en un motor de reservas directas con retargeting pagado y seguimiento con IA."),
      ("Clients who book once and disappear", "Clientes que reservan una vez y desaparecen",
       "We build automated loyalty sequences \u2014 birthday offers, rebooking reminders, referral rewards \u2014 that turn one-timers into regulars.",
       "Construimos secuencias de fidelizaci\u00f3n automatizadas \u2014 ofertas de cumplea\u00f1os, recordatorios de reserva, recompensas por referidos \u2014 que convierten visitas \u00fanicas en habituales."),
    ],
    "results": ["+44% repeat bookings", "+280% reach-to-book rate", "4.9&#9733; average Google rating"],
    "lite": [("Local SEO + Google My Business for salons","SEO local + Google My Business para salones"),("Monthly content: tips, transformations, promos","Contenido mensual: tips, transformaciones, promos"),("AEO \u2014 be recommended when AI suggests salons near you","AEO \u2014 s\u00e9 recomendado cuando la IA sugiere salones cerca"),("NWM CRM with rebooking reminder automations","NWM CRM con automatizaciones de recordatorio de reserva"),("Monthly strategy note","Nota de estrategia mensual")],
    "growth": [("Everything in AEO Starter","Todo en AEO Starter"),("Meta (Instagram + Facebook) paid ads","Anuncios pagados en Meta (Instagram + Facebook)"),("Automated rebooking + loyalty sequences","Secuencias automatizadas de re-reserva + fidelizaci\u00f3n"),("Influencer &amp; UGC content coordination","Coordinaci\u00f3n de contenido con influencers y UGC"),("AI SDR for new client lead qualification","SDR de IA para calificaci\u00f3n de leads de nuevos clientes")],
    "scale": [("Everything in CMO Growth","Todo en CMO Growth"),("16 Reels/mo \u2014 transformations, tutorials, behind-the-scenes","16 Reels/mes \u2014 transformaciones, tutoriales, behind-the-scenes"),("Custom AI booking assistant for your site","Asistente de reservas IA personalizado para tu sitio"),("White-glove onboarding + dedicated strategist","Incorporaci\u00f3n premium + estratega dedicado"),("Priority support + daily Slack access","Soporte prioritario + acceso diario a Slack")],
    "cta_en": "salons, spas &amp; barbershops", "cta_es": "salones, spas y barber\u00edas",
    "subcats": [
      {"slug":"salons","emoji":"&#9997;","name_en":"Hair Salons","name_es":"Salones de Cabello","desc_en":"Pack books, retain clients","desc_es":"Llena agenda, retiene clientes"},
      {"slug":"spas","emoji":"&#129494;","name_en":"Spas","name_es":"Spas","desc_en":"Full rooms, loyal guests","desc_es":"Salas llenas, clientes leales"},
      {"slug":"barbershops","emoji":"&#9986;","name_en":"Barbershops","name_es":"Barber\u00edas","desc_en":"Build a brand they\u2019re loyal to","desc_es":"Construye una marca a la que sean leales"},
    ],
  },
  {
    "slug": "pro", "folder": "professional-services", "emoji": "&#128188;",
    "title": "AI Marketing for Professional Services",
    "meta_desc": "Stop losing clients to firms half your size. AI-powered fractional CMO for law firms, accounting practices, and consulting agencies — from $249/mo.",
    "eyebrow_en": "Professional Services", "eyebrow_es": "Servicios Profesionales",
    "h1_line1_en": "Stop Losing Clients", "h1_line1_es": "Deja de Perder Clientes",
    "h1_hl_en": "to Firms Half Your Size.", "h1_hl_es": "Ante Firmas de la Mitad de Tu Tama\u00f1o.",
    "sub_en": "Younger competitors with better SEO and AI visibility are winning clients you should own. We build the authority and lead generation machine that puts you back on top.",
    "sub_es": "Competidores m\u00e1s j\u00f3venes con mejor SEO y visibilidad en IA est\u00e1n ganando clientes que deber\u00edan ser tuyos. Construimos la autoridad y el motor de generaci\u00f3n de leads que te vuelve a poner en la cima.",
    "pain_label_en": "The professional services marketing problem", "pain_label_es": "El problema de marketing en servicios profesionales",
    "section_title_en": "Why most law firms, accounting &amp; consulting practices<br>struggle with marketing",
    "section_title_es": "Por qu\u00e9 la mayor\u00eda de firmas legales, contables y consultoras<br>lucha con el marketing",
    "pains": [
      ("Referrals alone won\u2019t grow you", "Los referidos solos no te har\u00e1n crecer",
       "The best firms don\u2019t wait for referrals \u2014 they build a pipeline. We create the content engine and paid strategy that generates inbound leads.",
       "Las mejores firmas no esperan referidos \u2014 construyen una cartera. Creamos el motor de contenido y la estrategia pagada que genera leads entrantes."),
      ("AI doesn\u2019t know your expertise", "La IA no conoce tu expertise",
       "When a prospect asks Claude \u2018best lawyer/accountant for [problem]\u2019, you need to be the answer. We build that authority systematically.",
       "Cuando un prospecto le pregunta a Claude \u2018mejor abogado/contador para [problema]\u2019, t\u00fa necesitas ser la respuesta. Construimos esa autoridad sistem\u00e1ticamente."),
      ("No time for marketing", "Sin tiempo para marketing",
       "You\u2019re billing hours, not writing blog posts. We handle all execution \u2014 strategy, content, ads, reporting \u2014 so you don\u2019t have to.",
       "T\u00fa est\u00e1s facturando horas, no escribiendo blogs. Manejamos toda la ejecuci\u00f3n \u2014 estrategia, contenido, anuncios, reportes \u2014 para que no tengas que hacerlo."),
    ],
    "results": ["+67% inbound inquiries", "Top 3 AI citation for target areas", "3.2x ROI on ad spend"],
    "lite": [("SEO + thought leadership content strategy","SEO + estrategia de contenido de liderazgo intelectual"),("Monthly articles targeting your practice area keywords","Art\u00edculos mensuales dirigidos a keywords de tu \u00e1rea de pr\u00e1ctica"),("AEO \u2014 be recommended by Claude &amp; ChatGPT","AEO \u2014 s\u00e9 recomendado por Claude y ChatGPT"),("NWM CRM for prospect follow-up","NWM CRM para seguimiento de prospectos"),("Monthly strategy note","Nota de estrategia mensual")],
    "growth": [("Everything in AEO Starter","Todo en AEO Starter"),("Google Search Ads for high-intent keywords","Google Search Ads para keywords de alta intenci\u00f3n"),("LinkedIn content + lead gen campaigns","Contenido en LinkedIn + campa\u00f1as de generaci\u00f3n de leads"),("Email nurture sequences for prospects","Secuencias de nurture por email para prospectos"),("AI SDR for initial inquiry qualification","SDR de IA para calificaci\u00f3n inicial de consultas")],
    "scale": [("Everything in CMO Growth","Todo en CMO Growth"),("Video factory \u2014 16 expert insight Reels/mo","F\u00e1brica de video \u2014 16 Reels de expertos/mes"),("Custom AI intake assistant for your firm","Asistente de IA personalizado para tu firma"),("White-glove onboarding + dedicated strategist","Incorporaci\u00f3n premium + estratega dedicado"),("Priority support + daily Slack access","Soporte prioritario + acceso diario a Slack")],
    "cta_en": "law firms, accounting &amp; consulting practices", "cta_es": "firmas legales, contables y consultoras",
    "subcats": [
      {"slug":"legal","emoji":"&#9878;","name_en":"Law Firms","name_es":"Firmas de Abogados","desc_en":"Qualified clients, less waiting","desc_es":"Clientes calificados, menos espera"},
      {"slug":"accounting","emoji":"&#128202;","name_en":"Accounting Firms","name_es":"Firmas Contables","desc_en":"Grow beyond tax season","desc_es":"Crece m\u00e1s all\u00e1 de la temporada de impuestos"},
      {"slug":"consulting","emoji":"&#129504;","name_en":"Consulting Firms","name_es":"Firmas Consultoras","desc_en":"Pipeline beyond your network","desc_es":"Pipeline m\u00e1s all\u00e1 de tu red"},
    ],
  },
  {
    "slug": "realestate", "folder": "real-estate", "emoji": "&#127968;",
    "title": "AI Marketing for Real Estate Teams",
    "meta_desc": "Be the agent AI recommends. AI marketing for real estate teams and brokerages — more listings, faster lead response from $249/mo.",
    "eyebrow_en": "Real Estate", "eyebrow_es": "Bienes Ra\u00edces",
    "h1_line1_en": "Be the Agent", "h1_line1_es": "S\u00e9 el Agente",
    "h1_hl_en": "AI Recommends.", "h1_hl_es": "Que la IA Recomienda.",
    "sub_en": "Buyers and sellers are asking AI assistants which agent to trust. We build the digital authority, lead pipeline, and follow-up systems that make you the obvious choice.",
    "sub_es": "Los compradores y vendedores preguntan a asistentes de IA qu\u00e9 agente de confianza elegir. Construimos la autoridad digital, el pipeline de leads y los sistemas de seguimiento que te hacen la opci\u00f3n obvia.",
    "pain_label_en": "The real estate marketing problem", "pain_label_es": "El problema de marketing en bienes ra\u00edces",
    "section_title_en": "Why most real estate teams &amp; brokerages<br>struggle with marketing",
    "section_title_es": "Por qu\u00e9 la mayor\u00eda de equipos de bienes ra\u00edces y brokers<br>lucha con el marketing",
    "pains": [
      ("Leads go cold before you respond", "Los leads se enfrían antes de que respondas",
       "Speed-to-lead wins deals. Our AI SDR responds to every inquiry in under 2 minutes, qualifies them, and books your showing \u2014 24/7.",
       "La velocidad de respuesta gana deals. Nuestro SDR de IA responde a cada consulta en menos de 2 minutos, la califica y agenda tu visita \u2014 las 24/7."),
      ("Invisible in AI-assisted search", "Invisible en b\u00fasqueda asistida por IA",
       "When someone asks Claude \u2018top real estate agent in [city]\u2019, your team needs to come up. We build that authority systematically.",
       "Cuando alguien le pregunta a Claude \u2018mejor agente de bienes ra\u00edces en [ciudad]\u2019, tu equipo necesita aparecer. Construimos esa autoridad sistem\u00e1ticamente."),
      ("Manual listing promotion is a full-time job", "La promoci\u00f3n manual de listados es trabajo de tiempo completo",
       "We automate listing promotion across Google, Meta, and email so every property gets maximum exposure without the manual work.",
       "Automatizamos la promoci\u00f3n de listados en Google, Meta y email para que cada propiedad tenga m\u00e1xima exposici\u00f3n sin trabajo manual."),
    ],
    "results": ["+73% lead response rate", "2-min avg AI SDR response", "+41% listing inquiries"],
    "lite": [("Local SEO + Google My Business for your team","SEO local + Google My Business para tu equipo"),("Listing content automation + neighborhood guides","Automatizaci\u00f3n de contenido de listados + gu\u00edas de vecindario"),("AEO \u2014 appear when AI recommends local agents","AEO \u2014 aparece cuando la IA recomienda agentes locales"),("NWM CRM with lead nurture sequences","NWM CRM con secuencias de nurture de leads"),("Monthly strategy note","Nota de estrategia mensual")],
    "growth": [("Everything in AEO Starter","Todo en AEO Starter"),("Google + Meta listing promotion ads","Anuncios de promoci\u00f3n de listados en Google + Meta"),("Automated lead follow-up + showing scheduler","Seguimiento automatizado de leads + agendador de visitas"),("Email campaigns to past clients for referrals","Campa\u00f1as de email a clientes anteriores para referidos"),("AI SDR \u2014 qualifies &amp; books leads 24/7","SDR de IA \u2014 califica y agenda leads 24/7")],
    "scale": [("Everything in CMO Growth","Todo en CMO Growth"),("16 property tour &amp; market update Reels/mo","16 Reels/mes de tours de propiedad y actualizaciones de mercado"),("Custom AI assistant for your website","Asistente de IA personalizado para tu sitio web"),("White-glove onboarding + dedicated strategist","Incorporaci\u00f3n premium + estratega dedicado"),("Priority support + daily Slack access","Soporte prioritario + acceso diario a Slack")],
    "cta_en": "real estate teams &amp; brokerages", "cta_es": "equipos de bienes ra\u00edces y brokers",
    "subcats": [
      {"slug":"agents","emoji":"&#127969;","name_en":"Real Estate Agents","name_es":"Agentes Inmobiliarios","desc_en":"More listings, zero cold calling","desc_es":"M\u00e1s listados, sin llamadas en fr\u00edo"},
      {"slug":"brokerages","emoji":"&#127962;","name_en":"Brokerages","name_es":"Brokerages","desc_en":"Recruit top agents, dominate market","desc_es":"Recluta top agentes, domina el mercado"},
      {"slug":"propertymanagement","emoji":"&#128273;","name_en":"Property Management","name_es":"Administraci\u00f3n de Propiedades","desc_en":"More owners, lower vacancy","desc_es":"M\u00e1s propietarios, menor vacancia"},
    ],
  },
  {
    "slug": "restaurants", "folder": "restaurants", "emoji": "&#127829;",
    "title": "AI Marketing for Restaurants &amp; F&amp;B",
    "meta_desc": "Full tables, not just on weekends. AI marketing for restaurants, bars, and food & beverage businesses — from $249/mo.",
    "eyebrow_en": "Restaurants &amp; F&amp;B", "eyebrow_es": "Restaurantes y F&amp;B",
    "h1_line1_en": "Full Tables.", "h1_line1_es": "Mesas Llenas.",
    "h1_hl_en": "Not Just on Weekends.", "h1_hl_es": "No Solo los Fines de Semana.",
    "sub_en": "Your food is great. But if locals aren\u2019t finding you on Google and AI isn\u2019t recommending you, you\u2019re leaving covers on the table every night.",
    "sub_es": "Tu comida es excelente. Pero si los locales no te encuentran en Google y la IA no te recomienda, est\u00e1s dejando cubiertos en la mesa cada noche.",
    "pain_label_en": "The restaurant marketing problem", "pain_label_es": "El problema de marketing en restaurantes",
    "section_title_en": "Why most restaurants, bars &amp; F&amp;B businesses<br>struggle with marketing",
    "section_title_es": "Por qu\u00e9 la mayor\u00eda de restaurantes, bares y negocios F&amp;B<br>lucha con el marketing",
    "pains": [
      ("Slow midweek nights costing you money", "Las noches lentas entre semana te cuestan dinero",
       "Fixed costs don\u2019t stop on Tuesdays. We run targeted promotions and email campaigns that drive traffic on your slowest nights.",
       "Los costos fijos no paran los martes. Ejecutamos promociones dirigidas y campa\u00f1as de email que generan tr\u00e1fico en tus noches m\u00e1s lentas."),
      ("Losing to chains with bigger budgets", "Perdiendo ante cadenas con presupuestos mayores",
       "Big chains have agencies. Now you do too \u2014 for a fraction of the cost. We out-smart them with better local targeting and AI search presence.",
       "Las grandes cadenas tienen agencias. Ahora t\u00fa tambi\u00e9n \u2014 por una fracci\u00f3n del costo. Los superamos con mejor segmentaci\u00f3n local y presencia en b\u00fasqueda IA."),
      ("No system for reviews and loyalty", "Sin sistema de rese\u00f1as y fidelizaci\u00f3n",
       "Reviews drive reservations. We build automated systems that turn happy diners into 5-star reviews and loyal regulars.",
       "Las rese\u00f1as impulsan las reservas. Construimos sistemas automatizados que convierten a comensales felices en rese\u00f1as de 5 estrellas y habituales leales."),
    ],
    "results": ["+48% midweek covers", "+180% Google review velocity", "4.8&#9733; average across platforms"],
    "lite": [("Google My Business optimization + local SEO","Optimizaci\u00f3n de Google My Business + SEO local"),("Monthly content: menu features, events, kitchen stories","Contenido mensual: platillos, eventos, historias de cocina"),("AEO \u2014 be recommended when AI suggests restaurants","AEO \u2014 s\u00e9 recomendado cuando la IA sugiere restaurantes"),("NWM CRM for loyalty &amp; email campaigns","NWM CRM para fidelizaci\u00f3n y campa\u00f1as de email"),("Monthly strategy note","Nota de estrategia mensual")],
    "growth": [("Everything in AEO Starter","Todo en AEO Starter"),("Meta + Google Ads (local awareness + retargeting)","Anuncios en Meta + Google (awareness local + retargeting)"),("Automated review request sequences","Secuencias automatizadas de solicitud de rese\u00f1as"),("Event &amp; private dining promotion campaigns","Campa\u00f1as de promoci\u00f3n de eventos y cenas privadas"),("AI SDR for reservation &amp; event inquiries","SDR de IA para consultas de reservas y eventos")],
    "scale": [("Everything in CMO Growth","Todo en CMO Growth"),("16 Reels/mo \u2014 dishes, chef stories, ambiance tours","16 Reels/mes \u2014 platillos, historias del chef, tours de ambiente"),("Custom AI reservation assistant for your site","Asistente de reservas IA personalizado para tu sitio"),("White-glove onboarding + dedicated strategist","Incorporaci\u00f3n premium + estratega dedicado"),("Priority support + daily Slack access","Soporte prioritario + acceso diario a Slack")],
    "cta_en": "restaurants, bars &amp; F&amp;B businesses", "cta_es": "restaurantes, bares y negocios F&amp;B",
    "subcats": [
      {"slug":"bars","emoji":"&#127864;","name_en":"Bars &amp; Nightlife","name_es":"Bares y Vida Nocturna","desc_en":"Packed every night of the week","desc_es":"Lleno cada noche de la semana"},
      {"slug":"catering","emoji":"&#127857;","name_en":"Catering","name_es":"Catering","desc_en":"High-value event bookings","desc_es":"Reservas de eventos de alto valor"},
    ],
  },
  {
    "slug": "fitness", "folder": "fitness", "emoji": "&#127947;",
    "title": "AI Marketing for Fitness &amp; Gyms",
    "meta_desc": "Keep members, grow revenue year-round. AI marketing for gyms, studios, and fitness businesses — cut churn, fill classes from $249/mo.",
    "eyebrow_en": "Fitness &amp; Gyms", "eyebrow_es": "Fitness y Gimnasios",
    "h1_line1_en": "Keep Members.", "h1_line1_es": "Ret\u00e9n Miembros.",
    "h1_hl_en": "Grow Revenue Year-Round.", "h1_hl_es": "Haz Crecer los Ingresos Todo el A\u00f1o.",
    "sub_en": "January fills your gym. February empties it. We build the marketing engine that drives steady member growth, reduces churn, and makes you the top fitness destination locally.",
    "sub_es": "Enero llena tu gimnasio. Febrero lo vac\u00eda. Construimos el motor de marketing que impulsa un crecimiento constante de miembros, reduce la deserci\u00f3n y te convierte en el destino fitness local n\u00famero uno.",
    "pain_label_en": "The fitness marketing problem", "pain_label_es": "El problema de marketing en fitness",
    "section_title_en": "Why most gyms, studios &amp; fitness businesses<br>struggle with marketing",
    "section_title_es": "Por qu\u00e9 la mayor\u00eda de gimnasios, estudios y negocios de fitness<br>lucha con el marketing",
    "pains": [
      ("January spike, February crash", "Pico en enero, ca\u00edda en febrero",
       "Seasonal churn is predictable \u2014 so is the fix. We build retention campaigns and year-round acquisition funnels that smooth out the revenue curve.",
       "La deserci\u00f3n estacional es predecible \u2014 tambi\u00e9n lo es la soluci\u00f3n. Construimos campa\u00f1as de retenci\u00f3n y embudos de adquisici\u00f3n durante todo el a\u00f1o que nivelan la curva de ingresos."),
      ("Can\u2019t out-spend big-box gyms on ads", "No puedes superar en gasto a los gimnasios grandes",
       "You compete on community and results. We help you tell that story at scale \u2014 with content, ads, and AI search presence that big-box can\u2019t match locally.",
       "Compites en comunidad y resultados. Te ayudamos a contar esa historia a escala \u2014 con contenido, anuncios y presencia IA que los grandes no pueden igualar localmente."),
      ("Members leave without warning", "Los miembros se van sin aviso",
       "Our NWM CRM tracks engagement signals and triggers win-back campaigns before members cancel. We\u2019re already working before they ask to leave.",
       "Nuestro NWM CRM monitorea se\u00f1ales de compromiso y activa campa\u00f1as de recuperaci\u00f3n antes de que los miembros cancelen. Ya estamos trabajando antes de que pidan irse."),
    ],
    "results": ["-28% churn rate", "+55% new member trials", "Top local gym in AI search"],
    "lite": [("Local SEO + Google My Business for your gym","SEO local + Google My Business para tu gimnasio"),("Monthly content: workouts, transformations, schedules","Contenido mensual: entrenamientos, transformaciones, horarios"),("AEO \u2014 be recommended when AI suggests gyms near you","AEO \u2014 s\u00e9 recomendado cuando la IA sugiere gimnasios cerca"),("NWM CRM with churn-prevention automations","NWM CRM con automatizaciones de prevenci\u00f3n de deserci\u00f3n"),("Monthly strategy note","Nota de estrategia mensual")],
    "growth": [("Everything in AEO Starter","Todo en AEO Starter"),("Meta + Google Ads for new member acquisition","Anuncios en Meta + Google para adquisici\u00f3n de nuevos miembros"),("Automated trial-to-member conversion sequences","Secuencias automatizadas de conversi\u00f3n de prueba a miembro"),("Challenge &amp; event promotion campaigns","Campa\u00f1as de promoci\u00f3n de retos y eventos"),("AI SDR to qualify &amp; book free trial visits 24/7","SDR de IA para calificar y agendar visitas de prueba 24/7")],
    "scale": [("Everything in CMO Growth","Todo en CMO Growth"),("16 Reels/mo \u2014 workouts, member stories, class previews","16 Reels/mes \u2014 entrenamientos, historias de miembros, previews de clases"),("Custom AI assistant for class booking &amp; FAQs","Asistente de IA personalizado para reservas de clases y preguntas"),("White-glove onboarding + dedicated strategist","Incorporaci\u00f3n premium + estratega dedicado"),("Priority support + daily Slack access","Soporte prioritario + acceso diario a Slack")],
    "cta_en": "gyms, studios &amp; fitness businesses", "cta_es": "gimnasios, estudios y negocios de fitness",
    "subcats": [
      {"slug":"gyms","emoji":"&#127947;","name_en":"Gyms","name_es":"Gimnasios","desc_en":"More members, less churn","desc_es":"M\u00e1s miembros, menos deserci\u00f3n"},
      {"slug":"studios","emoji":"&#129340;","name_en":"Fitness Studios","name_es":"Estudios de Fitness","desc_en":"Full classes, thriving community","desc_es":"Clases llenas, comunidad activa"},
      {"slug":"personaltraining","emoji":"&#128170;","name_en":"Personal Trainers","name_es":"Entrenadores Personales","desc_en":"Full roster, no cold DMs","desc_es":"Roster completo, sin DMs en fr\u00edo"},
    ],
  },
  {
    "slug": "ecommerce", "folder": "ecommerce", "emoji": "&#128722;",
    "title": "AI Marketing for E-commerce",
    "meta_desc": "Turn one-time buyers into loyal customers. AI marketing for e-commerce brands — lower CAC, higher LTV, and omnichannel growth from $249/mo.",
    "eyebrow_en": "E-commerce", "eyebrow_es": "E-commerce",
    "h1_line1_en": "Turn One-Time Buyers", "h1_line1_es": "Convierte Compradores \u00danicos",
    "h1_hl_en": "Into Loyal Customers.", "h1_hl_es": "En Clientes Leales.",
    "sub_en": "You\u2019re spending on ads to acquire customers who buy once and disappear. We build the retention engine \u2014 email, SMS, retargeting, and AI personalization \u2014 that makes every customer worth 3x more.",
    "sub_es": "Est\u00e1s gastando en anuncios para adquirir clientes que compran una vez y desaparecen. Construimos el motor de retenci\u00f3n \u2014 email, SMS, retargeting y personalizaci\u00f3n IA \u2014 que hace que cada cliente valga 3 veces m\u00e1s.",
    "pain_label_en": "The e-commerce marketing problem", "pain_label_es": "El problema de marketing en e-commerce",
    "section_title_en": "Why most e-commerce brands &amp; online retailers<br>struggle with marketing",
    "section_title_es": "Por qu\u00e9 la mayor\u00eda de marcas de e-commerce<br>lucha con el marketing",
    "pains": [
      ("CAC keeps rising, LTV stays flat", "El CAC sube, el LTV se mantiene plano",
       "If you\u2019re only optimizing acquisition, you\u2019re on a treadmill. We build retention funnels that maximize the value of every customer you\u2019ve already paid for.",
       "Si solo optimizas la adquisici\u00f3n, est\u00e1s en una cinta de correr. Construimos embudos de retenci\u00f3n que maximizan el valor de cada cliente que ya pagaste."),
      ("Abandoned carts leaking revenue", "Carritos abandonados filtrando ingresos",
       "70% of carts are abandoned. Our automated sequences \u2014 email, SMS, retargeting \u2014 recover 15\u201325% of that lost revenue on autopilot.",
       "El 70% de los carritos se abandonan. Nuestras secuencias automatizadas \u2014 email, SMS, retargeting \u2014 recuperan el 15\u201325% de ese ingreso perdido en piloto autom\u00e1tico."),
      ("Invisible outside your ad spend", "Invisible fuera de tu gasto en anuncios",
       "When ad spend stops, traffic stops. We build organic SEO, AEO, and content authority so your brand generates traffic you don\u2019t pay for.",
       "Cuando el gasto en anuncios para, el tr\u00e1fico para. Construimos autoridad org\u00e1nica de SEO, AEO y contenido para que tu marca genere tr\u00e1fico que no pagas."),
    ],
    "results": ["+34% repeat purchase rate", "22% cart recovery rate", "3.8x ROAS on paid campaigns"],
    "lite": [("E-commerce SEO + product content strategy","SEO de e-commerce + estrategia de contenido de producto"),("Monthly blog &amp; buying guide content","Contenido mensual: blog y gu\u00edas de compra"),("AEO \u2014 appear in AI product recommendations","AEO \u2014 aparece en recomendaciones de productos por IA"),("NWM CRM for email &amp; SMS retention flows","NWM CRM para flujos de retenci\u00f3n por email y SMS"),("Monthly strategy note","Nota de estrategia mensual")],
    "growth": [("Everything in AEO Starter","Todo en AEO Starter"),("Google Shopping + Meta catalog ads","Google Shopping + anuncios de cat\u00e1logo en Meta"),("Abandoned cart &amp; browse abandonment sequences","Secuencias de carrito abandonado y abandono de navegaci\u00f3n"),("Post-purchase upsell &amp; loyalty email flows","Flujos de email de upsell post-compra y fidelizaci\u00f3n"),("AI SDR for high-value customer outreach","SDR de IA para contacto de clientes de alto valor")],
    "scale": [("Everything in CMO Growth","Todo en CMO Growth"),("16 Reels/mo \u2014 product showcases, UGC, unboxings","16 Reels/mes \u2014 showcases de productos, UGC, unboxings"),("Custom AI shopping assistant for your store","Asistente de compras IA personalizado para tu tienda"),("White-glove onboarding + dedicated strategist","Incorporaci\u00f3n premium + estratega dedicado"),("Priority support + daily Slack access","Soporte prioritario + acceso diario a Slack")],
    "cta_en": "e-commerce brands &amp; online retailers", "cta_es": "marcas de e-commerce y tiendas online",
    "subcats": [
      {"slug":"shopify","emoji":"&#128717;","name_en":"Shopify Stores","name_es":"Tiendas Shopify","desc_en":"Scale from $X to $10X","desc_es":"Escala de $X a $10X"},
      {"slug":"dtc","emoji":"&#128230;","name_en":"DTC Brands","name_es":"Marcas DTC","desc_en":"Own your customers, ditch Amazon","desc_es":"Due\u00f1o de tus clientes, adi\u00f3s Amazon"},
      {"slug":"marketplace","emoji":"&#127978;","name_en":"Marketplace Sellers","name_es":"Vendedores en Marketplace","desc_en":"Build your direct channel","desc_es":"Construye tu canal directo"},
    ],
  },
  {
    "slug": "home", "folder": "home-services", "emoji": "&#128295;",
    "title": "AI Marketing for Home Services",
    "meta_desc": "Book more jobs, chase fewer leads. AI marketing for contractors, plumbers, electricians, and home service businesses — from $249/mo.",
    "eyebrow_en": "Home Services", "eyebrow_es": "Servicios del Hogar",
    "h1_line1_en": "Book More Jobs.", "h1_line1_es": "Agenda M\u00e1s Trabajos.",
    "h1_hl_en": "Chase Fewer Leads.", "h1_hl_es": "Persigue Menos Leads.",
    "sub_en": "HomeAdvisor and Angi take your money and sell your leads to 5 competitors. We build your own lead engine \u2014 Google, AI search, and automated follow-up \u2014 so you own the relationship.",
    "sub_es": "HomeAdvisor y Angi se quedan con tu dinero y venden tus leads a 5 competidores. Construimos tu propio motor de leads \u2014 Google, b\u00fasqueda IA y seguimiento automatizado \u2014 para que seas due\u00f1o de la relaci\u00f3n.",
    "pain_label_en": "The home services marketing problem", "pain_label_es": "El problema de marketing en servicios del hogar",
    "section_title_en": "Why most contractors, plumbers &amp; home service pros<br>struggle with marketing",
    "section_title_es": "Por qu\u00e9 la mayor\u00eda de contratistas, plomeros y profesionales del hogar<br>lucha con el marketing",
    "pains": [
      ("Feast-or-famine booking cycles", "Ciclos de reserva de fest\u00edn o hambruna",
       "One week slammed, the next empty. We build consistent inbound pipelines through SEO, paid ads, and AI-powered lead nurture that levels out your calendar.",
       "Una semana saturado, la siguiente vac\u00edo. Construimos pipelines entrantes consistentes a trav\u00e9s de SEO, anuncios pagados y nurture de leads con IA que nivela tu calendario."),
      ("Paying platforms for your own leads", "Pagando plataformas por tus propios leads",
       "Lead aggregators mark up leads and sell them to your competition. We build your direct channel so every lead you get is yours alone.",
       "Los agregadores de leads marcan los leads y los venden a tu competencia. Construimos tu canal directo para que cada lead que obtienes sea solo tuyo."),
      ("Losing jobs because you responded too slow", "Perdiendo trabajos porque respondiste muy lento",
       "Speed wins in home services. Our AI SDR responds to every inquiry in under 2 minutes, qualifies the job, and books the estimate \u2014 while you\u2019re on another job.",
       "La velocidad gana en servicios del hogar. Nuestro SDR de IA responde a cada consulta en menos de 2 minutos, califica el trabajo y agenda el presupuesto \u2014 mientras est\u00e1s en otro trabajo."),
    ],
    "results": ["+61% inbound leads", "2-min AI SDR response", "-40% reliance on lead aggregators"],
    "lite": [("Local SEO + Google My Business optimization","SEO local + optimizaci\u00f3n de Google My Business"),("Monthly content: project showcases, tips, testimonials","Contenido mensual: proyectos, tips, testimonios"),("AEO \u2014 appear when AI recommends local contractors","AEO \u2014 aparece cuando la IA recomienda contratistas locales"),("NWM CRM for estimate follow-up automations","NWM CRM para automatizaciones de seguimiento de presupuestos"),("Monthly strategy note","Nota de estrategia mensual")],
    "growth": [("Everything in AEO Starter","Todo en AEO Starter"),("Google Local Service Ads + Meta retargeting","Google Local Service Ads + retargeting en Meta"),("Automated estimate follow-up &amp; review requests","Seguimiento automatizado de presupuestos y solicitud de rese\u00f1as"),("Seasonal promotion campaigns","Campa\u00f1as de promoci\u00f3n estacional"),("AI SDR \u2014 responds to leads 24/7, books estimates","SDR de IA \u2014 responde leads 24/7, agenda presupuestos")],
    "scale": [("Everything in CMO Growth","Todo en CMO Growth"),("16 Reels/mo \u2014 project before/afters, team spotlights","16 Reels/mes \u2014 antes/despu\u00e9s de proyectos, spotlights del equipo"),("Custom AI quote assistant for your website","Asistente de cotizaci\u00f3n IA personalizado para tu sitio web"),("White-glove onboarding + dedicated strategist","Incorporaci\u00f3n premium + estratega dedicado"),("Priority support + daily Slack access","Soporte prioritario + acceso diario a Slack")],
    "cta_en": "contractors, plumbers, electricians &amp; home service pros", "cta_es": "contratistas, plomeros, electricistas y profesionales del hogar",
    "subcats": [
      {"slug":"contractors","emoji":"&#128296;","name_en":"Contractors","name_es":"Contratistas","desc_en":"More jobs, fewer slow weeks","desc_es":"M\u00e1s trabajos, menos semanas lentas"},
      {"slug":"plumbers","emoji":"&#128295;","name_en":"Plumbers","name_es":"Plomeros","desc_en":"First call every time","desc_es":"La primera llamada cada vez"},
      {"slug":"landscaping","emoji":"&#127807;","name_en":"Landscaping","name_es":"Landscaping","desc_en":"Fill your route year-round","desc_es":"Llena tu ruta todo el a\u00f1o"},
    ],
  },
  {
    "slug": "smb", "folder": "smb", "emoji": "&#128200;",
    "title": "AI Marketing for Small &amp; Medium Businesses",
    "meta_desc": "Stop wasting budget on agencies that deliver reports, not results. AI-powered fractional CMO for SMBs — real marketing execution from $249/mo.",
    "eyebrow_en": "Small &amp; Medium Business", "eyebrow_es": "Pequeñas y Medianas Empresas",
    "h1_line1_en": "Compete With Bigger Brands.", "h1_line1_es": "Compite Con Marcas Más Grandes.",
    "h1_hl_en": "On a Fraction of Their Budget.", "h1_hl_es": "Con Una Fracción de Su Presupuesto.",
    "sub_en": "Large companies have full marketing teams. Now you do too — powered by AI, led by an experienced CMO, for a monthly retainer that fits your budget.",
    "sub_es": "Las grandes empresas tienen equipos de marketing completos. Ahora tú también — potenciado por IA, liderado por un CMO con experiencia, por un retainer mensual que se ajusta a tu presupuesto.",
    "pain_label_en": "The SMB marketing problem", "pain_label_es": "El problema de marketing en PYMEs",
    "section_title_en": "Why most small &amp; medium businesses<br>struggle to grow with marketing",
    "section_title_es": "Por qué la mayoría de PYMEs<br>lucha para crecer con marketing",
    "pains": [
      ("Agencies that bill hours, not results", "Agencias que cobran horas, no resultados",
       "Most agencies send monthly reports and quarterly reviews. We execute — content, ads, automation, AEO — and you see the results in your pipeline.",
       "La mayoría de las agencias envían informes mensuales y revisiones trimestrales. Nosotros ejecutamos — contenido, anuncios, automatización, AEO — y ves los resultados en tu pipeline."),
      ("Invisible when AI recommends vendors", "Invisible cuando la IA recomienda proveedores",
       "When a local buyer asks Claude or ChatGPT for the best provider in your category, your competitor shows up — not you. We fix that with systematic AEO.",
       "Cuando un comprador local le pregunta a Claude o ChatGPT por el mejor proveedor en tu categoría, aparece tu competidor — no tú. Lo arreglamos con AEO sistemático."),
      ("No time to do marketing yourself", "Sin tiempo para hacer marketing tú mismo",
       "You’re running the business. We run your entire marketing function — strategy, execution, reporting — so you can focus on delivery.",
       "Tú diriges el negocio. Nosotros gestionamos toda tu función de marketing — estrategia, ejecución, reportes — para que puedas enfocarte en la entrega."),
    ],
    "results": ["+58% inbound leads", "3.1x ROAS on paid", "Top 5 AI citation locally"],
    "lite": [("Local SEO + Google My Business management","SEO local + gestión de Google My Business"),("Monthly blog + social content calendar","Calendario mensual de blog + contenido social"),("AEO strategy — be cited by Claude &amp; ChatGPT","Estrategia AEO — sé citado por Claude y ChatGPT"),("NWM CRM for lead follow-up automations","NWM CRM para automatizaciones de seguimiento de leads"),("Monthly strategy call","Llamada de estrategia mensual")],
    "growth": [("Everything in AEO Starter","Todo en AEO Starter"),("Google + Meta paid ad campaigns","Campañas de anuncios pagados en Google + Meta"),("Automated lead nurture sequences","Secuencias automatizadas de nurture de leads"),("Email marketing to your contact list","Email marketing a tu lista de contactos"),("AI SDR for lead qualification &amp; booking","SDR de IA para calificación de leads y agendamiento")],
    "scale": [("Everything in CMO Growth","Todo en CMO Growth"),("16 Reels/mo — brand stories, team, behind-the-scenes","16 Reels/mes — historias de marca, equipo, behind-the-scenes"),("Custom AI assistant for your website","Asistente de IA personalizado para tu sitio web"),("White-glove onboarding + dedicated strategist","Incorporación premium + estratega dedicado"),("Priority support + daily Slack access","Soporte prioritario + acceso diario a Slack")],
    "cta_en": "your business", "cta_es": "tu negocio",
    "subcats": [
      {"slug":"retail","emoji":"&#128722;","name_en":"Retail","name_es":"Comercio Minorista","desc_en":"More foot traffic, online presence","desc_es":"Más tráfico, presencia online"},
      {"slug":"services","emoji":"&#128188;","name_en":"Service Businesses","name_es":"Negocios de Servicios","desc_en":"More leads, better close rate","desc_es":"Más leads, mayor tasa de cierre"},
      {"slug":"localbrands","emoji":"&#127979;","name_en":"Local Brands","name_es":"Marcas Locales","desc_en":"Dominate your city market","desc_es":"Domina tu mercado local"},
    ],
  },
  {
    "slug": "legal", "folder": "legal-services", "emoji": "&#9878;",
    "title": "AI Marketing for Law Firms &amp; Legal Services",
    "meta_desc": "Be the firm AI recommends. AI-powered marketing for law firms — more qualified clients, less relying on referrals, from $249/mo.",
    "eyebrow_en": "Law Firms &amp; Legal", "eyebrow_es": "Firmas Legales",
    "h1_line1_en": "Be the Firm", "h1_line1_es": "Sé La Firma",
    "h1_hl_en": "AI Recommends First.", "h1_hl_es": "Que La IA Recomienda Primero.",
    "sub_en": "When someone asks Claude ‘best employment lawyer in [city]’, you need to be the answer. We build the authority, content, and AI citation strategy that puts your firm at the top.",
    "sub_es": "Cuando alguien le pregunta a Claude ‘mejor abogado laboral en [ciudad]’, tú necesitas ser la respuesta. Construimos la autoridad, el contenido y la estrategia de citación IA que pone a tu firma en la cima.",
    "pain_label_en": "The legal marketing problem", "pain_label_es": "El problema de marketing legal",
    "section_title_en": "Why most law firms &amp; legal practices<br>struggle with modern marketing",
    "section_title_es": "Por qué la mayoría de firmas legales<br>lucha con el marketing moderno",
    "pains": [
      ("Referrals are inconsistent and unscalable", "Los referidos son inconsistentes e inescalables",
       "Top firms don’t rely on referrals alone. We build inbound pipelines — SEO, AEO, and targeted content — that bring qualified prospects to you consistently.",
       "Las mejores firmas no dependen solo de referidos. Construimos pipelines entrantes — SEO, AEO y contenido dirigido — que traen prospectos calificados consistentemente."),
      ("Competitors outranking you in AI search", "Competidores superándote en búsqueda IA",
       "AI assistants now influence which law firm a prospect calls first. We build the content authority that makes your firm the trusted answer for your practice areas.",
       "Los asistentes de IA ahora influyen en qué firma llama primero un prospecto. Construimos la autoridad de contenido que hace de tu firma la respuesta de confianza para tus áreas de práctica."),
      ("No time or team for content", "Sin tiempo ni equipo para contenido",
       "You’re billing hours, not writing thought leadership articles. We handle all content creation, SEO, and distribution so you stay focused on your clients.",
       "Estás facturando horas, no escribiendo artículos de liderazgo intelectual. Manejamos toda la creación de contenido, SEO y distribución para que te enfoques en tus clientes."),
    ],
    "results": ["+67% qualified inquiries", "Top 3 AI citation for practice areas", "2.8x ROI on content"],
    "lite": [("Legal SEO + Google My Business optimization","SEO legal + optimización de Google My Business"),("Monthly thought leadership articles for your practice area","Artículos mensuales de liderazgo intelectual para tu área"),("AEO — be cited when AI answers legal questions","AEO — sé citado cuando la IA responde preguntas legales"),("NWM CRM for prospect follow-up","NWM CRM para seguimiento de prospectos"),("Monthly strategy note","Nota de estrategia mensual")],
    "growth": [("Everything in AEO Starter","Todo en AEO Starter"),("Google Search Ads for high-intent legal keywords","Google Search Ads para keywords legales de alta intención"),("Retargeting campaigns for site visitors","Campañas de retargeting para visitantes del sitio"),("Email nurture for prospects in consideration","Email nurture para prospectos en consideración"),("AI SDR for initial inquiry screening","SDR de IA para tamizaje inicial de consultas")],
    "scale": [("Everything in CMO Growth","Todo en CMO Growth"),("16 Reels/mo — legal tips, FAQs, attorney profiles","16 Reels/mes — tips legales, FAQs, perfiles de abogados"),("Custom AI intake assistant for your firm","Asistente de IA personalizado para tu firma"),("White-glove onboarding + dedicated strategist","Incorporación premium + estratega dedicado"),("Priority support + daily Slack access","Soporte prioritario + acceso diario a Slack")],
    "cta_en": "your law firm", "cta_es": "tu firma legal",
    "subcats": [
      {"slug":"familylaw","emoji":"&#128106;","name_en":"Family Law","name_es":"Derecho de Familia","desc_en":"Compassionate, qualified leads","desc_es":"Leads calificados y empáticos"},
      {"slug":"corporatelaw","emoji":"&#127962;","name_en":"Corporate Law","name_es":"Derecho Corporativo","desc_en":"B2B authority, pipeline growth","desc_es":"Autoridad B2B, crecimiento de pipeline"},
      {"slug":"immigration","emoji":"&#9992;","name_en":"Immigration Law","name_es":"Derecho Migratorio","desc_en":"Trusted resource, more consults","desc_es":"Recurso de confianza, más consultas"},
    ],
  },
  {
    "slug": "local", "folder": "local-services", "emoji": "&#127979;",
    "title": "AI Marketing for Local Specialist Services",
    "meta_desc": "Break through the word-of-mouth ceiling. AI marketing for local specialists — dominate your city, get found by AI, grow from $249/mo.",
    "eyebrow_en": "Local Specialist Services", "eyebrow_es": "Servicios Especialistas Locales",
    "h1_line1_en": "Own Your City.", "h1_line1_es": "Domina Tu Ciudad.",
    "h1_hl_en": "Break the Word-of-Mouth Ceiling.", "h1_hl_es": "Rompe el Techo del Boca a Boca.",
    "sub_en": "Word of mouth brought you this far. AI-powered local marketing will take you to the next level — more leads, better reviews, and the #1 spot when locals search for your specialty.",
    "sub_es": "El boca a boca te trajo hasta aquí. El marketing local potenciado por IA te llevará al siguiente nivel — más leads, mejores reseñas y el puesto número 1 cuando los locales busquen tu especialidad.",
    "pain_label_en": "The local specialist marketing problem", "pain_label_es": "El problema de marketing para especialistas locales",
    "section_title_en": "Why most local specialists<br>struggle to scale beyond referrals",
    "section_title_es": "Por qué la mayoría de especialistas locales<br>lucha para escalar más allá de los referidos",
    "pains": [
      ("Invisible in local AI search", "Invisible en la búsqueda local IA",
       "Locals ask Claude and ChatGPT for recommendations before Googling. If AI doesn’t know your business exists, you’re not in the consideration set.",
       "Los locales le preguntan a Claude y ChatGPT antes de buscar en Google. Si la IA no sabe que tu negocio existe, no estás en el conjunto de consideración."),
      ("Stuck at word-of-mouth growth", "Estancado en el crecimiento boca a boca",
       "Referrals are great but unpredictable. We build the digital presence and paid campaigns that generate a steady, predictable flow of new clients.",
       "Los referidos son geniales pero impredecibles. Construimos la presencia digital y las campañas pagadas que generan un flujo constante y predecible de nuevos clientes."),
      ("Hard to stand out from generic competitors", "Difícil destacarse de competidores genéricos",
       "We build your niche authority — content, reviews, local citations — so you’re the obvious expert choice in your specialty, not just another option.",
       "Construimos tu autoridad de nicho — contenido, reseñas, citaciones locales — para que seas la opción experta obvia en tu especialidad, no solo otra alternativa."),
    ],
    "results": ["+49% new client inquiries", "Top local AI recommendation", "4.8&#9733; avg review score"],
    "lite": [("Local SEO + Google My Business optimization","SEO local + optimización de Google My Business"),("Monthly niche-specific content calendar","Calendario de contenido mensual específico al nicho"),("AEO — be the local AI recommendation","AEO — sé la recomendación local de IA"),("NWM CRM for client follow-up &amp; retention","NWM CRM para seguimiento y retención de clientes"),("Monthly strategy note","Nota de estrategia mensual")],
    "growth": [("Everything in AEO Starter","Todo en AEO Starter"),("Google Local Ads + Meta local awareness campaigns","Google Local Ads + campañas de awareness local en Meta"),("Automated review generation sequences","Secuencias automatizadas de generación de reseñas"),("Referral reward program automation","Automatización de programa de recompensas por referidos"),("AI SDR for lead qualification &amp; booking","SDR de IA para calificación de leads y agendamiento")],
    "scale": [("Everything in CMO Growth","Todo en CMO Growth"),("16 Reels/mo — work showcases, client stories, tips","16 Reels/mes — muestras de trabajo, historias de clientes, tips"),("Custom AI assistant for your website","Asistente de IA personalizado para tu sitio web"),("White-glove onboarding + dedicated strategist","Incorporación premium + estratega dedicado"),("Priority support + daily Slack access","Soporte prioritario + acceso diario a Slack")],
    "cta_en": "your local specialist business", "cta_es": "tu negocio especialista local",
    "subcats": [
      {"slug":"photography","emoji":"&#128247;","name_en":"Photography","name_es":"Fotografía","desc_en":"Fully booked, premium rates","desc_es":"Completamente reservado, tarifas premium"},
      {"slug":"coaching","emoji":"&#127919;","name_en":"Coaches &amp; Consultants","name_es":"Coaches y Consultores","desc_en":"Authority-driven lead gen","desc_es":"Generación de leads basada en autoridad"},
      {"slug":"trades","emoji":"&#128296;","name_en":"Skilled Trades","name_es":"Oficios Especializados","desc_en":"More jobs, your own leads","desc_es":"Más trabajos, tus propios leads"},
    ],
  },
  {
    "slug": "auto", "folder": "automotive", "emoji": "&#128664;",
    "title": "AI Marketing for Automotive Businesses",
    "meta_desc": "Fill your service bays and showroom. AI marketing for dealerships, auto repair shops, and detailers — from $249/mo.",
    "eyebrow_en": "Automotive", "eyebrow_es": "Automotriz",
    "h1_line1_en": "Fill Your Bays.", "h1_line1_es": "Llena Tus Bahías.",
    "h1_hl_en": "Capture Every Lead 24/7.", "h1_hl_es": "Captura Cada Lead 24/7.",
    "sub_en": "Customers research their next car or repair shop on Google and AI before calling anyone. We make sure your business is what they find — and that you respond before the competition.",
    "sub_es": "Los clientes investigan su próximo auto o taller en Google e IA antes de llamar a alguien. Nos aseguramos de que tu negocio sea lo que encuentran — y que respondas antes que la competencia.",
    "pain_label_en": "The automotive marketing problem", "pain_label_es": "El problema de marketing automotriz",
    "section_title_en": "Why most dealerships &amp; auto service businesses<br>struggle with marketing",
    "section_title_es": "Por qué la mayoría de concesionarios y talleres<br>lucha con el marketing",
    "pains": [
      ("Losing leads to faster-responding competitors", "Perdiendo leads ante competidores que responden más rápido",
       "Car buyers and service customers move fast. Our AI SDR responds to every inquiry in under 2 minutes, qualifies the lead, and books the appointment — 24/7.",
       "Los compradores de autos y clientes de servicio se mueven rápido. Nuestro SDR de IA responde a cada consulta en menos de 2 minutos, califica el lead y agenda la cita — las 24/7."),
      ("Invisible in AI-assisted research", "Invisible en la investigación asistida por IA",
       "Buyers ask Claude and ChatGPT before visiting any lot or shop. We build the content and citation authority that puts your business in every AI-generated recommendation.",
       "Los compradores preguntan a Claude y ChatGPT antes de visitar cualquier concesionario o taller. Construimos la autoridad de contenido y citación que pone tu negocio en cada recomendación generada por IA."),
      ("Ad spend with no clear ROI", "Gasto en publicidad sin ROI claro",
       "Running ads without tracking which campaigns drive real appointments is burning money. We build attribution and reporting so you know exactly what’s working.",
       "Ejecutar anuncios sin rastrear qué campañas generan citas reales es quemar dinero. Construimos atribución y reportes para que sepas exactamente qué funciona."),
    ],
    "results": ["+54% service appointments", "2-min AI SDR response", "+38% test drive bookings"],
    "lite": [("Local SEO + Google My Business for your dealership/shop","SEO local + Google My Business para tu concesionario/taller"),("Monthly content: inventory features, tips, promotions","Contenido mensual: inventario, tips, promociones"),("AEO — appear when AI recommends local auto services","AEO — aparece cuando la IA recomienda servicios automotrices locales"),("NWM CRM for service reminder automations","NWM CRM para automatizaciones de recordatorio de servicio"),("Monthly strategy note","Nota de estrategia mensual")],
    "growth": [("Everything in AEO Starter","Todo en AEO Starter"),("Google + Meta campaigns for inventory &amp; service offers","Campañas en Google + Meta para inventario y ofertas de servicio"),("Automated service reminder &amp; review request sequences","Secuencias automatizadas de recordatorio de servicio y solicitud de reseñas"),("Conquest campaigns targeting competitor customers","Campañas de conquista dirigidas a clientes de la competencia"),("AI SDR for sales &amp; service lead qualification","SDR de IA para calificación de leads de ventas y servicio")],
    "scale": [("Everything in CMO Growth","Todo en CMO Growth"),("16 Reels/mo — inventory tours, service tips, customer stories","16 Reels/mes — tours de inventario, tips de servicio, historias de clientes"),("Custom AI sales &amp; service assistant for your site","Asistente de IA de ventas y servicio personalizado para tu sitio"),("White-glove onboarding + dedicated strategist","Incorporación premium + estratega dedicado"),("Priority support + daily Slack access","Soporte prioritario + acceso diario a Slack")],
    "cta_en": "your automotive business", "cta_es": "tu negocio automotriz",
    "subcats": [
      {"slug":"dealerships","emoji":"&#128665;","name_en":"Dealerships","name_es":"Concesionarios","desc_en":"More test drives, faster closings","desc_es":"Más pruebas de manejo, cierres más rápidos"},
      {"slug":"autorepair","emoji":"&#128295;","name_en":"Auto Repair Shops","name_es":"Talleres Mecánicos","desc_en":"Full bays, loyal customers","desc_es":"Bahías llenas, clientes leales"},
      {"slug":"detailing","emoji":"&#10024;","name_en":"Detailing &amp; Wash","name_es":"Detailing y Lavado","desc_en":"Recurring bookings on autopilot","desc_es":"Reservas recurrentes en piloto automático"},
    ],
  },
  {
    "slug": "education", "folder": "education", "emoji": "&#127979;",
    "title": "AI Marketing for Education &amp; Training",
    "meta_desc": "Fill every cohort. AI marketing for academies, tutoring centers, and training providers — more enrollments, less ad spend from $249/mo.",
    "eyebrow_en": "Education &amp; Training", "eyebrow_es": "Educación y Formación",
    "h1_line1_en": "Fill Every Cohort.", "h1_line1_es": "Llena Cada Cohorte.",
    "h1_hl_en": "Cut Your Cost Per Enrollment.", "h1_hl_es": "Reduce Tu Costo Por Matrícula.",
    "sub_en": "Parents and students ask AI assistants which academy or program is best before they ever visit your site. We build the authority and lead funnel that makes you their first choice.",
    "sub_es": "Los padres y estudiantes preguntan a asistentes de IA qué academia o programa es mejor antes de visitar tu sitio. Construimos la autoridad y el embudo de leads que te convierte en su primera opción.",
    "pain_label_en": "The education marketing problem", "pain_label_es": "El problema de marketing educativo",
    "section_title_en": "Why most academies, tutoring centers &amp; training providers<br>struggle with enrollment marketing",
    "section_title_es": "Por qué la mayoría de academias, centros de tutoring y proveedores de formación<br>lucha con el marketing de matrículas",
    "pains": [
      ("Losing enrollments to AI-cited competitors", "Perdiendo matrículas ante competidores citados por IA",
       "When a parent asks Claude ‘best math tutor in [city]’, your competitor shows up. We build the content and citations that make you the trusted recommendation.",
       "Cuando un padre le pregunta a Claude ‘mejor tutor de matemáticas en [ciudad]’, aparece tu competidor. Construimos el contenido y las citaciones que te hacen la recomendación de confianza."),
      ("Empty seats in off-peak months", "Asientos vacíos en los meses de temporada baja",
       "Enrollment spikes in September then flatlines. We build year-round marketing engines — content, ads, email nurture — that keep your pipeline full in every season.",
       "Las matrículas suben en septiembre y luego se estancan. Construimos motores de marketing durante todo el año — contenido, anuncios, nurture por email — que mantienen tu pipeline lleno en cada temporada."),
      ("No system to nurture inquiries to enrollments", "Sin sistema para convertir consultas en matrículas",
       "Most academies lose leads because there’s no follow-up system. We build automated nurture sequences that guide prospects from first inquiry to enrollment.",
       "La mayoría de las academias pierden leads porque no hay sistema de seguimiento. Construimos secuencias de nurture automatizadas que guían a los prospectos desde la primera consulta hasta la matrícula."),
    ],
    "results": ["+46% enrollment rate", "-38% cost per enrollment", "Top local AI education pick"],
    "lite": [("Local SEO + Google My Business for your institution","SEO local + Google My Business para tu institución"),("Monthly educational content (blog, tips, FAQs)","Contenido educativo mensual (blog, tips, FAQs)"),("AEO — be recommended by AI for your programs","AEO — sé recomendado por IA para tus programas"),("NWM CRM for enrollment follow-up automations","NWM CRM para automatizaciones de seguimiento de matrículas"),("Monthly strategy note","Nota de estrategia mensual")],
    "growth": [("Everything in AEO Starter","Todo en AEO Starter"),("Google + Meta ads targeting parents &amp; students","Anuncios en Google + Meta dirigidos a padres y estudiantes"),("Automated enrollment funnel sequences","Secuencias automatizadas del embudo de matrículas"),("Open house &amp; webinar promotion campaigns","Campañas de promoción de open house y webinars"),("AI SDR for inquiry qualification &amp; enrollment booking","SDR de IA para calificación de consultas y agendamiento de matrículas")],
    "scale": [("Everything in CMO Growth","Todo en CMO Growth"),("16 Reels/mo — student success stories, program previews","16 Reels/mes — historias de éxito de estudiantes, previews de programas"),("Custom AI enrollment assistant for your site","Asistente de matrìula IA personalizado para tu sitio"),("White-glove onboarding + dedicated strategist","Incorporación premium + estratega dedicado"),("Priority support + daily Slack access","Soporte prioritario + acceso diario a Slack")],
    "cta_en": "your academy &amp; training programs", "cta_es": "tu academia y programas de formación",
    "subcats": [
      {"slug":"tutoring","emoji":"&#128218;","name_en":"Tutoring Centers","name_es":"Centros de Tutoring","desc_en":"Full roster, fewer slow months","desc_es":"Roster lleno, menos meses lentos"},
      {"slug":"vocational","emoji":"&#127891;","name_en":"Vocational Training","name_es":"Formación Vocacional","desc_en":"Higher enrollment, lower drop-off","desc_es":"Mayor matrícula, menor abandono"},
      {"slug":"onlinecourses","emoji":"&#128187;","name_en":"Online Courses","name_es":"Cursos Online","desc_en":"Global reach, recurring revenue","desc_es":"Alcance global, ingresos recurrentes"},
    ],
  },
  {
    "slug": "events", "folder": "events-weddings", "emoji": "&#127881;",
    "title": "AI Marketing for Events &amp; Weddings",
    "meta_desc": "Get on every shortlist. AI marketing for event planners, wedding venues, and coordinators — more high-value bookings from $249/mo.",
    "eyebrow_en": "Events &amp; Weddings", "eyebrow_es": "Eventos y Bodas",
    "h1_line1_en": "Get on Every Shortlist.", "h1_line1_es": "Entra en Cada Lista Corta.",
    "h1_hl_en": "Book High-Value Events.", "h1_hl_es": "Reserva Eventos de Alto Valor.",
    "sub_en": "Couples and event organizers start their venue &amp; planner search with AI assistants and Instagram. We build the presence that puts you on every shortlist — before they ever reach out.",
    "sub_es": "Las parejas y organizadores empiezan su búsqueda de venue y planner con asistentes IA e Instagram. Construimos la presencia que te pone en cada lista corta — antes de que contacten a nadie.",
    "pain_label_en": "The events &amp; weddings marketing problem", "pain_label_es": "El problema de marketing en eventos y bodas",
    "section_title_en": "Why most event venues &amp; wedding planners<br>struggle to fill their calendar",
    "section_title_es": "Por qué la mayoría de venues y planners de bodas<br>lucha para llenar su calendario",
    "pains": [
      ("Getting discovered too late in the planning process", "Ser descubierto demasiado tarde en el proceso de planificación",
       "Couples shortlist venues 12–18 months in advance. If you’re not visible in early AI and Instagram research, you’re never in the running. We fix your early-funnel presence.",
       "Las parejas hacen su lista corta de venues con 12–18 meses de anticipación. Si no eres visible en la investigación temprana de IA e Instagram, nunca estás en carrera. Arreglamos tu presencia en la parte superior del embudo."),
      ("Premium service, generic online presence", "Servicio premium, presencia online genérica",
       "Your venue and planning are exceptional — but your website and social presence don’t convey that. We elevate your digital brand to match the quality you deliver.",
       "Tu venue y planificación son excepcionales — pero tu sitio web y presencia social no lo transmiten. Elevamos tu marca digital para que coincida con la calidad que entregas."),
      ("No system for inquiry follow-up", "Sin sistema para seguimiento de consultas",
       "Most event businesses lose bookings because inquiries sit unanswered for hours. Our AI SDR responds instantly, qualifies the event, and books the site visit — automatically.",
       "La mayoría de los negocios de eventos pierden reservas porque las consultas quedan sin respuesta durante horas. Nuestro SDR de IA responde instantáneamente, califica el evento y agenda la visita al sitio — automáticamente."),
    ],
    "results": ["+52% qualified inquiries", "+34% booking conversion", "Top AI pick for weddings locally"],
    "lite": [("Local SEO + Google My Business for your venue","SEO local + Google My Business para tu venue"),("Monthly content: real events, venues, testimonials","Contenido mensual: eventos reales, venues, testimonios"),("AEO — be recommended when AI suggests event venues","AEO — sé recomendado cuando la IA sugiere venues de eventos"),("NWM CRM for inquiry &amp; booking follow-up","NWM CRM para seguimiento de consultas y reservas"),("Monthly strategy note","Nota de estrategia mensual")],
    "growth": [("Everything in AEO Starter","Todo en AEO Starter"),("Meta (Instagram + Facebook) visual showcase campaigns","Campañas visuales de showcase en Meta (Instagram + Facebook)"),("Automated inquiry response &amp; site visit booking","Respuesta automatizada de consultas y agendamiento de visitas"),("Pinterest + Google search campaigns for weddings","Campañas en Pinterest + Google Search para bodas"),("AI SDR for event inquiry qualification &amp; booking","SDR de IA para calificación de consultas y agendamiento")],
    "scale": [("Everything in CMO Growth","Todo en CMO Growth"),("16 Reels/mo — real events, venue tours, couple stories","16 Reels/mes — eventos reales, tours de venue, historias de parejas"),("Custom AI venue concierge for your site","Concierge de IA personalizado para tu sitio"),("White-glove onboarding + dedicated strategist","Incorporación premium + estratega dedicado"),("Priority support + daily Slack access","Soporte prioritario + acceso diario a Slack")],
    "cta_en": "your events &amp; wedding business", "cta_es": "tu negocio de eventos y bodas",
    "subcats": [
      {"slug":"weddingvenues","emoji":"&#128141;","name_en":"Wedding Venues","name_es":"Venues de Bodas","desc_en":"Fully booked 18 months out","desc_es":"Completamente reservado 18 meses antes"},
      {"slug":"eventplanners","emoji":"&#128203;","name_en":"Event Planners","name_es":"Planificadores de Eventos","desc_en":"Premium clients, full calendar","desc_es":"Clientes premium, calendario lleno"},
      {"slug":"corporateevents","emoji":"&#127970;","name_en":"Corporate Events","name_es":"Eventos Corporativos","desc_en":"Repeat clients, bigger budgets","desc_es":"Clientes recurrentes, mayores presupuestos"},
    ],
  },
  {
    "slug": "finance", "folder": "finance", "emoji": "&#128200;",
    "title": "AI Marketing for Financial Services",
    "meta_desc": "Build trust at scale. AI marketing for financial advisors, accountants, and fintech businesses — qualified leads and AEO authority from $249/mo.",
    "eyebrow_en": "Financial Services", "eyebrow_es": "Servicios Financieros",
    "h1_line1_en": "Build Trust at Scale.", "h1_line1_es": "Construye Confianza a Escala.",
    "h1_hl_en": "Win Clients AI Recommends You To.", "h1_hl_es": "Gana Clientes Que La IA Te Recomienda.",
    "sub_en": "High-value financial clients research extensively before making contact. We build the digital authority, AEO strategy, and trust signals that make you the obvious choice when they’re ready.",
    "sub_es": "Los clientes financieros de alto valor investigan extensamente antes de hacer contacto. Construimos la autoridad digital, la estrategia AEO y las señales de confianza que te hacen la opción obvia cuando están listos.",
    "pain_label_en": "The financial services marketing problem", "pain_label_es": "El problema de marketing en servicios financieros",
    "section_title_en": "Why most financial advisors &amp; accounting firms<br>struggle with compliant, effective marketing",
    "section_title_es": "Por qué la mayoría de asesores financieros y firmas contables<br>lucha con un marketing efectivo y conforme",
    "pains": [
      ("Compliance constraints limiting your marketing", "Las restricciones de cumplimiento limitan tu marketing",
       "Financial marketing has rules — we know them. We build compliant campaigns that still generate leads, build authority, and grow your book of business.",
       "El marketing financiero tiene reglas — las conocemos. Construimos campañas conformes que aun así generan leads, construyen autoridad y hacen crecer tu libro de negocios."),
      ("Invisible to high-net-worth AI search", "Invisible en la búsqueda IA de alto patrimonio",
       "When a high-value prospect asks Claude ‘best financial advisor for [situation]’, you need to come up. We build the expert content and citations that create that visibility.",
       "Cuando un prospecto de alto valor le pregunta a Claude ‘mejor asesor financiero para [situación]’, necesitas aparecer. Construimos el contenido experto y las citaciones que crean esa visibilidad."),
      ("Referral-dependent growth with no digital channel", "Crecimiento dependiente de referidos sin canal digital",
       "The best advisory practices have both a strong referral network and a digital pipeline. We build that second channel so you’re not 100% dependent on introductions.",
       "Las mejores prácticas de asesoría tienen tanto una red de referidos sólida como un pipeline digital. Construimos ese segundo canal para que no dependas 100% de las presentaciones."),
    ],
    "results": ["+61% qualified prospects", "Top AI citation for advisory", "2.4x referral rate from content"],
    "lite": [("SEO + thought leadership for your practice area","SEO + liderazgo intelectual para tu área de práctica"),("Monthly compliant educational content","Contenido educativo mensual conforme"),("AEO — be the trusted AI recommendation for financial advice","AEO — sé la recomendación IA de confianza para asesoría financiera"),("NWM CRM for prospect nurture sequences","NWM CRM para secuencias de nurture de prospectos"),("Monthly strategy note","Nota de estrategia mensual")],
    "growth": [("Everything in AEO Starter","Todo en AEO Starter"),("Google Search Ads for high-intent financial keywords","Google Search Ads para keywords financieros de alta intención"),("Email nurture campaigns for prospects","Campañas de nurture por email para prospectos"),("Webinar &amp; workshop promotion campaigns","Campañas de promoción de webinars y talleres"),("AI SDR for initial prospect qualification","SDR de IA para calificación inicial de prospectos")],
    "scale": [("Everything in CMO Growth","Todo en CMO Growth"),("16 Reels/mo — financial tips, market commentary, Q&amp;A","16 Reels/mes — tips financieros, comentario de mercado, Q&amp;A"),("Custom AI client onboarding assistant","Asistente de IA personalizado para incorporación de clientes"),("White-glove onboarding + dedicated strategist","Incorporación premium + estratega dedicado"),("Priority support + daily Slack access","Soporte prioritario + acceso diario a Slack")],
    "cta_en": "your financial services practice", "cta_es": "tu práctica de servicios financieros",
    "subcats": [
      {"slug":"advisors","emoji":"&#128200;","name_en":"Financial Advisors","name_es":"Asesores Financieros","desc_en":"High-value clients, trusted authority","desc_es":"Clientes de alto valor, autoridad confiable"},
      {"slug":"accounting","emoji":"&#128203;","name_en":"Accounting &amp; Tax","name_es":"Contabilidad e Impuestos","desc_en":"Grow beyond tax season","desc_es":"Crece más allá de la temporada fiscal"},
      {"slug":"insurance","emoji":"&#127959;","name_en":"Insurance Brokers","name_es":"Corredores de Seguros","desc_en":"More policies, digital pipeline","desc_es":"Más pólizas, pipeline digital"},
    ],
  },
  {
    "slug": "wine", "folder": "wine-agriculture", "emoji": "&#127863;",
    "title": "AI Marketing for Wine &amp; Agriculture",
    "meta_desc": "Sell direct, keep the margin. AI marketing for wineries, vineyards, and agribusinesses — build DTC channels and AEO authority from $249/mo.",
    "eyebrow_en": "Wine &amp; Agriculture", "eyebrow_es": "Vino y Agricultura",
    "h1_line1_en": "Sell Direct.", "h1_line1_es": "Vende Directo.",
    "h1_hl_en": "Keep Your Margin.", "h1_hl_es": "Conserva Tu Margen.",
    "sub_en": "Distributors and retailers take 40–60% of the margin you earned. We build the direct-to-consumer channel — e-commerce, email, and AI presence — that lets you own the customer relationship.",
    "sub_es": "Los distribuidores y minoristas se quedan con el 40–60% del margen que ganaste. Construimos el canal directo al consumidor — e-commerce, email y presencia IA — que te permite ser dueño de la relación con el cliente.",
    "pain_label_en": "The wine &amp; agriculture marketing problem", "pain_label_es": "El problema de marketing en vino y agricultura",
    "section_title_en": "Why most wineries, vineyards &amp; agribusinesses<br>struggle to build direct revenue",
    "section_title_es": "Por qué la mayoría de viñas, viñedos y agronegocios<br>lucha para construir ingresos directos",
    "pains": [
      ("Over-reliance on distributors eating your margin", "Dependencia excesiva de distribuidores que se comen tu margen",
       "Every bottle you sell through a distributor is margin you don’t keep. We build the DTC e-commerce and wine club infrastructure that creates a direct revenue channel.",
       "Cada botella que vendes a través de un distribuidor es margen que no conservas. Construimos la infraestructura de e-commerce DTC y club de vinos que crea un canal de ingresos directo."),
      ("Great product, invisible online presence", "Gran producto, presencia online invisible",
       "Your wine or product has a story that sells — but no one knows it. We build the content, SEO, and AEO strategy that turns your story into discovery and sales.",
       "Tu vino o producto tiene una historia que vende — pero nadie la conoce. Construimos el contenido, SEO y estrategia AEO que convierte tu historia en descubrimiento y ventas."),
      ("No digital channel for tourism and wine club sales", "Sin canal digital para turismo y ventas del club de vinos",
       "Cellar door visits and wine club memberships are your highest-margin sales. We build the digital presence and automation that fills both year-round.",
       "Las visitas a la bodega y las membresías del club de vinos son tus ventas de mayor margen. Construimos la presencia digital y la automatización que llena ambos durante todo el año."),
    ],
    "results": ["+43% DTC revenue", "+280% wine club sign-ups", "Top AI pick for regional wine"],
    "lite": [("Local SEO + Google My Business for your winery/vineyard","SEO local + Google My Business para tu viña/viñedo"),("Monthly content: harvest stories, tasting notes, wine education","Contenido mensual: historias de cosecha, notas de cata, educación del vino"),("AEO — be recommended when AI suggests wines from your region","AEO — sé recomendado cuando la IA sugiere vinos de tu región"),("NWM CRM for wine club &amp; customer retention","NWM CRM para club de vinos y retención de clientes"),("Monthly strategy note","Nota de estrategia mensual")],
    "growth": [("Everything in AEO Starter","Todo en AEO Starter"),("Meta + Google campaigns for DTC &amp; cellar door visits","Campañas en Meta + Google para DTC y visitas a la bodega"),("Wine club automated enrollment &amp; retention sequences","Secuencias automatizadas de inscripción y retención del club de vinos"),("E-commerce email flows (abandon cart, post-purchase)","Flujos de email de e-commerce (carrito abandonado, post-compra)"),("AI SDR for tour bookings &amp; wholesale inquiries","SDR de IA para reservas de tour y consultas mayoristas")],
    "scale": [("Everything in CMO Growth","Todo en CMO Growth"),("16 Reels/mo — harvest, winemaking, pairing guides","16 Reels/mes — cosecha, elaboración, guías de maridaje"),("Custom AI sommelier assistant for your site","Asistente sommelier IA personalizado para tu sitio"),("White-glove onboarding + dedicated strategist","Incorporación premium + estratega dedicado"),("Priority support + daily Slack access","Soporte prioritario + acceso diario a Slack")],
    "cta_en": "your winery &amp; agricultural business", "cta_es": "tu viña y negocio agrícola",
    "subcats": [
      {"slug":"wineries","emoji":"&#127863;","name_en":"Wineries","name_es":"Viñas","desc_en":"DTC sales, full wine club","desc_es":"Ventas DTC, club de vinos lleno"},
      {"slug":"vineyards","emoji":"&#127807;","name_en":"Vineyards &amp; Estates","name_es":"Viñedos y Fundos","desc_en":"Cellar door visits, premium positioning","desc_es":"Visitas a bodega, posicionamiento premium"},
      {"slug":"agribusiness","emoji":"&#127807;","name_en":"Agribusiness","name_es":"Agronegocios","desc_en":"Direct channel, better margins","desc_es":"Canal directo, mejores márgenes"},
    ],
  },
  {
    "slug": "tech", "folder": "tech-saas", "emoji": "&#128187;",
    "title": "AI Marketing for Tech &amp; SaaS",
    "meta_desc": "Shorten your sales cycle with AI. Fractional CMO for tech startups and SaaS companies — pipeline generation, AEO, and product-led growth from $249/mo.",
    "eyebrow_en": "Tech &amp; SaaS", "eyebrow_es": "Tech y SaaS",
    "h1_line1_en": "Shorten Your Sales Cycle", "h1_line1_es": "Acorta Tu Ciclo de Ventas",
    "h1_hl_en": "With AI-Powered Marketing.", "h1_hl_es": "Con Marketing Potenciado por IA.",
    "sub_en": "Your product is great but your pipeline is lumpy. We build the demand gen engine \u2014 content, AEO, paid, and AI outbound \u2014 that fills the funnel and accelerates deals.",
    "sub_es": "Tu producto es excelente pero tu pipeline es irregular. Construimos el motor de generaci\u00f3n de demanda \u2014 contenido, AEO, pagado y outbound con IA \u2014 que llena el embudo y acelera los deals.",
    "pain_label_en": "The tech &amp; SaaS marketing problem", "pain_label_es": "El problema de marketing en Tech y SaaS",
    "section_title_en": "Why most tech startups &amp; SaaS companies<br>struggle with marketing",
    "section_title_es": "Por qu\u00e9 la mayor\u00eda de startups tech y empresas SaaS<br>lucha con el marketing",
    "pains": [
      ("CAC too high, pipeline too thin", "CAC demasiado alto, pipeline demasiado delgado",
       "Random acts of content and one-off campaigns don\u2019t compound. We build a systematic demand gen engine that improves month over month.",
       "Los actos aleatorios de contenido y campa\u00f1as \u00fanicas no se acumulan. Construimos un motor de demanda sistem\u00e1tico que mejora mes a mes."),
      ("Invisible in AI-generated vendor research", "Invisible en la investigaci\u00f3n de proveedores por IA",
       "B2B buyers use Claude and ChatGPT for vendor research before they ever visit your site. If AI doesn\u2019t know your product, you\u2019re not in the deal.",
       "Los compradores B2B usan Claude y ChatGPT para investigar proveedores antes de visitar tu sitio. Si la IA no conoce tu producto, no est\u00e1s en el deal."),
      ("Long sales cycles draining resources", "Los largos ciclos de ventas drenan recursos",
       "We build content and automation that educate prospects and handle objections before your sales team touches them \u2014 compressing the cycle.",
       "Construimos contenido y automatizaci\u00f3n que educa a los prospectos y maneja objeciones antes de que tu equipo de ventas los toque \u2014 comprimiendo el ciclo."),
    ],
    "results": ["-35% sales cycle length", "Top 3 AI citation for use cases", "2.9x pipeline from content"],
    "lite": [("SEO + thought leadership content strategy","SEO + estrategia de contenido de liderazgo intelectual"),("Monthly technical blog posts &amp; comparison content","Posts t\u00e9cnicos mensuales y contenido de comparaci\u00f3n"),("AEO \u2014 be cited by Claude &amp; ChatGPT for your category","AEO \u2014 s\u00e9 citado por Claude y ChatGPT en tu categor\u00eda"),("NWM CRM for lead nurture sequences","NWM CRM para secuencias de nurture de leads"),("Monthly strategy note","Nota de estrategia mensual")],
    "growth": [("Everything in AEO Starter","Todo en AEO Starter"),("Google Search + LinkedIn paid campaigns","Campa\u00f1as pagadas en Google Search + LinkedIn"),("Email nurture sequences for trial &amp; demo leads","Secuencias de nurture por email para leads de prueba y demo"),("Competitor comparison &amp; battle card content","Contenido de comparaci\u00f3n y battle cards contra competidores"),("AI SDR for demo scheduling &amp; qualification","SDR de IA para agendar demos y calificaci\u00f3n")],
    "scale": [("Everything in CMO Growth","Todo en CMO Growth"),("16 Reels/mo \u2014 product demos, customer stories, explainers","16 Reels/mes \u2014 demos de producto, historias de clientes, explainers"),("Custom AI sales assistant for your site","Asistente de ventas IA personalizado para tu sitio"),("White-glove onboarding + dedicated strategist","Incorporaci\u00f3n premium + estratega dedicado"),("Priority support + daily Slack access","Soporte prioritario + acceso diario a Slack")],
    "cta_en": "tech startups &amp; SaaS companies", "cta_es": "startups tecnol\u00f3gicas y empresas SaaS",
    "subcats": [
      {"slug":"saas","emoji":"&#9729;","name_en":"SaaS Companies","name_es":"Empresas SaaS","desc_en":"More trials, shorter sales cycles","desc_es":"M\u00e1s trials, ciclos de venta m\u00e1s cortos"},
      {"slug":"startups","emoji":"&#128640;","name_en":"Tech Startups","name_es":"Startups Tech","desc_en":"Go to market fast","desc_es":"Sal al mercado r\u00e1pido"},
      {"slug":"agencies","emoji":"&#128226;","name_en":"Marketing Agencies","name_es":"Agencias de Marketing","desc_en":"White-label AI, better margins","desc_es":"IA white-label, mejores m\u00e1rgenes"},
    ],
  },
]

CSS = """
    .ind-hero{padding:120px 20px 60px;text-align:center;max-width:900px;margin:0 auto}
    .ind-hero .eyebrow{display:inline-block;background:var(--nwm-orange);color:#fff;padding:6px 16px;border-radius:var(--radius-pill);font-size:12px;font-weight:800;letter-spacing:.12em;text-transform:uppercase;margin-bottom:24px}
    .ind-hero h1{font-size:clamp(36px,6vw,64px);line-height:1.05;font-weight:800;margin-bottom:24px;font-family:var(--font-display)}
    .ind-hero h1 .hl{background:var(--gradient-text);-webkit-background-clip:text;background-clip:text;color:transparent}
    .ind-hero .sub{font-size:clamp(17px,2.5vw,21px);color:var(--text-secondary);max-width:680px;margin:0 auto 40px;line-height:1.6}
    .hero-ctas{display:flex;gap:14px;justify-content:center;flex-wrap:wrap}
    .btn-primary{background:var(--gradient-btn);color:#fff;padding:16px 32px;border-radius:var(--radius-pill);font-weight:700;font-size:16px;text-decoration:none;display:inline-block;transition:var(--transition)}
    .btn-primary:hover{transform:translateY(-2px);box-shadow:var(--shadow-glow)}
    .btn-ghost-white{background:transparent;border:2px solid rgba(255,255,255,.3);color:#fff;padding:14px 30px;border-radius:var(--radius-pill);font-weight:600;font-size:16px;text-decoration:none;display:inline-block;transition:var(--transition)}
    .btn-ghost-white:hover{border-color:var(--nwm-orange);color:var(--nwm-orange)}
    .results-bar{background:rgba(255,103,31,.08);border:1px solid rgba(255,103,31,.2);border-radius:var(--radius-md);max-width:800px;margin:0 auto 80px;padding:32px 20px;display:flex;justify-content:space-around;flex-wrap:wrap;gap:20px}
    .result-stat{text-align:center}
    .result-stat .n{font-size:36px;font-weight:900;background:var(--gradient-text);-webkit-background-clip:text;background-clip:text;color:transparent;line-height:1}
    .result-stat .l{font-size:12px;color:var(--text-muted);margin-top:4px;text-transform:uppercase;letter-spacing:.08em}
    .section{max-width:1100px;margin:0 auto;padding:80px 20px}
    .section-label{font-size:12px;font-weight:800;letter-spacing:.14em;text-transform:uppercase;color:var(--nwm-orange);margin-bottom:12px}
    .section-title{font-size:clamp(28px,4vw,42px);font-weight:800;font-family:var(--font-display);margin-bottom:48px;line-height:1.15}
    .subcats{display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:16px;margin-bottom:64px}
    .subcat-card{background:var(--bg-card);border:1px solid var(--border-glass);border-radius:var(--radius-md);padding:20px 24px;text-decoration:none;display:flex;align-items:center;gap:12px;transition:var(--transition)}
    .subcat-card:hover{border-color:var(--border-accent);transform:translateY(-2px)}
    .subcat-card .icon{font-size:24px}
    .subcat-card .info strong{display:block;color:#fff;font-size:15px;font-weight:700}
    .subcat-card .info span{color:var(--text-muted);font-size:13px}
    .pain-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(280px,1fr));gap:24px}
    .pain-card{background:var(--bg-card);border:1px solid var(--border-glass);border-radius:var(--radius-md);padding:28px;transition:var(--transition)}
    .pain-card:hover{border-color:var(--border-accent);transform:translateY(-3px)}
    .pain-card h3{font-size:18px;font-weight:700;margin-bottom:10px;color:#fff}
    .pain-card p{font-size:15px;color:var(--text-secondary);line-height:1.6}
    .pricing-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(300px,1fr));gap:24px}
    .price-card{background:var(--bg-card);border:1px solid var(--border-glass);border-radius:var(--radius-lg);padding:36px;position:relative;transition:var(--transition)}
    .price-card.featured{border-color:var(--nwm-orange);background:rgba(255,103,31,.06)}
    .price-card:hover{transform:translateY(-4px);box-shadow:var(--shadow-card)}
    .price-badge{position:absolute;top:-14px;left:50%;transform:translateX(-50%);background:var(--gradient-btn);color:#fff;padding:5px 18px;border-radius:var(--radius-pill);font-size:11px;font-weight:800;letter-spacing:.1em;text-transform:uppercase;white-space:nowrap}
    .price-tier{font-size:11px;font-weight:800;letter-spacing:.14em;text-transform:uppercase;color:var(--nwm-orange);margin-bottom:8px}
    .price-name{font-size:22px;font-weight:800;color:#fff;margin-bottom:6px;font-family:var(--font-display)}
    .price-desc{font-size:13px;color:var(--text-muted);margin-bottom:20px}
    .price-amount{font-size:52px;font-weight:900;color:#fff;line-height:1;margin-bottom:4px;font-family:var(--font-display)}
    .price-amount span{font-size:20px;font-weight:400;color:var(--text-muted)}
    .price-setup{font-size:13px;color:var(--text-muted);margin-bottom:24px}
    .price-features{list-style:none;padding:0;margin:0 0 32px;display:flex;flex-direction:column;gap:10px}
    .price-features li{font-size:14px;color:var(--text-secondary);padding-left:20px;position:relative;line-height:1.5}
    .price-features li::before{content:"\\2713";position:absolute;left:0;color:var(--nwm-orange);font-weight:700}
    .price-cta{display:block;text-align:center;padding:14px;border-radius:var(--radius-pill);font-weight:700;font-size:15px;text-decoration:none;transition:var(--transition)}
    .price-cta.solid{background:var(--gradient-btn);color:#fff}
    .price-cta.outline{border:2px solid var(--nwm-orange);color:var(--nwm-orange)}
    .price-cta:hover{transform:translateY(-1px);opacity:.9}
    .divider{border:none;border-top:1px solid var(--border-glass);margin:0}
    .final-cta-wrap{text-align:center;padding:100px 20px;max-width:700px;margin:0 auto}
    .final-cta-wrap h2{font-size:clamp(28px,4vw,44px);font-weight:800;font-family:var(--font-display);margin-bottom:20px}
    .final-cta-wrap p{font-size:18px;color:var(--text-secondary);margin-bottom:36px}
    footer{text-align:center;padding:40px 20px;color:var(--text-muted);font-size:13px;border-top:1px solid var(--border-glass)}
    footer a{color:var(--text-muted);text-decoration:none}
    footer a:hover{color:var(--nwm-orange)}
"""

def build_page(v):
    subcat_cards = ""
    for s in v["subcats"]:
        subcat_cards += f"""
        <a class="subcat-card" href="https://{s['slug']}.netwebmedia.com">
          <div class="icon">{s['emoji']}</div>
          <div class="info">
            <strong data-en="{s['name_en']}" data-es="{s['name_es']}">{s['name_en']}</strong>
            <span data-en="{s['desc_en']}" data-es="{s['desc_es']}">{s['desc_en']}</span>
          </div>
        </a>"""

    pain_cards = ""
    for te, ts, de, ds in v["pains"]:
        pain_cards += f"""
        <div class="pain-card">
          <h3 data-en="{te}" data-es="{ts}">{te}</h3>
          <p data-en="{de}" data-es="{ds}">{de}</p>
        </div>"""

    lite_lis  = "\n".join(f'            <li data-en="{e}" data-es="{s}">{e}</li>' for e, s in v["lite"])
    grow_lis  = "\n".join(f'            <li data-en="{e}" data-es="{s}">{e}</li>' for e, s in v["growth"])
    scale_lis = "\n".join(f'            <li data-en="{e}" data-es="{s}">{e}</li>' for e, s in v["scale"])
    r1, r2, r3 = v["results"]

    blog_slug = BLOG_SLUG_MAP.get(v["folder"], v["folder"])
    schema_type = SCHEMA_TYPE_MAP.get(v["folder"], "LocalBusiness")

    # FAQ section + FAQPage JSON-LD schema (extracted from live hub pages 2026-05-06)
    faq_qas = FAQ_DATA.get(v["folder"], [])
    faq_details_html = ""
    faq_schema_json = ""
    if faq_qas:
        details_items = []
        for q, a in faq_qas:
            q_h = q.replace('<', '&lt;').replace('>', '&gt;')
            a_h = a.replace('<', '&lt;').replace('>', '&gt;')
            details_items.append(
                f'      <details style="background:var(--surface-card);border:1px solid var(--border-glass);border-radius:12px;padding:18px 22px;margin-bottom:12px">\n'
                f'        <summary style="cursor:pointer;font-weight:700;color:var(--text-primary);font-size:15px;list-style:none">{q_h}</summary>\n'
                f'        <p style="margin:14px 0 0;color:var(--text-secondary);font-size:14px;line-height:1.6">{a_h}</p>\n'
                f'      </details>'
            )
        faq_details_html = (
            '  <hr class="divider">\n'
            '  <section style="padding:60px 20px;max-width:820px;margin:0 auto">\n'
            '    <p style="text-align:center;font-size:13px;font-weight:700;letter-spacing:.1em;text-transform:uppercase;color:var(--nwm-orange);margin-bottom:10px">FAQ</p>\n'
            f'    <h2 style="text-align:center;font-size:clamp(22px,3vw,34px);font-weight:800;margin-bottom:36px" data-en="Common questions" data-es="Preguntas frecuentes">Common questions</h2>\n'
            + '\n'.join(details_items)
            + '\n  </section>'
        )
        import json as _json
        faq_obj = {
            "@context": "https://schema.org",
            "@type": "FAQPage",
            "mainEntity": [
                {"@type": "Question", "name": q, "acceptedAnswer": {"@type": "Answer", "text": a}}
                for q, a in faq_qas
            ],
        }
        faq_schema_json = (
            '<script type="application/ld+json">'
            + _json.dumps(faq_obj, ensure_ascii=False)
            + '</script>'
        )

    resources_section = f"""  <hr class="divider">
  <section style="padding:60px 20px;max-width:1100px;margin:0 auto">
    <p style="text-align:center;font-size:13px;font-weight:700;letter-spacing:.1em;text-transform:uppercase;color:var(--nwm-orange);margin-bottom:10px" data-en="Resources" data-es="Recursos">Resources</p>
    <h2 style="text-align:center;font-size:clamp(22px,3vw,34px);font-weight:800;margin-bottom:36px" data-en="Guides for {v['eyebrow_en']}" data-es="Guías para {v['eyebrow_es']}">Guides for {v['eyebrow_en']}</h2>
    <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(280px,1fr));gap:24px">
      <a href="../../blog/{blog_slug}-aeo-strategy-2026.html" style="display:block;background:var(--surface-card);border:1px solid var(--border-glass);border-radius:16px;padding:28px;text-decoration:none;transition:border-color .2s" onmouseover="this.style.borderColor='var(--nwm-orange)'" onmouseout="this.style.borderColor='var(--border-glass)'">
        <p style="font-size:11px;font-weight:700;letter-spacing:.08em;text-transform:uppercase;color:var(--nwm-orange);margin:0 0 10px">AEO Strategy</p>
        <h3 style="font-size:17px;font-weight:700;color:var(--text-primary);margin:0 0 10px">AEO for {v['eyebrow_en']}: Get Cited by AI in 2026</h3>
        <p style="font-size:13px;color:var(--text-secondary);margin:0">How to structure your content so Claude, ChatGPT, and Perplexity recommend your business &rarr;</p>
      </a>
      <a href="../../blog/{blog_slug}-local-seo-vs-aeo.html" style="display:block;background:var(--surface-card);border:1px solid var(--border-glass);border-radius:16px;padding:28px;text-decoration:none;transition:border-color .2s" onmouseover="this.style.borderColor='var(--nwm-orange)'" onmouseout="this.style.borderColor='var(--border-glass)'">
        <p style="font-size:11px;font-weight:700;letter-spacing:.08em;text-transform:uppercase;color:var(--nwm-orange);margin:0 0 10px">Local SEO vs AEO</p>
        <h3 style="font-size:17px;font-weight:700;color:var(--text-primary);margin:0 0 10px">Local SEO vs AEO for {v['eyebrow_en']}: Which Drives More Leads?</h3>
        <p style="font-size:13px;color:var(--text-secondary);margin:0">The channel decision matrix for businesses choosing between Google Maps and AI search &rarr;</p>
      </a>
    </div>
  </section>"""

    return f"""<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>{v["title"]} | NetWebMedia</title>
  <meta name="description" content="{v["meta_desc"]}">
  <link rel="canonical" href="https://netwebmedia.com/industries/{v["folder"]}/">
  <link rel="alternate" hreflang="en" href="https://netwebmedia.com/industries/{v["folder"]}/">
  <link rel="alternate" hreflang="es" href="https://netwebmedia.com/industries/{v["folder"]}/?lang=es">
  <link rel="alternate" hreflang="x-default" href="https://netwebmedia.com/industries/{v["folder"]}/">
  <meta name="robots" content="index, follow, max-image-preview:large">
  <meta property="og:title" content="{v["title"]} | NetWebMedia">
  <meta property="og:description" content="{v["meta_desc"]}">
  <meta property="og:url" content="https://netwebmedia.com/industries/{v["folder"]}/">
  <meta property="og:type" content="website">
  <link rel="icon" type="image/svg+xml" href="https://netwebmedia.com/assets/nwm-logo.svg">
  <link rel="stylesheet" href="https://netwebmedia.com/css/styles.css">
  <style>{CSS}</style>
  <script type="application/ld+json">
  {{
    "@context": "https://schema.org",
    "@type": "{schema_type}",
    "name": "NetWebMedia",
    "url": "https://netwebmedia.com/industries/{v["folder"]}/",
    "description": "{v["meta_desc"]}",
    "areaServed": "US",
    "serviceType": "{v["eyebrow_en"]}"
  }}
  </script>
  {faq_schema_json}
</head>
<body>

{NAV}

<main>
  <div class="ind-hero">
    <div class="eyebrow" data-en="{v['eyebrow_en']}" data-es="{v['eyebrow_es']}">{v['emoji']} {v['eyebrow_en']}</div>
    <h1>
      <span data-en="{v['h1_line1_en']}" data-es="{v['h1_line1_es']}">{v['h1_line1_en']}</span><br>
      <span class="hl" data-en="{v['h1_hl_en']}" data-es="{v['h1_hl_es']}">{v['h1_hl_en']}</span>
    </h1>
    <p class="sub" data-en="{v['sub_en']}" data-es="{v['sub_es']}">{v['sub_en']}</p>
    <div class="hero-ctas">
      <a href="https://netwebmedia.com/contact.html" class="btn-primary" data-en="Free 48-Hour Written Audit &rarr;" data-es="Auditor&iacute;a Gratis de 48 Horas &rarr;">Free 48-Hour Written Audit &rarr;</a>
      <a href="https://netwebmedia.com/services.html" class="btn-ghost-white" data-en="See All Services" data-es="Ver Todos los Servicios">See All Services</a>
    </div>
  </div>

  <div class="results-bar">
    <div class="result-stat"><div class="n">{r1}</div><div class="l" data-en="Client avg result" data-es="Resultado promedio del cliente">Client avg result</div></div>
    <div class="result-stat"><div class="n">{r2}</div><div class="l" data-en="Client avg result" data-es="Resultado promedio del cliente">Client avg result</div></div>
    <div class="result-stat"><div class="n">{r3}</div><div class="l" data-en="Client avg result" data-es="Resultado promedio del cliente">Client avg result</div></div>
  </div>

  <hr class="divider">

  <div class="section">
    <div class="section-label" data-en="Explore by specialty" data-es="Explorar por especialidad">Explore by specialty</div>
    <div class="section-title" data-en="Find your specific niche" data-es="Encuentra tu nicho espec&iacute;fico">Find your specific niche</div>
    <div class="subcats">{subcat_cards}
    </div>
  </div>

  <hr class="divider">

  <div class="section">
    <div class="section-label" data-en="{v['pain_label_en']}" data-es="{v['pain_label_es']}">{v['pain_label_en']}</div>
    <div class="section-title" data-en="{v['section_title_en']}" data-es="{v['section_title_es']}">{v['section_title_en']}</div>
    <div class="pain-grid">{pain_cards}
    </div>
  </div>

  <hr class="divider">

  <div class="section">
    <div class="section-label" style="text-align:center" data-en="Fractional CMO Retainer &mdash; Most Popular" data-es="Retainer CMO Fraccional &mdash; El M&aacute;s Popular">Fractional CMO Retainer &mdash; Most Popular</div>
    <div class="section-title" style="text-align:center" data-en="Your entire marketing function, fully managed by AI + humans." data-es="Tu funci&oacute;n de marketing completa, gestionada por IA + humanos.">Your entire marketing function,<br>fully managed by AI + humans.</div>
    <p style="text-align:center;color:var(--text-muted);font-size:15px;margin-top:-32px;margin-bottom:48px" data-en="90-day minimum &middot; month-to-month thereafter &middot; All plans include NWM CRM (46 modules)" data-es="M&iacute;nimo 90 d&iacute;as &middot; mensual despu&eacute;s &middot; Todos los planes incluyen NWM CRM (46 m&oacute;dulos)">90-day minimum &middot; month-to-month thereafter &middot; All plans include NWM CRM (46 modules)</p>
    <div class="pricing-grid">

      <div class="price-card">
        <div class="price-tier">AEO Starter</div>
        <div class="price-name">AEO Starter</div>
        <div class="price-desc" data-en="AEO + SEO + content strategy" data-es="AEO + SEO + estrategia de contenido">AEO + SEO + content strategy</div>
        <div class="price-amount">$249<span>/mo</span></div>
        <div class="price-setup" data-en="No setup fee" data-es="Sin cargo de configuraci&oacute;n">No setup fee</div>
        <ul class="price-features">
{lite_lis}
        </ul>
        <a href="https://netwebmedia.com/contact.html" class="price-cta outline" data-en="Get started &rarr;" data-es="Comenzar &rarr;">Get started &rarr;</a>
      </div>

      <div class="price-card featured">
        <div class="price-badge" data-en="Most Popular" data-es="M&aacute;s Popular">Most Popular</div>
        <div class="price-tier">CMO Growth</div>
        <div class="price-name">CMO Growth</div>
        <div class="price-desc" data-en="AEO + SEO + paid ads + social" data-es="AEO + SEO + publicidad pagada + social">AEO + SEO + paid ads + social</div>
        <div class="price-amount">$999<span>/mo</span></div>
        <div class="price-setup" data-en="Setup $499" data-es="Configuraci&oacute;n $499">Setup $499</div>
        <ul class="price-features">
{grow_lis}
        </ul>
        <a href="https://netwebmedia.com/contact.html" class="price-cta solid" data-en="Get started &rarr;" data-es="Comenzar &rarr;">Get started &rarr;</a>
      </div>

      <div class="price-card">
        <div class="price-tier">CMO Premium</div>
        <div class="price-name">CMO Premium</div>
        <div class="price-desc" data-en="Full-stack marketing department" data-es="Departamento de marketing completo">Full-stack marketing department</div>
        <div class="price-amount">$2,490<span>/mo</span></div>
        <div class="price-setup" data-en="Setup $999" data-es="Configuraci&oacute;n $999">Setup $999</div>
        <ul class="price-features">
{scale_lis}
        </ul>
        <a href="https://netwebmedia.com/contact.html" class="price-cta outline" data-en="Contact sales &rarr;" data-es="Contactar ventas &rarr;">Contact sales &rarr;</a>
      </div>

    </div>
    <p style="text-align:center;color:var(--text-muted);font-size:13px;margin-top:24px">+ ad spend at cost &middot; 12% mgmt fee on ad spend (min $300/mo) &middot; <a href="https://netwebmedia.com/contact.html" style="color:var(--nwm-orange)">Questions? hello@netwebmedia.com</a></p>
  </div>

{resources_section}

{faq_details_html}

  <hr class="divider">

  <div class="final-cta-wrap">
    <h2 data-en="Ready to grow your {v['cta_en']}?" data-es="&iquest;Listo para hacer crecer tu {v['cta_es']}?">Ready to grow your {v['cta_en']}?</h2>
    <p data-en="Get a free 30-minute audit. We&rsquo;ll show you exactly where you&rsquo;re losing visibility and revenue &mdash; and what to do about it." data-es="Obt&eacute;n una auditor&iacute;a gratuita de 30 minutos. Te mostraremos exactamente d&oacute;nde est&aacute;s perdiendo visibilidad e ingresos &mdash; y qu&eacute; hacer al respecto.">Get a free 30-minute audit. We&rsquo;ll show you exactly where you&rsquo;re losing visibility and revenue &mdash; and what to do about it.</p>
    <a href="https://netwebmedia.com/contact.html" class="btn-primary" style="font-size:18px;padding:18px 40px" data-en="Book Your Free 48-Hour Written Audit &rarr;" data-es="Reservar Tu Auditor&iacute;a Gratis de 48 Horas &rarr;">Book Your Free 48-Hour Written Audit &rarr;</a>
  </div>
</main>

<footer>
  <p>&copy; 2026 <a href="https://netwebmedia.com">NetWebMedia</a> &middot; <a href="https://netwebmedia.com/privacy.html">Privacy</a> &middot; <a href="https://netwebmedia.com/terms.html">Terms</a> &middot; hello@netwebmedia.com</p>
</footer>

<script src="https://netwebmedia.com/js/main.js"></script>
</body>
</html>"""

base = r'C:\Users\Usuario\Desktop\NetWebMedia\industries'
for v in VERTICALS:
    path = os.path.join(base, v["folder"], "index.html")
    os.makedirs(os.path.dirname(path), exist_ok=True)
    with open(path, 'w', encoding='utf-8') as f:
        f.write(build_page(v))
    print(f"built: {v['folder']}/index.html")

print(f"\nDone — {len(VERTICALS)} parent pages built.")
