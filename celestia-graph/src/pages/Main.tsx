import React from 'react';
import NavBar from '../components/NavBar.tsx';
import HeroMain from '../components/HeroMain.tsx';
import LineDiv from '../components/LineDiv.tsx';
import InformationBox from '../components/InformationBox.tsx';

const MainPage: React.FC = () => (
  <>
    <NavBar />
    <HeroMain />
    <LineDiv />
    <InformationBox />
  </>
);

export default MainPage;
