import {
  createAnonClient,
  createServiceRoleClient,
  createUserScopedClient,
} from '../../_shared/supabaseClient.ts'
import { recordAudit } from '../../_shared/audit.ts'
import { emit } from '../../_shared/events.ts'
import { BadRequestError, InternalError } from '../../_shared/errors.ts'
import * as authRepository from '../repositories/auth.repository.ts'
import * as teamMembersRepository from '../repositories/administration/team-members.repository.ts'
import { toMeDTO, toSessionDTO } from '../mappers/auth.mapper.ts'
import type { LoginInput, RefreshInput, SignupInput } from '../schemas/auth.schemas.ts'
import type { MeDTO, SessionDTO } from '../dtos/auth.dtos.ts'
import type { CreatedUserWithWorkspace } from '../repositories/auth.repository.ts'
import type { InviteWithWorkspaceRow } from '../repositories/administration/team-members.repository.ts'

export async function signup(input: SignupInput): Promise<SessionDTO> {
  const serviceRoleClient = createServiceRoleClient()

  let invite: InviteWithWorkspaceRow | null = null
  let created: CreatedUserWithWorkspace

  if (input.inviteToken) {
    invite = await teamMembersRepository.findPendingInviteByToken(serviceRoleClient, input.inviteToken)
    if (!invite) throw new BadRequestError('This invite link is invalid or has expired')
    if (new Date(invite.expires_at).getTime() < Date.now()) {
      throw new BadRequestError('This invite link has expired')
    }
    if (invite.email.toLowerCase() !== input.email.toLowerCase()) {
      throw new BadRequestError('This invite was sent to a different email address')
    }
    created = await authRepository.createUserWithInvite(serviceRoleClient, input, {
      tenantId: invite.tenant_id,
      role: invite.role,
      workspaceName: invite.tenants?.name ?? '',
    })
  } else {
    if (!input.companyName) throw new BadRequestError('Workspace name is required')
    created = await authRepository.createUserWithWorkspace(serviceRoleClient, {
      email: input.email,
      password: input.password,
      companyName: input.companyName,
    })
  }

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

  if (invite) {
    await teamMembersRepository.acceptInvite(serviceRoleClient, invite.id)
  }

  await recordAudit(serviceRoleClient, {
    workspaceId: created.workspaceId,
    actorUserId: created.userId,
    action: invite ? 'auth.signup_via_invite' : 'auth.signup',
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
  if (invite) {
    emit({
      type: 'TeamMemberJoined',
      workspaceId: created.workspaceId,
      userId: created.userId,
      email: created.email,
      occurredAt: new Date().toISOString(),
    })
  }

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
