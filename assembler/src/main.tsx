import React, { StrictMode, useEffect, ReactNode } from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import { useStore } from './store/useStore'

const StoreInitializer = ({ children }: { children: ReactNode }) => {
  const initialize = useStore((state) => state.initialize);
  useEffect(() => {
    initialize();
  }, [initialize]);
  return <>{children}</>;
};

ReactDOM.createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <StoreInitializer>
      <App />
    </StoreInitializer>
  </StrictMode>,
)

