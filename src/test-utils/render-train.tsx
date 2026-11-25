import { renderApp } from './render-app';

/** The app opened on the Train tab (or a screen inside it). */
export const renderTrain = (initialUrl = '/train') => renderApp(initialUrl);
