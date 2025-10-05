import React from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import NavBar from '../components/NavBar';
import GraphNavBar from '../components/GraphNavBar';

const RootLayout: React.FC = () => {
  const { pathname } = useLocation();
  const showGraphBar = /^\/(graph|graph-sun|classic|cart)/.test(pathname);

  return (
    <>
      <NavBar />
      {showGraphBar && <GraphNavBar />}
      <Outlet />
    </>
  );
};

export default RootLayout;
