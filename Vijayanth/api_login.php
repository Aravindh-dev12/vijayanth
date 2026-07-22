<?php
session_start();
require 'config.php';
header('Content-Type: application/json');
date_default_timezone_set('Asia/Kolkata');

$data = json_decode(file_get_contents('php://input'), true);
$email = isset($data['email']) ? strtolower(trim($data['email'])) : '';
$pass = isset($data['password']) ? (string)$data['password'] : '';

$emailToPlant = [
    'admin@vijayanth.com' => getDefaultPlantId(),
    'admin@scada.com' => getDefaultPlantId(),
    'bojaraj@scada.com' => 'vijayanth',
    'krishna@scada.com' => 'krishna',
    'vijayanth@scada.com' => 'vijayanth_cosmic',
];

$selectedPlant = $emailToPlant[$email] ?? '';
$foundUser = null;
$foundPlant = '';
$foundConn = null;

function loginResolvePlant($email, $selectedPlant, $rowPlant, $fallbackPlant, $role) {
    global $PLANTS;
    $role = strtolower(trim((string)$role));
    $rowPlant = strtolower(trim((string)$rowPlant));

    if ($role === 'admin') return getDefaultPlantId();
    if ($selectedPlant && isset($PLANTS[$selectedPlant])) return $selectedPlant;
    if ($rowPlant && isset($PLANTS[$rowPlant])) return $rowPlant;
    if ($fallbackPlant && isset($PLANTS[$fallbackPlant])) return $fallbackPlant;
    return getDefaultPlantId();
}

if ($selectedPlant && isset($PLANTS[$selectedPlant])) {
    $userConn = getPlantDbConn($selectedPlant);
    if ($userConn) {
        $esc = $userConn->real_escape_string($email);
        $res = $userConn->query("SELECT * FROM users WHERE LOWER(email)='$esc' LIMIT 1");
        if ($res && $res->num_rows > 0) {
            $foundUser = $res->fetch_assoc();
            $foundPlant = loginResolvePlant($email, $selectedPlant, $foundUser['plant_id'] ?? '', $selectedPlant, $foundUser['role'] ?? 'user');
            $foundConn = $userConn;
        } else {
            $userConn->close();
        }
    }
}

if (!$foundUser) {
    foreach ($PLANTS as $pid => $pinfo) {
        $userConn = getPlantDbConn($pid);
        if (!$userConn) continue;
        $esc = $userConn->real_escape_string($email);
        $res = $userConn->query("SELECT * FROM users WHERE LOWER(email)='$esc' LIMIT 1");
        if ($res && $res->num_rows > 0) {
            $foundUser = $res->fetch_assoc();
            $foundPlant = loginResolvePlant($email, $selectedPlant, $foundUser['plant_id'] ?? '', $pid, $foundUser['role'] ?? 'user');
            $foundConn = $userConn;
            break;
        }
        $userConn->close();
    }
}

if (!$foundUser) {
    echo json_encode(['status' => 'error', 'message' => 'User not found.']);
    exit;
}

if (!password_verify($pass, $foundUser['password'])) {
    $foundConn->close();
    echo json_encode(['status' => 'error', 'message' => 'Invalid password.']);
    exit;
}

$role = strtolower(trim((string)($foundUser['role'] ?? 'user')));
$token = bin2hex(random_bytes(32));
$uid = (int)$foundUser['id'];
$safePlant = $foundConn->real_escape_string($foundPlant);
$foundConn->query("UPDATE users SET auth_token='$token', plant_id='$safePlant' WHERE id=$uid");
$foundConn->close();

$foundUser['role'] = $role;
$foundUser['plant_id'] = $foundPlant;
$_SESSION['user'] = $foundUser;
$_SESSION['plant_id'] = $foundPlant;

$redirect = $role === 'admin'
    ? 'admin.php'
    : 'overview.php?plant=' . rawurlencode($foundPlant);

echo json_encode([
    'status' => 'success',
    'token' => $token,
    'redirect' => $redirect,
    'user' => [
        'email' => $foundUser['email'],
        'role' => $role,
        'plant_id' => $foundPlant,
    ],
]);
