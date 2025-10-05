import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import RootLayout from './RootLayout'; // nuevo
import HomePage from '../pages/HomePage';
import GraphPage from '../pages/GraphPage';
import GraphSunPage from '../pages/GraphSunPage'; // añadido
import CartPage from '../pages/CartPage'; // nuevo
import ClassicalPage from '../pages/ClassicalPage'; // nuevo
import AboutPage from '../pages/AboutPage'; // nuevo
import { CartProvider } from '../context/CartContext'; // nuevo
import ChatBotWidget from '../components/ChatBotWidget'; // nuevo

const AppRouter: React.FC = () => (
  <BrowserRouter>
    <CartProvider>{/* nuevo provider */}
      <Routes>
        <Route element={<RootLayout />}>
          <Route path="/" element={<HomePage />} />
          <Route path="/graph" element={<GraphPage />} />
          <Route path="/graph-sun" element={<GraphSunPage />} /> {/* nueva ruta */}
          <Route path="/cart" element={<CartPage />} /> {/* nuevo */}
          <Route path="/classic" element={<ClassicalPage />} /> {/* nuevo */}
          <Route path="/about" element={<AboutPage />} /> {/* nuevo */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
      <ChatBotWidget /> {/* nuevo */}
    </CartProvider>
  </BrowserRouter>
);

export default AppRouter;
