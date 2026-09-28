from fastapi.responses import JSONResponse
from slowapi import Limiter
from slowapi.errors import RateLimitExceeded
from slowapi.middleware import SlowAPIMiddleware
from slowapi.util import get_remote_address

# One registry/storage for middleware and every decorated route. The default
# memory storage is per process; multi-worker deployments need shared storage.
limiter = Limiter(key_func=get_remote_address, default_limits=["200/minute"])


def rate_limit_error(request, exc):
    return JSONResponse(
        status_code=429,
        content={"detail": f"Too many requests. Limit: {exc.detail}. Please try again shortly."},
        headers={"Retry-After": "60"},
    )


def install_rate_limiting(app):
    app.state.limiter = limiter
    app.add_exception_handler(RateLimitExceeded, rate_limit_error)
    app.add_middleware(SlowAPIMiddleware)
