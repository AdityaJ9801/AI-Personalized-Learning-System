"""Report Card Upload & Processing API"""
import os
import uuid
from flask import Blueprint, request, jsonify, current_app
from flask_jwt_extended import jwt_required, get_jwt_identity
from werkzeug.utils import secure_filename
from app import db
from app.models import User, ReportCard
from app.services.llm_service import extract_report_card_data, process_manual_subjects
import json

report_bp = Blueprint('report', __name__)

ALLOWED_EXTENSIONS = {'pdf', 'png', 'jpg', 'jpeg', 'gif', 'bmp', 'tiff'}


def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS


def extract_text_from_file(filepath: str) -> str:
    """Extract text from uploaded file using OCR or PDF parser.
    Falls back gracefully if OCR libraries not installed (local dev mode).
    """
    ext = filepath.rsplit('.', 1)[1].lower()
    text = ""
    try:
        if ext == 'pdf':
            try:
                from pdf2image import convert_from_path
                import pytesseract
                images = convert_from_path(filepath)
                for img in images:
                    text += pytesseract.image_to_string(img) + "\n"
            except ImportError:
                current_app.logger.warning("pdf2image/pytesseract not installed. OCR skipped.")
        else:
            try:
                import pytesseract
                from PIL import Image
                img = Image.open(filepath)
                text = pytesseract.image_to_string(img)
            except ImportError:
                current_app.logger.warning("pytesseract/Pillow not installed. OCR skipped.")
    except Exception as e:
        current_app.logger.error(f"OCR error: {e}")
    return text.strip()


@report_bp.route('/upload', methods=['POST'])
@jwt_required()
def upload_report_card():
    """Upload and process a report card image/PDF."""
    user_id = get_jwt_identity()
    user = User.query.get_or_404(user_id)

    if 'file' not in request.files:
        return jsonify({'error': 'No file provided'}), 400

    file = request.files['file']
    if not file.filename or not allowed_file(file.filename):
        return jsonify({'error': 'Invalid file type. Use PDF, PNG, JPG, JPEG'}), 400

    # Save file
    filename = f"{uuid.uuid4()}_{secure_filename(file.filename)}"
    upload_folder = current_app.config['UPLOAD_FOLDER']
    filepath = os.path.join(upload_folder, filename)
    file.save(filepath)

    # Extract text via OCR
    raw_text = extract_text_from_file(filepath)
    language = request.form.get('language', user.language or 'en')

    # Create report card record
    report = ReportCard(
        user_id=user_id,
        file_path=filepath,
        raw_text=raw_text,
        term=request.form.get('term', ''),
        academic_year=request.form.get('academic_year', ''),
        analysis_status='processing'
    )
    db.session.add(report)
    db.session.commit()

    # Use LLM to extract structured data
    if raw_text:
        extracted = extract_report_card_data(raw_text, language=language)
        report.set_subjects(extracted.get('subjects', []))
        report.term = extracted.get('term', report.term)
        report.academic_year = extracted.get('academic_year', report.academic_year)
        report.analysis_status = 'extracted'
    else:
        report.analysis_status = 'ocr_failed'

    db.session.commit()

    return jsonify({
        'message': 'Report card uploaded and processed',
        'report_card': report.to_dict(),
        'extracted_text_preview': raw_text[:500] if raw_text else 'OCR extraction failed',
        'next_step': 'Call /api/analysis/analyze to get AI insights'
    }), 201


@report_bp.route('/manual', methods=['POST'])
@jwt_required()
def manual_entry():
    """Manually enter subject marks without uploading a file."""
    user_id = get_jwt_identity()
    user = User.query.get_or_404(user_id)
    data = request.get_json()

    subjects_input = data.get('subjects', [])  # [{name, marks, max_marks}]
    if not subjects_input:
        return jsonify({'error': 'No subjects provided'}), 400

    language = data.get('language', user.language or 'en')
    grade_level = data.get('grade_level', user.grade_level or 'Not specified')

    # Process via LLM
    processed = process_manual_subjects(subjects_input, grade_level, language)

    report = ReportCard(
        user_id=user_id,
        raw_text=json.dumps(subjects_input),
        term=data.get('term', ''),
        academic_year=data.get('academic_year', ''),
        analysis_status='extracted'
    )
    report.set_subjects(processed.get('subjects', subjects_input))
    db.session.add(report)
    db.session.commit()

    return jsonify({
        'message': 'Report card created from manual entry',
        'report_card': report.to_dict()
    }), 201


@report_bp.route('/', methods=['GET'])
@jwt_required()
def list_report_cards():
    user_id = get_jwt_identity()
    reports = ReportCard.query.filter_by(user_id=user_id).order_by(
        ReportCard.created_at.desc()
    ).all()
    return jsonify({'report_cards': [r.to_dict() for r in reports]}), 200


@report_bp.route('/<int:report_id>', methods=['GET'])
@jwt_required()
def get_report_card(report_id):
    user_id = get_jwt_identity()
    report = ReportCard.query.filter_by(id=report_id, user_id=user_id).first_or_404()
    return jsonify({'report_card': report.to_dict()}), 200
