import React, { useEffect, useState } from 'react';
import HeroMain from '../components/HeroMain';
import LineDiv from '../components/LineDiv';
import InformationBox from '../components/InformationBox';
import { apiService, type ClusterItem } from '../services/ApiService';
import type { CombinedGroup } from '../services/ApiService';

const STORAGE_KEY = 'combinedGroupsV1';

const HomePage: React.FC = () => {
  const [groups, setGroups] = useState<CombinedGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const { promise, abort } = apiService.withAbort(signal =>
      apiService.getCombinedGroups(signal)
    );
    promise
      .then(res => {
        setGroups(res);
        try {
          localStorage.setItem(STORAGE_KEY, JSON.stringify(res));
        } catch { /* ignore */ }
        setError(null);
        console.log('[HomePage] Combined result:', res);
      })
      .catch(err => {
        if (err?.name === 'CanceledError') return;
        setError(err?.message || 'Error loading combined data');
        console.error('Combined fetch error:', err);
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
        {loading && <div>Loading combined data...</div>}
        {!loading && error && <div style={{ color: 'red' }}>Error: {error}</div>}
        {!loading && !error && (
          <>
            <div>Combined groups: {groups.length}</div>
            <pre style={{ maxHeight: 300, overflow: 'auto', background: '#111', color: '#0f0', padding: '0.5rem' }}>
{JSON.stringify(groups.slice(0, 5), null, 2)}
            </pre>
          </>
        )}
      </section>
    </>
  );
};

export default HomePage;
