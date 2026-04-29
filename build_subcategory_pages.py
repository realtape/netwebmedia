import os

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
            <a href="https://netwebmedia.com/services.html#fractional-cmo">&#9733; <span data-en="Fractional CMO" data-es="CMO Fraccional">Fractional CMO</span></a>
            <a href="https://netwebmedia.com/services.html#ai-automations"><span data-en="AI Automations" data-es="Automatizaciones IA">AI Automations</span></a>
            <a href="https://netwebmedia.com/services.html#ai-agents"><span data-en="AI Agents" data-es="Agentes IA">AI Agents</span></a>
            <a href="https://netwebmedia.com/services.html#paid-ads"><span data-en="Paid Ads" data-es="Publicidad Paga">Paid Ads</span></a>
            <a href="https://netwebmedia.com/services.html#ai-seo"><span data-en="AI SEO &amp; Content" data-es="SEO IA y Contenido">AI SEO &amp; Content</span></a>
            <a href="https://netwebmedia.com/services.html#social"><span data-en="Social Media" data-es="Redes Sociales">Social Media</span></a>
            <a href="https://netwebmedia.com/email-marketing.html"><span data-en="Email Marketing" data-es="Email Marketing">Email Marketing</span></a>
          </div>
        </div>
        <div class="nav-item">
          <a href="https://netwebmedia.com/industries/" data-en="Industries" data-es="Industrias">Industries</a>
          <div class="nav-dropdown">
            <a href="https://hospitality.netwebmedia.com">&#127970; <span data-en="Tourism &amp; Hospitality" data-es="Turismo y Hospitalidad">Tourism &amp; Hospitality</span></a>
            <a href="https://restaurants.netwebmedia.com">&#127829; <span data-en="Restaurants &amp; F&amp;B" data-es="Restaurantes y F&amp;B">Restaurants &amp; F&amp;B</span></a>
            <a href="https://healthcare.netwebmedia.com">&#129657; <span data-en="Health &amp; Medical" data-es="Salud y Medicina">Health &amp; Medical</span></a>
            <a href="https://beauty.netwebmedia.com">&#10024; <span data-en="Beauty &amp; Wellness" data-es="Belleza y Bienestar">Beauty &amp; Wellness</span></a>
            <a href="https://smb.netwebmedia.com">&#128200; <span data-en="Small &amp; Medium Business" data-es="Pequeña y Mediana Empresa">Small &amp; Medium Business</span></a>
            <a href="https://legal.netwebmedia.com">&#9878; <span data-en="Law Firms &amp; Legal" data-es="Firmas Legales">Law Firms &amp; Legal</span></a>
            <a href="https://realestate.netwebmedia.com">&#127968; <span data-en="Real Estate" data-es="Bienes Ra&iacute;ces">Real Estate</span></a>
            <a href="https://local.netwebmedia.com">&#127979; <span data-en="Local Specialist Services" data-es="Servicios Especialistas Locales">Local Specialist Services</span></a>
            <a href="https://auto.netwebmedia.com">&#128664; <span data-en="Automotive" data-es="Automotriz">Automotive</span></a>
            <a href="https://education.netwebmedia.com">&#127979; <span data-en="Education &amp; Training" data-es="Educaci&oacute;n y Formaci&oacute;n">Education &amp; Training</span></a>
            <a href="https://events.netwebmedia.com">&#127881; <span data-en="Events &amp; Weddings" data-es="Eventos y Bodas">Events &amp; Weddings</span></a>
            <a href="https://finance.netwebmedia.com">&#128200; <span data-en="Financial Services" data-es="Servicios Financieros">Financial Services</span></a>
            <a href="https://home.netwebmedia.com">&#128295; <span data-en="Home Services" data-es="Servicios del Hogar">Home Services</span></a>
            <a href="https://wine.netwebmedia.com">&#127863; <span data-en="Wine &amp; Agriculture" data-es="Vino y Agricultura">Wine &amp; Agriculture</span></a>
          </div>
        </div>
        <a href="https://netwebmedia.com/partners.html" data-en="Partners" data-es="Aliados">Partners</a>
        <a href="https://netwebmedia.com/blog.html" data-en="Blog" data-es="Blog">Blog</a>
        <a href="https://netwebmedia.com/faq.html" data-en="Q&amp;A" data-es="P&amp;R">Q&amp;A</a>
        <a href="https://netwebmedia.com/contact.html" data-en="Contact" data-es="Contacto">Contact</a>
      </div>
      <div class="nav-ctas">
        <a href="https://netwebmedia.com/contact.html" class="btn-nav-solid" data-en="Free 48-Hour Written Audit" data-es="Auditoría Gratis de 48 Horas">Free 48-Hour Written Audit</a>
      </div>
      <button class="nav-hamburger" id="navHamburger" aria-label="Open menu">
        <span></span><span></span><span></span>
      </button>
    </div>
  </div>
</nav>"""

# Parent label translations (EN → ES)
PARENT_ES = {
  "Hospitality": "Hospitalidad",
  "Healthcare": "Salud",
  "Beauty &amp; Wellness": "Belleza y Bienestar",
  "Professional Services": "Servicios Profesionales",
  "Real Estate": "Bienes Raíces",
  "Restaurants &amp; F&amp;B": "Restaurantes y F&amp;B",
  "Fitness &amp; Gyms": "Fitness y Gimnasios",
  "E-commerce": "E-commerce",
  "Home Services": "Servicios del Hogar",
  "Tech &amp; SaaS": "Tech y SaaS",
}

SUBCATEGORIES = [
  # ── HOSPITALITY ──────────────────────────────────────────────────────────
  {
    "slug": "hotels", "folder": "industries/hospitality/hotels",
    "parent_slug": "hospitality", "parent_label": "Hospitality",
    "emoji": "🏨", "label": "Hotels",
    "title": "AI Marketing for Hotels",
    "meta_desc": "Drive direct bookings, cut OTA fees, and dominate Google for your hotel. AI-powered fractional CMO built for independent hotels and hotel groups — from $249/mo.",
    "hero_headline": "More Direct Bookings.<br><span class='hl'>Zero OTA Commission.</span>",
    "hero_sub": "Every reservation through Booking.com costs you 20%. We build the SEO, paid ads, and AI search presence that drives guests directly to your site — and keeps the full margin.",
    "pain_label": "The hotel marketing problem",
    "pains": [
      ("OTA dependency draining your RevPAR", "20–25% commission per booking adds up fast. We run Google Hotel Ads, SEO, and direct booking funnels that make OTAs a last resort, not your primary channel."),
      ("Low visibility on Google Maps and AI", "When a traveler asks Claude 'best hotel near [landmark]', you need to appear. We optimize your Google Business Profile and build AEO content that earns those citations."),
      ("No loyalty program keeping guests returning", "One-time guests are expensive. We build post-stay email sequences, loyalty offers, and retargeting campaigns that turn first-timers into regulars."),
    ],
    "results": ["+42% direct booking revenue", "-24% OTA commission spend", "4.8&#9733; avg Google rating"],
    "lite": ["Google Business Profile management + local SEO", "Monthly blog: destination guides, hotel features", "AEO — cited when AI recommends hotels near you", "NWM CRM for post-stay follow-up &amp; loyalty", "Monthly strategy note"],
    "growth": ["Everything in CMO Lite", "Google Hotel Ads + Meta retargeting campaigns", "Automated review request sequences", "Direct booking email campaigns to past guests", "AI SDR for group bookings &amp; event inquiries"],
    "scale": ["Everything in CMO Growth", "16 Reels/mo — room tours, amenities, local experiences", "Custom AI booking concierge for your website", "White-glove onboarding + dedicated strategist", "Priority support + daily Slack access"],
    "cta": "your hotel",
  },
  {
    "slug": "boutique", "folder": "industries/hospitality/boutique",
    "parent_slug": "hospitality", "parent_label": "Hospitality",
    "emoji": "🛎️", "label": "Boutique Hotels",
    "title": "AI Marketing for Boutique Hotels",
    "meta_desc": "Stand out from big chains with marketing that tells your unique story. AI-powered CMO for boutique hotels and independent properties — from $249/mo.",
    "hero_headline": "Boutique Story.<br><span class='hl'>Big Hotel Reach.</span>",
    "hero_sub": "Your property has personality that Marriott can't buy. We build the content engine, paid strategy, and AI search presence that gets your unique story in front of the right travelers.",
    "pain_label": "The boutique hotel marketing problem",
    "pains": [
      ("Out-spent by chain hotels on ads", "You can't match Hilton's budget — but you can out-target them. We focus spend on high-intent travelers who specifically search for boutique, independent, and unique stays."),
      ("Your story isn't reaching the right audience", "Boutique travelers look for authenticity on Instagram, Google, and AI assistants. We build content that speaks their language and earns their trust before they book."),
      ("Seasonality creating unpredictable revenue", "We build year-round demand with seasonal campaigns, off-peak promotions, and automated email sequences that fill your calendar even in shoulder season."),
    ],
    "results": ["+38% direct bookings", "+190% Instagram engagement", "4.9&#9733; TripAdvisor ranking"],
    "lite": ["Local SEO + boutique travel keyword strategy", "Monthly content: property stories, local guides, design features", "AEO — cited when AI recommends boutique stays", "NWM CRM for guest relationship management", "Monthly strategy note"],
    "growth": ["Everything in CMO Lite", "Instagram + Facebook paid ads targeting boutique travelers", "Influencer &amp; travel blogger outreach coordination", "Seasonal promotion &amp; package campaigns", "AI SDR for partnership &amp; press inquiries"],
    "scale": ["Everything in CMO Growth", "16 Reels/mo — property tours, design stories, local experiences", "Custom AI concierge for your website", "White-glove onboarding + dedicated strategist", "Priority support + daily Slack access"],
    "cta": "your boutique hotel",
  },
  {
    "slug": "resorts", "folder": "industries/hospitality/resorts",
    "parent_slug": "hospitality", "parent_label": "Hospitality",
    "emoji": "🌴", "label": "Resorts",
    "title": "AI Marketing for Resorts",
    "meta_desc": "Fill every room, every season. AI-powered marketing for resorts — direct bookings, package promotions, and dominant travel search presence from $249/mo.",
    "hero_headline": "Fill Every Room.<br><span class='hl'>Every Season.</span>",
    "hero_sub": "Resorts live and die by occupancy rate. We build the multi-channel marketing engine that drives direct bookings, promotes your packages, and keeps you visible when travelers plan their next escape.",
    "pain_label": "The resort marketing problem",
    "pains": [
      ("Peak season fills itself — off-season doesn't", "Your shoulder season has empty rooms and fixed costs. We build targeted off-season campaigns, package promotions, and email sequences that drive bookings year-round."),
      ("Activities and amenities aren't converting", "Your spa, golf course, and dining are revenue centers — but guests don't book them in advance. We build pre-arrival upsell sequences that fill every amenity slot."),
      ("Group and event business is unpredictable", "Weddings, corporate retreats, and groups represent massive revenue. Our AI SDR and outbound sequences proactively pursue these high-value bookings."),
    ],
    "results": ["+51% shoulder season occupancy", "+33% pre-arrival upsell revenue", "Top 5 resort in AI travel search"],
    "lite": ["Resort SEO + package keyword strategy", "Monthly content: experiences, amenities, destination guides", "AEO — cited when AI recommends resorts &amp; getaways", "NWM CRM for guest journey &amp; upsell sequences", "Monthly strategy note"],
    "growth": ["Everything in CMO Lite", "Google + Meta ads for package promotions &amp; events", "Pre-arrival upsell email automation", "Group &amp; wedding venue promotion campaigns", "AI SDR for event &amp; corporate group inquiries"],
    "scale": ["Everything in CMO Growth", "16 Reels/mo — experiences, chef features, property showcases", "Custom AI concierge for bookings &amp; activity planning", "White-glove onboarding + dedicated strategist", "Priority support + daily Slack access"],
    "cta": "your resort",
  },
  # ── HEALTHCARE ───────────────────────────────────────────────────────────
  {
    "slug": "dental", "folder": "industries/healthcare/dental",
    "parent_slug": "healthcare", "parent_label": "Healthcare",
    "emoji": "🦷", "label": "Dental Practices",
    "title": "AI Marketing for Dental Practices",
    "meta_desc": "Fill your chair with high-value patients. AI marketing for dental practices — new patient acquisition, recall sequences, and local AI search dominance from $249/mo.",
    "hero_headline": "Fill Your Chair<br><span class='hl'>With High-Value Patients.</span>",
    "hero_sub": "Your schedule has gaps and your recall list isn't working. We build the automated marketing system that attracts new patients, reduces no-shows, and keeps your existing patients coming back.",
    "pain_label": "The dental practice marketing problem",
    "pains": [
      ("New patient flow is unpredictable", "Relying on referrals and walk-ins creates feast-or-famine scheduling. We build consistent inbound pipelines through Google Ads, SEO, and AI search optimization."),
      ("Patients don't come back for recall", "Manual recall is inefficient. We automate the entire recall process — email, SMS, and retargeting — so patients rebook before they even think about switching dentists."),
      ("Losing high-value cases to larger practices", "Implants, Invisalign, and cosmetic cases go to whoever patients trust most online. We build the authority and reviews that make you the obvious choice."),
    ],
    "results": ["+58% new patient inquiries", "-34% no-show rate", "Top 3 dental practice in local AI search"],
    "lite": ["Google My Business optimization + dental SEO", "Monthly content: oral health tips, treatment explainers", "AEO — cited when AI recommends dentists near you", "NWM CRM with automated recall sequences", "Monthly strategy note"],
    "growth": ["Everything in CMO Lite", "Google Search Ads for high-intent dental keywords", "Automated recall + appointment reminder sequences", "Review generation on Google &amp; Healthgrades", "AI SDR for new patient inquiry qualification"],
    "scale": ["Everything in CMO Growth", "16 Reels/mo — patient stories, treatment showcases, team features", "Custom AI patient intake assistant for your site", "White-glove onboarding + dedicated strategist", "Priority support + daily Slack access"],
    "cta": "your dental practice",
  },
  {
    "slug": "vet", "folder": "industries/healthcare/vet",
    "parent_slug": "healthcare", "parent_label": "Healthcare",
    "emoji": "🐾", "label": "Veterinary Clinics",
    "title": "AI Marketing for Veterinary Clinics",
    "meta_desc": "More appointments, loyal pet owners. AI marketing for veterinary clinics — new client acquisition, recall automation, and local search dominance from $249/mo.",
    "hero_headline": "More Appointments.<br><span class='hl'>Loyal Pet Owners for Life.</span>",
    "hero_sub": "Pet owners are fiercely loyal — but they have to find you first. We build the local SEO, paid ads, and AI search presence that makes your clinic the obvious choice when a new pet enters the neighborhood.",
    "pain_label": "The veterinary clinic marketing problem",
    "pains": [
      ("New pet owners aren't finding you first", "The first vet a pet owner tries often becomes their vet for life. We make sure you're the first result on Google, Google Maps, and AI assistants when they search."),
      ("Wellness visit compliance is low", "Annual exams and preventive care are your most profitable services — but clients don't come back unless reminded. We automate wellness recall so compliance improves automatically."),
      ("Competing with corporate vet chains", "VCA and Banfield have national budgets. We beat them locally with hyper-targeted SEO, reviews, and community content that builds the trust a corporate chain can't."),
    ],
    "results": ["+49% new client registrations", "+41% wellness visit compliance", "Top local vet in AI search"],
    "lite": ["Google My Business + veterinary local SEO", "Monthly content: pet care tips, health guides, team spotlights", "AEO — cited when AI recommends vets near you", "NWM CRM for wellness recall &amp; follow-up automation", "Monthly strategy note"],
    "growth": ["Everything in CMO Lite", "Google + Meta ads targeting new pet owners &amp; movers", "Automated wellness recall + birthday sequences", "Review generation on Google &amp; Yelp", "AI SDR for appointment booking inquiries"],
    "scale": ["Everything in CMO Growth", "16 Reels/mo — patient stories, team features, pet health tips", "Custom AI appointment booking assistant", "White-glove onboarding + dedicated strategist", "Priority support + daily Slack access"],
    "cta": "your veterinary clinic",
  },
  {
    "slug": "aesthetics", "folder": "industries/healthcare/aesthetics",
    "parent_slug": "healthcare", "parent_label": "Healthcare",
    "emoji": "💉", "label": "Medical Aesthetics",
    "title": "AI Marketing for Medical Aesthetics",
    "meta_desc": "Fill your treatment schedule with premium clients. AI marketing for medical spas, aesthetics clinics, and cosmetic practices — from $249/mo.",
    "hero_headline": "Premium Clients.<br><span class='hl'>Fully Booked Schedule.</span>",
    "hero_sub": "Your injectors are skilled, your results are stunning — but if high-value clients aren't finding you on Instagram and AI search, you're leaving five-figure monthly revenue on the table.",
    "pain_label": "The medical aesthetics marketing problem",
    "pains": [
      ("High-value clients choosing competitors on Instagram", "Aesthetics is a visual business and Instagram is your showroom. We build a content engine that showcases your results, grows your following, and converts followers into booked consultations."),
      ("Botox clients not upgrading to premium treatments", "Your best revenue is in filler, RF, and body contouring — but patients don't know what they need. We build educational content and automated upsell sequences that move clients up the treatment ladder."),
      ("No-shows on high-ticket appointments", "A missed filler appointment is $500+ lost. We reduce no-shows with smart reminder sequences and deposit-on-booking incentive flows."),
    ],
    "results": ["+63% consultation bookings", "+44% average treatment value", "4.9&#9733; avg Google rating"],
    "lite": ["Local SEO + medical aesthetics keyword strategy", "Monthly content: before/afters, treatment education, team features", "AEO — cited when AI recommends med spas near you", "NWM CRM for client journey &amp; upsell sequences", "Monthly strategy note"],
    "growth": ["Everything in CMO Lite", "Instagram + Facebook paid ads for consultations", "Automated treatment upsell &amp; loyalty sequences", "Review generation on Google &amp; RealSelf", "AI SDR for consultation inquiry qualification"],
    "scale": ["Everything in CMO Growth", "16 Reels/mo — treatment demos, client transformations, provider spotlights", "Custom AI consultation booking assistant", "White-glove onboarding + dedicated strategist", "Priority support + daily Slack access"],
    "cta": "your aesthetics practice",
  },
  # ── BEAUTY & WELLNESS ─────────────────────────────────────────────────────
  {
    "slug": "salons", "folder": "industries/beauty/salons",
    "parent_slug": "beauty", "parent_label": "Beauty &amp; Wellness",
    "emoji": "💇", "label": "Hair Salons",
    "title": "AI Marketing for Hair Salons",
    "meta_desc": "Pack your books and keep them full. AI marketing for hair salons — new client acquisition, rebooking automation, and local search dominance from $249/mo.",
    "hero_headline": "Pack Your Books.<br><span class='hl'>Keep Them Full.</span>",
    "hero_sub": "Empty slots cost you money every day. We build the always-on marketing system that attracts new clients, automates rebooking, and turns your best clients into your best referrers.",
    "pain_label": "The hair salon marketing problem",
    "pains": [
      ("Empty slots on Monday and Tuesday", "Weekends book themselves. We fill your slow days with targeted local ads, promo campaigns, and automated outreach to clients who haven't booked in 6+ weeks."),
      ("Clients don't rebook consistently", "A client who books every 6 weeks is worth 8x one who books once. We automate rebooking reminders via SMS and email so your retention rate climbs without lifting a finger."),
      ("New clients finding competitors first", "When someone moves to your area and Googles 'best hair salon near me', you need to be the top result. We own that position with local SEO and AI search optimization."),
    ],
    "results": ["+47% client retention rate", "+38% new client bookings", "Top 3 salon in local AI search"],
    "lite": ["Google My Business + salon local SEO", "Monthly content: style inspiration, transformations, team features", "AEO — cited when AI recommends salons near you", "NWM CRM with automated rebooking sequences", "Monthly strategy note"],
    "growth": ["Everything in CMO Lite", "Instagram + Facebook paid ads for new client acquisition", "Automated rebooking + win-back sequences", "Referral program setup &amp; promotion", "AI SDR for new client inquiry qualification"],
    "scale": ["Everything in CMO Growth", "16 Reels/mo — transformations, color work, styling tutorials", "Custom AI booking assistant for your website", "White-glove onboarding + dedicated strategist", "Priority support + daily Slack access"],
    "cta": "your hair salon",
  },
  {
    "slug": "spas", "folder": "industries/beauty/spas",
    "parent_slug": "beauty", "parent_label": "Beauty &amp; Wellness",
    "emoji": "🧖", "label": "Spas",
    "title": "AI Marketing for Spas",
    "meta_desc": "Full treatment rooms, loyal guests. AI marketing for day spas and wellness centers — new client acquisition, package promotions, and local search dominance from $249/mo.",
    "hero_headline": "Full Treatment Rooms.<br><span class='hl'>Loyal Guests for Life.</span>",
    "hero_sub": "Your spa is an escape — but only if people know it exists. We build the content, local presence, and automated marketing that keeps your treatment rooms full and your guests coming back.",
    "pain_label": "The spa marketing problem",
    "pains": [
      ("Midweek rooms sitting empty", "Weekends are easy. Tuesdays aren't. We run targeted local campaigns and email promotions that drive bookings on your slowest days."),
      ("Gift cards and packages aren't selling year-round", "Gift cards and spa packages are high-margin revenue that most spas only push at Christmas. We build year-round campaigns that make them a consistent revenue stream."),
      ("Clients don't upgrade to premium treatments", "A massage client who doesn't know about your body wrap or facial is a missed upsell. We automate post-booking and post-visit sequences that introduce clients to your full menu."),
    ],
    "results": ["+44% midweek bookings", "+55% gift card &amp; package revenue", "4.9&#9733; avg Google rating"],
    "lite": ["Google My Business + spa local SEO", "Monthly content: wellness tips, treatment spotlights, team features", "AEO — cited when AI recommends spas near you", "NWM CRM for guest journey &amp; upsell sequences", "Monthly strategy note"],
    "growth": ["Everything in CMO Lite", "Meta + Google ads for package promotions", "Automated post-visit upsell &amp; rebooking sequences", "Gift card &amp; package campaign automation", "AI SDR for group bookings &amp; event inquiries"],
    "scale": ["Everything in CMO Growth", "16 Reels/mo — treatment showcases, wellness content, ambiance tours", "Custom AI booking assistant for your website", "White-glove onboarding + dedicated strategist", "Priority support + daily Slack access"],
    "cta": "your spa",
  },
  {
    "slug": "barbershops", "folder": "industries/beauty/barbershops",
    "parent_slug": "beauty", "parent_label": "Beauty &amp; Wellness",
    "emoji": "✂️", "label": "Barbershops",
    "title": "AI Marketing for Barbershops",
    "meta_desc": "Pack your chairs, build your brand. AI marketing for barbershops — new client acquisition, loyalty automation, and local search dominance from $249/mo.",
    "hero_headline": "Pack Your Chairs.<br><span class='hl'>Build a Brand They're Loyal To.</span>",
    "hero_sub": "The best barbers don't just cut hair — they build community. We build the online presence, local marketing, and automated loyalty system that turns one-time visits into lifelong clients.",
    "pain_label": "The barbershop marketing problem",
    "pains": [
      ("Walk-ins alone won't build a predictable business", "Unpredictable foot traffic means unpredictable income. We build an online booking system with SEO and paid ads that drives consistent, pre-booked appointments."),
      ("New barbers need clients fast", "When you add a chair or hire a new barber, they need clients now. We run targeted campaigns that fill their books within the first 30 days."),
      ("No system for loyalty and referrals", "Your best clients send friends — but only if you ask them to. We build automated referral and loyalty programs that turn your regulars into your best sales team."),
    ],
    "results": ["+52% online bookings", "+35% new client referrals", "Top local barbershop in AI search"],
    "lite": ["Google My Business + barbershop local SEO", "Monthly content: cuts, beard work, team spotlights, style tips", "AEO — cited when AI recommends barbershops near you", "NWM CRM with loyalty &amp; rebooking automations", "Monthly strategy note"],
    "growth": ["Everything in CMO Lite", "Instagram + Facebook paid ads for new client acquisition", "Automated rebooking + referral reward sequences", "New barber client-building campaign", "AI SDR for appointment booking &amp; inquiries"],
    "scale": ["Everything in CMO Growth", "16 Reels/mo — cuts, transformations, shop culture content", "Custom AI booking assistant for your website", "White-glove onboarding + dedicated strategist", "Priority support + daily Slack access"],
    "cta": "your barbershop",
  },
  # ── PROFESSIONAL SERVICES ─────────────────────────────────────────────────
  {
    "slug": "legal", "folder": "industries/professional-services/legal",
    "parent_slug": "pro", "parent_label": "Professional Services",
    "emoji": "⚖️", "label": "Law Firms",
    "title": "AI Marketing for Law Firms",
    "meta_desc": "More qualified clients, less reliance on referrals. AI marketing for law firms and attorneys — inbound lead generation, AEO authority, and intake automation from $249/mo.",
    "hero_headline": "More Qualified Clients.<br><span class='hl'>Less Waiting for Referrals.</span>",
    "hero_sub": "The best clients are searching online and asking AI for legal recommendations right now. We build the SEO authority, AEO presence, and intake automation that makes your firm the obvious choice.",
    "pain_label": "The law firm marketing problem",
    "pains": [
      ("Referrals are drying up and unreliable", "Senior partners retire. Referral networks shrink. We build an inbound marketing engine that generates qualified leads independent of any single referral relationship."),
      ("Competing firms dominate Google and AI search", "When a prospect asks Claude 'best [practice area] attorney in [city]', your firm needs to appear. We build the topical authority and AEO content that earns those citations."),
      ("Intake process is slow and leaking leads", "A qualified lead who waits 48 hours for a call back often goes to a competitor. Our AI SDR responds in under 2 minutes, qualifies the case, and schedules the consultation automatically."),
    ],
    "results": ["+71% qualified consultation requests", "Top 3 firm in practice area AI citations", "2-min AI SDR intake response"],
    "lite": ["Legal SEO + practice area keyword strategy", "Monthly thought leadership articles &amp; legal guides", "AEO — cited when AI recommends attorneys in your practice area", "NWM CRM for prospect nurture sequences", "Monthly strategy note"],
    "growth": ["Everything in CMO Lite", "Google Search Ads for high-intent legal keywords", "LinkedIn authority content for partner profiles", "Automated follow-up sequences for consultation no-shows", "AI SDR for 24/7 intake qualification &amp; scheduling"],
    "scale": ["Everything in CMO Growth", "16 Reels/mo — case explainers, attorney spotlights, legal tips", "Custom AI intake assistant for your firm website", "White-glove onboarding + dedicated strategist", "Priority support + daily Slack access"],
    "cta": "your law firm",
  },
  {
    "slug": "accounting", "folder": "industries/professional-services/accounting",
    "parent_slug": "pro", "parent_label": "Professional Services",
    "emoji": "📊", "label": "Accounting Firms",
    "title": "AI Marketing for Accounting Firms",
    "meta_desc": "Grow beyond tax season. AI marketing for accounting firms and CPAs — year-round lead generation, AEO authority, and client acquisition automation from $249/mo.",
    "hero_headline": "Grow Beyond Tax Season.<br><span class='hl'>Year-Round Revenue.</span>",
    "hero_sub": "Most accounting firms feast in April and starve in July. We build the content authority, lead generation, and automation that drives advisory work, bookkeeping, and CFO services 12 months a year.",
    "pain_label": "The accounting firm marketing problem",
    "pains": [
      ("Revenue concentrated in tax season", "If 70% of your revenue comes in Q1, your business has a planning problem. We build demand for advisory, bookkeeping, and fractional CFO services that smooth revenue year-round."),
      ("Prospects choose the firm they find first online", "Most SMBs hire the accountant who shows up first on Google or gets recommended by AI. We make sure that's you — with local SEO, thought leadership, and AEO optimization."),
      ("High-value advisory services aren't selling", "Tax prep is a commodity. CFO advisory and strategic planning command 5x the fees — but clients don't ask for them. We build content and campaigns that create demand for your premium services."),
    ],
    "results": ["+64% advisory service inquiries", "+38% new client acquisitions", "Top 3 firm in local AI search"],
    "lite": ["SEO + accounting keyword strategy (beyond 'tax prep')", "Monthly content: tax tips, financial guides, business advisory", "AEO — cited when AI recommends accountants &amp; CPAs", "NWM CRM for prospect &amp; client nurture", "Monthly strategy note"],
    "growth": ["Everything in CMO Lite", "Google Search Ads targeting business owners &amp; CFO searches", "LinkedIn content marketing for partner visibility", "Email campaigns for off-season advisory service promotion", "AI SDR for consultation scheduling &amp; qualification"],
    "scale": ["Everything in CMO Growth", "16 Reels/mo — financial tips, firm spotlights, client success stories", "Custom AI consultation booking assistant", "White-glove onboarding + dedicated strategist", "Priority support + daily Slack access"],
    "cta": "your accounting firm",
  },
  {
    "slug": "consulting", "folder": "industries/professional-services/consulting",
    "parent_slug": "pro", "parent_label": "Professional Services",
    "emoji": "🧠", "label": "Consulting Firms",
    "title": "AI Marketing for Consulting Firms",
    "meta_desc": "Build a pipeline that doesn't depend on your network. AI marketing for consultants and consulting firms — inbound lead generation, AEO authority, and client acquisition from $249/mo.",
    "hero_headline": "A Pipeline That Doesn't<br><span class='hl'>Depend on Your Network.</span>",
    "hero_sub": "Your expertise is world-class. But if your only lead source is LinkedIn connections and conference handshakes, you're one slow quarter away from a revenue crisis. We fix that.",
    "pain_label": "The consulting firm marketing problem",
    "pains": [
      ("Network-dependent pipeline is fragile", "When your best contact retires or moves firms, your pipeline moves with them. We build an inbound content engine and paid strategy that generates leads independent of any relationship."),
      ("Prospects don't understand your methodology", "Consulting is complex and buyers are skeptical. We build thought leadership content — articles, videos, frameworks — that educates prospects and builds trust before the first call."),
      ("AI search doesn't know your expertise", "When a CEO asks Claude 'best [type] consultant for [problem]', you need to be cited. We build the AEO content strategy that earns those recommendations systematically."),
    ],
    "results": ["+68% inbound inquiry volume", "Top 3 cited in target consulting category", "2.7x pipeline from content"],
    "lite": ["SEO + thought leadership content strategy", "Monthly articles, frameworks &amp; whitepapers", "AEO — cited when AI recommends consultants in your niche", "NWM CRM for prospect nurture &amp; follow-up", "Monthly strategy note"],
    "growth": ["Everything in CMO Lite", "LinkedIn thought leadership + lead gen campaigns", "Google Search Ads for high-intent consulting keywords", "Email nurture sequences for long-cycle prospects", "AI SDR for discovery call scheduling"],
    "scale": ["Everything in CMO Growth", "16 Reels/mo — methodology explainers, case studies, expert insights", "Custom AI intake assistant for your website", "White-glove onboarding + dedicated strategist", "Priority support + daily Slack access"],
    "cta": "your consulting firm",
  },
  # ── REAL ESTATE ──────────────────────────────────────────────────────────
  {
    "slug": "agents", "folder": "industries/real-estate/agents",
    "parent_slug": "realestate", "parent_label": "Real Estate",
    "emoji": "🏡", "label": "Real Estate Agents",
    "title": "AI Marketing for Real Estate Agents",
    "meta_desc": "More listings, faster leads, zero cold-calling. AI marketing for real estate agents — lead generation, AI SDR follow-up, and local search dominance from $249/mo.",
    "hero_headline": "More Listings.<br><span class='hl'>Zero Cold Calling.</span>",
    "hero_sub": "The top agents in your market aren't cold calling — they're generating inbound. We build the SEO, content, paid ads, and AI-powered follow-up that makes sellers call you.",
    "pain_label": "The real estate agent marketing problem",
    "pains": [
      ("Leads go cold in the first hour", "Speed-to-lead in real estate is everything. Our AI SDR contacts every new inquiry in under 2 minutes, qualifies their timeline and budget, and schedules your consultation automatically."),
      ("You're invisible to AI-assisted home searches", "Buyers and sellers increasingly ask Claude 'best real estate agent in [neighborhood]'. We build the content authority that puts you in those answers."),
      ("Past clients aren't referring you", "Your best leads are past clients and their networks — but most agents have no systematic follow-up. We build automated anniversary, market update, and check-in sequences that keep you top of mind."),
    ],
    "results": ["+76% lead response rate", "-45% time to first contact", "+39% referral-sourced closings"],
    "lite": ["Local SEO + neighborhood content strategy", "Monthly market updates + buyer/seller guides", "AEO — cited when AI recommends agents in your area", "NWM CRM with past client nurture sequences", "Monthly strategy note"],
    "growth": ["Everything in CMO Lite", "Google + Meta listing promotion ads", "Automated lead follow-up + consultation scheduler", "Past client anniversary &amp; check-in campaigns", "AI SDR — qualifies leads &amp; books consultations 24/7"],
    "scale": ["Everything in CMO Growth", "16 Reels/mo — listing tours, neighborhood features, market insights", "Custom AI assistant for your agent website", "White-glove onboarding + dedicated strategist", "Priority support + daily Slack access"],
    "cta": "your real estate business",
  },
  {
    "slug": "brokerages", "folder": "industries/real-estate/brokerages",
    "parent_slug": "realestate", "parent_label": "Real Estate",
    "emoji": "🏢", "label": "Real Estate Brokerages",
    "title": "AI Marketing for Real Estate Brokerages",
    "meta_desc": "Recruit top agents, dominate your market. AI marketing for real estate brokerages — agent recruitment, brand authority, and lead generation from $249/mo.",
    "hero_headline": "Recruit Top Agents.<br><span class='hl'>Dominate Your Market.</span>",
    "hero_sub": "The best brokerages win on two fronts: attracting top producers and generating consumer leads. We build the marketing engine that does both — simultaneously.",
    "pain_label": "The brokerage marketing problem",
    "pains": [
      ("Top agents are being recruited by your competitors", "eXp, Compass, and RE/MAX have national recruiting budgets. We build the local brand authority and agent value proposition that makes top producers choose you instead."),
      ("Brand awareness is fragmented across agents", "Every agent doing their own marketing creates inconsistent brand messaging. We build the brokerage brand system that elevates every agent while maintaining your competitive identity."),
      ("Consumer lead generation is expensive and unpredictable", "Paying Zillow for leads that go to 5 agents is a losing strategy. We build your direct lead generation channel so every consumer lead stays in-house."),
    ],
    "results": ["+44% agent recruitment inquiries", "3.1x consumer lead volume", "Top brokerage in local AI search"],
    "lite": ["Brokerage SEO + market authority content", "Monthly content: market reports, agent spotlights, community features", "AEO — cited when AI recommends brokerages in your market", "NWM CRM for agent recruitment &amp; client nurture", "Monthly strategy note"],
    "growth": ["Everything in CMO Lite", "Google + Meta ads for consumer leads &amp; agent recruitment", "Agent recruitment email campaigns", "Consumer lead nurture sequences", "AI SDR for both consumer inquiries &amp; agent recruitment"],
    "scale": ["Everything in CMO Growth", "16 Reels/mo — market insights, agent stories, brokerage culture", "Custom AI assistant for your brokerage website", "White-glove onboarding + dedicated strategist", "Priority support + daily Slack access"],
    "cta": "your brokerage",
  },
  {
    "slug": "propertymanagement", "folder": "industries/real-estate/property-management",
    "parent_slug": "realestate", "parent_label": "Real Estate",
    "emoji": "🔑", "label": "Property Management",
    "title": "AI Marketing for Property Management Companies",
    "meta_desc": "More owners, lower vacancy. AI marketing for property management companies — owner acquisition, tenant attraction, and local search dominance from $249/mo.",
    "hero_headline": "More Owner Contracts.<br><span class='hl'>Zero Vacancy.</span>",
    "hero_sub": "Your revenue grows when you add owner contracts — and stays healthy when vacancy stays low. We build the dual-channel marketing engine that attracts new property owners and qualified tenants simultaneously.",
    "pain_label": "The property management marketing problem",
    "pains": [
      ("Owner acquisition relies on word of mouth", "Most PM companies have no systematic way to acquire new owner contracts. We build the digital presence and outbound system that makes you the first call when an investor needs management."),
      ("Vacancy costs money every single day", "Every empty unit is lost revenue. We build tenant attraction campaigns — Google, Facebook, Zillow optimization — that fill vacancies faster than your current process."),
      ("Owners don't know what they're getting", "Property owners hire managers they trust. We build the content, reviews, and case studies that demonstrate your track record before a prospect ever calls."),
    ],
    "results": ["+53% new owner contract inquiries", "-18 days avg vacancy time", "Top PM company in local AI search"],
    "lite": ["Local SEO + property management keyword strategy", "Monthly content: owner guides, market reports, maintenance tips", "AEO — cited when AI recommends property managers", "NWM CRM for owner prospect &amp; tenant nurture", "Monthly strategy note"],
    "growth": ["Everything in CMO Lite", "Google + Facebook ads for owner acquisition", "Vacancy listing promotion campaigns", "Owner testimonial &amp; case study content", "AI SDR for owner inquiry qualification &amp; scheduling"],
    "scale": ["Everything in CMO Growth", "16 Reels/mo — property showcases, owner testimonials, market updates", "Custom AI assistant for your PM website", "White-glove onboarding + dedicated strategist", "Priority support + daily Slack access"],
    "cta": "your property management company",
  },
  # ── RESTAURANTS ──────────────────────────────────────────────────────────
  {
    "slug": "bars", "folder": "industries/restaurants/bars",
    "parent_slug": "restaurants", "parent_label": "Restaurants &amp; F&amp;B",
    "emoji": "🍸", "label": "Bars &amp; Nightlife",
    "title": "AI Marketing for Bars &amp; Nightlife",
    "meta_desc": "Pack your venue every night of the week. AI marketing for bars, clubs, and nightlife venues — event promotion, loyalty automation, and local search dominance from $249/mo.",
    "hero_headline": "Packed Every Night.<br><span class='hl'>Not Just on Weekends.</span>",
    "hero_sub": "Monday through Thursday is where your margin lives. We build the events calendar, targeted promotions, and digital presence that fills your venue on the nights most bars give up on.",
    "pain_label": "The bar &amp; nightlife marketing problem",
    "pains": [
      ("Weeknight foot traffic is unpredictable", "Weekend crowds are easy. Tuesday nights are not. We build weekly promotion cadences, happy hour campaigns, and email sequences that drive consistent weeknight traffic."),
      ("Events don't sell out without a big push", "Trivia nights, live music, and themed events drive recurring revenue — but only when people know about them. We build automated event promotion that sells tickets before the week of."),
      ("No loyalty system keeping regulars coming back", "Your regulars are your most valuable customers and they have no reason to choose you over the new place down the street. We build the loyalty program that keeps them yours."),
    ],
    "results": ["+61% weeknight covers", "+88% event ticket pre-sales", "4.7&#9733; avg Google rating"],
    "lite": ["Google My Business + bar &amp; nightlife local SEO", "Monthly content: events calendar, cocktail features, behind-the-bar", "AEO — cited when AI recommends bars near you", "NWM CRM for event promotion &amp; loyalty campaigns", "Monthly strategy note"],
    "growth": ["Everything in CMO Lite", "Meta + Google ads for event promotion &amp; weeknight traffic", "Automated event ticket selling sequences", "Loyalty program setup &amp; promotion", "AI SDR for private event &amp; buyout inquiries"],
    "scale": ["Everything in CMO Growth", "16 Reels/mo — events, cocktails, venue ambiance, staff features", "Custom AI event booking assistant for your venue", "White-glove onboarding + dedicated strategist", "Priority support + daily Slack access"],
    "cta": "your bar or venue",
  },
  {
    "slug": "catering", "folder": "industries/restaurants/catering",
    "parent_slug": "restaurants", "parent_label": "Restaurants &amp; F&amp;B",
    "emoji": "🍱", "label": "Catering",
    "title": "AI Marketing for Catering Companies",
    "meta_desc": "Fill your event calendar with high-value bookings. AI marketing for catering companies — corporate client acquisition, event promotion, and AI-powered lead generation from $249/mo.",
    "hero_headline": "Fill Your Event Calendar<br><span class='hl'>With High-Value Bookings.</span>",
    "hero_sub": "One corporate account can be worth $100K+/year. We build the marketing engine that makes your catering company the first call for weddings, corporate events, and large-scale occasions.",
    "pain_label": "The catering company marketing problem",
    "pains": [
      ("Corporate accounts are worth gold — but hard to land", "A single corporate catering contract can generate more revenue than 50 individual events. We build the outbound strategy and content authority that puts you on procurement shortlists."),
      ("Wedding season is feast, off-season is famine", "Wedding business is seasonal and competitive. We diversify your event mix with targeted corporate, holiday party, and social event campaigns that generate year-round revenue."),
      ("Inquiry response speed loses bookings", "Event planners contact 3–5 caterers and book whoever responds first with a quote. Our AI SDR responds to every inquiry in minutes and gathers all the details for your quote."),
    ],
    "results": ["+57% corporate event inquiries", "+33% off-season bookings", "2-min AI SDR response to inquiries"],
    "lite": ["SEO + catering &amp; event keyword strategy", "Monthly content: menu showcases, event features, client testimonials", "AEO — cited when AI recommends caterers for events", "NWM CRM for inquiry follow-up &amp; client nurture", "Monthly strategy note"],
    "growth": ["Everything in CMO Lite", "Google + LinkedIn ads for corporate event decision-makers", "Seasonal campaign automation (weddings, corporate, holidays)", "Automated quote follow-up sequences", "AI SDR for 24/7 inquiry qualification &amp; detail gathering"],
    "scale": ["Everything in CMO Growth", "16 Reels/mo — event showcases, menu features, behind-the-scenes", "Custom AI quote assistant for your website", "White-glove onboarding + dedicated strategist", "Priority support + daily Slack access"],
    "cta": "your catering company",
  },
  # ── FITNESS ───────────────────────────────────────────────────────────────
  {
    "slug": "gyms", "folder": "industries/fitness/gyms",
    "parent_slug": "fitness", "parent_label": "Fitness &amp; Gyms",
    "emoji": "🏋️", "label": "Gyms",
    "title": "AI Marketing for Gyms",
    "meta_desc": "More members, less churn. AI marketing for gyms — new member acquisition, retention automation, and local search dominance from $249/mo.",
    "hero_headline": "More Members.<br><span class='hl'>Less Churn.</span>",
    "hero_sub": "Acquiring a new gym member costs 5x more than keeping one. We build the acquisition engine that brings members in — and the retention system that keeps them long after January.",
    "pain_label": "The gym marketing problem",
    "pains": [
      ("New member acquisition peaks in January and dies", "The New Year rush is real — but so is February's dropout. We build year-round acquisition campaigns using seasonal hooks beyond New Year's to keep your member count growing."),
      ("Members cancel without warning", "Our NWM CRM tracks visit frequency and engagement, triggering automated win-back campaigns when a member goes quiet — before they submit a cancellation request."),
      ("Can't compete with Planet Fitness on price", "You don't need to win on price. You win on community, results, and coaching. We tell that story at scale with content, ads, and AI search presence that turns your strengths into members."),
    ],
    "results": ["-31% annual churn rate", "+62% trial-to-member conversion", "Top local gym in AI search"],
    "lite": ["Local SEO + gym keyword strategy", "Monthly content: workouts, member stories, facility features", "AEO — cited when AI recommends gyms near you", "NWM CRM with churn prevention &amp; win-back automations", "Monthly strategy note"],
    "growth": ["Everything in CMO Lite", "Google + Meta ads for new member acquisition", "Trial-to-member conversion email sequences", "Challenge campaign promotion", "AI SDR to book free trial visits 24/7"],
    "scale": ["Everything in CMO Growth", "16 Reels/mo — workouts, transformations, member stories", "Custom AI assistant for membership FAQs &amp; trial booking", "White-glove onboarding + dedicated strategist", "Priority support + daily Slack access"],
    "cta": "your gym",
  },
  {
    "slug": "studios", "folder": "industries/fitness/studios",
    "parent_slug": "fitness", "parent_label": "Fitness &amp; Gyms",
    "emoji": "🧘", "label": "Fitness Studios",
    "title": "AI Marketing for Fitness Studios",
    "meta_desc": "Fill every class, grow your community. AI marketing for yoga, pilates, cycling, and boutique fitness studios — class bookings, retention, and local search from $249/mo.",
    "hero_headline": "Full Classes.<br><span class='hl'>Thriving Community.</span>",
    "hero_sub": "Boutique fitness runs on community and consistency. We build the marketing system that fills your class schedule, retains your regulars, and makes your studio the one people recommend.",
    "pain_label": "The fitness studio marketing problem",
    "pains": [
      ("Classes running at half capacity", "Empty spots in class mean lost revenue with no way to get it back. We run always-on local campaigns and automated waitlist sequences that maximize every time slot."),
      ("New clients drop off after the intro package", "Intro offers bring people in — but most don't convert to full memberships. We build automated nurture sequences that guide intro clients to committed membership before the package expires."),
      ("Studio discovery depends on word of mouth", "Referrals are great but unpredictable. We build the Google presence, social content, and AI search optimization that makes new movers and searchers find your studio first."),
    ],
    "results": ["+55% class fill rate", "+48% intro-to-member conversion", "Top studio in local AI search"],
    "lite": ["Local SEO + studio &amp; class keyword strategy", "Monthly content: class highlights, instructor features, wellness tips", "AEO — cited when AI recommends yoga/pilates studios near you", "NWM CRM with intro-to-member conversion sequences", "Monthly strategy note"],
    "growth": ["Everything in CMO Lite", "Instagram + Facebook ads for new student acquisition", "Intro package conversion email sequences", "Referral program setup &amp; promotion", "AI SDR for class inquiry &amp; free trial booking"],
    "scale": ["Everything in CMO Growth", "16 Reels/mo — class previews, instructor spotlights, member stories", "Custom AI assistant for class booking &amp; schedule questions", "White-glove onboarding + dedicated strategist", "Priority support + daily Slack access"],
    "cta": "your fitness studio",
  },
  {
    "slug": "personaltraining", "folder": "industries/fitness/personal-training",
    "parent_slug": "fitness", "parent_label": "Fitness &amp; Gyms",
    "emoji": "💪", "label": "Personal Trainers",
    "title": "AI Marketing for Personal Trainers",
    "meta_desc": "Build a full client roster without cold outreach. AI marketing for personal trainers and fitness coaches — client acquisition, retention, and online coaching growth from $249/mo.",
    "hero_headline": "Full Client Roster.<br><span class='hl'>No Cold DMs.</span>",
    "hero_sub": "The best trainers don't chase clients — clients find them. We build the content authority, local SEO, and automated marketing that makes you the obvious choice when someone is ready to invest in their fitness.",
    "pain_label": "The personal trainer marketing problem",
    "pains": [
      ("Client acquisition depends on your gym's referrals", "If your gym closes or changes, your pipeline disappears. We build your own brand and direct client acquisition channel that works regardless of where you train."),
      ("Online coaching revenue is untapped", "Online coaching can double your income without doubling your hours — but only with the right marketing. We build the content funnel and paid strategy that fills your online roster."),
      ("Clients plateau and leave instead of leveling up", "Client churn often happens at the 3-month plateau. We build the content and check-in automation that repositions you as a long-term transformation partner, not a short-term trainer."),
    ],
    "results": ["+58% new client inquiries", "+44% online coaching revenue", "-29% 90-day client churn"],
    "lite": ["Personal brand SEO + fitness keyword strategy", "Monthly content: training tips, client results, methodology content", "AEO — cited when AI recommends personal trainers near you", "NWM CRM for client follow-up &amp; retention sequences", "Monthly strategy note"],
    "growth": ["Everything in CMO Lite", "Instagram + Facebook ads for in-person &amp; online clients", "Online coaching funnel setup &amp; email sequences", "Client transformation showcase campaigns", "AI SDR for consultation booking &amp; lead qualification"],
    "scale": ["Everything in CMO Growth", "16 Reels/mo — workouts, client results, coaching insights", "Custom AI assistant for your coaching website", "White-glove onboarding + dedicated strategist", "Priority support + daily Slack access"],
    "cta": "your personal training business",
  },
  # ── E-COMMERCE ────────────────────────────────────────────────────────────
  {
    "slug": "shopify", "folder": "industries/ecommerce/shopify",
    "parent_slug": "ecommerce", "parent_label": "E-commerce",
    "emoji": "🛍️", "label": "Shopify Stores",
    "title": "AI Marketing for Shopify Stores",
    "meta_desc": "Scale your Shopify store with AI. More repeat purchases, lower CAC, and omnichannel growth for Shopify brands — from $249/mo.",
    "hero_headline": "Scale Your Shopify Store<br><span class='hl'>With AI Marketing.</span>",
    "hero_sub": "You've proven product-market fit. Now the question is scale. We build the retention engine, paid acquisition, and AI search presence that takes your Shopify store from $X to $10X.",
    "pain_label": "The Shopify store marketing problem",
    "pains": [
      ("Ad costs rising, ROAS declining", "iOS changes gutted Facebook attribution and raised CPMs. We diversify your acquisition mix — Google, TikTok, email, SMS, SEO — so no single channel holds your growth hostage."),
      ("One-time buyers aren't becoming loyal customers", "The first purchase is just the beginning. We build post-purchase flows — upsell sequences, loyalty programs, and win-back campaigns — that maximize every customer's lifetime value."),
      ("No organic traffic outside paid channels", "When you pause ads, traffic stops. We build SEO and AEO authority so your store generates discoverable traffic that doesn't disappear when you cut the ad budget."),
    ],
    "results": ["+39% repeat purchase rate", "3.9x ROAS on paid campaigns", "+180% organic traffic"],
    "lite": ["E-commerce SEO + product &amp; category keyword strategy", "Monthly blog: buying guides, product features, comparison content", "AEO — cited in AI product recommendation searches", "NWM CRM for email &amp; SMS retention flows", "Monthly strategy note"],
    "growth": ["Everything in CMO Lite", "Google Shopping + Meta &amp; TikTok catalog ads", "Abandoned cart + post-purchase upsell sequences", "Loyalty program setup &amp; email automation", "AI SDR for VIP customer outreach"],
    "scale": ["Everything in CMO Growth", "16 Reels/mo — product showcases, UGC, unboxings, tutorials", "Custom AI shopping assistant for your store", "White-glove onboarding + dedicated strategist", "Priority support + daily Slack access"],
    "cta": "your Shopify store",
  },
  {
    "slug": "dtc", "folder": "industries/ecommerce/dtc",
    "parent_slug": "ecommerce", "parent_label": "E-commerce",
    "emoji": "📦", "label": "DTC Brands",
    "title": "AI Marketing for DTC Brands",
    "meta_desc": "Own your customer relationship. AI marketing for direct-to-consumer brands — lower CAC, higher LTV, and brand authority that doesn't depend on Amazon from $249/mo.",
    "hero_headline": "Own Your Customers.<br><span class='hl'>Don't Rent Them from Amazon.</span>",
    "hero_sub": "Amazon takes your margin, owns your customer data, and can de-list you tomorrow. We build the direct channel — SEO, email, paid, and AI search — that makes your brand own its growth.",
    "pain_label": "The DTC brand marketing problem",
    "pains": [
      ("Amazon dependency is a single point of failure", "If Amazon changes its algorithm or a competitor undercuts you, your revenue disappears overnight. We build the direct channel that makes Amazon a bonus, not a lifeline."),
      ("Customer acquisition costs are unsustainable", "DTC brands that rely only on paid social for acquisition eventually hit a CAC ceiling. We diversify with SEO, influencer, email, and community — channels that compound over time."),
      ("Brand story isn't cutting through", "In a crowded DTC market, product alone doesn't win. We build the brand content and AI search presence that makes your story the reason customers choose you over a cheaper alternative."),
    ],
    "results": ["+43% direct channel revenue", "-28% blended CAC", "3.6x customer LTV improvement"],
    "lite": ["DTC brand SEO + content strategy", "Monthly content: brand story, product education, founder content", "AEO — cited when AI recommends products in your category", "NWM CRM for email &amp; SMS retention flows", "Monthly strategy note"],
    "growth": ["Everything in CMO Lite", "Meta + Google + TikTok paid acquisition", "Post-purchase LTV optimization sequences", "Influencer &amp; UGC content coordination", "AI SDR for VIP customer &amp; wholesale outreach"],
    "scale": ["Everything in CMO Growth", "16 Reels/mo — product stories, founder content, customer results", "Custom AI shopping assistant for your DTC site", "White-glove onboarding + dedicated strategist", "Priority support + daily Slack access"],
    "cta": "your DTC brand",
  },
  {
    "slug": "marketplace", "folder": "industries/ecommerce/marketplace",
    "parent_slug": "ecommerce", "parent_label": "E-commerce",
    "emoji": "🏪", "label": "Marketplace Sellers",
    "title": "AI Marketing for Marketplace Sellers",
    "meta_desc": "Diversify beyond Amazon and eBay. AI marketing for marketplace sellers building their own brand and direct channel — from $249/mo.",
    "hero_headline": "Stop Renting Customers<br><span class='hl'>from Marketplace Platforms.</span>",
    "hero_sub": "Amazon, eBay, and Etsy own your customer data and can change the rules tomorrow. We help marketplace sellers build the direct brand and owned channel that makes platform dependency optional.",
    "pain_label": "The marketplace seller marketing problem",
    "pains": [
      ("Platform algorithm changes wipe out rankings overnight", "One Amazon algorithm update can destroy months of rank-building work. We build the off-platform SEO, content, and paid channels that keep your revenue growing regardless of marketplace changes."),
      ("No customer data means no retention", "Marketplaces own your customer emails. We build the DTC funnel that captures buyer data and builds a retention engine you actually own."),
      ("Price competition is a race to the bottom", "Competing on price alone destroys margins. We build the brand and content authority that makes customers pay a premium to buy directly from you."),
    ],
    "results": ["+48% direct-channel revenue", "+35% repeat buyer rate", "3.4x customer LTV vs marketplace-only"],
    "lite": ["Brand SEO + product content strategy", "Monthly content: product features, brand story, comparison guides", "AEO — cited when AI recommends products in your category", "NWM CRM for direct channel email &amp; SMS", "Monthly strategy note"],
    "growth": ["Everything in CMO Lite", "Google Shopping + Meta catalog ads for direct channel", "Post-purchase email flows for marketplace converts", "Brand launch &amp; direct channel promotion campaigns", "AI SDR for wholesale &amp; B2B inquiry qualification"],
    "scale": ["Everything in CMO Growth", "16 Reels/mo — product showcases, brand story, customer results", "Custom AI shopping assistant for your direct site", "White-glove onboarding + dedicated strategist", "Priority support + daily Slack access"],
    "cta": "your marketplace business",
  },
  # ── HOME SERVICES ─────────────────────────────────────────────────────────
  {
    "slug": "contractors", "folder": "industries/home-services/contractors",
    "parent_slug": "home", "parent_label": "Home Services",
    "emoji": "🔨", "label": "Contractors",
    "title": "AI Marketing for Contractors",
    "meta_desc": "More jobs, fewer slow weeks. AI marketing for general contractors — local lead generation, AI SDR follow-up, and Google dominance from $249/mo.",
    "hero_headline": "More Jobs.<br><span class='hl'>Fewer Slow Weeks.</span>",
    "hero_sub": "The best contractors in your market aren't the ones doing the best work — they're the ones showing up first online. We make sure that's you, with local SEO, paid ads, and AI-powered lead follow-up.",
    "pain_label": "The contractor marketing problem",
    "pains": [
      ("Feast-or-famine project pipeline", "One big project ends and you're back to chasing leads. We build the consistent inbound pipeline through Google, local SEO, and AI search that keeps your crew booked 8–12 weeks out."),
      ("Losing bids because you responded too slowly", "Homeowners contact 3 contractors and hire whoever calls back first. Our AI SDR responds to every web inquiry in under 2 minutes — before your competitor even checks their email."),
      ("Reviews and portfolio aren't driving decisions", "Homeowners research contractors obsessively. We build the Google review strategy, project portfolio content, and local authority that makes you the obvious choice."),
    ],
    "results": ["+64% inbound lead volume", "2-min AI SDR response", "Top 3 contractor in local AI search"],
    "lite": ["Local SEO + contractor keyword strategy", "Monthly content: project showcases, process explainers, testimonials", "AEO — cited when AI recommends contractors near you", "NWM CRM for estimate follow-up &amp; review automation", "Monthly strategy note"],
    "growth": ["Everything in CMO Lite", "Google Local Service Ads + Meta retargeting", "Automated estimate follow-up &amp; review request sequences", "Seasonal service promotion campaigns", "AI SDR — responds to leads 24/7, books estimates"],
    "scale": ["Everything in CMO Growth", "16 Reels/mo — project before/afters, crew spotlights, process tours", "Custom AI quote assistant for your website", "White-glove onboarding + dedicated strategist", "Priority support + daily Slack access"],
    "cta": "your contracting business",
  },
  {
    "slug": "plumbers", "folder": "industries/home-services/plumbers",
    "parent_slug": "home", "parent_label": "Home Services",
    "emoji": "🔧", "label": "Plumbers",
    "title": "AI Marketing for Plumbers",
    "meta_desc": "Be the first plumber they call. AI marketing for plumbing businesses — Google dominance, AI search visibility, and 24/7 lead response from $249/mo.",
    "hero_headline": "Be the First Plumber<br><span class='hl'>They Call Every Time.</span>",
    "hero_sub": "When a pipe bursts at 11pm, people call whoever they find first on Google. We make sure that's you — with local SEO, AI search optimization, and round-the-clock lead response.",
    "pain_label": "The plumbing business marketing problem",
    "pains": [
      ("Emergency calls go to whoever ranks first on Google", "Plumbing is one of the highest-intent local searches on Google. We dominate your local map pack and organic rankings so emergency calls go to you, not a competitor."),
      ("Slow seasons leave trucks idle", "Water heaters and drain cleanings aren't seasonal — but your marketing might be. We build year-round campaigns and seasonal maintenance promotions that keep your team busy in slow months."),
      ("One-time emergency customers never become regulars", "Every emergency job is a chance to become someone's go-to plumber. We build the post-service follow-up and maintenance reminder system that turns a one-time call into a lifetime relationship."),
    ],
    "results": ["+69% Google map pack visibility", "+45% repeat service calls", "2-min AI lead response"],
    "lite": ["Google My Business + plumbing local SEO", "Monthly content: maintenance tips, service explainers, emergency guides", "AEO — cited when AI recommends plumbers near you", "NWM CRM for follow-up &amp; maintenance reminder automation", "Monthly strategy note"],
    "growth": ["Everything in CMO Lite", "Google Local Service Ads (Google Guaranteed)", "Seasonal maintenance campaign automation", "Review request sequences after every completed job", "AI SDR — responds to leads 24/7, books service calls"],
    "scale": ["Everything in CMO Growth", "16 Reels/mo — job showcases, tips, team features", "Custom AI booking assistant for your website", "White-glove onboarding + dedicated strategist", "Priority support + daily Slack access"],
    "cta": "your plumbing business",
  },
  {
    "slug": "landscaping", "folder": "industries/home-services/landscaping",
    "parent_slug": "home", "parent_label": "Home Services",
    "emoji": "🌿", "label": "Landscaping",
    "title": "AI Marketing for Landscaping Companies",
    "meta_desc": "Fill your route and keep it full. AI marketing for landscaping and lawn care companies — new client acquisition, seasonal upsells, and local dominance from $249/mo.",
    "hero_headline": "Fill Your Route.<br><span class='hl'>Keep It Full Year-Round.</span>",
    "hero_sub": "A full route is a profitable business. We build the local SEO, paid ads, and automated follow-up that fills your maintenance schedule, sells seasonal services, and grows your residential and commercial contracts.",
    "pain_label": "The landscaping marketing problem",
    "pains": [
      ("Spring rush doesn't last all year", "Spring is easy. Winter isn't. We build seasonal service campaigns — aeration, mulching, snow removal, holiday lighting — that generate revenue in every season."),
      ("Commercial contracts are worth gold but hard to win", "One commercial property management contract can replace 20 residential accounts. We build the outbound strategy and content authority that gets you in front of property managers and HOAs."),
      ("No system for upselling existing clients", "Your current lawn maintenance clients are your best prospects for landscape design, irrigation, and hardscaping. We build the automated sequences that introduce these services at the right moment."),
    ],
    "results": ["+53% new residential contracts", "+38% seasonal upsell revenue", "Top local landscaper in AI search"],
    "lite": ["Local SEO + landscaping keyword strategy", "Monthly content: project showcases, seasonal tips, before/afters", "AEO — cited when AI recommends landscapers near you", "NWM CRM for seasonal upsell &amp; follow-up automation", "Monthly strategy note"],
    "growth": ["Everything in CMO Lite", "Google Local Service Ads + Meta ads", "Seasonal service campaign automation", "Commercial property &amp; HOA outreach sequences", "AI SDR — responds to quotes 24/7, books estimates"],
    "scale": ["Everything in CMO Growth", "16 Reels/mo — transformations, seasonal work, project showcases", "Custom AI quote assistant for your website", "White-glove onboarding + dedicated strategist", "Priority support + daily Slack access"],
    "cta": "your landscaping business",
  },
  # ── TECH & SAAS ───────────────────────────────────────────────────────────
  {
    "slug": "saas", "folder": "industries/tech-saas/saas",
    "parent_slug": "tech", "parent_label": "Tech &amp; SaaS",
    "emoji": "☁️", "label": "SaaS Companies",
    "title": "AI Marketing for SaaS Companies",
    "meta_desc": "More trials, less churn, faster growth. AI marketing for SaaS companies — pipeline generation, AEO authority, and product-led growth from $249/mo.",
    "hero_headline": "More Trials.<br><span class='hl'>Shorter Sales Cycles.</span>",
    "hero_sub": "Your SaaS has great retention — the problem is filling the top of the funnel without hemorrhaging on paid acquisition. We build the content authority, AEO, and AI-powered outbound that compounds over time.",
    "pain_label": "The SaaS marketing problem",
    "pains": [
      ("Paid acquisition is your only growth lever", "When your Google Ads pause, pipeline pauses with it. We build organic SEO, AEO, and content authority that generates inbound leads independent of ad spend — and compounds over time."),
      ("AI tools don't recommend you to prospects", "B2B buyers now use Claude and ChatGPT to evaluate SaaS options before visiting your site. If AI doesn't know your product's use cases and differentiators, you're not in the consideration set."),
      ("Trial-to-paid conversion is leaving money on the table", "Most SaaS companies focus on acquisition and ignore the trial-to-paid funnel. We build the email sequences, in-app messaging strategy, and content that converts free users to paying customers."),
    ],
    "results": ["-33% CAC via content channels", "Top 3 AEO citation in target use cases", "+29% trial-to-paid conversion"],
    "lite": ["SaaS SEO + use case &amp; comparison keyword strategy", "Monthly technical blog, comparison pages &amp; integration content", "AEO — cited when AI recommends tools in your category", "NWM CRM for trial nurture &amp; lead sequences", "Monthly strategy note"],
    "growth": ["Everything in CMO Lite", "Google Search + LinkedIn paid campaigns", "Trial onboarding email sequences", "Competitor comparison &amp; battle card content", "AI SDR for demo scheduling &amp; enterprise qualification"],
    "scale": ["Everything in CMO Growth", "16 Reels/mo — product demos, customer stories, feature spotlights", "Custom AI sales assistant for your site", "White-glove onboarding + dedicated strategist", "Priority support + daily Slack access"],
    "cta": "your SaaS company",
  },
  {
    "slug": "startups", "folder": "industries/tech-saas/startups",
    "parent_slug": "tech", "parent_label": "Tech &amp; SaaS",
    "emoji": "🚀", "label": "Tech Startups",
    "title": "AI Marketing for Tech Startups",
    "meta_desc": "Go to market fast. AI marketing for tech startups — launch strategy, early traction, and investor-grade pipeline from $249/mo.",
    "hero_headline": "Go to Market Fast.<br><span class='hl'>Build Traction That Investors See.</span>",
    "hero_sub": "You have a limited runway and need to show traction. We build the launch strategy, content engine, and AI-powered outbound that generates early customers, case studies, and pipeline — fast.",
    "pain_label": "The tech startup marketing problem",
    "pains": [
      ("No time or budget for a full marketing team", "You need to move fast, spend smart, and show results before your runway runs out. Our AI-powered fractional CMO model gives you a full marketing function for a fraction of the cost."),
      ("Early customers are critical — and hard to find", "Your first 10 customers validate your product and build the social proof that attracts the next 100. We build the outbound sequences and content that finds and converts those early adopters."),
      ("Investors expect marketing momentum", "VCs and angels look at organic traction, inbound velocity, and brand authority. We build the metrics and presence that strengthen your Series A narrative."),
    ],
    "results": ["+54% early customer pipeline", "Investor-grade traction metrics", "Launch in 30 days or less"],
    "lite": ["Launch SEO strategy + early keyword targeting", "Monthly content: product story, founder POV, use case content", "AEO — cited when AI recommends solutions in your space", "NWM CRM for early prospect &amp; investor nurture", "Monthly strategy note"],
    "growth": ["Everything in CMO Lite", "LinkedIn + Google ads for early customer acquisition", "Product Hunt &amp; launch platform coordination", "Email sequences for beta users and early adopters", "AI SDR for demo scheduling &amp; partnership outreach"],
    "scale": ["Everything in CMO Growth", "16 Reels/mo — product demos, founder story, customer interviews", "Custom AI demo assistant for your site", "White-glove onboarding + dedicated strategist", "Priority support + daily Slack access"],
    "cta": "your startup",
  },
  {
    "slug": "agencies", "folder": "industries/tech-saas/agencies",
    "parent_slug": "tech", "parent_label": "Tech &amp; SaaS",
    "emoji": "📣", "label": "Marketing Agencies",
    "title": "AI Marketing for Marketing Agencies",
    "meta_desc": "Grow your agency with AI. White-label AI marketing infrastructure for agencies — more clients, better margins, and AI-powered delivery from $249/mo.",
    "hero_headline": "Grow Your Agency<br><span class='hl'>With White-Label AI.</span>",
    "hero_sub": "Stop paying HubSpot $3,600/mo and building manual reports. We give agencies the AI-powered platform, white-label tools, and delivery infrastructure that lets you serve more clients with higher margins.",
    "pain_label": "The marketing agency problem",
    "pains": [
      ("Tool costs are eating your margins", "HubSpot, Semrush, Hootsuite, Mailchimp — the stack adds up to $2,000–$4,000/mo before you serve a single client. NWM's all-in-one platform cuts that to a fraction."),
      ("Client reporting takes too many hours", "Manual reporting is billable work you're doing for free. We automate client reporting, dashboards, and performance summaries so your team spends time on strategy, not spreadsheets."),
      ("You're selling time, not results", "Agencies that sell hours hit a ceiling. We help you productize your services into retainer packages — with AI doing the heavy lifting — so you scale revenue without scaling headcount."),
    ],
    "results": ["-60% tool &amp; platform costs", "3x client capacity per team member", "+44% agency profit margin"],
    "lite": ["Agency positioning SEO + new business content", "Monthly thought leadership: marketing insights, case studies", "AEO — cited when AI recommends marketing agencies", "NWM CRM white-labeled for client management", "Monthly strategy note"],
    "growth": ["Everything in CMO Lite", "LinkedIn + Google ads for agency new business", "Outbound sequences for ideal client acquisition", "Case study &amp; social proof content production", "AI SDR for new business inquiry qualification"],
    "scale": ["Everything in CMO Growth", "16 Reels/mo — agency culture, client results, thought leadership", "Custom AI new business assistant for your agency site", "White-glove onboarding + dedicated strategist", "Priority support + daily Slack access"],
    "cta": "your agency",
  },
]

CSS = """
    .ind-hero{padding:120px 20px 60px;text-align:center;max-width:900px;margin:0 auto}
    .ind-hero .eyebrow{display:inline-flex;align-items:center;gap:8px;background:var(--nwm-orange);color:#fff;padding:6px 16px;border-radius:var(--radius-pill);font-size:12px;font-weight:800;letter-spacing:.12em;text-transform:uppercase;margin-bottom:24px}
    .breadcrumb{display:flex;align-items:center;gap:6px;justify-content:center;margin-bottom:16px;font-size:13px;color:var(--text-muted)}
    .breadcrumb a{color:var(--nwm-orange);text-decoration:none}
    .breadcrumb a:hover{text-decoration:underline}
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

def esc_attr(s):
    """Escape text for use inside a data-* attribute value."""
    return s.replace('"', '&quot;')

def build_page(v):
    # Pains: render each card with data-en / data-es (fallback to English for ES)
    pain_cards = ""
    for t, d in v["pains"]:
        pain_cards += f"""
        <div class="pain-card">
          <h3 data-en="{esc_attr(t)}" data-es="{esc_attr(t)}">{t}</h3>
          <p data-en="{esc_attr(d)}" data-es="{esc_attr(d)}">{d}</p>
        </div>"""

    lite_lis  = "\n".join(f'            <li data-en="{esc_attr(f)}" data-es="{esc_attr(f)}">{f}</li>' for f in v["lite"])
    grow_lis  = "\n".join(f'            <li data-en="{esc_attr(f)}" data-es="{esc_attr(f)}">{f}</li>' for f in v["growth"])
    scale_lis = "\n".join(f'            <li data-en="{esc_attr(f)}" data-es="{esc_attr(f)}">{f}</li>' for f in v["scale"])
    r1, r2, r3 = v["results"]

    parent_label_es = PARENT_ES.get(v["parent_label"], v["parent_label"])
    label_es = v["label"]  # subcategory label stays (mostly proper nouns)

    return f"""<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>{v["title"]} | NetWebMedia</title>
  <meta name="description" content="{v["meta_desc"]}">
  <link rel="canonical" href="https://{v["slug"]}.netwebmedia.com">
  <meta property="og:title" content="{v["title"]} | NetWebMedia">
  <meta property="og:description" content="{v["meta_desc"]}">
  <meta property="og:url" content="https://{v["slug"]}.netwebmedia.com">
  <meta property="og:type" content="website">
  <link rel="icon" type="image/svg+xml" href="https://netwebmedia.com/assets/nwm-logo.svg">
  <link rel="stylesheet" href="https://netwebmedia.com/css/styles.css">
  <style>{CSS}</style>
</head>
<body>

{NAV}

<main>
  <div class="ind-hero">
    <div class="breadcrumb">
      <a href="https://netwebmedia.com/industries/" data-en="Industries" data-es="Industrias">Industries</a>
      <span>/</span>
      <a href="https://{v["parent_slug"]}.netwebmedia.com" data-en="{esc_attr(v['parent_label'])}" data-es="{esc_attr(parent_label_es)}">{v["parent_label"]}</a>
      <span>/</span>
      <span data-en="{esc_attr(v['label'])}" data-es="{esc_attr(label_es)}">{v["label"]}</span>
    </div>
    <div class="eyebrow">{v["emoji"]} <span data-en="{esc_attr(v['label'])}" data-es="{esc_attr(label_es)}">{v["label"]}</span></div>
    <h1 data-en="{esc_attr(v['hero_headline'])}" data-es="{esc_attr(v['hero_headline'])}">{v["hero_headline"]}</h1>
    <p class="sub" data-en="{esc_attr(v['hero_sub'])}" data-es="{esc_attr(v['hero_sub'])}">{v["hero_sub"]}</p>
    <div class="hero-ctas">
      <a href="https://netwebmedia.com/contact.html" class="btn-primary" data-en="Get a Free Audit &rarr;" data-es="Auditoría Gratis &rarr;">Get a Free Audit &rarr;</a>
      <a href="https://{v["parent_slug"]}.netwebmedia.com" class="btn-ghost-white" data-en="Back to {esc_attr(v['parent_label'])}" data-es="Volver a {esc_attr(parent_label_es)}">Back to {v["parent_label"]}</a>
    </div>
  </div>

  <div class="results-bar">
    <div class="result-stat"><div class="n">{r1}</div><div class="l" data-en="Client avg result" data-es="Resultado promedio">Client avg result</div></div>
    <div class="result-stat"><div class="n">{r2}</div><div class="l" data-en="Client avg result" data-es="Resultado promedio">Client avg result</div></div>
    <div class="result-stat"><div class="n">{r3}</div><div class="l" data-en="Client avg result" data-es="Resultado promedio">Client avg result</div></div>
  </div>

  <hr class="divider">

  <div class="section">
    <div class="section-label" data-en="{esc_attr(v['pain_label'])}" data-es="{esc_attr(v['pain_label'])}">{v["pain_label"]}</div>
    <div class="section-title" data-en="Why most {esc_attr(v['cta'])} struggles with marketing" data-es="Por qué la mayoría de {esc_attr(v['cta'])} falla en marketing">Why most {v["cta"]}<br>struggles with marketing</div>
    <div class="pain-grid">{pain_cards}
    </div>
  </div>

  <hr class="divider">

  <div class="section">
    <div class="section-label" style="text-align:center" data-en="Fractional CMO Retainer — Built for {esc_attr(v['label'])}" data-es="CMO Fraccional — Diseñado para {esc_attr(label_es)}">Fractional CMO Retainer &mdash; Built for {v["label"]}</div>
    <div class="section-title" style="text-align:center" data-en="Your entire marketing function, fully managed by AI + humans." data-es="Toda tu función de marketing, gestionada por IA + humanos.">Your entire marketing function,<br>fully managed by AI + humans.</div>
    <p style="text-align:center;color:var(--text-muted);font-size:15px;margin-top:-32px;margin-bottom:48px" data-en="90-day minimum · month-to-month thereafter · All plans include NWM CRM (46 modules)" data-es="Mínimo 90 días · mes a mes después · Todos los planes incluyen NWM CRM (46 módulos)">90-day minimum &middot; month-to-month thereafter &middot; All plans include NWM CRM (46 modules)</p>
    <div class="pricing-grid">

      <div class="price-card">
        <div class="price-tier">CMO Lite</div>
        <div class="price-name">CMO Lite</div>
        <div class="price-desc" data-en="AEO + SEO + content strategy" data-es="AEO + SEO + estrategia de contenido">AEO + SEO + content strategy</div>
        <div class="price-amount">$249<span data-en="/mo" data-es="/mes">/mo</span></div>
        <div class="price-setup" data-en="No setup fee" data-es="Sin costo de setup">No setup fee</div>
        <ul class="price-features">
{lite_lis}
        </ul>
        <a href="https://netwebmedia.com/contact.html" class="price-cta outline" data-en="Get started &rarr;" data-es="Comenzar &rarr;">Get started &rarr;</a>
      </div>

      <div class="price-card featured">
        <div class="price-badge" data-en="Most Popular" data-es="Más Popular">Most Popular</div>
        <div class="price-tier">CMO Growth</div>
        <div class="price-name">CMO Growth</div>
        <div class="price-desc" data-en="AEO + SEO + paid ads + social" data-es="AEO + SEO + publicidad paga + social">AEO + SEO + paid ads + social</div>
        <div class="price-amount">$999<span data-en="/mo" data-es="/mes">/mo</span></div>
        <div class="price-setup" data-en="Setup $499" data-es="Setup $499">Setup $499</div>
        <ul class="price-features">
{grow_lis}
        </ul>
        <a href="https://netwebmedia.com/contact.html" class="price-cta solid" data-en="Get started &rarr;" data-es="Comenzar &rarr;">Get started &rarr;</a>
      </div>

      <div class="price-card">
        <div class="price-tier">CMO Scale</div>
        <div class="price-name">CMO Scale</div>
        <div class="price-desc" data-en="Full-stack marketing department" data-es="Departamento de marketing completo">Full-stack marketing department</div>
        <div class="price-amount">$2,499<span data-en="/mo" data-es="/mes">/mo</span></div>
        <div class="price-setup" data-en="Setup $999" data-es="Setup $999">Setup $999</div>
        <ul class="price-features">
{scale_lis}
        </ul>
        <a href="https://netwebmedia.com/contact.html" class="price-cta outline" data-en="Contact sales &rarr;" data-es="Contactar ventas &rarr;">Contact sales &rarr;</a>
      </div>

    </div>
    <p style="text-align:center;color:var(--text-muted);font-size:13px;margin-top:24px" data-en="+ ad spend at cost · 12% mgmt fee on ad spend (min $300/mo) · Questions? hello@netwebmedia.com" data-es="+ inversión publicitaria al costo · 12% fee de gestión (mín $300/mes) · ¿Preguntas? hello@netwebmedia.com">+ ad spend at cost &middot; 12% mgmt fee on ad spend (min $300/mo) &middot; <a href="https://netwebmedia.com/contact.html" style="color:var(--nwm-orange)">Questions? hello@netwebmedia.com</a></p>
  </div>

  <hr class="divider">

  <div class="final-cta-wrap">
    <h2 data-en="Ready to grow {esc_attr(v['cta'])}?" data-es="¿Listo para crecer {esc_attr(v['cta'])}?">Ready to grow {v["cta"]}?</h2>
    <p data-en="Get a free 30-minute audit. We'll show you exactly where you're losing visibility and revenue — and what to do about it." data-es="Obtén una auditoría gratis de 30 minutos. Te mostraremos exactamente dónde estás perdiendo visibilidad e ingresos — y qué hacer al respecto.">Get a free 30-minute audit. We&rsquo;ll show you exactly where you&rsquo;re losing visibility and revenue &mdash; and what to do about it.</p>
    <a href="https://netwebmedia.com/contact.html" class="btn-primary" style="font-size:18px;padding:18px 40px" data-en="Book Your Free Audit &rarr;" data-es="Reserva tu Auditoría Gratis &rarr;">Book Your Free Audit &rarr;</a>
  </div>
</main>

<footer>
  <p>&copy; 2026 <a href="https://netwebmedia.com">NetWebMedia</a> &middot; <a href="https://netwebmedia.com/privacy.html" data-en="Privacy" data-es="Privacidad">Privacy</a> &middot; <a href="https://netwebmedia.com/terms.html" data-en="Terms" data-es="Términos">Terms</a> &middot; hello@netwebmedia.com</p>
</footer>

<script src="https://netwebmedia.com/js/main.js"></script>
</body>
</html>"""

base = r'C:\Users\Usuario\Desktop\NetWebMedia'
for v in SUBCATEGORIES:
    path = os.path.join(base, v["folder"], "index.html")
    os.makedirs(os.path.dirname(path), exist_ok=True)
    with open(path, 'w', encoding='utf-8') as f:
        f.write(build_page(v))
    print(f"built: {v['folder']}/index.html  ({v['slug']}.netwebmedia.com)")

print(f"\nDone — {len(SUBCATEGORIES)} subcategory pages built.")
