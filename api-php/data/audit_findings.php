<?php
/* Per-niche audit content for the Chile cold-outreach audit page (audit.php).
 * Three pools per niche:
 *   - gaps        : 6+ observations rendered as the "what we found" list
 *   - priorities  : 4+ short imperative actions for the 30-day plan
 *   - projections : 4+ outcome statements for the 90-day projection
 *
 * Voice: Chilean Spanish tú (no voseo). Findings are directional — they
 * describe common patterns in the niche without making fabricated numeric
 * claims about the specific business.
 *
 * Used by audit.php (and partly mirrored by api-php/chile-send.php's
 * niche_findings() for the email's 3-finding hook).
 */

return [

  '_default' => [
    'gaps' => [
      'No apareces en las recomendaciones automáticas de ChatGPT, Claude ni Perplexity para tu categoría en Santiago.',
      'La velocidad móvil del sitio supera el umbral que penaliza Google — más de 4 segundos para el primer contenido visible.',
      'No vemos captura de leads ni nurturing automatizado — cada consulta entrante depende de respuesta manual.',
      'Las reseñas en Google My Business no tienen gestión activa desde la cuenta del titular.',
      'Falta marcado schema LocalBusiness con horario, dirección y servicios — Google no muestra tu ficha en vista rica.',
      'No hay integración WhatsApp con auto-respuesta inicial; las consultas dependen de horario hábil.',
    ],
    'priorities' => [
      'Implementar AEO: estructurar el sitio para que ChatGPT, Claude y Perplexity puedan citarte en respuestas.',
      'Optimizar velocidad móvil para bajar de 4 segundos en el primer contenido visible.',
      'Activar captura de leads automatizada con nurturing por correo y WhatsApp.',
    ],
    'projections' => [
      'Aparecer en 30 a 50% más respuestas de IA para búsquedas de tu categoría en los próximos 90 días.',
      'Reducir el tiempo de primera respuesta de horas a menos de 2 minutos vía WhatsApp con bot inicial.',
      'Recuperar entre 15 y 25% del tráfico que hoy se pierde por velocidad móvil baja.',
      'Subir el puntaje de presencia digital de su nivel actual a 70+ en 90 días.',
    ],
  ],

  'tourism' => [
    'gaps' => [
      'No apareces en ChatGPT cuando alguien pregunta por hoteles boutique o aparthoteles en Santiago — esa recomendación se la están llevando 3 o 4 competidores directos.',
      'Tu sitio no tiene marcado schema de Hotel con precios y disponibilidad, así que Google no lo muestra en la vista rica de alojamiento en móvil.',
      'La carga móvil supera los 4 segundos hasta el primer contenido visible, y Google penaliza eso en el ranking hotelero local.',
      'No vemos un flujo de reserva con respuesta automática; las consultas dependen de que alguien conteste manualmente en horario hábil.',
      'La integración con WhatsApp no está visible en el sitio — y más del 60% de los viajeros chilenos prefiere ese canal antes de llamar.',
      'No hay captura de correos para promociones de temporada baja, lo que deja fuera la fidelización repetida.',
      'Las fotos del sitio no están optimizadas para WebP/AVIF, agregando 1-2 segundos de carga en móvil.',
    ],
    'priorities' => [
      'Implementar schema Hotel con precios, disponibilidad y amenidades — entrada directa a la vista rica de Google.',
      'Activar reserva online con respuesta automática y confirmación por correo + WhatsApp.',
      'Estructurar AEO para responder consultas tipo "mejor hotel boutique en [comuna]" en ChatGPT y Perplexity.',
    ],
    'projections' => [
      'Aparecer en respuestas de IA para 4-6 consultas habituales del rubro hotelero en Santiago.',
      'Reducir el tiempo de respuesta a primera consulta de 6+ horas a menos de 5 minutos.',
      'Subir entre 20 y 35% la conversión de visita a reserva con velocidad móvil corregida.',
      'Capturar entre 50 y 120 correos nuevos al mes para fidelización de huéspedes recurrentes.',
    ],
  ],

  'restaurants' => [
    'gaps' => [
      'Cuando le preguntamos a ChatGPT "dónde comer bien en Providencia", tu restaurante no apareció en la respuesta — la IA está resolviendo eso con datos públicos que hoy no te favorecen.',
      'La carta no está marcada con schema Menu/Restaurant, así que Google no la muestra en la vista rica de búsqueda local.',
      'No detectamos reservas en línea automatizadas — el flujo sigue pasando por teléfono o WhatsApp manual, y se pierde la consulta nocturna.',
      'Las reseñas recientes en Google no tienen respuesta del dueño, y eso baja hasta 30% el clic desde el mapa.',
      'No vemos captura de correos ni fidelización digital, lo que deja fuera la recompra predecible mes a mes.',
      'Las fotos del local en Google y redes son inconsistentes — falta una sesión profesional con luz natural.',
      'No hay link directo a delivery (Rappi, PedidosYa, Uber Eats) en la home, lo que pierde pedidos express.',
    ],
    'priorities' => [
      'Implementar schema Restaurant + Menu con precios y horarios — entrada directa a la vista rica de Google.',
      'Activar reservas online 24/7 con confirmación automática por WhatsApp.',
      'Estructurar AEO para responder consultas tipo "dónde comer bien en [comuna]" en ChatGPT.',
    ],
    'projections' => [
      'Aparecer en 4-6 respuestas mensuales de IA para consultas gastronómicas en tu zona.',
      'Reducir reservas perdidas por horario cerrado en al menos 60% con flujo nocturno automatizado.',
      'Subir el clic desde Google Maps entre 15 y 30% con gestión activa de reseñas.',
      'Aumentar la base de correos para fidelización entre 80 y 150 contactos al mes.',
    ],
  ],

  'beauty' => [
    'gaps' => [
      'No apareces en las recomendaciones de IA cuando alguien busca "mejor peluquería" o "spa" en tu comuna — y ese es el momento de decisión.',
      'No vemos reserva online 24/7 integrada; las clientas que miran a las 22:00 tienen que esperar al día siguiente para agendar.',
      'El sitio no muestra precios por servicio de forma estructurada, lo que baja la conversión móvil de manera notable.',
      'Instagram y web no comparten calendario de citas, así que aparecen reservas duplicadas o perdidas con frecuencia.',
      'No hay recordatorio automático por WhatsApp antes de la cita, y el ausentismo sin aviso promedia 15% en el rubro.',
      'No vemos programa de fidelización digital — ni puntos, ni descuentos por recompra, ni campañas de cumpleaños.',
    ],
    'priorities' => [
      'Activar reserva online 24/7 con calendario integrado entre Instagram y web.',
      'Implementar recordatorio automático por WhatsApp 24h antes de cada cita para reducir ausentismo.',
      'Estructurar AEO para aparecer en consultas tipo "mejor peluquería en [comuna]" en ChatGPT y Google.',
    ],
    'projections' => [
      'Bajar el ausentismo sin aviso del 15% promedio del rubro a menos de 6%.',
      'Capturar 30-50% de reservas adicionales en horario fuera de oficina con agendamiento online.',
      'Aparecer en 3-5 respuestas mensuales de IA para tu categoría en la comuna.',
      'Incrementar la recompra a 90 días entre 18 y 30% con programa de fidelización digital básico.',
    ],
  ],

  'law_firms' => [
    'gaps' => [
      'Al buscar "abogado experto en [tu área] Santiago" en ChatGPT, tu estudio no figura en la respuesta — la IA está resolviendo esa consulta sin tus datos.',
      'El sitio no tiene schema LegalService ni FAQ marcado, lo que reduce la visibilidad en la vista rica de Google para consultas legales.',
      'No vemos captura de consulta automatizada — cada lead depende de que alguien responda el correo al día siguiente.',
      'Las reseñas en Google My Business no tienen respuesta, y en el rubro legal eso pesa mucho más que en otros (criterio de confianza).',
      'No hay WhatsApp con triage de urgencia legal, que es el canal número uno en Chile para este tipo de consulta.',
      'El blog del sitio no responde preguntas frecuentes específicas (ej. "cómo demandar a empresa por acoso laboral en Chile") — eso es lo que la IA cita.',
    ],
    'priorities' => [
      'Estructurar AEO con páginas pilar por área de práctica para que ChatGPT y Perplexity te citen.',
      'Activar formulario de consulta automatizado con triage por área y urgencia.',
      'Implementar gestión activa de reseñas con respuesta dentro de 48 horas a cada review.',
    ],
    'projections' => [
      'Aparecer en respuestas de IA para 5-10 consultas legales habituales en Chile.',
      'Reducir el tiempo de primer contacto a leads de 24+ horas a menos de 30 minutos.',
      'Aumentar las consultas calificadas vía web entre 40 y 70% con AEO + captura automatizada.',
      'Subir el ranking en Google Maps con gestión de reseñas — ganas el efecto compuesto a 90 días.',
    ],
  ],

  'real_estate' => [
    'gaps' => [
      'Al preguntarle a ChatGPT "corredor de propiedades en [tu comuna]", tu nombre no aparece en las recomendaciones automáticas.',
      'Las fichas de propiedades no están marcadas con schema RealEstateListing, así que no salen en la vista rica de Google.',
      'No hay calificador automático de leads (precio, comuna, urgencia) — los corredores pierden tiempo con leads no calificados.',
      'El WhatsApp de la página parece manual; un bot bien configurado puede triar el 80% de las consultas iniciales antes de tomar el teléfono.',
      'Las visitas no se agendan online — el flujo sigue pasando por correo o llamada, y eso baja la conversión sobre leads jóvenes.',
      'No vemos campañas de remarketing para visitantes que vieron una propiedad pero no contactaron.',
    ],
    'priorities' => [
      'Implementar schema RealEstateListing en cada ficha — entrada directa a la vista rica de Google.',
      'Activar bot de WhatsApp que triague leads por comuna, precio y urgencia.',
      'Estructurar AEO con páginas pilar por comuna para captar consultas en ChatGPT.',
    ],
    'projections' => [
      'Triplicar la calificación de leads gracias al bot de WhatsApp con triage automático.',
      'Aparecer en respuestas de IA para 3-5 consultas mensuales de "corredor en [comuna]".',
      'Aumentar las visitas agendadas vía web entre 25 y 40% con agendamiento online directo.',
      'Recuperar 15-30% de leads tibios con remarketing automatizado a 30 días.',
    ],
  ],

  'health' => [
    'gaps' => [
      'La clínica no aparece en respuestas de IA para consultas tipo "especialista en [tu área] Santiago".',
      'No vemos reserva de hora online integrada con la disponibilidad real del box — los pacientes se van si no consiguen hora en dos intentos.',
      'No hay recordatorio automático de cita por WhatsApp; el ausentismo en salud promedia entre 18% y 22%.',
      'Las reseñas de Google My Business no se gestionan activamente, y en salud eso define la elección ocho de cada diez veces.',
      'No detectamos captura de leads para chequeos preventivos con nurturing automatizado por correo.',
      'Falta página por especialidad con FAQ marcado — Google no muestra tu clínica en la vista rica de salud.',
    ],
    'priorities' => [
      'Activar reserva online 24/7 sincronizada con la disponibilidad real de cada box.',
      'Implementar recordatorios automáticos de cita por WhatsApp 24h y 2h antes.',
      'Estructurar AEO con páginas por especialidad y FAQ marcado en schema.',
    ],
    'projections' => [
      'Bajar el ausentismo del 18-22% promedio a menos de 9% con recordatorios automáticos.',
      'Aparecer en respuestas de IA para 4-6 consultas frecuentes de salud en tu zona.',
      'Aumentar las reservas online entre 30 y 50% con disponibilidad sincronizada.',
      'Mejorar el ranking en Google Maps con gestión activa de reseñas a 90 días.',
    ],
  ],

  'home_services' => [
    'gaps' => [
      'No figuras en las recomendaciones de IA cuando alguien pregunta "quién hace [tu servicio] en Santiago".',
      'No vemos cotizador automático en el sitio — todo lead calificado depende de que alguien revise WhatsApp o correo.',
      'Las reseñas de Google My Business no tienen respuesta del titular, lo que pesa mucho en decisiones de servicio urgente.',
      'El sitio no marca schema LocalBusiness con área de servicio, así que Google no lo prioriza en búsquedas por comuna.',
      'Los seguimientos post-servicio no están automatizados — se pierde el 40% de recompra que depende de un recordatorio a 90 días.',
      'No hay portafolio fotográfico antes/después estructurado por tipo de trabajo.',
    ],
    'priorities' => [
      'Implementar cotizador automático en el sitio — captura el lead antes de que pida tres presupuestos a competidores.',
      'Activar AEO para aparecer en consultas tipo "quién hace [servicio] en [comuna]" en ChatGPT.',
      'Configurar seguimiento automatizado post-servicio a 30 y 90 días para recompra.',
    ],
    'projections' => [
      'Triplicar la velocidad de respuesta a leads urgentes con cotizador automático.',
      'Aparecer en respuestas de IA para 3-5 consultas mensuales de tu categoría en Santiago.',
      'Recuperar entre 20 y 35% de recompra perdida con seguimiento automatizado.',
      'Subir conversión de visita a contacto entre 25 y 40% con cotizador instantáneo.',
    ],
  ],

  'education' => [
    'gaps' => [
      'Al buscar "curso o programa de [tema] en Chile" en ChatGPT, tu institución no aparece en la respuesta.',
      'El sitio no tiene schema Course con precio y duración, así que no sale en la vista rica de educación en Google.',
      'No hay nurturing automatizado para quien descarga un programa — la mayoría se pierde sin un segundo contacto.',
      'Los formularios de matrícula pasan por correo manual, y se pierden leads por respuesta tardía mayor a 24 horas.',
      'No vemos captura de correos en el blog ni gating con descarga de programa.',
      'La página de cada programa no responde objeciones frecuentes (precio, duración, modalidad, certificación).',
    ],
    'priorities' => [
      'Implementar schema Course en cada programa — entrada directa a la vista rica de educación en Google.',
      'Activar nurturing automatizado por correo + WhatsApp para leads que descargan información.',
      'Estructurar AEO con páginas pilar por área de estudio para captar consultas en ChatGPT.',
    ],
    'projections' => [
      'Aparecer en respuestas de IA para 4-8 consultas educativas en tu área.',
      'Aumentar la conversión de descarga a inscripción entre 25 y 45% con nurturing automatizado.',
      'Reducir el tiempo de respuesta a postulantes de días a minutos con formulario automatizado.',
      'Capturar 100-300 correos calificados al mes con gating en el blog y descarga de programas.',
    ],
  ],

  'automotive' => [
    'gaps' => [
      'No figuras en búsquedas de IA tipo "taller o concesionario recomendado en [comuna]".',
      'No vemos cotizador automático de repuesto o servicio — cada lead tiene que esperar respuesta manual.',
      'Las reseñas en Google My Business están sin gestionar, y en automotriz eso define confianza al cien por ciento.',
      'No hay recordatorio automatizado de mantención a los 10.000 km por WhatsApp, que es el canal número uno de recompra en el rubro.',
      'Falta página por marca/modelo con schema Vehicle/AutoRepair para vista rica de Google.',
      'No vemos captura de correos para campañas estacionales (cambio de aceite invierno, neumáticos verano).',
    ],
    'priorities' => [
      'Implementar cotizador automático de servicio y repuesto.',
      'Activar recordatorio automatizado de mantención por WhatsApp + correo.',
      'Estructurar AEO con página por marca/modelo y schema Vehicle.',
    ],
    'projections' => [
      'Triplicar la recompra de mantención con recordatorios automáticos a 6 meses.',
      'Aparecer en respuestas de IA para 3-5 consultas mensuales de tu categoría.',
      'Mejorar el ranking en Google Maps con gestión activa de reseñas.',
      'Aumentar la conversión de visita a cotización entre 30 y 50% con cotizador online.',
    ],
  ],

  'financial_services' => [
    'gaps' => [
      'La firma no aparece en recomendaciones de IA para consultas tipo "asesor [tu especialidad] en Chile".',
      'No vemos calificador automático de leads por monto o urgencia — los asesores pierden tiempo con leads no calificados.',
      'No hay FAQ marcado con schema ni páginas pilar sobre los servicios, lo que baja la captura orgánica.',
      'Los follow-ups después de una primera consulta no están automatizados, y se pierde el 60% de los leads tibios.',
      'El sitio no muestra credenciales y certificaciones de forma estructurada — ese es el principal criterio de confianza en finanzas.',
      'Falta gating en el blog para capturar correos en cambio por descargas de guías financieras.',
    ],
    'priorities' => [
      'Implementar calificador automático de leads en el formulario de contacto.',
      'Activar nurturing automatizado de 5 correos para leads que descargan guías o piden consulta.',
      'Estructurar AEO con páginas pilar por servicio y FAQ marcado en schema.',
    ],
    'projections' => [
      'Recuperar entre 30 y 50% de leads tibios con nurturing automatizado.',
      'Aparecer en respuestas de IA para 4-6 consultas financieras frecuentes.',
      'Triplicar la calificación de leads con formulario inteligente.',
      'Capturar 80-200 correos calificados al mes con gating en el blog.',
    ],
  ],

  'events_weddings' => [
    'gaps' => [
      'No figuras en las recomendaciones de IA cuando alguien busca "wedding planner" o "venue para evento" en Santiago.',
      'No hay cotizador online por tamaño de evento — todas las consultas pasan por un flujo manual lento.',
      'El portafolio visual no está optimizado para móvil, donde se toma el 85% de las decisiones iniciales del rubro.',
      'No vemos nurturing automatizado para leads que piden información pero no reservan en la primera semana.',
      'Las fotos del portafolio no tienen tags estructurados (ceremonia, recepción, decoración), lo que limita la búsqueda interna.',
      'Falta integración WhatsApp como canal principal — la mayoría de las consultas iniciales en eventos pasa por ese canal.',
    ],
    'priorities' => [
      'Implementar cotizador automático por número de invitados y tipo de evento.',
      'Activar nurturing automatizado para leads tibios a 7, 14 y 30 días.',
      'Estructurar AEO para aparecer en consultas tipo "wedding planner en Santiago" en ChatGPT.',
    ],
    'projections' => [
      'Recuperar entre 25 y 40% de leads que hoy se pierden por respuesta manual lenta.',
      'Aparecer en respuestas de IA para 3-5 consultas mensuales de tu categoría.',
      'Aumentar la conversión de cotización a reserva entre 20 y 35% con flujo automatizado.',
      'Reducir el tiempo de respuesta a primera consulta de 24+ horas a menos de 30 minutos.',
    ],
  ],

  'wine_agriculture' => [
    'gaps' => [
      'No figuras en búsquedas de IA por variedad, valle o tipo de experiencia enoturística en Chile.',
      'No vemos reserva online integrada para tours o cata — cada lead depende de un correo manual.',
      'Falta schema Product o LocalBusiness para que Google muestre tu oferta en vistas ricas de búsqueda.',
      'No hay captura de correos para venta directa al consumidor, que es donde está el margen hoy.',
      'Las traducciones inglés/portugués del sitio son inconsistentes o están ausentes — cierra puertas a turismo extranjero.',
      'Falta integración con Mercado Pago Click para venta de tours/botellas con un clic.',
    ],
    'priorities' => [
      'Activar reserva online de tours y cata con confirmación automática.',
      'Implementar venta directa al consumidor con Mercado Pago Click.',
      'Estructurar AEO con páginas por variedad y valle para captar consultas en ChatGPT.',
    ],
    'projections' => [
      'Aparecer en respuestas de IA para 3-5 consultas mensuales de enoturismo en Chile.',
      'Capturar 50-150 correos calificados al mes para venta directa al consumidor.',
      'Aumentar la conversión de visita a reserva de tour entre 30 y 50%.',
      'Subir el ticket promedio con bundling automático de tour + botellas.',
    ],
  ],

];
