import axios from 'axios';
import type { AxiosInstance, AxiosRequestConfig } from 'axios';

// (Opcional) descomenta si instalas zod
// import { z } from 'zod';

// Ajustable mediante .env (VITE_CLUSTER_API=https://...)
// Fallback al dominio dado
// Nueva URL base completa (lista en: https://pmb-clusterign.vercel.app/cluster/cluster)
const DEFAULT_CLUSTER_URL = 'https://pmb-clusterign.vercel.app/cluster/unigramKeywords';
let envClusterUrl = '';
try {
  const meta: any = typeof import.meta !== 'undefined' ? (import.meta as any) : {};
  const env = meta.env || {};
  envClusterUrl = env.VITE_CLUSTER_API || env.REACT_APP_CLUSTER_API || '';
} catch {
  // ignore
}
const BASE_URL = (envClusterUrl ? envClusterUrl.replace(/\/+$/, '') : DEFAULT_CLUSTER_URL);

// Nuevas URLs explícitas (sin depender de BASE_URL)
const UNIGRAM_URL = 'https://pmb-clusterign.vercel.app/cluster/unigramKeywords';
const ARTICLES_URL = 'https://pmb-clusterign.vercel.app/cluster/cluster';
// NUEVO: endpoint para obtener id por título
const ID_BY_TITLE_URL = 'https://pmb-clusterign.vercel.app/data/igByTitle';

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

export interface CombinedGroup {
  index: number;
  labels: string[];
  // Ahora artículos estandarizados como objetos { title, id }
  articles: ArticleEntry[];
  // Alias legacy (mantener para código previo)
  articleEntries: ArticleEntry[];
}

// NUEVO: entrada de artículo con id resuelto
export interface ArticleEntry {
  title: string;
  id: string | null;
}

// NUEVO: interface respuesta chat
export interface ChatAPIResponse {
  action: string;
  message: string;
  keywords: string[];
  data: any; // antes string
}

// NUEVO: interface resultado grupos de artículos con IDs ya presentes
interface ArticleGroupsResult {
  titles: string[][];
  entries: ArticleEntry[][];
}

export interface ArticleMetadataAuthor {
  surname?: string;
  given_names?: string;
}

export interface ArticleMetadata {
  abstract?: string[]; // arreglo de párrafos
  date?: string;       // YYYYMMDD
  authors?: ArticleMetadataAuthor[];
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

  private buildPath(segment?: string) {
    if (!segment) return '';
    return segment.replace(/^\/+/, '');
  }

  private extractRootStructure(parsed: any) {
    if (!parsed || typeof parsed !== 'object') return parsed;
    const candidateKeys = [
      'data', 'results', 'list', 'clusters', 'nodes',
      'unigramKeywords', 'unigrams', 'keywords',
      'articles', 'docs', 'papers', 'cluster'
    ];
    for (const k of candidateKeys) {
      if (Array.isArray((parsed as any)[k]) || (parsed as any)[k] && typeof (parsed as any)[k] === 'object') {
        return (parsed as any)[k];
      }
    }
    return parsed;
  }

  // Normaliza payload de grupos (acepta:
  // array de arrays, objeto de índices -> arrays/objetos, o array plano)
  private normalizeGroups(raw: any, label: string): string[][] {
    console.log(`[ApiService] Normalizing ${label} raw root type:`, typeof raw);
    if (Array.isArray(raw)) {
      if (raw.every(g => Array.isArray(g))) {
        return raw.map(g => g.filter(v => typeof v === 'string'));
      }
      if (raw.every(v => typeof v === 'string')) {
        // fallback: lista plana -> cada token como singleton
        return raw.map(token => [token]);
      }
      if (raw.every(g => g && typeof g === 'object')) {
        return raw.map(g => {
          const entries = Object
            .entries(g)
            .filter(([k]) => !isNaN(Number(k)))
            .sort((a, b) => Number(a[0]) - Number(b[0])) // FIX: paréntesis correcto
            .map(([, v]) => v)
            .filter((v): v is string => typeof v === 'string');
          return entries;
        });
      }
      return [];
    }
    if (raw && typeof raw === 'object') {
      const numericKeys = Object.keys(raw).filter(k => !isNaN(Number(k)));
      if (numericKeys.length) {
        numericKeys.sort((a, b) => Number(a) - Number(b));
        return numericKeys.map(k => {
          const groupVal: any = (raw as any)[k];
          if (Array.isArray(groupVal)) {
            return groupVal.filter(v => typeof v === 'string');
          }
          if (groupVal && typeof groupVal === 'object') {
            return Object.entries(groupVal)
              .filter(e => !isNaN(Number(e[0])))
              .sort((a, b) => Number(a[0]) - Number(b[0]))
              .map(e => e[1])
              .filter(v => typeof v === 'string');
          }
          if (typeof groupVal === 'string') return [groupVal];
          return [];
        });
      }
    }
    return [];
  }

  // GET lista completa (o paginada si la API soporta params)
  async getCluster(params?: Record<string, any>, signal?: AbortSignal): Promise<ClusterResponse> {
    const cfg: AxiosRequestConfig = { params, signal };
    // GET directo a la URL completa solicitada
    const { data } = await axios.get(BASE_URL, cfg);
    console.log('[ApiService] Raw cluster response:', data, 'type:', Object.prototype.toString.call(data));
    // Validación opcional
    // return ClusterResponseSchema.parse(
    //   Array.isArray(data) ? { items: data } : data
    // );
    if (Array.isArray(data)) return { items: data };
    if (data && Array.isArray(data.items)) return { items: data.items, total: data.total };
    if (data && typeof data === 'object') {
      // intento de inferir items si vienen bajo otra key común
      const possible = ['data', 'results', 'list', 'clusters', 'nodes'].find(k => Array.isArray((data as any)[k]));
      if (possible) return { items: (data as any)[possible] };
    }
    return { items: [] };
  }

  // GET por id (si el backend expone /cluster/:id)
  async getClusterById(id: string, signal?: AbortSignal): Promise<ClusterItem | null> {
    if (!id) return null;
    const path = this.buildPath(encodeURIComponent(id));
    const { data } = await this.client.get(path, { signal });
    // return ClusterItemSchema.parse(data);
    return data || null;
  }

  // Búsqueda (si la API soporta ?q=). Ajusta el nombre del query param.
  async searchCluster(query: string, signal?: AbortSignal): Promise<ClusterItem[]> {
    if (!query) return [];
    const { items } = await this.getCluster({ q: query }, signal);
    return items;
  }

  // Nuevos métodos crudos
  async getUnigramGroups(signal?: AbortSignal): Promise<string[][]> {
    const textResp = await axios.get(UNIGRAM_URL, { signal, responseType: 'text' });
    const rawText: string = textResp.data;
    console.log('[ApiService] Unigram raw TEXT length:', rawText?.length);
    let parsed: any = rawText;
    try {
      parsed = JSON.parse(rawText);
      console.log('[ApiService] Unigram parsed JSON keys:', typeof parsed === 'object' ? Object.keys(parsed) : 'n/a');
    } catch {
      console.warn('[ApiService] Unigram JSON.parse failed, keeping text');
    }
    const root = this.extractRootStructure(parsed);
    const norm = this.normalizeGroups(root, 'unigram');
    console.log('[ApiService] Normalized unigram groups length:', norm.length, 'example first group:', norm[0]);
    return norm;
  }

  // REEMPLAZADO: ahora devuelve ArticleGroupsResult con títulos + entries (title,id)
  async getArticleGroups(signal?: AbortSignal): Promise<ArticleGroupsResult> {
    const textResp = await axios.get(ARTICLES_URL, { signal, responseType: 'text' });
    const rawText: string = textResp.data;
    console.log('[ApiService] Articles raw TEXT length:', rawText?.length);
    let parsed: any = rawText;
    try {
      parsed = JSON.parse(rawText);
      console.log('[ApiService] Articles parsed JSON type:', typeof parsed);
    } catch {
      console.warn('[ApiService] Articles JSON.parse failed');
      return { titles: [], entries: [] };
    }

    // Se espera objeto con claves numéricas -> arrays de objetos { "Título": "ID" }
    const titles: string[][] = [];
    const entries: ArticleEntry[][] = [];

    if (parsed && typeof parsed === 'object') {
      const numericKeys = Object.keys(parsed).filter(k => !isNaN(Number(k))).sort((a, b) => Number(a) - Number(b));
      for (const k of numericKeys) {
        const groupRaw = parsed[k];
        const groupTitles: string[] = [];
        const groupEntries: ArticleEntry[] = [];
        if (Array.isArray(groupRaw)) {
            for (const item of groupRaw) {
              if (item && typeof item === 'object' && !Array.isArray(item)) {
                // Tomar el primer par clave-valor (asumiendo un único título por objeto)
                const [[title, id]] = Object.entries(item);
                if (typeof title === 'string') {
                  groupTitles.push(title);
                  groupEntries.push({ title, id: id != null ? String(id) : null });
                }
              } else if (typeof item === 'string') {
                // fallback si viniera como string
                groupTitles.push(item);
                groupEntries.push({ title: item, id: null });
              }
            }
        }
        titles.push(groupTitles);
        entries.push(groupEntries);
      }
    }

    console.log('[ApiService] Parsed article groups -> groups:', titles.length);
    return { titles, entries };
  }

  // ACTUALIZADO getCombinedGroups para usar los IDs ya provistos
  async getCombinedGroups(signal?: AbortSignal): Promise<CombinedGroup[]> {
    const [labelsGroups, articleGroupsResult] = await Promise.all([
      this.getUnigramGroups(signal),
      this.getArticleGroups(signal)
    ]);

    const { titles: articleTitles, entries: articleEntriesAll } = articleGroupsResult;
    console.log('[ApiService] Debug sizes -> labels:', labelsGroups.length, 'articles:', articleTitles.length);

    const max = Math.max(labelsGroups.length, articleTitles.length);
    const combined: CombinedGroup[] = [];
    for (let i = 0; i < max; i++) {
      const titles = articleTitles[i] || [];
      const entries = articleEntriesAll[i] || titles.map(t => ({ title: t, id: null }));
      combined.push({
        index: i,
        labels: labelsGroups[i] || [],
        articles: entries,       // objetos
        articleEntries: entries  // alias
      });
    }
    console.log('[ApiService] Combined groups (with provided IDs in articles) count:', combined.length);
    return combined;
  }

  // NUEVO: método chat (restaurado)
  async chat(userInput: string, userId = 'default', signal?: AbortSignal): Promise<ChatAPIResponse> {
    if (!userInput.trim()) {
      return { action: '', message: '', keywords: [], data: null };
    }
    try {
      const { data } = await axios.post(
        'https://chatbot-api-two.vercel.app/chat/',
        { user_input: userInput, user_id: userId },
        { signal }
      );
      const resp: ChatAPIResponse = {
        action: (data?.action ?? '') + '',
        message: (data?.message ?? '') + '',
        keywords: Array.isArray(data?.keywords) ? data.keywords.filter((k: any) => typeof k === 'string') : [],
        data: data?.data ?? null // conservar objeto o null
      };
      return resp;
    } catch (e: any) {
      console.warn('[ApiService] chat error', e);
      return {
        action: 'error',
        message: e?.message ? `Error: ${e.message}` : 'Error desconocido',
        keywords: [],
        data: null
      };
    }
  }

  async getKeywordsById(id: string, signal?: AbortSignal): Promise<string[]> {
    if (!id) return [];
    try {
      const { data } = await axios.get('https://pmb-clusterign.vercel.app/data/keywordsById', {
        params: { id },
        signal
      });
      return Array.isArray(data) ? data.filter(d => typeof d === 'string') : [];
    } catch (e) {
      console.warn('[ApiService] getKeywordsById error', e);
      return [];
    }
  }

  async getMetadataById(id: string, signal?: AbortSignal): Promise<ArticleMetadata | null> {
    if (!id) return null;
    try {
      const { data } = await axios.get('https://pmb-clusterign.vercel.app/data/metadataById', {
        params: { id },
        signal
      });
      return (data && typeof data === 'object') ? data as ArticleMetadata : null;
    } catch (e) {
      console.warn('[ApiService] getMetadataById error', e);
      return null;
    }
  }

  async getClusterNumber(id: string, signal?: AbortSignal): Promise<number | null> {
    if (!id) return null;
    try {
      const { data } = await axios.get('https://pmb-clusterign.vercel.app/data/clusterNumber', {
        params: { id },
        signal
      });
      const n = parseInt(String(data).trim(), 10);
      return isNaN(n) ? null : n;
    } catch (e) {
      console.warn('[ApiService] getClusterNumber error', e);
      return null;
    }
  }

  async getBigramKeywords(signal?: AbortSignal): Promise<Record<string, string[]>> {
    try {
      const { data } = await axios.get('https://pmb-clusterign.vercel.app/cluster/bigramKeywords', { signal });
      if (data && typeof data === 'object') {
        const out: Record<string, string[]> = {};
        for (const [k, v] of Object.entries<any>(data)) {
          if (Array.isArray(v)) out[k] = v.filter(x => typeof x === 'string');
        }
        return out;
      }
      return {};
    } catch (e) {
      console.warn('[ApiService] getBigramKeywords error', e);
      return {};
    }
  }

  async getReferencesById(id: string, signal?: AbortSignal): Promise<string[]> {
    if (!id) return [];
    try {
      const { data } = await axios.get('https://pmb-clusterign.vercel.app/data/referencesById', {
        params: { id }, signal
      });
      return Array.isArray(data) ? data.filter(t => typeof t === 'string') : [];
    } catch (e) {
      console.warn('[ApiService] getReferencesById error', e);
      return [];
    }
  }

  // Raw cluster articles for similarity (cluster/cluster)
  async getClusterArticles(signal?: AbortSignal): Promise<Record<string, { title: string; id: string | null }[]>> {
    try {
      const { data } = await axios.get('https://pmb-clusterign.vercel.app/cluster/cluster', { signal });
      if (!data || typeof data !== 'object') return {};
      const out: Record<string, { title: string; id: string | null }[]> = {};
      for (const [k, arr] of Object.entries<any>(data)) {
        if (Array.isArray(arr)) {
          out[k] = arr.map(entry => {
            if (entry && typeof entry === 'object' && !Array.isArray(entry)) {
              const [[title, id]] = Object.entries(entry);
              return { title, id: id == null ? null : String(id) };
            }
            return null;
          }).filter(Boolean) as { title: string; id: string | null }[];
        }
      }
      return out;
    } catch (e) {
      console.warn('[ApiService] getClusterArticles error', e);
      return {};
    }
  }

  withAbort<T>(fn: (signal: AbortSignal) => Promise<T>): { promise: Promise<T>; abort: () => void } {
    const controller = new AbortController();
    const promise = fn(controller.signal);
    return {
      promise,
      abort: () => controller.abort()
    };
  }
} // cierre clase ApiService

// Instancia singleton
export const apiService = new ApiService();

// Helpers
export const fetchCluster = (p?: Record<string, any>, signal?: AbortSignal) =>
  apiService.getCluster(p, signal);
export const fetchClusterById = (id: string, signal?: AbortSignal) =>
  apiService.getClusterById(id, signal);
export const searchCluster = (q: string, signal?: AbortSignal) =>
  apiService.searchCluster(q, signal);
export const fetchCombinedGroups = (signal?: AbortSignal) =>
  apiService.getCombinedGroups(signal);
export const fetchChat = (input: string, userId = 'default', signal?: AbortSignal) =>
  apiService.chat(input, userId, signal);
export const fetchKeywordsById = (id: string, signal?: AbortSignal) =>
  apiService.getKeywordsById(id, signal);
export const fetchMetadataById = (id: string, signal?: AbortSignal) =>
  apiService.getMetadataById(id, signal);
export const fetchClusterNumber = (id: string, signal?: AbortSignal) =>
  apiService.getClusterNumber(id, signal);
export const fetchBigramKeywords = (signal?: AbortSignal) =>
  apiService.getBigramKeywords(signal);
export const fetchReferencesById = (id: string, signal?: AbortSignal) =>
  apiService.getReferencesById(id, signal);
export const fetchClusterArticles = (signal?: AbortSignal) =>
  apiService.getClusterArticles(signal);
