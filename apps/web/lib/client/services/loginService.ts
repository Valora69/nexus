import { BASE_URL } from "../config";
import type { LoginDTO } from "../zod-schemas/loginSchema";

const AUTH_URI = "/auth";

export interface LoginResponse {
  access_token: string;
}

export const loginUser = async (
  credentials: LoginDTO
): Promise<LoginResponse> => {
  try {
    const response = await fetch(`${BASE_URL}${AUTH_URI}/login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(credentials),
      credentials: "include",
    });

    if (!response.ok) {
      const errorData = await response.json();
      if (response.status === 401) {
        throw new Error("Invalid credentials");
      }
      throw new Error(errorData.message || "Login failed");
    }

    const data = await response.json();
    return data;
  } catch (error) {
    if (error instanceof Error) {
      throw error;
    }
    throw new Error("An unexpected error occurred");
  }
};

export interface LogoutResponse {
  message: string;
}

export const logoutUser = async (): Promise<LogoutResponse> => {
  try {
    const response = await fetch(`${BASE_URL}${AUTH_URI}/logout`, {
      method: "POST",
      credentials: "include",
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || "Logout failed");
    }

    const data = await response.json();
    return data;
  } catch (error) {
    if (error instanceof Error) {
      throw error;
    }
    throw new Error("An unexpected error occurred during logout");
  }
};
