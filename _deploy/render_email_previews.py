#!/usr/bin/env python3
"""
Render the 8 niche intro templates to local HTML files for approval.
Mirrors the exact PHP logic in crm-vanilla/api/handlers/seed_templates.php,
then merges sample variables so you see the final inbox-ready email.

Output: _deploy/email_review/*.html  (one per niche, plus index.html)
"""
import pathlib, json, html

OUT = pathlib.Path(__file__).parent / "email_review"
OUT.mkdir(exist_ok=True)

HDR = ('<div style="background:linear-gradient(135deg,#FF6B00,#ff4e00);'
       'padding:24px;border-radius:12px 12px 0 0;color:#fff;text-align:center">'
       '<div style="font-size:22px;font-weight:800;letter-spacing:.5px">NetWebMedia</div>'
       '<div style="font-size:13px;opacity:.9;margin-top:4px">Chile · Digital Growth Partners</div></div>')

FTR = ('<div style="background:#f6f7fb;padding:20px;border-radius:0 0 12px 12px;'
       'text-align:center;color:#666;font-size:12px;border-top:1px solid #eee">'
       '<p>NetWebMedia · Santiago, Chile · '
       '<a href="https://netwebmedia.com" style="color:#FF6B00">netwebmedia.com</a></p>'
       '<p style="margin-top:6px"><a href="{{unsubscribe_url}}" '
       'style="color:#999;text-decoration:underline">Unsubscribe</a></p></div>')


def body_block(content: str) -> str:
    return ('<div style="max-width:600px;margin:0 auto;'
            'font-family:-apple-system,Segoe UI,Roboto,sans-serif;'
            'color:#1a1a2e;line-height:1.6">'
            '<div style="background:#fff;padding:32px;'
            'border-left:1px solid #eee;border-right:1px solid #eee">' + content + '</div></div>')


def niche_email(niche: str, hook: str, pain: str, cta: str) -> dict:
    body = (
        "<p>Hola <strong>{{first_name}}</strong>,</p>"
        f"<p>{hook}</p>"
        f"<p>Revisando <strong>{{{{company}}}}</strong> en <strong>{{{{city}}}}</strong> "
        f"nos detuvimos en algo que vemos una y otra vez en {niche}: <em>{pain}</em></p>"
        "<p>Preparamos una auditoría digital gratuita de {{company}} — incluye puntaje 0-100, "
        "comparación con el promedio del rubro, y proyección de ingresos a 90 días.</p>"
        "<div style='text-align:center;margin:28px 0'>"
        "<a href='{{page_url}}' style='background:#FF6B00;color:#fff;padding:14px 28px;"
        "border-radius:8px;text-decoration:none;font-weight:700;display:inline-block'>"
        "Ver auditoría de {{company}} →</a></div>"
        f"<p>{cta}</p>"
        "<p>Un abrazo,<br><strong>Carlos Martínez</strong><br>Fundador · NetWebMedia<br>"
        "<a href='mailto:carlos@netwebmedia.com' style='color:#FF6B00'>carlos@netwebmedia.com</a></p>"
    )
    subject = "{{company}} — auditoría digital gratuita ({{city}})"
    html_doc = ('<div style="background:#f6f7fb;padding:24px">'
                '<div style="max-width:600px;margin:0 auto">'
                + HDR + body_block(body) + FTR + '</div></div>')
    return {"subject": subject, "html": html_doc}


TEMPLATES = [
    ("Tourism — Intro (Day 0)", "Tourism & Hospitality",
     niche_email("turismo y hotelería",
        "Estamos auditando los 50 prospectos de turismo más interesantes en su región.",
        "hoteles que pierden 15-18% de cada reserva en comisiones de OTAs porque no tienen booking propio",
        "Si tiene 20 minutos esta semana, le muestro exactamente cómo recuperar esas comisiones con un AI Booking Agent propio.")),
    ("Restaurants — Intro (Day 0)", "Restaurants & Gastronomy",
     niche_email("gastronomía",
        "Estoy revisando 50 restaurantes y cafés en su región — su ficha saltó a la vista.",
        "locales con ficha de Google Business vacía o sin fotos: reciben 42% menos llamadas que los competidores",
        "Armemos un call de 20 minutos y le muestro la diferencia exacta que haría una optimización GBP + Reels semanales.")),
    ("Health — Intro (Day 0)", "Health & Medical",
     niche_email("salud",
        "Vi su ficha mientras auditaba 50 clínicas y profesionales de salud en su región.",
        "el 58% de los pacientes abandona la reserva si no puede auto-agendar online",
        "En 20 minutos le muestro cómo un widget de agendamiento + CRM de pacientes eleva la tasa de conversión 30-40%.")),
    ("Beauty — Intro (Day 0)", "Beauty & Wellness",
     niche_email("belleza y bienestar",
        "Estoy revisando 50 salones y centros de estética de su región.",
        "locales sin TikTok pierden entero el público menor de 30 — y los que tienen booking online retienen 3× más clientes",
        "Si le interesa, en 20 minutos armamos el plan: Reels + booking + CRM, listos en 14 días.")),
    ("SMB — Intro (Day 0)", "Small/Medium Business Services",
     niche_email("pymes",
        "Acabamos de auditar 50 pymes en su región y nos gustaría compartir lo que encontramos en {{company}}.",
        "el 71% de las pymes chilenas todavía no tiene un sitio web moderno: ventaja enorme para quien llegue primero",
        "Con 20 minutos le muestro el sitio + Google Business + CRM que entregamos típicamente en 14 días por $997/mes.")),
    ("Law Firms — Intro (Day 0)", "Law Firms & Legal Services",
     niche_email("servicios legales",
        "Estamos auditando los 50 estudios jurídicos más relevantes de su región.",
        "despachos con email @gmail en el letterhead pierden autoridad y cobran honorarios 25-40% menores",
        "Si desea, armamos un call de 20 minutos — le muestro cómo LinkedIn + CRM + casos de estudio cierran 2.3× más retainers corporativos.")),
    ("Real Estate — Intro (Day 0)", "Real Estate & Property",
     niche_email("inmobiliario",
        "Estamos auditando 50 corredoras e inmobiliarias en su región.",
        "listings con tour 3D venden 31% más rápido y cierran 9% sobre precio de lista",
        "En 20 minutos le muestro el sitio con buscador + CRM + tours 3D que entregamos en 21 días.")),
    ("Local Specialist — Intro (Day 0)", "Local Specialist Services",
     niche_email("servicios locales",
        "Estamos auditando 50 especialistas locales (electricistas, gasfíteres, climatización) en su región.",
        'el 67% de las búsquedas "cerca de mí" convierte en 24h — sin Google Maps optimizado, esos clientes se van a la competencia',
        "Con 20 minutos armamos la optimización de Maps + booking + automación SMS que típicamente duplica las citas en 30 días.")),
]

SAMPLE_VARS = {
    "first_name": "María",
    "company":    "Hotel Costa Azul",
    "city":       "Valparaíso",
    "page_url":   "https://netwebmedia.com/companies/valparaiso/hotel-costa-azul.html",
    "unsubscribe_url": "https://netwebmedia.com/companies/crm-vanilla/api/index.php?r=track&a=unsub&t=sample",
}


def merge(tpl: str, vars_: dict) -> str:
    out = tpl
    for k, v in vars_.items():
        out = out.replace("{{" + k + "}}", v)
    return out


def slug(s: str) -> str:
    return s.lower().replace(" ", "-").replace("—", "").replace("(", "").replace(")", "").replace("/", "-").strip("-")


index_rows = []
for name, niche, em in TEMPLATES:
    merged_subject = merge(em["subject"], SAMPLE_VARS)
    merged_html    = merge(em["html"], SAMPLE_VARS)
    page = (
        "<!doctype html><html><head><meta charset='utf-8'>"
        f"<title>Preview · {html.escape(name)}</title>"
        "<style>body{margin:0;background:#eef0f5;font-family:-apple-system,Segoe UI,Roboto,sans-serif}"
        ".meta{background:#1a1a2e;color:#fff;padding:18px 24px;position:sticky;top:0}"
        ".meta h1{margin:0;font-size:16px;font-weight:600}"
        ".meta .sub{margin-top:4px;font-size:13px;opacity:.75}"
        ".meta .from{margin-top:6px;font-size:12px;opacity:.6}"
        ".approve{background:#FF6B00;color:#fff;border:0;padding:8px 16px;border-radius:6px;"
        "font-weight:600;cursor:pointer;margin-top:8px}"
        ".wrap{padding:24px}</style></head><body>"
        f"<div class='meta'><h1>📧 {html.escape(name)}</h1>"
        f"<div class='sub'><strong>Subject:</strong> {html.escape(merged_subject)}</div>"
        f"<div class='from'><strong>From:</strong> Carlos Martínez &lt;carlos@netwebmedia.com&gt; · "
        f"<strong>Niche:</strong> {html.escape(niche)}</div></div>"
        "<div class='wrap'>" + merged_html + "</div></body></html>"
    )
    fname = slug(name) + ".html"
    (OUT / fname).write_text(page, encoding="utf-8")
    index_rows.append((name, niche, merged_subject, fname))

# Index page for quick navigation
idx = ["<!doctype html><html lang='es'><head><meta charset='utf-8'>",
       "<title>Email Templates — Approval</title>",
       "<style>body{font-family:-apple-system,Segoe UI,Roboto,sans-serif;background:#f6f7fb;padding:40px;color:#1a1a2e}",
       "h1{margin:0 0 8px}.sub{color:#666;margin-bottom:28px}",
       "table{width:100%;max-width:1100px;border-collapse:collapse;background:#fff;border-radius:10px;",
       "box-shadow:0 2px 10px rgba(20,22,40,.06);overflow:hidden}",
       "th,td{padding:14px 18px;text-align:left;border-bottom:1px solid #eef0f5;font-size:14px}",
       "th{background:#1a1a2e;color:#fff;font-weight:600;font-size:12px;letter-spacing:.5px;text-transform:uppercase}",
       "tr:last-child td{border:0}a.btn{background:#FF6B00;color:#fff;padding:6px 14px;border-radius:6px;",
       "text-decoration:none;font-weight:600;font-size:12px}.niche{color:#FF6B00;font-weight:600}",
       ".subj{color:#555;font-style:italic}</style></head><body>",
       "<h1>📧 8 Email Templates · Approval Required</h1>",
       f"<div class='sub'>Preview each template, then reply with <strong>approve</strong> to seed + launch, "
       f"or flag specific edits. Sample vars: company=<em>{SAMPLE_VARS['company']}</em>, "
       f"city=<em>{SAMPLE_VARS['city']}</em>, first_name=<em>{SAMPLE_VARS['first_name']}</em>.</div>",
       "<table><thead><tr><th>#</th><th>Template</th><th>Niche</th><th>Subject</th><th>Preview</th></tr></thead><tbody>"]
for i, (name, niche, subj, fname) in enumerate(index_rows, 1):
    idx.append(f"<tr><td>{i}</td><td><strong>{html.escape(name)}</strong></td>"
               f"<td class='niche'>{html.escape(niche)}</td>"
               f"<td class='subj'>{html.escape(subj)}</td>"
               f"<td><a class='btn' href='{fname}' target='_blank'>Open →</a></td></tr>")
idx.append("</tbody></table></body></html>")
(OUT / "index.html").write_text("\n".join(idx), encoding="utf-8")

print(f"Rendered {len(TEMPLATES)} previews + index to {OUT}")
print(f"Open: {OUT / 'index.html'}")
