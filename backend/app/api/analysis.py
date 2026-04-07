"""AI Analysis Engine API"""
from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from app import db
from app.models import User, ReportCard, Analysis
from app.services.llm_service import analyze_performance
import json

analysis_bp = Blueprint('analysis', __name__)


@analysis_bp.route('/analyze', methods=['POST'])
@jwt_required()
def analyze():
    """Core AI Analysis: strengths, weaknesses, gaps, recommendations."""
    user_id = get_jwt_identity()
    user = User.query.get_or_404(user_id)
    data = request.get_json()

    report_card_id = data.get('report_card_id')
    language = data.get('language', user.language or 'en')

    if not report_card_id:
        return jsonify({'error': 'report_card_id is required'}), 400

    report = ReportCard.query.filter_by(id=report_card_id, user_id=user_id).first_or_404()
    subjects_data = report.get_subjects()

    if not subjects_data:
        return jsonify({'error': 'No subject data found in report card'}), 400

    user_context = {
        'name': user.name,
        'grade_level': user.grade_level or 'Not specified',
        'language': language
    }

    # Call LLM Analysis Engine
    result = analyze_performance(subjects_data, user_context, language)

    # Save analysis
    analysis = Analysis(
        report_card_id=report_card_id,
        user_id=user_id,
        strengths=json.dumps(result.get('strengths', [])),
        weaknesses=json.dumps(result.get('weaknesses', [])),
        gaps=json.dumps(result.get('gaps', [])),
        recommendations=json.dumps(result.get('recommendations', [])),
        overall_score=result.get('overall_percentage', 0),
        language=language
    )
    db.session.add(analysis)
    report.analysis_status = 'done'
    db.session.commit()

    # Award XP for analyzing
    user.xp += 50
    db.session.commit()

    return jsonify({
        'analysis': analysis.to_dict(),
        'summary': result.get('overall_summary', ''),
        'performance_level': result.get('performance_level', ''),
        'motivational_message': result.get('motivational_message', ''),
        'xp_earned': 50
    }), 200


@analysis_bp.route('/history', methods=['GET'])
@jwt_required()
def get_analysis_history():
    user_id = get_jwt_identity()
    analyses = Analysis.query.filter_by(user_id=user_id).order_by(
        Analysis.created_at.desc()
    ).limit(10).all()
    return jsonify({'analyses': [a.to_dict() for a in analyses]}), 200


@analysis_bp.route('/<int:analysis_id>', methods=['GET'])
@jwt_required()
def get_analysis(analysis_id):
    user_id = get_jwt_identity()
    analysis = Analysis.query.filter_by(id=analysis_id, user_id=user_id).first_or_404()
    return jsonify({'analysis': analysis.to_dict()}), 200
