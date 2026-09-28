from pathlib import Path, PureWindowsPath

from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import FileResponse

from app.api.deps import require_admin

router = APIRouter(prefix="/files", tags=["Files"])
UPLOAD_DIR = Path("uploads")


def resolve_upload(file_path: str) -> Path:
    # Reject Windows path syntax on every platform, including drive-relative
    # paths, UNC paths, alternate data streams, and backslash traversal.
    if not file_path or "\\" in file_path or ":" in file_path or "\x00" in file_path:
        raise HTTPException(status_code=404, detail="File not found")
    relative = Path(file_path)
    if relative.is_absolute() or PureWindowsPath(file_path).drive or ".." in relative.parts:
        raise HTTPException(status_code=404, detail="File not found")
    try:
        root = UPLOAD_DIR.resolve()
        target = (root / relative).resolve(strict=True)
        # resolve() also prevents a symlink inside uploads escaping the root.
        if not target.is_relative_to(root) or not target.is_file():
            raise ValueError("Not an uploaded file")
    except (OSError, RuntimeError, ValueError):
        raise HTTPException(status_code=404, detail="File not found") from None
    return target


@router.get("/{file_path:path}")
def protected_file(file_path: str, _admin=Depends(require_admin)):
    # Applications are submitted anonymously and have no verified owner ID.
    # An email match must never grant access to private application documents.
    path = resolve_upload(file_path)
    return FileResponse(
        path,
        filename=path.name,
        headers={"Cache-Control": "no-store", "X-Content-Type-Options": "nosniff"},
    )
