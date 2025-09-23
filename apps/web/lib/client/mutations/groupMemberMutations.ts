import { useMutation, UseMutationOptions } from "@tanstack/react-query";
import {
  createGroupMember,
  updateGroupMember,
  removeGroupMember,
} from "../services/groupMemberService";
import {
  CreateGroupMemberData,
  UpdateGroupMemberData,
} from "@/lib/types/model";

export const useCreateGroupMember = (
  mutationOptions: UseMutationOptions<
    unknown,
    Error,
    { groupMemberData: CreateGroupMemberData }
  >
) =>
  useMutation({
    mutationFn: ({ groupMemberData }) => createGroupMember(groupMemberData),
    ...mutationOptions,
  });

export const useUpdateGroupMember = (
  mutationOptions: UseMutationOptions<
    unknown,
    Error,
    { id: string; groupMemberData: UpdateGroupMemberData }
  >
) =>
  useMutation({
    mutationFn: ({ id, groupMemberData }) =>
      updateGroupMember(id, groupMemberData),
    ...mutationOptions,
  });

export const useRemoveGroupMember = (
  mutationOptions: UseMutationOptions<unknown, Error, { id: string }>
) =>
  useMutation({
    mutationFn: ({ id }) => removeGroupMember(id),
    ...mutationOptions,
  });
