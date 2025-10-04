export type DummyArticle = {
  id: string;
  title: string;
  authors: string[];
  venue: string;
  year: number;
  date: string;
  height: number;
  citations: number;
  tags: string[];
  abstract: string;
};

export const dummyArticles: DummyArticle[] = [
  {
    id: 'A1',
    title: 'Scalable Modular Data Availability in Fractal DAG Networks',
    authors: ['L. Ortega', 'M. Silva', 'A. R. Díaz'],
    venue: 'Proc. Distributed Graph Systems',
    year: 2024,
    date: '2024-06-12',
    height: 128450,
    citations: 42,
    tags: ['modular', 'availability', 'dag', 'scaling'],
    abstract: 'Explora un enfoque modular para ampliar la disponibilidad de datos en redes DAG fractales con validación probabilística y colateral dinámico.'
  },
  {
    id: 'A2',
    title: 'Adaptive Blob Sampling Strategies for Decentralized Validation',
    authors: ['C. Méndez', 'H. Zhou'],
    venue: 'Journal of Blob Research',
    year: 2023,
    date: '2023-11-02',
    height: 117340,
    citations: 31,
    tags: ['blobs', 'sampling', 'validation'],
    abstract: 'Presentamos un algoritmo adaptativo de muestreo de blobs que reduce latencia mientras preserva garantías criptográficas.'
  },
  {
    id: 'A3',
    title: 'Zero-Knowledge Assisted Node Pruning in Hierarchical DAGs',
    authors: ['R. Castillo', 'F. Gómez'],
    venue: 'ZK Graph Summit',
    year: 2025,
    date: '2025-02-18',
    height: 139220,
    citations: 5,
    tags: ['zk', 'dag', 'optimization'],
    abstract: 'Se propone un pipeline de poda asistida por pruebas de conocimiento cero que minimiza redundancias estructurales.'
  },
  {
    id: 'A4',
    title: 'Semantic Tag Expansion for Graph-Oriented Retrieval',
    authors: ['M. López'],
    venue: 'Graph Retrieval Letters',
    year: 2022,
    date: '2022-09-10',
    height: 93440,
    citations: 88,
    tags: ['retrieval', 'semantic', 'tags'],
    abstract: 'Una técnica de expansión semántica basada en embeddings para enriquecer consultas sobre grafos temáticos.'
  },
  {
    id: 'A5',
    title: 'Deterministic Fork Resolution via Temporal Weight Accrual',
    authors: ['I. Pérez', 'K. Duarte'],
    venue: 'Consensus Engineering',
    year: 2024,
    date: '2024-03-29',
    height: 123900,
    citations: 19,
    tags: ['consensus', 'fork', 'temporal'],
    abstract: 'Modelo determinista de resolución de forks usando acumulación de peso temporal y ventanas de estabilidad.'
  },
  {
    id: 'A6',
    title: 'Multi-Tier Caching of DAG Subgraphs for Low-Latency Queries',
    authors: ['S. Aguilar', 'N. Patel'],
    venue: 'Edge Cache Conf.',
    year: 2023,
    date: '2023-04-14',
    height: 108220,
    citations: 54,
    tags: ['caching', 'performance', 'dag'],
    abstract: 'Arquitectura de cache multinivel para acelerar consultas de subgrafos con política adaptativa.'
  },
  {
    id: 'A7',
    title: 'Probabilistic Integrity Windows in Blob Dispersal',
    authors: ['T. Romero'],
    venue: 'Blob Systems Review',
    year: 2025,
    date: '2025-01-05',
    height: 136880,
    citations: 7,
    tags: ['blobs', 'integrity'],
    abstract: 'Definición de ventanas probabilísticas de integridad para dispersión de blobs bajo amenaza adversarial.'
  },
  {
    id: 'A8',
    title: 'Layered Commitment Channels for Modular Consensus',
    authors: ['V. Sánchez', 'E. Chan'],
    venue: 'Modular Chains Workshop',
    year: 2024,
    date: '2024-08-03',
    height: 130700,
    citations: 11,
    tags: ['modular', 'consensus', 'channels'],
    abstract: 'Canales de compromiso escalonados que desacoplan disponibilidad y ejecución en diseño modular.'
  },
  {
    id: 'A9',
    title: 'Heuristic Energy Metrics for Planetary Node Clusters',
    authors: ['J. Vega'],
    venue: 'Telemetry & Metrics',
    year: 2022,
    date: '2022-12-22',
    height: 91210,
    citations: 63,
    tags: ['metrics', 'energy', 'heuristics'],
    abstract: 'Propuesta de métrica heurística de energía para comparar clústeres planetarios de nodos.'
  },
  {
    id: 'A10',
    title: 'Temporal Sharding of Semantic Indices',
    authors: ['A. Ruiz', 'F. Costa'],
    venue: 'Indexing Frontiers',
    year: 2023,
    date: '2023-07-19',
    height: 111560,
    citations: 22,
    tags: ['indexing', 'semantic', 'sharding'],
    abstract: 'Sharding temporal aplicado a índices semánticos para optimizar rotación de segmentos fríos.'
  },
  {
    id: 'A11',
    title: 'Compressed Witness Sets for DAG Validation',
    authors: ['G. Castillo'],
    venue: 'Graph Integrity Forum',
    year: 2024,
    date: '2024-10-01',
    height: 134990,
    citations: 3,
    tags: ['validation', 'compression'],
    abstract: 'Conjuntos de testigos comprimidos reducen carga de verificación en validación distribuida.'
  },
  {
    id: 'A12',
    title: 'Predictive Prefetch of Blob Segments',
    authors: ['N. Li', 'P. Duarte'],
    venue: 'Blob Access Workshop',
    year: 2023,
    date: '2023-05-27',
    height: 107430,
    citations: 28,
    tags: ['blobs', 'prefetch', 'performance'],
    abstract: 'Prefetch predictivo de segmentos de blob basado en modelado Markoviano ligero.'
  },
  {
    id: 'A13',
    title: 'Hybrid Cost Model for Modular Execution Layers',
    authors: ['C. Torres', 'M. Young'],
    venue: 'Execution Models Journal',
    year: 2025,
    date: '2025-03-11',
    height: 140115,
    citations: 2,
    tags: ['modular', 'execution', 'cost'],
    abstract: 'Modelo híbrido de coste para capas de ejecución desacopladas con penalizaciones dinámicas.'
  },
  {
    id: 'A14',
    title: 'Edge-Optimized Gossip Propagation in DAG Meshes',
    authors: ['D. Zhao'],
    venue: 'Network Propagation Letters',
    year: 2022,
    date: '2022-03-08',
    height: 84550,
    citations: 97,
    tags: ['gossip', 'network', 'optimization'],
    abstract: 'Optimización de gossip en mallas DAG minimizando redundancia y colisiones de slot.'
  },
  {
    id: 'A15',
    title: 'Consensus Delay Profiling with Synthetic Anchors',
    authors: ['B. Martín'],
    venue: 'Latency Analytics',
    year: 2024,
    date: '2024-01-17',
    height: 121005,
    citations: 14,
    tags: ['latency', 'consensus', 'profiling'],
    abstract: 'Perfilado de retraso de consenso usando anclas sintéticas inyectadas en flujos.'
  },
  {
    id: 'A16',
    title: 'Resilient Tag Clustering Under Adversarial Noise',
    authors: ['E. Navarro', 'S. Klein'],
    venue: 'Semantic Systems',
    year: 2023,
    date: '2023-10-09',
    height: 118900,
    citations: 34,
    tags: ['semantic', 'clustering', 'robustness'],
    abstract: 'Clustering de tags robusto frente a ruido adversarial usando puntuación de densidad reforzada.'
  },
  {
    id: 'A17',
    title: 'Deterministic Replay Windows for Telemetry Audits',
    authors: ['H. Ramos'],
    venue: 'Audit & Trace',
    year: 2022,
    date: '2022-11-05',
    height: 90210,
    citations: 41,
    tags: ['telemetry', 'audit', 'replay'],
    abstract: 'Ventanas deterministas de replay para auditorías reproducibles de telemetría.'
  },
  {
    id: 'A18',
    title: 'Cross-Layer Blob Integrity with Redundant Anchors',
    authors: ['Q. Fernández'],
    venue: 'Integrity Chains',
    year: 2025,
    date: '2025-04-02',
    height: 141770,
    citations: 1,
    tags: ['integrity', 'blobs', 'anchors'],
    abstract: 'Integridad de blobs multicapa mediante anclas redundantes y verificación incremental.'
  }
];
