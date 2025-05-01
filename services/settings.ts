export interface Setting {
    id: string;
    name: string;
    slug: string;
    value: string;
    createdAt: string;
    updatedAt: string;
}

export interface UpdateSettingData {
    value: string;
}

export const settingsService = {
    getAll: async (): Promise<Setting[]> => {
        const response = await fetch('/api/admin/settings');

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Failed to fetch settings');
        }

        return response.json();
    },

    update: async (id: string, data: UpdateSettingData): Promise<Setting> => {
        const response = await fetch(`/api/admin/settings/${id}`, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(data),
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Failed to update setting');
        }

        return response.json();
    },
}; 