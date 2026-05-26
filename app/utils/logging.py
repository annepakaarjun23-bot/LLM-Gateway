import logging
import json
import sys
from datetime import datetime, timezone

class JSONFormatter(logging.Formatter):
    """Custom formatter to output logs as JSON strings."""
    def format(self, record: logging.LogRecord) -> str:
        log_record = {
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "level": record.levelname,
            "logger": record.name,
            "message": record.getMessage(),
            "module": record.module,
            "funcName": record.funcName,
            "lineNo": record.lineno,
        }
        # Include request_id if it exists in the log record
        if hasattr(record, "request_id"):
            log_record["request_id"] = record.request_id
            
        # Include exception info if present
        if record.exc_info and record.exc_info[0] is not None:
            log_record["exception"] = self.formatException(record.exc_info)
            
        return json.dumps(log_record)

def setup_logging(log_level: str = "INFO"):
    """Configures the root logger to use the JSON formatter."""
    root_logger = logging.getLogger()
    root_logger.setLevel(log_level.upper())
    
    # Remove default handlers
    root_logger.handlers.clear()
    
    # Add stdout handler with JSON formatter
    handler = logging.StreamHandler(sys.stdout)
    handler.setFormatter(JSONFormatter())
    root_logger.addHandler(handler)
    
    # Quiet down noisy libraries
    logging.getLogger("uvicorn.access").setLevel("WARNING")
    logging.getLogger("httpx").setLevel("WARNING")
    logging.getLogger("httpcore").setLevel("WARNING")