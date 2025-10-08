"""
1 protected routes, Create, Update, Delete, can be done by user with roles admin and agent
2 List and List by id are open to all
"""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from app.database import get_db
from app.dependencies import get_current_user # Assuming you have a general get_current_user
from app.operations import category as category_ops
from app.schemas import category as category_schema
from app.models.user import UserRole
from app.models.category import Category
from app.models.subcategory import Subcategory
from app.models import User 

router = APIRouter(prefix="/categories", tags=["Categories"])

# Dependency

@router.get("/", response_model=List[category_schema.Category])
def read_categories(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    
):
    """
   every user can see all categories and subcategories count
    """
    return category_ops.all_categories(db)

#everybody can see category by id, having subcategories(Id, Name)
@router.get("/{category_id}", response_model=category_schema.Category)
def read_category_by_id(
    category_id: int,
    db: Session = Depends(get_db),
    
):
    """
    Retrieves a category by ID, including its subcategories.
    """
    return category_ops.category_by_id(db, category_id)

#only admin and agent can create, update, delete category
@router.post("/", response_model=category_schema.Category)
def create_category(
    category_data: category_schema.CategoryCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
    
):
    """
    Creates a new category.
    """
    if(current_user.role != UserRole.admin and current_user.role != UserRole.agent):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="You do not have permission to create a category.")
    return category_ops.create_category(db, category_data)

@router.put("/{category_id}", response_model=category_schema.Category)
def update_category(
    category_id: int,
    category_data: category_schema.CategoryUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Updates an existing category.
    """
    if(current_user.role != UserRole.admin and current_user.role != UserRole.agent):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="You do not have permission to update a category.")
    return category_ops.update_category(db, category_id, category_data)

@router.delete("/{category_id}", response_model=category_schema.Category)
def delete_category(
    category_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Deletes a category.
    """
    if(current_user.role != UserRole.admin and current_user.role != UserRole.agent):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="You do not have permission to delete a category.")
    return category_ops.delete_category(db, category_id)


#Post request to create sub-category under category, raise no category founder under {id}
@router.post("/{category_id}/subcategories", response_model=category_schema.Subcategory)
def create_subcategory_with_category_id(
    category_id: int,
    subcategory_data: category_schema.SubcategoryCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Creates a new subcategory under a specific category.
    """
    if(current_user.role != UserRole.admin and current_user.role != UserRole.agent):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="You do not have permission to create a subcategory.")
    #if category_id is not valid raise error
    if not db.query(Category).filter(Category.id == category_id).first():
        raise HTTPException(status_code=404, detail="Category not found under {id}")
    return category_ops.create_subcategory_with_category_id(db, subcategory_data, category_id)


@router.get("/{category_id}/subcategories", response_model=List[category_schema.Subcategory])
def get_subcategories_by_category(
    category_id: int,
    db: Session = Depends(get_db)
):
    """
    Get all subcategories for a specific category.
    """
    # Check if category exists
    if not db.query(Category).filter(Category.id == category_id).first():
        raise HTTPException(status_code=404, detail="Category not found")
    return category_ops.get_subcategories_by_category(db, category_id)


@router.post("/{category_id}/assign-agent")
def assign_agent_to_category(
    category_id: int,
    agent_data: dict,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Assigns an agent to a category (admin only).
    """
    # Only admin can assign agents to categories
    if current_user.role != UserRole.admin:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only admins can assign agents to categories."
        )
    
    # Validate category exists
    category = db.query(Category).filter(Category.id == category_id).first()
    if not category:
        raise HTTPException(status_code=404, detail="Category not found")
    
    agent_id = agent_data.get("agent_id")
    if not agent_id:
        raise HTTPException(status_code=400, detail="Agent ID is required")
    
    # Validate agent exists and is actually an agent
    agent = db.query(User).filter(User.id == agent_id, User.role == UserRole.agent).first()
    if not agent:
        raise HTTPException(status_code=404, detail="Agent not found")
    
    return category_ops.assign_agent_to_category(db, category_id, agent_id)


@router.delete("/{category_id}/unassign-agent/{agent_id}")
def unassign_agent_from_category(
    category_id: int,
    agent_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Unassigns an agent from a category (admin only).
    """
    # Only admin can unassign agents from categories
    if current_user.role != UserRole.admin:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only admins can unassign agents from categories."
        )
    
    return category_ops.unassign_agent_from_category(db, category_id, agent_id)





