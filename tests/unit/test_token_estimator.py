import pytest
from app.middleware.token_estimator import estimate_tokens
from app.middleware.pipeline import PipelineContext
from app.exceptions.guardrail import ContextExceededError

def test_estimate_tokens_basic():
    ctx = PipelineContext()
    messages = [{"role": "user", "content": "Hello world"}]
    
    estimate_tokens(messages, "llama-3.3-70b", None, ctx)
    
    assert ctx.input_tokens > 0
    assert ctx.estimated_output_tokens >= 1  
    assert ctx.estimated_total_tokens == ctx.input_tokens + ctx.estimated_output_tokens

def test_estimate_tokens_context_exceeded():
    ctx = PipelineContext()
    messages = [{"role": "user", "content": "word " * 100000}] 
    
    with pytest.raises(ContextExceededError):
        estimate_tokens(messages, "mixtral-8x7b", None, ctx)