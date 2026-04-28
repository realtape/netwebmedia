"""
Build paid-ad conversion landing pages at subdomain root for all 39 subdomains.
URL pattern: https://{slug}.netwebmedia.com/
Minimal nav, single CTA, bilingual (data-en/data-es).
Framing: free personalized growth plan, delivered via WhatsApp + AI — no phone/video calls.
"""
import os, shutil

LP = [
  # ============ PARENTS (10) ============
  {"slug":"hospitality","folder":"industries/hospitality","label_en":"Hospitality","label_es":"Hospitalidad",
   "noun_en":"your hospitality business","noun_es":"tu negocio hospitalario",
   "promise_en":"More Direct Bookings.","promise_hl_en":"Less OTA Commission.",
   "promise_es":"Más Reservas Directas.","promise_hl_es":"Menos Comisión OTA.",
   "stats":["+42% direct bookings","-24% OTA spend","2-min AI response"],
   "b1_en":"Cut 15–25% OTA commissions with direct booking funnels","b1_es":"Elimina 15–25% de comisiones OTA con embudos directos",
   "b2_en":"Appear in Claude/ChatGPT when travelers ask for recommendations","b2_es":"Aparece en Claude/ChatGPT cuando los viajeros piden recomendaciones",
   "b3_en":"AI SDR qualifies bookings and events 24/7 on WhatsApp","b3_es":"SDR IA califica reservas y eventos 24/7 en WhatsApp"},

  {"slug":"healthcare","folder":"industries/healthcare","label_en":"Healthcare","label_es":"Salud",
   "noun_en":"your practice","noun_es":"tu práctica",
   "promise_en":"More Qualified Patients.","promise_hl_en":"Less No-Shows.",
   "promise_es":"Más Pacientes Calificados.","promise_hl_es":"Menos Ausencias.",
   "stats":["+58% new patients","-34% no-shows","Top 3 AI search"],
   "b1_en":"HIPAA-aware marketing with automated recall sequences","b1_es":"Marketing con normas HIPAA y secuencias de recordatorio automatizadas",
   "b2_en":"Dominate local Google + AI assistant recommendations","b2_es":"Domina Google local + recomendaciones de asistentes IA",
   "b3_en":"AI SDR handles intake, qualification, booking on WhatsApp","b3_es":"SDR IA maneja intake, calificación y reservas en WhatsApp"},

  {"slug":"beauty","folder":"industries/beauty","label_en":"Beauty &amp; Wellness","label_es":"Belleza y Bienestar",
   "noun_en":"your salon or spa","noun_es":"tu salón o spa",
   "promise_en":"Pack Your Books.","promise_hl_en":"Keep Them Full.",
   "promise_es":"Llena Tu Agenda.","promise_hl_es":"Mantenla Llena.",
   "stats":["+47% retention","+38% new clients","4.9★ avg rating"],
   "b1_en":"Fill slow days with targeted local ads and win-back flows","b1_es":"Llena días lentos con publicidad local y campañas win-back",
   "b2_en":"Automated rebooking via SMS + WhatsApp — no staff lift","b2_es":"Rebooking automatizado por SMS + WhatsApp — sin carga al personal",
   "b3_en":"Instagram Reels + AI search presence that convert","b3_es":"Reels + presencia IA que convierten"},

  {"slug":"pro","folder":"industries/professional-services","label_en":"Professional Services","label_es":"Servicios Profesionales",
   "noun_en":"your firm","noun_es":"tu firma",
   "promise_en":"More Qualified Clients.","promise_hl_en":"Less Waiting for Referrals.",
   "promise_es":"Más Clientes Calificados.","promise_hl_es":"Menos Esperar Referidos.",
   "stats":["+71% inbound","Top 3 AI citations","2-min AI intake"],
   "b1_en":"AEO authority — cited when AI recommends firms in your niche","b1_es":"Autoridad AEO — citado cuando la IA recomienda firmas en tu nicho",
   "b2_en":"AI SDR qualifies leads and intakes clients 24/7 on WhatsApp","b2_es":"SDR IA califica leads e ingresa clientes 24/7 por WhatsApp",
   "b3_en":"Content engine that builds trust before first contact","b3_es":"Motor de contenido que genera confianza antes del primer contacto"},

  {"slug":"realestate","folder":"industries/real-estate","label_en":"Real Estate","label_es":"Bienes Raíces",
   "noun_en":"your real estate business","noun_es":"tu negocio inmobiliario",
   "promise_en":"More Listings.","promise_hl_en":"Zero Cold Calling.",
   "promise_es":"Más Listados.","promise_hl_es":"Cero Llamadas en Frío.",
   "stats":["+76% lead response","-45% time to contact","+39% referrals"],
   "b1_en":"AI SDR contacts every lead in under 2 minutes on WhatsApp","b1_es":"SDR IA contacta cada lead en menos de 2 minutos por WhatsApp",
   "b2_en":"Past-client anniversary + market update automation","b2_es":"Automatización de aniversarios + market updates a ex-clientes",
   "b3_en":"Hyperlocal SEO + AI search dominance","b3_es":"SEO hiperlocal + dominio en búsqueda IA"},

  {"slug":"restaurants","folder":"industries/restaurants","label_en":"Restaurants &amp; F&amp;B","label_es":"Restaurantes y F&amp;B",
   "noun_en":"your restaurant","noun_es":"tu restaurante",
   "promise_en":"Packed Every Night.","promise_hl_en":"Not Just on Weekends.",
   "promise_es":"Lleno Cada Noche.","promise_hl_es":"No Solo los Fines de Semana.",
   "stats":["+61% weeknight covers","+88% event pre-sales","4.7★ avg rating"],
   "b1_en":"Targeted weeknight + event promotion campaigns","b1_es":"Campañas dirigidas a noches entre semana + eventos",
   "b2_en":"Automated review generation on Google + Yelp","b2_es":"Generación automatizada de reseñas en Google + Yelp",
   "b3_en":"AI SDR on WhatsApp for private events and buyouts","b3_es":"SDR IA en WhatsApp para eventos privados y reservas completas"},

  {"slug":"fitness","folder":"industries/fitness","label_en":"Fitness &amp; Gyms","label_es":"Fitness y Gimnasios",
   "noun_en":"your gym or studio","noun_es":"tu gimnasio o estudio",
   "promise_en":"More Members.","promise_hl_en":"Less Churn.",
   "promise_es":"Más Miembros.","promise_hl_es":"Menos Cancelaciones.",
   "stats":["-31% churn","+62% trial conversion","Top local in AI"],
   "b1_en":"Trial-to-member conversion sequences that actually work","b1_es":"Secuencias de conversión de prueba a miembro que funcionan",
   "b2_en":"AI detects churn risk and triggers win-back automatically","b2_es":"La IA detecta riesgo de churn y activa win-back automáticamente",
   "b3_en":"AI SDR books free trials 24/7 on WhatsApp","b3_es":"SDR IA agenda pruebas gratis 24/7 por WhatsApp"},

  {"slug":"ecommerce","folder":"industries/ecommerce","label_en":"E-commerce","label_es":"E-commerce",
   "noun_en":"your store","noun_es":"tu tienda",
   "promise_en":"Scale Your Store.","promise_hl_en":"Don't Rent It from Amazon.",
   "promise_es":"Escala Tu Tienda.","promise_hl_es":"No la Rentes de Amazon.",
   "stats":["+39% repeat rate","3.9x ROAS","+180% organic traffic"],
   "b1_en":"Diversify past paid social — SEO, AEO, email, SMS, WhatsApp","b1_es":"Diversifica más allá del social pago — SEO, AEO, email, SMS, WhatsApp",
   "b2_en":"Post-purchase flows that lift LTV 2–3x","b2_es":"Flujos post-compra que elevan el LTV 2–3x",
   "b3_en":"Appear in AI product-recommendation queries","b3_es":"Aparece en consultas de recomendación de productos IA"},

  {"slug":"home","folder":"industries/home-services","label_en":"Home Services","label_es":"Servicios del Hogar",
   "noun_en":"your business","noun_es":"tu negocio",
   "promise_en":"More Jobs.","promise_hl_en":"Fewer Slow Weeks.",
   "promise_es":"Más Trabajos.","promise_hl_es":"Menos Semanas Lentas.",
   "stats":["+64% lead volume","2-min AI response","Top 3 AI search"],
   "b1_en":"Google Local Service Ads + Google Guaranteed setup","b1_es":"Google Local Service Ads + setup de Google Guaranteed",
   "b2_en":"AI SDR answers leads on WhatsApp in under 2 min","b2_es":"SDR IA responde leads por WhatsApp en menos de 2 min",
   "b3_en":"Review + portfolio automation builds local trust","b3_es":"Automatización de reseñas + portfolio genera confianza local"},

  {"slug":"tech","folder":"industries/tech-saas","label_en":"Tech &amp; SaaS","label_es":"Tech y SaaS",
   "noun_en":"your SaaS or startup","noun_es":"tu SaaS o startup",
   "promise_en":"More Trials.","promise_hl_en":"Shorter Sales Cycles.",
   "promise_es":"Más Trials.","promise_hl_es":"Ciclos de Venta Más Cortos.",
   "stats":["-33% CAC","Top 3 AEO","+29% trial-to-paid"],
   "b1_en":"Content authority + AEO that compounds over time","b1_es":"Autoridad de contenido + AEO que se compone con el tiempo",
   "b2_en":"AI SDR on WhatsApp qualifies trials and enterprise fits","b2_es":"SDR IA en WhatsApp califica trials y fit enterprise",
   "b3_en":"Trial-to-paid flows that move the needle","b3_es":"Flujos trial-to-paid que mueven la aguja"},

  # ============ SUBCATEGORIES (29) ============
  # Hospitality
  {"slug":"hotels","folder":"industries/hospitality/hotels","label_en":"Hotels","label_es":"Hoteles",
   "noun_en":"your hotel","noun_es":"tu hotel",
   "promise_en":"More Direct Bookings.","promise_hl_en":"Zero OTA Commission.",
   "promise_es":"Más Reservas Directas.","promise_hl_es":"Cero Comisión OTA.",
   "stats":["+42% direct revenue","-24% OTA spend","4.8★ Google rating"],
   "b1_en":"Google Hotel Ads + direct booking funnels","b1_es":"Google Hotel Ads + embudos de reserva directa",
   "b2_en":"AEO — cited when AI recommends hotels near you","b2_es":"AEO — citado cuando la IA recomienda hoteles cercanos",
   "b3_en":"Post-stay loyalty + retargeting automation","b3_es":"Automatización de lealtad + retargeting post-estadía"},

  {"slug":"boutique","folder":"industries/hospitality/boutique","label_en":"Boutique Hotels","label_es":"Hoteles Boutique",
   "noun_en":"your boutique hotel","noun_es":"tu hotel boutique",
   "promise_en":"Boutique Story.","promise_hl_en":"Big Hotel Reach.",
   "promise_es":"Historia Boutique.","promise_hl_es":"Alcance de Gran Hotel.",
   "stats":["+38% direct bookings","+190% IG engagement","4.9★ TripAdvisor"],
   "b1_en":"Content that tells your story to the right travelers","b1_es":"Contenido que cuenta tu historia a los viajeros correctos",
   "b2_en":"Targeted ads that reach boutique travel audiences","b2_es":"Publicidad dirigida a audiencias de viaje boutique",
   "b3_en":"Seasonal campaigns that fill shoulder season","b3_es":"Campañas estacionales que llenan temporada baja"},

  {"slug":"resorts","folder":"industries/hospitality/resorts","label_en":"Resorts","label_es":"Resorts",
   "noun_en":"your resort","noun_es":"tu resort",
   "promise_en":"Fill Every Room.","promise_hl_en":"Every Season.",
   "promise_es":"Llena Cada Habitación.","promise_hl_es":"Cada Temporada.",
   "stats":["+51% shoulder occupancy","+33% upsell revenue","Top 5 AI travel"],
   "b1_en":"Package + event promotion campaigns","b1_es":"Campañas de promoción de paquetes + eventos",
   "b2_en":"Pre-arrival upsell automation for amenities","b2_es":"Automatización de upsell pre-llegada para amenidades",
   "b3_en":"AI SDR on WhatsApp for weddings, groups, corporate","b3_es":"SDR IA en WhatsApp para bodas, grupos y corporativos"},

  # Healthcare
  {"slug":"dental","folder":"industries/healthcare/dental","label_en":"Dental Practices","label_es":"Clínicas Dentales",
   "noun_en":"your dental practice","noun_es":"tu práctica dental",
   "promise_en":"Fill Your Chair.","promise_hl_en":"High-Value Patients.",
   "promise_es":"Llena Tu Sillón.","promise_hl_es":"Pacientes de Alto Valor.",
   "stats":["+58% new patients","-34% no-shows","Top 3 local AI"],
   "b1_en":"Google Ads for implants, Invisalign, cosmetic cases","b1_es":"Google Ads para implantes, Invisalign y estética",
   "b2_en":"Automated recall + reminder sequences via WhatsApp","b2_es":"Secuencias de recall + recordatorio por WhatsApp",
   "b3_en":"Review generation on Google + Healthgrades","b3_es":"Generación de reseñas en Google + Healthgrades"},

  {"slug":"vet","folder":"industries/healthcare/vet","label_en":"Veterinary Clinics","label_es":"Clínicas Veterinarias",
   "noun_en":"your veterinary clinic","noun_es":"tu clínica veterinaria",
   "promise_en":"More Appointments.","promise_hl_en":"Loyal Pet Owners.",
   "promise_es":"Más Citas.","promise_hl_es":"Dueños de Mascotas Leales.",
   "stats":["+49% new clients","+41% wellness compliance","Top local AI"],
   "b1_en":"Local SEO + new pet-owner targeting","b1_es":"SEO local + targeting a nuevos dueños de mascotas",
   "b2_en":"Wellness recall + birthday automation","b2_es":"Automatización de wellness + cumpleaños",
   "b3_en":"Beat corporate vet chains on local trust","b3_es":"Vence a cadenas veterinarias en confianza local"},

  {"slug":"aesthetics","folder":"industries/healthcare/aesthetics","label_en":"Medical Aesthetics","label_es":"Estética Médica",
   "noun_en":"your aesthetics practice","noun_es":"tu práctica de estética",
   "promise_en":"Premium Clients.","promise_hl_en":"Fully Booked.",
   "promise_es":"Clientes Premium.","promise_hl_es":"Agenda Llena.",
   "stats":["+63% consults","+44% avg ticket","4.9★ Google"],
   "b1_en":"Instagram content engine for your best cases","b1_es":"Motor de contenido Instagram para tus mejores casos",
   "b2_en":"Treatment upsell + loyalty sequences","b2_es":"Secuencias de upsell de tratamientos + lealtad",
   "b3_en":"No-show reduction with deposit + WhatsApp reminders","b3_es":"Reducción de ausencias con depósitos + recordatorios WhatsApp"},

  # Beauty
  {"slug":"salons","folder":"industries/beauty/salons","label_en":"Hair Salons","label_es":"Salones de Belleza",
   "noun_en":"your salon","noun_es":"tu salón",
   "promise_en":"Pack Your Books.","promise_hl_en":"Keep Them Full.",
   "promise_es":"Llena Tu Agenda.","promise_hl_es":"Mantenla Llena.",
   "stats":["+47% retention","+38% new clients","Top 3 local AI"],
   "b1_en":"Fill Monday–Tuesday with targeted promo campaigns","b1_es":"Llena lunes–martes con campañas promocionales",
   "b2_en":"Automated rebooking via SMS + WhatsApp","b2_es":"Rebooking automatizado por SMS + WhatsApp",
   "b3_en":"Referral program setup + promotion","b3_es":"Setup y promoción de programa de referidos"},

  {"slug":"spas","folder":"industries/beauty/spas","label_en":"Spas","label_es":"Spas",
   "noun_en":"your spa","noun_es":"tu spa",
   "promise_en":"Full Treatment Rooms.","promise_hl_en":"Loyal Guests.",
   "promise_es":"Salas Llenas.","promise_hl_es":"Huéspedes Leales.",
   "stats":["+44% midweek","+55% package revenue","4.9★ rating"],
   "b1_en":"Midweek promotion + email campaigns","b1_es":"Promoción midweek + campañas de email",
   "b2_en":"Year-round gift card + package automation","b2_es":"Automatización de gift cards + paquetes todo el año",
   "b3_en":"Post-visit upsell sequences introduce full menu","b3_es":"Secuencias post-visita presentan el menú completo"},

  {"slug":"barbershops","folder":"industries/beauty/barbershops","label_en":"Barbershops","label_es":"Barberías",
   "noun_en":"your barbershop","noun_es":"tu barbería",
   "promise_en":"Pack Your Chairs.","promise_hl_en":"Build a Loyal Brand.",
   "promise_es":"Llena Tus Sillas.","promise_hl_es":"Construye una Marca Leal.",
   "stats":["+52% online bookings","+35% referrals","Top local AI"],
   "b1_en":"Online booking + local SEO that drives bookings","b1_es":"Booking online + SEO local que genera reservas",
   "b2_en":"New-barber 30-day client-building campaign","b2_es":"Campaña de 30 días para nuevo barbero",
   "b3_en":"Automated loyalty + referral rewards","b3_es":"Lealtad automatizada + recompensas por referidos"},

  # Professional services
  {"slug":"legal","folder":"industries/professional-services/legal","label_en":"Law Firms","label_es":"Bufetes",
   "noun_en":"your law firm","noun_es":"tu bufete",
   "promise_en":"More Qualified Clients.","promise_hl_en":"Less Waiting for Referrals.",
   "promise_es":"Más Clientes Calificados.","promise_hl_es":"Menos Esperar Referidos.",
   "stats":["+71% consults","Top 3 AI citations","2-min intake"],
   "b1_en":"AEO authority in your practice area","b1_es":"Autoridad AEO en tu área de práctica",
   "b2_en":"AI SDR — 24/7 intake and qualification on WhatsApp","b2_es":"SDR IA — intake y calificación 24/7 por WhatsApp",
   "b3_en":"LinkedIn authority content for partners","b3_es":"Contenido de autoridad LinkedIn para socios"},

  {"slug":"accounting","folder":"industries/professional-services/accounting","label_en":"Accounting Firms","label_es":"Firmas Contables",
   "noun_en":"your accounting firm","noun_es":"tu firma contable",
   "promise_en":"Grow Beyond Tax Season.","promise_hl_en":"Year-Round Revenue.",
   "promise_es":"Crece Más Allá de Impuestos.","promise_hl_es":"Ingresos Todo el Año.",
   "stats":["+64% advisory inquiries","+38% new clients","Top 3 local AI"],
   "b1_en":"Demand for advisory + fractional CFO services","b1_es":"Demanda para advisory + CFO fraccional",
   "b2_en":"Off-season campaigns that smooth revenue","b2_es":"Campañas off-season que suavizan ingresos",
   "b3_en":"LinkedIn content that builds partner visibility","b3_es":"Contenido LinkedIn que construye visibilidad"},

  {"slug":"consulting","folder":"industries/professional-services/consulting","label_en":"Consulting Firms","label_es":"Consultoras",
   "noun_en":"your consulting firm","noun_es":"tu consultora",
   "promise_en":"A Pipeline That Doesn't","promise_hl_en":"Depend on Your Network.",
   "promise_es":"Un Pipeline Que No","promise_hl_es":"Depende de Tu Red.",
   "stats":["+68% inquiries","Top 3 AEO","2.7x content pipeline"],
   "b1_en":"Thought leadership content that builds trust","b1_es":"Contenido de thought leadership que genera confianza",
   "b2_en":"LinkedIn + Google for high-intent consulting keywords","b2_es":"LinkedIn + Google para keywords de alta intención",
   "b3_en":"AEO — cited when AI recommends consultants","b3_es":"AEO — citado cuando la IA recomienda consultores"},

  # Real estate
  {"slug":"agents","folder":"industries/real-estate/agents","label_en":"Real Estate Agents","label_es":"Agentes Inmobiliarios",
   "noun_en":"your real estate business","noun_es":"tu negocio inmobiliario",
   "promise_en":"More Listings.","promise_hl_en":"Zero Cold Calling.",
   "promise_es":"Más Listados.","promise_hl_es":"Cero Llamadas en Frío.",
   "stats":["+76% lead response","-45% contact time","+39% referrals"],
   "b1_en":"AI SDR contacts every lead in under 2 min on WhatsApp","b1_es":"SDR IA contacta cada lead en menos de 2 min por WhatsApp",
   "b2_en":"Past-client anniversary + market updates automated","b2_es":"Aniversarios + market updates automatizados",
   "b3_en":"Neighborhood SEO + AI search dominance","b3_es":"SEO de barrio + dominio en búsqueda IA"},

  {"slug":"brokerages","folder":"industries/real-estate/brokerages","label_en":"Real Estate Brokerages","label_es":"Corredoras Inmobiliarias",
   "noun_en":"your brokerage","noun_es":"tu corredora",
   "promise_en":"Recruit Top Agents.","promise_hl_en":"Dominate Your Market.",
   "promise_es":"Recluta Top Agentes.","promise_hl_es":"Domina Tu Mercado.",
   "stats":["+44% recruitment","3.1x consumer leads","Top local AI"],
   "b1_en":"Agent recruitment ads + email campaigns","b1_es":"Publicidad de reclutamiento + campañas de email",
   "b2_en":"Direct consumer lead generation (skip Zillow)","b2_es":"Lead gen de consumidores directo (sin Zillow)",
   "b3_en":"Brokerage brand authority content","b3_es":"Contenido de autoridad de marca"},

  {"slug":"propertymanagement","folder":"industries/real-estate/property-management","label_en":"Property Management","label_es":"Administración de Propiedades",
   "noun_en":"your property management company","noun_es":"tu empresa de administración",
   "promise_en":"More Owner Contracts.","promise_hl_en":"Zero Vacancy.",
   "promise_es":"Más Contratos de Dueños.","promise_hl_es":"Cero Vacancia.",
   "stats":["+53% owner inquiries","-18 days vacancy","Top local AI"],
   "b1_en":"Owner acquisition + tenant attraction in parallel","b1_es":"Adquisición de dueños + atracción de inquilinos en paralelo",
   "b2_en":"Zillow + Facebook vacancy listing promotion","b2_es":"Promoción de listados en Zillow + Facebook",
   "b3_en":"Owner case studies + testimonial content","b3_es":"Casos de éxito + testimonios de dueños"},

  # Restaurants
  {"slug":"bars","folder":"industries/restaurants/bars","label_en":"Bars &amp; Nightlife","label_es":"Bares y Nightlife",
   "noun_en":"your bar or venue","noun_es":"tu bar o venue",
   "promise_en":"Packed Every Night.","promise_hl_en":"Not Just on Weekends.",
   "promise_es":"Lleno Cada Noche.","promise_hl_es":"No Solo los Fines de Semana.",
   "stats":["+61% weeknight covers","+88% event pre-sales","4.7★ rating"],
   "b1_en":"Event ticket pre-sale automation","b1_es":"Automatización de pre-venta de tickets",
   "b2_en":"Weekly promotion + happy hour campaigns","b2_es":"Promoción semanal + campañas de happy hour",
   "b3_en":"Loyalty program setup for regulars","b3_es":"Setup de programa de lealtad para regulares"},

  {"slug":"catering","folder":"industries/restaurants/catering","label_en":"Catering","label_es":"Catering",
   "noun_en":"your catering company","noun_es":"tu empresa de catering",
   "promise_en":"Fill Your Event Calendar.","promise_hl_en":"High-Value Bookings.",
   "promise_es":"Llena Tu Calendario.","promise_hl_es":"Reservas de Alto Valor.",
   "stats":["+57% corporate inquiries","+33% off-season","2-min response"],
   "b1_en":"Corporate procurement + shortlist positioning","b1_es":"Procurement corporativo + posicionamiento shortlist",
   "b2_en":"Seasonal diversification (weddings/corp/holidays)","b2_es":"Diversificación estacional (bodas/corp/feriados)",
   "b3_en":"AI SDR on WhatsApp responds to every inquiry in minutes","b3_es":"SDR IA en WhatsApp responde cada consulta en minutos"},

  # Fitness
  {"slug":"gyms","folder":"industries/fitness/gyms","label_en":"Gyms","label_es":"Gimnasios",
   "noun_en":"your gym","noun_es":"tu gimnasio",
   "promise_en":"More Members.","promise_hl_en":"Less Churn.",
   "promise_es":"Más Miembros.","promise_hl_es":"Menos Cancelaciones.",
   "stats":["-31% churn","+62% trial conversion","Top local AI"],
   "b1_en":"Churn detection + automated win-back campaigns","b1_es":"Detección de churn + campañas win-back automatizadas",
   "b2_en":"Trial-to-member conversion sequences","b2_es":"Secuencias trial-to-member",
   "b3_en":"Year-round acquisition (not just January)","b3_es":"Adquisición todo el año (no solo enero)"},

  {"slug":"studios","folder":"industries/fitness/studios","label_en":"Fitness Studios","label_es":"Estudios Fitness",
   "noun_en":"your fitness studio","noun_es":"tu estudio fitness",
   "promise_en":"Full Classes.","promise_hl_en":"Thriving Community.",
   "promise_es":"Clases Llenas.","promise_hl_es":"Comunidad Vibrante.",
   "stats":["+55% class fill","+48% intro conversion","Top studio AI"],
   "b1_en":"Class schedule promotion + waitlist automation","b1_es":"Promoción de horarios + automatización de lista de espera",
   "b2_en":"Intro-to-member conversion sequences","b2_es":"Secuencias intro-a-miembro",
   "b3_en":"Referral program built in your CRM","b3_es":"Programa de referidos en tu CRM"},

  {"slug":"personaltraining","folder":"industries/fitness/personal-training","label_en":"Personal Trainers","label_es":"Entrenadores Personales",
   "noun_en":"your personal training business","noun_es":"tu negocio de entrenamiento",
   "promise_en":"Full Client Roster.","promise_hl_en":"No Cold DMs.",
   "promise_es":"Roster Lleno.","promise_hl_es":"Sin DMs en Frío.",
   "stats":["+58% inquiries","+44% online revenue","-29% 90d churn"],
   "b1_en":"Online coaching funnel setup","b1_es":"Setup de embudo de coaching online",
   "b2_en":"Client transformation showcase content","b2_es":"Contenido de transformaciones de clientes",
   "b3_en":"Retention automation past the 3-month plateau","b3_es":"Automatización de retención pasado el plateau de 3 meses"},

  # E-commerce
  {"slug":"shopify","folder":"industries/ecommerce/shopify","label_en":"Shopify Stores","label_es":"Tiendas Shopify",
   "noun_en":"your Shopify store","noun_es":"tu tienda Shopify",
   "promise_en":"Scale Your Shopify.","promise_hl_en":"With AI Marketing.",
   "promise_es":"Escala Tu Shopify.","promise_hl_es":"Con Marketing IA.",
   "stats":["+39% repeat rate","3.9x ROAS","+180% organic"],
   "b1_en":"Diversified acquisition: Google, TikTok, email, SMS","b1_es":"Adquisición diversificada: Google, TikTok, email, SMS",
   "b2_en":"Abandoned cart + post-purchase upsell flows","b2_es":"Carrito abandonado + flujos post-compra",
   "b3_en":"AEO — appear in AI product-recommendation queries","b3_es":"AEO — aparece en consultas de recomendación IA"},

  {"slug":"dtc","folder":"industries/ecommerce/dtc","label_en":"DTC Brands","label_es":"Marcas DTC",
   "noun_en":"your DTC brand","noun_es":"tu marca DTC",
   "promise_en":"Own Your Customers.","promise_hl_en":"Don't Rent Them from Amazon.",
   "promise_es":"Sé Dueño de Tus Clientes.","promise_hl_es":"No los Rentes de Amazon.",
   "stats":["+43% direct revenue","-28% CAC","3.6x LTV"],
   "b1_en":"Build direct channel that doesn't depend on Amazon","b1_es":"Construye canal directo independiente de Amazon",
   "b2_en":"Diversified CAC channels that compound","b2_es":"Canales de CAC diversificados que se componen",
   "b3_en":"Brand content + AI search presence","b3_es":"Contenido de marca + presencia en búsqueda IA"},

  {"slug":"marketplace","folder":"industries/ecommerce/marketplace","label_en":"Marketplace Sellers","label_es":"Vendedores Marketplace",
   "noun_en":"your marketplace business","noun_es":"tu negocio marketplace",
   "promise_en":"Stop Renting Customers","promise_hl_en":"from Marketplace Platforms.",
   "promise_es":"Deja de Rentar Clientes","promise_hl_es":"de Plataformas Marketplace.",
   "stats":["+48% direct revenue","+35% repeat rate","3.4x LTV"],
   "b1_en":"Off-platform SEO + paid that survives algorithm changes","b1_es":"SEO + publicidad que sobrevive cambios de algoritmo",
   "b2_en":"Direct channel funnel that captures customer data","b2_es":"Embudo directo que captura data de clientes",
   "b3_en":"Brand authority that escapes price wars","b3_es":"Autoridad de marca que escapa guerras de precios"},

  # Home services
  {"slug":"contractors","folder":"industries/home-services/contractors","label_en":"Contractors","label_es":"Contratistas",
   "noun_en":"your contracting business","noun_es":"tu negocio de contratista",
   "promise_en":"More Jobs.","promise_hl_en":"Fewer Slow Weeks.",
   "promise_es":"Más Trabajos.","promise_hl_es":"Menos Semanas Lentas.",
   "stats":["+64% lead volume","2-min AI response","Top 3 AI"],
   "b1_en":"Google Local Service Ads + Meta retargeting","b1_es":"Google Local Service Ads + retargeting Meta",
   "b2_en":"AI SDR on WhatsApp — responds in 2 min, before competitors","b2_es":"SDR IA en WhatsApp — responde en 2 min, antes que competencia",
   "b3_en":"Review + project portfolio automation","b3_es":"Automatización de reseñas + portfolio de proyectos"},

  {"slug":"plumbers","folder":"industries/home-services/plumbers","label_en":"Plumbers","label_es":"Plomeros",
   "noun_en":"your plumbing business","noun_es":"tu negocio de plomería",
   "promise_en":"Be the First Plumber","promise_hl_en":"They Message Every Time.",
   "promise_es":"Sé el Primer Plomero","promise_hl_es":"Al Que Siempre Escriben.",
   "stats":["+69% map pack","+45% repeat calls","2-min response"],
   "b1_en":"Dominate Google map pack for emergency searches","b1_es":"Domina el map pack de Google para búsquedas de emergencia",
   "b2_en":"Google Guaranteed (LSA) setup and management","b2_es":"Setup y gestión de Google Guaranteed (LSA)",
   "b3_en":"Maintenance reminders via WhatsApp → recurring revenue","b3_es":"Recordatorios por WhatsApp → ingresos recurrentes"},

  {"slug":"landscaping","folder":"industries/home-services/landscaping","label_en":"Landscaping","label_es":"Paisajismo",
   "noun_en":"your landscaping business","noun_es":"tu negocio de paisajismo",
   "promise_en":"Fill Your Route.","promise_hl_en":"Year-Round.",
   "promise_es":"Llena Tu Ruta.","promise_hl_es":"Todo el Año.",
   "stats":["+53% new contracts","+38% upsell revenue","Top local AI"],
   "b1_en":"Seasonal campaigns (aeration, mulch, snow, lights)","b1_es":"Campañas estacionales (aireación, mulch, nieve, luces)",
   "b2_en":"Commercial + HOA outreach that wins contracts","b2_es":"Outreach comercial + HOA que gana contratos",
   "b3_en":"Upsell automation for design + irrigation","b3_es":"Automatización de upsell para diseño + riego"},

  # Tech & SaaS
  {"slug":"saas","folder":"industries/tech-saas/saas","label_en":"SaaS Companies","label_es":"Empresas SaaS",
   "noun_en":"your SaaS company","noun_es":"tu empresa SaaS",
   "promise_en":"More Trials.","promise_hl_en":"Shorter Sales Cycles.",
   "promise_es":"Más Trials.","promise_hl_es":"Ciclos de Venta Más Cortos.",
   "stats":["-33% CAC","Top 3 AEO","+29% trial-to-paid"],
   "b1_en":"Organic SEO + AEO that reduces CAC over time","b1_es":"SEO orgánico + AEO que reduce CAC con el tiempo",
   "b2_en":"Be cited by Claude + ChatGPT in your use cases","b2_es":"Sé citado por Claude + ChatGPT en tus casos de uso",
   "b3_en":"Trial onboarding + paid conversion sequences","b3_es":"Onboarding de trial + secuencias de conversión"},

  {"slug":"startups","folder":"industries/tech-saas/startups","label_en":"Tech Startups","label_es":"Startups Tech",
   "noun_en":"your startup","noun_es":"tu startup",
   "promise_en":"Go to Market Fast.","promise_hl_en":"Build Investor-Grade Traction.",
   "promise_es":"Sal al Mercado Rápido.","promise_hl_es":"Tracción de Nivel Inversor.",
   "stats":["+54% early pipeline","Investor metrics","Launch in 30 days"],
   "b1_en":"Launch strategy + early customer acquisition","b1_es":"Estrategia de lanzamiento + adquisición early",
   "b2_en":"Product Hunt coordination + launch platform","b2_es":"Coordinación Product Hunt + plataforma lanzamiento",
   "b3_en":"Metrics VCs care about in your Series A deck","b3_es":"Métricas que los VCs quieren en tu Series A"},

  {"slug":"agencies","folder":"industries/tech-saas/agencies","label_en":"Marketing Agencies","label_es":"Agencias Marketing",
   "noun_en":"your agency","noun_es":"tu agencia",
   "promise_en":"Grow Your Agency.","promise_hl_en":"With White-Label AI.",
   "promise_es":"Haz Crecer Tu Agencia.","promise_hl_es":"Con IA White-Label.",
   "stats":["-60% tool costs","3x client capacity","+44% margin"],
   "b1_en":"Replace HubSpot/Semrush/Hootsuite stack with NWM","b1_es":"Reemplaza HubSpot/Semrush/Hootsuite con NWM",
   "b2_en":"Client reporting automation saves billable hours","b2_es":"Automatización de reportes ahorra horas facturables",
   "b3_en":"Productize services into higher-margin retainers","b3_es":"Productiza servicios en retainers de mayor margen"},
]

def esc(s):
    return s.replace('"','&quot;')

def build_lp(v):
    return f"""<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Free AI Growth Plan | {v["label_en"]} — NetWebMedia</title>
  <meta name="description" content="Free personalized growth plan for {v['noun_en']}. Delivered by AI + a real strategist straight to your WhatsApp — no calls, no pitch, just actionable next steps.">
  <meta name="robots" content="noindex,follow">
  <link rel="canonical" href="https://{v["slug"]}.netwebmedia.com/">
  <link rel="icon" type="image/svg+xml" href="https://netwebmedia.com/assets/nwm-logo.svg">
  <link rel="stylesheet" href="https://netwebmedia.com/css/styles.css">
  <style>
    body{{background:var(--bg-primary);color:var(--text-primary);margin:0}}
    .lp-nav{{display:flex;align-items:center;justify-content:space-between;padding:18px 24px;border-bottom:1px solid var(--border-glass);position:sticky;top:0;background:rgba(1,15,59,.92);backdrop-filter:blur(10px);z-index:100}}
    .lp-nav .logo-wordmark{{font-size:22px}}
    .lp-nav .lp-nav-cta{{background:var(--gradient-btn);color:#fff;padding:10px 22px;border-radius:var(--radius-pill);font-weight:700;font-size:14px;text-decoration:none}}
    .lp-lang{{display:flex;gap:6px;margin-right:16px}}
    .lp-lang button{{background:transparent;border:1px solid var(--border-glass);color:var(--text-muted);padding:6px 12px;border-radius:4px;font-size:12px;cursor:pointer;font-weight:600}}
    .lp-lang button.active{{background:var(--nwm-orange);color:#fff;border-color:var(--nwm-orange)}}
    .lp-hero{{display:grid;grid-template-columns:1.3fr 1fr;gap:60px;max-width:1200px;margin:0 auto;padding:80px 24px 60px}}
    @media(max-width:900px){{.lp-hero{{grid-template-columns:1fr;padding:48px 20px}}}}
    .lp-hero .eyebrow{{display:inline-flex;align-items:center;gap:8px;background:rgba(255,103,31,.14);color:var(--nwm-orange);padding:6px 14px;border-radius:var(--radius-pill);font-size:12px;font-weight:800;letter-spacing:.12em;text-transform:uppercase;margin-bottom:20px}}
    .lp-hero h1{{font-size:clamp(34px,5vw,52px);line-height:1.08;font-weight:800;margin-bottom:20px;font-family:var(--font-display)}}
    .lp-hero h1 .hl{{background:var(--gradient-text);-webkit-background-clip:text;background-clip:text;color:transparent}}
    .lp-hero .sub{{font-size:18px;color:var(--text-secondary);max-width:540px;margin-bottom:28px;line-height:1.55}}
    .lp-bullets{{list-style:none;padding:0;margin:0 0 28px;display:flex;flex-direction:column;gap:12px}}
    .lp-bullets li{{display:flex;gap:12px;align-items:flex-start;font-size:16px;color:var(--text-secondary);line-height:1.5}}
    .lp-bullets li::before{{content:"✓";color:var(--nwm-orange);font-weight:900;font-size:18px;flex-shrink:0;margin-top:-2px}}
    .lp-stats{{display:flex;gap:28px;flex-wrap:wrap;padding-top:24px;border-top:1px solid var(--border-glass)}}
    .lp-stat{{display:flex;flex-direction:column;gap:2px}}
    .lp-stat .n{{font-size:22px;font-weight:900;background:var(--gradient-text);-webkit-background-clip:text;background-clip:text;color:transparent;line-height:1}}
    .lp-stat .l{{font-size:11px;color:var(--text-muted);text-transform:uppercase;letter-spacing:.08em;margin-top:4px}}
    .lp-form-card{{background:var(--bg-card);border:1px solid var(--border-accent);border-radius:var(--radius-lg);padding:36px;box-shadow:var(--shadow-card);align-self:start;position:sticky;top:90px}}
    .lp-form-card h2{{font-size:22px;font-weight:800;margin-bottom:8px;font-family:var(--font-display)}}
    .lp-form-card p{{font-size:14px;color:var(--text-muted);margin-bottom:20px}}
    .lp-form{{display:flex;flex-direction:column;gap:12px}}
    .lp-form input,.lp-form textarea,.lp-form select{{background:rgba(255,255,255,.04);border:1px solid var(--border-glass);color:#fff;padding:13px 14px;border-radius:var(--radius-sm);font-size:15px;font-family:var(--font-body);width:100%;box-sizing:border-box}}
    .lp-form input:focus,.lp-form textarea:focus,.lp-form select:focus{{outline:none;border-color:var(--nwm-orange)}}
    .lp-form textarea{{min-height:80px;resize:vertical}}
    .lp-form button{{background:var(--gradient-btn);color:#fff;border:none;padding:16px;border-radius:var(--radius-pill);font-weight:700;font-size:16px;cursor:pointer;margin-top:6px;transition:var(--transition)}}
    .lp-form button:hover{{transform:translateY(-2px);box-shadow:var(--shadow-glow)}}
    .lp-fine{{font-size:11px;color:var(--text-muted);line-height:1.5;margin-top:10px;text-align:center}}
    .lp-strip{{background:rgba(1,15,59,.4);border-top:1px solid var(--border-glass);border-bottom:1px solid var(--border-glass);padding:28px 20px;text-align:center}}
    .lp-strip .strip-text{{color:var(--text-muted);font-size:13px;text-transform:uppercase;letter-spacing:.14em;font-weight:700;margin-bottom:8px}}
    .lp-strip .strip-quote{{font-size:17px;color:#fff;font-style:italic;max-width:720px;margin:0 auto;line-height:1.5}}
    .lp-steps{{max-width:1000px;margin:0 auto;padding:80px 24px;text-align:center}}
    .lp-steps h2{{font-size:clamp(28px,4vw,38px);font-weight:800;margin-bottom:16px;font-family:var(--font-display)}}
    .lp-steps .lead{{font-size:17px;color:var(--text-secondary);margin-bottom:48px;max-width:600px;margin-left:auto;margin-right:auto}}
    .lp-steps-grid{{display:grid;grid-template-columns:repeat(3,1fr);gap:28px;text-align:left}}
    @media(max-width:800px){{.lp-steps-grid{{grid-template-columns:1fr}}}}
    .lp-step{{background:var(--bg-card);border:1px solid var(--border-glass);border-radius:var(--radius-md);padding:28px}}
    .lp-step .num{{background:var(--gradient-btn);color:#fff;width:32px;height:32px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-weight:800;margin-bottom:16px}}
    .lp-step h3{{font-size:18px;font-weight:700;margin-bottom:10px}}
    .lp-step p{{font-size:14px;color:var(--text-secondary);line-height:1.55}}
    .lp-faq{{max-width:800px;margin:0 auto;padding:60px 24px}}
    .lp-faq h2{{font-size:clamp(26px,4vw,34px);font-weight:800;margin-bottom:32px;text-align:center;font-family:var(--font-display)}}
    .lp-faq details{{border-bottom:1px solid var(--border-glass);padding:20px 0}}
    .lp-faq summary{{font-weight:700;cursor:pointer;font-size:16px;color:#fff;list-style:none;position:relative;padding-right:30px}}
    .lp-faq summary::after{{content:"+";position:absolute;right:0;top:0;color:var(--nwm-orange);font-size:22px;font-weight:300}}
    .lp-faq details[open] summary::after{{content:"−"}}
    .lp-faq details p{{margin:12px 0 0;color:var(--text-secondary);font-size:14px;line-height:1.6}}
    .lp-final{{text-align:center;padding:80px 24px;max-width:700px;margin:0 auto}}
    .lp-final h2{{font-size:clamp(28px,4vw,40px);font-weight:800;margin-bottom:18px;font-family:var(--font-display)}}
    .lp-final p{{font-size:17px;color:var(--text-secondary);margin-bottom:30px}}
    .lp-final .btn-primary{{background:var(--gradient-btn);color:#fff;padding:18px 38px;border-radius:var(--radius-pill);font-weight:700;font-size:17px;text-decoration:none;display:inline-block}}
    .lp-foot{{text-align:center;padding:30px 20px;color:var(--text-muted);font-size:12px;border-top:1px solid var(--border-glass)}}
    .lp-foot a{{color:var(--text-muted);text-decoration:none}}
  </style>
</head>
<body>

<header class="lp-nav">
  <a href="https://netwebmedia.com" class="nav-logo">
    <span class="logo-wordmark"><span class="logo-net">net</span><span class="logo-web">web</span><span class="logo-media">media</span></span>
  </a>
  <div style="display:flex;align-items:center">
    <div class="lp-lang">
      <button id="lp-en" class="active" onclick="setLang('en')">EN</button>
      <button id="lp-es" onclick="setLang('es')">ES</button>
    </div>
    <a href="#plan-form" class="lp-nav-cta" data-en="Get Free Plan" data-es="Plan Gratis">Get Free Plan</a>
  </div>
</header>

<main>
  <section class="lp-hero">
    <div>
      <div class="eyebrow" data-en="Free growth plan — for {esc(v['label_en'])}" data-es="Plan de crecimiento gratis — para {esc(v['label_es'])}">Free growth plan — for {v["label_en"]}</div>
      <h1>
        <span data-en="{esc(v['promise_en'])}" data-es="{esc(v['promise_es'])}">{v["promise_en"]}</span><br>
        <span class="hl" data-en="{esc(v['promise_hl_en'])}" data-es="{esc(v['promise_hl_es'])}">{v["promise_hl_en"]}</span>
      </h1>
      <p class="sub" data-en="Fill the form in 2 minutes. Our AI + a real strategist build a personalized plan for {esc(v['noun_en'])} and email it to you within 24 hours — no calls, no pitch, just actionable next steps." data-es="Llena el formulario en 2 minutos. Nuestra IA + un estratega real construyen un plan personalizado para {esc(v['noun_es'])} y lo envían a tu WhatsApp en menos de una hora — sin llamadas, sin pitch, solo siguientes pasos accionables.">Fill the form in 2 minutes. Our AI + a real strategist build a personalized plan for {v["noun_en"]} and email it to you within 24 hours — no calls, no pitch, just actionable next steps.</p>

      <ul class="lp-bullets">
        <li data-en="{esc(v['b1_en'])}" data-es="{esc(v['b1_es'])}">{v["b1_en"]}</li>
        <li data-en="{esc(v['b2_en'])}" data-es="{esc(v['b2_es'])}">{v["b2_en"]}</li>
        <li data-en="{esc(v['b3_en'])}" data-es="{esc(v['b3_es'])}">{v["b3_en"]}</li>
      </ul>

      <div class="lp-stats">
        <div class="lp-stat"><div class="n">{v["stats"][0]}</div><div class="l" data-en="Client avg" data-es="Promedio cliente">Client avg</div></div>
        <div class="lp-stat"><div class="n">{v["stats"][1]}</div><div class="l" data-en="Client avg" data-es="Promedio cliente">Client avg</div></div>
        <div class="lp-stat"><div class="n">{v["stats"][2]}</div><div class="l" data-en="Client avg" data-es="Promedio cliente">Client avg</div></div>
      </div>
    </div>

    <aside class="lp-form-card" id="plan-form">
      <h2 data-en="Get your free growth plan" data-es="Obtén tu plan de crecimiento gratis">Get your free growth plan</h2>
      <p data-en="Delivered to your inbox. Usually within 24 hours." data-es="Entregado a tu WhatsApp. Normalmente en menos de una hora.">Delivered to your inbox. Usually within 24 hours.</p>
      <form class="lp-form" action="https://netwebmedia.com/submit.php" method="POST">
        <input type="hidden" name="source" value="{v['slug']}-lp">
        <!-- UTM attribution — populated by utm-capture.js from URL params -->
        <input type="hidden" name="utm_source" value="">
        <input type="hidden" name="utm_campaign" value="">
        <input type="hidden" name="utm_content" value="">
        <!-- honeypot: real users never fill this; bots usually do -->
        <input type="text" name="website_url" tabindex="-1" autocomplete="off" style="position:absolute;left:-9999px;height:0;width:0;opacity:0" aria-hidden="true">
        <input type="text" name="name" required data-en-placeholder="Full name" data-es-placeholder="Nombre completo" placeholder="Full name">
        <input type="email" name="email" required data-en-placeholder="Work email" data-es-placeholder="Email de trabajo" placeholder="Work email">
        <input type="tel" name="phone" data-en-placeholder="Phone (optional)" data-es-placeholder="WhatsApp (con código de país)" placeholder="Phone (optional)">
        <input type="text" name="company" required data-en-placeholder="{esc(v['label_en'])} business name" data-es-placeholder="Nombre de tu negocio de {esc(v['label_es'])}" placeholder="{v['label_en']} business name">
        <input type="url" name="website" data-en-placeholder="Website (optional)" data-es-placeholder="Sitio web (opcional)" placeholder="Website (optional)">
        <textarea name="message" data-en-placeholder="Biggest marketing challenge right now?" data-es-placeholder="¿Tu mayor reto de marketing ahora?" placeholder="Biggest marketing challenge right now?"></textarea>
        <button type="submit" data-en="Send My Free Plan →" data-es="Envíame Mi Plan Gratis →">Send My Free Plan →</button>
      </form>
      <p class="lp-fine" data-en="We reply by email — no calls, no meetings. Your info stays private." data-es="Respondemos por WhatsApp — sin llamadas, sin reuniones. Tu información se mantiene privada.">We reply by email — no calls, no meetings. Your info stays private.</p>
    </aside>
  </section>

  <section class="lp-strip">
    <div class="strip-text" data-en="Built on Claude (Anthropic) + NWM CRM" data-es="Construido con Claude (Anthropic) + NWM CRM">Built on Claude (Anthropic) + NWM CRM</div>
    <div class="strip-quote" data-en="&ldquo;The only fractional CMO that ships AI agents, paid ads, and content — all from a single team, all in a month-to-month retainer. Everything is async — email, chat, and AI. No meetings.&rdquo;" data-es="&ldquo;El único CMO fraccional que lanza agentes IA, publicidad paga y contenido — todo con un solo equipo, todo mes a mes. Todo corre por WhatsApp. Sin reuniones.&rdquo;">&ldquo;The only fractional CMO that ships AI agents, paid ads, and content — all from a single team, all in a month-to-month retainer. Everything is async — email, chat, and AI. No meetings.&rdquo;</div>
  </section>

  <section class="lp-steps">
    <h2 data-en="How the free plan works" data-es="Cómo funciona el plan gratis">How the free plan works</h2>
    <p class="lead" data-en="No generic templates. No calendar links. Just AI + humans building a plan, then emailing it to you within 24 hours." data-es="Sin plantillas genéricas. Sin links de calendario. Solo IA + humanos construyendo un plan, y luego mensajeándote por WhatsApp cuando esté listo.">No generic templates. No calendar links. Just AI + humans building a plan, then emailing it to you within 24 hours.</p>
    <div class="lp-steps-grid">
      <div class="lp-step">
        <div class="num">1</div>
        <h3 data-en="Share 2 minutes of context" data-es="Comparte 2 minutos de contexto">Share 2 minutes of context</h3>
        <p data-en="Your site, your goals, your biggest bottleneck. Fill the form — that's all we need." data-es="Tu sitio, tus objetivos, tu mayor cuello de botella. Llena el formulario — eso es todo.">Your site, your goals, your biggest bottleneck. Fill the form — that's all we need.</p>
      </div>
      <div class="lp-step">
        <div class="num">2</div>
        <h3 data-en="AI + a real strategist build your plan" data-es="IA + un estratega real construyen tu plan">AI + a real strategist build your plan</h3>
        <p data-en="Claude analyzes your site, SEO, AEO, paid, and AI SDR gaps. A NetWebMedia strategist reviews and sharpens it." data-es="Claude analiza tu sitio, SEO, AEO, paid y brechas de SDR IA. Un estratega NetWebMedia lo revisa y afina.">Claude analyzes your site, SEO, AEO, paid, and AI SDR gaps. A NetWebMedia strategist reviews and sharpens it.</p>
      </div>
      <div class="lp-step">
        <div class="num">3</div>
        <h3 data-en="We email you the plan" data-es="Te enviamos el plan por WhatsApp">We email you the plan</h3>
        <p data-en="Usually within 24 hours. The 3 highest-leverage fixes, written for you. Reply by email anytime with questions." data-es="Normalmente en menos de una hora. Las 3 acciones de mayor palanca, escritas para ti. Responde por WhatsApp con dudas cuando quieras.">Usually within 24 hours. The 3 highest-leverage fixes, written for you. Reply by email anytime with questions.</p>
      </div>
    </div>
  </section>

  <section class="lp-faq">
    <h2 data-en="Frequently asked" data-es="Preguntas frecuentes">Frequently asked</h2>
    <details>
      <summary data-en="Is this really free? What's the catch?" data-es="¿De verdad es gratis? ¿Cuál es la trampa?">Is this really free? What's the catch?</summary>
      <p data-en="No catch. Free plans are how we earn the right to follow up by email. If we're not a fit, you still walk away with a real plan you can execute yourself." data-es="Sin trampa. Los planes gratis son cómo nos ganamos el derecho a ofrecerte nuestro retainer por WhatsApp. Si no somos fit, te llevas un plan real que puedes ejecutar tú mismo.">No catch. Free plans are how we earn the right to follow up by email. If we're not a fit, you still walk away with a real plan you can execute yourself.</p>
    </details>
    <details>
      <summary data-en="Do I have to jump on a call?" data-es="¿Tengo que agendar una llamada?">Do I have to jump on a call?</summary>
      <p data-en="Never. Everything happens by email and chat. No phone calls, no Zoom, no calendar links. Our whole delivery model is async, AI-first." data-es="Nunca. Todo pasa por WhatsApp. Sin llamadas telefónicas, sin Zoom, sin links de calendario. Nuestro modelo completo de entrega es mensajería async AI-first.">Never. Everything happens by email and chat. No phone calls, no Zoom, no calendar links. Our whole delivery model is async, AI-first.</p>
    </details>
    <details>
      <summary data-en="Who actually writes the plan?" data-es="¿Quién escribe el plan?">Who actually writes the plan?</summary>
      <p data-en="Claude (Anthropic) drafts it against our audit framework, then a NetWebMedia strategist reviews, sharpens, and approves before we message it to you. You get AI speed + human judgment." data-es="Claude (Anthropic) lo redacta con nuestro framework, y luego un estratega NetWebMedia lo revisa, afina y aprueba antes de enviártelo. Obtienes velocidad IA + criterio humano.">Claude (Anthropic) drafts it against our audit framework, then a NetWebMedia strategist reviews, sharpens, and approves before we message it to you. You get AI speed + human judgment.</p>
    </details>
    <details>
      <summary data-en="Do I need to commit to anything?" data-es="¿Tengo que comprometerme a algo?">Do I need to commit to anything?</summary>
      <p data-en="No. Our retainer itself is 90-day minimum, then month-to-month. No annual contracts. No penalty to leave. But this first plan is completely unconditional." data-es="No. Nuestro retainer es mínimo 90 días y luego mes a mes. Sin contratos anuales. Sin penalización por salir. Pero este primer plan es incondicional.">No. Our retainer itself is 90-day minimum, then month-to-month. No annual contracts. No penalty to leave. But this first plan is completely unconditional.</p>
    </details>
    <details>
      <summary data-en="How is this different from HubSpot / a traditional agency?" data-es="¿En qué se diferencia de HubSpot o una agencia tradicional?">How is this different from HubSpot / a traditional agency?</summary>
      <p data-en="We run the full stack (SEO, AEO, paid, CRM, AI SDR, content) on our own AI-native platform. Delivery happens by email and chat — no weekly check-in meetings. You get a fractional CMO function at a fraction of what a senior hire + tool stack would cost." data-es="Operamos el stack completo (SEO, AEO, paid, CRM, SDR IA, contenido) en nuestra plataforma AI-native propia. La entrega pasa por WhatsApp — sin reuniones semanales. Obtienes una función de CMO fraccional por una fracción del costo de un hire senior + stack de herramientas.">We run the full stack (SEO, AEO, paid, CRM, AI SDR, content) on our own AI-native platform. Delivery happens by email and chat — no weekly check-in meetings. You get a fractional CMO function at a fraction of what a senior hire + tool stack would cost.</p>
    </details>
  </section>

  <section class="lp-final">
    <h2 data-en="Ready to grow {esc(v['noun_en'])}?" data-es="¿Listo para crecer {esc(v['noun_es'])}?">Ready to grow {v["noun_en"]}?</h2>
    <p data-en="2 minutes to fill the form. A real plan in your inbox. No calls. No obligation." data-es="2 minutos para llenar el formulario. Un plan real por WhatsApp. Sin llamadas. Sin obligación.">2 minutes to fill the form. A real plan in your inbox. No calls. No obligation.</p>
    <a href="#plan-form" class="btn-primary" data-en="Get Your Free Plan →" data-es="Obtén Tu Plan Gratis →">Get Your Free Plan →</a>
  </section>
</main>

<footer class="lp-foot">
  <p>&copy; 2026 <a href="https://netwebmedia.com">NetWebMedia</a> &middot; <a href="https://netwebmedia.com/privacy.html" data-en="Privacy" data-es="Privacidad">Privacy</a> &middot; <a href="https://netwebmedia.com/terms.html" data-en="Terms" data-es="Términos">Terms</a> &middot; hello@netwebmedia.com</p>
</footer>

<script src="https://netwebmedia.com/js/utm-capture.js" defer></script>
<script>
  (function() {{
    var stored = localStorage.getItem('nwm-lang') || 'en';
    if (stored === 'es') setLang('es');
  }})();
  function setLang(lang) {{
    localStorage.setItem('nwm-lang', lang);
    document.documentElement.lang = lang;
    document.getElementById('lp-en').classList.toggle('active', lang === 'en');
    document.getElementById('lp-es').classList.toggle('active', lang === 'es');
    document.querySelectorAll('[data-' + lang + ']').forEach(function(el) {{
      el.textContent = el.getAttribute('data-' + lang);
    }});
    document.querySelectorAll('[data-' + lang + '-placeholder]').forEach(function(el) {{
      el.placeholder = el.getAttribute('data-' + lang + '-placeholder');
    }});
  }}
</script>
</body>
</html>"""


def build_thanks(v):
    """Per-subdomain thanks page with WhatsApp-first framing."""
    return f"""<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Thanks — We're building your plan | NetWebMedia</title>
  <meta name="robots" content="noindex,follow">
  <link rel="icon" type="image/svg+xml" href="https://netwebmedia.com/assets/nwm-logo.svg">
  <link rel="stylesheet" href="https://netwebmedia.com/css/styles.css">
  <style>
    body{{background:var(--bg-primary);color:var(--text-primary);margin:0;min-height:100vh;display:flex;flex-direction:column}}
    .tx-nav{{display:flex;align-items:center;justify-content:space-between;padding:18px 24px;border-bottom:1px solid var(--border-glass)}}
    .tx-wrap{{flex:1;display:flex;align-items:center;justify-content:center;padding:60px 24px;text-align:center}}
    .tx-card{{max-width:640px}}
    .tx-icon{{width:72px;height:72px;margin:0 auto 28px;background:var(--gradient-btn);border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:36px;color:#fff;box-shadow:var(--shadow-glow)}}
    .tx-card h1{{font-size:clamp(32px,5vw,48px);font-weight:800;margin-bottom:20px;font-family:var(--font-display);line-height:1.1}}
    .tx-card h1 .hl{{background:var(--gradient-text);-webkit-background-clip:text;background-clip:text;color:transparent}}
    .tx-card p.lead{{font-size:18px;color:var(--text-secondary);margin-bottom:32px;line-height:1.6}}
    .tx-next{{background:var(--bg-card);border:1px solid var(--border-glass);border-radius:var(--radius-md);padding:28px;text-align:left;margin-bottom:32px}}
    .tx-next h3{{font-size:14px;font-weight:800;letter-spacing:.12em;text-transform:uppercase;color:var(--nwm-orange);margin-bottom:16px}}
    .tx-next ol{{margin:0;padding-left:20px;color:var(--text-secondary);font-size:15px;line-height:1.7}}
    .tx-next ol li{{margin-bottom:8px}}
    .tx-ctas{{display:flex;gap:14px;justify-content:center;flex-wrap:wrap}}
    .btn-primary{{background:var(--gradient-btn);color:#fff;padding:14px 28px;border-radius:var(--radius-pill);font-weight:700;font-size:15px;text-decoration:none;display:inline-block}}
    .btn-ghost-white{{background:transparent;border:2px solid rgba(255,255,255,.3);color:#fff;padding:12px 26px;border-radius:var(--radius-pill);font-weight:600;font-size:15px;text-decoration:none;display:inline-block}}
    .btn-ghost-white:hover{{border-color:var(--nwm-orange);color:var(--nwm-orange)}}
    .tx-foot{{text-align:center;padding:28px 20px;color:var(--text-muted);font-size:12px;border-top:1px solid var(--border-glass)}}
    .tx-foot a{{color:var(--text-muted);text-decoration:none}}
    .tx-lang{{display:flex;gap:6px}}
    .tx-lang button{{background:transparent;border:1px solid var(--border-glass);color:var(--text-muted);padding:6px 12px;border-radius:4px;font-size:12px;cursor:pointer;font-weight:600}}
    .tx-lang button.active{{background:var(--nwm-orange);color:#fff;border-color:var(--nwm-orange)}}
  </style>
</head>
<body>

<header class="tx-nav">
  <a href="https://netwebmedia.com" class="nav-logo">
    <span class="logo-wordmark"><span class="logo-net">net</span><span class="logo-web">web</span><span class="logo-media">media</span></span>
  </a>
  <div class="tx-lang">
    <button id="tx-en" class="active" onclick="setLang('en')">EN</button>
    <button id="tx-es" onclick="setLang('es')">ES</button>
  </div>
</header>

<main class="tx-wrap">
  <div class="tx-card">
    <div class="tx-icon">✓</div>
    <h1>
      <span data-en="Got it." data-es="Recibido.">Got it.</span>
      <span class="hl" data-en="Your plan is being built." data-es="Tu plan está en camino.">Your plan is being built.</span>
    </h1>
    <p class="lead" data-en="Claude + a NetWebMedia strategist are building your personalized growth plan right now. We'll email it to you — usually within 24 hours. No calls, no meetings." data-es="Claude + un estratega NetWebMedia están construyendo tu plan personalizado ahora mismo. Te lo enviamos por WhatsApp — normalmente en menos de una hora. Sin llamadas, sin reuniones.">Claude + a NetWebMedia strategist are building your personalized growth plan right now. We'll email it to you — usually within 24 hours. No calls, no meetings.</p>

    <div class="tx-next">
      <h3 data-en="What happens next" data-es="Qué pasa ahora">What happens next</h3>
      <ol>
        <li data-en="Confirmation email sent to the address you provided (check spam just in case)." data-es="Enviamos un email de confirmación a la dirección que proporcionaste (revisa spam por si acaso).">Confirmation email sent to the address you provided (check spam just in case).</li>
        <li data-en="Within 24 hours: Claude + a human strategist build your personalized plan — SEO, AEO, paid, and AI-SDR gaps." data-es="En 1 hora: Claude + un estratega humano construyen tu plan personalizado — SEO, AEO, paid y brechas de SDR IA.">Within 24 hours: Claude + a human strategist build your personalized plan — SEO, AEO, paid, and AI-SDR gaps.</li>
        <li data-en="We email you the plan. Reply anytime with questions — we respond async." data-es="Te escribimos por WhatsApp con el plan. Responde cuando quieras con dudas — contestamos async.">We email you the plan. Reply anytime with questions — we respond async.</li>
        <li data-en="No calls. No calendar links. No pitch meetings. Everything stays in email, on your schedule." data-es="Sin llamadas. Sin links de calendario. Sin reuniones de pitch. Todo se mantiene en WhatsApp, en tu horario.">No calls. No calendar links. No pitch meetings. Everything stays in email, on your schedule.</li>
      </ol>
    </div>

    <div class="tx-ctas">
      <a href="https://netwebmedia.com" class="btn-primary" data-en="← Back to NetWebMedia" data-es="← Volver a NetWebMedia">← Back to NetWebMedia</a>
      <a href="https://netwebmedia.com/blog.html" class="btn-ghost-white" data-en="Read our playbook blog" data-es="Lee nuestro blog de playbooks">Read our playbook blog</a>
    </div>
  </div>
</main>

<footer class="tx-foot">
  <p>&copy; 2026 <a href="https://netwebmedia.com">NetWebMedia</a> &middot; <a href="https://netwebmedia.com/privacy.html" data-en="Privacy" data-es="Privacidad">Privacy</a> &middot; hello@netwebmedia.com</p>
</footer>

<script>
  (function() {{
    var stored = localStorage.getItem('nwm-lang') || 'en';
    if (stored === 'es') setLang('es');
  }})();
  function setLang(lang) {{
    localStorage.setItem('nwm-lang', lang);
    document.documentElement.lang = lang;
    document.getElementById('tx-en').classList.toggle('active', lang === 'en');
    document.getElementById('tx-es').classList.toggle('active', lang === 'es');
    document.querySelectorAll('[data-' + lang + ']').forEach(function(el) {{
      el.textContent = el.getAttribute('data-' + lang);
    }});
  }}
</script>
</body>
</html>"""


base = r'C:\Users\Usuario\Desktop\NetWebMedia'

built = 0
cleaned = 0
for v in LP:
    folder_abs = os.path.join(base, v["folder"])
    os.makedirs(folder_abs, exist_ok=True)

    # Landing page at folder root (was /audit/index.html)
    with open(os.path.join(folder_abs, "index.html"), 'w', encoding='utf-8') as f:
        f.write(build_lp(v))

    # Thanks page at folder root (was /audit/thanks.html)
    with open(os.path.join(folder_abs, "thanks.html"), 'w', encoding='utf-8') as f:
        f.write(build_thanks(v))

    # Clean up old /audit/ subfolder if it exists
    old_audit = os.path.join(folder_abs, "audit")
    if os.path.isdir(old_audit):
        shutil.rmtree(old_audit)
        cleaned += 1

    built += 1
    print(f"built: {v['folder']}/  ->  https://{v['slug']}.netwebmedia.com/")

print(f"\nDone — {built} landing pages + {built} thank-you pages built at subdomain root.")
print(f"Cleaned up {cleaned} old /audit/ folders.")
