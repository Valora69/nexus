import { useMutation, UseMutationOptions } from "@tanstack/react-query";

import { createUser, removeUser, updateUser } from "../services/userService";
import { CreateUserData, UpdateUserData } from "@/lib/types/model";

export const useCreateUser = (
  mutationOptions: UseMutationOptions<
    unknown,
    Error,
    { userData: CreateUserData }
  >
) =>
  useMutation({
    mutationFn: ({ userData }) => createUser(userData),
    ...mutationOptions,
  });

export const useUpdateUser = (
  mutationOptions: UseMutationOptions<
    unknown,
    Error,
    { id: string; userData: UpdateUserData }
  >
) =>
  useMutation({
    mutationFn: ({ id, userData }) => updateUser(id, userData),
    ...mutationOptions,
  });

export const useRemoveUser = (
  mutationOptions: UseMutationOptions<unknown, Error, { id: string }>
) =>
  useMutation({
    mutationFn: ({ id }) => removeUser(id),
    ...mutationOptions,
  });
