import { CalendarDays, ListTodo } from 'lucide-react';
import { NavLink } from 'react-router-dom';

import styles from './BottomNav.module.scss';
import { routePaths } from '../../../routing';

const links = [
  { to: routePaths.TODAY, label: 'Today', Icon: ListTodo },
  { to: routePaths.CALENDAR, label: 'Calendar', Icon: CalendarDays },
];

const BottomNav = () => {
  return (
    <nav className={styles.nav} aria-label="Primary">
      {links.map(({ to, label, Icon }) => (
        <NavLink
          key={to}
          to={to}
          end
          className={({ isActive }) =>
            isActive ? `${styles.link} ${styles.active}` : styles.link
          }
        >
          <Icon aria-hidden="true" size={22} />
          <span>{label}</span>
        </NavLink>
      ))}
    </nav>
  );
};

export default BottomNav;
