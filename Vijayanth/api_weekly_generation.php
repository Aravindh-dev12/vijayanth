<?php
session_start();
require 'config.php';
header('Content-Type: application/json');
date_default_timezone_set('Asia/Kolkata');

if (!isset($_SESSION['user']) || !is_array($_SESSION['user'])) {
    echo json_encode(['status' => 'error', 'message' => 'Unauthorized.']);
    exit;
}

$user = $_SESSION['user'];
$email = strtolower(trim((string)($user['email'] ?? '')));
$role = strtolower(trim((string)($user['role'] ?? 'user')));

$emailPlantMap = [
    'bojaraj@scada.com' => 'vijayanth',
    'krishna@scada.com' => 'krishna',
    'vijayanth@scada.com' => 'vijayanth_cosmic',
];

if ($role === 'admin') {
    $plant_id = isset($_GET['plant_id']) && isset($PLANTS[$_GET['plant_id']]) ? $_GET['plant_id'] : getDefaultPlantId();
} else {
    $plant_id = $emailPlantMap[$email] ?? strtolower(trim((string)($user['plant_id'] ?? '')));
}

if (!$plant_id || !isset($PLANTS[$plant_id])) {
    echo json_encode(['status' => 'error', 'message' => 'Invalid plant_id.']);
    exit;
}

$conn = getPlantDbConn($plant_id);
if (!$conn) {
    echo json_encode(['status' => 'error', 'message' => 'Database connection failed.']);
    exit;
}

$today = new DateTimeImmutable('today');
$start = $today->modify('-' . (int)$today->format('w') . ' days'); // Sunday
$end = $start->modify('+6 days'); // Saturday
$startSql = $start->format('Y-m-d') . ' 00:00:00';
$endSql = $end->format('Y-m-d') . ' 23:59:59';
$escPlant = $conn->real_escape_string($plant_id);
$escStart = $conn->real_escape_string($startSql);
$escEnd = $conn->real_escape_string($endSql);

$cap = (float)($PLANTS[$plant_id]['capacity'] ?? 1);
$expectedDaily = $cap * 1000 * 0.8 * 5;

$vcbData = [];
$vcbSql = "SELECT DATE(snapshot_at) AS day, MAX(today_energy_kwh) AS actual
           FROM vcb_data
           WHERE plant_id = '$escPlant' AND snapshot_at BETWEEN '$escStart' AND '$escEnd'
           GROUP BY DATE(snapshot_at)";
$vcbRes = $conn->query($vcbSql);
if ($vcbRes) {
    while ($row = $vcbRes->fetch_assoc()) {
        $vcbData[$row['day']] = max(0, (float)$row['actual']);
    }
}

$inverterData = [];
$invSql = "SELECT day, SUM(inv_actual) AS actual
           FROM (
               SELECT DATE(snapshot_at) AS day, inverter_name, MAX(daily_gen_kwh) AS inv_actual
               FROM inverter_data
               WHERE plant_id = '$escPlant' AND snapshot_at BETWEEN '$escStart' AND '$escEnd'
               GROUP BY DATE(snapshot_at), inverter_name
           ) d
           GROUP BY day";
$invRes = $conn->query($invSql);
if ($invRes) {
    while ($row = $invRes->fetch_assoc()) {
        $inverterData[$row['day']] = max(0, (float)$row['actual']);
    }
}

$conn->close();

$result = [];
for ($i = 0; $i < 7; $i++) {
    $date = $start->modify('+' . $i . ' days');
    $key = $date->format('Y-m-d');
    $vcb = $vcbData[$key] ?? 0;
    $inv = $inverterData[$key] ?? 0;
    $actual = max($vcb, $inv);
    $source = $vcb > 0 ? 'vcb_data' : ($inv > 0 ? 'inverter_data' : 'none');

    $result[] = [
        'date' => $key,
        'day' => $date->format('D'),
        'actual' => round($actual, 2),
        'expected' => round($expectedDaily, 2),
        'source' => $source,
    ];
}

echo json_encode([
    'status' => 'success',
    'plant_id' => $plant_id,
    'week_start' => $start->format('Y-m-d'),
    'week_end' => $end->format('Y-m-d'),
    'data' => $result,
]);
