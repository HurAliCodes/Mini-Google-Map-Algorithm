import networkx as nx
import matplotlib.pyplot as plt

# --- CONFIGURATION ---
FILE_PATH = "nodes.txt"   # Path to your data file
MAX_NODES_TO_DRAW = 10   # Draw fewer nodes for clarity
USE_LAYOUT = "sfdp"       # Layout: sfdp, random, circular, or spring

# --- STEP 1: READ FILE EFFICIENTLY ---
G = nx.Graph()
with open(FILE_PATH) as f:
    current_node = None
    for line in f:
        line = line.strip()
        if not line:
            continue
        if line.startswith("Node:"):
            current_node = line.split(":")[1].strip()
        elif current_node and len(line.split()) == 2:
            target, dist = line.split()
            G.add_edge(current_node, target, weight=float(dist))

print(f"✅ Graph Loaded: {len(G.nodes)} nodes, {len(G.edges)} edges")

# --- STEP 2: CREATE SMALLER SUBGRAPH FOR VISUALIZATION ---
if len(G.nodes) > MAX_NODES_TO_DRAW:
    sample_nodes = list(G.nodes)[:MAX_NODES_TO_DRAW]
    H = G.subgraph(sample_nodes)
    print(f"📉 Visualizing only {len(H.nodes)} nodes for performance")
else:
    H = G

# --- STEP 3: CHOOSE LAYOUT (FAST) ---
try:
    if USE_LAYOUT == "sfdp":
        pos = nx.nx_agraph.graphviz_layout(H, prog="sfdp")  # needs pygraphviz
    elif USE_LAYOUT == "circular":
        pos = nx.circular_layout(H)
    elif USE_LAYOUT == "random":
        pos = nx.random_layout(H)
    else:
        pos = nx.spring_layout(H, iterations=10)
except Exception as e:
    print(f"⚠️ Layout fallback: {e}")
    pos = nx.random_layout(H)

# --- STEP 4: DRAW GRAPH ---
plt.figure(figsize=(12, 12))
nx.draw_networkx_nodes(H, pos, node_size=25, node_color="deepskyblue", alpha=0.8)
nx.draw_networkx_edges(H, pos, edge_color="gray", alpha=0.3, width=0.7)

# Edge weight labels
edge_labels = nx.get_edge_attributes(H, "weight")
nx.draw_networkx_edge_labels(H, pos, edge_labels={k: f"{v:.2f}" for k, v in edge_labels.items()}, font_size=5)

# Optional node labels (commented out to keep it fast)
# nx.draw_networkx_labels(H, pos, font_size=6)

plt.title("Graph Visualization with Edge Weights (Sample Subgraph)")
plt.axis("off")
plt.tight_layout()
plt.show()
