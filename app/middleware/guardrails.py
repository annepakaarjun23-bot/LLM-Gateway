import re
from app.middleware.context import PipelineContext
from app.exceptions.guardrail import GuardrailBlockedError
from config.settings import settings

INJECTION_PATTERNS = [
    re.compile(r"ignore\s+(all\s+)?(previous|prior)\s+instructions", re.IGNORECASE),
    re.compile(r"ignore\s+(your|the)\s+(system|developer)\s+(prompt|instructions|message)", re.IGNORECASE),
    re.compile(r"DAN|Do Anything Now|jailbreak|dev mode|root access", re.IGNORECASE),
]
BACKTICK_PATTERN = re.compile(r"`{11,}")
DELIMITER_PATTERN = re.compile(r"^[-#<>]{3,}\s*$", re.MULTILINE)
EMBEDDED_ROLE_PATTERN = re.compile(r'"role"\s*:\s*"system"')
REPETITION_PATTERN = re.compile(r"(.)\1{20,}")
BASE64_PATTERN = re.compile(r"[A-Za-z0-9+/]{100,}={0,2}")

def _validate_schema_and_sanity(payload: dict) -> str | None:
    """Layer 1: Schema & Sanity Checks"""
    messages = payload.get("messages", [])
    if not messages:
        return "Messages array is empty"
    if len(messages) > settings.MAX_MESSAGES:
        return f"Messages array exceeds limit ({settings.MAX_MESSAGES})"
    
    temperature = payload.get("temperature")
    if temperature is not None and (temperature < 0.0 or temperature > 2.0):
        return f"Temperature out of bounds [0.0, 2.0]: {temperature}"
        
    max_tokens = payload.get("max_tokens")
    if max_tokens is not None and max_tokens > settings.MAX_MAX_TOKENS:
        return f"max_tokens exceeds limit ({settings.MAX_MAX_TOKENS})"
        
    return None

def _detect_prompt_injection(payload: dict) -> str | None:
    """Layer 2: Prompt Injection Heuristics"""
    for message in payload.get("messages", []):
        content = message.get("content", "")
        if not content:
            continue
            
        for pattern in INJECTION_PATTERNS:
            if pattern.search(content):
                return f"Potential prompt injection detected: matched injection pattern"
        if BACKTICK_PATTERN.search(content):
            return "Excessive consecutive backticks detected"
        if DELIMITER_PATTERN.search(content):
            return "Suspicious delimiter usage detected"
        if EMBEDDED_ROLE_PATTERN.search(content):
            return "Embedded system role detected in user content"
        if REPETITION_PATTERN.search(content):
            return "Excessive character repetition detected"
        if BASE64_PATTERN.search(content) and "```" not in content:  # Allow base64 in code blocks
            return "Large Base64-like string detected outside code block"
            
    return None

def _check_content_size(payload: dict) -> str | None:
    """Layer 3: Content Size Guard"""
    for message in payload.get("messages", []):
        content = message.get("content", "")
        if len(content) > settings.MAX_SINGLE_MESSAGE_CHARS:
            return f"Single message exceeds size limit ({settings.MAX_SINGLE_MESSAGE_CHARS} chars)"
    return None

def run_all_guardrails(payload: dict, ctx: PipelineContext):
    """
    Orchestrator for Stage 4: Input Guardrails.
    Runs all 3 layers in order.
    """
    # Layer 1
    reason = _validate_schema_and_sanity(payload)
    if reason:
        ctx.guardrail_blocked = True
        ctx.guardrail_reason = reason
        raise GuardrailBlockedError(detail=reason)
    
    # Layer 2
    reason = _detect_prompt_injection(payload)
    if reason:
        ctx.guardrail_blocked = True
        ctx.guardrail_reason = reason
        raise GuardrailBlockedError(detail=reason)
        
    # Layer 3
    reason = _check_content_size(payload)
    if reason:
        ctx.guardrail_blocked = True
        ctx.guardrail_reason = reason
        raise GuardrailBlockedError(detail=reason)