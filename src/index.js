// recursos novos do JavaScript para navegadores antigos (tablets com Chrome desatualizado)
import "core-js/stable";
import "regenerator-runtime/runtime";
import React from "react";
import { createRoot} from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "App";

// Vision UI Dashboard React Context Provider
import { VisionUIControllerProvider } from "context";
import { EscolaProvider } from "context/escola";

const rootElement = document.getElementById('root');
const root = createRoot(rootElement);


root.render(<BrowserRouter>
  <VisionUIControllerProvider>
    <EscolaProvider>
      <App />
    </EscolaProvider>
  </VisionUIControllerProvider>
</BrowserRouter>)

