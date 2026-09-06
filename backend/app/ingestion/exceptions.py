class IngestionError(Exception):
    """Base class for ingestion errors."""
    pass

class SecurityError(IngestionError):
    """Raised when an ingestion attempt violates security rules (e.g. Zip Slip, executing binaries)."""
    pass

class ResourceLimitError(IngestionError):
    """Raised when an ingestion attempt exceeds configured resource limits."""
    pass
