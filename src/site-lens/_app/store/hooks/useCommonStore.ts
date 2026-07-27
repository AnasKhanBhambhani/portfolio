// The portfolio has no customer profile / whitelabel logo. Return an empty
// profile so `watermarkLogoUrl` resolution falls back to the default.
export const useCommonStore = () => ({
  settings: {
    customer: {
      profile: {
        whitelabelOtto: null as string | null,
        isWhitelabel: false,
      },
    },
  },
});

export default useCommonStore;
