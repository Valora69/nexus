"use client";
import { useQuery } from "@tanstack/react-query";

import {
  findWhoOwesMe,
  getAllParticipants,
  getParticipantById,
  getParticipantsByExpenseId,
  getParticipantsByUserId,
} from "../services/participantService";

export const useGetAllParticipants = () => {
  return useQuery({
    queryKey: ["participants"],
    queryFn: () => getAllParticipants(),
  });
};

export const useGetParticipantById = (id: string) => {
  return useQuery({
    queryKey: ["participants", id],
    queryFn: () => getParticipantById(id),
  });
};

export const useGetParticipantsByExpenseId = (expenseId: string) => {
  return useQuery({
    queryKey: ["participants", "expense", expenseId],
    queryFn: () => getParticipantsByExpenseId(expenseId),
  });
};

export const useGetParticipantsByUserId = (userId: string) => {
  return useQuery({
    queryKey: ["participants", "user", userId],
    queryFn: () => getParticipantsByUserId(userId),
  });
};

export const useGetWhoOwesMe = () => {
  return useQuery({
    queryKey: ["participants", "who-owes-me"],
    queryFn: () => findWhoOwesMe(),
  });
};
