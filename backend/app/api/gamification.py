"""Gamification API - Badges, XP, Streaks"""
from flask import Blueprint, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from app import db
from app.models import User, UserBadge, Badge, PracticeSession
from sqlalchemy import func

gamification_bp = Blueprint('gamification', __name__)


@gamification_bp.route('/dashboard', methods=['GET'])
@jwt_required()
def gamification_dashboard():
    """Get full gamification stats for user."""
    user_id = get_jwt_identity()
    user = User.query.get_or_404(user_id)

    # Badges
    user_badges = UserBadge.query.filter_by(user_id=user_id).all()
    all_badges = Badge.query.all()
    earned_ids = {ub.badge_id for ub in user_badges}

    # Session stats
    total_sessions = PracticeSession.query.filter_by(user_id=user_id).count()
    avg_score = db.session.query(func.avg(PracticeSession.score)).filter(
        PracticeSession.user_id == user_id,
        PracticeSession.score.isnot(None)
    ).scalar() or 0

    # XP level calculation
    level = max(1, user.xp // 500 + 1)
    xp_for_next_level = level * 500
    xp_progress = (user.xp % 500) / 500 * 100

    return jsonify({
        'xp': user.xp,
        'level': level,
        'xp_for_next_level': xp_for_next_level,
        'xp_progress_percent': round(xp_progress, 1),
        'streak': user.streak,
        'total_sessions': total_sessions,
        'avg_score': round(float(avg_score), 1),
        'badges_earned': len(user_badges),
        'badges_total': len(all_badges),
        'earned_badges': [ub.to_dict() for ub in user_badges],
        'available_badges': [
            {
                'id': b.id, 'name': b.name, 'description': b.description,
                'icon': b.icon, 'xp_reward': b.xp_reward,
                'earned': b.id in earned_ids
            } for b in all_badges
        ]
    }), 200


@gamification_bp.route('/leaderboard', methods=['GET'])
@jwt_required()
def leaderboard():
    """Top 10 users by XP (anonymized except current user)."""
    user_id = get_jwt_identity()
    top_users = User.query.order_by(User.xp.desc()).limit(10).all()

    board = []
    for i, u in enumerate(top_users, 1):
        is_me = u.id == user_id
        board.append({
            'rank': i,
            'name': u.name if is_me else u.name[0] + '*' * (len(u.name) - 1),
            'xp': u.xp,
            'level': max(1, u.xp // 500 + 1),
            'streak': u.streak,
            'is_me': is_me
        })

    return jsonify({'leaderboard': board}), 200
