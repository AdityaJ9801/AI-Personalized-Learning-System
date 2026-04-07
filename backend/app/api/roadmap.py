"""Roadmap Generator API"""
from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from app import db
from app.models import User, Analysis, Roadmap
from app.services.llm_service import generate_roadmap
import json

roadmap_bp = Blueprint('roadmap', __name__)


@roadmap_bp.route('/generate', methods=['POST'])
@jwt_required()
def generate():
    """Generate a personalized learning roadmap from analysis."""
    user_id = get_jwt_identity()
    user = User.query.get_or_404(user_id)
    data = request.get_json()

    analysis_id = data.get('analysis_id')
    subjects_focus = data.get('subjects_focus', [])   # list of subject names to prioritize
    duration_weeks = data.get('duration_weeks', 12)
    language = data.get('language', user.language or 'en')

    if not analysis_id:
        return jsonify({'error': 'analysis_id is required'}), 400

    analysis = Analysis.query.filter_by(id=analysis_id, user_id=user_id).first_or_404()

    analysis_data = {
        'strengths': analysis.to_dict()['strengths'],
        'weaknesses': analysis.to_dict()['weaknesses'],
        'gaps': analysis.to_dict()['gaps'],
        'recommendations': json.loads(analysis.recommendations) if analysis.recommendations else [],
        'overall_score': analysis.overall_score
    }
    user_context = {
        'name': user.name,
        'grade_level': user.grade_level or 'Not specified',
        'xp': user.xp,
        'streak': user.streak
    }

    # If no focus subjects, use weakest subjects from analysis
    if not subjects_focus:
        weaknesses = analysis_data.get('weaknesses', [])
        subjects_focus = [w['subject'] for w in weaknesses[:3]] if weaknesses else ['General Study']

    # Call LLM to generate roadmap
    roadmap_data = generate_roadmap(
        analysis_data, subjects_focus, user_context,
        duration_weeks=duration_weeks, language=language
    )

    # Deactivate previous roadmaps
    Roadmap.query.filter_by(user_id=user_id, is_active=True).update({'is_active': False})

    # Save new roadmap
    roadmap = Roadmap(
        user_id=user_id,
        analysis_id=analysis_id,
        title=roadmap_data.get('title', f"Learning Roadmap - {user.name}"),
        description=roadmap_data.get('description', ''),
        duration_weeks=duration_weeks,
        milestones=json.dumps(roadmap_data.get('milestones', [])),
        language=language,
        is_active=True
    )
    db.session.add(roadmap)

    # Award XP for generating roadmap
    user.xp += 100
    db.session.commit()

    return jsonify({
        'roadmap': roadmap.to_dict(),
        'weekly_study_hours': roadmap_data.get('weekly_study_hours', 15),
        'milestone_checkpoints': roadmap_data.get('milestone_checkpoints', []),
        'xp_earned': 100
    }), 201


@roadmap_bp.route('/active', methods=['GET'])
@jwt_required()
def get_active_roadmap():
    user_id = get_jwt_identity()
    roadmap = Roadmap.query.filter_by(user_id=user_id, is_active=True).first()
    if not roadmap:
        return jsonify({'roadmap': None, 'message': 'No active roadmap found'}), 200
    return jsonify({'roadmap': roadmap.to_dict()}), 200


@roadmap_bp.route('/', methods=['GET'])
@jwt_required()
def list_roadmaps():
    user_id = get_jwt_identity()
    roadmaps = Roadmap.query.filter_by(user_id=user_id).order_by(
        Roadmap.created_at.desc()
    ).all()
    return jsonify({'roadmaps': [r.to_dict() for r in roadmaps]}), 200


@roadmap_bp.route('/<int:roadmap_id>', methods=['GET'])
@jwt_required()
def get_roadmap(roadmap_id):
    user_id = get_jwt_identity()
    roadmap = Roadmap.query.filter_by(id=roadmap_id, user_id=user_id).first_or_404()
    return jsonify({'roadmap': roadmap.to_dict()}), 200


@roadmap_bp.route('/<int:roadmap_id>/activate', methods=['PUT'])
@jwt_required()
def activate_roadmap(roadmap_id):
    user_id = get_jwt_identity()
    Roadmap.query.filter_by(user_id=user_id, is_active=True).update({'is_active': False})
    roadmap = Roadmap.query.filter_by(id=roadmap_id, user_id=user_id).first_or_404()
    roadmap.is_active = True
    db.session.commit()
    return jsonify({'message': 'Roadmap activated', 'roadmap': roadmap.to_dict()}), 200
