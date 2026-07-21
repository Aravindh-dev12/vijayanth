<?php
require 'config.php';
session_start();

if (!isset($_SESSION['user']) || !is_array($_SESSION['user'])) {
    header('Location: index.php');
    exit;
}

$user = $_SESSION['user'];
$email = strtolower(trim((string)($user['email'] ?? '')));
$role = strtolower((string)($user['role'] ?? 'user'));

// Authoritative account-to-plant mapping. This is applied on every protected
// page so an old session, URL parameter, or browser storage value cannot send
// a plant user to another plant.
$emailPlantMap = [
    'bojaraj@scada.com' => 'vijayanth',
    'krishna@scada.com' => 'krishna',
    'vijayanth@scada.com' => 'vijayanth_cosmic',
];

if ($role !== 'admin') {
    $assignedPlant = $emailPlantMap[$email] ?? strtolower(trim((string)($user['plant_id'] ?? '')));

    if (!isset($PLANTS[$assignedPlant])) {
        // Never silently expose the default/first plant to an invalid plant user.
        session_unset();
        session_destroy();
        header('Location: index.php?expired=1');
        exit;
    }

    $currentPlant = $assignedPlant;

    // Repair stale session data immediately so every page and API call agrees.
    $_SESSION['user']['plant_id'] = $currentPlant;
    $_SESSION['plant_id'] = $currentPlant;
    $user = $_SESSION['user'];
} elseif (isset($_GET['plant']) && isset($PLANTS[$_GET['plant']])) {
    $currentPlant = $_GET['plant'];
} else {
    $currentPlant = getDefaultPlantId();
}

if (!isset($PLANTS[$currentPlant])) {
    $currentPlant = getDefaultPlantId();
}

if (basename($_SERVER['SCRIPT_NAME']) === 'admin.php' && $role !== 'admin') {
    header('Location: overview.php?plant=' . urlencode($currentPlant));
    exit;
}
?>