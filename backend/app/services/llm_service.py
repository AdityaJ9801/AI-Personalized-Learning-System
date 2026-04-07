"""
OpenAI LLM Service - Central AI engine for all analysis
"""
import os
import json
from openai import OpenAI
from typing import Optional

client = OpenAI(api_key=os.environ.get('OPENAI_API_KEY'))

MODEL = "gpt-4o-mini"   # fast, cost-effective; change to gpt-4o for better quality

# ── Language display names ──────────────────────────────────────────────────
LANGUAGE_NAMES = {
    'en': 'English', 'hi': 'Hindi', 'bn': 'Bengali', 'te': 'Telugu',
    'mr': 'Marathi', 'ta': 'Tamil', 'ur': 'Urdu', 'gu': 'Gujarati',
    'kn': 'Kannada', 'ml': 'Malayalam', 'es': 'Spanish', 'fr': 'French',
    'de': 'German', 'zh': 'Chinese', 'ar': 'Arabic', 'pt': 'Portuguese',
    'ru': 'Russian', 'ja': 'Japanese', 'ko': 'Korean', 'id': 'Indonesian'
}


def get_language_name(code: str) -> str:
    return LANGUAGE_NAMES.get(code, 'English')


def _chat(system: str, user: str, temperature: float = 0.7, json_mode: bool = False) -> str:
    """Low-level OpenAI chat completion."""
    kwargs = {
        "model": MODEL,
        "messages": [
            {"role": "system", "content": system},
            {"role": "user", "content": user}
        ],
        "temperature": temperature
    }
    if json_mode:
        kwargs["response_format"] = {"type": "json_object"}

    response = client.chat.completions.create(**kwargs)
    return response.choices[0].message.content


# ── 1. Report Card Extraction ──────────────────────────────────────────────
def extract_report_card_data(raw_text: str, language: str = 'en') -> dict:
    """
    Extract structured subject scores from raw OCR text of a report card.
    Returns JSON: {subjects: [{name, marks_obtained, max_marks, grade, percentage}]}
    """
    lang_name = get_language_name(language)
    system = (
        "You are an expert academic data extractor. Extract marks/grades from report cards. "
        "Always respond with valid JSON. Be accurate and include all subjects found."
    )
    user = f"""
Extract subject-wise performance from this report card text. 
The report card may be in {lang_name}. Translate subject names to English.

Report Card Text:
{raw_text}

Respond with JSON:
{{
  "student_name": "...",
  "term": "...",
  "academic_year": "...",
  "grade_level": "...",
  "subjects": [
    {{
      "name": "Mathematics",
      "marks_obtained": 85,
      "max_marks": 100,
      "grade": "A",
      "percentage": 85.0
    }}
  ],
  "overall_percentage": 82.5
}}
"""
    result = _chat(system, user, temperature=0.2, json_mode=True)
    return json.loads(result)


# ── 2. Manual Subject Entry ────────────────────────────────────────────────
def process_manual_subjects(subjects_list: list, grade_level: str, language: str = 'en') -> dict:
    """Process manually entered subject scores."""
    system = "You are an academic data processor. Format subject data consistently."
    user = f"""
Process these manually entered subject scores for a {grade_level} student.

Subjects: {json.dumps(subjects_list)}

Respond with JSON:
{{
  "subjects": [
    {{
      "name": "subject name in English",
      "marks_obtained": <number>,
      "max_marks": 100,
      "grade": "letter grade A/B/C/D/F",
      "percentage": <number>
    }}
  ],
  "overall_percentage": <average>
}}
"""
    result = _chat(system, user, temperature=0.1, json_mode=True)
    return json.loads(result)


# ── 3. Core AI Analysis Engine ────────────────────────────────────────────
def analyze_performance(subjects_data: dict, user_context: dict, language: str = 'en') -> dict:
    """
    Main AI Analysis Engine: Strength, Weaknesses, Gaps, Recommendations.
    Based on LLM model knowledge - versatile across subjects and curricula.
    """
    lang_name = get_language_name(language)
    system = (
        f"You are an expert educational psychologist and academic counselor. "
        f"Analyze student performance and provide actionable insights. "
        f"Respond entirely in {lang_name}. Be encouraging, constructive, and specific."
    )
    user = f"""
Analyze this student's academic performance:

Student Profile:
- Grade Level: {user_context.get('grade_level', 'Not specified')}
- Name: {user_context.get('name', 'Student')}

Subject Performance:
{json.dumps(subjects_data, indent=2)}

Provide a detailed analysis. Respond in {lang_name} with this JSON structure:
{{
  "overall_summary": "2-3 sentence overall assessment",
  "overall_percentage": <calculated average>,
  "performance_level": "Excellent/Good/Average/Below Average/Needs Improvement",
  "strengths": [
    {{"subject": "Math", "insight": "Strong foundation in algebra", "score": 92}}
  ],
  "weaknesses": [
    {{"subject": "Science", "insight": "Needs practice with chemical equations", "score": 58}}
  ],
  "gaps": [
    {{"area": "Problem-solving skills", "description": "Needs systematic approach to complex problems"}}
  ],
  "recommendations": [
    {{"priority": "high", "action": "Focus on Science for 2 hrs daily", "reason": "Lowest scoring subject"}}
  ],
  "motivational_message": "Encouraging message personalized for this student"
}}
"""
    result = _chat(system, user, temperature=0.6, json_mode=True)
    return json.loads(result)


# ── 4. Roadmap Generator ──────────────────────────────────────────────────
def generate_roadmap(analysis_data: dict, subjects_focus: list, user_context: dict,
                     duration_weeks: int = 12, language: str = 'en') -> dict:
    """
    Generate personalized learning roadmap based on analysis.
    Uses LLM knowledge - works for any subject/curriculum.
    """
    lang_name = get_language_name(language)
    system = (
        f"You are an expert academic planner who creates personalized, realistic study roadmaps. "
        f"Base your plans on general pedagogical knowledge - no external resources needed. "
        f"Respond entirely in {lang_name}."
    )
    user = f"""
Create a {duration_weeks}-week personalized learning roadmap for this student.

Student Profile: {json.dumps(user_context)}
Analysis Results: {json.dumps(analysis_data)}
Priority Subjects: {', '.join(subjects_focus)}
Language: {lang_name}

Create a practical, week-by-week plan. Respond with JSON:
{{
  "title": "Your Personal Learning Journey - [Student Name]",
  "description": "Overall roadmap description",
  "duration_weeks": {duration_weeks},
  "weekly_study_hours": 15,
  "milestones": [
    {{
      "week": 1,
      "title": "Foundation Building",
      "phase": "Assessment & Foundation",
      "focus_subjects": ["Math", "Science"],
      "daily_tasks": [
        {{"day": "Monday", "subject": "Math", "topic": "Algebra Basics", "duration_min": 60, "activity": "Practice problems"}}
      ],
      "goals": ["Complete 20 algebra practice problems", "Review science chapter 1-3"],
      "checkpoints": "Self-test at end of week",
      "tips": "Study advice for this week"
    }}
  ],
  "milestone_checkpoints": [
    {{"at_week": 4, "title": "Month 1 Review", "what_to_check": "Test scores improvement"}}
  ]
}}
"""
    result = _chat(system, user, temperature=0.7, json_mode=True)
    return json.loads(result)


# ── 5. Practice Question Generator ───────────────────────────────────────
def generate_practice_questions(subject: str, topic: str, difficulty: str,
                                  num_questions: int, grade_level: str,
                                  language: str = 'en') -> dict:
    """
    Generate practice Q&A using LLM knowledge.
    No external question bank needed - purely model knowledge.
    """
    lang_name = get_language_name(language)
    system = (
        f"You are an expert {subject} teacher. Generate high-quality practice questions "
        f"appropriate for {grade_level} students. Respond in {lang_name}."
    )
    user = f"""
Generate {num_questions} {difficulty} difficulty practice questions for:
- Subject: {subject}
- Topic: {topic}  
- Grade Level: {grade_level}
- Language: {lang_name}

Mix question types: MCQ, short answer, fill-in-the-blank.
For MCQ, provide 4 options with the correct answer.

Respond with JSON:
{{
  "subject": "{subject}",
  "topic": "{topic}",
  "difficulty": "{difficulty}",
  "questions": [
    {{
      "id": 1,
      "type": "mcq",
      "question": "What is...?",
      "options": ["A. ...", "B. ...", "C. ...", "D. ..."],
      "correct_answer": "A",
      "explanation": "Because...",
      "marks": 2
    }},
    {{
      "id": 2,
      "type": "short_answer",
      "question": "Explain...",
      "model_answer": "The answer is...",
      "key_points": ["point 1", "point 2"],
      "marks": 5
    }}
  ]
}}
"""
    result = _chat(system, user, temperature=0.8, json_mode=True)
    return json.loads(result)


# ── 6. Answer Evaluation ─────────────────────────────────────────────────
def evaluate_answer(question: str, model_answer: str, student_answer: str,
                    subject: str, language: str = 'en') -> dict:
    """Evaluate a student's answer and provide feedback."""
    lang_name = get_language_name(language)
    system = f"You are a fair and constructive {subject} examiner. Respond in {lang_name}."
    user = f"""
Evaluate this student's answer:

Question: {question}
Model Answer: {model_answer}
Student's Answer: {student_answer}

Respond with JSON:
{{
  "score": <0-10>,
  "percentage": <0-100>,
  "verdict": "Correct/Partially Correct/Incorrect",
  "feedback": "Detailed helpful feedback",
  "what_was_good": "What student got right",
  "what_to_improve": "Specific improvement tips",
  "encouraged_message": "Short encouraging note"
}}
"""
    result = _chat(system, user, temperature=0.3, json_mode=True)
    return json.loads(result)


# ── 7. AI Chatbot (Context-aware) ────────────────────────────────────────
def chat_with_ai(message: str, conversation_history: list, user_context: dict,
                  subject_context: Optional[str] = None, language: str = 'en') -> str:
    """
    Context-aware AI tutor chatbot.
    Maintains conversation history, knows student profile.
    """
    lang_name = get_language_name(language)
    system = (
        f"You are EduAI, a friendly and expert AI tutor. "
        f"You help students learn effectively with patience and encouragement. "
        f"Student name: {user_context.get('name', 'Student')}. "
        f"Grade: {user_context.get('grade_level', 'Not specified')}. "
        + (f"Current subject focus: {subject_context}. " if subject_context else "")
        + f"Always respond in {lang_name}. "
        f"Keep answers clear, educational, and appropriately detailed. "
        f"If asked something outside academics, gently redirect to studies."
    )

    # Build messages with history
    messages = [{"role": "system", "content": system}]
    for msg in conversation_history[-10:]:   # last 10 messages for context
        messages.append({"role": msg["role"], "content": msg["content"]})
    messages.append({"role": "user", "content": message})

    response = client.chat.completions.create(
        model=MODEL,
        messages=messages,
        temperature=0.8
    )
    return response.choices[0].message.content


# ── 8. Revision Material Generator ───────────────────────────────────────
def generate_revision_material(subject: str, weak_topics: list, grade_level: str,
                                 language: str = 'en') -> dict:
    """Generate concise revision notes for weak topics."""
    lang_name = get_language_name(language)
    system = (
        f"You are an expert {subject} teacher creating revision materials. "
        f"Use the model's knowledge to create clear, concise notes. Respond in {lang_name}."
    )
    user = f"""
Create revision materials for a {grade_level} student for these weak topics in {subject}:
{json.dumps(weak_topics)}

Respond with JSON:
{{
  "subject": "{subject}",
  "materials": [
    {{
      "topic": "topic name",
      "summary": "2-3 line key concept summary",
      "key_points": ["point 1", "point 2", "point 3"],
      "common_mistakes": ["mistake 1", "mistake 2"],
      "memory_tip": "Mnemonic or tip to remember",
      "practice_hint": "Quick exercise to reinforce"
    }}
  ]
}}
"""
    result = _chat(system, user, temperature=0.7, json_mode=True)
    return json.loads(result)


# ── 9. Exam Prep Q&A Session ─────────────────────────────────────────────
def generate_exam_prep_session(subjects: list, exam_type: str, grade_level: str,
                                  language: str = 'en') -> dict:
    """Generate a structured exam preparation Q&A session."""
    lang_name = get_language_name(language)
    system = (
        f"You are an exam preparation expert. Create realistic exam-style questions. "
        f"Respond in {lang_name}."
    )
    user = f"""
Create an exam prep session for:
- Exam Type: {exam_type}
- Subjects: {', '.join(subjects)}
- Grade Level: {grade_level}
- Language: {lang_name}

Respond with JSON:
{{
  "session_title": "...",
  "duration_minutes": 45,
  "total_marks": 50,
  "sections": [
    {{
      "subject": "Math",
      "questions": [
        {{
          "id": 1,
          "question": "...",
          "type": "mcq/short/long",
          "marks": 2,
          "options": ["A", "B", "C", "D"],
          "answer": "...",
          "hint": "Think about..."
        }}
      ]
    }}
  ]
}}
"""
    result = _chat(system, user, temperature=0.8, json_mode=True)
    return json.loads(result)
