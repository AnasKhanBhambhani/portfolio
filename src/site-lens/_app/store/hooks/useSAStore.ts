// Site-audit store stub. The data hook is rewritten to serve mock data, so
// this only needs to satisfy any residual references.
export const useSAStore = () => ({
  siteAuditV2Ui: {
    siteAuditSelectedProperty: 'demo',
    updateSelectedSiteSA: (_id: string) => {},
  },
});

export default useSAStore;
