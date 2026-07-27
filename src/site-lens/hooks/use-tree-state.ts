import {useState, useCallback, useEffect} from 'react';
import type {ITreeNode, IUseTreeStateParams, IUseTreeStateResult} from '../components/header/filter-drawer/types';
import {findNode, getAllNodeIds, getNodeBackendId} from '../functions';


const useTreeState = ({
  data,
  defaultExpandDepth,
  allNodeIdsForExpand,
  allNodeIds,
  selectedIds,
  onSelectionChange,
  depthNodes,
  depthNodesGraph,
}: IUseTreeStateParams): IUseTreeStateResult => {
  const [expandedNodes, setExpandedNodes] = useState<Set<number>>(new Set());
  const [collapsedNodes, setCollapsedNodes] = useState<Set<number>>(new Set());

  useEffect(() => {
    setExpandedNodes(new Set());
    setCollapsedNodes(new Set());
  }, [depthNodes, depthNodesGraph]);

  const handleToggleExpand = useCallback((nodeId: number) => {
    const node = data ? findNode(data, nodeId) : null;
    const isDefaultExpanded = node && node.depth < defaultExpandDepth;

    setExpandedNodes(prev => {
      const newSet = new Set(prev);
      if (newSet.has(nodeId)) newSet.delete(nodeId);
      else newSet.add(nodeId);
      return newSet;
    });

    setCollapsedNodes(prev => {
      const newSet = new Set(prev);
      if (isDefaultExpanded) {
        if (newSet.has(nodeId)) newSet.delete(nodeId);
        else newSet.add(nodeId);
      } else {
        if (newSet.has(nodeId)) newSet.delete(nodeId);
      }
      return newSet;
    });
  }, [data, defaultExpandDepth]);

  const handleToggleNode = useCallback((node: ITreeNode, selected: boolean) => {
    const newIds = new Set(selectedIds);
    const nodeBackendId = getNodeBackendId(node);
    if (selected) newIds.add(nodeBackendId);
    else newIds.delete(nodeBackendId);
    onSelectionChange(newIds);
  }, [selectedIds, onSelectionChange]);

  const handleToggleSubtree = useCallback((node: ITreeNode, selected: boolean) => {
    const subtreeIds = getAllNodeIds(node);
    const newIds = new Set(selectedIds);
    subtreeIds.forEach(id => {
      if (selected) newIds.add(id);
      else newIds.delete(id);
    });
    onSelectionChange(newIds);
  }, [selectedIds, onSelectionChange]);

  const handleSelectAll = useCallback(() => {
    onSelectionChange(new Set(allNodeIds));
  }, [allNodeIds, onSelectionChange]);

  const handleDeselectAll = useCallback(() => {
    onSelectionChange(new Set());
  }, [onSelectionChange]);

  const handleInvertSelection = useCallback(() => {
    const newIds = new Set<number>();
    allNodeIds.forEach(id => {
      if (!selectedIds.has(id)) newIds.add(id);
    });
    onSelectionChange(newIds);
  }, [allNodeIds, selectedIds, onSelectionChange]);

  const handleExpandAll = useCallback(() => {
    setCollapsedNodes(new Set());
    setExpandedNodes(new Set(allNodeIdsForExpand));
  }, [allNodeIdsForExpand]);

  const handleCollapseAll = useCallback(() => {
    setExpandedNodes(new Set());
    setCollapsedNodes(new Set(allNodeIdsForExpand));
  }, [allNodeIdsForExpand]);

  return {
    expandedNodes,
    collapsedNodes,
    handleToggleExpand,
    handleToggleNode,
    handleToggleSubtree,
    handleSelectAll,
    handleDeselectAll,
    handleInvertSelection,
    handleExpandAll,
    handleCollapseAll,
  };
};

export default useTreeState;
