## 2026-06-01 - [CRITICAL] Default Auth Secret Key Allowed in Production
**Vulnerability:** A hardcoded default `auth_secret_key` ("dev-auth-secret-key") was allowed in the `Settings` class, posing a significant risk if deployed to production without overriding.
**Learning:** Relying solely on environment variable overrides without explicit production environment validation is insufficient. Pydantic settings with defaults can fail silently in production if the environment variable is missing.
**Prevention:** Remove hardcoded defaults for sensitive keys. Utilize Pydantic `model_validator` to explicitly enforce security constraints based on the active environment (e.g., minimum length, rejection of legacy test values).
