"""Focused regression tests for checklist reconciliation checks."""
import hashlib
import unittest
from pathlib import Path
from tempfile import TemporaryDirectory

from scripts.spec_audit import (
    IMPLEMENTATION_TREES,
    hierarchy_exempt,
    process_status_findings,
    review_evidence_audit,
    registry_markdown_findings,
    requirement_findings,
    stale_inventory_findings,
    semantic_gate_result,
)


class RequirementAuditTests(unittest.TestCase):
    def setUp(self):
        self.registry = {
            "PS-002-01": {"id": "PS-002-01", "status": "SPECIFIED_REVIEW_PENDING"},
            "PS-002-02": {"id": "PS-002-02", "status": "DRAFT"},
        }

    def test_reports_omitted_fourth_requirement_and_duplicate_ids(self):
        expected = [
            {"id": "PS-002-01.R01", "spec": "spec1.md"},
            {"id": "PS-002-01.R02", "spec": "spec1.md"},
            {"id": "PS-002-01.R03", "spec": "spec1.md"},
            {"id": "PS-002-01.R04", "spec": "spec1.md"},
        ]
        actual = [{**row, "status": "SPECIFIED_REVIEW_PENDING"} for row in expected[:3]]
        actual.append(dict(actual[0]))
        problems = requirement_findings(actual, expected, self.registry)
        self.assertIn("requirement checklist missing PS-002-01.R04", problems)
        self.assertIn("duplicate requirement ID PS-002-01.R01 (2 rows)", problems)

    def test_reports_status_disagreement_against_registry(self):
        expected = [{"id": "PS-002-01.R01", "spec": "spec1.md"}]
        actual = [{"id": "PS-002-01.R01", "spec": "spec1.md", "status": "DRAFT"}]
        problems = requirement_findings(actual, expected, self.registry)
        self.assertIn("PS-002-01.R01 checklist status DRAFT disagrees with registry SPECIFIED_REVIEW_PENDING", problems)

    def test_reports_stale_scope_inventory_fixture(self):
        fixture = "## Scope\n- Required process spec: `offer_domain_model.md` (not yet authored)\n"
        problems = stale_inventory_findings("02_area/mod_offer", fixture)
        self.assertEqual(len(problems), 1)
        self.assertIn("offer_domain_model.md", problems[0])

    def test_reports_process_header_status_mismatch_fixture(self):
        fixture = "**Status:** DRAFT — structured placeholder only.\n"
        problems = process_status_findings("PS-002-01", fixture, "SPECIFIED_REVIEW_PENDING")
        self.assertEqual(problems, ["PS-002-01 process status DRAFT disagrees with registry SPECIFIED_REVIEW_PENDING"])

    def test_reports_markdown_registry_status_mismatch_fixture(self):
        rows = [{"id": "PS-002-01", "path": "area/mod/domain_schema.md", "owner_module": "area/mod", "status": "DRAFT"}]
        markdown = "| PS-002-01 | [area/mod/domain_schema.md](../area/mod/domain_schema.md) | area/mod | SPECIFIED_REVIEW_PENDING |\n"
        problems = registry_markdown_findings(rows, markdown)
        self.assertEqual(problems, ["registry Markdown PS-002-01 status SPECIFIED_REVIEW_PENDING disagrees with CSV DRAFT"])

    def test_review_gate_requires_explicit_approval_and_evidence(self):
        rows = [{"id": "PS-002-01", "status": "DRAFT"}]
        with TemporaryDirectory() as directory:
            root = Path(directory)
            result = review_evidence_audit(root, rows)
            self.assertEqual(result["gate"], "PENDING")
            self.assertEqual(result["pending_approval_count"], 1)

    def test_zero_placeholders_do_not_pass_without_review_approval(self):
        review = {
            "gate": "PENDING",
            "pending_approval_count": 1,
            "missing_evidence_count": 0,
            "invalid_evidence_count": 0,
        }
        result = semantic_gate_result(0, review)
        self.assertEqual(result["gate"], "NO-GO")
        self.assertIn("specification review gate PENDING", result["findings"][0])

    def test_runtime_test_absence_is_not_a_specification_gate_input(self):
        review = {
            "gate": "PASS",
            "pending_approval_count": 0,
            "missing_evidence_count": 0,
            "invalid_evidence_count": 0,
        }
        self.assertEqual(semantic_gate_result(0, review)["gate"], "GO")

    def test_review_gate_rejects_approved_status_without_evidence(self):
        rows = [{"id": "PS-002-01", "status": "APPROVED"}]
        with TemporaryDirectory() as directory:
            result = review_evidence_audit(Path(directory), rows)
            self.assertEqual(result["gate"], "UNVERIFIED")
            self.assertEqual(result["missing_evidence_count"], 1)

    def test_review_gate_accepts_source_bound_record(self):
        rows = [{"id": "PS-002-01", "status": "APPROVED", "path": "module/process.md"}]
        with TemporaryDirectory() as directory:
            root = Path(directory)
            spec = root / rows[0]["path"]
            spec.parent.mkdir(parents=True)
            spec.write_text("Current process specification content.\n")
            source_hash = hashlib.sha256(spec.read_bytes()).hexdigest()
            review_dir = root / "planning/audits/reviews"
            review_dir.mkdir(parents=True)
            (review_dir / "PS-002-01.md").write_text(
                "Process ID: PS-002-01\nVerdict: APPROVED\nReviewer: Ada Reviewer\n"
                "Reviewed: 2026-10-24\nSource SHA-256: " + source_hash + "\n"
                "Evidence: Reviewed acceptance and failure-path criteria.\n"
            )
            result = review_evidence_audit(root, rows)
            self.assertEqual(result["gate"], "PASS")
            self.assertEqual(result["verified_approval_count"], 1)
            self.assertFalse(result["reviewer_identity_authenticated"])

    def test_review_record_fails_after_source_changes(self):
        rows = [{"id": "PS-002-01", "status": "APPROVED", "path": "module/process.md"}]
        with TemporaryDirectory() as directory:
            root = Path(directory)
            spec = root / rows[0]["path"]
            spec.parent.mkdir(parents=True)
            spec.write_text("Reviewed content.\n")
            source_hash = hashlib.sha256(spec.read_bytes()).hexdigest()
            review_dir = root / "planning/audits/reviews"
            review_dir.mkdir(parents=True)
            (review_dir / "PS-002-01.md").write_text(
                "Process ID: PS-002-01\nVerdict: APPROVED\nReviewer: Ada Reviewer\n"
                "Reviewed: 2026-10-24\nSource SHA-256: " + source_hash + "\n"
                "Evidence: Reviewed acceptance and failure-path criteria.\n"
            )
            spec.write_text("Changed after review.\n")
            result = review_evidence_audit(root, rows)
            self.assertEqual(result["gate"], "UNVERIFIED")
            self.assertEqual(result["invalid_evidence_count"], 1)

    def test_review_gate_flags_unsupported_sha1_revision(self):
        rows = [{"id": "PS-002-01", "status": "APPROVED", "path": "module/process.md"}]
        with TemporaryDirectory() as directory:
            root = Path(directory)
            spec = root / rows[0]["path"]
            spec.parent.mkdir(parents=True)
            spec.write_text("Reviewed content.\n")
            review_dir = root / "planning/audits/reviews"
            review_dir.mkdir(parents=True)
            (review_dir / "PS-002-01.md").write_text(
                "Process ID: PS-002-01\nVerdict: APPROVED\nReviewer: Ada Reviewer\n"
                "Reviewed: 2026-10-24\nReviewed revision: " + "a" * 40 + "\n"
                "Evidence: Reviewed acceptance and failure-path criteria.\n"
            )
            result = review_evidence_audit(root, rows)
            self.assertEqual(result["gate"], "UNVERIFIED")
            self.assertEqual(result["unsupported_git_revision_count"], 1)

    def test_reports_wrong_spec_link(self):
        expected = [{"id": "PS-002-02.R01", "spec": "spec2.md"}]
        actual = [{"id": "PS-002-02.R01", "spec": "wrong.md", "status": "DRAFT"}]
        problems = requirement_findings(actual, expected, self.registry)
        self.assertIn("PS-002-02.R01 points to wrong.md instead of spec2.md", problems)


if __name__ == "__main__":
    unittest.main()


class HierarchyExemptionTests(unittest.TestCase):
    def test_implementation_tree_is_exempt_but_planning_folders_are_not(self):
        exceptions = {".": "root", "planning/contracts": "library"}
        self.assertIn("app", IMPLEMENTATION_TREES)
        self.assertTrue(hierarchy_exempt("app", exceptions))
        self.assertTrue(hierarchy_exempt("app/src/views", exceptions))
        self.assertTrue(hierarchy_exempt("planning/contracts", exceptions))
        self.assertFalse(hierarchy_exempt("01_LocalBazaar", exceptions))
        self.assertFalse(hierarchy_exempt("application-notes", exceptions))


class RepositoryTraversalTests(unittest.TestCase):
    def test_generated_dependencies_and_reports_cannot_supply_audit_evidence(self):
        from scripts import spec_audit
        self.assertTrue(callable(getattr(spec_audit, "repository_paths", None)))
        with TemporaryDirectory() as directory:
            root = Path(directory)
            included = ["planning/contracts/SPEC.md", "app/README.md", "app/tests/real.test.js", ".github/workflows/demo.yml"]
            excluded = [".git/nested/private.md", "app/node_modules/vendor/README.md", "app/node_modules/vendor/tests/test_fake.py", "app/playwright-report/index.html", "app/test-results/failure.md", "scripts/__pycache__/cache.pyc"]
            for name in included + excluded:
                target = root / name
                target.parent.mkdir(parents=True, exist_ok=True)
                target.write_text("fixture", encoding="utf-8")
            actual = {p.relative_to(root).as_posix() for p in spec_audit.repository_paths(root) if p.is_file()}
            self.assertEqual(actual, set(included))

    def test_module_inventory_ignores_generated_specifications(self):
        from scripts import spec_audit
        self.assertTrue(callable(getattr(spec_audit, "module_spec_directories", None)))
        with TemporaryDirectory() as directory:
            root = Path(directory)
            for name in ["01_LocalBazaar/mod_real/SPEC.md", "app/node_modules/vendor/mod_fake/SPEC.md", "app/test-results/mod_fake/SPEC.md"]:
                target = root / name
                target.parent.mkdir(parents=True, exist_ok=True)
                target.write_text("fixture", encoding="utf-8")
            self.assertEqual(spec_audit.module_spec_directories(root), [root / "01_LocalBazaar/mod_real"])
