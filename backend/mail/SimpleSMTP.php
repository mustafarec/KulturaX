<?php

class SimpleSMTP {
    private $host;
    private $port;
    private $username;
    private $password;
    private $timeout = 30;
    private $debug = false;

    public function __construct($host, $port, $username, $password) {
        $this->host = $host;
        $this->port = $port;
        $this->username = $username;
        $this->password = $password;
    }

    public function send($to, $subject, $body, $fromName = 'App') {
        $socket = fsockopen($this->host, $this->port, $errno, $errstr, $this->timeout);
        if (!$socket) {
            throw new Exception("Could not connect to SMTP host: $errstr ($errno)");
        }

        $this->read($socket); // Banner

        $this->cmd($socket, "EHLO " . gethostname());
        
        // STARTTLS if port is 587
        if ($this->port == 587) {
            $this->cmd($socket, "STARTTLS");
            stream_socket_enable_crypto($socket, true, STREAM_CRYPTO_METHOD_TLS_CLIENT);
            $this->cmd($socket, "EHLO " . gethostname());
        }

        $this->cmd($socket, "AUTH LOGIN");
        $this->cmd($socket, base64_encode($this->username));
        $this->cmd($socket, base64_encode($this->password));

        $this->cmd($socket, "MAIL FROM: <" . $this->username . ">");
        $this->cmd($socket, "RCPT TO: <$to>");
        $this->cmd($socket, "DATA");

        $headers = "MIME-Version: 1.0\r\n";
        $headers .= "Content-Type: text/plain; charset=UTF-8\r\n";
        $headers .= "From: $fromName <" . $this->username . ">\r\n";
        $headers .= "To: $to\r\n";
        $headers .= "Subject: $subject\r\n";

        $this->cmd($socket, "$headers\r\n$body\r\n.");
        $this->cmd($socket, "QUIT");

        fclose($socket);
        return true;
    }

    private function cmd($socket, $command) {
        if ($this->debug) {
            error_log("SMTP > $command");
        }
        fwrite($socket, $command . "\r\n");
        $response = $this->read($socket);
        // Check for error codes (4xx or 5xx)
        if (substr($response, 0, 1) == '4' || substr($response, 0, 1) == '5') {
            throw new Exception("SMTP Error: $response");
        }
        return $response;
    }

    private function read($socket) {
        $response = '';
        while ($str = fgets($socket, 515)) {
            $response .= $str;
            if (substr($str, 3, 1) == ' ') {
                break;
            }
        }
        if ($this->debug) {
            error_log("SMTP < $response");
        }
        return $response;
    }
}
