import { useQuery } from '@tanstack/react-query';

import { queryKeys } from '../constants/queryKeys';
import { fetchPosts } from '../services/postApiServices';

const usePosts = () =>
  useQuery({
    queryKey: [queryKeys.posts],
    queryFn: fetchPosts,
    refetchOnWindowFocus: false,
  });

export { usePosts };
