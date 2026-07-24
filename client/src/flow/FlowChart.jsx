import { useEffect, useState } from 'react';
import ReactFlow, {
  Background,
  Controls,
  MiniMap,
  addEdge,
  useNodesState,
  useEdgesState,
} from 'reactflow';
import 'reactflow/dist/style.css';

const statusColors = {
  PENDING: '#ef4444',
  IN_PROGRESS: '#eab308',
  DONE: '#22c55e',
};

const buildNodesAndEdges = (event) => {
  const nodes = [];
  const edges = [];

  let yOffset = 0;

  event.branches.forEach((branch, branchIndex) => {
    const xOffset = branchIndex * 300;

    // Branch label node
    nodes.push({
      id: `branch-${branch.id}`,
      type: 'default',
      position: { x: xOffset, y: yOffset },
      data: { label: branch.title },
      style: {
        background: '#1e293b',
        color: '#94a3b8',
        border: '1px solid #334155',
        borderRadius: '8px',
        fontSize: '11px',
        padding: '6px 12px',
      },
    });

    branch.nodes.forEach((node, nodeIndex) => {
      const nodeY = yOffset + 80 + nodeIndex * 100;

      nodes.push({
        id: node.id,
        type: 'default',
        position: { x: xOffset, y: nodeY },
        data: {
          label: (
            <div>
              <div style={{ fontSize: '11px', fontWeight: 600, marginBottom: 4 }}>
                {node.title}
              </div>
              <div style={{
                fontSize: '10px',
                color: statusColors[node.status],
                textTransform: 'uppercase'
              }}>
                {node.status}
              </div>
            </div>
          ),
          nodeData: node,
        },
        style: {
          background: '#0f172a',
          color: '#e2e8f0',
          border: `2px solid ${statusColors[node.status]}`,
          borderRadius: '10px',
          padding: '8px 12px',
          minWidth: '180px',
        },
      });

      // Edge from branch label to first node
      if (nodeIndex === 0) {
        edges.push({
          id: `e-branch-${branch.id}-${node.id}`,
          source: `branch-${branch.id}`,
          target: node.id,
          style: { stroke: '#334155' },
        });
      }

      // Edge between consecutive nodes
      if (nodeIndex > 0) {
        edges.push({
          id: `e-${branch.nodes[nodeIndex - 1].id}-${node.id}`,
          source: branch.nodes[nodeIndex - 1].id,
          target: node.id,
          style: { stroke: '#334155' },
        });
      }
    });

    // Edge from parent branch to sub branch
    if (branch.parentBranchId) {
      edges.push({
        id: `e-parent-${branch.parentBranchId}-${branch.id}`,
        source: `branch-${branch.parentBranchId}`,
        target: `branch-${branch.id}`,
        style: { stroke: '#3b82f6', strokeDasharray: '5,5' },
        animated: true,
      });
    }
  });

  return { nodes, edges };
};

export default function FlowChart({ event, onNodeClick, onAddNode, onAddSubBranch }) {
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);

  useEffect(() => {
    if (event) {
      const { nodes: n, edges: e } = buildNodesAndEdges(event);
      setNodes(n);
      setEdges(e);
    }
  }, [event]);

  const handleNodeClick = (_, node) => {
    if (node.data.nodeData) {
      onNodeClick(node.data.nodeData);
    }
  };

  return (
    <div style={{ width: '100%', height: '100%', minHeight: '600px' }}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onNodeClick={handleNodeClick}
        fitView
      >
        <Background color="#1e293b" gap={20} />
        <Controls />
        <MiniMap
          nodeColor={(node) => {
            if (node.data?.nodeData?.status) {
              return statusColors[node.data.nodeData.status];
            }
            return '#334155';
          }}
          style={{ background: '#0f172a' }}
        />
      </ReactFlow>
    </div>
  );
}