import logging
import re
from dataclasses import dataclass, field
from pathlib import Path
from typing import Any

from tree_sitter import Language, Parser

logger = logging.getLogger(__name__)

# Initialize language instances lazily or on module load
_PARSERS: dict[str, Parser] = {}


def _get_parser(language: str) -> Parser | None:
    if language in _PARSERS:
        return _PARSERS[language]

    try:
        if language == "python":
            import tree_sitter_python
            lang = Language(tree_sitter_python.language())
        elif language == "javascript":
            import tree_sitter_javascript
            lang = Language(tree_sitter_javascript.language())
        elif language == "typescript":
            import tree_sitter_typescript
            lang = Language(tree_sitter_typescript.language_typescript())
        elif language == "java":
            import tree_sitter_java
            lang = Language(tree_sitter_java.language())
        elif language == "c":
            import tree_sitter_c
            lang = Language(tree_sitter_c.language())
        elif language == "cpp":
            import tree_sitter_cpp
            lang = Language(tree_sitter_cpp.language())
        elif language == "go":
            import tree_sitter_go
            lang = Language(tree_sitter_go.language())
        else:
            return None

        parser = Parser(lang)
        _PARSERS[language] = parser
        return parser
    except Exception as e:
        logger.warning("Could not initialize tree-sitter parser for %s: %s", language, e)
        return None


@dataclass
class ParsedFile:
    rel_path: str
    language: str | None
    imports: list[str] = field(default_factory=list)
    definitions: list[str] = field(default_factory=list)
    calls: list[str] = field(default_factory=list)
    ast_node_count: int = 0
    error_node_count: int = 0
    has_syntax_errors: bool = False


# Fallback regex patterns for various languages
PYTHON_IMPORT_REGEX = re.compile(
    r"^\s*(?:from\s+([a-zA-Z0-9_\.]+)\s+import|import\s+([a-zA-Z0-9_\.]+))",
    re.MULTILINE,
)
JS_TS_IMPORT_REGEX = re.compile(
    r"""(?:import\s+.*?from\s+['"]([^'"]+)['"]|require\s*\(\s*['"]([^'"]+)['"]\s*\)|import\s*\(\s*['"]([^'"]+)['"]\s*\))""",
    re.MULTILINE,
)
GO_IMPORT_REGEX = re.compile(r"""import\s+(?:\(\s*([^)]+)\s*\)|"([^"]+)")""", re.MULTILINE)
C_CPP_INCLUDE_REGEX = re.compile(r'#include\s+["<]([^">]+)[">]', re.MULTILINE)
JAVA_IMPORT_REGEX = re.compile(r"^\s*import\s+(?:static\s+)?([a-zA-Z0-9_\.]+);", re.MULTILINE)


def _regex_extract_imports(code: str, language: str | None) -> list[str]:
    results: set[str] = set()
    if not language:
        return []

    if language == "python":
        for match in PYTHON_IMPORT_REGEX.finditer(code):
            imp = match.group(1) or match.group(2)
            if imp:
                results.add(imp.strip())
    elif language in {"javascript", "typescript"}:
        for match in JS_TS_IMPORT_REGEX.finditer(code):
            imp = match.group(1) or match.group(2) or match.group(3)
            if imp:
                results.add(imp.strip())
    elif language == "go":
        for match in GO_IMPORT_REGEX.finditer(code):
            block, single = match.group(1), match.group(2)
            if single:
                results.add(single.strip())
            elif block:
                for line in block.splitlines():
                    clean_line = line.strip().strip('"')
                    if clean_line:
                        results.add(clean_line)
    elif language in {"c", "cpp"}:
        for match in C_CPP_INCLUDE_REGEX.finditer(code):
            results.add(match.group(1).strip())
    elif language == "java":
        for match in JAVA_IMPORT_REGEX.finditer(code):
            results.add(match.group(1).strip())

    return sorted(list(results))


def parse_source_code(rel_path: str, code_bytes: bytes, language: str | None) -> ParsedFile:
    """
    Parse source code into AST using tree-sitter, extracting imports, definitions, and calls.
    Falls back to regex extraction if tree-sitter is unavailable or encounters critical issues.
    """
    parsed = ParsedFile(rel_path=rel_path, language=language)

    code_str = ""
    try:
        code_str = code_bytes.decode("utf-8", errors="replace")
    except Exception:
        pass

    if not language or language not in {"python", "javascript", "typescript", "java", "c", "cpp", "go"}:
        return parsed

    parser = _get_parser(language)
    if not parser:
        parsed.imports = _regex_extract_imports(code_str, language)
        return parsed

    try:
        tree = parser.parse(code_bytes)
        root = tree.root_node

        imports_set: set[str] = set()
        definitions_set: set[str] = set()
        calls_set: set[str] = set()
        node_count = 0
        error_count = 0

        # Traverse tree
        cursor = root.walk()
        visited_children = False

        while True:
            node = cursor.node
            node_count += 1
            if node.is_error or node.is_missing:
                error_count += 1

            ntype = node.type

            # Extract imports per language
            if language == "python":
                if ntype == "import_statement":
                    for child in node.children:
                        if child.type == "dotted_name":
                            imports_set.add(child.text.decode("utf-8", errors="replace"))
                elif ntype == "import_from_statement":
                    mod_name = ""
                    for child in node.children:
                        if child.type in {"dotted_name", "relative_import"}:
                            mod_name = child.text.decode("utf-8", errors="replace")
                            break
                    if mod_name:
                        imports_set.add(mod_name)
                elif ntype in {"function_definition", "class_definition"}:
                    for child in node.children:
                        if child.type == "identifier":
                            definitions_set.add(child.text.decode("utf-8", errors="replace"))
                            break
                elif ntype == "call":
                    func_node = node.child_by_field_name("function")
                    if func_node:
                        calls_set.add(func_node.text.decode("utf-8", errors="replace"))

            elif language in {"javascript", "typescript"}:
                if ntype == "import_statement":
                    source_node = node.child_by_field_name("source")
                    if source_node and source_node.type == "string":
                        raw_val = source_node.text.decode("utf-8", errors="replace").strip("'\"")
                        imports_set.add(raw_val)
                elif ntype == "call_expression":
                    func_node = node.child_by_field_name("function")
                    if func_node:
                        fname = func_node.text.decode("utf-8", errors="replace")
                        calls_set.add(fname)
                        if fname == "require":
                            args = node.child_by_field_name("arguments")
                            if args and len(args.children) > 1:
                                arg_str = args.children[1].text.decode("utf-8", errors="replace").strip("'\"")
                                imports_set.add(arg_str)
                elif ntype in {"function_declaration", "class_declaration", "method_definition"}:
                    name_node = node.child_by_field_name("name")
                    if name_node:
                        definitions_set.add(name_node.text.decode("utf-8", errors="replace"))

            elif language == "go":
                if ntype == "import_spec":
                    path_node = node.child_by_field_name("path")
                    if path_node:
                        raw_val = path_node.text.decode("utf-8", errors="replace").strip('"')
                        imports_set.add(raw_val)
                elif ntype in {"function_declaration", "method_declaration"}:
                    name_node = node.child_by_field_name("name")
                    if name_node:
                        definitions_set.add(name_node.text.decode("utf-8", errors="replace"))
                elif ntype == "call_expression":
                    func_node = node.child_by_field_name("function")
                    if func_node:
                        calls_set.add(func_node.text.decode("utf-8", errors="replace"))

            elif language == "java":
                if ntype == "import_declaration":
                    for child in node.children:
                        if child.type in {"scoped_identifier", "identifier"}:
                            imports_set.add(child.text.decode("utf-8", errors="replace"))
                elif ntype in {"method_declaration", "class_declaration", "interface_declaration"}:
                    name_node = node.child_by_field_name("name")
                    if name_node:
                        definitions_set.add(name_node.text.decode("utf-8", errors="replace"))

            elif language in {"c", "cpp"}:
                if ntype == "preproc_include":
                    path_node = node.child_by_field_name("path")
                    if path_node:
                        raw_val = path_node.text.decode("utf-8", errors="replace").strip('<">')
                        imports_set.add(raw_val)
                elif ntype in {"function_definition", "class_specifier", "struct_specifier"}:
                    declarator = node.child_by_field_name("declarator")
                    if declarator:
                        definitions_set.add(declarator.text.decode("utf-8", errors="replace"))

            # Step cursor
            if not visited_children and cursor.goto_first_child():
                continue
            if cursor.goto_next_sibling():
                visited_children = False
                continue
            if cursor.goto_parent():
                visited_children = True
                while True:
                    if cursor.goto_next_sibling():
                        visited_children = False
                        break
                    if not cursor.goto_parent():
                        break
                if not visited_children:
                    continue
            break

        # Also combine regex results to guarantee nothing was missed due to syntax tolerances
        regex_imports = _regex_extract_imports(code_str, language)
        for r_imp in regex_imports:
            imports_set.add(r_imp)

        parsed.imports = sorted(list(imports_set))
        parsed.definitions = sorted(list(definitions_set))
        parsed.calls = sorted(list(calls_set))
        parsed.ast_node_count = node_count
        parsed.error_node_count = error_count
        parsed.has_syntax_errors = error_count > 0

    except Exception as e:
        logger.debug("Tree-sitter parse error for %s, falling back to regex: %s", rel_path, e)
        parsed.imports = _regex_extract_imports(code_str, language)

    return parsed
