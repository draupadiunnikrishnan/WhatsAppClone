import { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Login } from './pages/Login';
import { Dashboard } from './pages/Dashboard';
import { useAuthStore } from './store/useAuthStore';
import { useCallStore } from './store/useCallStore';
import { SocketService } from './services/socket';

const ProtectedRoute = ({ children }: { children: JSX.Element }) => {
  const { token } = useAuthStore();
  if (!token) return <Navigate to="/login" replace />;
  return children;
};

function App() {
  const { token, user } = useAuthStore();
  const { handleSignal, incomingCall } = useCallStore();

  useEffect(() => {
    if (token && user) {
      const socket = SocketService.getInstance();
      socket.connect(token);

      // Register global listeners
      socket.on('offer', (data: any) => {
        incomingCall(data);
        // We should also store the SDP -> CallStore logic refine needed
        useCallStore.getState().handleSignal(data);
      });
      socket.on('answer', (data: any) => useCallStore.getState().handleSignal(data));
      socket.on('candidate', (data: any) => useCallStore.getState().handleSignal(data));
      socket.on('end', (data: any) => useCallStore.getState().handleSignal(data));
    }
  }, [token, user]);

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          }
        />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
