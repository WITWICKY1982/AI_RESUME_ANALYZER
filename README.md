# AI Resume Analyzer

An AI-powered tool that compares a candidate's resume against a specific job description and generates a detailed match report — including a match score, skill gaps, tailored resume edits, and likely interview questions.

Built with Python, Streamlit, and Google's Gemini API.

## Features

- Upload a resume PDF and a job description PDF
- Extracts and reads text from both documents automatically
- Generates a structured AI report covering:
  1. Match Summary
  2. Match Score (out of 100)
  3. Matching Skills
  4. Missing or Weak Areas
  5. Suggested Resume Edits
  6. Suitable Alternative Roles
  7. Interview Questions
- Download the full report as a PDF
- Clear error handling for missing files, unreadable PDFs, and empty/scanned documents

## Demo

*(Add your deployed app link and/or demo video link here once available)*

## Tech Stack

- **Python** — core logic
- **Streamlit** — web interface
- **Google Gemini API** — AI analysis
- **pypdf** — PDF text extraction
- **reportlab** — PDF report generation
- **python-dotenv** — local environment variable management

## Setup (Local)

1. Clone this repository
2. Create a virtual environment and activate it:
   ```
   python -m venv .venv
   .venv\Scripts\activate      # Windows
   source .venv/bin/activate   # Mac/Linux
   ```
3. Install dependencies:
   ```
   pip install -r requirements.txt
   ```
4. Create a `.env` file in the project root with your Gemini API key:
   ```
   GEMINI_API_KEY=your-api-key-here
   ```
5. Run the app:
   ```
   streamlit run app.py
   ```

## Deployment

This app is deployable on [Streamlit Community Cloud](https://share.streamlit.io). When deploying:
- Do **not** upload your `.env` file (it's excluded via `.gitignore`)
- Add your API key instead under the app's **Settings → Secrets** as:
  ```
  GEMINI_API_KEY = "your-api-key-here"
  ```

## How It Works

1. User uploads a resume PDF and a job description PDF
2. Text is extracted from both using `pypdf`
3. A structured prompt is built combining both documents
4. The prompt is sent to the Gemini API for analysis
5. The AI-generated report is displayed on screen and available as a downloadable PDF

## Project Structure

```
├── app.py              # Main Streamlit application
├── requirements.txt    # Python dependencies
├── .env                # Local API key (not committed to Git)
└── README.md           # This file
```

## Future Improvements

- Support for multiple resume comparisons at once (batch mode)
- Option for users to supply their own API key
- Downloadable report as formatted Word document
- Support for plain text/DOCX resume uploads, not just PDF

## Author

Built by [Your Name] as part of an AI freelance portfolio.
