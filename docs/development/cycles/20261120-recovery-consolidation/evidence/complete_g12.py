from pathlib import Path
import json, runpy, sys
runner = "/workspace/scratch/e0ea2385d962/classrup-validation/run_g12.py"
sys.argv = [runner, "isolated-vault"]
s = runpy.run_path(runner)
s["domain"]("vault-composition", ["packages/vault/src/vault.test.ts"])
sys.argv = [runner, "final-other"]
s = runpy.run_path(runner)
root = s["ROOT"]
for name, command in [("tooling",["node","--test",*sorted(str(p.relative_to(root)) for p in root.glob("tests/tooling/*.test.mjs"))]),("cli",["node","--test",*sorted(str(p.relative_to(root)) for p in root.glob("tests/cli/*.test.mjs"))]),("setup",["node","tools/cli/classrup.mjs","setup","--non-interactive"]),("build",["node","tools/cli/classrup.mjs","build"])]:
    s["check"](name, command)
print(json.dumps({"receipt_directory":str(s["OUT"]),"all_checks_passed":all(c["exit_code"]==0 for c in s["CHECKS"])}),flush=True)
