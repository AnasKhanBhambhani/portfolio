import { createContext, useContext } from "react";

// Provided by App.jsx: call flipNavigate("/site-lens") (or any known path) to
// trigger the whole-page flip transition and switch routes once it completes.
const FlipNavContext = createContext(null);

export function FlipNavProvider({ value, children }) {
  return <FlipNavContext.Provider value={value}>{children}</FlipNavContext.Provider>;
}

export function useFlipNav() {
  const flipNavigate = useContext(FlipNavContext);
  if (!flipNavigate) {
    throw new Error("useFlipNav must be used within a FlipNavProvider");
  }
  return flipNavigate;
}
