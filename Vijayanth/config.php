<?php
$DB_HOST = "localhost";
$DB_USER = "root";
$DB_PASS = "";

$PLANTS = [
    'vijayanth' => [
        'name'     => 'Bojaraj Textiles Pvt Ltd',
        'db'       => 'vijayanth',
        'capacity' => '4.0',
        'location' => 'Tamil Nadu',
        'theme'    => 'violet',
        'ws_url'   => 'wss://vinobasolar.scadahub.in:5001',
        'ws_unit_id' => 'via-1mw',
        'inverter_count' => 14,
        'service_number' => '069-044-6600',
        'status'   => 'live',
    ],
    'krishna' => [
        'name'     => 'Krishna poultry farm',
        'db'       => 'vijayanth',
        'capacity' => '3.0',
        'location' => 'Tamil Nadu',
        'theme'    => 'emerald',
        'ws_url'   => 'wss://vinobasolar.scadahub.in:5001',
        'ws_unit_id' => 'via-3mw',
        'inverter_count' => 10,
        'service_number' => '069-044-6601',
        'status'   => 'live',
    ],
];

function getDefaultPlantId() {
    global $PLANTS;
    return array_key_first($PLANTS);
}

function getPlantConfig($plant_id) {
    global $PLANTS;
    return $PLANTS[$plant_id] ?? null;
}

function getPlantPublicConfigJson() {
    global $PLANTS;
    $public = [];
    foreach ($PLANTS as $pid => $pinfo) {
        $public[$pid] = [
            'name' => $pinfo['name'],
            'capacity' => $pinfo['capacity'],
            'location' => $pinfo['location'],
            'ws_unit_id' => $pinfo['ws_unit_id'],
            'inverter_count' => $pinfo['inverter_count'] ?? 0,
            'service_number' => $pinfo['service_number'] ?? '',
        ];
    }
    return json_encode($public, JSON_UNESCAPED_SLASHES);
}

function getPlantDbConn($plant_id) {
    global $DB_HOST, $DB_USER, $DB_PASS, $PLANTS;
    if (!isset($PLANTS[$plant_id])) return null;
    $db = $PLANTS[$plant_id]['db'];
    try {
        $conn = new mysqli($DB_HOST, $DB_USER, $DB_PASS, $db);
        if ($conn->connect_error) return null;
        return $conn;
    } catch (Exception $e) {
        return null;
    }
}

function getPlantWsUrl($plant_id) {
    global $PLANTS;
    return $PLANTS[$plant_id]['ws_url'] ?? '';
}

function getPlantWsUnitId($plant_id) {
    global $PLANTS;
    return $PLANTS[$plant_id]['ws_unit_id'] ?? $plant_id;
}

function findUserByTokenAcrossPlants($token, &$foundPlantId = null) {
    global $PLANTS;
    foreach ($PLANTS as $pid => $pinfo) {
        $c = getPlantDbConn($pid);
        if (!$c) continue;
        $t = $c->real_escape_string($token);
        $res = $c->query("SELECT id, email, role, plant_id, auth_token FROM users WHERE auth_token = '$t' LIMIT 1");
        if ($res && $res->num_rows > 0) {
            $user = $res->fetch_assoc();
            $foundPlantId = $user['plant_id'] ?: $pid;
            $user['plant_id'] = $foundPlantId;
            return ['user' => $user, 'conn' => $c];
        }
        $c->close();
    }
    return null;
}

$firstPlant = array_key_first($PLANTS);
$conn = getPlantDbConn($firstPlant);
?>
