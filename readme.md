# 🤖 AI Resume Analyzer

An AI-powered Resume Analyzer built with **Python** and the **Google Gemini API**. This application reads a PDF resume, extracts all of its text, and generates a detailed AI-powered analysis, including strengths, weaknesses, ATS score, job role recommendations, and interview questions.

---

## 🚀 Features

- 📄 Reads PDF resumes
- 📚 Extracts text from every page
- 🤖 Uses Google Gemini AI for resume analysis
- 📋 Generates a professional report
- 💪 Identifies strengths
- ⚠️ Highlights weaknesses
- 📊 Provides an ATS score out of 100
- 💼 Suggests suitable job roles
- 🎯 Recommends resume improvements
- ❓ Generates interview questions

---

## 🛠️ Technologies Used

- Python
- Google Gemini API
- python-dotenv
- PyPDF
- Git
- GitHub

---

## 📂 Project Structure

```
AI_RESUME_ANALYZER/
│
├── main.py
├── sample_resume.pdf
├── .env
├── .gitignore
├── README.md
└── requirements.txt
```

---

## ⚙️ Installation

### Clone the repository

```bash
git clone https://github.com/YOUR_USERNAME/AI_RESUME_ANALYZER.git
cd AI_RESUME_ANALYZER
```

### Create a virtual environment

```bash
python -m venv .venv
```

### Activate the virtual environment

Windows

```bash
.venv\Scripts\activate
```

macOS/Linux

```bash
source .venv/bin/activate
```

### Install dependencies

```bash
pip install -r requirements.txt
```

---

## 🔑 Environment Variables

Create a `.env` file in the project directory.

Example:

```env
GEMINI_API_KEY=YOUR_API_KEY
```

---

## ▶️ Usage

Run the project:

```bash
python main.py
```

The program will ask for a PDF filename.

Example:

```
Enter the PDF filename:
sample_resume.pdf
```

The AI will analyze the resume and generate a detailed report.

---

## 📄 Sample Output

The generated report includes:

- Candidate Summary
- Technical Skills
- Soft Skills
- Strengths
- Weaknesses
- ATS Score
- Resume Improvement Suggestions
- Recommended Job Roles
- Interview Questions

---

## 🔄 Workflow

```
User
   │
   ▼
Enter PDF Filename
   │
   ▼
PyPDF Reads Resume
   │
   ▼
Extract Text From Every Page
   │
   ▼
Combine Resume Text
   │
   ▼
Create Prompt
   │
   ▼
Gemini API
   │
   ▼
AI Resume Analysis
   │
   ▼
Display Report
```

---

## 📈 Future Improvements

- Support DOCX resumes
- Save reports as PDF
- Export reports to Markdown
- Streamlit web interface
- Resume keyword matching
- Compare multiple resumes
- Upload resumes using drag-and-drop
- Job description matching
- ATS optimization suggestions

---

## 📚 What I Learned

This project helped me learn:

- Reading PDF files using PyPDF
- Extracting text from multiple pages
- Prompt Engineering
- Google Gemini API Integration
- Environment Variables (.env)
- Secure API Key Management
- Git & GitHub
- Building AI-powered automation applications

---

## 📜 License

This project is created for educational and portfolio purposes.