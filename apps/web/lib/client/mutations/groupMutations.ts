import { useMutation, UseMutationOptions } from "@tanstack/react-query";
import {
  createGroup,
  updateGroup,
  removeGroup,
} from "../services/groupService";
import { CreateGroupData, UpdateGroupData } from "@/lib/types/model";

export const useCreateGroup = (
  mutationOptions: UseMutationOptions<
    unknown,
    Error,
    { groupData: CreateGroupData }
  >
) =>
  useMutation({
    mutationFn: ({ groupData }) => createGroup(groupData),
    ...mutationOptions,
  });

export const useUpdateGroup = (
  mutationOptions: UseMutationOptions<
    unknown,
    Error,
    { id: string; groupData: UpdateGroupData }
  >
) =>
  useMutation({
    mutationFn: ({ id, groupData }) => updateGroup(id, groupData),
    ...mutationOptions,
  });

export const useRemoveGroup = (
  mutationOptions: UseMutationOptions<unknown, Error, { id: string }>
) =>
  useMutation({
    mutationFn: ({ id }) => removeGroup(id),
    ...mutationOptions,
  });
