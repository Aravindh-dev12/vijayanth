<?php
$DB_HOST = getenv('VS_DB_HOST') !== false ? getenv('VS_DB_HOST') : "localhost";
$DB_USER = getenv('VS_DB_USER') !== false ? getenv('VS_DB_USER') : "root";
$DB_PASS = getenv('VS_DB_PASS') !== false ? getenv('VS_DB_PASS') : "";
$STORE_TOKEN = getenv('VS_STORE_TOKEN') !== false ? getenv('VS_STORE_TOKEN') : "";

// Keep production credentials outside Git. A local file may override any of
// the DB variables above (copy config.local.example.php to config.local.php).
$localConfig = __DIR__ . DIRECTORY_SEPARATOR . 'config.local.php';
if (is_file($localConfig)) require $localConfig;

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
    'vijayanth_cosmic' => [
        'name'     => 'Vijayanth Cosmic Powers Pvt Ltd',
        'db'       => 'vijayanth',
        'capacity' => '7.0',
        'location' => 'Tamil Nadu',
        'theme'    => 'blue',
        'ws_url'   => 'wss://vinobasolar.scadahub.in:5001',
        'ws_unit_id' => 'via-7mw',
        'inverter_count' => 0,
        'service_number' => '',
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

function getPlantCachePath($plant_id) {
    $safePlantId = preg_replace('/[^a-zA-Z0-9_-]/', '', (string)$plant_id);
    return rtrim(sys_get_temp_dir(), DIRECTORY_SEPARATOR) . DIRECTORY_SEPARATOR . "plant_{$safePlantId}_cache.json";
}

function readPlantSnapshotCache($plant_id, $maxAgeSeconds = 300) {
    $path = getPlantCachePath($plant_id);
    if (!is_file($path) || (time() - (int)@filemtime($path)) > $maxAgeSeconds) return null;
    $decoded = json_decode((string)@file_get_contents($path), true);
    return is_array($decoded) && isset($decoded['data']) ? $decoded : null;
}

function updatePlantSnapshotCache($plant_id, $type, $device_name, array $payload, $snapshot_at) {
    $path = getPlantCachePath($plant_id);
    $lockPath = $path . '.lock';
    $lock = @fopen($lockPath, 'c');
    if (!$lock || !@flock($lock, LOCK_EX)) {
        if ($lock) @fclose($lock);
        return false;
    }

    $cache = json_decode((string)@file_get_contents($path), true);
    if (!is_array($cache)) $cache = [];
    $cache['status'] = 'success';
    $cache['plant_id'] = $plant_id;
    $cache['updated_at'] = time();
    $cache['data'] = is_array($cache['data'] ?? null) ? $cache['data'] : [];
    $existingInverters = is_array($cache['data']['inverters'] ?? null) ? $cache['data']['inverters'] : [];
    $existingTransformers = is_array($cache['data']['transformers'] ?? null) ? $cache['data']['transformers'] : [];
    $cache['data']['inverters'] = [];
    foreach ($existingInverters as $row) {
        if (is_array($row) && !empty($row['inverter_name'])) $cache['data']['inverters'][$row['inverter_name']] = $row;
    }
    $cache['data']['transformers'] = [];
    foreach ($existingTransformers as $row) {
        if (is_array($row) && !empty($row['device_name'])) $cache['data']['transformers'][$row['device_name']] = $row;
    }

    if ($type === 'inverter') {
        $row = [
            'plant_id' => $plant_id, 'inverter_name' => preg_match('/\d+/', $device_name, $m) ? 'INVERTER' . (int)$m[0] : strtoupper(preg_replace('/\s+/', '', $device_name)),
            'snapshot_at' => $snapshot_at, 'power_kw' => (string)(float)($payload['power'] ?? 0),
            'reactive_kvar' => (string)(float)($payload['reactive'] ?? 0), 'power_factor' => (string)(float)($payload['pf'] ?? 0),
            'vac_ab' => (string)(float)($payload['vac_ab'] ?? 0), 'vac_bc' => (string)(float)($payload['vac_bc'] ?? 0), 'vac_ca' => (string)(float)($payload['vac_ca'] ?? 0),
            'frequency_hz' => (string)(float)($payload['freq'] ?? 0), 'current_a' => (string)(float)($payload['i_a'] ?? 0),
            'current_b' => (string)(float)($payload['i_b'] ?? 0), 'current_c' => (string)(float)($payload['i_c'] ?? 0),
            'efficiency' => (string)(float)($payload['eff'] ?? 0), 'ambient_temp' => (string)(float)($payload['amb'] ?? 0),
            'daily_gen_kwh' => (string)(float)($payload['dailyGen'] ?? 0), 'total_gen_kwh' => (string)(float)($payload['totalGen'] ?? 0),
            'daily_co2_kg' => (string)(float)($payload['dailyCO2'] ?? 0), 'total_co2_kg' => (string)(float)($payload['totalCO2'] ?? 0),
            'daily_hours' => (string)(float)($payload['dailyHrs'] ?? 0), 'total_hours' => (string)(float)($payload['totalHrs'] ?? 0),
            'active_strings' => (string)(int)($payload['activeStr'] ?? 0), 'total_strings' => (string)(int)($payload['totalStr'] ?? 0),
            'has_alarm' => !empty($payload['hasAlarm']) ? '1' : '0', 'has_fault' => !empty($payload['hasFault']) ? '1' : '0',
            'fault_code' => (string)($payload['faultCode'] ?? ''), 'work_state' => (string)($payload['workState'] ?? ''),
            'status_text' => (string)($payload['statusText'] ?? ''), 'strings' => $payload['strings'] ?? []
        ];
        $cache['data']['inverters'][$device_name] = $row;
    } elseif ($type === 'vcb') {
        $row = ['plant_id' => $plant_id, 'device_name' => $device_name, 'snapshot_at' => $snapshot_at];
        $map = ['power_3phase_kw','frequency_hz','voltage_r_v','voltage_y_v','voltage_b_v','voltage_ry_v','voltage_yb_v','voltage_br_v','current_r_a','current_y_a','current_b_a','power_r_kw','power_y_kw','power_b_kw','pf_q1','pf_q2','pf_q3','vthd_r','vthd_y','vthd_b','active_export_kwh','active_import_kwh','reactive_import_kvar','reactive_export_kvar','today_energy_kwh'];
        foreach ($map as $key) $row[$key] = (string)(float)($payload[$key] ?? 0);
        $cache['data']['vcb'] = $row;
    } elseif ($type === 'transformer') {
        $cache['data']['transformers'][$device_name] = [
            'plant_id' => $plant_id, 'device_name' => $device_name, 'snapshot_at' => $snapshot_at,
            'oil_temp_c' => (string)(float)($payload['oil_temp_c'] ?? 0),
            'winding_temp_c' => (string)(float)($payload['winding_temp_c'] ?? 0)
        ];
    }

    $cache['data']['inverters'] = array_values($cache['data']['inverters']);
    $cache['data']['transformers'] = array_values($cache['data']['transformers']);
    usort($cache['data']['inverters'], function($a, $b) {
        preg_match('/\d+/', $a['inverter_name'] ?? '', $ma);
        preg_match('/\d+/', $b['inverter_name'] ?? '', $mb);
        return ((int)($ma[0] ?? 0)) <=> ((int)($mb[0] ?? 0));
    });

    $tmp = $path . '.' . getmypid() . '.tmp';
    $written = @file_put_contents($tmp, json_encode($cache, JSON_UNESCAPED_SLASHES));
    $ok = $written !== false && @rename($tmp, $path);
    if (!$ok) @unlink($tmp);
    @flock($lock, LOCK_UN);
    @fclose($lock);
    return $ok;
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