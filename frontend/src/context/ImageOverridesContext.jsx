import { createContext, useContext, useEffect, useState } from "react";

const API = "/api";
const ImageOverridesContext = createContext({});

export function ImageOverridesProvider({ children }) {
  const [overrides, setOverrides] = useState({});

  useEffect(() => {
    fetch(`${API}/bookings/site-images`)
      .then((r) => r.json())
      .then((data) => { if (data && typeof data === "object") setOverrides(data); })
      .catch(() => {});
  }, []);

  return (
    <ImageOverridesContext.Provider value={overrides}>
      {children}
    </ImageOverridesContext.Provider>
  );
}

// Hook: resolve an image URL — returns override if set, else the original
export function useImageOverrides() {
  const overrides = useContext(ImageOverridesContext);
  const resolve = (key, defaultUrl) => overrides[key] || defaultUrl;
  return { overrides, resolve };
}
