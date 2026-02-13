import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';

interface AuthStatus {
  authenticated: boolean;
}

interface LoginResponse {
  success: boolean;
}

export function useAuth() {
  const queryClient = useQueryClient();

  const { data: status, isLoading } = useQuery({
    queryKey: ['auth', 'status'],
    queryFn: () => api.get<AuthStatus>('/auth/status'),
    retry: false,
  });

  const loginMutation = useMutation({
    mutationFn: (password: string) =>
      api.post<LoginResponse>('/auth/login', { password }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['auth'] });
    },
  });

  const logoutMutation = useMutation({
    mutationFn: () => api.post<{ success: boolean }>('/auth/logout'),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['auth'] });
    },
  });

  return {
    authenticated: status?.authenticated ?? false,
    isLoading,
    login: loginMutation.mutateAsync,
    logout: logoutMutation.mutateAsync,
    isLoggingIn: loginMutation.isPending,
    isLoggingOut: logoutMutation.isPending,
  };
}
