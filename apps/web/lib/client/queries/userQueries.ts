"use client";
import { useQuery } from "@tanstack/react-query";

import {
  getAllUsers,
  getCurrentUser,
  getUserById,
} from "../services/userService";

export const useGetAllUsers = () => {
  return useQuery({
    queryKey: ["users"],
    queryFn: () => getAllUsers(),
  });
};

export const useGetUserById = (id: string) => {
  return useQuery({
    queryKey: ["users", id],
    queryFn: () => getUserById(id),
  });
};

export const useCurrentUser = () => {
  return useQuery({
    queryKey: ["users"],
    queryFn: () => getCurrentUser(),
  });
};
