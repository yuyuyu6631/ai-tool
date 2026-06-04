## 2024-06-05 - Remove hardcoded auth secret key
**Vulnerability:** The application had a hardcoded default `auth_secret_key` ("dev-auth-secret-key"), which could be exploited in production if the environment variable wasn't explicitly set.
**Learning:** Hardcoded default secrets create a false sense of security and often leak into production environments.
**Prevention:** Make security keys strictly required fields without defaults in Pydantic Settings, and use `@model_validator` to enforce minimum length and reject known legacy/test keys in production environments.
