pub struct TokenBucket {
    pub capacity: u64,
    pub refill_rate_per_sec: u64,
    pub current_tokens: u64,
}

pub trait RateLimiter {
    fn try_acquire(&mut self, tokens: u64) -> bool;
    fn get_available(&self) -> u64;
}

impl RateLimiter for TokenBucket {
    fn try_acquire(&mut self, tokens: u64) -> bool {
        if self.current_tokens >= tokens {
            self.current_tokens -= tokens;
            true
        } else {
            false
        }
    }

    fn get_available(&self) -> u64 {
        self.current_tokens
    }
}
