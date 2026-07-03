import { StrictMode, lazy, Suspense } from 'react';
import { BrowserRouter } from 'react-router-dom';
import { createRoot } from 'react-dom/client';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './context/AuthContext.jsx';
import Loader from './components/Loader.jsx';
import './index.css';

// Lazy-load App so the Loader shows during chunk loading
const App = lazy(() => import('./App.jsx'));

// Root loader displayed until the entire app bundle + auth check resolves
function Root() {
  return (
    <StrictMode>
      <BrowserRouter>
        <AuthProvider>
          <Suspense fallback={<Loader />}>
            <App />
          </Suspense>
          <Toaster position="top-right" />
        </AuthProvider>
      </BrowserRouter>
    </StrictMode>
  );
}

createRoot(document.getElementById('root')).render(<Root />);