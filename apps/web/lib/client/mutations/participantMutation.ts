import { useMutation, UseMutationOptions } from "@tanstack/react-query";

import {
  createParticipant,
  updateParticipant,
  removeParticipant,
} from "../services/participantService";
import {
  CreateParticipantData,
  UpdateParticipantData,
} from "@/lib/types/model";

export const useCreateParticipant = (
  mutationOptions: UseMutationOptions<
    unknown,
    Error,
    { participantData: CreateParticipantData }
  >
) =>
  useMutation({
    mutationFn: ({ participantData }) => createParticipant(participantData),
    ...mutationOptions,
  });

export const useUpdateParticipant = (
  mutationOptions: UseMutationOptions<
    unknown,
    Error,
    { id: string; participantData: UpdateParticipantData }
  >
) =>
  useMutation({
    mutationFn: ({ id, participantData }) =>
      updateParticipant(id, participantData),
    ...mutationOptions,
  });

export const useRemoveParticipant = (
  mutationOptions: UseMutationOptions<unknown, Error, { id: string }>
) =>
  useMutation({
    mutationFn: ({ id }) => removeParticipant(id),
    ...mutationOptions,
  });
