import os
import io
import json
from typing import List, Optional
from fastapi import FastAPI, UploadFile, File, Form, HTTPException
from fastapi.responses import StreamingResponse
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from pypdf import PdfReader
from google import genai
from google.genai import types
from dotenv import load_dotenv
from reportlab.lib.pagesizes import letter
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer
from reportlab.lib.styles import getSampleStyleSheet
from reportlab.lib import colors
from reportlab.lib.styles import ParagraphStyle

# Load environment variables
load_dotenv()

app = FastAPI(title="AI Resume Analyzer API")

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- Pydantic Schemas for Gemini Structured Output ---

class ResumeEdit(BaseModel):
    section: str = Field(description="The section of the resume (e.g. Work Experience, Skills, Summary, Education)")
    original_text: str = Field(description="The original text or description in the resume that needs improvement, or empty if it is a new addition")
    suggested_text: str = Field(description="The suggested new text or phrasing")
    reason: str = Field(description="Why this change is suggested and what impact it has")

class InterviewQuestion(BaseModel):
    question: str = Field(description="The interview question the candidate is likely to face")
    suggested_answer: str = Field(description="A brief guide or key points on how the candidate should answer this question based on their profile")

class AnalysisResult(BaseModel):
    match_score: int = Field(description="Score between 0 and 100 representing how well the resume matches the job description")
    match_summary: str = Field(description="A 2-3 line executive summary of the match quality")
    matching_skills: List[str] = Field(description="List of skills and experience present in both the resume and the job description")
    missing_skills: List[str] = Field(description="List of skills or keywords present in the job description but missing/weak in the resume")
    suggested_edits: List[ResumeEdit] = Field(description="List of actionable, specific edits to tailor the resume to the job description")
    alternative_roles: List[str] = Field(description="List of 3 alternative job roles that fit this resume well if the match is weak")
    interview_questions: List[InterviewQuestion] = Field(description="List of 5 specific interview questions with guidance")

# --- Helper Functions ---

def extract_text_from_pdf(file_bytes: bytes) -> str:
    try:
        reader = PdfReader(io.BytesIO(file_bytes))
        text = ""
        for page in reader.pages:
            t = page.extract_text()
            if t:
                text += t
        return text
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Failed to parse PDF file: {str(e)}")

def build_pdf_report(data: dict) -> io.BytesIO:
    buffer = io.BytesIO()
    # Set standard letter size with 0.5 inch (36 points) margins for high readability
    doc = SimpleDocTemplate(buffer, pagesize=letter, leftMargin=36, rightMargin=36, topMargin=36, bottomMargin=36)
    styles = getSampleStyleSheet()
    
    # Custom styles
    title_style = ParagraphStyle(
        'DocTitle',
        parent=styles['Heading1'],
        fontName='Helvetica-Bold',
        fontSize=24,
        leading=28,
        textColor=colors.HexColor('#0f172a'), # slate-900
        spaceAfter=15
    )
    
    heading2_style = ParagraphStyle(
        'DocHeading2',
        parent=styles['Heading2'],
        fontName='Helvetica-Bold',
        fontSize=14,
        leading=18,
        textColor=colors.HexColor('#4f46e5'), # indigo-600
        spaceBefore=14,
        spaceAfter=8,
        keepWithNext=True
    )

    body_style = ParagraphStyle(
        'DocBody',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=10,
        leading=14,
        textColor=colors.HexColor('#334155'), # slate-700
        spaceAfter=6
    )

    bold_body_style = ParagraphStyle(
        'DocBoldBody',
        parent=body_style,
        fontName='Helvetica-Bold'
    )
    
    story = []
    
    # Document Title
    story.append(Paragraph("AI Resume Analysis Report", title_style))
    story.append(Spacer(1, 10))
    
    # Match Score & Summary Card
    score = data.get("match_score", 0)
    summary = data.get("match_summary", "")
    
    story.append(Paragraph(f"<b>Overall Match Score:</b> {score}/100", bold_body_style))
    story.append(Paragraph(f"<b>Summary:</b> {summary}", body_style))
    story.append(Spacer(1, 12))
    
    # Matching Skills
    matching_skills = data.get("matching_skills", [])
    if matching_skills:
        story.append(Paragraph("Matching Skills & Experience", heading2_style))
        story.append(Paragraph(", ".join(matching_skills), body_style))
        story.append(Spacer(1, 8))
        
    # Missing Skills
    missing_skills = data.get("missing_skills", [])
    if missing_skills:
        story.append(Paragraph("Missing Skills & Knowledge Gaps", heading2_style))
        story.append(Paragraph(", ".join(missing_skills), body_style))
        story.append(Spacer(1, 8))
        
    # Suggested Edits
    suggested_edits = data.get("suggested_edits", [])
    if suggested_edits:
        story.append(Paragraph("Suggested Resume Edits", heading2_style))
        for edit in suggested_edits:
            section = edit.get("section", "General")
            orig = edit.get("original_text", "")
            sugg = edit.get("suggested_text", "")
            reason = edit.get("reason", "")
            
            p_text = f"<b>[{section}]</b><br/>"
            if orig:
                p_text += f"• <i>Current:</i> {orig}<br/>"
            p_text += f"• <i>Suggested:</i> {sugg}<br/>"
            p_text += f"• <i>Why:</i> {reason}"
            story.append(Paragraph(p_text, body_style))
            story.append(Spacer(1, 4))
        story.append(Spacer(1, 8))
        
    # Interview Prep
    questions = data.get("interview_questions", [])
    if questions:
        story.append(Paragraph("Interview Preparation Q&A", heading2_style))
        for i, q_item in enumerate(questions):
            q = q_item.get("question", "")
            ans = q_item.get("suggested_answer", "")
            story.append(Paragraph(f"<b>Q{i+1}: {q}</b>", bold_body_style))
            story.append(Paragraph(f"<i>Suggested Focus:</i> {ans}", body_style))
            story.append(Spacer(1, 4))
        story.append(Spacer(1, 8))
        
    # Alternative Roles
    roles = data.get("alternative_roles", [])
    if roles:
        story.append(Paragraph("Alternative Job Roles to Consider", heading2_style))
        story.append(Paragraph(", ".join(roles), body_style))
        
    doc.build(story)
    buffer.seek(0)
    return buffer

# --- API Endpoints ---

@app.get("/api/health")
def health():
    api_key = os.getenv("GEMINI_API_KEY")
    return {
        "status": "healthy",
        "api_key_configured": bool(api_key)
    }

@app.post("/api/analyze")
async def analyze(
    resume: UploadFile = File(...),
    job_desc_file: Optional[UploadFile] = File(None),
    job_desc_text: Optional[str] = Form(None)
):
    api_key = os.getenv("GEMINI_API_KEY")
    if not api_key:
        raise HTTPException(
            status_code=500,
            detail="GEMINI_API_KEY is not configured on the server. Please add it to your .env file."
        )

    # 1. Parse Resume
    resume_bytes = await resume.read()
    resume_text = extract_text_from_pdf(resume_bytes)
    if not resume_text.strip():
        raise HTTPException(status_code=400, detail="Uploaded Resume PDF appears to be empty.")

    # 2. Parse Job Description (PDF or raw text)
    job_text = ""
    if job_desc_file and job_desc_file.filename:
        job_bytes = await job_desc_file.read()
        job_text = extract_text_from_pdf(job_bytes)
    elif job_desc_text:
        job_text = job_desc_text

    if not job_text or not job_text.strip():
        raise HTTPException(
            status_code=400,
            detail="Please provide a job description (either upload a PDF or paste/type it in)."
        )

    # 3. Call Gemini with Structured Outputs
    try:
        client = genai.Client(api_key=api_key)
        prompt = f"""You are an expert AI Resume Reviewer and Career Coach.

Compare the candidate's resume against the job description provided below, and generate a highly detailed report containing score, skill match, gaps, edits, alternative paths, and interview prep questions.

Job Description:
{job_text}

Resume:
{resume_text}
"""
        response = client.models.generate_content(
            model="gemini-2.5-flash",
            contents=prompt,
            config=types.GenerateContentConfig(
                response_mime_type="application/json",
                response_schema=AnalysisResult,
            )
        )
        
        # Parse output JSON to ensure validity
        result_data = json.loads(response.text)
        return result_data
        
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Gemini AI analysis failed: {str(e)}"
        )

@app.post("/api/download-pdf")
async def download_pdf(data: dict):
    try:
        pdf_buffer = build_pdf_report(data)
        return StreamingResponse(
            pdf_buffer,
            media_type="application/pdf",
            headers={"Content-Disposition": "attachment; filename=resume_analysis_report.pdf"}
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to generate PDF download: {str(e)}")

# Serve Static files for the frontend dashboard
static_path = os.path.join(os.path.dirname(__file__), "static")
if not os.path.exists(static_path):
    os.makedirs(static_path)

app.mount("/", StaticFiles(directory=static_path, html=True), name="static")
