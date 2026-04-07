"""Authentication API"""
from flask import Blueprint, request, jsonify
from flask_jwt_extended import (
    create_access_token, create_refresh_token,
    jwt_required, get_jwt_identity
)
from app import db
from app.models import User
from datetime import datetime

auth_bp = Blueprint('auth', __name__)


@auth_bp.route('/register', methods=['POST'])
def register():
    data = request.get_json()
    if not data:
        return jsonify({'error': 'No data provided'}), 400

    name = data.get('name', '').strip()
    email = data.get('email', '').strip().lower()
    password = data.get('password', '')
    language = data.get('language', 'en')
    grade_level = data.get('grade_level', '')

    if not all([name, email, password]):
        return jsonify({'error': 'Name, email and password are required'}), 400
    if len(password) < 6:
        return jsonify({'error': 'Password must be at least 6 characters'}), 400
    if User.query.filter_by(email=email).first():
        return jsonify({'error': 'Email already registered'}), 409

    user = User(name=name, email=email, language=language, grade_level=grade_level)
    user.set_password(password)
    db.session.add(user)
    db.session.commit()

    # Seed default badges
    _seed_badges()

    access_token = create_access_token(identity=user.id)
    refresh_token = create_refresh_token(identity=user.id)

    return jsonify({
        'message': 'Account created successfully',
        'user': user.to_dict(),
        'access_token': access_token,
        'refresh_token': refresh_token
    }), 201


@auth_bp.route('/login', methods=['POST'])
def login():
    data = request.get_json()
    email = data.get('email', '').strip().lower()
    password = data.get('password', '')

    user = User.query.filter_by(email=email).first()
    if not user or not user.check_password(password):
        return jsonify({'error': 'Invalid email or password'}), 401

    # Update streak
    now = datetime.utcnow()
    if user.last_login:
        diff = (now.date() - user.last_login.date()).days
        if diff == 1:
            user.streak += 1
        elif diff > 1:
            user.streak = 1
    user.last_login = now
    db.session.commit()

    access_token = create_access_token(identity=user.id)
    refresh_token = create_refresh_token(identity=user.id)

    return jsonify({
        'user': user.to_dict(),
        'access_token': access_token,
        'refresh_token': refresh_token
    }), 200


@auth_bp.route('/me', methods=['GET'])
@jwt_required()
def get_me():
    user_id = get_jwt_identity()
    user = User.query.get_or_404(user_id)
    return jsonify({'user': user.to_dict()}), 200


@auth_bp.route('/me', methods=['PUT'])
@jwt_required()
def update_profile():
    user_id = get_jwt_identity()
    user = User.query.get_or_404(user_id)
    data = request.get_json()

    if 'name' in data:
        user.name = data['name'].strip()
    if 'language' in data:
        user.language = data['language']
    if 'grade_level' in data:
        user.grade_level = data['grade_level']
    if 'password' in data and len(data['password']) >= 6:
        user.set_password(data['password'])

    db.session.commit()
    return jsonify({'user': user.to_dict()}), 200


@auth_bp.route('/refresh', methods=['POST'])
@jwt_required(refresh=True)
def refresh():
    user_id = get_jwt_identity()
    access_token = create_access_token(identity=user_id)
    return jsonify({'access_token': access_token}), 200


def _seed_badges():
    """Seed default badges if not exist."""
    from app.models import Badge
    default_badges = [
        {'name': 'First Step', 'description': 'Complete your first practice session', 'icon': '🎯', 'xp_reward': 50, 'condition_type': 'sessions', 'condition_value': 1},
        {'name': 'Week Warrior', 'description': '7-day learning streak', 'icon': '🔥', 'xp_reward': 200, 'condition_type': 'streak', 'condition_value': 7},
        {'name': 'Scholar', 'description': 'Score 90%+ in a practice session', 'icon': '🏆', 'xp_reward': 150, 'condition_type': 'score', 'condition_value': 90},
        {'name': 'Consistent Learner', 'description': '30-day learning streak', 'icon': '⭐', 'xp_reward': 500, 'condition_type': 'streak', 'condition_value': 30},
        {'name': 'Road Mapper', 'description': 'Generate your first roadmap', 'icon': '🗺️', 'xp_reward': 100, 'condition_type': 'roadmap', 'condition_value': 1},
    ]
    for b in default_badges:
        if not Badge.query.filter_by(name=b['name']).first():
            badge = Badge(**b)
            db.session.add(badge)
    db.session.commit()
