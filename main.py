import os
from dotenv import load_dotenv
from pypdf import PdfReader
from google import genai
load_dotenv()
client = genai.Client(
 api_key = os.getenv("GEMINI_API_KEY")
)
input_resume = input("ENTER RESUME HERE")
reader = PdfReader(input_resume)
resume_text = ""
for page in reader.pages:
    resume_text+=page.extract_text()


prompt = f"""You are an expert AI Resume Reviewer.

Analyze the resume provided below.

Generate a professional report with the following sections:

1. Candidate Summary (2-3 lines)

2. Skills Identified
- Technical Skills
- Soft Skills

3. Strengths
- List the strongest aspects of the resume.

4. Weaknesses
- Mention missing skills, unclear sections, or improvements.

5. ATS Score
Give a score out of 100 and explain why.

6. Suggested Improvements
Provide actionable recommendations to improve the resume.

7. Suitable Job Roles
Suggest 5 job roles based on the resume.

8. Interview Questions
Generate 5 technical or behavioral interview questions based on the resume.

Keep the report professional, concise, and well-organized.

Resume:

{resume_text}
"""
response = client.models.generate_content(
        model="gemini-2.5-flash",
        contents=prompt
    )
print(response.text)
   

