#!/usr/bin/env python3
"""
Database Seed Script for Conduit Application

Creates sample users and articles for demonstration purposes.
"""

import asyncio
import asyncpg
import os
import secrets
from passlib.context import CryptContext
from datetime import datetime

# Password hashing
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# Database connection
DATABASE_URL = os.getenv(
    "DATABASE_URL", "postgresql://postgres@localhost:5432/conduit_db"
)

SAMPLE_DATA = {
    "users": [
        {
            "username": "demo",
            "email": "demo@example.com",
            "password": "password123",
            "bio": "Demo user for testing",
            "image": None,
        },
        {
            "username": "alice",
            "email": "alice@example.com",
            "password": "password123",
            "bio": "Software engineer interested in Python and FastAPI",
            "image": None,
        },
        {
            "username": "bob",
            "email": "bob@example.com",
            "password": "password123",
            "bio": "Full-stack developer",
            "image": None,
        },
    ],
    "articles": [
        {
            "author": "demo",
            "title": "Introduction to FastAPI",
            "description": "Learn the basics of FastAPI framework",
            "body": "FastAPI is a modern, fast web framework for building APIs with Python 3.7+ based on standard Python type hints. It's incredibly fast (on par with NodeJS and Go) and easy to use.",
            "tags": ["python", "fastapi", "api"],
        },
        {
            "author": "alice",
            "title": "Getting Started with React",
            "description": "A beginner's guide to React development",
            "body": "React is a JavaScript library for building user interfaces. It lets you compose complex UIs from small and isolated pieces of code called components.",
            "tags": ["react", "javascript", "frontend"],
        },
        {
            "author": "bob",
            "title": "Docker Best Practices",
            "description": "Tips for efficient Docker usage",
            "body": "Docker is a platform for developers to develop, ship, and run applications in containers. Here are some best practices to follow when working with Docker.",
            "tags": ["docker", "devops", "containers"],
        },
        {
            "author": "demo",
            "title": "Contract Testing with Pact",
            "description": "Understanding consumer-driven contract testing",
            "body": "Pact is a consumer-driven contract testing tool. It ensures that services can communicate with each other by verifying the interactions between consumer and provider.",
            "tags": ["testing", "pact", "microservices"],
        },
    ],
}


async def seed_database():
    """Seed the database with sample data"""

    print("=" * 60)
    print("Conduit Database Seeding")
    print("=" * 60)
    print(f"Database: {DATABASE_URL}")
    print()

    # Connect to database
    conn = await asyncpg.connect(DATABASE_URL)

    try:
        # Check if data already exists
        user_count = await conn.fetchval("SELECT COUNT(*) FROM users")
        if user_count > 0:
            print(f"Database already contains {user_count} users. Skipping seed.")
            return

        print("Creating sample users...")
        user_ids = {}

        for user_data in SAMPLE_DATA["users"]:
            hashed_password = pwd_context.hash(user_data["password"])
            # Generate salt (bcrypt includes salt in hash, but schema requires separate field)
            salt = secrets.token_hex(16)

            user_id = await conn.fetchval(
                """
                INSERT INTO users (username, email, salt, hashed_password, bio, image, created_at, updated_at)
                VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
                RETURNING id
                """,
                user_data["username"],
                user_data["email"],
                salt,
                hashed_password,
                user_data["bio"],
                user_data["image"],
                datetime.utcnow(),
                datetime.utcnow(),
            )

            user_ids[user_data["username"]] = user_id
            print(f"  ✓ Created user: {user_data['username']}")

        print()
        print("Creating sample articles...")

        for article_data in SAMPLE_DATA["articles"]:
            author_id = user_ids[article_data["author"]]
            slug = article_data["title"].lower().replace(" ", "-")

            # Insert article
            article_id = await conn.fetchval(
                """
                INSERT INTO articles (slug, title, description, body, author_id, created_at, updated_at)
                VALUES ($1, $2, $3, $4, $5, $6, $7)
                RETURNING id
                """,
                slug,
                article_data["title"],
                article_data["description"],
                article_data["body"],
                author_id,
                datetime.utcnow(),
                datetime.utcnow(),
            )

            # Insert tags
            for tag_name in article_data["tags"]:
                # Get or create tag
                await conn.execute(
                    """
                    INSERT INTO tags (tag)
                    VALUES ($1)
                    ON CONFLICT (tag) DO NOTHING
                    """,
                    tag_name,
                )

                # Link article to tag
                await conn.execute(
                    """
                    INSERT INTO articles_to_tags (article_id, tag)
                    VALUES ($1, $2)
                    ON CONFLICT DO NOTHING
                    """,
                    article_id,
                    tag_name,
                )

            print(f"  ✓ Created article: {article_data['title']}")

        print()
        print("=" * 60)
        print("Database seeding completed successfully!")
        print("=" * 60)
        print()
        print("Sample credentials:")
        for user in SAMPLE_DATA["users"]:
            print(f"  {user['username']} / {user['password']}")
        print()

    finally:
        await conn.close()


if __name__ == "__main__":
    asyncio.run(seed_database())
