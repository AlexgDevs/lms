# core/polymorphic_validator.py
from typing import Any, Self, Dict, Type, ClassVar
from pydantic import BaseModel, model_validator, Field


class PolymorphicPayloadMixin[EnumT]:
    """
    Universal mixin for validating polymorphic payload fields.

    This mixin allows you to validate different payload structures
    based on a type field (block_type, submission_type, etc.)
    without duplicating validation logic.

    Usage example:

        class BlockCreateRequestSchema(PolymorphicPayloadMixin[BlockType], BaseSchema):
            title: str
            block_type: BlockType
            payload: dict[str, Any]

            payload_registry: ClassVar = PAYLOAD_REGISTRY
    """

    # Technical fields with aliases (not visible in API schema)
    type_field: EnumT | None = Field(
        alias="block_type", 
        exclude=True, 
        default=None,
        description="Internal mapping for the type field"
    )
    payload_field: Any = Field(
        alias="payload", 
        exclude=True, 
        default=None,
        description="Internal mapping for the payload field"
    )

    # Registry that maps type -> Pydantic model
    payload_registry: ClassVar[Dict[EnumT, Type[BaseModel]]]

    @model_validator(mode='after')
    def validate_polymorphic_payload(self) -> Self:
        """
        Validates and converts the payload to the appropriate model
        based on the type_field value.
        """
        if self.type_field is None:
            return self

        if self.type_field not in self.payload_registry:
            raise ValueError(f"Unknown type: {self.type_field}")

        model_class = self.payload_registry[self.type_field]

        try:
            self.payload_field = model_class.model_validate(self.payload_field)
        except Exception as exc:
            raise ValueError(
                f"Incorrect payload data for type '{self.type_field}': {exc}"
            ) from exc

        return self
