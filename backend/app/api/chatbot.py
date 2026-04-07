"""AI Chatbot API - Context-aware tutor"""
from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from app import db
from app.models import User, ChatHistory
from app.services.llm_service import chat_with_ai
import uuid

chatbot_bp = Blueprint('chatbot', __name__)


@chatbot_bp.route('/message', methods=['POST'])
@jwt_required()
def send_message():
    """Send a message to the AI tutor chatbot."""
    user_id = get_jwt_identity()
    user = User.query.get_or_404(user_id)
    data = request.get_json()

    message = data.get('message', '').strip()
    session_id = data.get('session_id') or str(uuid.uuid4())
    subject_context = data.get('subject_context')
    language = data.get('language', user.language or 'en')

    if not message:
        return jsonify({'error': 'message is required'}), 400

    # Get or create chat session
    chat = ChatHistory.query.filter_by(
        user_id=user_id, session_id=session_id
    ).first()

    if not chat:
        chat = ChatHistory(
            user_id=user_id,
            session_id=session_id,
            subject_context=subject_context,
            language=language
        )
        db.session.add(chat)
        db.session.flush()

    # Build conversation history for context
    history = chat.get_messages()

    user_context = {
        'name': user.name,
        'grade_level': user.grade_level or 'Not specified',
        'xp': user.xp,
        'streak': user.streak
    }

    # Get AI response
    ai_response = chat_with_ai(
        message, history, user_context, subject_context, language
    )

    # Save both messages
    chat.add_message('user', message)
    chat.add_message('assistant', ai_response)
    db.session.commit()

    return jsonify({
        'session_id': session_id,
        'response': ai_response,
        'message_count': len(chat.get_messages())
    }), 200


@chatbot_bp.route('/sessions', methods=['GET'])
@jwt_required()
def list_sessions():
    user_id = get_jwt_identity()
    chats = ChatHistory.query.filter_by(user_id=user_id).order_by(
        ChatHistory.updated_at.desc()
    ).limit(20).all()
    return jsonify({
        'sessions': [
            {
                'session_id': c.session_id,
                'subject_context': c.subject_context,
                'message_count': len(c.get_messages()),
                'created_at': c.created_at.isoformat()
            } for c in chats
        ]
    }), 200


@chatbot_bp.route('/session/<session_id>', methods=['GET'])
@jwt_required()
def get_session(session_id):
    user_id = get_jwt_identity()
    chat = ChatHistory.query.filter_by(
        session_id=session_id, user_id=user_id
    ).first_or_404()
    return jsonify({'chat': chat.to_dict()}), 200


@chatbot_bp.route('/session/<session_id>', methods=['DELETE'])
@jwt_required()
def delete_session(session_id):
    user_id = get_jwt_identity()
    chat = ChatHistory.query.filter_by(
        session_id=session_id, user_id=user_id
    ).first_or_404()
    db.session.delete(chat)
    db.session.commit()
    return jsonify({'message': 'Session deleted'}), 200
