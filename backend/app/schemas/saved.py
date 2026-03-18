from pydantic import BaseModel


class SavePlaceRequest(BaseModel):
    destination_id: str
