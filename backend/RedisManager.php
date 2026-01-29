<?php
/**
 * Redis Manager
 * Singleton wrapper for Redis connection with fault tolerance.
 */

class RedisManager
{
    private static $instance = null;
    private $redis = null;
    private $isConnected = false;

    private function __construct()
    {
        if (!class_exists('Redis')) {
            // Redis extension not installed
            return;
        }

        try {
            $this->redis = new Redis();
            // Default config from constants (defined in config.php)
            $host = defined('REDIS_HOST') ? REDIS_HOST : '127.0.0.1';
            $port = defined('REDIS_PORT') ? REDIS_PORT : 6379;
            $password = defined('REDIS_PASSWORD') ? REDIS_PASSWORD : null;
            $timeout = 2.0;

            // Connect with timeout
            if (@$this->redis->connect($host, $port, $timeout)) {
                if ($password) {
                    if (!$this->redis->auth($password)) {
                        error_log("Redis Auth Failed");
                        $this->isConnected = false;
                        return;
                    }
                }
                $this->isConnected = true;
                // Set prefix
                $this->redis->setOption(Redis::OPT_PREFIX, 'kulturax:');
                // Use built-in serializer for arrays
                $this->redis->setOption(Redis::OPT_SERIALIZER, Redis::SERIALIZER_PHP);
            } else {
                error_log("Redis Connection Failed to $host:$port");
            }
        } catch (Exception $e) {
            error_log("Redis Exception: " . $e->getMessage());
            $this->isConnected = false;
        }
    }

    public static function getInstance()
    {
        if (self::$instance === null) {
            self::$instance = new self();
        }
        return self::$instance;
    }

    /**
     * Check if Redis is ready to use
     * @return bool
     */
    public static function isReady()
    {
        return self::getInstance()->isConnected;
    }

    /**
     * Get the raw Redis instance
     * @return Redis|null
     */
    public static function getClient()
    {
        return self::getInstance()->redis;
    }
}
?>
