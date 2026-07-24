import { BadRequestError } from '../errors.ts'

const WORKSPACE_HEADER = 'X-Workspace-Id'

/** Reads the caller's workspace id off the request. UI/API vocabulary is "workspace" -- see docs/architecture.md §2. */
export function resolveWorkspaceId(req: Request): string {
  const id = req.headers.get(WORKSPACE_HEADER)
  if (!id) throw new BadRequestError(`Missing ${WORKSPACE_HEADER} header`)
  return id
}
