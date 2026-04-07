"""Daily Practice & Exam Prep API"""
from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from app import db
from app.models import User, PracticeSession, UserBadge, Badge
from app.services.llm_service import (
    generate_practice_questions, evaluate_answer,
    generate_exam_prep_session, generate_revision_material
)
from datetime import datetime
import json

practice_bp = Blueprint('practice', __name__)


@practice_bp.route('/questions', methods=['POST'])
@jwt_required()
def get_practice_questions():
    """Generate AI practice questions for a subject/topic."""
    user_id = get_jwt_identity()
    user = User.query.get_or_404(user_id)
    data = request.get_json()

    subject = data.get('subject', 'Mathematics')
    topic = data.get('topic', 'General')
    difficulty = data.get('difficulty', 'medium')
    num_questions = min(data.get('num_questions', 10), 20)
    language = data.get('language', user.language or 'en')
    grade_level = data.get('grade_level', user.grade_level or '10th Grade')

    questions_data = generate_practice_questions(
        subject, topic, difficulty, num_questions, grade_level, language
    )

    # Create a session record
    session = PracticeSession(
        user_id=user_id,
        subject=subject,
        session_type='qa',
        questions=json.dumps(questions_data.get('questions', [])),
        total_questions=num_questions,
        difficulty=difficulty,
        language=language
    )
    db.session.add(session)
    db.session.commit()

    return jsonify({
        'session_id': session.id,
        'subject': subject,
        'topic': topic,
        'difficulty': difficulty,
        'questions': questions_data.get('questions', [])
    }), 200


@practice_bp.route('/evaluate', methods=['POST'])
@jwt_required()
def evaluate():
    """Evaluate a student's answer to a practice question."""
    user_id = get_jwt_identity()
    user = User.query.get_or_404(user_id)
    data = request.get_json()

    question = data.get('question', '')
    model_answer = data.get('model_answer', '')
    student_answer = data.get('student_answer', '')
    subject = data.get('subject', 'General')
    language = data.get('language', user.language or 'en')

    if not student_answer:
        return jsonify({'error': 'student_answer is required'}), 400

    result = evaluate_answer(question, model_answer, student_answer, subject, language)
    return jsonify({'evaluation': result}), 200


@practice_bp.route('/session/<int:session_id>/complete', methods=['POST'])
@jwt_required()
def complete_session(session_id):
    """Mark practice session as complete and award XP."""
    user_id = get_jwt_identity()
    user = User.query.get_or_404(user_id)
    data = request.get_json()

    session = PracticeSession.query.filter_by(id=session_id, user_id=user_id).first_or_404()

    score = data.get('score', 0)
    correct = data.get('correct_answers', 0)
    duration = data.get('duration_minutes', 0)

    session.score = score
    session.correct_answers = correct
    session.duration_minutes = duration
    session.completed_at = datetime.utcnow()

    # XP calculation: base 20 + bonus for high scores
    xp_earned = 20
    if score >= 90:
        xp_earned = 75
    elif score >= 75:
        xp_earned = 50
    elif score >= 60:
        xp_earned = 35

    user.xp += xp_earned
    db.session.commit()

    # Check badge eligibility
    earned_badges = _check_and_award_badges(user)

    return jsonify({
        'message': 'Session completed',
        'score': score,
        'xp_earned': xp_earned,
        'new_badges': [b.to_dict() for b in earned_badges]
    }), 200


@practice_bp.route('/sessions', methods=['GET'])
@jwt_required()
def list_sessions():
    user_id = get_jwt_identity()
    sessions = PracticeSession.query.filter_by(user_id=user_id).order_by(
        PracticeSession.created_at.desc()
    ).limit(20).all()
    return jsonify({'sessions': [s.to_dict() for s in sessions]}), 200


@practice_bp.route('/exam-prep', methods=['POST'])
@jwt_required()
def exam_prep():
    """Generate a full exam prep Q&A session."""
    user_id = get_jwt_identity()
    user = User.query.get_or_404(user_id)
    data = request.get_json()

    subjects = data.get('subjects', ['Mathematics'])
    exam_type = data.get('exam_type', 'Chapter Test')
    language = data.get('language', user.language or 'en')
    grade_level = data.get('grade_level', user.grade_level or '10th Grade')

    session_data = generate_exam_prep_session(subjects, exam_type, grade_level, language)

    session = PracticeSession(
        user_id=user_id,
        subject=', '.join(subjects),
        session_type='exam',
        questions=json.dumps(session_data),
        difficulty='mixed',
        language=language
    )
    db.session.add(session)
    db.session.commit()

    return jsonify({
        'session_id': session.id,
        'exam_session': session_data
    }), 200


@practice_bp.route('/revision-material', methods=['POST'])
@jwt_required()
def revision_material():
    """Get AI-generated revision material for weak topics."""
    user_id = get_jwt_identity()
    user = User.query.get_or_404(user_id)
    data = request.get_json()

    subject = data.get('subject', 'Mathematics')
    weak_topics = data.get('weak_topics', [])
    language = data.get('language', user.language or 'en')
    grade_level = data.get('grade_level', user.grade_level or '10th Grade')

    if not weak_topics:
        return jsonify({'error': 'weak_topics list is required'}), 400

    material = generate_revision_material(subject, weak_topics, grade_level, language)
    return jsonify({'revision_material': material}), 200


def _check_and_award_badges(user) -> list:
    """Check and award eligible badges to user."""
    earned = []
    all_badges = Badge.query.all()
    existing_badge_ids = {ub.badge_id for ub in UserBadge.query.filter_by(user_id=user.id).all()}

    session_count = PracticeSession.query.filter_by(
        user_id=user.id, completed_at=None
    ).count()
    max_score = db.session.query(db.func.max(PracticeSession.score)).filter_by(
        user_id=user.id
    ).scalar() or 0

    for badge in all_badges:
        if badge.id in existing_badge_ids:
            continue
        award = False
        if badge.condition_type == 'sessions' and session_count >= badge.condition_value:
            award = True
        elif badge.condition_type == 'streak' and user.streak >= badge.condition_value:
            award = True
        elif badge.condition_type == 'score' and max_score >= badge.condition_value:
            award = True
        if award:
            ub = UserBadge(user_id=user.id, badge_id=badge.id)
            db.session.add(ub)
            user.xp += badge.xp_reward
            earned.append(ub)

    if earned:
        db.session.commit()
    return earned
