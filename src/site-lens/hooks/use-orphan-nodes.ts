import {useMemo} from 'react';

export const useOrphanNodes = (depthNodesGraph: any, hideOrphans: boolean) => {
  const orphanNodes = useMemo(() => {
    if (!depthNodesGraph) return [];
    const nodes = (depthNodesGraph as any).nodes || [];
    const links = (depthNodesGraph as any).links || [];
    const targetNodeIds = new Set<number>();
    links.forEach((link: any) => {
      const targetId = typeof link.target === 'object' ? link.target.id : link.target;
      if (targetId !== undefined && targetId !== null) {
        targetNodeIds.add(targetId);
      }
    });
    return nodes.map((node: any) => {
      const hasIncomingLinks = targetNodeIds.has(node.id);
      const isOrphan = !hasIncomingLinks && (node.depth ?? 0) > 0;
      return {
        ...node,
        isOrphan,
      };
    });
  }, [depthNodesGraph]);

  const orphanCount = useMemo(() => {
    return orphanNodes.filter((node: any) => node.isOrphan === true).length;
  }, [orphanNodes]);

  const orphanNodeIds = useMemo(() => {
    const ids = new Set<number>();
    orphanNodes.forEach((node: any) => {
      if (node.isOrphan === true) {
        ids.add(node.id);
      }
    });
    return ids;
  }, [orphanNodes]);

  const filteredNodesGraph = useMemo(() => {
    if (!depthNodesGraph) return depthNodesGraph;
    if (!hideOrphans) return depthNodesGraph;

    const filteredNodes = orphanNodes.filter((node: any) => !node.isOrphan);
    const filteredNodeIds = new Set(filteredNodes.map((n: any) => n.id));
    const filteredLinks = ((depthNodesGraph as any).links || []).filter((link: any) => {
      const sourceId = typeof link.source === 'object' ? link.source.id : link.source;
      const targetId = typeof link.target === 'object' ? link.target.id : link.target;
      return filteredNodeIds.has(sourceId) && filteredNodeIds.has(targetId);
    });

    return {
      ...depthNodesGraph,
      nodes: filteredNodes,
      links: filteredLinks,
    };
  }, [depthNodesGraph, hideOrphans, orphanNodes]);

  return {orphanNodes, orphanCount, orphanNodeIds, filteredNodesGraph};
};
