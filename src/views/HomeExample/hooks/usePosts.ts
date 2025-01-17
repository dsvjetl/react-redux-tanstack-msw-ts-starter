import { useQuery } from '@tanstack/react-query';

import { queryKeys } from '../constants/queryKeys';
import { fetchPosts } from '../services/postApiServices';
import { Post } from '../models/Post';

const usePosts = () =>
  useQuery<Post[], Error>({
    queryKey: [queryKeys.posts],
    queryFn: fetchPosts,
    refetchOnWindowFocus: false,
  });

export { usePosts };
