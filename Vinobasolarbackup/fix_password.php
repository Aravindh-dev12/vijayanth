<?php
require 'config.php';
$hash = password_hash('admin', PASSWORD_DEFAULT);
$conn->query("UPDATE users SET password = '$hash' WHERE email = 'admin@scada.com'");
echo $hash;
?>
