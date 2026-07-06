import os
from dotenv import load_dotenv
import sys
from pypdf import PdfReader
from google import genai
load_dotenv()
def get_client():
   api_key = os.getenv("GEMINI_API_KEY")
   if not api_key:
       print("ERROR API KEY NOT FOUND.CHECK .env File")
       sys.exit(1)
   return genai.Client(api_key=api_key)

def extract_resume():
    input_resume = input("ENTER RESUME HERE")
    try:
        reader = PdfReader(input_resume)
    except Exception as e:
        print("ERROR:{e}")
        sys.exit(1)
    resume_text = ""
    for page in reader.pages:
        resume_text+=page.extract_text()
    return resume_text


def build_prompt(resume_text):


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
    return prompt

def response_ai(prompt,client):

    response = client.models.generate_content(
        model="gemini-2.5-flash",
        contents=prompt
     )
    return response.text

   
def main():
    client = get_client()
    resume_text = extract_resume()
    prompt = build_prompt(resume_text)
    result = response_ai(prompt,client)
    print(result)

if __name__ == "__main__":
    main()   


