from pydantic import BaseModel


class PolicyResponse(BaseModel):
    id: str
    policy_name: str
    file_url: str
