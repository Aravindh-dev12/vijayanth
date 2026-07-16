<?php
require 'config.php';
session_start();
if (!isset($_SESSION['user']) || !is_array($_SESSION['user'])) {
    header('Location: index.php');
    exit;
}
$user = $_SESSION['user'];

// Plant users are always locked to their assigned plant. Only administrators
// may select a different configured plant through the URL.
if (($user['role'] ?? 'user') !== 'admin') {
    $assignedPlant = strtolower((string)($user['plant_id'] ?? ''));
    $currentPlant = isset($PLANTS[$assignedPlant]) ? $assignedPlant : getDefaultPlantId();
} elseif (isset($_GET['plant']) && isset($PLANTS[$_GET['plant']])) {
    $currentPlant = $_GET['plant'];
} else {
    $currentPlant = getDefaultPlantId();
}

// Validate the plant exists in config (safety)
if (!isset($PLANTS[$currentPlant])) {
    $currentPlant = getDefaultPlantId();
}

if (basename($_SERVER['SCRIPT_NAME']) === 'admin.php' && ($user['role'] ?? '') !== 'admin') {
    header('Location: overview.php?plant=' . urlencode($user['plant_id']));
    exit;
}
?>
