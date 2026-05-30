# -*- coding: utf-8 -*-
from pathlib import Path
from urllib.parse import unquote
from fastapi import APIRouter, HTTPException, Request
from starlette.responses import FileResponse

from ..agent_context import get_agent_for_request

router = APIRouter(prefix="/files", tags=["files"])


def _is_relative_to(path: Path, root: Path) -> bool:
    try:
        path.relative_to(root)
        return True
    except ValueError:
        return False


@router.api_route(
    "/preview/{filepath:path}",
    methods=["GET", "HEAD"],
    summary="Preview file",
)
async def preview_file(
    request: Request,
    filepath: str,
):
    """Preview file."""
    workspace = await get_agent_for_request(request)
    workspace_dir = Path(workspace.workspace_dir).expanduser().resolve()
    normalized = unquote(filepath)

    # Normalize /C:/... to C:/... on Windows.
    if (
        len(normalized) >= 4
        and normalized[0] == "/"
        and normalized[2] == ":"
        and normalized[1].isalpha()
    ):
        normalized = normalized[1:]

    path = Path(normalized)
    if not path.is_absolute():
        path = workspace_dir / normalized
    path = path.expanduser().resolve()
    if not _is_relative_to(path, workspace_dir):
        raise HTTPException(
            status_code=403,
            detail="File preview is limited to the current agent workspace",
        )
    if not path.is_file():
        raise HTTPException(status_code=404, detail="Not found")
    return FileResponse(path, filename=path.name)
