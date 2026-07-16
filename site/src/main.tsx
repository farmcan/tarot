import React from 'react';
import ReactDOM from 'react-dom/client';
import { MantineProvider } from '@mantine/core';
import { MotionConfig } from 'motion/react';
import '@mantine/core/styles.css';
import './styles.css';
import { App } from './App';
import { theme } from './theme';

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <MotionConfig reducedMotion="user">
      <MantineProvider theme={theme} defaultColorScheme="light">
        <App />
      </MantineProvider>
    </MotionConfig>
  </React.StrictMode>,
);
