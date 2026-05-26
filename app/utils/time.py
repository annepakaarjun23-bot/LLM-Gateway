import time

class Timer:
    def __init__(self):
        self.elapsed_ms = 0.0
    
    def __enter__(self):
        self.start = time.monotonic()
        return self
    
    def __exit__(self, *args):
        self.elapsed_ms = (time.monotonic() - self.start) * 1000

# Usage in async code:
timer = Timer()
timer.__enter__()
# ... do work ...
timer.__exit__()
latency = int(timer.elapsed_ms)