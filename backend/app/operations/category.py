# Category Operations and Subcategory Operations

"""
1 Create Category
2 Create Subcategory
3 Update Category
4 Update Subcategory
5 Delete Category
6 Delete Subcategory
7 All categories and count of subcategories
8 Category id provided to see list of name of cat and subcategories[ {id, name} ]
"""

from sqlalchemy.orm import Session, joinedload
from app.models.category import Category
from app.models.subcategory import Subcategory
from app.schemas.category import Category as category_schema
from app.schemas.category import Subcategory as subcategory_schema
from app.schemas.category import CategoryOut as category_out_schema
from app.schemas.category import SubcategoryOut as subcategory_out_schema
from sqlalchemy import func

def create_category(db: Session, category_data: category_schema):
    db_category = Category(**category_data.model_dump())
    db.add(db_category)
    db.commit()
    db.refresh(db_category)
    return db_category
    
def get_categories(db: Session):
    return db.query(Category).all()

def get_subcategories_by_category(db: Session, category_id: int):
    """Get all subcategories for a specific category."""
    return db.query(Subcategory).filter(Subcategory.category_id == category_id).all()

def get_all_subcategories(db: Session):
    """Get all subcategories with their parent category information."""
    return db.query(Subcategory).join(Category).all()

def create_subcategory(db: Session, subcategory_data: subcategory_schema):
    db_subcategory = Subcategory(**subcategory_data.model_dump())
    db.add(db_subcategory)
    db.commit()
    db.refresh(db_subcategory)
    return db_subcategory

def create_subcategory_with_category_id(db: Session, subcategory_data, category_id: int):
    """Create a subcategory under a specific category."""
    subcategory_dict = subcategory_data.model_dump()
    subcategory_dict['category_id'] = category_id
    db_subcategory = Subcategory(**subcategory_dict)
    db.add(db_subcategory)
    db.commit()
    db.refresh(db_subcategory)
    return db_subcategory

def update_category(db: Session, category_id: int, category_data: category_schema):
    db_category = db.query(Category).filter(Category.id == category_id).first()
    if db_category:
        for key, value in category_data.model_dump().items():
            setattr(db_category, key, value)
        db.commit()
        db.refresh(db_category)
    return db_category

def update_subcategory(db: Session, subcategory_id: int, subcategory_data: subcategory_schema):
    db_subcategory = db.query(Subcategory).filter(Subcategory.id == subcategory_id).first()
    if db_subcategory:
        for key, value in subcategory_data.model_dump().items():
            setattr(db_subcategory, key, value)
        db.commit()
        db.refresh(db_subcategory)
    return db_subcategory

def delete_category(db: Session, category_id: int):
    db_category = db.query(Category).filter(Category.id == category_id).first()
    if db_category:
        db.delete(db_category)
        db.commit()
    return db_category

def delete_subcategory(db: Session, subcategory_id: int):
    db_subcategory = db.query(Subcategory).filter(Subcategory.id == subcategory_id).first()
    if db_subcategory:
        db.delete(db_subcategory)
        db.commit()
    return db_subcategory

def all_categories(db: Session):
    """Get all categories with their assigned agents and subcategories count."""
    categories = db.query(Category).options(
        joinedload(Category.assigned_agents),
        joinedload(Category.subcategories)
    ).all()
    
    # Add subcategories count to each category
    for category in categories:
        category.subcategories_count = len(category.subcategories)
    
    return categories

def category_by_id(db: Session, category_id: int):
   """Get category by id with subcategories and assigned agents."""
   return db.query(Category).options(
       joinedload(Category.subcategories),
       joinedload(Category.assigned_agents)
   ).filter(Category.id == category_id).first()

def create_subcategory_with_category_id(db: Session, subcategory_data: subcategory_schema, category_id: int):
    #if category_id is not valid raise error
    db_subcategory = Subcategory(**subcategory_data.model_dump())
    db_subcategory.category_id = category_id
    db.add(db_subcategory)
    db.commit()
    db.refresh(db_subcategory)
    return db_subcategory   


def assign_agent_to_category(db: Session, category_id: int, agent_id: int):
    """
    Assigns an agent to a category by creating a record in agent_category_assignments.
    """
    from app.models.agent_category_assignment import AgentCategoryAssignment
    from app.models.user import User
    from app.models.category import Category
    
    # Check if assignment already exists
    existing = db.query(AgentCategoryAssignment).filter(
        AgentCategoryAssignment.agent_id == agent_id,
        AgentCategoryAssignment.category_id == category_id
    ).first()
    
    if existing:
        return {"message": "Agent is already assigned to this category"}
    
    # Create new assignment
    assignment = AgentCategoryAssignment(
        agent_id=agent_id,
        category_id=category_id
    )
    
    db.add(assignment)
    db.commit()
    
    return {"message": "Agent successfully assigned to category"}


def unassign_agent_from_category(db: Session, category_id: int, agent_id: int):
    """
    Unassigns an agent from a category by removing the record from agent_category_assignments.
    """
    from app.models.agent_category_assignment import AgentCategoryAssignment
    
    # Find and delete the assignment
    assignment = db.query(AgentCategoryAssignment).filter(
        AgentCategoryAssignment.agent_id == agent_id,
        AgentCategoryAssignment.category_id == category_id
    ).first()
    
    if not assignment:
        return {"message": "Agent is not assigned to this category"}
    
    db.delete(assignment)
    db.commit()
    
    return {"message": "Agent successfully unassigned from category"}