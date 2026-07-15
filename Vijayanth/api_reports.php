<?php
require 'config.php';
header('Content-Type: application/json');
header('Cache-Control: private, max-age=10, stale-while-revalidate=30');
date_default_timezone_set('Asia/Kolkata');

$type = ($_GET['type'] ?? 'daily') === 'monthly' ? 'monthly' : 'daily';
$date = trim((string)($_GET['date'] ?? date('Y-m-d')));
$plant = strtolower(trim((string)($_GET['plant'] ?? getDefaultPlantId())));

if (!isset($PLANTS[$plant])) {
    http_response_code(400);
    echo json_encode(['success' => false, 'error' => 'Invalid plant.', 'data' => []]);
    exit;
}
if (($type === 'daily' && !preg_match('/^\d{4}-\d{2}-\d{2}$/', $date)) ||
    ($type === 'monthly' && !preg_match('/^\d{4}-\d{2}$/', $date))) {
    http_response_code(400);
    echo json_encode(['success' => false, 'error' => 'Invalid report date.', 'data' => []]);
    exit;
}

$conn = getPlantDbConn($plant);
if (!$conn) {
    http_response_code(503);
    echo json_encode(['success' => false, 'error' => 'Database connection failed.', 'data' => []]);
    exit;
}

$escPlant = $conn->real_escape_string($plant);
$escDate = $conn->real_escape_string($date);
$periodSql = $type === 'daily'
    ? "snapshot_at >= '{$escDate} 00:00:00' AND snapshot_at <= '{$escDate} 23:59:59'"
    : "snapshot_at >= '{$escDate}-01 00:00:00' AND snapshot_at < DATE_ADD('{$escDate}-01 00:00:00', INTERVAL 1 MONTH)";
$bucketSql = $type === 'daily'
    ? "DATE_FORMAT(snapshot_at, '%H:00')"
    : "DATE_FORMAT(snapshot_at, '%d-%m-%Y')";

$sql = "SELECT {$bucketSql} AS time_label, inverter_name,
               MAX(daily_gen_kwh) AS generation_kwh,
               MAX(power_kw) AS power_kw,
               MAX(ambient_temp) AS ambient_temp
        FROM inverter_data
        WHERE plant_id = '{$escPlant}' AND {$periodSql}
        GROUP BY time_label, inverter_name
        ORDER BY MIN(snapshot_at), inverter_name";
$result = @$conn->query($sql);
$byBucket = [];
$names = [];
if ($result) {
    while ($row = $result->fetch_assoc()) {
        if ($type === 'daily') {
            $hour = (int)substr($row['time_label'], 0, 2);
            if ($hour < 6 || $hour > 18) continue;
        }
        $name = (string)$row['inverter_name'];
        $names[$name] = true;
        $byBucket[$row['time_label']][$name] = (float)$row['generation_kwh'];
    }
}
$conn->close();

$invNames = array_keys($names);
usort($invNames, function($a, $b) {
    preg_match('/\d+/', $a, $ma); preg_match('/\d+/', $b, $mb);
    return ((int)($ma[0] ?? 0)) <=> ((int)($mb[0] ?? 0));
});
$rows = [];
foreach ($byBucket as $label => $values) {
    $row = ['time_label' => $label];
    $total = 0;
    foreach ($invNames as $i => $name) {
        $value = (float)($values[$name] ?? 0);
        $row['inv' . ($i + 1) . '_kwh'] = $value;
        $total += $value;
    }
    $row['inv_total_kwh'] = $total;
    $rows[] = $row;
}

echo json_encode([
    'success' => true,
    'meta' => ['type' => $type, 'date' => $date, 'plant' => $plant, 'inv_names' => $invNames, 'source' => 'database_cache'],
    'data' => $rows
], JSON_UNESCAPED_SLASHES);
?>
