import { useEffect, useState } from 'react';
import { useShowcase } from '../context/ShowcaseContext';

export default function usePublishedCollection<RecordType>(load: () => Promise<unknown>, parse: (value: unknown) => RecordType[]) {
  const { source } = useShowcase();
  const [data, setData] = useState<RecordType[]>([]);
  const [loading, setLoading] = useState(source === 'api');
  const [error, setError] = useState('');
  const [revision, setRevision] = useState(0);
  useEffect(() => {
    let active = true;
    setData([]); setError(''); setLoading(source === 'api');
    if (source === 'local') return undefined;
    load().then(value => { const records = parse(value); if (active) setData(records); })
      .catch(() => { if (active) setError('Published data could not be loaded.'); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [source, load, parse, revision]);
  return { data, loading, error, retry: () => setRevision(value => value + 1) };
}