import type {INodeData, Topic, KeywordWithWeight} from '../../../../types';
import {TOPIC_COLORS, STOP_WORDS} from '../../../../constants';

export function extractTopics(nodes: INodeData[], numTopics: number = 8, isNodeFiltered?: (node: INodeData) => boolean): Topic[] {
  const topicGroups: Map<string, INodeData[]> = new Map();

  nodes.forEach(node => {
    try {
      const url = new URL(node.url);
      const pathParts = url.pathname.split('/').filter(p => p);
      let topicKey = pathParts[0] || 'homepage';

      if (topicKey === 'homepage' || pathParts.length === 0) {
        const hostname = url.hostname.replace(/^www\./, '');
        topicKey = hostname.toUpperCase();
      }

      if (!topicGroups.has(topicKey)) {
        topicGroups.set(topicKey, []);
      }
      topicGroups.get(topicKey)!.push(node);
    } catch {
      if (!topicGroups.has('other')) {
        topicGroups.set('other', []);
      }
      topicGroups.get('other')!.push(node);
    }
  });

  const sortedTopics = Array.from(topicGroups.entries())
    .sort((a, b) => b[1].length - a[1].length)
    .slice(0, numTopics);

  return sortedTopics.map(([key, topicNodes], index) => {
    const allText = topicNodes.map(n =>
      `${n.name} ${n.h1Header || ''} ${n.h2Header || ''}`,
    ).join(' ').toLowerCase();

    const words = allText.split(/\W+/).filter(w => w.length > 3);
    const wordFreq: Map<string, number> = new Map();
    words.forEach(w => wordFreq.set(w, (wordFreq.get(w) || 0) + 1));

    const sortedKeywords = Array.from(wordFreq.entries())
      .filter(([word]) => !STOP_WORDS.includes(word))
      .sort((a, b) => b[1] - a[1]);

    const topKeywords = sortedKeywords
      .slice(0, 5)
      .map(([word]) => word);

    const keywordWeights: KeywordWithWeight[] = sortedKeywords
      .slice(0, 40)
      .map(([word, freq]) => ({word, weight: freq}));

    const hasFilteredNodes = isNodeFiltered && topicNodes.some(n => isNodeFiltered(n));

    let topicName = key;
    if (key.includes('.') && key === key.toUpperCase()) {
      topicName = key;
    } else if ((key === 'homepage' || key.includes('.')) && topicNodes.length > 0) {
      const firstNode = topicNodes[0];
      if (firstNode.name && firstNode.name.trim()) {
        topicName = firstNode.name;
      } else {
        try {
          const url = new URL(firstNode.url);
          const hostname = url.hostname.replace(/^www\./, '');
          topicName = hostname.toUpperCase();
        } catch {
          topicName = key;
        }
      }
    } else {
      topicName = key.charAt(0).toUpperCase() + key.slice(1).replace(/-/g, ' ');
    }

    return {
      id: index,
      name: topicName,
      keywords: topKeywords.length > 0 ? topKeywords : [key],
      keywordWeights: keywordWeights.length > 0 ? keywordWeights : [{word: key, weight: 1}],
      color: TOPIC_COLORS[index % TOPIC_COLORS.length],
      nodes: topicNodes,
      weight: topicNodes.length,
      hasFilteredNodes,
    };
  });
}
