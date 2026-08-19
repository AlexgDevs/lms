from typing import Any

import httpx
from loguru import logger

from src.codeexec.exceptions import (
    CodeExecTimeoutError,
    CodeExecUnavailableError,
    CodeExecValidationError,
)
from src.core.config import settings

# Canonical Piston language names (see GET /api/v2/runtimes).
LANGUAGE_ALIASES: dict[str, str] = {
    "python": "python",
    "python3": "python",
    "py": "python",
    "javascript": "javascript",
    "js": "javascript",
    "node": "javascript",
    "nodejs": "javascript",
    "typescript": "typescript",
    "ts": "typescript",
    "go": "go",
    "golang": "go",
}

LANGUAGE_FILE_NAMES: dict[str, str] = {
    "python": "main.py",
    "javascript": "main.js",
    "typescript": "main.ts",
    "go": "main.go",
}


def _normalize_output(value: str) -> str:
    """Strips trailing whitespace so trailing newlines don't break comparison."""
    return value.rstrip("\r\n\t ")


class CodeExecService:
    def __init__(
        self,
        base_url: str,
        timeout: float,
        max_test_cases: int,
        per_case_run_timeout_ms: int,
        compile_timeout_ms: int,
        memory_limit_mb: int,
        max_code_chars: int,
    ) -> None:
        self.base_url = base_url.rstrip("/")
        self.timeout = timeout
        self.max_test_cases = max_test_cases
        self.per_case_run_timeout_ms = per_case_run_timeout_ms
        self.compile_timeout_ms = compile_timeout_ms
        self.memory_limit_bytes = memory_limit_mb * 1024 * 1024
        self.max_code_chars = max_code_chars

    async def check(
        self,
        language: str,
        test_cases: list[Any],
        solution: str,
    ) -> bool:
        """Runs the solution against every test case and returns whether all passed."""
        alias = LANGUAGE_ALIASES.get(language)
        if alias is None:
            raise CodeExecValidationError(f"Unsupported language: {language}")
        if len(solution) > self.max_code_chars:
            raise CodeExecValidationError("Solution code exceeds the size limit")
        if len(test_cases) > self.max_test_cases:
            raise CodeExecValidationError("Too many test cases")
        if not test_cases:
            return True

        async with httpx.AsyncClient(timeout=self.timeout) as client:
            for test_case in test_cases:
                test_input = str(test_case.get("input") or "")
                expected = str(test_case.get("output") or "")
                actual = await self._run_case(client, alias, solution, test_input)
                if _normalize_output(actual) != _normalize_output(expected):
                    return False
        return True

    async def _run_case(
        self,
        client: httpx.AsyncClient,
        language: str,
        solution: str,
        stdin: str,
    ) -> str:
        payload = {
            "language": language,
            "version": "*",
            "files": [
                {
                    "name": LANGUAGE_FILE_NAMES.get(language, "main"),
                    "content": solution,
                }
            ],
            "stdin": stdin,
            "compile_timeout": self.compile_timeout_ms,
            "run_timeout": self.per_case_run_timeout_ms,
            "compile_memory_limit": self.memory_limit_bytes,
            "run_memory_limit": self.memory_limit_bytes,
        }
        try:
            response = await client.post(
                f"{self.base_url}/api/v2/execute", json=payload
            )
        except httpx.TimeoutException as exc:
            logger.warning("Code execution timed out: {}", exc)
            raise CodeExecTimeoutError from exc
        except httpx.HTTPError as exc:
            logger.warning("Code execution service unavailable: {}", exc)
            raise CodeExecUnavailableError from exc

        if response.status_code != 200:
            logger.warning(
                "Code execution service returned {}: {}",
                response.status_code,
                response.text[:500],
            )
            raise CodeExecUnavailableError

        try:
            data = response.json()
        except ValueError as exc:
            logger.warning("Code execution service returned invalid JSON")
            raise CodeExecUnavailableError from exc

        run = data.get("run") or {}
        if run.get("code") != 0:
            return ""
        return str(run.get("stdout") or "")


_service: CodeExecService | None = None


def build_code_exec_service() -> CodeExecService:
    global _service
    if _service is None:
        _service = CodeExecService(
            base_url=settings.codeexec.CODEEXEC_BASE_URL,
            timeout=settings.codeexec.CODEEXEC_TIMEOUT_SECONDS,
            max_test_cases=settings.codeexec.CODEEXEC_MAX_TEST_CASES,
            per_case_run_timeout_ms=settings.codeexec.CODEEXEC_PER_CASE_RUN_TIMEOUT_MS,
            compile_timeout_ms=settings.codeexec.CODEEXEC_COMPILE_TIMEOUT_MS,
            memory_limit_mb=settings.codeexec.CODEEXEC_MEMORY_LIMIT_MB,
            max_code_chars=settings.codeexec.CODEEXEC_MAX_CODE_CHARS,
        )
    return _service
