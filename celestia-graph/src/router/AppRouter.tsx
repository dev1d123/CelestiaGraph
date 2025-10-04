import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import HomePage from '../pages/HomePage';
import GraphPage from '../pages/GraphPage';
import GraphSunPage from '../pages/GraphSunPage'; // añadido
import CartPage from '../pages/CartPage'; // nuevo
import { CartProvider } from '../context/CartContext'; // nuevo

const AppRouter: React.FC = () => (
  <BrowserRouter>
    <CartProvider>{/* nuevo provider */}
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/graph" element={<GraphPage />} />
        <Route path="/graph-sun" element={<GraphSunPage />} /> {/* nueva ruta */}
        <Route path="/cart" element={<CartPage />} /> {/* nuevo */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </CartProvider>
  </BrowserRouter>
);

export default AppRouter;
