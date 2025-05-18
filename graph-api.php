<?php
// --- Basic Config ---
$json_file = __DIR__ . '/graph-data.json';
$password = 'netflix'; // Change this to something secret

// --- Allow CORS for local dev, restrict in production ---
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

// --- Handle preflight OPTIONS request ---
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

// --- Password check for POST ---
function is_authorized($password) {
    $headers = getallheaders();
    if (isset($headers['Authorization'])) {
        return trim($headers['Authorization']) === 'Bearer ' . $password;
    }
    // Also check POST param as fallback
    if (isset($_POST['password'])) {
        return $_POST['password'] === $password;
    }
    return false;
}

// --- Handle GET: Read JSON file ---
if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    if (!file_exists($json_file)) {
        http_response_code(404);
        echo json_encode(['error' => 'File not found']);
        exit();
    }
    $fp = fopen($json_file, 'r');
    if (flock($fp, LOCK_SH)) { // Shared lock
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

// --- Handle POST: Write JSON file ---
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    if (!is_authorized($password)) {
        http_response_code(401);
        echo json_encode(['error' => 'Unauthorized']);
        exit();
    }

    // Read raw POST body
    $raw = file_get_contents('php://input');
    $data = json_decode($raw, true);
    if ($data === null) {
        http_response_code(400);
        echo json_encode(['error' => 'Invalid JSON']);
        exit();
    }

    $fp = fopen($json_file, 'c+');
    if (flock($fp, LOCK_EX)) { // Exclusive lock
        ftruncate($fp, 0); // Clear file
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

// --- Fallback for unsupported methods ---
http_response_code(405);
echo json_encode(['error' => 'Method not allowed']);
exit();
?>