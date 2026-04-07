#!/bin/bash
set -e

echo "=========================================="
echo " EduAI Backend - Docker Startup"
echo "=========================================="

# ── Wait for PostgreSQL ───────────────────────────────────────────────────────
echo "[1/3] Waiting for PostgreSQL to be ready..."
python - <<'PYEOF'
import os, sys, time, psycopg2

db_url = os.environ.get("DATABASE_URL", "")
max_retries = 40
for i in range(1, max_retries + 1):
    try:
        conn = psycopg2.connect(db_url)
        conn.close()
        print(f"  ✅ PostgreSQL ready after {i} attempt(s)")
        sys.exit(0)
    except psycopg2.OperationalError as e:
        print(f"  ⏳ Attempt {i}/{max_retries}: {e.__class__.__name__}")
        time.sleep(2)

print("  ❌ PostgreSQL not reachable after all retries")
sys.exit(1)
PYEOF

# ── Create tables + seed data ─────────────────────────────────────────────────
echo "[2/3] Initialising database tables and seed data..."
python - <<'PYEOF'
import os, sys
sys.path.insert(0, '/app')

os.environ.setdefault('SECRET_KEY', 'temp-build-key')

from app import create_app, db
from app.models import Badge

BADGES = [
    dict(name='First Steps',      description='Complete your first practice session',  icon='👣', xp_reward=50,  condition_type='sessions', condition_value=1),
    dict(name='Streak Starter',   description='Maintain a 3-day learning streak',       icon='🔥', xp_reward=75,  condition_type='streak',   condition_value=3),
    dict(name='Knowledge Seeker', description='Complete 5 practice sessions',           icon='📚', xp_reward=100, condition_type='sessions', condition_value=5),
    dict(name='High Scorer',      description='Score 90%+ in any practice session',     icon='⭐', xp_reward=150, condition_type='score',    condition_value=90),
    dict(name='Week Warrior',     description='Maintain a 7-day learning streak',       icon='🗡️', xp_reward=200, condition_type='streak',   condition_value=7),
    dict(name='Practice Pro',     description='Complete 20 practice sessions',          icon='🏆', xp_reward=300, condition_type='sessions', condition_value=20),
    dict(name='Streak Master',    description='Maintain a 30-day learning streak',      icon='🌟', xp_reward=500, condition_type='streak',   condition_value=30),
    dict(name='Perfect Score',    description='Score 100% in a practice session',       icon='💯', xp_reward=250, condition_type='score',    condition_value=100),
    dict(name='Road Mapper',      description='Generate your first learning roadmap',   icon='🗺️', xp_reward=100, condition_type='roadmap',  condition_value=1),
    dict(name='AI Explorer',      description='Have 10+ conversations with AI tutor',  icon='🤖', xp_reward=150, condition_type='chats',    condition_value=10),
    dict(name='Speed Learner',    description='Complete 3 sessions in a single day',    icon='⚡', xp_reward=200, condition_type='daily',    condition_value=3),
    dict(name='Subject Champion', description='Complete 10 sessions in one subject',   icon='🎓', xp_reward=350, condition_type='subject',  condition_value=10),
]

app = create_app()
with app.app_context():
    db.create_all()
    print("  ✅ All database tables created")

    added = 0
    for b in BADGES:
        if not Badge.query.filter_by(name=b['name']).first():
            db.session.add(Badge(**b))
            added += 1
    if added:
        db.session.commit()
        print(f"  ✅ Seeded {added} badge(s)")
    else:
        print(f"  ℹ️  Badges already seeded ({Badge.query.count()} total)")

print("  ✅ Database initialisation complete")
PYEOF

# ── Launch Gunicorn ───────────────────────────────────────────────────────────
echo "[3/3] Starting Gunicorn..."
exec gunicorn \
    --bind 0.0.0.0:5000 \
    --workers 2 \
    --timeout 120 \
    --log-level info \
    --access-logfile - \
    --error-logfile - \
    run:app
