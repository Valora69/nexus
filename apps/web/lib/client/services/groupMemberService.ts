import { BASE_URL } from "../config";
import {
  CreateGroupMemberData,
  UpdateGroupMemberData,
} from "../../types/model";

const GROUP_URI = "/group-member";

export const createGroupMember = async (
  groupMemberData: CreateGroupMemberData
) => {
  const data = await fetch(`${BASE_URL}${GROUP_URI}`, {
    method: "POST",
    body: JSON.stringify(groupMemberData),
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
    },
  });

  if (!data.ok) {
    throw new Error(`Failed to create group member: ${data.statusText}`);
  }

  const response = await data.json();
  return response;
};
export const getAllGroupMembers = async () => {
  const data = await fetch(`${BASE_URL}${GROUP_URI}`, {
    method: "GET",
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
    },
  });

  if (!data.ok) {
    throw new Error(`Failed to fetch group members: ${data.statusText}`);
  }

  const response = await data.json();
  return response;
};

export const getGroupMemberById = async (id: string) => {
  const data = await fetch(`${BASE_URL}${GROUP_URI}/${id}`, {
    method: "GET",
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
    },
  });

  if (!data.ok) {
    throw new Error(`Failed to fetch group member: ${data.statusText}`);
  }

  const response = await data.json();
  return response;
};

export const updateGroupMember = async (
  id: string,
  groupMemberData: UpdateGroupMemberData
) => {
  const data = await fetch(`${BASE_URL}${GROUP_URI}/${id}`, {
    method: "PATCH",
    body: JSON.stringify(groupMemberData),
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
    },
  });

  if (!data.ok) {
    throw new Error(`Failed to update group member: ${data.statusText}`);
  }

  const response = await data.json();
  return response;
};

export const removeGroupMember = async (id: string) => {
  const data = await fetch(`${BASE_URL}${GROUP_URI}/${id}`, {
    method: "DELETE",
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
    },
  });

  if (!data.ok) {
    throw new Error(`Failed to remove group member: ${data.statusText}`);
  }
};
