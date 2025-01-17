import PropTypes from 'prop-types';

import styles from './Todo.module.scss';

const Todo = ({ todo }) => {
  return (
    <li className={styles.todo} data-testid={'todo'}>
      {todo}
    </li>
  );
};

Todo.propTypes = {
  todo: PropTypes.string,
};

export default Todo;
