import PropTypes from 'prop-types';

import styles from './Post.module.scss';

const Post = ({ text }) => {
  return <li className={styles.post}>{text}</li>;
};

Post.propTypes = {
  text: PropTypes.string,
};

export default Post;
