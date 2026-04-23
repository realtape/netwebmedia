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
            <a href="https://hospitality.netwebmedia.com">&#127970; <span data-en="Hospitality" data-es="Hospitalidad">Hospitality</span></a>
            <a href="https://healthcare.netwebmedia.com">&#129657; <span data-en="Healthcare" data-es="Salud">Healthcare</span></a>
            <a href="https://beauty.netwebmedia.com">&#10024; <span data-en="Beauty &amp; Wellness" data-es="Belleza y Bienestar">Beauty &amp; Wellness</span></a>
            <a href="https://pro.netwebmedia.com">&#128188; <span data-en="Professional Services" data-es="Servicios Profesionales">Professional Services</span></a>
            <a href="https://realestate.netwebmedia.com">&#127968; <span data-en="Real Estate" data-es="Bienes Ra&iacute;ces">Real Estate</span></a>
            <a href="https://restaurants.netwebmedia.com">&#127829; <span data-en="Restaurants &amp; F&amp;B" data-es="Restaurantes y F&amp;B">Restaurants &amp; F&amp;B</span></a>
            <a href="https://fitness.netwebmedia.com">&#127947; <span data-en="Fitness &amp; Gyms" data-es="Fitness y Gimnasios">Fitness &amp; Gyms</span></a>
            <a href="https://ecommerce.netwebmedia.com">&#128722; <span data-en="E-commerce" data-es="E-commerce">E-commerce</span></a>
            <a href="https://home.netwebmedia.com">&#128295; <span data-en="Home Services" data-es="Servicios del Hogar">Home Services</span></a>
            <a href="https://tech.netwebmedia.com">&#128187; <span data-en="Tech &amp; SaaS" data-es="Tech y SaaS">Tech &amp; SaaS</span></a>
          </div>
        </div>
        <a href="https://netwebmedia.com/partners.html" data-en="Partners" data-es="Socios">Partners</a>
        <a href="https://netwebmedia.com/blog.html" data-en="Blog" data-es="Blog">Blog</a>
        <a href="https://netwebmedia.com/faq.html" data-en="Q&amp;A" data-es="Preguntas">Q&amp;A</a>
        <a href="https://netwebmedia.com/contact.html" data-en="Contact" data-es="Contacto">Contact</a>
      </div>
      <div class="nav-ctas">
        <a href="https://netwebmedia.com/contact.html" class="btn-nav-solid" data-en="Get a Free Audit" data-es="Auditor&iacute;a Gratis">Get a Free Audit</a>
      </div>
      <button class="nav-hamburger" id="navHamburger" aria-label="Open menu">
        <span></span><span></span><span></span>
      </button>
    </div>
  </div>
</nav>"""

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
    "growth": [("Everything in CMO Lite","Todo en CMO Lite"),("Google + Meta paid ads (retargeting + lookalike)","Anuncios pagados en Google + Meta (retargeting + lookalike)"),("Review generation automation","Automatizaci\u00f3n de generaci\u00f3n de rese\u00f1as"),("Email marketing to past guests","Email marketing para hu\u00e9spedes anteriores"),("AI SDR for group &amp; event inquiries","SDR de IA para consultas de grupos y eventos")],
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
    "growth": [("Everything in CMO Lite","Todo en CMO Lite"),("Google Ads (search + display) &amp; Meta retargeting","Google Ads (b\u00fasqueda + display) y retargeting en Meta"),("Automated appointment reminder &amp; recall sequences","Recordatorios de citas automatizados y secuencias de recall"),("Review generation on Google &amp; Healthgrades","Generaci\u00f3n de rese\u00f1as en Google y Healthgrades"),("AI SDR for new patient lead qualification","SDR de IA para calificaci\u00f3n de leads de nuevos pacientes")],
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
    "growth": [("Everything in CMO Lite","Todo en CMO Lite"),("Meta (Instagram + Facebook) paid ads","Anuncios pagados en Meta (Instagram + Facebook)"),("Automated rebooking + loyalty sequences","Secuencias automatizadas de re-reserva + fidelizaci\u00f3n"),("Influencer &amp; UGC content coordination","Coordinaci\u00f3n de contenido con influencers y UGC"),("AI SDR for new client lead qualification","SDR de IA para calificaci\u00f3n de leads de nuevos clientes")],
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
    "growth": [("Everything in CMO Lite","Todo en CMO Lite"),("Google Search Ads for high-intent keywords","Google Search Ads para keywords de alta intenci\u00f3n"),("LinkedIn content + lead gen campaigns","Contenido en LinkedIn + campa\u00f1as de generaci\u00f3n de leads"),("Email nurture sequences for prospects","Secuencias de nurture por email para prospectos"),("AI SDR for initial inquiry qualification","SDR de IA para calificaci\u00f3n inicial de consultas")],
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
    "growth": [("Everything in CMO Lite","Todo en CMO Lite"),("Google + Meta listing promotion ads","Anuncios de promoci\u00f3n de listados en Google + Meta"),("Automated lead follow-up + showing scheduler","Seguimiento automatizado de leads + agendador de visitas"),("Email campaigns to past clients for referrals","Campa\u00f1as de email a clientes anteriores para referidos"),("AI SDR \u2014 qualifies &amp; books leads 24/7","SDR de IA \u2014 califica y agenda leads 24/7")],
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
    "growth": [("Everything in CMO Lite","Todo en CMO Lite"),("Meta + Google Ads (local awareness + retargeting)","Anuncios en Meta + Google (awareness local + retargeting)"),("Automated review request sequences","Secuencias automatizadas de solicitud de rese\u00f1as"),("Event &amp; private dining promotion campaigns","Campa\u00f1as de promoci\u00f3n de eventos y cenas privadas"),("AI SDR for reservation &amp; event inquiries","SDR de IA para consultas de reservas y eventos")],
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
    "growth": [("Everything in CMO Lite","Todo en CMO Lite"),("Meta + Google Ads for new member acquisition","Anuncios en Meta + Google para adquisici\u00f3n de nuevos miembros"),("Automated trial-to-member conversion sequences","Secuencias automatizadas de conversi\u00f3n de prueba a miembro"),("Challenge &amp; event promotion campaigns","Campa\u00f1as de promoci\u00f3n de retos y eventos"),("AI SDR to qualify &amp; book free trial visits 24/7","SDR de IA para calificar y agendar visitas de prueba 24/7")],
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
    "growth": [("Everything in CMO Lite","Todo en CMO Lite"),("Google Shopping + Meta catalog ads","Google Shopping + anuncios de cat\u00e1logo en Meta"),("Abandoned cart &amp; browse abandonment sequences","Secuencias de carrito abandonado y abandono de navegaci\u00f3n"),("Post-purchase upsell &amp; loyalty email flows","Flujos de email de upsell post-compra y fidelizaci\u00f3n"),("AI SDR for high-value customer outreach","SDR de IA para contacto de clientes de alto valor")],
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
    "growth": [("Everything in CMO Lite","Todo en CMO Lite"),("Google Local Service Ads + Meta retargeting","Google Local Service Ads + retargeting en Meta"),("Automated estimate follow-up &amp; review requests","Seguimiento automatizado de presupuestos y solicitud de rese\u00f1as"),("Seasonal promotion campaigns","Campa\u00f1as de promoci\u00f3n estacional"),("AI SDR \u2014 responds to leads 24/7, books estimates","SDR de IA \u2014 responde leads 24/7, agenda presupuestos")],
    "scale": [("Everything in CMO Growth","Todo en CMO Growth"),("16 Reels/mo \u2014 project before/afters, team spotlights","16 Reels/mes \u2014 antes/despu\u00e9s de proyectos, spotlights del equipo"),("Custom AI quote assistant for your website","Asistente de cotizaci\u00f3n IA personalizado para tu sitio web"),("White-glove onboarding + dedicated strategist","Incorporaci\u00f3n premium + estratega dedicado"),("Priority support + daily Slack access","Soporte prioritario + acceso diario a Slack")],
    "cta_en": "contractors, plumbers, electricians &amp; home service pros", "cta_es": "contratistas, plomeros, electricistas y profesionales del hogar",
    "subcats": [
      {"slug":"contractors","emoji":"&#128296;","name_en":"Contractors","name_es":"Contratistas","desc_en":"More jobs, fewer slow weeks","desc_es":"M\u00e1s trabajos, menos semanas lentas"},
      {"slug":"plumbers","emoji":"&#128295;","name_en":"Plumbers","name_es":"Plomeros","desc_en":"First call every time","desc_es":"La primera llamada cada vez"},
      {"slug":"landscaping","emoji":"&#127807;","name_en":"Landscaping","name_es":"Landscaping","desc_en":"Fill your route year-round","desc_es":"Llena tu ruta todo el a\u00f1o"},
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
    "growth": [("Everything in CMO Lite","Todo en CMO Lite"),("Google Search + LinkedIn paid campaigns","Campa\u00f1as pagadas en Google Search + LinkedIn"),("Email nurture sequences for trial &amp; demo leads","Secuencias de nurture por email para leads de prueba y demo"),("Competitor comparison &amp; battle card content","Contenido de comparaci\u00f3n y battle cards contra competidores"),("AI SDR for demo scheduling &amp; qualification","SDR de IA para agendar demos y calificaci\u00f3n")],
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
    <div class="eyebrow" data-en="{v['eyebrow_en']}" data-es="{v['eyebrow_es']}">{v['emoji']} {v['eyebrow_en']}</div>
    <h1>
      <span data-en="{v['h1_line1_en']}" data-es="{v['h1_line1_es']}">{v['h1_line1_en']}</span><br>
      <span class="hl" data-en="{v['h1_hl_en']}" data-es="{v['h1_hl_es']}">{v['h1_hl_en']}</span>
    </h1>
    <p class="sub" data-en="{v['sub_en']}" data-es="{v['sub_es']}">{v['sub_en']}</p>
    <div class="hero-ctas">
      <a href="https://netwebmedia.com/contact.html" class="btn-primary" data-en="Get a Free Audit &rarr;" data-es="Obtener Auditor&iacute;a Gratis &rarr;">Get a Free Audit &rarr;</a>
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
        <div class="price-tier">CMO Lite</div>
        <div class="price-name">CMO Lite</div>
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
        <div class="price-tier">CMO Scale</div>
        <div class="price-name">CMO Scale</div>
        <div class="price-desc" data-en="Full-stack marketing department" data-es="Departamento de marketing completo">Full-stack marketing department</div>
        <div class="price-amount">$2,499<span>/mo</span></div>
        <div class="price-setup" data-en="Setup $999" data-es="Configuraci&oacute;n $999">Setup $999</div>
        <ul class="price-features">
{scale_lis}
        </ul>
        <a href="https://netwebmedia.com/contact.html" class="price-cta outline" data-en="Contact sales &rarr;" data-es="Contactar ventas &rarr;">Contact sales &rarr;</a>
      </div>

    </div>
    <p style="text-align:center;color:var(--text-muted);font-size:13px;margin-top:24px">+ ad spend at cost &middot; 12% mgmt fee on ad spend (min $300/mo) &middot; <a href="https://netwebmedia.com/contact.html" style="color:var(--nwm-orange)">Questions? hello@netwebmedia.com</a></p>
  </div>

  <hr class="divider">

  <div class="final-cta-wrap">
    <h2 data-en="Ready to grow your {v['cta_en']}?" data-es="&iquest;Listo para hacer crecer tu {v['cta_es']}?">Ready to grow your {v['cta_en']}?</h2>
    <p data-en="Get a free 30-minute audit. We&rsquo;ll show you exactly where you&rsquo;re losing visibility and revenue &mdash; and what to do about it." data-es="Obt&eacute;n una auditor&iacute;a gratuita de 30 minutos. Te mostraremos exactamente d&oacute;nde est&aacute;s perdiendo visibilidad e ingresos &mdash; y qu&eacute; hacer al respecto.">Get a free 30-minute audit. We&rsquo;ll show you exactly where you&rsquo;re losing visibility and revenue &mdash; and what to do about it.</p>
    <a href="https://netwebmedia.com/contact.html" class="btn-primary" style="font-size:18px;padding:18px 40px" data-en="Book Your Free Audit &rarr;" data-es="Reservar Tu Auditor&iacute;a Gratis &rarr;">Book Your Free Audit &rarr;</a>
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
