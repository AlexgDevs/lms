from enum import StrEnum

class BlockType(StrEnum):
    TEXT = "text"
    IMAGE = "image"
    VIDEO = "video"
    AUDIO = "audio"
    FILE = "file"

class BlockSubmissionType(StrEnum):
    COMPLETED = "completed"
    WRONG = "wrong"
    CORRECT = "correct"