/* =============================================================================
 * NWM Real-Estate Portal Template — seed data
 * -----------------------------------------------------------------------------
 * 100% white-labelable property-portal template by NetWebMedia.
 *
 * IMPORTANT (same rule as crm-vanilla/js/data.js): this file is MOCK/SEED data
 * for UI development and demos only. In a real deployment, listings flow from a
 * backend (e.g. /api/resources/listing in webmed6_nwm, or a client feed) — never
 * write business logic against this array as a source of truth.
 *
 * Test dataset: 32 real La Serena (Coquimbo, Chile) for-sale listings — factual
 * specs (price/beds/baths/m²/sector) gathered from public listing data to make
 * the demo realistic. Photos are NOT used; cards render brand-styled placeholders
 * ("Foto referencial"). Descriptions are original template copy.
 * ========================================================================== */

window.NWM_PORTAL_CONFIG = {
  brandName: 'Tu Inmobiliaria',          // white-label: swap per client
  tagline: 'Propiedades en La Serena y Coquimbo',
  city: 'La Serena',
  region: 'Región de Coquimbo',
  whatsapp: '56900000000',               // E.164 without '+' — client's number
  phone: '+56 51 000 0000',
  email: 'contacto@tuinmobiliaria.cl',
  ufToClp: 39500,                        // UF→CLP reference rate (configurable)
  poweredBy: 'NetWebMedia',
};

/* Filterable taxonomy ------------------------------------------------------- */
window.NWM_PORTAL_FACETS = {
  operacion: [
    { key: 'venta', label_es: 'Venta', label_en: 'For sale' },
    { key: 'arriendo', label_es: 'Arriendo', label_en: 'For rent' },
  ],
  tipo: [
    { key: 'casa', label_es: 'Casa', label_en: 'House' },
    { key: 'departamento', label_es: 'Departamento', label_en: 'Apartment' },
  ],
  precioUF: [
    { key: '0-3000', label_es: 'Hasta UF 3.000', label_en: 'Up to UF 3,000', min: 0, max: 3000 },
    { key: '3000-5000', label_es: 'UF 3.000 – 5.000', label_en: 'UF 3,000 – 5,000', min: 3000, max: 5000 },
    { key: '5000-8000', label_es: 'UF 5.000 – 8.000', label_en: 'UF 5,000 – 8,000', min: 5000, max: 8000 },
    { key: '8000-12000', label_es: 'UF 8.000 – 12.000', label_en: 'UF 8,000 – 12,000', min: 8000, max: 12000 },
    { key: '12000-999999', label_es: 'Más de UF 12.000', label_en: 'Over UF 12,000', min: 12000, max: 999999 },
  ],
  dormitorios: [
    { key: '1', label: '1', min: 1 },
    { key: '2', label: '2', min: 2 },
    { key: '3', label: '3', min: 3 },
    { key: '4', label: '4+', min: 4 },
  ],
  banos: [
    { key: '1', label: '1', min: 1 },
    { key: '2', label: '2', min: 2 },
    { key: '3', label: '3+', min: 3 },
  ],
  sector: [
    { key: 'avenida-del-mar', label: 'Avenida del Mar' },
    { key: 'laguna-del-mar', label: 'Laguna del Mar' },
    { key: 'san-joaquin', label: 'San Joaquín' },
    { key: 'el-milagro', label: 'El Milagro' },
    { key: 'serena-golf', label: 'Serena Golf' },
    { key: 'cerro-grande', label: 'Cerro Grande' },
    { key: 'la-pampa', label: 'La Pampa' },
    { key: 'la-antena', label: 'La Antena' },
    { key: 'centro', label: 'Centro' },
    { key: 'valle-elqui', label: 'Valle de Elqui' },
    { key: 'otros', label: 'Otros sectores' },
  ],
};

/* Listings ------------------------------------------------------------------ */
/* priceUF used for sort/filter; priceClp shown as reference. featured flags a
   small set for the hero rail. lotM2 optional (parcelas). */
window.NWM_PORTAL_LISTINGS = [
  // ---- Departamentos ----
  { id: 'ls-001', tipo: 'departamento', operacion: 'venta', title: 'Departamento en Avenida del Mar', sector: 'avenida-del-mar', address: 'Avenida del Mar, La Serena', priceUF: 3100, beds: 1, baths: 1, builtM2: 43, featured: false,
    desc: 'Acogedor departamento de 1 dormitorio a metros de la playa, con orientación luminosa y excelente conectividad. Ideal para primera vivienda o inversión en arriendo turístico.', tags: ['Estacionamiento', 'Bodega', 'Áreas comunes'] },
  { id: 'ls-002', tipo: 'departamento', operacion: 'venta', title: 'Amplio departamento frente a la Av. del Mar', sector: 'avenida-del-mar', address: 'Avenida del Mar, La Serena', priceUF: 7300, beds: 4, baths: 3, builtM2: 121, featured: true,
    desc: 'Espacioso departamento de 4 dormitorios con vista al mar, terraza y dependencias de servicio. Edificio con conserjería 24/7 y áreas comunes de primer nivel.', tags: ['Vista al mar', 'Terraza', '2 estacionamientos', 'Conserjería'] },
  { id: 'ls-003', tipo: 'departamento', operacion: 'venta', title: '¡A pasos de la playa! Depto 3D/1B en condominio', sector: 'avenida-del-mar', address: 'Avenida del Mar, La Serena', priceUF: 2300, beds: 3, baths: 1, builtM2: 45, featured: false,
    desc: 'Funcional departamento de 3 dormitorios en condominio cerrado con piscina, a pasos del borde costero. Excelente alternativa para familias e inversionistas.', tags: ['Piscina', 'Condominio cerrado', 'Estacionamiento'] },
  { id: 'ls-004', tipo: 'departamento', operacion: 'venta', title: 'Dúplex en Laguna del Mar', sector: 'laguna-del-mar', address: 'Puerta del Mar, La Serena', priceUF: 12000, beds: 5, baths: 5, builtM2: 182, featured: true,
    desc: 'Exclusivo dúplex de 5 dormitorios en el barrio Laguna del Mar, con acceso a lagunas navegables, club house y seguridad perimetral. Terminaciones premium.', tags: ['Laguna navegable', 'Club house', 'Terraza', 'Seguridad 24/7'] },
  { id: 'ls-005', tipo: 'departamento', operacion: 'venta', title: 'Departamento Altos del Sendero', sector: 'san-joaquin', address: 'San Joaquín, La Serena', priceUF: 2600, beds: 3, baths: 2, builtM2: 55, featured: false,
    desc: 'Departamento de 3 dormitorios en sector San Joaquín, cercano a colegios, universidades y comercio. Condominio con áreas verdes y juegos infantiles.', tags: ['Áreas verdes', 'Estacionamiento', 'Cerca de colegios'] },
  { id: 'ls-006', tipo: 'departamento', operacion: 'venta', title: 'Departamento en Edificio Aqua', sector: 'avenida-del-mar', address: 'Avenida del Mar, La Serena', priceUF: 4400, beds: 2, baths: 2, builtM2: 50, featured: false,
    desc: 'Moderno departamento de 2 dormitorios en suite, en edificio frente al mar con piscina temperada, gimnasio y quincho panorámico.', tags: ['Piscina temperada', 'Gimnasio', 'Quincho', 'Vista al mar'] },
  { id: 'ls-007', tipo: 'departamento', operacion: 'venta', title: 'Departamento primera línea de playa', sector: 'avenida-del-mar', address: 'Avenida del Mar, La Serena', priceUF: 5750, beds: 4, baths: 3, builtM2: 94, featured: false,
    desc: 'Departamento de 4 dormitorios en primera línea, con amplio living-comedor y terraza con vista directa al océano. Listo para habitar.', tags: ['Primera línea', 'Terraza', 'Vista al mar', 'Estacionamiento'] },
  { id: 'ls-008', tipo: 'departamento', operacion: 'venta', title: 'Departamento triplex, sector El Milagro', sector: 'el-milagro', address: 'Enrique Lihn, El Milagro, La Serena', priceUF: 5200, beds: 4, baths: 3, builtM2: 89, featured: false,
    desc: 'Triplex de 4 dormitorios en el sector El Milagro, distribución en tres niveles con patio propio. Tranquilidad de barrio residencial con rápida salida a la ruta.', tags: ['Patio propio', '3 niveles', 'Estacionamiento'] },
  { id: 'ls-009', tipo: 'departamento', operacion: 'venta', title: 'Departamento en San Joaquín', sector: 'san-joaquin', address: 'José Luis Daire, San Joaquín, La Serena', priceUF: 6900, beds: 3, baths: 2, builtM2: 122, featured: false,
    desc: 'Generoso departamento de 3 dormitorios y 122 m² en sector consolidado de San Joaquín. Espacios amplios, ideal para familias que buscan comodidad y plusvalía.', tags: ['Amplios espacios', 'Logia', '2 estacionamientos'] },
  { id: 'ls-010', tipo: 'departamento', operacion: 'venta', title: 'Departamento Condominio Jardín del Mar', sector: 'avenida-del-mar', address: 'Condominio Jardín del Mar, La Serena', priceUF: 5600, beds: 2, baths: 2, builtM2: 72, featured: false,
    desc: 'Departamento de 2 dormitorios en el reconocido condominio Jardín del Mar, con extensas áreas verdes, piscinas y acceso controlado a pasos de la playa.', tags: ['Piscinas', 'Áreas verdes', 'Acceso controlado'] },
  { id: 'ls-011', tipo: 'departamento', operacion: 'venta', title: 'Venta en Jardín del Mar', sector: 'avenida-del-mar', address: 'Avenida del Mar, La Serena', priceUF: 5700, beds: 2, baths: 2, builtM2: 72, featured: false,
    desc: 'Luminoso 2 dormitorios en Jardín del Mar, con terraza y vista a áreas verdes. Entorno seguro y familiar, excelente para vivir o rentar.', tags: ['Terraza', 'Áreas verdes', 'Estacionamiento'] },
  { id: 'ls-012', tipo: 'departamento', operacion: 'venta', title: 'Departamento Condominio Pacífico 3100', sector: 'avenida-del-mar', address: 'Avenida del Mar, La Serena', priceUF: 3580, beds: 2, baths: 2, builtM2: 52, featured: false,
    desc: 'Departamento de 2 dormitorios bien equipado en condominio frente al mar. Cómoda distribución y baja carga de gastos comunes.', tags: ['Piscina', 'Estacionamiento', 'Bodega'] },
  { id: 'ls-013', tipo: 'departamento', operacion: 'venta', title: 'Amplio departamento en San Joaquín', sector: 'san-joaquin', address: 'Luisa Kneer, San Joaquín, La Serena', priceUF: 8700, beds: 3, baths: 3, builtM2: 132, featured: false,
    desc: 'Departamento de gran metraje, 3 dormitorios en suite y 132 m², en un sector de alta conectividad. Terminaciones de calidad y espacios pensados para la familia.', tags: ['Suites', 'Walk-in closet', '2 estacionamientos'] },
  { id: 'ls-014', tipo: 'departamento', operacion: 'venta', title: 'Departamento Edificio Playa Marina', sector: 'avenida-del-mar', address: 'Avenida del Mar, La Serena', priceUF: 5750, beds: 3, baths: 2, builtM2: 85, featured: false,
    desc: 'Departamento de 3 dormitorios en el Edificio Playa Marina, frente al borde costero. Amplias áreas comunes y vista panorámica al Pacífico.', tags: ['Vista al mar', 'Piscina', 'Quincho'] },
  { id: 'ls-015', tipo: 'departamento', operacion: 'venta', title: 'Departamento a pasos de la Av. del Mar', sector: 'avenida-del-mar', address: 'Avenida del Mar, La Serena', priceUF: 4200, beds: 2, baths: 2, builtM2: 74, featured: false,
    desc: 'Cómodo departamento de 2 dormitorios a pasos del mar, con terraza y excelente luminosidad. Perfecto para segunda vivienda o renta vacacional.', tags: ['Terraza', 'Luminoso', 'Estacionamiento'] },
  { id: 'ls-016', tipo: 'departamento', operacion: 'venta', title: 'Departamento Avenida del Mar', sector: 'avenida-del-mar', address: 'Avenida del Mar, La Serena', priceUF: 4600, beds: 2, baths: 2, builtM2: 77, featured: false,
    desc: 'Departamento de 2 dormitorios con living-comedor integrado y terraza. Edificio con piscina y áreas de esparcimiento, a metros de la playa.', tags: ['Piscina', 'Terraza', 'Bodega'] },
  { id: 'ls-017', tipo: 'departamento', operacion: 'venta', title: 'Departamento en Serena Golf', sector: 'serena-golf', address: 'Serena Golf, La Serena', priceUF: 4500, beds: 2, baths: 2, builtM2: 80, featured: false,
    desc: 'Departamento de 2 dormitorios en el exclusivo sector Serena Golf, rodeado de áreas verdes y con acceso a club deportivo. Plusvalía asegurada.', tags: ['Club deportivo', 'Áreas verdes', '2 estacionamientos'] },

  // ---- Casas ----
  { id: 'ls-018', tipo: 'casa', operacion: 'venta', title: 'Casa en Torreones de La Serena', sector: 'serena-golf', address: 'La Serena Golf, La Serena', priceUF: 2710, beds: 3, baths: 1, builtM2: 48, featured: false,
    desc: 'Casa de 3 dormitorios en condominio Torreones, sector Serena Golf. Proyecto con áreas verdes y seguridad, ideal para familias jóvenes.', tags: ['Condominio', 'Antejardín', 'Estacionamiento'] },
  { id: 'ls-019', tipo: 'casa', operacion: 'venta', title: 'Casa en Condominio Cerro Oriente', sector: 'cerro-grande', address: 'Camino San Ramón, La Serena', priceUF: 8913, beds: 3, baths: 3, builtM2: 119, featured: false,
    desc: 'Casa de 3 dormitorios en el codiciado Condominio Cerro Oriente, con vistas despejadas a la ciudad y al valle. Excelentes terminaciones y patio.', tags: ['Vista panorámica', 'Patio', 'Quincho', 'Condominio'] },
  { id: 'ls-020', tipo: 'casa', operacion: 'venta', title: 'Casa Nueva Umbrales', sector: 'la-pampa', address: 'Cuatro Esquinas, La Pampa, La Serena', priceUF: 12990, beds: 3, baths: 3, builtM2: 168, featured: true,
    desc: 'Casa nueva de 168 m² en el sector La Pampa, con diseño contemporáneo, amplios ventanales y espacios integrados. Lista para estrenar.', tags: ['A estrenar', 'Diseño moderno', 'Jardín', 'Quincho'] },
  { id: 'ls-021', tipo: 'casa', operacion: 'venta', title: 'Casa en Condominio Arenas', sector: 'serena-golf', address: 'La Serena Golf, La Serena', priceUF: 10682, beds: 3, baths: 4, builtM2: 132, featured: false,
    desc: 'Casa de 3 dormitorios y 4 baños en Condominio Arenas, Serena Golf. Living de doble altura, jardín consolidado y acceso a equipamiento deportivo.', tags: ['Doble altura', 'Jardín', 'Club deportivo', '2 estacionamientos'] },
  { id: 'ls-022', tipo: 'casa', operacion: 'venta', title: 'Casa Senderos de Cerro Grande', sector: 'cerro-grande', address: 'San Joaquín, La Serena', priceUF: 3690, beds: 3, baths: 2, builtM2: 83, featured: false,
    desc: 'Casa de 3 dormitorios en sector Cerro Grande, condominio familiar con áreas verdes. Buena conectividad hacia el centro y la ruta.', tags: ['Condominio', 'Antejardín', 'Patio'] },
  { id: 'ls-023', tipo: 'casa', operacion: 'venta', title: 'Casa Barrio Las Torcazas III', sector: 'la-antena', address: 'Raúl Bitrán, La Antena, La Serena', priceUF: 4520, beds: 3, baths: 2, builtM2: 75, featured: false,
    desc: 'Casa de 3 dormitorios en Barrio Las Torcazas, cercana a la Universidad de La Serena y servicios. Proyecto con áreas comunes y seguridad.', tags: ['Cerca de universidad', 'Áreas comunes', 'Estacionamiento'] },
  { id: 'ls-024', tipo: 'casa', operacion: 'venta', title: 'Casa SJ 1160, San Joaquín', sector: 'san-joaquin', address: 'San Joaquín 1160, La Serena', priceUF: 3830, beds: 3, baths: 1, builtM2: 54, featured: false,
    desc: 'Casa de 3 dormitorios en proyecto SJ 1160, sector San Joaquín. Distribución eficiente y entorno residencial en crecimiento.', tags: ['Proyecto nuevo', 'Antejardín', 'Estacionamiento'] },
  { id: 'ls-025', tipo: 'casa', operacion: 'venta', title: 'Casa Faldeos del Cerro Grande III', sector: 'cerro-grande', address: 'Sixto Cortés, San Joaquín, La Serena', priceUF: 4569, beds: 3, baths: 2, builtM2: 65, featured: false,
    desc: 'Casa de 3 dormitorios en Faldeos del Cerro Grande, con vistas a la ciudad. Condominio consolidado con plazas y juegos infantiles.', tags: ['Vista a la ciudad', 'Plazas', 'Patio'] },
  { id: 'ls-026', tipo: 'casa', operacion: 'venta', title: 'Casa Hacienda El Tejar (Lunger Park)', sector: 'otros', address: 'Vicente Zorrilla, La Serena', priceUF: 3123, beds: 2, baths: 2, builtM2: 58, featured: false,
    desc: 'Casa de 2 dormitorios en el barrio Hacienda El Tejar, entorno tranquilo y áreas verdes. Excelente alternativa de acceso a vivienda propia.', tags: ['Condominio', 'Áreas verdes', 'Antejardín'] },
  { id: 'ls-027', tipo: 'casa', operacion: 'venta', title: 'Casa 3D/2B en Raúl Bitrán', sector: 'san-joaquin', address: 'Raúl Bitrán, San Joaquín, La Serena', priceUF: 7000, beds: 3, baths: 2, builtM2: 99, featured: false,
    desc: 'Casa de 3 dormitorios y 99 m² en sector San Joaquín, con patio y quincho. Cercana a comercio, colegios y centros de salud.', tags: ['Quincho', 'Patio', 'Estacionamiento doble'] },
  { id: 'ls-028', tipo: 'casa', operacion: 'venta', title: 'Casa 4D en Condominio La Reserva', sector: 'san-joaquin', address: 'Condominio La Reserva, San Joaquín, La Serena', priceUF: 8800, beds: 4, baths: 4, builtM2: 137, featured: true,
    desc: 'Casa de 4 dormitorios en el exclusivo Condominio La Reserva, con seguridad 24/7, áreas verdes y club house. Amplios espacios y terminaciones premium.', tags: ['Seguridad 24/7', 'Club house', 'Jardín', 'Quincho'] },
  { id: 'ls-029', tipo: 'casa', operacion: 'venta', title: 'Casa 5D en Gabriela Mistral / Cuatro Esquinas', sector: 'san-joaquin', address: 'Gabriela Mistral, San Joaquín, La Serena', priceUF: 9620, priceClpOverride: 380000000, beds: 5, baths: 6, builtM2: 210, featured: false,
    desc: 'Amplia casa de 5 dormitorios y 6 baños, 210 m² construidos, en sector consolidado. Ideal para familia numerosa o uso mixto habitación/oficina.', tags: ['Gran metraje', 'Patio amplio', 'Estacionamientos'] },
  { id: 'ls-030', tipo: 'casa', operacion: 'venta', title: 'Amplia casa con vista privilegiada en Cerro Grande', sector: 'cerro-grande', address: 'Cerro Grande, La Serena', priceUF: 17900, beds: 5, baths: 4, builtM2: 257, featured: true,
    desc: 'Imponente casa de 257 m² en lo alto de Cerro Grande, con vista panorámica a la ciudad y al mar. Living de doble altura, piscina y amplios jardines.', tags: ['Vista panorámica', 'Piscina', 'Jardines', 'Doble altura'] },
  { id: 'ls-031', tipo: 'casa', operacion: 'venta', title: 'Casa estilo mediterráneo en San Joaquín', sector: 'san-joaquin', address: 'San Joaquín, La Serena', priceUF: 9900, beds: 6, baths: 5, builtM2: 272, featured: false,
    desc: 'Casa estilo mediterráneo de 6 dormitorios y 272 m², con generosos espacios comunes, quincho y piscina. Perfecta para vida familiar y recepciones.', tags: ['Piscina', 'Quincho', 'Estilo mediterráneo', 'Jardín'] },
  { id: 'ls-032', tipo: 'casa', operacion: 'venta', title: 'Casa en el centro de La Serena', sector: 'centro', address: 'Almagro, Centro, La Serena', priceUF: 8990, beds: 8, baths: 6, builtM2: 405, featured: false,
    desc: 'Casona de 405 m² en pleno centro histórico de La Serena. Gran potencial residencial o comercial (oficinas, hostal o clínica), a pasos de la Avenida Francisco de Aguirre.', tags: ['Uso mixto', 'Centro histórico', 'Gran superficie'] },
  { id: 'ls-033', tipo: 'casa', operacion: 'venta', title: 'Casa mediterránea en parcela, Valle de Elqui', sector: 'valle-elqui', address: 'Ruta D-305, La Serena', priceUF: 5500, beds: 4, baths: 2, builtM2: 150, lotM2: 5800, featured: false,
    desc: 'Casa mediterránea de 150 m² emplazada en parcela de 5.800 m² camino al Valle de Elqui. Entorno de naturaleza, cielos limpios y total privacidad.', tags: ['Parcela 5.800 m²', 'Naturaleza', 'Privacidad', 'Estacionamiento'] },
];
