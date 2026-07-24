// Mirrors docs/modules/automation/automation.md -- not implemented yet, no backend route exists.
export interface AutomationStepDTO {
  id: string
  automationId: string
  order: number
  action: 'assign_user' | 'send_message' | 'create_task' | 'wait' | 'send_reminder'
  config: Record<string, unknown>
}

export interface AutomationDTO {
  id: string
  workspaceId: string
  name: string
  isActive: boolean
  triggerEventType: string
  steps: AutomationStepDTO[]
}
