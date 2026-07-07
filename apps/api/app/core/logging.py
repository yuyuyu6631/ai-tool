import logging

from app.core.config import settings

_LOG_FORMAT = "%(asctime)s %(levelname)s [%(name)s] %(message)s"


def setup_logging() -> None:
    level = getattr(logging, settings.log_level, logging.INFO)
    root_logger = logging.getLogger()

    if root_logger.handlers:
        root_logger.setLevel(level)
        return

    logging.basicConfig(level=level, format=_LOG_FORMAT)
    logging.getLogger("sqlalchemy.engine").setLevel(logging.WARNING)
