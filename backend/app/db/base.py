from sqlalchemy.orm import DeclarativeBase


class Base(DeclarativeBase):
    """Declarative base class for all Repolens database models.

    Future models (repositories, analyses, findings, users) will inherit from this base.
    """
    pass
