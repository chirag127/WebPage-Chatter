import tiktoken

def estimate_tokens(text: str) -> int:
    """
    Estimate the number of tokens in a text string.
    
    Args:
        text: The text to estimate tokens for.
        
    Returns:
        int: The estimated number of tokens.
    """
    try:
        # Use tiktoken to estimate token count
        # cl100k_base is a good general-purpose tokenizer
        encoding = tiktoken.get_encoding("cl100k_base")
        tokens = encoding.encode(text)
        return len(tokens)
    except Exception as e:
        # Fallback to a simple approximation if tiktoken fails
        # Gemini models use approximately 4 characters per token
        return len(text) // 4
