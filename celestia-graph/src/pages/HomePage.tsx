import React from 'react';
import NavBar from '../components/NavBar';
import HeroMain from '../components/HeroMain';
import LineDiv from '../components/LineDiv';
import InformationBox from '../components/InformationBox';

const HomePage: React.FC = () => (
  <>
    <NavBar />
    <HeroMain />
    <LineDiv />
    <InformationBox />
  </>
);

export default HomePage;
