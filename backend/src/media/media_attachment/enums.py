from enum import StrEnum


class MediaOwnerType(StrEnum):
    BLOCK = "block"
    COURSE = "course"
    USER = "user"


class MediaAttachmentRole(StrEnum):
    CONTENT = "content"
    COVER = "cover"
    AVATAR = "avatar"
