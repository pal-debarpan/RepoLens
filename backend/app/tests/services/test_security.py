import pytest
from pathlib import Path
from app.services.security import analyze_security, mask_secret
from app.models.finding import FindingCategory, FindingSeverity


def test_mask_secret():
    assert mask_secret("short") == "******"
    long_secret = "FAKE" + "_KEY_1234567890_TEST"
    masked = mask_secret(long_secret)
    assert masked.startswith("FAK...")
    assert masked.endswith("...EST")
    assert "1234567890" not in masked


def test_analyze_security_detects_secret(tmp_path: Path):
    vuln_file = tmp_path / "config.py"
    dummy_secret = "dummy_secret_key_" + "abcdef1234567890"
    vuln_file.write_text(f"api_key = '{dummy_secret}'\n", encoding="utf-8")

    scanned_files = [{"rel_path": "config.py", "abs_path": str(vuln_file)}]
    findings = analyze_security(tmp_path, scanned_files)

    assert len(findings) >= 1
    sec_finding = next(f for f in findings if "credential" in f.title.lower())
    assert sec_finding.category == FindingCategory.SECURITY
    assert sec_finding.severity in (FindingSeverity.HIGH, FindingSeverity.CRITICAL)
    # Secret must be masked in evidence
    assert dummy_secret not in sec_finding.evidence


def test_analyze_security_detects_eval(tmp_path: Path):
    vuln_file = tmp_path / "runner.py"
    vuln_file.write_text("result = eval(user_input)\n", encoding="utf-8")

    scanned_files = [{"rel_path": "runner.py", "abs_path": str(vuln_file)}]
    findings = analyze_security(tmp_path, scanned_files)

    assert len(findings) == 1
    assert "eval" in findings[0].title.lower()
    assert findings[0].severity == FindingSeverity.CRITICAL


def test_analyze_security_clean_code(tmp_path: Path):
    clean_file = tmp_path / "clean.py"
    clean_file.write_text("def safe_func():\n    return 42\n", encoding="utf-8")

    scanned_files = [{"rel_path": "clean.py", "abs_path": str(clean_file)}]
    findings = analyze_security(tmp_path, scanned_files)
    assert len(findings) == 0
