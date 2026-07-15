<?php
error_reporting(E_ALL);
ini_set('display_errors', 0);
require 'config.php';
header('Content-Type: application/json');
date_default_timezone_set('Asia/Kolkata');

$headers = getallheaders();
$auth = isset($headers['Authorization']) ? $headers['Authorization'] : (isset($headers['authorization']) ? $headers['authorization'] : '');
$userRole = ''; $userPlant = '';
if ($auth && preg_match('/Bearer\s+(\S+)/', $auth, $m)) {
    $token = $conn->real_escape_string($m[1]);
    $res = $conn->query("SELECT role, plant_id FROM users WHERE auth_token = '$token' LIMIT 1");
    if ($res && $res->num_rows > 0) { $u = $res->fetch_assoc(); $userRole = $u['role']; $userPlant = $u['plant_id']; }
}
if (empty($userRole)) {
    $urlToken = isset($_GET['token']) ? $conn->real_escape_string($_GET['token']) : '';
    if ($urlToken) {
        $res = $conn->query("SELECT role, plant_id FROM users WHERE auth_token = '$urlToken' LIMIT 1");
        if ($res && $res->num_rows > 0) { $u = $res->fetch_assoc(); $userRole = $u['role']; $userPlant = $u['plant_id']; }
    }
}

$tab = isset($_GET['tab']) ? $conn->real_escape_string($_GET['tab']) : 'inv_vcb';
$type = isset($_GET['type']) ? $conn->real_escape_string($_GET['type']) : 'daily';
$date = isset($_GET['date']) ? $conn->real_escape_string($_GET['date']) : date('Y-m-d');
$plant = isset($_GET['plant']) ? trim($conn->real_escape_string($_GET['plant'])) : '';

if ($userRole && $userRole !== 'admin') { if ($plant !== $userPlant) $plant = $userPlant; }
if (empty($plant)) $plant = 'vijayanth';

try {
class SimpleWSClient {
    private $socket;
    public function connect($host, $port) {
        $this->socket = @fsockopen($host, $port, $errno, $errstr, 3);
        if (!$this->socket) return false;
        stream_set_timeout($this->socket, 10);
        stream_set_blocking($this->socket, false);
        $key = base64_encode(random_bytes(16));
        $headers = "GET / HTTP/1.1\r\nHost: {$host}:{$port}\r\nUpgrade: websocket\r\nConnection: Upgrade\r\nSec-WebSocket-Key: $key\r\nSec-WebSocket-Version: 13\r\n\r\n";
        fwrite($this->socket, $headers);
        $response = ''; $start = time();
        while (time() - $start < 3) {
            $line = fgets($this->socket);
            if ($line === false) { usleep(10000); continue; }
            $response .= $line;
            if ($line === "\r\n") break;
        }
        return strpos($response, '101') !== false;
    }
    public function sendText($payload) {
        $len = strlen($payload); $frame = chr(0x81); $mask = random_bytes(4);
        if ($len <= 125) $frame .= chr(0x80 | $len);
        elseif ($len <= 65535) { $frame .= chr(0x80 | 126) . pack('n', $len); }
        else { $frame .= chr(0x80 | 127) . pack('NN', 0, $len); }
        $frame .= $mask;
        for ($i = 0; $i < $len; $i++) $frame .= $payload[$i] ^ $mask[$i % 4];
        fwrite($this->socket, $frame);
    }
    public function readFrame() {
        $data = $this->readExactly(2);
        if (!$data || strlen($data) < 2) return null;
        $byte1 = ord($data[0]); $byte2 = ord($data[1]);
        $opcode = $byte1 & 0x0F; $len = $byte2 & 0x7F;
        if ($len === 126) { $ext = $this->readExactly(2); if (!$ext) return null; $len = unpack('n', $ext)[1]; }
        elseif ($len === 127) { $ext = $this->readExactly(8); if (!$ext) return null; $u = unpack('N2', $ext); $len = ($u[1] << 32) | $u[2]; }
        $masked = ($byte2 >> 7) & 0x01;
        if ($masked) { $mask = $this->readExactly(4); if (!$mask) return null; }
        $payload = ''; if ($len > 0) { $payload = $this->readExactly($len); if (!$payload) return null; }
        if (!empty($mask)) for ($i = 0; $i < $len; $i++) $payload[$i] = $payload[$i] ^ $mask[$i % 4];
        if ($opcode === 0x08) return ['opcode' => 'close', 'payload' => $payload];
        if ($opcode === 0x09) { $this->sendPong($payload); return ['opcode' => 'ping', 'payload' => '']; }
        if ($opcode === 0x0A) return ['opcode' => 'pong', 'payload' => ''];
        return ['opcode' => 'text', 'payload' => $payload];
    }
    private function readExactly($n) {
        $buffer = ''; $start = time();
        while (strlen($buffer) < $n && time() - $start < 2) {
            $chunk = @fread($this->socket, $n - strlen($buffer));
            if ($chunk === false || $chunk === '') { if (feof($this->socket)) return null; usleep(1000); continue; }
            $buffer .= $chunk;
        }
        return strlen($buffer) === $n ? $buffer : null;
    }
    private function sendPong($payload) {
        $len = strlen($payload); $frame = chr(0x8A); $mask = random_bytes(4);
        if ($len <= 125) $frame .= chr(0x80 | $len) . $mask;
        else { $frame .= chr(0x80 | 126) . pack('n', $len) . $mask; }
        for ($i = 0; $i < $len; $i++) $frame .= $payload[$i] ^ $mask[$i % 4];
        fwrite($this->socket, $frame);
    }
    public function close() { if ($this->socket) { fclose($this->socket); $this->socket = null; } }
}

// Map plant IDs to unit IDs
$plantMap = [
    'vijayanth' => 'via-1mw',
    'krishna' => 'via-3mw'
];
$unitId = $plantMap[$plant] ?? 'via-1mw';

$response = [
    "success" => false,
    "error" => "WebSocket reports not yet implemented for Vijayanth - use live WebSocket connection in browser",
    "meta" => [
        "tab" => $tab,
        "type" => $type,
        "date" => $date,
        "plant" => $plant,
        "unit_id" => $unitId,
        "source" => "not_available",
        "message" => "This API is a placeholder. Reports for Vijayanth must be fetched via WebSocket in the browser."
    ],
    "data" => []
];

echo json_encode($response);

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        "success" => false,
        "error" => "Server error: " . $e->getMessage(),
        "data" => []
    ]);
}
?>
