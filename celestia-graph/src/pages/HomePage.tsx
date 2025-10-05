import React, { useEffect, useState } from 'react';
import HeroMain from '../components/HeroMain';
import LineDiv from '../components/LineDiv';
import InformationBox from '../components/InformationBox';
import { apiService, type ClusterItem } from '../services/ApiService';

const HomePage: React.FC = () => {
  const [items, setItems] = useState<ClusterItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const { promise, abort } = apiService.withAbort(signal =>
      apiService.getCluster(undefined, signal)
    );
    promise
      .then(res => {
        setItems(res.items || []);
        setError(null);
        console.log('Cluster data (home mount):', res);
      })
      .catch(err => {
        if (err?.name === 'CanceledError') return;
        setError(err?.message || 'Error cargando datos');
        console.error('Cluster fetch error:', err);
      })
      .finally(() => setLoading(false));
    return () => abort();
  }, []);

  return (
    <>
      <HeroMain />
      <LineDiv />
      <InformationBox />
      <section style={{ padding: '1rem', fontFamily: 'monospace' }}>
        {loading && <div>Cargando cluster...</div>}
        {!loading && error && <div style={{ color: 'red' }}>Error: {error}</div>}
        {!loading && !error && (
          <>
            <div>Total items: {items.length}</div>
            <pre style={{ maxHeight: 300, overflow: 'auto', background: '#111', color: '#0f0', padding: '0.5rem' }}>
{JSON.stringify(items.slice(0, 20), null, 2)}
            </pre>
          </>
        )}
      </section>
    </>
  );
};

export default HomePage;
