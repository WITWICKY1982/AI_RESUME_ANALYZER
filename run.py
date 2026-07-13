import subprocess
import sys
import os

# Define required third-party packages
REQUIRED_PACKAGES = {
    "fastapi": "fastapi",
    "uvicorn": "uvicorn",
    "python-multipart": "multipart",  # Note: imported as 'multipart'
    "pydantic": "pydantic",
    "google-genai": "google.genai",
    "pypdf": "pypdf",
    "reportlab": "reportlab",
    "python-dotenv": "dotenv"
}

def install_and_verify():
    print("Checking python package dependencies...")
    for pkg_name, import_name in REQUIRED_PACKAGES.items():
        try:
            # Special check for python-multipart
            if pkg_name == "python-multipart":
                import multipart
            else:
                __import__(import_name)
            print(f"  [OK] {pkg_name} is installed")
        except ImportError:
            print(f"  [MISSING] {pkg_name} is missing. Installing...")
            try:
                subprocess.check_call([sys.executable, "-m", "pip", "install", pkg_name])
                print(f"  [OK] Successfully installed {pkg_name}")
            except Exception as e:
                print(f"  [ERROR] Failed to install {pkg_name} automatically: {e}")
                print(f"  Please run: pip install {pkg_name}")
                sys.exit(1)

if __name__ == "__main__":
    install_and_verify()
    
    print("\nStarting AI Resume Analyzer server at http://127.0.0.1:8000 ...")
    
    # Import uvicorn locally to ensure it is loaded after potential installation
    try:
        import uvicorn
    except ImportError:
        print("[!] Uvicorn import failed. Please restart this script.")
        sys.exit(1)
        
    uvicorn.run("server:app", host="127.0.0.1", port=8000, reload=True)
