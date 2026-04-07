"""
EduAI - Flask Application Factory
"""
import os
from flask import Flask
from flask_cors import CORS
from flask_jwt_extended import JWTManager
from flask_sqlalchemy import SQLAlchemy
from flask_migrate import Migrate
from dotenv import load_dotenv

load_dotenv()

db = SQLAlchemy()
jwt = JWTManager()
migrate = Migrate()


def create_app(config_name=None):
    app = Flask(__name__)

    # ── Configuration ──────────────────────────────────────────────────────────
    app.config['SECRET_KEY'] = os.environ.get('SECRET_KEY', 'dev-secret-key')
    app.config['SQLALCHEMY_DATABASE_URI'] = os.environ.get(
        'DATABASE_URL', 'sqlite:///eduai.db'
    )
    app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
    app.config['JWT_SECRET_KEY'] = app.config['SECRET_KEY']
    app.config['JWT_ACCESS_TOKEN_EXPIRES'] = 3600          # 1 hour
    app.config['JWT_REFRESH_TOKEN_EXPIRES'] = 2592000       # 30 days
    app.config['MAX_CONTENT_LENGTH'] = 16 * 1024 * 1024    # 16 MB upload max
    app.config['UPLOAD_FOLDER'] = os.path.join(os.path.dirname(__file__), '..', 'uploads')

    os.makedirs(app.config['UPLOAD_FOLDER'], exist_ok=True)

    # ── Extensions ─────────────────────────────────────────────────────────────
    db.init_app(app)
    jwt.init_app(app)
    migrate.init_app(app, db)

    cors_origins = os.environ.get(
        'CORS_ORIGINS',
        'http://localhost:3000,http://localhost:3001,http://127.0.0.1:3000,http://127.0.0.1:3001'
    ).split(',')
    CORS(app, origins=cors_origins, supports_credentials=True)

    # ── Blueprints ─────────────────────────────────────────────────────────────
    from app.api.auth import auth_bp
    from app.api.report_card import report_bp
    from app.api.analysis import analysis_bp
    from app.api.roadmap import roadmap_bp
    from app.api.practice import practice_bp
    from app.api.chatbot import chatbot_bp
    from app.api.gamification import gamification_bp

    app.register_blueprint(auth_bp, url_prefix='/api/auth')
    app.register_blueprint(report_bp, url_prefix='/api/report')
    app.register_blueprint(analysis_bp, url_prefix='/api/analysis')
    app.register_blueprint(roadmap_bp, url_prefix='/api/roadmap')
    app.register_blueprint(practice_bp, url_prefix='/api/practice')
    app.register_blueprint(chatbot_bp, url_prefix='/api/chatbot')
    app.register_blueprint(gamification_bp, url_prefix='/api/gamification')

    # ── Health check ───────────────────────────────────────────────────────────
    @app.route('/api/health')
    def health():
        return {'status': 'ok', 'service': 'EduAI Backend'}, 200

    return app
