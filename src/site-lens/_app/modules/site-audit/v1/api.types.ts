// Minimal crawl-graph API types (type-only imports in the ported code).
export interface IDepthNode {
  id: number;
  url: string;
  name: string;
  depth: number;
  children?: IDepthNode[];
  [key: string]: unknown;
}

export interface IDepthLink {
  source: number;
  target: number;
}

export interface IDepthNodesGraph {
  nodes: IDepthNode[];
  links: IDepthLink[];
  categories?: {name: string}[];
}
