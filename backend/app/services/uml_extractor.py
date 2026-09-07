import ast
import uuid
import logging
from pathlib import Path
from typing import Any

from app.models.analysis_graph_node import AnalysisGraphNode
from app.models.analysis_graph_edge import AnalysisGraphEdge

logger = logging.getLogger(__name__)

class UmlAstVisitor(ast.NodeVisitor):
    def __init__(self, rel_path: str):
        self.rel_path = rel_path
        self.nodes = []
        self.edges = []
        self.current_class = None

    def _make_node_key(self, name: str, parent: str = None) -> str:
        if parent:
            return f"{self.rel_path}::{parent}::{name}"
        return f"{self.rel_path}::{name}"

    def visit_ClassDef(self, node: ast.ClassDef):
        class_key = self._make_node_key(node.name)
        self.nodes.append({
            "node_key": class_key,
            "label": node.name,
            "node_type": "class",
            "metadata": {"line": node.lineno}
        })
        
        # Edge: module -> class (contains)
        self.edges.append({
            "source_key": self.rel_path,
            "target_key": class_key,
            "edge_type": "contains"
        })
        
        # Inheritance
        for base in node.bases:
            if isinstance(base, ast.Name):
                base_name = base.id
                # Heuristic: base_name might be local or imported. We just use the name for now.
                # A more advanced resolver would link to the actual imported class.
                self.edges.append({
                    "source_key": class_key,
                    "target_key": f"unresolved::{base_name}",
                    "edge_type": "inherits"
                })

        # Visit methods
        prev_class = self.current_class
        self.current_class = class_key
        self.generic_visit(node)
        self.current_class = prev_class

    def visit_FunctionDef(self, node: ast.FunctionDef):
        self._visit_func(node)

    def visit_AsyncFunctionDef(self, node: ast.AsyncFunctionDef):
        self._visit_func(node)
        
    def _visit_func(self, node):
        if self.current_class:
            func_key = self._make_node_key(node.name, parent=self.current_class.split("::")[-1])
            node_type = "method"
            parent_key = self.current_class
        else:
            func_key = self._make_node_key(node.name)
            node_type = "function"
            parent_key = self.rel_path

        self.nodes.append({
            "node_key": func_key,
            "label": node.name,
            "node_type": node_type,
            "metadata": {"line": node.lineno}
        })
        
        self.edges.append({
            "source_key": parent_key,
            "target_key": func_key,
            "edge_type": "contains"
        })
        
        self.generic_visit(node)


def extract_architecture(
    analysis_id: uuid.UUID,
    workspace_path: str,
    parsed_by_path: dict[str, Any],
    resolved_deps: dict[str, list[str]]
) -> tuple[list[AnalysisGraphNode], list[AnalysisGraphEdge]]:
    """
    Extracts detailed architecture nodes (classes, methods, functions) and relationships
    from the parsed workspace and builds SQLAlchemy model instances.
    """
    db_nodes = []
    db_edges = []
    
    # Track node keys to avoid duplicates
    created_nodes_keys = set()
    node_key_to_id = {}
    
    def add_node(key: str, label: str, node_type: str, metadata: dict = None):
        if key in created_nodes_keys:
            return node_key_to_id[key]
        node_id = uuid.uuid4()
        node = AnalysisGraphNode(
            id=node_id,
            analysis_id=analysis_id,
            node_key=key,
            label=label,
            node_type=node_type,
            node_metadata=metadata or {}
        )
        db_nodes.append(node)
        created_nodes_keys.add(key)
        node_key_to_id[key] = node_id
        return node_id

    # 1. Add all file nodes first
    for rel_path in parsed_by_path.keys():
        add_node(rel_path, label=rel_path.split("/")[-1], node_type="file")
        
    # 2. File-level import edges
    edge_tuples = set()
    for rel_path, targets in resolved_deps.items():
        source_id = node_key_to_id.get(rel_path)
        if not source_id:
            continue
        for target in targets:
            target_id = node_key_to_id.get(target)
            if target_id and (source_id, target_id, "imports") not in edge_tuples:
                db_edges.append(AnalysisGraphEdge(
                    id=uuid.uuid4(),
                    analysis_id=analysis_id,
                    source_node_id=source_id,
                    target_node_id=target_id,
                    edge_type="imports",
                    weight=1.0,
                    metadata={}
                ))
                edge_tuples.add((source_id, target_id, "imports"))
                
    # 3. Extract deep architecture (Python AST)
    for rel_path, parsed in parsed_by_path.items():
        if parsed.language == "python":
            try:
                abs_path = Path(workspace_path) / rel_path
                code = abs_path.read_text(encoding="utf-8")
                tree = ast.parse(code)
                visitor = UmlAstVisitor(rel_path)
                visitor.visit(tree)
                
                # Add nodes
                for n in visitor.nodes:
                    add_node(n["node_key"], n["label"], n["node_type"], n["metadata"])
                    
                # Add edges
                for e in visitor.edges:
                    source_id = node_key_to_id.get(e["source_key"])
                    target_key = e["target_key"]
                    
                    # If target doesn't exist (e.g. unresolved base class), create a stub node
                    if target_key not in node_key_to_id:
                        if target_key.startswith("unresolved::"):
                            label = target_key.replace("unresolved::", "")
                            add_node(target_key, label=label, node_type="external_class")
                        else:
                            continue
                            
                    target_id = node_key_to_id.get(target_key)
                    if source_id and target_id:
                        edge_sig = (source_id, target_id, e["edge_type"])
                        if edge_sig not in edge_tuples:
                            db_edges.append(AnalysisGraphEdge(
                                id=uuid.uuid4(),
                                analysis_id=analysis_id,
                                source_node_id=source_id,
                                target_node_id=target_id,
                                edge_type=e["edge_type"],
                                weight=1.0,
                                metadata={}
                            ))
                            edge_tuples.add(edge_sig)
            except Exception as exc:
                logger.debug("Failed to extract UML AST for %s: %s", rel_path, exc)
        else:
            # Fallback to simple definitions extraction for other languages
            if parsed.definitions:
                for def_name in parsed.definitions:
                    def_key = f"{rel_path}::{def_name}"
                    add_node(def_key, label=def_name, node_type="element")
                    
                    source_id = node_key_to_id.get(rel_path)
                    target_id = node_key_to_id.get(def_key)
                    if source_id and target_id:
                        edge_sig = (source_id, target_id, "contains")
                        if edge_sig not in edge_tuples:
                            db_edges.append(AnalysisGraphEdge(
                                id=uuid.uuid4(),
                                analysis_id=analysis_id,
                                source_node_id=source_id,
                                target_node_id=target_id,
                                edge_type="contains",
                                weight=1.0,
                                metadata={}
                            ))
                            edge_tuples.add(edge_sig)

    return db_nodes, db_edges

def generate_plantuml(nodes: list[AnalysisGraphNode], edges: list[AnalysisGraphEdge]) -> str:
    """
    Generates a PlantUML representation from DB nodes and edges.
    """
    lines = ["@startuml", "skinparam roundcorner 5", "skinparam componentStyle uml2"]
    
    # Group nodes by their parent file for packaging
    files = [n for n in nodes if n.node_type == "file"]
    file_to_nodes = {f.node_key: [] for f in files}
    other_nodes = []
    
    for n in nodes:
        if n.node_type != "file":
            parent = n.node_key.split("::")[0]
            if parent in file_to_nodes:
                file_to_nodes[parent].append(n)
            else:
                other_nodes.append(n)
                
    for file_node in files:
        lines.append(f'package "{file_node.label}" {{')
        children = file_to_nodes.get(file_node.node_key, [])
        for child in children:
            if child.node_type == "class":
                lines.append(f'    class "{child.label}" as {child.id.hex}')
            elif child.node_type == "method":
                # Assuming methods are handled within classes if we want a strict class diagram, 
                # but in PlantUML we can just declare them as entities or associate them.
                pass
            elif child.node_type == "function":
                lines.append(f'    entity "{child.label}()" as {child.id.hex}')
            else:
                lines.append(f'    component "{child.label}" as {child.id.hex}')
        lines.append("}")
        
    for n in other_nodes:
        if n.node_type == "external_class":
            lines.append(f'class "{n.label}" as {n.id.hex} <<external>>')
            
    # For classes, we might want to attach their methods inside the class body in PlantUML.
    # Let's do a second pass to add methods to classes.
    class_methods = {}
    for e in edges:
        if e.edge_type == "contains":
            source_node = next((n for n in nodes if n.id == e.source_node_id), None)
            target_node = next((n for n in nodes if n.id == e.target_node_id), None)
            if source_node and target_node and source_node.node_type == "class" and target_node.node_type == "method":
                if source_node.id not in class_methods:
                    class_methods[source_node.id] = []
                class_methods[source_node.id].append(target_node.label)
                
    for cid, methods in class_methods.items():
        for m in methods:
            lines.append(f'{cid.hex} : {m}()')
            
    # Edges
    for e in edges:
        source_node = next((n for n in nodes if n.id == e.source_node_id), None)
        target_node = next((n for n in nodes if n.id == e.target_node_id), None)
        
        if not source_node or not target_node:
            continue
            
        # We skip 'contains' because we visually nest them (package {} or class : method())
        if e.edge_type == "contains":
            continue
            
        # For imports, link files
        if e.edge_type == "imports" and source_node.node_type == "file" and target_node.node_type == "file":
            pass # lines.append(f'"{source_node.label}" --> "{target_node.label}" : imports')
            
        if e.edge_type == "inherits":
            lines.append(f'{target_node.id.hex} <|-- {source_node.id.hex}')
            
    lines.append("@enduml")
    return "\\n".join(lines)
