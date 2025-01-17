import { isMock } from '../../../../shared/utils/isMock';
import { Post } from '../Post';
import { Post as PostT } from '../../models/Post';

interface PostsProps {
  posts: PostT[];
}

const Posts = ({ posts }: PostsProps) => {
  return (
    <div>
      <h3>{isMock ? 'Mocked data:' : 'Fetched XHR data:'}</h3>
      <ul>
        {posts.map((post) => (
          <Post key={post.id} text={post.title} />
        ))}
      </ul>
    </div>
  );
};

export default Posts;
