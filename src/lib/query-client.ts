import { QueryClient } from '@tanstack/react-query';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Stale time: 5 minutes (data is considered fresh for 5 minutes)
      staleTime: 5 * 60 * 1000,
      // Cache time: 10 minutes (data stays in cache for 10 minutes after becoming stale)
      gcTime: 10 * 60 * 1000,
      // Retry failed requests 3 times
      retry: 3,
      // Retry delay with exponential backoff
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
      // Refetch on window focus (useful for real-time data)
      refetchOnWindowFocus: true,
      // Refetch on reconnect
      refetchOnReconnect: true,
      // Don't refetch on mount if data is fresh
      refetchOnMount: 'always',
    },
    mutations: {
      // Retry failed mutations 2 times
      retry: 2,
      // Retry delay for mutations
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 10000),
    },
  },
});

// Query key factory for consistent key management
export const queryKeys = {
  // Course queries
  courses: {
    all: ['courses'] as const,
    lists: () => [...queryKeys.courses.all, 'list'] as const,
    list: (params: Record<string, unknown>) => [...queryKeys.courses.lists(), params] as const,
    details: () => [...queryKeys.courses.all, 'detail'] as const,
    detail: (id: string) => [...queryKeys.courses.details(), id] as const,
    stats: () => [...queryKeys.courses.all, 'stats'] as const,
  },
  
  // User queries
  users: {
    all: ['users'] as const,
    lists: () => [...queryKeys.users.all, 'list'] as const,
    list: (params: Record<string, unknown>) => [...queryKeys.users.lists(), params] as const,
    details: () => [...queryKeys.users.all, 'detail'] as const,
    detail: (id: string) => [...queryKeys.users.details(), id] as const,
    profile: () => [...queryKeys.users.all, 'profile'] as const,
  },
  
  // Video queries
  videos: {
    all: ['videos'] as const,
    lists: () => [...queryKeys.videos.all, 'list'] as const,
    list: (params: Record<string, unknown>) => [...queryKeys.videos.lists(), params] as const,
    details: () => [...queryKeys.videos.all, 'detail'] as const,
    detail: (id: string) => [...queryKeys.videos.details(), id] as const,
    processing: () => [...queryKeys.videos.all, 'processing'] as const,
  },
  
  // Upload queries
  uploads: {
    all: ['uploads'] as const,
    progress: (id: string) => [...queryKeys.uploads.all, 'progress', id] as const,
    status: (id: string) => [...queryKeys.uploads.all, 'status', id] as const,
  },
  
  // Analytics queries
  analytics: {
    all: ['analytics'] as const,
    dashboard: () => [...queryKeys.analytics.all, 'dashboard'] as const,
    courses: () => [...queryKeys.analytics.all, 'courses'] as const,
    users: () => [...queryKeys.analytics.all, 'users'] as const,
  },
} as const;

// Cache invalidation helpers
export const invalidateQueries = {
  courses: {
    all: () => queryClient.invalidateQueries({ queryKey: queryKeys.courses.all }),
    lists: () => queryClient.invalidateQueries({ queryKey: queryKeys.courses.lists() }),
    detail: (id: string) => queryClient.invalidateQueries({ queryKey: queryKeys.courses.detail(id) }),
    stats: () => queryClient.invalidateQueries({ queryKey: queryKeys.courses.stats() }),
  },
  
  users: {
    all: () => queryClient.invalidateQueries({ queryKey: queryKeys.users.all }),
    lists: () => queryClient.invalidateQueries({ queryKey: queryKeys.users.lists() }),
    detail: (id: string) => queryClient.invalidateQueries({ queryKey: queryKeys.users.detail(id) }),
    profile: () => queryClient.invalidateQueries({ queryKey: queryKeys.users.profile() }),
  },
  
  videos: {
    all: () => queryClient.invalidateQueries({ queryKey: queryKeys.videos.all }),
    lists: () => queryClient.invalidateQueries({ queryKey: queryKeys.videos.lists() }),
    detail: (id: string) => queryClient.invalidateQueries({ queryKey: queryKeys.videos.detail(id) }),
    processing: () => queryClient.invalidateQueries({ queryKey: queryKeys.videos.processing() }),
  },
  
  analytics: {
    all: () => queryClient.invalidateQueries({ queryKey: queryKeys.analytics.all }),
    dashboard: () => queryClient.invalidateQueries({ queryKey: queryKeys.analytics.dashboard() }),
  },
};

// Prefetch helpers
export const prefetchQueries = {
  courses: {
    list: async (params: Record<string, unknown> = {}) => {
      await queryClient.prefetchQuery({
        queryKey: queryKeys.courses.list(params),
        queryFn: () => import('@/lib/api/courses').then(m => m.courseApi.getAllCourses(params)),
        staleTime: 5 * 60 * 1000, // 5 minutes
      });
    },
    
    detail: async (id: string) => {
      await queryClient.prefetchQuery({
        queryKey: queryKeys.courses.detail(id),
        queryFn: () => import('@/lib/api/courses').then(m => m.courseApi.getCourseById(id)),
        staleTime: 5 * 60 * 1000, // 5 minutes
      });
    },
  },
  
  // users: {
  //   list: async (params: Record<string, unknown> = {}) => {
  //     await queryClient.prefetchQuery({
  //       queryKey: queryKeys.users.list(params),
  //       queryFn: () => import('@/lib/api/users').then(m => m.fetchUsers(params)),
  //       staleTime: 5 * 60 * 1000, // 5 minutes
  //     });
  //   },
  // },
};

// Background refresh helpers
export const backgroundRefresh = {
  courses: {
    // Refresh course data in background without showing loading state
    refreshList: (params: Record<string, unknown> = {}) => {
      queryClient.refetchQueries({ 
        queryKey: queryKeys.courses.list(params),
        type: 'active' // Only refetch if query is currently active
      });
    },
    
    refreshDetail: (id: string) => {
      queryClient.refetchQueries({ 
        queryKey: queryKeys.courses.detail(id),
        type: 'active'
      });
    },
  },
  
  users: {
    refreshList: (params: Record<string, unknown> = {}) => {
      queryClient.refetchQueries({ 
        queryKey: queryKeys.users.list(params),
        type: 'active'
      });
    },
  },
  
  analytics: {
    refreshDashboard: () => {
      queryClient.refetchQueries({ 
        queryKey: queryKeys.analytics.dashboard(),
        type: 'active'
      });
    },
  },
};

// Optimistic updates helpers
export const optimisticUpdates = {
  courses: {
    updateCourse: (id: string, updates: Partial<any>) => {
      queryClient.setQueryData(queryKeys.courses.detail(id), (old: any) => {
        if (!old) return old;
        return { ...old, ...updates };
      });
    },
    
    addCourse: (newCourse: any) => {
      // Add to all course lists
      queryClient.setQueriesData(
        { queryKey: queryKeys.courses.lists() },
        (old: any) => {
          if (!old) return old;
          if (Array.isArray(old)) {
            return [newCourse, ...old];
          }
          if (old.data && Array.isArray(old.data)) {
            return { ...old, data: [newCourse, ...old.data] };
          }
          return old;
        }
      );
    },
    
    removeCourse: (id: string) => {
      // Remove from all course lists
      queryClient.setQueriesData(
        { queryKey: queryKeys.courses.lists() },
        (old: any) => {
          if (!old) return old;
          if (Array.isArray(old)) {
            return old.filter((course: any) => course.id !== id);
          }
          if (old.data && Array.isArray(old.data)) {
            return { ...old, data: old.data.filter((course: any) => course.id !== id) };
          }
          return old;
        }
      );
      
      // Remove detail cache
      queryClient.removeQueries({ queryKey: queryKeys.courses.detail(id) });
    },
  },
};