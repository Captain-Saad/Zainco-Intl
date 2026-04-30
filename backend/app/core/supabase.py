import os
import anyio
import httpx
from fastapi import HTTPException
from supabase import create_client, Client, ClientOptions
from app.core.config import get_settings

settings = get_settings()

def get_supabase() -> Client:
    """Initialize and return a Supabase client."""
    # 1800 seconds = 30 minutes timeout for storage operations
    options = ClientOptions(storage_client_timeout=1800)
    url = settings.supabase_url or os.environ.get("SUPABASE_URL")
    key = settings.supabase_key or os.environ.get("SUPABASE_KEY")
    return create_client(url, key, options=options)

async def upload_file(bucket: str, path: str, file_content: bytes, content_type: str):
    """Upload a file to Supabase Storage using direct HTTP (Fast & Reliable)."""
    clean_path = path.lstrip("/")
    url = f"{settings.supabase_url}/storage/v1/object/{bucket}/{clean_path}"
    
    headers = {
        "Authorization": f"Bearer {settings.supabase_key}",
        "Content-Type": content_type,
        "x-upsert": "true"
    }

    print(f"DEBUG: Starting direct HTTP upload to {bucket}/{clean_path}...")
    
    # Increase timeout to 30 minutes (1800 seconds)
    async with httpx.AsyncClient(timeout=httpx.Timeout(1800.0)) as client:
        try:
            response = await client.post(url, content=file_content, headers=headers)
            response.raise_for_status()
            print(f"DEBUG: Direct upload successful: {response.json()}")
            return response.json()
        except Exception as e:
            print(f"DEBUG: Direct upload failed: {str(e)}")
            if hasattr(e, 'response') and e.response:
                error_data = e.response.json()
                if e.response.status_code == 413 or error_data.get("statusCode") == "413":
                    raise HTTPException(
                        status_code=413,
                        detail="File too large for Supabase. Please increase the 'Max File Size' in your Supabase Storage Settings (Dashboard > Storage > Settings)."
                    )
                print(f"DEBUG: Error details: {e.response.text}")
            raise e

async def get_signed_url(bucket: str, path: str, expires_in: int = 3600):
    """Generate a signed URL for a file in Supabase Storage."""
    supabase = get_supabase()
    clean_path = path.lstrip("/")
    
    def _get_url():
        return supabase.storage.from_(bucket).create_signed_url(clean_path, expires_in)

    try:
        res = await anyio.to_thread.run_sync(_get_url)
        print(f"DEBUG: Supabase response for signed URL: {res}")
        if isinstance(res, str): return res
        if isinstance(res, dict): 
            return res.get("signedURL") or res.get("signed_url") or res.get("url")
        # Handle cases where it might be an object with these attributes
        if hasattr(res, "signed_url"): return res.signed_url
        if hasattr(res, "url"): return res.url
        return None
    except Exception as e:
        print(f"DEBUG: CRITICAL Signed URL error: {str(e)}")
        import traceback
        traceback.print_exc()
        return None

async def delete_file(bucket: str, path: str):
    """Delete a file from Supabase Storage."""
    if not path: return
    supabase = get_supabase()
    clean_path = path.lstrip("/")
    
    def _delete():
        return supabase.storage.from_(bucket).remove([clean_path])

    try:
        await anyio.to_thread.run_sync(_delete)
        print(f"DEBUG: Deleted {clean_path} from {bucket}")
    except Exception as e:
        print(f"DEBUG: Failed to delete {clean_path} from {bucket}: {str(e)}")

def get_public_url(bucket: str, path: str):
    """Get the public URL for a file in Supabase Storage."""
    supabase = get_supabase()
    return supabase.storage.from_(bucket).get_public_url(path.lstrip("/"))
