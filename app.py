import os
from dotenv import load_dotenv
import pandas as pd
import sys
from pypdf import PdfReader
import streamlit as st
from google import genai
import io
from reportlab.lib.pagesizes import letter
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer
from reportlab.lib.styles import getSampleStyleSheet
load_dotenv()
def get_client():
    api_key = os.getenv("GEMINI_API_KEY") or st.secrets.get("GEMINI_API_KEY")
    if not api_key:
        st.error("ERROR API KEY NOT FOUND. CHECK .env File or Streamlit Secrets")
        st.stop()
    return genai.Client(api_key=api_key)

def extract_resume():
    uploaded_file = st.file_uploader("Choose a Resume pdf",type = ["pdf"])
    if uploaded_file is None:
        return None
    try:
        reader = PdfReader(uploaded_file)
    except Exception as e:
        st.error(f"ERROR:{e}")
        st.stop()
    resume_text = ""
    for page in reader.pages:
        resume_text+=page.extract_text()
    if not  resume_text.strip():
        st.error("FILE IS EMPTY")
        st.stop()
    return resume_text
def job_profile():
    upload_job_profile = st.file_uploader("CHOOSE YOUR JOB PROFILE",type = ["pdf"])
    if upload_job_profile is None:
        return None
    try:
        profile_read = PdfReader(upload_job_profile)
    except Exception as j:
        st.error(f"ERROR:{j}")
        st.stop()
    job_Page =""
    for f in profile_read.pages:
        job_Page+=f.extract_text()
    if not job_Page.strip():
        st.error("FILE IS EMPTY")
        st.stop()
    return job_Page

def build_prompt(resume_text, job_Page):

    prompt = f"""You are an expert AI Resume Reviewer and Career Coach.

    Compare the candidate's resume against the job description provided below,
    and generate a professional report with the following sections:

    1. Match Summary (2-3 lines)
    - Briefly state how well this resume fits this specific job.

    2. Match Score
    - Give a score out of 100 representing how well the resume matches this job description.
    - Explain the score based on skills, experience, and keyword alignment.

    3. Matching Skills
    - List skills and experience from the resume that align with the job description.

    4. Missing or Weak Areas
    - List required skills, keywords, or experience from the job description
      that are missing or weakly represented in the resume.

    5. Suggested Resume Edits
    - Give specific, actionable edits to better tailor this resume to this job description.
    - Where possible, suggest exact phrasing changes or additions.

    6. Suitable Alternative Roles
    - If the match is weak, suggest 3 alternative job roles that better fit this resume.

    7. Interview Questions
    - Generate 5 interview questions this candidate is likely to be asked for this specific role,
      based on both the resume and the job description.

    Keep the report professional, concise, and well-organized.

    Job Description:

    {job_Page}

    Resume:

    {resume_text}
    """
    return prompt
  
def response_ai(prompt,client):

    response = client.models.generate_content(
        model="gemini-2.5-flash",
        contents=prompt
     )
    return response.text

def generate_pdf(report_text):
    buffer = io.BytesIO()
    doc = SimpleDocTemplate(buffer, pagesize=letter)
    styles = getSampleStyleSheet()
    story = []

    for line in report_text.split("\n"):
        if line.strip() == "":
            story.append(Spacer(1, 8))
        else:
            story.append(Paragraph(line, styles["Normal"]))

    doc.build(story)
    buffer.seek(0)
    return buffer

st.title("AI Resume Analyzer")
resume_text = extract_resume()
job_text = job_profile()

if resume_text and job_text:
    client = get_client()
    prompt = build_prompt(resume_text,job_text)
    result = response_ai(prompt, client)
    st.markdown(result)
    pdf_buffer = generate_pdf(result)

    st.download_button(
    label="Download Report as PDF",
    data=pdf_buffer,
    file_name="resume_report.pdf",
    mime="application/pdf"
    )


