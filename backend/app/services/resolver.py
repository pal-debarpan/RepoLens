import posixpath
from pathlib import PurePosixPath
from typing import NamedTuple


class ResolvedImport(NamedTuple):
    raw_import: str
    is_local: bool
    resolved_path: str | None
    is_external: bool


def resolve_import(
    source_file: str,
    raw_import: str,
    all_files: set[str],
    language: str | None,
) -> ResolvedImport:
    """
    Resolve an import statement against known repository files.
    Returns ResolvedImport indicating whether it resolved to a local file or is external.
    """
    clean_imp = raw_import.strip("'\"")
    src_posix = PurePosixPath(source_file)
    src_dir = src_posix.parent.as_posix()

    # 1. JavaScript / TypeScript resolution
    if language in {"javascript", "typescript"}:
        if clean_imp.startswith(".") or clean_imp.startswith("/"):
            base_dir = "" if clean_imp.startswith("/") else src_dir
            norm_target = posixpath.normpath(posixpath.join(base_dir, clean_imp.lstrip("/")))

            candidates = [
                norm_target,
                f"{norm_target}.js",
                f"{norm_target}.jsx",
                f"{norm_target}.ts",
                f"{norm_target}.tsx",
                f"{norm_target}.mjs",
                f"{norm_target}.cjs",
                f"{norm_target}.json",
                posixpath.join(norm_target, "index.js"),
                posixpath.join(norm_target, "index.jsx"),
                posixpath.join(norm_target, "index.ts"),
                posixpath.join(norm_target, "index.tsx"),
            ]
            for cand in candidates:
                if cand in all_files:
                    return ResolvedImport(raw_import=raw_import, is_local=True, resolved_path=cand, is_external=False)

            # Look for fuzzy basename match if exact resolution failed
            base_name = PurePosixPath(norm_target).name
            for f in all_files:
                if PurePosixPath(f).stem == base_name or PurePosixPath(f).name == base_name:
                    return ResolvedImport(raw_import=raw_import, is_local=True, resolved_path=f, is_external=False)

            return ResolvedImport(raw_import=raw_import, is_local=False, resolved_path=None, is_external=True)
        else:
            # Check if an internal package alias or top-level folder matches
            for f in all_files:
                if f.startswith(clean_imp + "/") or PurePosixPath(f).stem == clean_imp:
                    return ResolvedImport(raw_import=raw_import, is_local=True, resolved_path=f, is_external=False)
            return ResolvedImport(raw_import=raw_import, is_local=False, resolved_path=None, is_external=True)

    # 2. Python resolution
    elif language == "python":
        # Check relative imports: .module, ..module
        if clean_imp.startswith("."):
            dots = len(clean_imp) - len(clean_imp.lstrip("."))
            remainder = clean_imp[dots:].replace(".", "/")
            curr_dir = src_posix
            for _ in range(dots - 1):
                curr_dir = curr_dir.parent
            target = posixpath.normpath(posixpath.join(curr_dir.parent.as_posix(), remainder))
            candidates = [
                f"{target}.py",
                posixpath.join(target, "__init__.py"),
            ]
            for cand in candidates:
                if cand in all_files:
                    return ResolvedImport(raw_import=raw_import, is_local=True, resolved_path=cand, is_external=False)

        # Dotted module paths: app.models.repository
        path_equiv = clean_imp.replace(".", "/")
        candidates = [
            f"{path_equiv}.py",
            posixpath.join(path_equiv, "__init__.py"),
        ]
        for cand in candidates:
            if cand in all_files:
                return ResolvedImport(raw_import=raw_import, is_local=True, resolved_path=cand, is_external=False)

        # Check subfolder matches e.g. "backend/app/..." or prefix match
        for f in all_files:
            if f.endswith(f"/{path_equiv}.py") or f.endswith(f"/{path_equiv}/__init__.py"):
                return ResolvedImport(raw_import=raw_import, is_local=True, resolved_path=f, is_external=False)

        # Direct basename match
        imp_leaf = clean_imp.split(".")[-1]
        for f in all_files:
            if PurePosixPath(f).stem == imp_leaf and f.endswith(".py"):
                return ResolvedImport(raw_import=raw_import, is_local=True, resolved_path=f, is_external=False)

        return ResolvedImport(raw_import=raw_import, is_local=False, resolved_path=None, is_external=True)

    # 3. C / C++ resolution
    elif language in {"c", "cpp"}:
        cand = posixpath.normpath(posixpath.join(src_dir, clean_imp))
        if cand in all_files:
            return ResolvedImport(raw_import=raw_import, is_local=True, resolved_path=cand, is_external=False)
        for f in all_files:
            if PurePosixPath(f).name == clean_imp:
                return ResolvedImport(raw_import=raw_import, is_local=True, resolved_path=f, is_external=False)
        return ResolvedImport(raw_import=raw_import, is_local=False, resolved_path=None, is_external=True)

    # 4. Java resolution
    elif language == "java":
        leaf = clean_imp.split(".")[-1]
        for f in all_files:
            if PurePosixPath(f).stem == leaf and f.endswith(".java"):
                return ResolvedImport(raw_import=raw_import, is_local=True, resolved_path=f, is_external=False)
        return ResolvedImport(raw_import=raw_import, is_local=False, resolved_path=None, is_external=True)

    # 5. Go resolution
    elif language == "go":
        leaf = clean_imp.split("/")[-1]
        for f in all_files:
            if PurePosixPath(f).parent.name == leaf and f.endswith(".go"):
                return ResolvedImport(raw_import=raw_import, is_local=True, resolved_path=f, is_external=False)
        return ResolvedImport(raw_import=raw_import, is_local=False, resolved_path=None, is_external=True)

    # Default fallback
    for f in all_files:
        if PurePosixPath(f).stem == clean_imp or PurePosixPath(f).name == clean_imp:
            return ResolvedImport(raw_import=raw_import, is_local=True, resolved_path=f, is_external=False)

    return ResolvedImport(raw_import=raw_import, is_local=False, resolved_path=None, is_external=True)
