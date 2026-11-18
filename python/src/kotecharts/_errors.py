"""Typed errors raised by the Kote Charts client."""

from __future__ import annotations

from typing import Optional


class KoteChartsError(Exception):
    """Base class for every error raised by this package.

    ``retry_after`` is the server's ``Retry-After`` hint in seconds when it sent one
    (429 and 503 responses), otherwise ``None``.
    """

    def __init__(
        self,
        message: str,
        *,
        status: Optional[int] = None,
        code: Optional[str] = None,
        request_id: Optional[str] = None,
        retry_after: Optional[float] = None,
    ) -> None:
        super().__init__(message)
        self.message = message
        self.status = status
        self.code = code
        self.request_id = request_id
        self.retry_after = retry_after

    def __repr__(self) -> str:  # pragma: no cover - cosmetic
        return f"{type(self).__name__}(status={self.status!r}, code={self.code!r}, message={self.message!r})"


class APIConnectionError(KoteChartsError):
    """The API could not be reached (DNS, TLS, timeout, connection reset)."""


class BadRequestError(KoteChartsError):
    """400 — invalid query (date format, granularity, unsupported filter)."""


class AuthenticationError(KoteChartsError):
    """401 — missing or invalid API key. Create a key at https://kotecharts.com/account."""


class PermissionDeniedError(KoteChartsError):
    """403 — the caller is blocked or the chart is not public."""


class NotFoundError(KoteChartsError):
    """404 — unknown chart id, or the chart has not been generated yet."""


class RateLimitError(KoteChartsError):
    """429 — rate limit exceeded (3 requests/second per key). ``retry_after`` is in seconds."""


class ServiceUnavailableError(KoteChartsError):
    """503 — temporarily unavailable or busy; retry after ``retry_after`` seconds when it is set."""


_BY_STATUS = {
    400: BadRequestError,
    401: AuthenticationError,
    403: PermissionDeniedError,
    404: NotFoundError,
    429: RateLimitError,
    503: ServiceUnavailableError,
}


def error_for_status(status: int) -> type:
    return _BY_STATUS.get(status, KoteChartsError)
