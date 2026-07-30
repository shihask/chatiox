export const templatesKeys = {
  all: ['templates'] as const,
  lists: () => [...templatesKeys.all, 'list'] as const,
  channelTemplates: (templateId: string) => [...templatesKeys.all, 'channel-templates', templateId] as const,
}

export const channelTemplatesByConnectionKeys = {
  all: ['channel-templates-by-connection'] as const,
  list: (connectionId: string) => [...channelTemplatesByConnectionKeys.all, connectionId] as const,
}
