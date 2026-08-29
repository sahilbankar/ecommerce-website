import React, { useEffect } from 'react';
import { BrowserRouter } from 'react-router-dom';
import { Provider } from 'react-redux';
import { store } from './redux/store';
import { AppRoutes } from './routes';
import { initializeThemeInDOM } from './redux/slices/themeSlice';

export const App: React.FC = () => {
  useEffect(() => {
    // Initialize theme based on preference/system
    initializeThemeInDOM();
  }, []);

  return (
    <Provider store={store}>
      <BrowserRouter>
        <AppRoutes />
      </BrowserRouter>
    </Provider>
  );
};

export default App;
