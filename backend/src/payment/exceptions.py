from src.core.errors.base_errors import AppException, ObjectNotFoundError


class PaymentError(AppException):
    pass


class PaymentNotFoundError(ObjectNotFoundError, PaymentError):
    detail = "Payment not found"


class PaymentRequiredError(PaymentError):
    detail = "This course requires payment before enrollment"
    status_code = 402


class CourseAlreadyPaidError(PaymentError):
    detail = "Course is already paid"
    status_code = 409


class PaymentNotConfiguredError(PaymentError):
    detail = "Payments are not configured"
    status_code = 503


class PaymentProviderError(PaymentError):
    detail = "Payment provider error"
    status_code = 502


class PaymentVerificationError(PaymentError):
    detail = "Payment verification failed"
    status_code = 403
