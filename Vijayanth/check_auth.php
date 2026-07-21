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
        session_unset();
        session_destroy();
        header('Location: index.php?expired=1');
        exit;
    }

    $currentPlant = $assignedPlant;
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

// Inject the authoritative signed-in plant context into every protected HTML
// page. This avoids relying on sidebar script execution or stale browser data.
$signedPlantIdJson = json_encode($currentPlant, JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE);
$signedRoleJson = json_encode($role, JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE);
$signedConfigJson = getPlantPublicConfigJson();

ob_start(function ($html) use ($signedPlantIdJson, $signedRoleJson, $signedConfigJson) {
    if (stripos($html, '</body>') === false) return $html;

    $injection = "\n<script>window.SIGNED_PLANT_ID={$signedPlantIdJson};window.SIGNED_USER_ROLE={$signedRoleJson};window.SIGNED_PLANT_CONFIG={$signedConfigJson};</script>"
        . "\n<script src=\"assets/inverter3_fix.js?v=20260721-3\"></script>"
        . "\n<script src=\"assets/signed_plant_context.js?v=20260721-1\"></script>\n";

    return preg_replace('/<\/body>/i', $injection . '</body>', $html, 1);
});
?>
