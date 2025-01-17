import styles from './Post.module.scss';

interface PostProps {
  text: string;
}

const Post = ({ text }: PostProps) => {
  return <li className={styles.post}>{text}</li>;
};

export default Post;
