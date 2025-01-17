import PropTypes from 'prop-types';

import { isMock } from '../../../../shared/utils/isMock';
import { Post } from '../Post';

const Posts = ({ posts }) => {
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

Posts.propTypes = {
  posts: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.number,
      userId: PropTypes.number,
      title: PropTypes.string,
      body: PropTypes.string,
    }).isRequired,
  ),
};

export default Posts;
