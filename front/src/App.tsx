import { Provider } from 'react-redux';
import { store } from './store';
import { router } from './router';
import { RouterProvider } from 'react-router-dom';

function App() {
  return (
    <Provider store={store}>
      <RouterProvider router={router} />
    </Provider>
  );
}

export default App;