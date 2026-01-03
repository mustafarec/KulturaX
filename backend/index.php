<?php
// KulturaX API Landing Page
// This file prevents directory listing and provides a basic status check.
header('Content-Type: text/html; charset=utf-8');
?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>KulturaX API</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
            background-color: #0d0d0d;
            color: #ffffff;
            display: flex;
            justify-content: center;
            align-items: center;
            height: 100vh;
            margin: 0;
            text-align: center;
        }
        .container {
            padding: 2rem;
            background: #1a1a1a;
            border-radius: 12px;
            box-shadow: 0 4px 20px rgba(0,0,0,0.5);
        }
        .status {
            color: #4caf50;
            font-weight: bold;
            font-size: 1.2rem;
            margin-top: 1rem;
        }
        .version {
            color: #888;
            margin-top: 0.5rem;
            font-size: 0.9rem;
        }
    </style>
</head>
<body>
    <div class="container">
        <h1>KulturaX API</h1>
        <div class="status">● System Operational</div>
        <div class="version">v1.2.0 (Stable)</div>
        <p style="color: #666; margin-top: 2rem; font-size: 0.8rem;">Access Restricted</p>
    </div>
</body>
</html>
