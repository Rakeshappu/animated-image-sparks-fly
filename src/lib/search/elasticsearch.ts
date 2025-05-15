
import { Client } from '@elastic/elasticsearch';
import { elasticsearchConfig } from '../config/services';

let esClient: Client | null = null;

/**
 * Initialize Elasticsearch client
 */
export const initElasticsearchClient = () => {
  if (esClient) return esClient;

  esClient = new Client({
    node: elasticsearchConfig.node,
    auth: {
      username: elasticsearchConfig.auth.username || '',
      password: elasticsearchConfig.auth.password || '',
    },
    tls: {
      rejectUnauthorized: process.env.NODE_ENV === 'production',
    },
  });

  return esClient;
};

/**
 * Get Elasticsearch client
 */
export const getElasticsearchClient = () => {
  if (!esClient) {
    return initElasticsearchClient();
  }
  return esClient;
};

/**
 * Create resource index if it doesn't exist
 */
export const createResourceIndex = async () => {
  const client = getElasticsearchClient();
  
  const indexExists = await client.indices.exists({ index: 'resources' });
  
  if (!indexExists) {
    await client.indices.create({
      index: 'resources',
      body: {
        mappings: {
          properties: {
            title: { type: 'text', analyzer: 'standard' },
            description: { type: 'text', analyzer: 'standard' },
            content: { type: 'text', analyzer: 'standard' },
            type: { type: 'keyword' },
            subject: { type: 'keyword' },
            semester: { type: 'integer' },
            uploadedBy: { type: 'keyword' },
            department: { type: 'keyword' },
            tags: { type: 'keyword' },
            createdAt: { type: 'date' },
            updatedAt: { type: 'date' },
          },
        },
      },
    });
  }
};

/**
 * Index a resource document
 */
export const indexResource = async (resource: any) => {
  const client = getElasticsearchClient();
  
  const documentToIndex = {
    title: resource.title,
    description: resource.description,
    content: resource.content || '',
    type: resource.type,
    subject: resource.subject,
    semester: resource.semester,
    uploadedBy: resource.uploadedBy.toString(),
    department: resource.department || 'ISE',
    tags: resource.tags || [],
    createdAt: resource.createdAt,
    updatedAt: resource.updatedAt,
  };
  
  await client.index({
    index: 'resources',
    id: resource._id.toString(),
    document: documentToIndex,
    refresh: true,
  });
};

/**
 * Update indexed resource
 */
export const updateIndexedResource = async (resourceId: string, updates: any) => {
  const client = getElasticsearchClient();
  
  const updatedFields = { ...updates, updatedAt: new Date() };
  
  await client.update({
    index: 'resources',
    id: resourceId,
    doc: updatedFields,
    refresh: true,
  });
};

/**
 * Delete indexed resource
 */
export const deleteIndexedResource = async (resourceId: string) => {
  const client = getElasticsearchClient();
  
  await client.delete({
    index: 'resources',
    id: resourceId,
    refresh: true,
  });
};

/**
 * Search for resources
 */
export const searchResources = async ({
  query,
  filters = {},
  page = 1,
  limit = 10,
  sort = { createdAt: 'desc' },
}: {
  query: string;
  filters?: Record<string, any>;
  page?: number;
  limit?: number;
  sort?: Record<string, 'asc' | 'desc'>;
}) => {
  const client = getElasticsearchClient();
  
  // Build filter conditions
  const filterConditions: any[] = [];
  Object.entries(filters).forEach(([key, value]) => {
    if (Array.isArray(value)) {
      filterConditions.push({ terms: { [key]: value } });
    } else if (value !== null && value !== undefined) {
      filterConditions.push({ term: { [key]: value } });
    }
  });

  // Build sort conditions
  const sortConditions = Object.entries(sort).map(([field, order]) => ({
    [field]: { order },
  }));

  const result = await client.search({
    index: 'resources',
    body: {
      from: (page - 1) * limit,
      size: limit,
      query: {
        bool: {
          must: query
            ? {
                multi_match: {
                  query,
                  fields: ['title^3', 'description^2', 'content', 'tags'],
                  fuzziness: 'AUTO',
                },
              }
            : { match_all: {} },
          filter: filterConditions,
        },
      },
      sort: sortConditions,
      highlight: {
        fields: {
          title: {},
          description: {},
          content: {},
        },
        pre_tags: ['<strong>'],
        post_tags: ['</strong>'],
      },
    },
  });

  const total = result.hits.total as { value: number };
  const hits = result.hits.hits.map((hit) => ({
    id: hit._id,
    ...(hit._source as any),  // Cast to any to avoid spread error
    score: hit._score,
    highlights: hit.highlight,
  }));

  return {
    results: hits,
    total: total.value,
    page,
    limit,
    pages: Math.ceil(total.value / limit),
  };
};
