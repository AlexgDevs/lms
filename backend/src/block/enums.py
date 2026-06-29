from enum import StrEnum


class BlockType(StrEnum):
    TEXT = "text"
    QUIZ_SINGLE_CHOICE = "quiz_single_choice"
    QUIZ_MULTIPLE_CHOICE = "quiz_multiple_choice"
    CODE = "code"
    IMAGE = "image"
    VIDEO = "video"
    AUDIO = "audio"
    FILE = "file"


class BlockSubmissionType(StrEnum):
    COMPLETED = "completed"
    WRONG = "wrong"
    CORRECT = "correct"
