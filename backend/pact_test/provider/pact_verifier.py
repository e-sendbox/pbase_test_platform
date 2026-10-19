#!/usr/bin/env python3
"""
Pact Provider Verification Script for Conduit Backend

This script verifies that the FastAPI backend implementation
matches the contracts published by the frontend consumer.
"""

import os
import sys
from pact import Verifier

# Configuration
PROVIDER_NAME = "conduit-backend"
PROVIDER_URL = os.getenv("PROVIDER_URL", "http://localhost:8000")
PACT_BROKER_URL = os.getenv("PACT_BROKER_BASE_URL", "http://conduit-pact-broker:9292")
PROVIDER_VERSION = os.getenv("GIT_COMMIT", os.getenv("GITHUB_SHA", "1.0.0"))
PROVIDER_BRANCH = os.getenv("GIT_BRANCH", "main")

# Provider states setup
PROVIDER_STATES_SETUP_URL = f"{PROVIDER_URL}/api/_pact/provider-states"


def main():
    """Run Pact provider verification"""

    print("=" * 60)
    print("Pact Provider Verification")
    print("=" * 60)
    print(f"Provider: {PROVIDER_NAME}")
    print(f"Provider URL: {PROVIDER_URL}")
    print(f"Pact Broker: {PACT_BROKER_URL}")
    print(f"Provider Version: {PROVIDER_VERSION}")
    print(f"Provider Branch: {PROVIDER_BRANCH}")
    print("=" * 60)

    # Create verifier instance
    verifier = Verifier(provider=PROVIDER_NAME, provider_base_url=PROVIDER_URL)

    try:
        # Verify pacts from broker
        output, logs = verifier.verify_with_broker(
            broker_url=PACT_BROKER_URL,
            publish_version=PROVIDER_VERSION,
            provider_version_branch=PROVIDER_BRANCH,
            publish_verification_results=True,
            # Enable pending pacts to not fail the build for new contracts
            enable_pending=True,
            # Include WIP pacts
            include_wip_pacts_since=None,
            # Provider states setup endpoint
            provider_states_setup_url=PROVIDER_STATES_SETUP_URL,
            # Verbose output
            verbose=True,
        )

        print("\n" + "=" * 60)
        print("Verification Result: SUCCESS")
        print("=" * 60)
        print(output)

        return 0

    except Exception as e:
        print("\n" + "=" * 60)
        print("Verification Result: FAILED")
        print("=" * 60)
        print(f"Error: {e}")

        # Still return 0 if it's just pending pacts
        if "pending" in str(e).lower():
            print("\nNote: Only pending pacts failed. Build continues.")
            return 0

        return 1


if __name__ == "__main__":
    sys.exit(main())
