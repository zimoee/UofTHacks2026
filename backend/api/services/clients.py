import os
from google import genai
from twelvelabs import TwelveLabs
from dotenv import load_dotenv

load_dotenv()

gemini = genai.Client(api_key=os.getenv("GEMINI_API_KEY"))
# twelve = TwelveLabs(api_key=os.getenv("TL_API_KEY"))
