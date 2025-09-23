import { useMutation, UseMutationOptions } from "@tanstack/react-query";
import {
  LoginResponse,
  loginUser,
  LogoutResponse,
  logoutUser,
} from "../services/loginService";
import { LoginDTO } from "../zod-schemas/loginSchema";

interface LoginError {
  message: string;
  statusCode: number;
}

interface LogoutError {
  message: string;
  statusCode: number;
}

export const useLoginUser = (
  mutationOptions?: UseMutationOptions<LoginResponse, LoginError, LoginDTO>
) =>
  useMutation({
    mutationFn: (credentials) => loginUser(credentials),
    ...mutationOptions,
  });

export const useLogoutUser = (
  mutationOptions?: UseMutationOptions<LogoutResponse, LogoutError, void>
) =>
  useMutation({
    mutationFn: () => logoutUser(),
    ...mutationOptions,
  });
