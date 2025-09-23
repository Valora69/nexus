import { BASE_URL } from "../config";
import { CreateUserData, UpdateUserData, User } from "../../types/model";

const USER_URI = "/user";
const CURRENT_USER_URI = "/user/currentuser";

export const getAllUsers = async (): Promise<User[]> => {
  const data = await fetch(`${BASE_URL}${USER_URI}`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
    credentials: "include",
  });

  if (!data.ok) {
    throw new Error(`Failed to fetch users: ${data.statusText}`);
  }

  const response = await data.json();
  return response;
};

export const getUserById = async (id: string): Promise<User> => {
  const data = await fetch(`${BASE_URL}${USER_URI}/${id}`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
    credentials: "include",
  });

  if (!data.ok) {
    throw new Error(`Failed to fetch user: ${data.statusText}`);
  }

  const response = await data.json();
  return response;
};

export const getCurrentUser = async (): Promise<User> => {
  const data = await fetch(`${BASE_URL}${CURRENT_USER_URI}`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
    credentials: "include",
  });

  if (!data.ok) {
    throw new Error(`Failed to fetch current user: ${data.statusText}`);
  }

  const response = await data.json();
  return response;
};

export const createUser = async (userData: CreateUserData): Promise<User> => {
  const data = await fetch(`${BASE_URL}${USER_URI}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(userData),
    credentials: "include",
  });

  if (!data.ok) {
    throw new Error(`Failed to create user: ${data.statusText}`);
  }

  const response = await data.json();
  return response;
};

export const updateUser = async (
  id: string,
  userData: UpdateUserData
): Promise<User> => {
  const data = await fetch(`${BASE_URL}${USER_URI}/${id}`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(userData),
    credentials: "include",
  });

  if (!data.ok) {
    throw new Error(`Failed to update user: ${data.statusText}`);
  }

  const response = await data.json();
  return response;
};

export const removeUser = async (id: string): Promise<void> => {
  const data = await fetch(`${BASE_URL}${USER_URI}/${id}`, {
    method: "DELETE",
    headers: {
      "Content-Type": "application/json",
    },
    credentials: "include",
  });

  if (!data.ok) {
    throw new Error(`Failed to remove user: ${data.statusText}`);
  }
};
