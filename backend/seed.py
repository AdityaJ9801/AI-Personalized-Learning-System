"""
Seed initial badge data into the database.
Run: python seed.py
"""
import sys, os
sys.path.insert(0, os.path.dirname(__file__))

from app import create_app, db
from app.models import Badge

BADGES = [
    dict(name='First Steps',       description='Complete your first practice session',   icon='👣', xp_reward=50,  condition_type='sessions', condition_value=1),
    dict(name='Streak Starter',    description='Maintain a 3-day learning streak',        icon='🔥', xp_reward=75,  condition_type='streak',   condition_value=3),
    dict(name='Knowledge Seeker',  description='Complete 5 practice sessions',            icon='📚', xp_reward=100, condition_type='sessions', condition_value=5),
    dict(name='High Scorer',       description='Score 90%+ in any practice session',      icon='⭐', xp_reward=150, condition_type='score',    condition_value=90),
    dict(name='Week Warrior',      description='Maintain a 7-day learning streak',        icon='🗡️', xp_reward=200, condition_type='streak',   condition_value=7),
    dict(name='Practice Pro',      description='Complete 20 practice sessions',           icon='🏆', xp_reward=300, condition_type='sessions', condition_value=20),
    dict(name='Streak Master',     description='Maintain a 30-day learning streak',       icon='🌟', xp_reward=500, condition_type='streak',   condition_value=30),
    dict(name='Perfect Score',     description='Score 100% in a practice session',        icon='💯', xp_reward=250, condition_type='score',    condition_value=100),
    dict(name='Road Mapper',       description='Generate your first learning roadmap',    icon='🗺️', xp_reward=100, condition_type='roadmap',  condition_value=1),
    dict(name='AI Explorer',       description='Have 10+ conversations with AI tutor',   icon='🤖', xp_reward=150, condition_type='chats',    condition_value=10),
    dict(name='Speed Learner',     description='Complete 3 sessions in a single day',     icon='⚡', xp_reward=200, condition_type='daily',    condition_value=3),
    dict(name='Subject Champion',  description='Complete 10 sessions in one subject',    icon='🎓', xp_reward=350, condition_type='subject',  condition_value=10),
]

def seed():
    app = create_app()
    with app.app_context():
        db.create_all()
        added = 0
        for b_data in BADGES:
            if not Badge.query.filter_by(name=b_data['name']).first():
                b = Badge(**b_data)
                db.session.add(b)
                added += 1
        db.session.commit()
        print(f"✅ Seeded {added} badge(s). Total: {Badge.query.count()}")

if __name__ == '__main__':
    seed()
