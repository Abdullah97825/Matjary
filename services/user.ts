import { User } from "@/types";
import { UpdateProfileData, UpdatePasswordData } from "@/schemas/user";
import { LoginData, RegisterData } from "@/schemas";
import { RegisterFormData } from "@/types/auth";

export const userService = {
  async getProfile(): Promise<User> {
    const response = await fetch("/api/user/profile");
    if (!response.ok) {
      throw new Error("Failed to fetch profile");
    }
    return response.json();
  },

  updateProfile: async (data: UpdateProfileData) => {
    const response = await fetch("/api/user/profile", {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || "Failed to update profile");
    }

    return response.json();
  },

  updatePassword: async (data: UpdatePasswordData) => {
    const response = await fetch("/api/user/password", {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || "Failed to update password");
    }

    return response.json();
  },

  logout: async () => {
    const response = await fetch("/api/auth/logout", {
      method: "POST",
    });

    if (!response.ok) {
      throw new Error("Logout failed");
    }

    return response.json();
  },

  async login(data: LoginData) {
    const response = await fetch("/api/auth/login", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || "Failed to login");
    }

    return response.json();
  },

  async register(data: RegisterFormData) {
    const response = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(error);
    }

    return response.json();
  },

  // Admin-only function to search users
  searchUsers: async (query: string) => {
    const response = await fetch(`/api/admin/users/search?search=${encodeURIComponent(query)}`);
    if (!response.ok) {
      throw new Error("Failed to search users");
    }
    const data = await response.json();
    return data.users;
  }
};


