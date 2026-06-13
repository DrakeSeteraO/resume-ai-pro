from pydantic import BaseModel
from typing import List, Optional

class Personal(BaseModel):
    fullName: Optional[str] = ""
    email: Optional[str] = ""
    phone: Optional[str] = ""
    location: Optional[str] = ""
    website: Optional[str] = ""

class EducationItem(BaseModel):
    id: Optional[str] = ""
    school: Optional[str] = ""
    degree: Optional[str] = ""
    field: Optional[str] = ""
    startDate: Optional[str] = ""
    endDate: Optional[str] = ""
    details: Optional[str] = ""

class ExperienceItem(BaseModel):
    id: Optional[str] = ""
    company: Optional[str] = ""
    role: Optional[str] = ""
    location: Optional[str] = ""
    startDate: Optional[str] = ""
    endDate: Optional[str] = ""
    bullets: Optional[str] = ""

class ProjectItem(BaseModel):
    id: Optional[str] = ""
    name: Optional[str] = ""
    stack: Optional[str] = ""
    link: Optional[str] = ""
    description: Optional[str] = ""

class CertificateItem(BaseModel):
    id: Optional[str] = ""
    name: Optional[str] = ""
    issuer: Optional[str] = ""
    date: Optional[str] = ""
    link: Optional[str] = ""

class PublicationItem(BaseModel):
    id: Optional[str] = ""
    title: Optional[str] = ""
    venue: Optional[str] = ""
    date: Optional[str] = ""
    link: Optional[str] = ""
    description: Optional[str] = ""

class AwardItem(BaseModel):
    id: Optional[str] = ""
    name: Optional[str] = ""
    issuer: Optional[str] = ""
    date: Optional[str] = ""
    description: Optional[str] = ""

class TargetJob(BaseModel):
    company: Optional[str] = ""
    role: Optional[str] = ""
    jobDescription: Optional[str] = ""

class ProfilePayload(BaseModel):
    personal: Optional[Personal] = Personal()
    narrative: Optional[str] = ""
    education: List[EducationItem] = []
    experience: List[ExperienceItem] = []
    projects: List[ProjectItem] = []
    githubUsername: Optional[str] = ""
    skills: List[str] = []
    certificates: List[CertificateItem] = []
    publications: List[PublicationItem] = []
    awards: List[AwardItem] = []
    target: Optional[TargetJob] = TargetJob()

class CritiquePayload(BaseModel):
    profile: ProfilePayload
    latex_string: str

class RevisePayload(BaseModel):
    profile: ProfilePayload
    latex_string: str
    improvements: List[str]
    
class PdfPayload(BaseModel):
    latex_string: str