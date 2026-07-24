import {
  createAnonClient,
  createServiceRoleClient,
  createUserScopedClient,
} from '../../_shared/supabaseClient.ts'
import { recordAudit } from '../../_shared/audit.ts'
import { emit } from '../../_shared/events.ts'
import { InternalError } from '../../_shared/errors.ts'
import * as authRepository from '../repositories/auth.repository.ts'
import { toMeDTO, toSessionDTO } from '../mappers/auth.mapper.ts'
import type { LoginInput, RefreshInput, SignupInput } from '../schemas/auth.schemas.ts'
import type { MeDTO, SessionDTO } from '../dtos/auth.dtos.ts'

export async function signup(input: SignupInput): Promise<SessionDTO> {
  const serviceRoleClient = createServiceRoleClient()
  const created = await authRepository.createUserWithWorkspace(serviceRoleClient, input)

  const anonClient = createAnonClient()
  const session = await authRepository.signInWithPassword(anonClient, {
    email: input.email,
    password: input.password,
  })

  const membership = {
    workspaceId: created.workspaceId,
    workspaceName: created.workspaceName,
    role: created.role,
  }

  await recordAudit(serviceRoleClient, {
    workspaceId: created.workspaceId,
    actorUserId: created.userId,
    action: 'auth.signup',
    targetType: 'user',
    targetId: created.userId,
  })
  emit({
    type: 'UserSignedUp',
    workspaceId: created.workspaceId,
    userId: created.userId,
    email: created.email,
    occurredAt: new Date().toISOString(),
  })

  return toSessionDTO({
    user: { id: created.userId, email: created.email },
    session,
    memberships: [membership],
  })
}

export async function login(input: LoginInput): Promise<SessionDTO> {
  const anonClient = createAnonClient()
  const session = await authRepository.signInWithPassword(anonClient, input)

  const userScopedClient = createUserScopedClient(session.access_token)
  const memberships = await authRepository.listMemberships(userScopedClient)

  for (const membership of memberships) {
    await recordAudit(userScopedClient, {
      workspaceId: membership.workspaceId,
      actorUserId: session.user.id,
      action: 'auth.login',
      targetType: 'user',
      targetId: session.user.id,
    })
  }

  return toSessionDTO({ user: session.user, session, memberships })
}

export async function refresh(input: RefreshInput): Promise<SessionDTO> {
  const anonClient = createAnonClient()
  const session = await authRepository.refreshSession(anonClient, input.refreshToken)

  const userScopedClient = createUserScopedClient(session.access_token)
  const memberships = await authRepository.listMemberships(userScopedClient)

  return toSessionDTO({ user: session.user, session, memberships })
}

export async function me(userId: string, email: string, accessToken: string): Promise<MeDTO> {
  const userScopedClient = createUserScopedClient(accessToken)
  const memberships = await authRepository.listMemberships(userScopedClient)
  return toMeDTO({ user: { id: userId, email }, memberships })
}

export async function logout(accessToken: string): Promise<void> {
  const userScopedClient = createUserScopedClient(accessToken)
  const { error } = await userScopedClient.auth.signOut()
  if (error) throw new InternalError(error.message)
}
