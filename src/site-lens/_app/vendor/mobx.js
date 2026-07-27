// Stub for mobx-react / mobx-react-lite. The portfolio has no MobX store, so
// `observer` is just an identity HOC that returns the component unchanged.
export const observer = (component) => component;
export default { observer };
