import axios from 'axios';
import type { AxiosInstance, AxiosRequestConfig } from 'axios';

// (Opcional) descomenta si instalas zod
// import { z } from 'zod';

// Ajustable mediante .env (VITE_CLUSTER_API=https://...)
// Fallback al dominio dado
const DEFAULT_CLUSTER_URL = 'https://pmb-clusterign-mf45tqic4-rodrygoleus-projects.vercel.app/cluster';
let envClusterUrl = '';
try {
  const meta: any = typeof import.meta !== 'undefined' ? (import.meta as any) : {};
  const env = meta.env || {};
  envClusterUrl = env.VITE_CLUSTER_API || env.REACT_APP_CLUSTER_API || '';
} catch {
  // ignore
}
const BASE_URL = (envClusterUrl ? envClusterUrl.replace(/\/+$/, '') : DEFAULT_CLUSTER_URL);

export interface ClusterItem {
  id: string;
  name?: string;
  label?: string;
  score?: number;
  // extiende según el payload real
  [key: string]: any;
}

export interface ClusterResponse {
  items: ClusterItem[];
  total?: number;
  // extiende si la API devuelve más metadatos
}

// (Opcional) esquema zod si decides validar (ajusta campos)
// const ClusterItemSchema = z.object({
//   id: z.string(),
//   name: z.string().optional(),
//   label: z.string().optional(),
//   score: z.number().optional()
// }).passthrough();
//
// const ClusterResponseSchema = z.object({
//   items: z.array(ClusterItemSchema),
//   total: z.number().optional()
// }).passthrough();

class ApiService {
  private client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: BASE_URL,
      timeout: 12000,
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      }
    });

    // Interceptor errores (log básico)
    this.client.interceptors.response.use(
      r => r,
      err => {
        // Puedes mejorar reporting aquí
        return Promise.reject(this.normalizeError(err));
      }
    );
  }

  private normalizeError(err: any) {
    if (axios.isAxiosError(err)) {
      return {
        message: err.message,
        status: err.response?.status,
        data: err.response?.data
      };
    }
    return { message: 'Unexpected error', original: err };
  }

  // GET lista completa (o paginada si la API soporta params)
  async getCluster(params?: Record<string, any>, signal?: AbortSignal): Promise<ClusterResponse> {
    const cfg: AxiosRequestConfig = { params, signal };
    const { data } = await this.client.get('/', cfg);
    // Validación opcional
    // return ClusterResponseSchema.parse(
    //   Array.isArray(data) ? { items: data } : data
    // );
    if (Array.isArray(data)) {
      return { items: data };
    }
    if (data && data.items) return data;
    return { items: [] };
  }

  // GET por id (si el backend expone /cluster/:id)
  async getClusterById(id: string, signal?: AbortSignal): Promise<ClusterItem | null> {
    if (!id) return null;
    const { data } = await this.client.get(`/${encodeURIComponent(id)}`, { signal });
    // return ClusterItemSchema.parse(data);
    return data || null;
  }

  // Búsqueda (si la API soporta ?q=). Ajusta el nombre del query param.
  async searchCluster(query: string, signal?: AbortSignal): Promise<ClusterItem[]> {
    if (!query) return [];
    const { items } = await this.getCluster({ q: query }, signal);
    return items;
  }

  // Utilidad con AbortController (ejemplo de patrón)
  withAbort<T>(fn: (signal: AbortSignal) => Promise<T>): { promise: Promise<T>; abort: () => void } {
    const controller = new AbortController();
    const promise = fn(controller.signal);
    return { promise, abort: () => controller.abort() };
  }
}

export const apiService = new ApiService();

// Helpers directos si prefieres funciones sueltas
export const fetchCluster = (p?: Record<string, any>, signal?: AbortSignal) =>
  apiService.getCluster(p, signal);
export const fetchClusterById = (id: string, signal?: AbortSignal) =>
  apiService.getClusterById(id, signal);
export const searchCluster = (q: string, signal?: AbortSignal) =>
  apiService.searchCluster(q, signal);
