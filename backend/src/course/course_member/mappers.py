from src.core.mappers import BaseMapper
from src.course.models import CourseMember
from src.course.course_member.schemas import CourseMemberSchema


class CourseMemberMapper(BaseMapper[CourseMember, CourseMemberSchema]):
    orm_class = CourseMember
    schema_class = CourseMemberSchema
