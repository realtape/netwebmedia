/* CRM Shared Application Logic — Bilingual ES/EN */
(function () {
  "use strict";

  /* ── i18n ── */
  var I18N = {
    en: {
      brand: "NetWeb CRM",
      nav: {
        dashboard: "Dashboard", conversations: "Conversations", calendars: "Calendars",
        contacts: "Contacts", pipeline: "Opportunities", payments: "Payments",
        marketing: "Marketing", automation: "Automation", sites: "Sites",
        reputation: "Reputation", reporting: "Reporting", documents: "Documents",
        courses: "Courses", social: "Social Planner", settings: "Settings"
      },
      roles: { demo: "Demo", guest: "Guest", admin: "Admin", user: "User", client: "Client" },
      search: "Search contacts...",
      filters: { all: "All", customer: "Customers", prospect: "Prospects", lead: "Leads", churned: "Churned" },
      cols: { name: "Name", company: "Company", region: "Region", status: "Status", value: "Value", last_contact: "Last Contact", audit: "Audit" },
      syncHubspot: "Sync HubSpot", syncing: "Syncing…",
      upgrade: {
        title: "Upgrade to Access ",
        sub: "Your demo includes the Dashboard overview. Unlock all 15 modules with a plan.",
        cta: "Contact Sales"
      },
      langLabel: "Language",
      common: {
        save: "Save", cancel: "Cancel", delete: "Delete", edit: "Edit", add: "Add",
        create: "Create", search: "Search", filter: "Filter", view: "View",
        send: "Send", copy: "Copy", share: "Share", reply: "Reply", close: "Close",
        today: "Today", yesterday: "Yesterday", thisWeek: "This Week", thisMonth: "This Month",
        viewAll: "View All", active: "Active", inactive: "Inactive", all: "All",
        name: "Name", status: "Status", date: "Date", actions: "Actions", amount: "Amount",
        loading: "Loading…"
      },
      modules: {
        dashboard: {
          newDeal: "New Deal",
          revenueOverview: "Revenue Overview",
          vsLastQuarter: "+24% vs last quarter",
          activeDeals: "Active Deals",
          viewAll: "View All",
          todaySchedule: "Today's Schedule",
          recentContacts: "Recent Contacts",
          totalContacts: "Total Contacts",
          newLeads: "New Leads",
          revenue: "Revenue",
          conversion: "Conversion",
          avgDeal: "Avg Deal",
          vsLastMonth: "vs last month"
        },
        conversations: {
          all: "All", email: "Email", sms: "SMS", whatsapp: "WhatsApp",
          selectConv: "Select a conversation",
          typeMsg: "Type your message...",
          empty: "No conversations found",
          justNow: "Just now"
        },
        calendar: {
          today: "Today", month: "Month", week: "Week", day: "Day",
          newEvent: "New Event"
        },
        pipeline: {
          newDeal: "New Deal",
          stages: {
            "New Lead": "Nuevo Lead", "Contacted": "Contactado", "Qualified": "Calificado",
            "Proposal Sent": "Propuesta Enviada", "Negotiation": "Negociación",
            "Closed Won": "Ganado", "Closed Lost": "Perdido"
          },
          daysInStage: "d in stage"
        },
        payments: {
          createInvoice: "Create Invoice",
          invoices: "Invoices", subscriptions: "Subscriptions",
          paymentLinks: "Payment Links", transactions: "Transactions",
          totalRevenue: "Total Revenue", outstanding: "Outstanding",
          overdue: "Overdue", thisMonth: "This Month",
          invoiceNum: "Invoice #", client: "Client", amount: "Amount",
          status: "Status", date: "Date", actions: "Actions",
          plan: "Plan", interval: "Interval", nextBill: "Next Bill",
          link: "Link", clicks: "Clicks", conversions: "Conversions",
          txnId: "Transaction ID", type: "Type", method: "Method",
          view: "View", send: "Send", copy: "Copy", edit: "Edit",
          monthly: "Monthly", active: "Active", pastDue: "Past Due",
          paid: "Paid", pending: "Pending"
        },
        marketing: {
          emailMarketing: "Email Marketing",
          newCampaign: "New Campaign", newTemplate: "New Template",
          campaigns: "Campaigns", templates: "Templates",
          totalSent: "Total Sent", openRate: "Open Rate",
          clickRate: "Click Rate", inProgress: "In Progress",
          name: "Name", status: "Status", sent: "Sent",
          opens: "Opens", clicks: "Clicks", created: "Created",
          actions: "Actions", subject: "Subject", niche: "Niche",
          updated: "Updated",
          edit: "Edit", preview: "Preview", test: "Test",
          sendBtn: "Send", use: "Use",
          noCampaigns: 'No campaigns yet. Click "+ New Campaign" to start.',
          noTemplates: 'No templates yet. Click "+ New Template" to create reusable emails with merge tags like {{name}}, {{company}}, {{city}}, {{page_url}}.',
          editCampaign: "Edit campaign", newCampaignTitle: "New campaign",
          editTemplate: "Edit template", newTemplateTitle: "New template",
          audienceFilter: "Audience filter",
          nameReq: "Name required",
          fieldsReq: "Name, subject, body required",
          confirmDelCampaign: "Delete this campaign? (sends history preserved)",
          confirmDelTemplate: "Delete this template?",
          testPrompt: "Send test email to:",
          fromName: "From name", fromEmail: "From email", htmlBody: "HTML body",
          template: "Template", city: "City",
          mergeTags: "Merge tags:",
          loadErr: "Error loading data: ",
          firstTimeHint: "If this is your first time: POST to /api/?r=migrate&token=NWM_MIGRATE_2026 to create tables.",
          save: "Save", cancel: "Cancel"
        },
        automation: {
          newWorkflow: "New Workflow",
          all: "All", active: "Active", inactive: "Inactive",
          runs: "Runs", last: "Last", edit: "Edit"
        },
        sites: {
          newSite: "New Site",
          funnels: "Funnels", websites: "Websites", forms: "Forms", surveys: "Surveys",
          pages: "Pages", visits: "Visits", conv: "Conv",
          funnelPreview: "Funnel Preview", websitePreview: "Website Preview",
          formName: "Form Name", submissions: "Submissions",
          conversionRate: "Conversion Rate", status: "Status", actions: "Actions",
          surveyName: "Survey Name", responses: "Responses", avgScore: "Avg Score",
          edit: "Edit", share: "Share"
        },
        reputation: {
          requestReview: "Request Review",
          avgRating: "Average Rating", totalReviews: "Total Reviews",
          thisMonth: "This Month", responseRate: "Response Rate",
          responded: "Responded", awaiting: "Awaiting Response", reply: "Reply"
        },
        reporting: {
          leadsThisMonth: "Leads This Month",
          conversionRate: "Conversion Rate",
          revenueMTD: "Revenue MTD",
          appointmentsBooked: "Appointments Booked",
          leadSources: "Lead Sources",
          pieChart: "Pie Chart Visualization",
          revenueTrend: "Revenue Trend",
          lineChart: "Line Chart Visualization",
          topCampaigns: "Top Performing Campaigns",
          campaign: "Campaign", leads: "Leads", conversions: "Conversions",
          revenue: "Revenue", roi: "ROI",
          googleAds: "Google Ads", organic: "Organic", socialMedia: "Social Media",
          referral: "Referral", direct: "Direct"
        },
        documents: {
          newDoc: "New Document",
          all: "All", proposals: "Proposals", contracts: "Contracts", invoices: "Invoices",
          name: "Name", type: "Type", recipient: "Recipient",
          status: "Status", created: "Created", actions: "Actions",
          view: "View", send: "Send"
        },
        courses: {
          newCourse: "New Course",
          students: "Students", lessons: "Lessons", edit: "Edit"
        },
        social: {
          newPost: "New Post",
          allPlatforms: "All Platforms",
          noPosts: "No posts",
          dayNames: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]
        },
        settings: {
          general: "General", whitelabel: "White Label", team: "Team",
          notifications: "Notifications", billing: "Billing", security: "Security",
          generalSettings: "General Settings",
          generalDesc: "Manage your account and organization preferences.",
          companyName: "Company Name", industry: "Industry", timezone: "Timezone",
          defaultCurrency: "Default Currency", dateFormat: "Date Format",
          saveChanges: "Save Changes",
          whitelabelDesc: "Customize the CRM with your brand identity.",
          brandName: "Brand Name", logoUrl: "Logo URL",
          primaryColor: "Primary Color", accentColor: "Accent Color",
          customDomain: "Custom Domain", faviconUrl: "Favicon URL",
          saveBranding: "Save Branding",
          teamMembers: "Team Members",
          teamDesc: "Manage your team and their roles.",
          inviteMember: "Invite Member",
          notifDesc: "Configure how and when you receive notifications.",
          emailNotif: "Email Notifications", emailNotifDesc: "Receive email for new leads and deal updates",
          pushNotif: "Push Notifications", pushNotifDesc: "Browser push notifications for urgent items",
          dealClosed: "Deal Closed Alerts", dealClosedDesc: "Get notified when a deal is won or lost",
          weeklyDigest: "Weekly Digest", weeklyDigestDesc: "Summary of weekly pipeline and activity",
          newContact: "New Contact Alerts", newContactDesc: "Notification when a new contact is added",
          taskReminders: "Task Reminders", taskRemindersDesc: "Remind me of upcoming tasks 15 min before",
          billingDesc: "Manage your subscription and payment method.",
          starter: "Starter", professional: "Professional", enterprise: "Enterprise",
          starterDesc: "Up to 500 contacts, 2 users",
          professionalDesc: "Up to 5,000 contacts, 10 users",
          enterpriseDesc: "Unlimited contacts and users",
          downgrade: "Downgrade", currentPlan: "Current Plan", upgradeBtn: "Upgrade",
          paymentMethod: "Payment Method",
          cardNumber: "Card Number", expiry: "Expiry", billingEmail: "Billing Email",
          updatePayment: "Update Payment Method",
          securityDesc: "Protect your account with these security settings.",
          twoFactor: "Two-Factor Authentication",
          twoFactorDesc: "Add an extra layer of security to your account",
          sessionTimeout: "Session Timeout",
          sessionTimeoutDesc: "Automatically log out after 30 minutes of inactivity",
          ipRestriction: "IP Restriction",
          ipRestrictionDesc: "Restrict access to specific IP addresses",
          changePassword: "Change Password",
          currentPassword: "Current Password",
          currentPwPlaceholder: "Enter current password",
          newPassword: "New Password",
          newPwPlaceholder: "Enter new password",
          confirmPassword: "Confirm Password",
          confirmPwPlaceholder: "Confirm new password",
          updatePassword: "Update Password",
          role: "Role", saved: "Saved!"
        },
        login: {
          title: "Start Your Free Demo",
          subtitle: "Enter your details to explore the platform",
          welcomeBack: "Welcome Back",
          signinSubtitle: "Sign in to your account",
          tabSignup: "Start Free Demo",
          tabSignin: "Sign In",
          fullName: "Full Name",
          emailAddress: "Email Address",
          company: "Company",
          phone: "Phone (optional)",
          password: "Password",
          pwPlaceholder: "Enter your password",
          launchDemo: "Launch Demo",
          signIn: "Sign In",
          forgot: "Forgot password?",
          terms: "By continuing, you agree to our Terms of Service",
          nameEmailReq: "Name and email are required",
          validEmail: "Please enter a valid email",
          creating: "Creating your account...",
          signingIn: "Signing in...",
          fillFields: "Please fill in all fields",
          connErr: "Connection error. Please try again."
        }
      }
    },
    es: {
      brand: "NetWeb CRM",
      nav: {
        dashboard: "Panel", conversations: "Conversaciones", calendars: "Calendarios",
        contacts: "Contactos", pipeline: "Oportunidades", payments: "Pagos",
        marketing: "Marketing", automation: "Automatización", sites: "Sitios",
        reputation: "Reputación", reporting: "Reportes", documents: "Documentos",
        courses: "Cursos", social: "Planificador Social", settings: "Ajustes"
      },
      roles: { demo: "Demo", guest: "Invitado", admin: "Administrador", user: "Usuario", client: "Cliente" },
      search: "Buscar contactos...",
      filters: { all: "Todos", customer: "Clientes", prospect: "Prospectos", lead: "Leads", churned: "Bajas" },
      cols: { name: "Nombre", company: "Empresa", region: "Región", status: "Estado", value: "Valor", last_contact: "Último Contacto", audit: "Auditoría" },
      syncHubspot: "Sincronizar HubSpot", syncing: "Sincronizando…",
      upgrade: {
        title: "Actualiza para acceder a ",
        sub: "Tu demo incluye el panel principal. Desbloquea los 15 módulos con un plan.",
        cta: "Contactar Ventas"
      },
      langLabel: "Idioma",
      common: {
        save: "Guardar", cancel: "Cancelar", delete: "Eliminar", edit: "Editar", add: "Agregar",
        create: "Crear", search: "Buscar", filter: "Filtrar", view: "Ver",
        send: "Enviar", copy: "Copiar", share: "Compartir", reply: "Responder", close: "Cerrar",
        today: "Hoy", yesterday: "Ayer", thisWeek: "Esta Semana", thisMonth: "Este Mes",
        viewAll: "Ver Todo", active: "Activo", inactive: "Inactivo", all: "Todos",
        name: "Nombre", status: "Estado", date: "Fecha", actions: "Acciones", amount: "Monto",
        loading: "Cargando…"
      },
      modules: {
        dashboard: {
          newDeal: "Nueva Oportunidad",
          revenueOverview: "Resumen de Ingresos",
          vsLastQuarter: "+24% vs. trimestre anterior",
          activeDeals: "Oportunidades Activas",
          viewAll: "Ver Todo",
          todaySchedule: "Agenda de Hoy",
          recentContacts: "Contactos Recientes",
          totalContacts: "Contactos Totales",
          newLeads: "Leads Nuevos",
          revenue: "Ingresos",
          conversion: "Conversión",
          avgDeal: "Oportunidad Prom.",
          vsLastMonth: "vs. mes anterior"
        },
        conversations: {
          all: "Todos", email: "Correo", sms: "SMS", whatsapp: "WhatsApp",
          selectConv: "Selecciona una conversación",
          typeMsg: "Escribe tu mensaje...",
          empty: "No hay conversaciones",
          justNow: "Ahora"
        },
        calendar: {
          today: "Hoy", month: "Mes", week: "Semana", day: "Día",
          newEvent: "Nuevo Evento"
        },
        pipeline: {
          newDeal: "Nueva Oportunidad",
          stages: {
            "New Lead": "Nuevo Lead", "Contacted": "Contactado", "Qualified": "Calificado",
            "Proposal Sent": "Propuesta Enviada", "Negotiation": "Negociación",
            "Closed Won": "Ganado", "Closed Lost": "Perdido"
          },
          daysInStage: "d en etapa"
        },
        payments: {
          createInvoice: "Crear Factura",
          invoices: "Facturas", subscriptions: "Suscripciones",
          paymentLinks: "Enlaces de Pago", transactions: "Transacciones",
          totalRevenue: "Ingresos Totales", outstanding: "Pendiente",
          overdue: "Atrasado", thisMonth: "Este Mes",
          invoiceNum: "Factura #", client: "Cliente", amount: "Monto",
          status: "Estado", date: "Fecha", actions: "Acciones",
          plan: "Plan", interval: "Intervalo", nextBill: "Próximo Cobro",
          link: "Enlace", clicks: "Clics", conversions: "Conversiones",
          txnId: "ID Transacción", type: "Tipo", method: "Método",
          view: "Ver", send: "Enviar", copy: "Copiar", edit: "Editar",
          monthly: "Mensual", active: "Activo", pastDue: "Atrasado",
          paid: "Pagado", pending: "Pendiente"
        },
        marketing: {
          emailMarketing: "Marketing por Correo",
          newCampaign: "Nueva Campaña", newTemplate: "Nueva Plantilla",
          campaigns: "Campañas", templates: "Plantillas",
          totalSent: "Total Enviados", openRate: "Tasa de Apertura",
          clickRate: "Tasa de Clics", inProgress: "En Progreso",
          name: "Nombre", status: "Estado", sent: "Enviados",
          opens: "Aperturas", clicks: "Clics", created: "Creado",
          actions: "Acciones", subject: "Asunto", niche: "Nicho",
          updated: "Actualizado",
          edit: "Editar", preview: "Vista Previa", test: "Prueba",
          sendBtn: "Enviar", use: "Usar",
          noCampaigns: 'No hay campañas. Haz clic en "+ Nueva Campaña" para comenzar.',
          noTemplates: 'No hay plantillas. Haz clic en "+ Nueva Plantilla" para crear correos reutilizables con etiquetas como {{name}}, {{company}}, {{city}}, {{page_url}}.',
          editCampaign: "Editar campaña", newCampaignTitle: "Nueva campaña",
          editTemplate: "Editar plantilla", newTemplateTitle: "Nueva plantilla",
          audienceFilter: "Filtro de Audiencia",
          nameReq: "Nombre requerido",
          fieldsReq: "Nombre, asunto y cuerpo son requeridos",
          confirmDelCampaign: "¿Eliminar esta campaña? (historial de envíos se conserva)",
          confirmDelTemplate: "¿Eliminar esta plantilla?",
          testPrompt: "Enviar correo de prueba a:",
          fromName: "Nombre remitente", fromEmail: "Correo remitente", htmlBody: "Cuerpo HTML",
          template: "Plantilla", city: "Ciudad",
          mergeTags: "Etiquetas:",
          loadErr: "Error al cargar datos: ",
          firstTimeHint: "Si es tu primera vez: POST a /api/?r=migrate&token=NWM_MIGRATE_2026 para crear las tablas.",
          save: "Guardar", cancel: "Cancelar"
        },
        automation: {
          newWorkflow: "Nuevo Flujo",
          all: "Todos", active: "Activos", inactive: "Inactivos",
          runs: "Ejecuciones", last: "Última", edit: "Editar"
        },
        sites: {
          newSite: "Nuevo Sitio",
          funnels: "Embudos", websites: "Sitios Web", forms: "Formularios", surveys: "Encuestas",
          pages: "Páginas", visits: "Visitas", conv: "Conv.",
          funnelPreview: "Vista previa del embudo", websitePreview: "Vista previa del sitio",
          formName: "Nombre del formulario", submissions: "Envíos",
          conversionRate: "Tasa de Conversión", status: "Estado", actions: "Acciones",
          surveyName: "Nombre de Encuesta", responses: "Respuestas", avgScore: "Puntaje Prom.",
          edit: "Editar", share: "Compartir"
        },
        reputation: {
          requestReview: "Solicitar Reseña",
          avgRating: "Calificación Promedio", totalReviews: "Total de Reseñas",
          thisMonth: "Este Mes", responseRate: "Tasa de Respuesta",
          responded: "Respondida", awaiting: "Esperando Respuesta", reply: "Responder"
        },
        reporting: {
          leadsThisMonth: "Leads Este Mes",
          conversionRate: "Tasa de Conversión",
          revenueMTD: "Ingresos del Mes",
          appointmentsBooked: "Citas Agendadas",
          leadSources: "Fuentes de Leads",
          pieChart: "Gráfico Circular",
          revenueTrend: "Tendencia de Ingresos",
          lineChart: "Gráfico de Líneas",
          topCampaigns: "Campañas con Mejor Desempeño",
          campaign: "Campaña", leads: "Leads", conversions: "Conversiones",
          revenue: "Ingresos", roi: "ROI",
          googleAds: "Google Ads", organic: "Orgánico", socialMedia: "Redes Sociales",
          referral: "Referido", direct: "Directo"
        },
        documents: {
          newDoc: "Nuevo Documento",
          all: "Todos", proposals: "Propuestas", contracts: "Contratos", invoices: "Facturas",
          name: "Nombre", type: "Tipo", recipient: "Destinatario",
          status: "Estado", created: "Creado", actions: "Acciones",
          view: "Ver", send: "Enviar"
        },
        courses: {
          newCourse: "Nuevo Curso",
          students: "Estudiantes", lessons: "Lecciones", edit: "Editar"
        },
        social: {
          newPost: "Nueva Publicación",
          allPlatforms: "Todas las Plataformas",
          noPosts: "Sin publicaciones",
          dayNames: ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"]
        },
        settings: {
          general: "General", whitelabel: "Marca Blanca", team: "Equipo",
          notifications: "Notificaciones", billing: "Facturación", security: "Seguridad",
          generalSettings: "Ajustes Generales",
          generalDesc: "Administra tu cuenta y preferencias de la organización.",
          companyName: "Empresa", industry: "Industria", timezone: "Zona Horaria",
          defaultCurrency: "Moneda Predeterminada", dateFormat: "Formato de Fecha",
          saveChanges: "Guardar Cambios",
          whitelabelDesc: "Personaliza el CRM con la identidad de tu marca.",
          brandName: "Marca", logoUrl: "URL del Logo",
          primaryColor: "Color Primario", accentColor: "Color de Acento",
          customDomain: "Dominio Propio", faviconUrl: "URL del Favicon",
          saveBranding: "Guardar Marca",
          teamMembers: "Miembros del Equipo",
          teamDesc: "Administra tu equipo y sus roles.",
          inviteMember: "Invitar Miembro",
          notifDesc: "Configura cómo y cuándo recibes notificaciones.",
          emailNotif: "Notificaciones por Correo", emailNotifDesc: "Recibe correos de nuevos leads y actualizaciones de oportunidades",
          pushNotif: "Notificaciones Push", pushNotifDesc: "Notificaciones del navegador para elementos urgentes",
          dealClosed: "Alertas de Cierre", dealClosedDesc: "Recibe aviso cuando una oportunidad se gana o se pierde",
          weeklyDigest: "Resumen Semanal", weeklyDigestDesc: "Resumen semanal de pipeline y actividad",
          newContact: "Alertas de Nuevo Contacto", newContactDesc: "Notificación cuando se agrega un nuevo contacto",
          taskReminders: "Recordatorios de Tareas", taskRemindersDesc: "Recordarme tareas próximas 15 min antes",
          billingDesc: "Administra tu suscripción y método de pago.",
          starter: "Starter", professional: "Professional", enterprise: "Enterprise",
          starterDesc: "Hasta 500 contactos, 2 usuarios",
          professionalDesc: "Hasta 5,000 contactos, 10 usuarios",
          enterpriseDesc: "Contactos y usuarios ilimitados",
          downgrade: "Bajar Plan", currentPlan: "Plan Actual", upgradeBtn: "Mejorar",
          paymentMethod: "Método de Pago",
          cardNumber: "Número de Tarjeta", expiry: "Vencimiento", billingEmail: "Correo de Facturación",
          updatePayment: "Actualizar Método de Pago",
          securityDesc: "Protege tu cuenta con estos ajustes de seguridad.",
          twoFactor: "Autenticación de Dos Factores",
          twoFactorDesc: "Añade una capa extra de seguridad a tu cuenta",
          sessionTimeout: "Cierre de Sesión Automático",
          sessionTimeoutDesc: "Cierra sesión automáticamente tras 30 minutos de inactividad",
          ipRestriction: "Restricción por IP",
          ipRestrictionDesc: "Restringe el acceso a direcciones IP específicas",
          changePassword: "Cambiar Contraseña",
          currentPassword: "Contraseña Actual",
          currentPwPlaceholder: "Ingresa contraseña actual",
          newPassword: "Nueva Contraseña",
          newPwPlaceholder: "Ingresa nueva contraseña",
          confirmPassword: "Confirmar Contraseña",
          confirmPwPlaceholder: "Confirma la nueva contraseña",
          updatePassword: "Actualizar Contraseña",
          role: "Rol", saved: "¡Guardado!"
        },
        login: {
          title: "Comienza tu Demo Gratis",
          subtitle: "Ingresa tus datos para explorar la plataforma",
          welcomeBack: "Bienvenido de Vuelta",
          signinSubtitle: "Inicia sesión en tu cuenta",
          tabSignup: "Prueba Gratis",
          tabSignin: "Iniciar Sesión",
          fullName: "Nombre Completo",
          emailAddress: "Correo Electrónico",
          company: "Empresa",
          phone: "Teléfono (opcional)",
          password: "Contraseña",
          pwPlaceholder: "Ingresa tu contraseña",
          launchDemo: "Iniciar Demo",
          signIn: "Iniciar Sesión",
          forgot: "¿Olvidaste tu contraseña?",
          terms: "Al continuar, aceptas nuestros Términos de Servicio",
          nameEmailReq: "Nombre y correo son requeridos",
          validEmail: "Por favor ingresa un correo válido",
          creating: "Creando tu cuenta...",
          signingIn: "Iniciando sesión...",
          fillFields: "Por favor completa todos los campos",
          connErr: "Error de conexión. Intenta de nuevo."
        }
      }
    }
  };

  function getLang() {
    var stored = localStorage.getItem("nwm_lang");
    if (stored === "en" || stored === "es") return stored;
    var nav = (navigator.language || "en").slice(0, 2).toLowerCase();
    return nav === "es" ? "es" : "en";
  }
  function setLang(l) {
    localStorage.setItem("nwm_lang", l);
    document.documentElement.setAttribute("lang", l);
    location.reload();
  }
  function t(path) {
    var d = I18N[getLang()];
    var parts = path.split(".");
    for (var i = 0; i < parts.length; i++) { if (!d) return path; d = d[parts[i]]; }
    return d == null ? path : d;
  }

  // Set lang attribute immediately so CSS rules hit
  document.documentElement.setAttribute("lang", getLang());

  /* ── SVG Icon definitions ── */
  var ICONS = {
    dashboard: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></svg>',
    contacts: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>',
    pipeline: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="7" width="4" height="14" rx="1"/><rect x="7" y="3" width="4" height="18" rx="1"/><rect x="12" y="10" width="4" height="11" rx="1"/><rect x="17" y="5" width="4" height="16" rx="1"/></svg>',
    conversations: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>',
    calendar: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>',
    settings: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"/><path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/></svg>',
    payments: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="1" y="4" width="22" height="16" rx="2" ry="2"/><line x1="1" y1="10" x2="23" y2="10"/></svg>',
    marketing: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15V6"/><path d="M18.5 18a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5z"/><path d="M12 12H3"/><path d="M16 6H3"/><path d="M12 18H3"/></svg>',
    automation: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>',
    sites: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>',
    reputation: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>',
    reporting: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>',
    documents: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>',
    courses: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 10v6M2 10l10-5 10 5-10 5z"/><path d="M6 12v5c0 1.1 2.7 3 6 3s6-1.9 6-3v-5"/></svg>',
    social: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/></svg>',
    search: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>',
    plus: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>',
    menu: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="18" x2="21" y2="18"/></svg>',
    chevronLeft: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="15 18 9 12 15 6"/></svg>',
    bell: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>',
    filter: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"/></svg>',
    send: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>',
    email: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="4" width="20" height="16" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/></svg>',
    phone: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"/></svg>',
    whatsapp: '<svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>',
    sms: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/><path d="M8 10h.01"/><path d="M12 10h.01"/><path d="M16 10h.01"/></svg>',
    shield: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>'
  };

  window.CRM_ICONS = ICONS;

  /* ── Navigation items ── */
  var NAV_ITEMS = [
    { id: "dashboard", key: "dashboard", icon: "dashboard", href: "index.html" },
    { id: "conversations", key: "conversations", icon: "conversations", href: "conversations.html" },
    { id: "calendars", key: "calendars", icon: "calendar", href: "calendar.html" },
    { id: "contacts", key: "contacts", icon: "contacts", href: "contacts.html" },
    { id: "pipeline", key: "pipeline", icon: "pipeline", href: "pipeline.html" },
    { id: "payments", key: "payments", icon: "payments", href: "payments.html" },
    { id: "marketing", key: "marketing", icon: "marketing", href: "marketing.html" },
    { id: "automation", key: "automation", icon: "automation", href: "automation.html" },
    { id: "sites", key: "sites", icon: "sites", href: "sites.html" },
    { id: "reputation", key: "reputation", icon: "reputation", href: "reputation.html" },
    { id: "reporting", key: "reporting", icon: "reporting", href: "reporting.html" },
    { id: "documents", key: "documents", icon: "documents", href: "documents.html" },
    { id: "courses", key: "courses", icon: "courses", href: "courses.html" },
    { id: "social", key: "social", icon: "social", href: "social.html" },
    { id: "settings", key: "settings", icon: "settings", href: "settings.html" },
    { id: "admin", key: "admin", icon: "shield", href: "admin.html", superadminOnly: true }
  ];

  function getActivePage() {
    var path = window.location.pathname;
    var file = path.split("/").pop() || "index.html";
    if (file === "" || file === "index.html") return "dashboard";
    var page = file.replace(".html", "");
    if (page === "calendar") return "calendars";
    if (page === "admin") return "admin";
    return page;
  }

  /* ── Language switcher ── */
  function injectLangSwitcher() {
    if (document.getElementById("nwmLangSwitch")) return;
    var cur = getLang();
    var el = document.createElement("div");
    el.id = "nwmLangSwitch";
    el.setAttribute("role", "group");
    el.setAttribute("aria-label", t("langLabel"));
    el.innerHTML =
      '<button data-l="es" class="' + (cur === "es" ? "on" : "") + '">ES</button>' +
      '<button data-l="en" class="' + (cur === "en" ? "on" : "") + '">EN</button>';
    var css = document.createElement("style");
    css.textContent =
      '#nwmLangSwitch{position:fixed;right:14px;bottom:14px;z-index:9999;display:flex;gap:4px;background:#fff;border:1px solid #e3e5ee;border-radius:8px;padding:4px;box-shadow:0 6px 20px rgba(20,22,40,.12)}' +
      '#nwmLangSwitch button{border:0;background:transparent;color:#1a1a2e;font:600 12px -apple-system,Segoe UI,Roboto,sans-serif;padding:5px 10px;border-radius:6px;cursor:pointer;letter-spacing:.5px}' +
      '#nwmLangSwitch button.on{background:#FF6B00;color:#fff}' +
      '#nwmLangSwitch button:hover:not(.on){background:#f2f3f8}';
    document.head.appendChild(css);
    document.body.appendChild(el);
    el.addEventListener("click", function (e) {
      var b = e.target.closest("button[data-l]");
      if (!b) return;
      setLang(b.getAttribute("data-l"));
    });
  }

  /* ── Build sidebar ── */
  function buildSidebar() {
    var sidebar = document.getElementById("sidebar");
    if (!sidebar) return;

    var active = getActivePage();
    var collapsed = localStorage.getItem("sidebar-collapsed") === "true";

    var html = '<div class="sidebar-header">';
    html += '<div class="sidebar-brand">';
    html += '<div class="brand-icon">N</div>';
    html += '<span class="brand-text">' + t("brand") + '</span>';
    html += '</div>';
    html += '<button class="sidebar-toggle" id="sidebarToggle">' + ICONS.chevronLeft + '</button>';
    html += '</div>';

    var currentUser = getLoggedInUser();
    var isSuperadmin = currentUser && (currentUser.type === 'superadmin' || currentUser.role === 'superadmin');

    html += '<nav class="sidebar-nav">';
    for (var i = 0; i < NAV_ITEMS.length; i++) {
      var item = NAV_ITEMS[i];
      if (item.superadminOnly && !isSuperadmin) continue;
      var label = item.key === 'admin' ? 'Admin' : t("nav." + item.key);
      var isActive = item.id === active ? " active" : "";
      html += '<a href="' + item.href + '" class="nav-item' + isActive + '" title="' + label + '">';
      html += '<span class="nav-icon">' + ICONS[item.icon] + '</span>';
      html += '<span class="nav-label">' + label + '</span>';
      html += '</a>';
    }
    html += '</nav>';

    html += '<div class="sidebar-footer">';
    html += '<div class="user-card">';
    var loggedInUser = getLoggedInUser();
    var userName = loggedInUser ? loggedInUser.name : t("roles.guest");
    var rawRole = loggedInUser ? (loggedInUser.type || loggedInUser.role || 'user') : 'guest';
    var userRole = t("roles." + rawRole) !== ("roles." + rawRole) ? t("roles." + rawRole) : (rawRole.charAt(0).toUpperCase() + rawRole.slice(1));
    var userInitials = userName.split(' ').map(function(w){ return w.charAt(0).toUpperCase(); }).join('').substring(0, 2);
    html += '<div class="user-avatar">' + userInitials + '</div>';
    html += '<div class="user-info">';
    html += '<div class="user-name">' + userName + '</div>';
    html += '<div class="user-role">' + userRole + '</div>';
    html += '</div>';
    // Logout button (only shown when a real user is signed in)
    if (loggedInUser) {
      var logoutLabel = (getLang() === 'es') ? 'Cerrar sesión' : 'Sign out';
      html += '<button class="sidebar-logout-btn" id="sidebarLogoutBtn" title="' + logoutLabel + '" aria-label="' + logoutLabel + '">';
      html += '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>';
      html += '</button>';
    } else {
      var signInLabel = (getLang() === 'es') ? 'Iniciar sesión' : 'Sign in';
      html += '<a class="sidebar-logout-btn" href="/login.html" title="' + signInLabel + '" aria-label="' + signInLabel + '">';
      html += '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"/><polyline points="10 17 15 12 10 7"/><line x1="15" y1="12" x2="3" y2="12"/></svg>';
      html += '</a>';
    }
    html += '</div>';
    html += '</div>';

    sidebar.innerHTML = html;

    // Wire logout
    var logoutBtn = document.getElementById("sidebarLogoutBtn");
    if (logoutBtn && logoutBtn.tagName === 'BUTTON') {
      logoutBtn.addEventListener("click", function () {
        var token = '';
        try { token = localStorage.getItem('nwm_token') || ''; } catch (_) {}
        var finish = function () {
          try { localStorage.removeItem('nwm_token'); localStorage.removeItem('nwm_user'); localStorage.removeItem('crm_demo_user'); } catch (_) {}
          try { document.cookie = "nwm_token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT"; } catch (_) {}
          location.href = "/login.html";
        };
        // Revoke server-side token; don't block the UX on network errors
        try {
          fetch('/api/auth/logout', {
            method: 'POST',
            credentials: 'include',
            headers: token ? { 'X-Auth-Token': token } : {}
          }).catch(function () {}).finally(finish);
        } catch (_) { finish(); }
      });
    }

    if (collapsed) {
      sidebar.classList.add("collapsed");
      document.getElementById("mainContent").classList.add("sidebar-collapsed");
    }

    document.getElementById("sidebarToggle").addEventListener("click", function () {
      var isCollapsed = sidebar.classList.toggle("collapsed");
      document.getElementById("mainContent").classList.toggle("sidebar-collapsed");
      localStorage.setItem("sidebar-collapsed", isCollapsed);
    });
  }

  /* ── Build header ── */
  function buildHeader(title, actions) {
    var header = document.getElementById("pageHeader");
    if (!header) return;

    // Allow title to be an object { es: "...", en: "..." } or a key "nav.contacts"
    var resolved = title;
    if (title && typeof title === "object") resolved = title[getLang()] || title.en || "";
    else if (typeof title === "string" && title.indexOf(".") > -1 && I18N[getLang()]) {
      var maybe = t(title);
      if (maybe && maybe !== title) resolved = maybe;
    }

    var html = '<div class="header-left">';
    html += '<button class="mobile-menu-btn" id="mobileMenuBtn">' + ICONS.menu + '</button>';
    html += '<h1 class="page-title">' + resolved + '</h1>';
    html += '</div>';
    html += '<div class="header-right">';
    if (actions) html += actions;
    html += '<button class="header-icon-btn notification-btn">' + ICONS.bell + '<span class="notif-dot"></span></button>';
    var headerUser = getLoggedInUser();
    var headerInitials = 'G';
    if (headerUser && headerUser.name) {
      headerInitials = headerUser.name.split(' ').map(function(w){ return w.charAt(0).toUpperCase(); }).join('').substring(0, 2);
    }
    html += '<div class="header-avatar">' + headerInitials + '</div>';
    html += '</div>';

    header.innerHTML = html;

    var mobileBtn = document.getElementById("mobileMenuBtn");
    if (mobileBtn) {
      mobileBtn.addEventListener("click", function () {
        document.getElementById("sidebar").classList.toggle("mobile-open");
      });
    }
  }

  /* ── Apply i18n to static HTML (data-i18n keys + data-lang spans) ── */
  function applyI18n() {
    // data-i18n="cols.name" => sets textContent from dict
    var els = document.querySelectorAll("[data-i18n]");
    for (var i = 0; i < els.length; i++) {
      var k = els[i].getAttribute("data-i18n");
      var v = t(k);
      if (v && v !== k) els[i].textContent = v;
    }
    // data-i18n-placeholder="search"
    var ins = document.querySelectorAll("[data-i18n-placeholder]");
    for (var j = 0; j < ins.length; j++) {
      var pk = ins[j].getAttribute("data-i18n-placeholder");
      var pv = t(pk);
      if (pv && pv !== pk) ins[j].setAttribute("placeholder", pv);
    }
  }

  /* ── Utilities ── */
  function formatCurrency(value) {
    if (value >= 1000) return "$" + (value / 1000).toFixed(1) + "k";
    return "$" + (value || 0).toLocaleString();
  }
  function statusBadge(status) {
    var label = t("filters." + status);
    if (label === "filters." + status) label = status.charAt(0).toUpperCase() + status.slice(1);
    return '<span class="status-badge status-' + status + '">' + label + '</span>';
  }
  function channelIcon(channel) { return ICONS[channel] || ICONS.email; }

  /* ── Auth Gate ──
     Reads unified session from localStorage.
     Priority: real NWMApi user (nwm_user + nwm_token from /login.html)
     Fallback: legacy crm_demo_user (kept for backwards compat).
     If neither exists and the page isn't marked NWM_NO_GATE, we redirect to /login.html. */
  function getLoggedInUser() {
    try {
      var t = localStorage.getItem('nwm_token');
      var rawN = localStorage.getItem('nwm_user');
      if (t && rawN) {
        var u = JSON.parse(rawN);
        // Normalize shape — some code paths expect .type
        if (u && !u.type) u.type = u.role || 'user';
        return u;
      }
    } catch (_) {}
    try {
      var raw = localStorage.getItem('crm_demo_user');
      return raw ? JSON.parse(raw) : null;
    } catch (_) { return null; }
  }
  function getDemoUser() { var u = getLoggedInUser(); return (u && u.type === 'demo') ? u : null; }
  function enforceAuthGate() {
    if (window.NWM_NO_GATE) return;
    if (getLoggedInUser()) return;
    var next = encodeURIComponent(location.pathname + location.search);
    location.replace('/login.html?next=' + next);
  }
  function isDemo() { return getDemoUser() !== null; }

  function showUpgradeModal(moduleName) {
    var existing = document.getElementById('upgradeOverlay');
    if (existing) existing.remove();

    var overlay = document.createElement('div');
    overlay.id = 'upgradeOverlay';
    overlay.className = 'upgrade-overlay';

    var modal = document.createElement('div');
    modal.className = 'upgrade-modal';

    var closeBtn = document.createElement('button');
    closeBtn.className = 'upgrade-close';
    closeBtn.textContent = '\u00D7';
    closeBtn.addEventListener('click', function() { overlay.remove(); });
    modal.appendChild(closeBtn);

    var heading = document.createElement('h2');
    heading.className = 'upgrade-heading';
    heading.textContent = t("upgrade.title") + moduleName;
    modal.appendChild(heading);

    var sub = document.createElement('p');
    sub.className = 'upgrade-subheading';
    sub.textContent = t("upgrade.sub");
    modal.appendChild(sub);

    var plans = document.createElement('div');
    plans.className = 'upgrade-plans';

    var isEs = getLang() === "es";
    var planData = [
      { name: 'Starter', price: '$97', period: '/mo',
        features: isEs
          ? ['Panel + 3 Módulos', 'Hasta 500 Contactos', 'Soporte por Email', '1 Usuario']
          : ['Dashboard + 3 Modules', 'Up to 500 Contacts', 'Email Support', '1 User Seat'],
        featured: false },
      { name: 'Professional', price: '$297', period: '/mo',
        features: isEs
          ? ['Los 15 Módulos', 'Contactos Ilimitados', 'Soporte Prioritario', '5 Usuarios', 'Automatizaciones', 'Reportes Personalizados']
          : ['All 15 Modules', 'Unlimited Contacts', 'Priority Support', '5 User Seats', 'Automation Workflows', 'Custom Reporting'],
        featured: true },
      { name: 'Enterprise', price: isEs ? 'A medida' : 'Custom', period: '',
        features: isEs
          ? ['Todo de Professional', 'Usuarios Ilimitados', 'Gerente de Cuenta', 'Integraciones Custom', 'SLA Garantizado', 'White-Label']
          : ['Everything in Professional', 'Unlimited Users', 'Dedicated Account Manager', 'Custom Integrations', 'SLA Guarantee', 'White-Label Options'],
        featured: false }
    ];

    for (var i = 0; i < planData.length; i++) {
      var p = planData[i];
      var card = document.createElement('div');
      card.className = 'upgrade-plan' + (p.featured ? ' featured' : '');

      var planName = document.createElement('div');
      planName.className = 'upgrade-plan-name';
      planName.textContent = p.name;
      card.appendChild(planName);

      var priceRow = document.createElement('div');
      priceRow.className = 'upgrade-plan-price';
      priceRow.textContent = p.price;
      if (p.period) {
        var periodSpan = document.createElement('span');
        periodSpan.className = 'upgrade-plan-period';
        periodSpan.textContent = p.period;
        priceRow.appendChild(periodSpan);
      }
      card.appendChild(priceRow);

      var featureList = document.createElement('ul');
      featureList.className = 'upgrade-plan-features';
      for (var j = 0; j < p.features.length; j++) {
        var li = document.createElement('li');
        li.textContent = p.features[j];
        featureList.appendChild(li);
      }
      card.appendChild(featureList);

      var cta = document.createElement('a');
      cta.className = 'upgrade-cta' + (p.featured ? ' primary' : '');
      cta.href = 'https://netwebmedia.com/contact';
      cta.target = '_blank';
      cta.textContent = t("upgrade.cta");
      card.appendChild(cta);

      plans.appendChild(card);
    }

    modal.appendChild(plans);
    overlay.appendChild(modal);
    document.body.appendChild(overlay);

    overlay.addEventListener('click', function(e) { if (e.target === overlay) overlay.remove(); });
  }

  function initDemoGate() {
    if (!isDemo()) return;
    var page = getActivePage();
    if (page !== 'dashboard') { window.location.href = 'index.html'; return; }
    var navLinks = document.querySelectorAll('.sidebar-nav .nav-item');
    for (var i = 0; i < navLinks.length; i++) {
      (function(link) {
        var href = link.getAttribute('href') || '';
        if (href === 'index.html') return;
        link.addEventListener('click', function(e) {
          e.preventDefault();
          var label = link.querySelector('.nav-label');
          var moduleName = label ? label.textContent : 'this module';
          showUpgradeModal(moduleName);
        });
      })(navLinks[i]);
    }
  }

  document.addEventListener("DOMContentLoaded", function () {
    // Auth gate first — bounce unauthenticated users to /login.html
    enforceAuthGate();
    buildSidebar();
    applyI18n();
    injectLangSwitcher();
    initDemoGate();
  });

  window.CRM_APP = {
    buildHeader: buildHeader,
    buildSidebar: buildSidebar,
    formatCurrency: formatCurrency,
    statusBadge: statusBadge,
    channelIcon: channelIcon,
    getActivePage: getActivePage,
    getUser: getLoggedInUser,
    isDemo: isDemo,
    showUpgradeModal: showUpgradeModal,
    initDemoGate: initDemoGate,
    ICONS: ICONS,
    t: t,
    getLang: getLang,
    setLang: setLang,
    applyI18n: applyI18n
  };

})();
