export interface ElasticsearchResult<T> {
  hits: {
    total: {
      value: number;
    };
    hits: Array<{ _source: T; _score: number }>;
  };
}
