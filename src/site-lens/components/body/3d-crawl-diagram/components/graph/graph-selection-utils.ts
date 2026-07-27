import {getEndpointId} from './graph-layouts';

export interface ISelectionLink {
  source: number | {id: number};
  target: number | {id: number};
}

/**
 * Builds the set of node ids that make up the highlighted "branch" for a selected node: the node
 * itself, the FULL ancestor chain up to the root (parent, grandparent, ... all the way up, so the
 * connection back to the root stays visible), and its ENTIRE downstream subtree (children,
 * grandchildren, ... all the way down). Both walks are iterative via the parentOf/childrenOf maps
 * to stay safe on pathologically deep chains.
 * @param {number} selectedId - the currently selected node id
 * @param {Map<number, number | null>} parentOf - canonical parent per node (from buildSpanningTree)
 * @param {Map<number, number[]>} childrenOf - children per node (from buildSpanningTree)
 * @return {Set<number>} node ids in the selected node's highlighted branch
 */
export const getSelectionHighlightSet = (
  selectedId: number,
  parentOf: Map<number, number | null>,
  childrenOf: Map<number, number[]>,
): Set<number> => {
  const highlightSet = new Set<number>();
  highlightSet.add(selectedId);

  // Walk the full ancestor chain "up" to the root, not just the immediate parent.
  let ancestorId = parentOf.get(selectedId);
  while (ancestorId != null && !highlightSet.has(ancestorId)) {
    highlightSet.add(ancestorId);
    ancestorId = parentOf.get(ancestorId);
  }

  // Walk the full downstream subtree iteratively.
  const stack: number[] = [selectedId];
  while (stack.length) {
    const currentId = stack.pop() as number;
    const children = childrenOf.get(currentId);
    if (!children?.length) continue;
    for (const childId of children) {
      if (highlightSet.has(childId)) continue;
      highlightSet.add(childId);
      stack.push(childId);
    }
  }

  return highlightSet;
};

/**
 * A link is highlighted only when BOTH of its endpoints are in the highlight set — this keeps the
 * highlighted branch a connected sub-tree and never lights up an edge that merely touches it on one
 * side. Endpoints may be raw ids or node-object refs (react-force-graph mutates them after the first
 * engine tick), so both shapes are normalized via getEndpointId.
 * @param {ISelectionLink} link - a graph link
 * @param {Set<number>} highlightSet - node ids in the highlighted branch
 * @return {boolean} true iff both endpoints are highlighted
 */
export const isLinkHighlighted = (link: ISelectionLink, highlightSet: Set<number>): boolean => {
  if (!highlightSet.size) return false;
  const sourceId = getEndpointId(link.source);
  const targetId = getEndpointId(link.target);
  return highlightSet.has(sourceId) && highlightSet.has(targetId);
};
