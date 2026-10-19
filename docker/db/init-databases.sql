-- Create separate databases for each service
-- This script runs automatically when PostgreSQL container initializes

-- Database for the Conduit application
CREATE DATABASE conduit_db;
COMMENT ON DATABASE conduit_db IS 'RealWorld Conduit application database';

-- Database for Gitea
CREATE DATABASE gitea_db;
COMMENT ON DATABASE gitea_db IS 'Gitea git repository and CI/CD database';

-- Database for Pact Broker
CREATE DATABASE pactbroker_db;
COMMENT ON DATABASE pactbroker_db IS 'Pact contract testing broker database';

-- Isolated DB for pytest in CI (Pact/provider verification use conduit_db)
CREATE DATABASE conduit_test_db;
COMMENT ON DATABASE conduit_test_db IS 'Pytest only; keeps pact fixture data out of conduit_db';

-- Grant all privileges (using trust auth method, so this is informational)
GRANT ALL PRIVILEGES ON DATABASE conduit_db TO postgres;
GRANT ALL PRIVILEGES ON DATABASE gitea_db TO postgres;
GRANT ALL PRIVILEGES ON DATABASE pactbroker_db TO postgres;
GRANT ALL PRIVILEGES ON DATABASE conduit_test_db TO postgres;
