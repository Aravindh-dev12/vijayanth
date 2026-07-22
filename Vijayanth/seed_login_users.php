<?php
// CLI-only helper to create/update dashboard login users.
// Usage: php seed_login_users.php "your-password"

if (PHP_SAPI !== 'cli') {
    http_response_code(403);
    echo "This script can only be run from the command line.\n";
    exit(1);
}

require __DIR__ . '/config.php';

$password = $argv[1] ?? '';
if ($password === '') {
    echo "Usage: php seed_login_users.php \"your-password\"\n";
    exit(1);
}

$accounts = [
    [
        'email' => 'admin@vijayanth.com',
        'role' => 'admin',
        'plant_id' => getDefaultPlantId(),
        'db_plant' => getDefaultPlantId(),
    ],
    [
        'email' => 'admin@scada.com',
        'role' => 'admin',
        'plant_id' => getDefaultPlantId(),
        'db_plant' => getDefaultPlantId(),
    ],
    [
        'email' => 'bojaraj@scada.com',
        'role' => 'user',
        'plant_id' => 'vijayanth',
        'db_plant' => 'vijayanth',
    ],
    [
        'email' => 'krishna@scada.com',
        'role' => 'user',
        'plant_id' => 'krishna',
        'db_plant' => 'krishna',
    ],
    [
        'email' => 'vijayanth@scada.com',
        'role' => 'user',
        'plant_id' => 'vijayanth_cosmic',
        'db_plant' => 'vijayanth_cosmic',
    ],
];

$hash = password_hash($password, PASSWORD_DEFAULT);
$done = 0;

foreach ($accounts as $account) {
    if (!isset($PLANTS[$account['db_plant']])) {
        echo "SKIP {$account['email']}: plant {$account['db_plant']} is not configured.\n";
        continue;
    }

    $conn = getPlantDbConn($account['db_plant']);
    if (!$conn) {
        echo "SKIP {$account['email']}: database connection failed for {$account['db_plant']}.\n";
        continue;
    }

    $email = $conn->real_escape_string(strtolower($account['email']));
    $role = $conn->real_escape_string($account['role']);
    $plantId = $conn->real_escape_string($account['plant_id']);
    $safeHash = $conn->real_escape_string($hash);

    $res = $conn->query("SELECT id FROM users WHERE LOWER(email)='$email' LIMIT 1");
    if ($res && $res->num_rows > 0) {
        $row = $res->fetch_assoc();
        $id = (int)$row['id'];
        $ok = $conn->query("UPDATE users SET password='$safeHash', role='$role', plant_id='$plantId' WHERE id=$id");
        echo ($ok ? "UPDATED" : "FAILED") . " {$account['email']} -> {$account['plant_id']} ({$account['role']})\n";
    } else {
        $ok = $conn->query("INSERT INTO users (email, password, role, plant_id) VALUES ('$email', '$safeHash', '$role', '$plantId')");
        echo ($ok ? "CREATED" : "FAILED") . " {$account['email']} -> {$account['plant_id']} ({$account['role']})\n";
    }

    if (!$ok) {
        echo "  DB error: {$conn->error}\n";
    } else {
        $done++;
    }

    $conn->close();
}

echo "Done. {$done} account(s) created or updated.\n";
