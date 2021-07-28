import Link from 'next/link';

import commonStyles from '../../styles/common.module.scss';
import styles from './header.module.scss';

const Header: React.FC = () => {
  return (
    <div className={`${commonStyles.container} ${styles.logo}`}>
      <Link href="/">
        <a>
          <img src="/images/logo.svg" alt="logo" />
        </a>
      </Link>
    </div>
  );
};

export default Header;
