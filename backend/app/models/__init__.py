"""Database Models"""
from datetime import datetime, date
from app import db
import bcrypt
import json


class User(db.Model):
    __tablename__ = 'users'

    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(150), nullable=False)
    email = db.Column(db.String(255), unique=True, nullable=False)
    password_hash = db.Column(db.String(255), nullable=False)
    language = db.Column(db.String(10), default='en')      # ISO language code
    grade_level = db.Column(db.String(50), nullable=True)  # e.g. "10th", "Grade 8"
    xp = db.Column(db.Integer, default=0)
    streak = db.Column(db.Integer, default=0)
    last_login = db.Column(db.DateTime, default=datetime.utcnow)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    # Relationships
    report_cards = db.relationship('ReportCard', backref='user', lazy=True, cascade='all, delete')
    roadmaps = db.relationship('Roadmap', backref='user', lazy=True, cascade='all, delete')
    practice_sessions = db.relationship('PracticeSession', backref='user', lazy=True, cascade='all, delete')
    badges = db.relationship('UserBadge', backref='user', lazy=True, cascade='all, delete')
    chat_histories = db.relationship('ChatHistory', backref='user', lazy=True, cascade='all, delete')

    def set_password(self, password: str):
        self.password_hash = bcrypt.hashpw(
            password.encode('utf-8'), bcrypt.gensalt()
        ).decode('utf-8')

    def check_password(self, password: str) -> bool:
        return bcrypt.checkpw(
            password.encode('utf-8'), self.password_hash.encode('utf-8')
        )

    def to_dict(self):
        return {
            'id': self.id,
            'name': self.name,
            'email': self.email,
            'language': self.language,
            'grade_level': self.grade_level,
            'xp': self.xp,
            'streak': self.streak,
            'created_at': self.created_at.isoformat()
        }


class ReportCard(db.Model):
    __tablename__ = 'report_cards'

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    file_path = db.Column(db.String(500), nullable=True)
    raw_text = db.Column(db.Text, nullable=True)          # OCR extracted text
    subjects_data = db.Column(db.Text, nullable=True)     # JSON: {subject: {marks, grade, max_marks}}
    term = db.Column(db.String(100), nullable=True)
    academic_year = db.Column(db.String(20), nullable=True)
    analysis_status = db.Column(db.String(50), default='pending')  # pending, processing, done
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    analyses = db.relationship('Analysis', backref='report_card', lazy=True, cascade='all, delete')

    def get_subjects(self):
        if self.subjects_data:
            return json.loads(self.subjects_data)
        return {}

    def set_subjects(self, data: dict):
        self.subjects_data = json.dumps(data)

    def to_dict(self):
        return {
            'id': self.id,
            'subjects': self.get_subjects(),
            'term': self.term,
            'academic_year': self.academic_year,
            'analysis_status': self.analysis_status,
            'created_at': self.created_at.isoformat()
        }


class Analysis(db.Model):
    __tablename__ = 'analyses'

    id = db.Column(db.Integer, primary_key=True)
    report_card_id = db.Column(db.Integer, db.ForeignKey('report_cards.id'), nullable=False)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    strengths = db.Column(db.Text, nullable=True)     # JSON list
    weaknesses = db.Column(db.Text, nullable=True)    # JSON list
    gaps = db.Column(db.Text, nullable=True)          # JSON list
    recommendations = db.Column(db.Text, nullable=True)
    overall_score = db.Column(db.Float, nullable=True)
    language = db.Column(db.String(10), default='en')
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    def to_dict(self):
        return {
            'id': self.id,
            'strengths': json.loads(self.strengths) if self.strengths else [],
            'weaknesses': json.loads(self.weaknesses) if self.weaknesses else [],
            'gaps': json.loads(self.gaps) if self.gaps else [],
            'recommendations': self.recommendations,
            'overall_score': self.overall_score,
            'created_at': self.created_at.isoformat()
        }


class Roadmap(db.Model):
    __tablename__ = 'roadmaps'

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    analysis_id = db.Column(db.Integer, db.ForeignKey('analyses.id'), nullable=True)
    title = db.Column(db.String(200), nullable=False)
    description = db.Column(db.Text, nullable=True)
    duration_weeks = db.Column(db.Integer, default=12)
    milestones = db.Column(db.Text, nullable=True)   # JSON: [{week, title, tasks, subject}]
    is_active = db.Column(db.Boolean, default=True)
    language = db.Column(db.String(10), default='en')
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    def get_milestones(self):
        if self.milestones:
            return json.loads(self.milestones)
        return []

    def to_dict(self):
        return {
            'id': self.id,
            'title': self.title,
            'description': self.description,
            'duration_weeks': self.duration_weeks,
            'milestones': self.get_milestones(),
            'is_active': self.is_active,
            'created_at': self.created_at.isoformat()
        }


class PracticeSession(db.Model):
    __tablename__ = 'practice_sessions'

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    subject = db.Column(db.String(100), nullable=False)
    session_type = db.Column(db.String(50), default='qa')  # qa, exam, revision
    questions = db.Column(db.Text, nullable=True)   # JSON array of Q&A
    score = db.Column(db.Float, nullable=True)
    total_questions = db.Column(db.Integer, default=0)
    correct_answers = db.Column(db.Integer, default=0)
    duration_minutes = db.Column(db.Integer, nullable=True)
    difficulty = db.Column(db.String(20), default='medium')
    language = db.Column(db.String(10), default='en')
    completed_at = db.Column(db.DateTime, nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    def to_dict(self):
        return {
            'id': self.id,
            'subject': self.subject,
            'session_type': self.session_type,
            'score': self.score,
            'total_questions': self.total_questions,
            'correct_answers': self.correct_answers,
            'difficulty': self.difficulty,
            'created_at': self.created_at.isoformat()
        }


class ChatHistory(db.Model):
    __tablename__ = 'chat_histories'

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    session_id = db.Column(db.String(100), nullable=False)
    messages = db.Column(db.Text, nullable=True)   # JSON: [{role, content, timestamp}]
    subject_context = db.Column(db.String(100), nullable=True)
    language = db.Column(db.String(10), default='en')
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    def get_messages(self):
        if self.messages:
            return json.loads(self.messages)
        return []

    def add_message(self, role: str, content: str):
        msgs = self.get_messages()
        msgs.append({'role': role, 'content': content, 'timestamp': datetime.utcnow().isoformat()})
        self.messages = json.dumps(msgs)

    def to_dict(self):
        return {
            'id': self.id,
            'session_id': self.session_id,
            'messages': self.get_messages(),
            'subject_context': self.subject_context,
            'created_at': self.created_at.isoformat()
        }


class Badge(db.Model):
    __tablename__ = 'badges'

    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), unique=True, nullable=False)
    description = db.Column(db.Text, nullable=True)
    icon = db.Column(db.String(50), nullable=True)   # emoji or icon name
    xp_reward = db.Column(db.Integer, default=100)
    condition_type = db.Column(db.String(50), nullable=True)  # streak, sessions, score
    condition_value = db.Column(db.Integer, default=1)


class UserBadge(db.Model):
    __tablename__ = 'user_badges'

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    badge_id = db.Column(db.Integer, db.ForeignKey('badges.id'), nullable=False)
    earned_at = db.Column(db.DateTime, default=datetime.utcnow)

    badge = db.relationship('Badge', backref='user_badges', lazy=True)

    def to_dict(self):
        return {
            'id': self.id,
            'badge': {
                'id': self.badge.id,
                'name': self.badge.name,
                'description': self.badge.description,
                'icon': self.badge.icon,
                'xp_reward': self.badge.xp_reward
            },
            'earned_at': self.earned_at.isoformat()
        }
