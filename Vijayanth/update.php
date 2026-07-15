<?php
// ===== CORS HEADERS (MUST BE FIRST) =====
header("Access-Control-Allow-Origin: http://app.local");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");
header("Access-Control-Max-Age: 86400");
date_default_timezone_set("Asia/Kolkata");

// Preflight response
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

header("Content-Type: application/json");

error_reporting(E_ALL);
ini_set('display_errors', 0);      // IMPORTANT for API
ini_set('display_startup_errors', 0); 
ini_set('log_errors', 1);

/* ---------- SAFE FAIL ---------- */
function fail($msg) {
    echo json_encode(["success" => false, "error" => $msg]);
    exit;
}

/* ---------- READ INPUT ---------- */
$raw = file_get_contents("php://input");
$input = json_decode($raw, true);
if (!$input) fail("Invalid JSON");

/* ---------- EXTRACT ---------- */
$plantId    = $input['plantId'] ?? '';
$task       = $input['task'] ?? '';
$deviceName = $input['deviceName'] ?? '';
$deviceId   = $input['deviceId'] ?? '';
$data       = $input['data'] ?? [];

if (!$plantId || !$deviceName || empty($data)) {
    fail("Missing plantId / deviceName / data");
}

/* ---------- TIMESTAMP FIX & 30-SECOND BUCKET ---------- */
$timestampRaw = $input['timestamp'] ?? '';
try {
    $dt = new DateTime($timestampRaw, new DateTimeZone("UTC"));
    $dt->setTimezone(new DateTimeZone("Asia/Kolkata"));
    
    // Calculate the 30-second bucket
    $seconds = (int)$dt->format('s');
    $bucketSeconds = ($seconds < 30) ? 0 : 30;
    
    // Overwrite the time with the rounded seconds
    $dt->setTime((int)$dt->format('H'), (int)$dt->format('i'), $bucketSeconds);
    
    $timestamp = $dt->format("Y-m-d H:i:s");
} catch (Exception $e) {
    fail("Invalid timestamp format");
}

/* ---------- DB CONNECTION ---------- */
$conn = new mysqli("localhost", "root", "Arun@811001", $plantId);
if ($conn->connect_error) {
    fail($conn->connect_error);
}

/* ---------- SAFE TABLE NAME FROM DEVICE NAME ---------- */
$table = "device_" . strtolower(
    preg_replace("/[^a-zA-Z0-9_]/", "_", $deviceName)
);

/* ---------- CREATE TABLE ---------- */
// ADDED: UNIQUE KEY `unique_ts` (`ts`) to enforce 1 record per timestamp
$sqlCreate = "
CREATE TABLE IF NOT EXISTS `$table` (
    id INT AUTO_INCREMENT PRIMARY KEY,
    plant_id VARCHAR(50),
    task_name VARCHAR(50),
    device_name VARCHAR(50),
    device_id VARCHAR(50),
    ts DATETIME,
    data_json LONGTEXT,
    UNIQUE KEY `unique_ts` (`ts`)
) ENGINE=InnoDB;
";

if (!$conn->query($sqlCreate)) {
    fail($conn->error);
}

/* ---------- INSERT ---------- */
// ADDED: ON DUPLICATE KEY UPDATE to overwrite data if a 30s bucket already exists
$stmt = $conn->prepare("
INSERT INTO `$table`
(plant_id, task_name, device_name, device_id, ts, data_json)
VALUES (?, ?, ?, ?, ?, ?)
ON DUPLICATE KEY UPDATE 
    data_json = VALUES(data_json),
    task_name = VALUES(task_name)
");

$jsonData = json_encode($data);

$stmt->bind_param(
    "ssssss",
    $plantId,
    $task,
    $deviceName,
    $deviceId,
    $timestamp,
    $jsonData
);

if (!$stmt->execute()) {
    fail($stmt->error);
}

$stmt->close();
$conn->close();

/* ---------- SUCCESS ---------- */
echo json_encode([
    "success" => true,
    "table" => $table
]);
