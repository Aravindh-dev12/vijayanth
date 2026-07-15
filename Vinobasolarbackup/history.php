<?php
// history.php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');

$host = 'localhost';
$user = 'root'; 
$pass = 'Arun@811001';

// Get the requested plant from the URL
$plant = isset($_GET['plant']) ? $_GET['plant'] : null;

if (!$plant) {
    echo json_encode(['success' => false, 'message' => 'No plant specified']);
    exit;
}

try {
    $dsn = "mysql:host=$host;dbname=$plant;charset=utf8mb4";
    $pdo = new PDO($dsn, $user, $pass, [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC
    ]);

    // Fetch the last 24 data points, ordered by newest first
    // Adjust the LIMIT based on how often your cron job inserts data (e.g., 288 for 5-min intervals over 24h)
    $stmt = $pdo->query("SELECT ts, data_json FROM device_vcb ORDER BY ts DESC LIMIT 24");
    $rows = $stmt->fetchAll();

    // Reverse the array so the oldest data is on the left of the chart and newest on the right
    $rows = array_reverse($rows);

    $times = [];
    $power = [];

    foreach ($rows as $row) {
        $data = json_decode($row['data_json'], true);
        
        // Format timestamp to just show HH:MM for the X-axis
        $timeStr = date('H:i', strtotime($row['ts']));
        
        $activePower = isset($data['3 Phase Active Power']) ? (float)$data['3 Phase Active Power'] : 0;

        $times[] = $timeStr;
        $power[] = round($activePower, 1);
    }

    echo json_encode([
        'success' => true,
        'times' => $times,
        'power' => $power
    ]);

} catch (PDOException $e) {
    echo json_encode(['success' => false, 'message' => 'Database error']);
}
?>