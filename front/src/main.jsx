import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { TonConnectUIProvider } from "@tonconnect/ui-react";

import { WagmiProvider, createConfig } from 'wagmi'
import { bsc } from 'wagmi/chains'
import { http } from 'viem'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

// ------- CSS که خواستی اینجاست -------
const globalStyle = `
button[data-tc-connect-button] svg {
  transform: scale(0.25);
  transform-origin: center;
  display: inline-block;
}
`;

// این قسمت style را به صفحه اضافه می‌کند
const styleTag = document.createElement("style");
styleTag.innerHTML = globalStyle;
document.head.appendChild(styleTag);
// --------------------------------------

// Wagmi Config
const config = createConfig({
  chains: [bsc],
  transports: {
    [bsc.id]: http(),
  },
})

const queryClient = new QueryClient()

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <TonConnectUIProvider manifestUrl="https://www.cryptoocapitalhub.com/tonconnect-manifest.json">
          <App />
        </TonConnectUIProvider>
      </QueryClientProvider>
    </WagmiProvider>
  </StrictMode>
)
