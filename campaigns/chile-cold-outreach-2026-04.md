# Chile Cold Outreach Campaign — April 2026

**Audience:** 320 businesses in Santiago metro (santiago_leads.csv) across 14 verticals
**Anchor assets:**
- https://netwebmedia.com/santiago-digital-gaps.html (gap analysis)
- https://netwebmedia.com/santiago-prospects-report.html (city-level context)
- https://netwebmedia.com/ (site, ES/EN toggle)

**Sending infra:** `api-php/lib/mailer.php` (PHP mail via cPanel sendmail, From: newsletter@netwebmedia.com)
**Reply-to:** hola@netwebmedia.com (monitored by Carlos)
**Throttle:** 90 seconds between sends (≈40/hour → full list completes in ~8h)
**Language:** Spanish (Chilean register — "tú", no "vosotros", no Spain-only idioms)
**Async-only CTAs:** WhatsApp (+569 XXXX XXXX) · hola@netwebmedia.com · chat widget · no phone/no Zoom

---

## Email 1 — Subject A/B

**A:** Revisé tu presencia digital, {{company}} (3 brechas que cuestan ventas)
**B:** {{company}} pierde ~{{monthly_loss}} al mes — 3 brechas en 2 min

**Preheader:** Auditoría escrita gratis, en 48h, sin llamadas ni reuniones.

**Body (HTML, rendered via email_shell):**

Hola equipo de {{company}},

Soy Carlos Martínez, fundador de NetWebMedia (Santiago).

Esta semana publicamos un análisis de la brecha digital de 320 negocios en Santiago. {{company}} apareció en el reporte — y encontramos **3 brechas específicas** que están bloqueando ventas que ya están demandando tu servicio:

1. {{gap_1}} *(impacto: {{impact_1}})*
2. {{gap_2}} *(impacto: {{impact_2}})*
3. {{gap_3}} *(impacto: {{impact_3}})*

El reporte público está acá: **[santiago-digital-gaps.html](https://netwebmedia.com/santiago-digital-gaps.html)**

**¿Querés la auditoría completa de {{company}}?** Respondemos en 48 horas con un PDF accionable — sin llamadas, sin Zoom, sin pitch. Lo lees cuando puedas.

Tres formas de pedirla (elegí la que te acomode):

- 💬 **WhatsApp:** [wa.me/17407363884](https://wa.me/17407363884)
- ✉️ **Email:** responder a este correo con "AUDITORÍA"
- 🌐 **Web:** [netwebmedia.com](https://netwebmedia.com) → el chat naranja abajo a la derecha

Carlos
Fundador, NetWebMedia
"CMO fraccional con IA — sin llamadas, sin agencias, sin mínimos"

*P.D. Si no es el momento, respondé "STOP" y te quito de la lista de una. Cero dramas.*

---

## Email 2 (Day +4 — non-openers + non-replies)

**Subject:** {{company}} — ¿te mando el benchmark de tu competencia?

Hola,

Revisé {{company}} la semana pasada pero no me escribiste. Todo bien.

Sólo un dato: de los {{vertical_count}} negocios de **{{niche}}** en Santiago que auditamos, {{company}} está en el **percentil {{percentile}}** en presencia digital. No es una catástrofe — pero sí es donde tus competidores directos te están sacando delantera.

Si querés, puedo mandarte el benchmark comparado contra tus 5 competidores más cercanos. Gratis, PDF, en 48h.

Respondé con "BENCHMARK" y lo preparamos.

Carlos
NetWebMedia

---

## Email 3 (Day +10 — non-responders)

**Subject:** Cerrando el archivo de {{company}}

Hola,

Te escribí dos veces este mes sobre la auditoría digital de {{company}}. Entiendo que no es el momento y está todo bien.

Voy a cerrar tu archivo del lado nuestro. Si alguna vez te sirve:

- 💬 WhatsApp: [wa.me/17407363884](https://wa.me/17407363884)
- 🌐 Web: [netwebmedia.com](https://netwebmedia.com)
- 📄 Reporte Santiago (público): [santiago-digital-gaps.html](https://netwebmedia.com/santiago-digital-gaps.html)

Mucho éxito con {{company}}.

Carlos Martínez
NetWebMedia

---

## Unsubscribe footer (appended to every email)

*Estás recibiendo este correo porque {{company}} apareció en nuestro análisis público de 320 negocios en Santiago (abril 2026). Para dejar de recibir correos, respondé "STOP" o escribí a hola@netwebmedia.com. Sede: Santiago, Chile. NetWebMedia SpA.*

---

## Launch gate checklist (Carlos must approve before full send)

- [ ] Verify real WhatsApp number replaces `17407363884` placeholder
- [ ] Test send to carlos@netwebmedia.com — spam-score < 3
- [ ] Test send to 5 friendly inboxes (not in prospect list)
- [ ] Confirm From address `newsletter@netwebmedia.com` has SPF + DKIM set
- [ ] Batch 1: send to 10 tourism-niche prospects, monitor 24h
- [ ] If bounce < 5% AND open > 15%, release batch 2 (50 more)
- [ ] If batch 2 holds, release rest at 90s throttle
