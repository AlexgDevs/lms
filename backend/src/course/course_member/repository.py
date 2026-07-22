from src.core.repositories import BaseRepository
from src.course.models import CourseMember
from src.course.course_member.mappers import CourseMemberMapper
from src.course.course_member.schemas import (
    CourseMemberSchema,
)


class CourseMemberRepository(BaseRepository[CourseMember, CourseMemberSchema]):
    model = CourseMember
    schema = CourseMemberSchema
    mapper = CourseMemberMapper
