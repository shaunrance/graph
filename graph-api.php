<?php
file_put_contents(__DIR__.'/auth-debug.log', print_r(getallheaders(), true) . "\n" . print_r($_SERVER, true) . "\n", FILE_APPEND);
// --- Basic Config ---
$json_file = __DIR__ . '/graph-data.json';
$password = 'netflix'; // must match frontend

header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

// Robust Authorization check
function is_authorized($password) {
    if (function_exists('getallheaders')) {
        $headers = getallheaders();
    } else {
        $headers = [];
        foreach ($_SERVER as $name => $value) {
            if (substr($name, 0, 5) == 'HTTP_') {
                $key = str_replace(' ', '-', ucwords(strtolower(str_replace('_', ' ', substr($name, 5)))));
                $headers[$key] = $value;
            }
        }
    }

    $auth = '';
    foreach ($headers as $key => $val) {
        if (strtolower($key) === 'authorization') {
            $auth = $val;
            break;
        }
    }
    if (!$auth && isset($_SERVER['HTTP_AUTHORIZATION'])) {
        $auth = $_SERVER['HTTP_AUTHORIZATION'];
    }
    if (!$auth && isset($_SERVER['REDIRECT_HTTP_AUTHORIZATION'])) {
        $auth = $_SERVER['REDIRECT_HTTP_AUTHORIZATION'];
    }
    if ($auth) {
        $auth = trim($auth);
        return $auth === 'Bearer ' . $password;
    }
    if (isset($_POST['password'])) {
        return $_POST['password'] === $password;
    }
    return false;
}

// GET
if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    if (!file_exists($json_file)) {
        http_response_code(404);
        echo json_encode(['error' => 'File not found']);
        exit();
    }
    $fp = fopen($json_file, 'r');
    if (flock($fp, LOCK_SH)) {
        $contents = stream_get_contents($fp);
        flock($fp, LOCK_UN);
        fclose($fp);
        header('Content-Type: application/json');
        echo $contents;
        exit();
    } else {
        fclose($fp);
        http_response_code(500);
        echo json_encode(['error' => 'Could not lock file for reading']);
        exit();
    }
}

// POST
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    if (!is_authorized($password)) {
        http_response_code(401);
        echo json_encode(['error' => 'Unauthorized']);
        exit();
    }
    $raw = file_get_contents('php://input');
    $data = json_decode($raw, true);
    if ($data === null) {
        http_response_code(400);
        echo json_encode(['error' => 'Invalid JSON']);
        exit();
    }
    $fp = fopen($json_file, 'c+');
    if (flock($fp, LOCK_EX)) {
        ftruncate($fp, 0);
        fwrite($fp, json_encode($data, JSON_PRETTY_PRINT));
        fflush($fp);
        flock($fp, LOCK_UN);
        fclose($fp);
        echo json_encode(['status' => 'success']);
        exit();
    } else {
        fclose($fp);
        http_response_code(500);
        echo json_encode(['error' => 'Could not lock file for writing']);
        exit();
    }
}

http_response_code(405);
echo json_encode(['error' => 'Method not allowed']);
exit();
?>