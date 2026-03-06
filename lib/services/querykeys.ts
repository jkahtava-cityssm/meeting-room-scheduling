export const queryKeys = {
	configuration: {
		all: ["configuration"] as const,
		lists: () => [...queryKeys.configuration.all, "list"] as const,
		list: (filters: unknown) => [...queryKeys.configuration.lists(), { filters }] as const,
		details: () => [...queryKeys.configuration.all, "detail"] as const,
		detail: (id: string) => [...queryKeys.configuration.details(), id] as const,
	},
	users: {
		all: ["users"] as const,
		profile: (userId: string) => [...queryKeys.users.all, "profile", userId] as const,
	},
	// Add more domains as your app grows
} as const;
