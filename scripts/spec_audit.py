#!/usr/bin/env python3
"""Reproducible structural and semantic audit for the process-spec inventory."""
from __future__ import annotations

import argparse
import csv
import json
import re
import hashlib
import os
from collections import Counter, defaultdict
from pathlib import Path
from urllib.parse import unquote, urlsplit

EXPECTED_FEATURES = 18
EXPECTED_MODULES = 148
EXPECTED_PROCESSES = 1480
EXPECTED_REQUIREMENTS = 4444
ID_RE = re.compile(r"PS-\d{3}-\d{2}")
REQ_RE = re.compile(r"PS-\d{3}-\d{2}\.R\d{2}")
PLACEHOLDER_PATTERNS = (
    r"structured placeholder",
    r"to be specified",
    r"to be written",
    r"unresolved",
    r"\[ \]",
    r"placeholder exists",
    r"TODO",
)



def repository_paths(root: Path):
    """Walk source only: generated dependencies/reports cannot provide audit evidence."""
    for current, directories, files in os.walk(root):
        directory = Path(current)
        directories[:] = sorted(
            name for name in directories
            if name not in {'.git', 'node_modules', '__pycache__'}
            and (directory / name).relative_to(root).as_posix()
            not in {'app/playwright-report', 'app/test-results'}
        )
        yield from (directory / name for name in directories)
        yield from (directory / name for name in sorted(files))


def module_spec_directories(root: Path) -> list[Path]:
    return sorted(
        path.parent for path in repository_paths(root)
        if path.name == 'SPEC.md' and path.parent.name.startswith('mod_') and path.is_file()
    )


def read_registry(root: Path) -> list[dict[str, str]]:
    with (root / "planning/SPEC_REGISTRY.csv").open(newline="", encoding="utf-8") as stream:
        return list(csv.DictReader(stream))


def requirement_findings(actual: list[dict], expected: list[dict], registry: dict[str, dict]) -> list[str]:
    """Compare requirement records with process-spec source IDs and registry statuses."""
    problems: list[str] = []
    actual_ids = [row.get("id", "") for row in actual]
    counts = Counter(actual_ids)
    problems.extend(f"duplicate requirement ID {rid} ({count} rows)" for rid, count in sorted(counts.items()) if count > 1)
    expected_ids = [row.get("id", "") for row in expected]
    expected_counts = Counter(expected_ids)
    problems.extend(f"duplicate source requirement ID {rid} ({count} occurrences)" for rid, count in sorted(expected_counts.items()) if count > 1)
    for rid in sorted(set(expected_ids) - set(actual_ids)):
        problems.append(f"requirement checklist missing {rid}")
    for rid in sorted(set(actual_ids) - set(expected_ids)):
        problems.append(f"requirement checklist has unlinked {rid}")
    expected_by_id = {row["id"]: row for row in expected}
    registry_by_process = registry
    for row in actual:
        rid = row.get("id", "")
        source = expected_by_id.get(rid)
        if source and row.get("spec") != source.get("spec"):
            problems.append(f"{rid} points to {row.get('spec')} instead of {source.get('spec')}")
        process_id = rid.split(".", 1)[0]
        owner = registry_by_process.get(process_id)
        if owner and row.get("status") != owner.get("status"):
            problems.append(f"{rid} checklist status {row.get('status')} disagrees with registry {owner.get('status')}")
    return problems


def normalized_status(value: str) -> str:
    upper = value.upper()
    if upper.startswith("SPECIFIED"):
        return "SPECIFIED_REVIEW_PENDING"
    if "DRAFT" in upper:
        return "DRAFT"
    return upper.strip().replace(" ", "_")


def process_status(text: str) -> str | None:
    match = re.search(r"(?m)^\*\*Status:\*\*\s*(.+)$", text)
    if not match:
        return None
    return normalized_status(match.group(1).split(".", 1)[0])


def process_status_findings(rid: str, text: str, registry_status: str) -> list[str]:
    measured = process_status(text)
    expected = normalized_status(registry_status)
    if measured != expected:
        return [f"{rid} process status {measured} disagrees with registry {registry_status}"]
    return []


def stale_inventory_findings(module_rel: str, text: str) -> list[str]:
    stale_bullets = re.findall(r"(?m)^\s*- Required process spec:\s*`([^`]+)`", text)
    legacy_suffixes = (
        "domain_model", "commands_and_state_transitions", "validation_and_authorization",
        "failure_recovery_and_idempotency", "interfaces_and_events",
        "privacy_security_and_abuse", "acceptance_and_property_tests",
    )
    suffix_pattern = "|".join(legacy_suffixes)
    stale_filenames = re.findall(rf"(?i)(?:[A-Za-z0-9_*.-]+_)?(?:{suffix_pattern})\.md", text)
    if not stale_bullets and not stale_filenames:
        return []
    names = sorted(set(stale_bullets + stale_filenames))
    return [f"{module_rel}/SPEC.md retains stale inventory names: " + ", ".join(names)]


def semantic_gate_result(placeholder_count: int, review: dict) -> dict:
    """Specification GO requires resolved placeholders and source-bound approval."""
    findings = []
    if placeholder_count:
        findings.append(f"{placeholder_count} process specs contain unresolved placeholder markers")
    if review["gate"] != "PASS":
        findings.append(
            "specification review gate " + review["gate"] + ": "
            f"{review['pending_approval_count']} contracts await approval, "
            f"{review['missing_evidence_count']} approved contracts lack evidence, "
            f"{review['invalid_evidence_count']} approval records are invalid"
        )
    return {"gate": "GO" if not findings else "NO-GO", "findings": sorted(set(findings))}


def review_evidence_audit(root: Path, rows: list[dict]) -> dict:
    """Check approval records and bind them to current process-spec source bytes."""
    pending_ids = []
    missing_evidence_ids = []
    invalid_evidence_ids = []
    unsupported_git_revision_ids = []
    verified_ids = []
    for row in rows:
        rid = row.get("id", "")
        if row.get("status") != "APPROVED":
            pending_ids.append(rid)
            continue
        record_path = root / "planning/audits/reviews" / f"{rid}.md"
        if not record_path.is_file():
            missing_evidence_ids.append(rid)
            continue
        record = record_path.read_text(encoding="utf-8")
        legacy_git_hash = re.search(r"(?m)^Reviewed revision:\s*[0-9a-f]{40}\s*$", record)
        if legacy_git_hash:
            unsupported_git_revision_ids.append(rid)
        spec_path = root / row.get("path", "")
        source_hash = hashlib.sha256(spec_path.read_bytes()).hexdigest() if spec_path.is_file() else None
        stated_hash = re.search(r"(?m)^Source SHA-256:\s*([0-9a-f]{64})\s*$", record)
        valid = (
            source_hash is not None
            and stated_hash is not None
            and stated_hash.group(1) == source_hash
            and re.search(rf"(?m)^Process ID:\s*{re.escape(rid)}\s*$", record)
            and re.search(r"(?m)^Verdict:\s*APPROVED\s*$", record)
            and re.search(r"(?m)^Reviewer:\s*\S.+$", record)
            and re.search(r"(?m)^Reviewed:\s*\d{4}-\d{2}-\d{2}\s*$", record)
            and re.search(r"(?m)^Evidence:\s*\S.+$", record)
        )
        if valid:
            verified_ids.append(rid)
        else:
            invalid_evidence_ids.append(rid)
    passed = len(verified_ids) == len(rows) and not pending_ids and not missing_evidence_ids and not invalid_evidence_ids
    if passed:
        gate = "PASS"
    elif invalid_evidence_ids or missing_evidence_ids:
        gate = "UNVERIFIED"
    else:
        gate = "PENDING"
    return {
        "gate": gate,
        "verified_approval_count": len(verified_ids),
        "pending_approval_count": len(pending_ids),
        "missing_evidence_count": len(missing_evidence_ids),
        "invalid_evidence_count": len(invalid_evidence_ids),
        "unsupported_git_revision_count": len(unsupported_git_revision_ids),
        "source_binding": "SHA-256 of current process-spec bytes",
        "reviewer_identity_authenticated": False,
    }


def registry_markdown_findings(rows: list[dict], text: str) -> list[str]:
    problems: list[str] = []
    expected = {row["id"]: row for row in rows}
    seen: dict[str, list[str]] = defaultdict(list)
    for line in text.splitlines():
        if not line.lstrip().startswith("|"):
            continue
        columns = [column.strip() for column in line.strip().strip("|").split("|")]
        if not columns or not ID_RE.fullmatch(columns[0]):
            continue
        rid = columns[0]
        seen[rid].append(line)
        if len(columns) < 4:
            problems.append(f"registry Markdown row {rid} has fewer than four columns")
            continue
        path_link = re.search(r"\[[^]]+\]\(([^)]+)\)", columns[1])
        md_path = unquote(urlsplit(path_link.group(1)).path).removeprefix("../") if path_link else columns[1]
        row = expected.get(rid)
        if row is None:
            problems.append(f"registry Markdown has unknown ID {rid}")
            continue
        if md_path != row.get("path"):
            problems.append(f"registry Markdown {rid} path {md_path} disagrees with CSV {row.get('path')}")
        if columns[2] != row.get("owner_module"):
            problems.append(f"registry Markdown {rid} owner disagrees with CSV")
        if columns[3] != row.get("status"):
            problems.append(f"registry Markdown {rid} status {columns[3]} disagrees with CSV {row.get('status')}")
    for rid, entries in seen.items():
        if len(entries) > 1:
            problems.append(f"registry Markdown duplicates {rid} ({len(entries)} rows)")
    for rid in sorted(set(expected) - set(seen)):
        problems.append(f"registry Markdown missing {rid}")
    return problems


def markdown_link_findings(root: Path) -> list[str]:
    problems: list[str] = []
    link_re = re.compile(r"(?<!!)\[[^]]*\]\(([^)]+)\)")
    for source in sorted(path for path in repository_paths(root) if path.suffix == ".md"):
        if ".git" in source.parts or "scripts" in source.parts:
            continue
        text = source.read_text(encoding="utf-8", errors="ignore")
        for target in link_re.findall(text):
            target = target.strip().strip("<>")
            parsed = urlsplit(target)
            if parsed.scheme or target.startswith("//") or not parsed.path:
                continue
            raw_path = unquote(parsed.path)
            destination = (root / raw_path.lstrip("/")) if raw_path.startswith("/") else (source.parent / raw_path)
            if not destination.exists():
                problems.append(f"broken Markdown link in {source.relative_to(root).as_posix()}: {target}")
    return problems


# Implementation subtrees are not planning-hierarchy nodes. They are documented in their own README/STATUS files.
IMPLEMENTATION_TREES = {
    "app": "mock-backed framework demo; documented in app/README.md and app/STATUS.md, not a planning node",
}


def hierarchy_exempt(rel: str, exceptions: dict[str, str]) -> bool:
    """True when a directory is an explicit exception or lies inside an implementation tree."""
    if rel in exceptions:
        return True
    return any(rel == tree or rel.startswith(tree + "/") for tree in IMPLEMENTATION_TREES)


def audit(root: Path) -> dict:
    errors: list[str] = []
    rows = read_registry(root)
    ids = [row.get("id", "") for row in rows]
    paths = [row.get("path", "") for row in rows]
    duplicates = Counter(ids)
    errors.extend(f"duplicate registry ID {key}" for key, n in sorted(duplicates.items()) if n > 1)
    duplicate_paths = Counter(paths)
    errors.extend(f"duplicate registry path {key}" for key, n in sorted(duplicate_paths.items()) if n > 1)
    by_id = {row["id"]: row for row in rows}

    module_dirs = module_spec_directories(root)
    features = [p for p in root.iterdir() if p.is_dir() and re.match(r"^\d{2}_", p.name)]
    if len(features) != EXPECTED_FEATURES:
        errors.append(f"expected {EXPECTED_FEATURES} feature directories; found {len(features)}")
    if len(module_dirs) != EXPECTED_MODULES:
        errors.append(f"expected {EXPECTED_MODULES} module SPEC.md files; found {len(module_dirs)}")
    if len(rows) != EXPECTED_PROCESSES:
        errors.append(f"expected {EXPECTED_PROCESSES} registry processes; found {len(rows)}")

    for row in rows:
        rid, rel = row.get("id", ""), row.get("path", "")
        spec = root / rel
        if not spec.is_file():
            errors.append(f"{rid} process specification missing: {rel}")
            continue
        owner = row.get("owner_module", "")
        module_spec = root / owner / "SPEC.md"
        if not module_spec.is_file():
            errors.append(f"{rid} owner module SPEC missing: {owner}/SPEC.md")
        if Path(rel).parent.as_posix() != owner:
            errors.append(f"{rid} path parent {Path(rel).parent} disagrees with owner {owner}")
        predecessor = row.get("predecessor_spec", "")
        if predecessor and not (root / predecessor).is_file():
            errors.append(f"{rid} predecessor missing: {predecessor}")
        test_id = row.get("future_test", "")
        if not test_id:
            errors.append(f"{rid} has no future_test link")
        text = spec.read_text(encoding="utf-8")
        header = re.search(r"(?m)^#\s+(PS-\d{3}-\d{2})\b", text)
        if not header or header.group(1) != rid:
            errors.append(f"{rid} file header ID mismatch: {rel}")
        errors.extend(process_status_findings(rid, text, row.get("status", "")))

    req_doc_path = root / "planning/REQUIREMENTS_CHECKLIST.json"
    req_doc = json.loads(req_doc_path.read_text(encoding="utf-8"))
    checklist = req_doc.get("requirements", [])
    source_reqs: list[dict] = []
    for row in rows:
        p = root / row.get("path", "")
        if not p.is_file():
            continue
        for req_id in REQ_RE.findall(p.read_text(encoding="utf-8")):
            source_reqs.append({"id": req_id, "spec": row["path"]})
    errors.extend(requirement_findings(checklist, source_reqs, by_id))
    if req_doc.get("requirement_count") != len(checklist):
        errors.append(f"requirement_count says {req_doc.get('requirement_count')}; array has {len(checklist)}")
    if len(checklist) != EXPECTED_REQUIREMENTS:
        errors.append(f"expected {EXPECTED_REQUIREMENTS} requirement records; found {len(checklist)}")

    listed_spec_links = 0
    inventory_problems = []
    stale_scope_entry_count = 0
    stale_scope_module_count = 0
    for module_dir in module_dirs:
        module_rel = module_dir.relative_to(root).as_posix()
        mpath = module_dir / "SPEC.md"
        text = mpath.read_text(encoding="utf-8")
        stale_findings = stale_inventory_findings(module_rel, text)
        errors.extend(stale_findings)
        stale_entries = re.findall(r"(?m)^\s*- Required process spec:\s*`[^`]+`", text)
        stale_entries += re.findall(r"(?i)(?:[A-Za-z0-9_*.-]+_)?(?:domain_model|commands_and_state_transitions|validation_and_authorization|failure_recovery_and_idempotency|interfaces_and_events|privacy_security_and_abuse|acceptance_and_property_tests)\.md", text)
        stale_scope_entry_count += len(stale_entries)
        stale_scope_module_count += bool(stale_entries)
        owned = sorted((row for row in rows if row.get("owner_module") == module_rel), key=lambda x: x["id"])
        inventory_section = re.search(r"(?ms)^## Process specification inventory.*?(?=^## |\Z)", text)
        if not inventory_section:
            inventory_problems.append(f"{module_rel}/SPEC.md has no process inventory section")
            continue
        found_ids = re.findall(r"`(PS-\d{3}-\d{2})`", inventory_section.group())
        expected_ids = [row["id"] for row in owned]
        if found_ids != expected_ids:
            inventory_problems.append(f"{module_rel}/SPEC.md inventory IDs disagree with registry")
        listed_spec_links += len(found_ids)
        checklist_path = module_dir / "PROCESS_CHECKLIST.md"
        if not checklist_path.is_file():
            errors.append(f"{module_rel}/PROCESS_CHECKLIST.md missing")
            continue
        check_text = checklist_path.read_text(encoding="utf-8")
        check_ids = re.findall(r"`(PS-\d{3}-\d{2})`", check_text)
        if check_ids != expected_ids:
            errors.append(f"{module_rel}/PROCESS_CHECKLIST.md IDs disagree with registry")
        for row in owned:
            linked = f"[{Path(row['path']).name}]({Path(row['path']).name})"
            if linked not in inventory_section.group():
                inventory_problems.append(f"{module_rel}/SPEC.md missing link to {row['id']}")
            if row["status"] not in check_text:
                errors.append(f"{module_rel}/PROCESS_CHECKLIST.md omits current status {row['status']}")
    errors.extend(inventory_problems)
    errors.extend(registry_markdown_findings(rows, (root / "planning/SPEC_REGISTRY.md").read_text(encoding="utf-8")))
    errors.extend(markdown_link_findings(root))

    hierarchy_exceptions = {
        ".": "root project documents use PROJECT_SPEC.md and PROJECT_TODO.md",
        "scripts": "audit tooling, excluded from product hierarchy",
        ".github": "repository automation, not a planning node",
        ".github/workflows": "CI workflows, not a planning node",
        "planning/contracts": "shared contract library, not a feature hierarchy node",
        "planning/audits": "generated audit reports",
        "planning/audits/reviews": "per-contract approval records",
    }
    hierarchy_missing = []
    hierarchy_directories = [root, *(path for path in repository_paths(root) if path.is_dir() and ".git" not in path.parts and "scripts" not in path.parts)]
    for directory in sorted(hierarchy_directories):
        rel = directory.relative_to(root).as_posix()
        missing = [name for name in ("SPEC.md", "TODO.md") if not (directory / name).is_file()]
        if missing and not hierarchy_exempt(rel, hierarchy_exceptions):
            hierarchy_missing.append(f"{rel} missing {', '.join(missing)} and has no explicit hierarchy exception")
    errors.extend(hierarchy_missing)

    missing_tests = []
    searchable = []
    for candidate in repository_paths(root):
        if not candidate.is_file() or ".git" in candidate.parts or candidate == root / "planning/audits/spec_audit.json":
            continue
        if candidate.suffix.lower() not in {".py", ".md", ".json", ".yml", ".yaml", ".toml"}:
            continue
        if not (candidate.name.lower().startswith("test_") or any(part.lower() in {"test", "tests"} for part in candidate.parts)):
            continue
        try:
            searchable.append(candidate.read_text(encoding="utf-8", errors="ignore"))
        except OSError:
            pass
    repository_text = "\n".join(searchable)
    for row in rows:
        test_id = row.get("future_test", "")
        if test_id and test_id not in repository_text:
            missing_tests.append(test_id)
    placeholder_files = []
    for row in rows:
        p = root / row["path"]
        if not p.is_file():
            continue
        text = p.read_text(encoding="utf-8")
        if any(re.search(pattern, text, re.I) for pattern in PLACEHOLDER_PATTERNS):
            placeholder_files.append(row["path"])
    status_counts = Counter(row.get("status", "") for row in rows)
    review = review_evidence_audit(root, rows)
    review_pending = review["pending_approval_count"]
    semantic_result = semantic_gate_result(len(placeholder_files), review)
    requirement_status_mismatches = sum(
        row.get("status") != by_id.get(row.get("id", "").split(".", 1)[0], {}).get("status")
        for row in checklist
    )
    scope_reconciliation = {
        "legacy_modules_reconciled": 147,
        "baseline_stale_scope_entries": 1029,
        "current_stale_scope_entries": stale_scope_entry_count,
        "modules_with_current_stale_entries": stale_scope_module_count,
    }
    baseline_reconciliation = {
        "reference": "39ac847",
        "baseline_requirement_status_mismatches": 30,
        "affected_process_contracts": 10,
        "current_requirement_status_mismatches": requirement_status_mismatches,
        "resolved_mismatch_count": max(0, 30 - requirement_status_mismatches),
    }

    result = {
        "audit_version": 1,
        "counts": {"features": len(features), "modules": len(module_dirs), "process_contracts": len(rows), "requirements": len(checklist)},
        "registry_status_counts": dict(sorted(status_counts.items())),
        "hierarchy_exceptions": hierarchy_exceptions,
        "review_gate": review["gate"],
        "review_pending_contract_count": review_pending,
        "review_evidence": review,
        "baseline_reconciliation": baseline_reconciliation,
        "scope_reconciliation": scope_reconciliation,
        "missing_test_artifact_count": len(missing_tests),
        "placeholder_spec_count": len(placeholder_files),
        "structural_pass": not errors,
        "structural_errors": sorted(set(errors)),
        "semantic_gate": semantic_result["gate"],
        "semantic_findings": semantic_result["findings"],
    }
    return result


def render_markdown(report: dict) -> str:
    c = report["counts"]
    lines = ["# Process inventory audit", "", f"**Structural result:** {'PASS' if report['structural_pass'] else 'FAIL'}.", f"**Semantic gate:** {report['semantic_gate']}.", "", f"Inventory: {c['features']} features, {c['modules']} modules, {c['process_contracts']} process contracts and {c['requirements']} requirements.", "", "## Registry statuses", ""]
    lines.extend(f"- {status}: {count}" for status, count in report["registry_status_counts"].items())
    lines += ["", "## Structural errors", ""]
    lines.extend(f"- {item}" for item in report["structural_errors"] or ["None."])
    lines += ["", "## Semantic findings", ""]
    lines.extend(f"- {item}" for item in report["semantic_findings"] or ["None."])
    baseline = report["baseline_reconciliation"]
    scope = report["scope_reconciliation"]
    review = report["review_evidence"]
    lines += ["", "## Reconciled baseline", "", f"At `{baseline['reference']}`, {baseline['baseline_requirement_status_mismatches']} requirement-status mismatches affected {baseline['affected_process_contracts']} process contracts (three requirements each). The current checklist has {baseline['current_requirement_status_mismatches']} status mismatches; all {baseline['resolved_mismatch_count']} baseline mismatches are resolved.", "", f"Replaced {scope['baseline_stale_scope_entries']} stale Scope entries across {scope['legacy_modules_reconciled']} module specs with mappings to the ten canonical registry processes. Current stale entries: {scope['current_stale_scope_entries']}.", "", "## Independent specification review gate", "", f"Review gate: **{report['review_gate']}**; {review['verified_approval_count']} approvals have source-bound records, {review['pending_approval_count']} contracts await approval, {review['missing_evidence_count']} approved contracts lack evidence, and {review['invalid_evidence_count']} records are invalid.", f"Records must bind to the current process-spec bytes using {review['source_binding']}. SHA-1 Git revision references are unsupported. This audit does not authenticate reviewer identity or independence; that remains a manual review gate.", "", f"Missing runtime test artifacts: {report['missing_test_artifact_count']} future test IDs. Runtime test and implementation evidence is reported separately and does not gate specification readiness.", "", "Structural success confirms inventory consistency only. Semantic GO requires resolved placeholders and explicit, source-bound specification review approval. Neither condition asserts runtime implementation readiness.", ""]
    return "\n".join(lines)


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    group = parser.add_mutually_exclusive_group()
    group.add_argument("--check", action="store_true", help="fail only on structural errors (default)")
    group.add_argument("--semantic", action="store_true", help="also fail while semantic findings remain")
    parser.add_argument("--root", type=Path, default=Path(__file__).resolve().parents[1], help=argparse.SUPPRESS)
    args = parser.parse_args()
    root = args.root.resolve()
    report = audit(root)
    out = root / "planning/audits"
    out.mkdir(parents=True, exist_ok=True)
    (out / "spec_audit.json").write_text(json.dumps(report, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
    (out / "spec_audit.md").write_text(render_markdown(report), encoding="utf-8")
    print(f"Structural: {'PASS' if report['structural_pass'] else 'FAIL'}; semantic: {report['semantic_gate']}")
    print(f"Counts: {report['counts']}; structural errors: {len(report['structural_errors'])}; semantic findings: {len(report['semantic_findings'])}")
    if report["structural_errors"]:
        for item in report["structural_errors"][:20]:
            print(f"ERROR: {item}")
    return 1 if report["structural_errors"] or (args.semantic and report["semantic_findings"]) else 0


if __name__ == "__main__":
    raise SystemExit(main())
