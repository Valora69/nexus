import { BASE_URL } from "../config";
import { CreateGroupData, UpdateGroupData } from "../../types/model";

const GROUP_URI = "/group";

export const createGroup = async (groupData: CreateGroupData) => {
  const data = await fetch(`${BASE_URL}${GROUP_URI}`, {
    method: "POST",
    body: JSON.stringify(groupData),
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
    },
  });

  if (!data.ok) {
    throw new Error(`Failed to create group: ${data.statusText}`);
  }

  const response = await data.json();
  return response;
};

export const getAllGroups = async () => {
  const data = await fetch(`${BASE_URL}${GROUP_URI}`, {
    method: "GET",
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
    },
  });

  if (!data.ok) {
    throw new Error(`Failed to fetch groups: ${data.statusText}`);
  }

  const response = await data.json();
  return response;
};

export const getGroupById = async (id: string) => {
  const data = await fetch(`${BASE_URL}${GROUP_URI}/${id}`, {
    method: "GET",
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
    },
  });

  if (!data.ok) {
    throw new Error(`Failed to fetch group: ${data.statusText}`);
  }

  const response = await data.json();
  return response;
};

export const updateGroup = async (id: string, groupData: UpdateGroupData) => {
  const data = await fetch(`${BASE_URL}${GROUP_URI}/${id}`, {
    method: "PATCH",
    body: JSON.stringify(groupData),
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
    },
  });

  if (!data.ok) {
    throw new Error(`Failed to update group: ${data.statusText}`);
  }

  const response = await data.json();
  return response;
};

export const removeGroup = async (id: string) => {
  const data = await fetch(`${BASE_URL}${GROUP_URI}/${id}`, {
    method: "DELETE",
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
    },
  });

  if (!data.ok) {
    throw new Error(`Failed to remove group: ${data.statusText}`);
  }
};
