import React from 'react';
import ReactDOM from 'react-dom/client';
import '../../../src/styles/govuk-foundation.scss';
import '../../../src/styles/homepage.css';
import './index.css';
import '@gcds-core/components-react/gcds.css';
import { defineCustomElement as defineGcdsTable } from '@gcds-core/components/dist/components/gcds-table.js';
import { PublishingApp } from './PublishingApp.tsx';

defineGcdsTable();

const rootElement = document.getElementById('root');
if (rootElement) {
  ReactDOM.createRoot(rootElement).render(
    <React.StrictMode>
      <PublishingApp />
    </React.StrictMode>,
  );
}
