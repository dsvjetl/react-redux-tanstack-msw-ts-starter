import styles from './HomeExample.module.scss';
import { usePosts } from './hooks/usePosts';
import { Posts } from './components/Posts';
import { Todos } from './components/Todos';

const HomeExample = () => {
  const { data: posts, isLoading } = usePosts();

  const renderPosts = () => {
    return isLoading ? <span>Loading posts...</span> : <Posts posts={posts} />;
  };

  return (
    <>
      <h1>dsvjetl React Starter</h1>
      <div className={styles.wrapper}>
        {renderPosts()}
        <Todos />
      </div>
    </>
  );
};

export default HomeExample;
