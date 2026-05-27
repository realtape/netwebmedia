<?php
require_once __DIR__ . '/../lib/tenancy.php';
if ($method !== 'GET') jsonError('Use GET to seed contacts', 405);

$db = getDB();
$seedOrgId = is_org_schema_applied() ? (current_org_id() ?? ORG_MASTER_ID) : null;

// Ensure UNIQUE index on email exists (idempotent — safe to run repeatedly)
try {
    $db->exec('CREATE UNIQUE INDEX IF NOT EXISTS idx_contacts_email ON contacts(email)');
} catch (Exception $e) {
    // Index may already exist under a different mechanism — continue
}

$contacts = [
    // 1. Owner
    [
        'name'         => 'Carlos Martinez',
        'email'        => 'carlos@netwebmedia.com',
        'phone'        => '+56 9 0000 0001',
        'company'      => 'NetWebMedia',
        'role'         => 'CEO & Founder',
        'status'       => 'customer',
        'value'        => 0,
        'last_contact' => date('Y-m-d'),
        'notes'        => 'Owner account',
    ],

    // 2. Real HubSpot Chile campaign leads
    [
        'name'         => 'Wedding Planner Santiago',
        'email'        => 'contacto@weddingplannersantiago.com.cl',
        'phone'        => '+56962905048',
        'company'      => 'Wedding Planner Santiago',
        'role'         => 'Dueño',
        'status'       => 'lead',
        'value'        => 4800,
        'last_contact' => '2026-04-16',
        'notes'        => null,
    ],
    [
        'name'         => 'Video Producciones Carrasco',
        'email'        => 'eventos@videoproduccionescarra.com.cl',
        'phone'        => '+56969248393',
        'company'      => 'Video Producciones Carrasco',
        'role'         => 'Propietario',
        'status'       => 'lead',
        'value'        => 3200,
        'last_contact' => '2026-04-16',
        'notes'        => null,
    ],
    [
        'name'         => 'Consultora Financiera González',
        'email'        => 'asesorias@consultorafinancierago.com.cl',
        'phone'        => '+56965997921',
        'company'      => 'Consultora Financiera González',
        'role'         => 'Director',
        'status'       => 'lead',
        'value'        => 6400,
        'last_contact' => '2026-04-16',
        'notes'        => null,
    ],
    [
        'name'         => 'Seguros Generales Valenzuela',
        'email'        => 'contadores@segurosgeneralesvalenz.com.cl',
        'phone'        => '+56972304086',
        'company'      => 'Seguros Generales Valenzuela',
        'role'         => 'Gerente',
        'status'       => 'lead',
        'value'        => 4200,
        'last_contact' => '2026-04-16',
        'notes'        => null,
    ],
    [
        'name'         => 'Viña Contreras',
        'email'        => 'turismo@vinacontreras.cl',
        'phone'        => '+56945608284',
        'company'      => 'Viña Contreras',
        'role'         => 'Propietario',
        'status'       => 'lead',
        'value'        => 7800,
        'last_contact' => '2026-04-16',
        'notes'        => null,
    ],
    [
        'name'         => 'Fundo Riquelme',
        'email'        => 'ventas@fundoriquelme.cl',
        'phone'        => '+56955356325',
        'company'      => 'Fundo Riquelme',
        'role'         => 'Administrador',
        'status'       => 'lead',
        'value'        => 5600,
        'last_contact' => '2026-04-16',
        'notes'        => null,
    ],
    [
        'name'         => 'Catering Santiago',
        'email'        => 'eventos@cateringsantiago.com.cl',
        'phone'        => '+56975915602',
        'company'      => 'Catering Santiago',
        'role'         => 'Dueño',
        'status'       => 'lead',
        'value'        => 3800,
        'last_contact' => '2026-04-16',
        'notes'        => null,
    ],
    [
        'name'         => 'Centro de Eventos Araya',
        'email'        => 'info@centrodeeventosaraya.com',
        'phone'        => '+56976335759',
        'company'      => 'Centro de Eventos Araya',
        'role'         => 'Propietario',
        'status'       => 'lead',
        'value'        => 5200,
        'last_contact' => '2026-04-16',
        'notes'        => null,
    ],
    [
        'name'         => 'Jardín de Eventos Martínez',
        'email'        => 'eventos@jardindeeventosmartine.com.cl',
        'phone'        => '+56956243143',
        'company'      => 'Jardín de Eventos Martínez',
        'role'         => 'Gerente',
        'status'       => 'lead',
        'value'        => 4600,
        'last_contact' => '2026-04-16',
        'notes'        => null,
    ],
    [
        'name'         => 'Inversiones Vera',
        'email'        => 'contacto@inversionesvera.com',
        'phone'        => '+56948917081',
        'company'      => 'Inversiones Vera',
        'role'         => 'Director',
        'status'       => 'lead',
        'value'        => 8200,
        'last_contact' => '2026-04-16',
        'notes'        => null,
    ],

];

if ($seedOrgId !== null) {
    $stmt = $db->prepare(
        'INSERT IGNORE INTO contacts (organization_id, name, email, phone, company, role, status, value, last_contact, notes)
         VALUES (:organization_id, :name, :email, :phone, :company, :role, :status, :value, :last_contact, :notes)'
    );
} else {
    $stmt = $db->prepare(
        'INSERT IGNORE INTO contacts (name, email, phone, company, role, status, value, last_contact, notes)
         VALUES (:name, :email, :phone, :company, :role, :status, :value, :last_contact, :notes)'
    );
}

$inserted = 0;
foreach ($contacts as $c) {
    $bind = [
        ':name'         => $c['name'],
        ':email'        => $c['email'],
        ':phone'        => $c['phone'],
        ':company'      => $c['company'],
        ':role'         => $c['role'],
        ':status'       => $c['status'],
        ':value'        => $c['value'],
        ':last_contact' => $c['last_contact'],
        ':notes'        => $c['notes'],
    ];
    if ($seedOrgId !== null) $bind[':organization_id'] = $seedOrgId;
    $stmt->execute($bind);
    $inserted += $stmt->rowCount();
}

jsonResponse(['seeded' => true, 'inserted' => $inserted, 'total_attempted' => count($contacts)]);
