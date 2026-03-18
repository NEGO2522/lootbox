import React, { useState, useEffect } from "react";
import ReactDOM from "react-dom/client";
import App from "./App.jsx";
import Landing from "./Landing.jsx";

import { SuiClientProvider, WalletProvider } from "@mysten/dapp-kit";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import "@mysten/dapp-kit/dist/index.css";

const queryClient = new QueryClient();

const networks = {
  testnet: { url: import.meta.env.VITE_RPC_URL || "https://fullnode.testnet.sui.io:443" },
};

function Router() {
  const [route, setRoute] = useState(() =>
    window.location.pathname === "/app" ? "app" : "landing"
  );

  // Keep URL in sync with state
  useEffect(() => {
    const path = route === "app" ? "/app" : "/";
    if (window.location.pathname !== path) {
      window.history.pushState({}, "", path);
    }
  }, [route]);

  // Handle browser back/forward buttons
  useEffect(() => {
    const onPop = () => {
      setRoute(window.location.pathname === "/app" ? "app" : "landing");
    };
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, []);

  const goToApp     = () => setRoute("app");
  const goToLanding = () => setRoute("landing");

  return route === "app"
    ? <App onBack={goToLanding} />
    : <Landing onEnter={goToApp} />;
}

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <SuiClientProvider networks={networks} defaultNetwork="testnet">
        <WalletProvider autoConnect>
          <Router />
        </WalletProvider>
      </SuiClientProvider>
    </QueryClientProvider>
  </React.StrictMode>
);
