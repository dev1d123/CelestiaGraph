import React, { useEffect } from 'react';
import HeroMain from '../components/HeroMain';
import LineDiv from '../components/LineDiv';
import InformationBox from '../components/InformationBox';
import { fetchCluster } from '../services/ApiService';

const HomePage: React.FC = () => {
  useEffect(() => {
    fetchCluster()
      .then(res => console.log('Cluster data (home mount):', res))
      .catch(err => console.error('Cluster fetch error:', err));
  }, []);

  return (
    <>
      <HeroMain />
      <LineDiv />
      <InformationBox />
    </>
  );
};

export default HomePage;
