import { useMutation, UseMutationOptions } from '@tanstack/react-query';
import {
  LoginResponse,
  loginUser,
  LogoutResponse,
  logoutUser,
} from '../services/loginService';
import { LoginDTO } from '../../zod/loginSchema';
import { queryClient } from '../tanstack-query';

interface LoginError {
  message: string;
  statusCode: number;
}

interface LogoutError {
  message: string;
  statusCode: number;
}

export const useLoginUser = (
  mutationOptions?: UseMutationOptions<LoginResponse, LoginError, LoginDTO>,
) =>
  useMutation({
    mutationFn: (credentials) => loginUser(credentials),
    onSuccess: (...args) => {
      // Prior session's cache (if any) must not leak across login boundaries.
      queryClient.clear();
      mutationOptions?.onSuccess?.(...args);
    },
    ...mutationOptions,
  });

export const useLogoutUser = (
  mutationOptions?: UseMutationOptions<LogoutResponse, LogoutError, void>,
) =>
  useMutation({
    mutationFn: () => logoutUser(),
    onSettled: (...args) => {
      // Always wipe — even if logout API failed, the local session is gone.
      queryClient.clear();
      mutationOptions?.onSettled?.(...args);
    },
    ...mutationOptions,
  });
