import logging

from pydantic import SecretStr

from app.core.settings.app import AppSettings
from app.core.settings.development import DevAppSettings
from app.core.settings.production import ProdAppSettings


def test_dev_app_settings_defaults() -> None:
    s = DevAppSettings(
        database_url="postgresql://postgres@localhost:5432/x",
        secret_key=SecretStr("secret"),
    )
    assert s.debug is True
    assert "Dev" in s.title
    assert s.logging_level == logging.DEBUG


def test_prod_app_settings_config_env_file() -> None:
    assert ProdAppSettings.Config.env_file == "prod.env"


def test_app_settings_configure_logging_runs() -> None:
    s = AppSettings(
        database_url="postgresql://postgres@localhost:5432/x",
        secret_key=SecretStr("secret"),
    )
    s.configure_logging()
