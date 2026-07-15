<?php
require 'config.php';
session_start();
if (!isset($_SESSION['user']) && basename($_SERVER['SCRIPT_NAME']) === 'admin.php') {
    header('Location: index.php');
    exit;
}
$user = $_SESSION['user'] ?? [
    'email' => '',
    'role' => 'viewer',
    'plant_id' => ''
];


if (isset($_GET['plant']) && !empty($_GET['plant']) && isset($PLANTS[$_GET['plant']])) {
    $currentPlant = $_GET['plant'];
} elseif ($user['role'] !== 'admin' && !empty($user['plant_id']) && isset($PLANTS[$user['plant_id']])) {
    $currentPlant = $user['plant_id']; // non-admin user → their own plant
} else {
    $currentPlant = getDefaultPlantId(); // admin / fallback
}

// Validate the plant exists in config (safety)
if (!isset($PLANTS[$currentPlant])) {
    $currentPlant = getDefaultPlantId();
}

if (basename($_SERVER['SCRIPT_NAME']) === 'admin.php' && $user['role'] !== 'admin' && !empty($user['plant_id']) && $currentPlant !== $user['plant_id']) {
    header('Location: overview.php?plant=' . urlencode($user['plant_id']));
    exit;
}
?>
