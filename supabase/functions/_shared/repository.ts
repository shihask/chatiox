export interface Page<T> {
  items: T[]
  total: number
  page: number
  pageSize: number
}

export interface ListParams {
  page: number
  pageSize: number
  search?: string
  sort?: { field: string; direction: 'asc' | 'desc' }
}

/** Unchanged shape across every revision of this architecture -- see docs/architecture.md §4. */
export interface IRepository<TEntity, TCreate, TUpdate, TId = string> {
  list(workspaceId: string, params: ListParams): Promise<Page<TEntity>>
  getById(workspaceId: string, id: TId): Promise<TEntity | null>
  create(workspaceId: string, data: TCreate): Promise<TEntity>
  update(workspaceId: string, id: TId, data: TUpdate): Promise<TEntity>
  delete(workspaceId: string, id: TId): Promise<void>
}
