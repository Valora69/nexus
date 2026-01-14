"use client";
import { useQuery } from "@tanstack/react-query";

import { getAllGroups, getGroupById } from "../services/groupService";

export const useGetAllGroups = () => {
  return useQuery({
    queryKey: ["groups"],
    queryFn: () => getAllGroups(),
  });
};

export const useGetGroupById = (id: string) => {
  return useQuery({
    queryKey: ["groups", id],
    queryFn: () => getGroupById(id),
  });
};
