import { Provider } from 'react-redux';
import { store } from './store';
import { router } from './router';
import { RouterProvider } from 'react-router-dom';
import { useTheme } from './hooks/useTheme';

function App() {
  // Автоматическое переключение темы
  useTheme();

  return (
    <Provider store={store}>
      <RouterProvider router={router} />
    </Provider>
  );
}

export default App;