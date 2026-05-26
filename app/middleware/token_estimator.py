import tiktoken
from app.middleware.context import PipelineContext
from app.exceptions.guardrail import ContextExceededError
from config.providers import CONTEXT_WINDOWS

encoding = tiktoken.get_encoding("cl100k_base")

def estimate_tokens(messages: list[dict], model: str, max_tokens: int | None, ctx: PipelineContext):

    input_tokens = 0
    for message in messages:
        content = message.get("content", "")
        if content:
            input_tokens += len(encoding.encode(content))
            
    if max_tokens is not None:
        estimated_output = min(max_tokens, int(input_tokens * 0.5))
    else:
        estimated_output = int(input_tokens * 0.2) 

    estimated_output = max(1, estimated_output)
    estimated_total = input_tokens + estimated_output
    
    context_window = CONTEXT_WINDOWS.get(model)
    if context_window and estimated_total > context_window:
        raise ContextExceededError(
            detail=f"Estimated tokens ({estimated_total}) exceed model context window ({context_window})"
        )
        
    ctx.input_tokens = input_tokens
    ctx.estimated_output_tokens = estimated_output
    ctx.estimated_total_tokens = estimated_total