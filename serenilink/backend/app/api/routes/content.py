from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from app.api.deps import get_db, require_admin
from app.models.content import Content
from app.schemas.content import ContentCreate, ContentUpdate, ContentOut

router = APIRouter(prefix="/content", tags=["Content"])

@router.get("/", response_model=list[ContentOut])
def list_content(
    db: Session = Depends(get_db),
    q: str | None = None,
    category: str | None = None,
    skip: int = 0,
    limit: int = Query(default=10, le=50),
):
    query = db.query(Content).filter(Content.is_published == True)

    if category:
        query = query.filter(Content.category.ilike(category))

    if q:
        like = f"%{q}%"
        query = query.filter(
            (Content.title.ilike(like)) | 
            (Content.summary.ilike(like)) |
            (Content.body.ilike(like)) |
            (Content.tags.ilike(like))
        )
    return query.order_by(Content.created_at.desc()).offset(skip).limit(limit).all()

@router.get("/{content_id}", response_model=ContentOut)
def get_content(content_id: int, db: Session = Depends(get_db)):
    item = db.query(Content).filter(Content.id == content_id, Content.is_published == True).first()
    if not item:
        raise HTTPException(status_code=404, detail="Content not found")
    return item


@router.post("/", response_model=ContentOut, status_code=201)
def create_content(
    payload: ContentCreate,
    db: Session = Depends(get_db),
    _admin=Depends(require_admin),
):
    item = Content(**payload.model_dump())
    db.add(item)
    db.commit()
    db.refresh(item)
    return item


@router.put("/{content_id}", response_model=ContentOut)
def update_content(
    content_id: int,
    payload: ContentUpdate,
    db: Session = Depends(get_db),
    _admin=Depends(require_admin),
):
    item = db.query(Content).filter(Content.id == content_id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Content not found")

    data = payload.model_dump(exclude_unset=True)
    for k, v in data.items():
        setattr(item, k, v)

    db.commit()
    db.refresh(item)
    return item


@router.delete("/{content_id}", status_code=204)
def delete_content(
    content_id: int,
    db: Session = Depends(get_db),
    _admin=Depends(require_admin),
):
    item = db.query(Content).filter(Content.id == content_id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Content not found")

    db.delete(item)
    db.commit()
    return None