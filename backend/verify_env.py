import os
import sys
import asyncio
from app.core.config import settings

async def verify_environment():
    print("=" * 60)
    print(" AI Mock Interview Coach — Environment Verification")
    print("=" * 60)
    
    print(f"• Python Version: {sys.version.split()[0]}")
    print(f"• Server Name:    {settings.PROJECT_NAME} (v{settings.VERSION})")
    print(f"• Selected LLM:   {settings.OPENAI_MODEL}")
    print(f"• Selected STT:   {settings.WHISPER_MODEL}")
    print(f"• Max Upload Size:{settings.MAX_AUDIO_UPLOAD_SIZE_MB} MB")
    
    if not settings.OPENAI_API_KEY or settings.OPENAI_API_KEY.startswith("your_"):
        print("\n[NOTE] OPENAI_API_KEY is not set or using placeholder.")
        print("       The backend will operate in resilient Demo/Mock mode with fallback question banks.")
    else:
        masked = settings.OPENAI_API_KEY[:6] + "..." + settings.OPENAI_API_KEY[-4:]
        print(f"\n[OK] OPENAI_API_KEY detected ({masked})")
        
        try:
            from openai import AsyncOpenAI
            client = AsyncOpenAI(api_key=settings.OPENAI_API_KEY)
            # Lightweight test call
            res = await client.chat.completions.create(
                model=settings.OPENAI_MODEL,
                messages=[{"role": "user", "content": "Respond with 'ready'"}],
                max_tokens=5
            )
            print(f"[OK] OpenAI API connection verified: {res.choices[0].message.content.strip()}")
        except Exception as e:
            print(f"[WARNING] OpenAI test call failed: {e}")
            print("          Backend will use fallback question generation if API calls fail.")
            
    print("\n" + "=" * 60)
    print(" Ready to launch backend: uvicorn app.main:app --reload --port 8000")
    print("=" * 60)

if __name__ == "__main__":
    asyncio.run(verify_environment())
