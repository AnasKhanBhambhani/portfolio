import {useMemo} from 'react';
import {buildMockCrawl} from '@/mock-crawl-data';

/**
 * Site-Lens depth-nodes accessor. In the source app this resolves a site id and
 * fetches the crawl graph from the backend; the portfolio has no crawl backend,
 * so this is the integration seam (see spec §2) and returns a deterministic mock
 * crawl of a personal developer site, in the exact expected shape:
 *   { siteIdString, depthNodes, depthNodesGraph, lastDepthNode, loadingDepthNodes }
 */
export function useSiteLensDepthData(_nodeSizeBy: string = 'impressions') {
  const crawl = useMemo(() => buildMockCrawl(), []);
  return {
    siteIdString: 'demo',
    depthNodes: crawl.depthNodes,
    depthNodesGraph: crawl.depthNodesGraph,
    lastDepthNode: crawl.lastDepthNode,
    loadingDepthNodes: false,
  };
}
