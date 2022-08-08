import PropTypes from 'prop-types';

import styles from './ChatContent.module.css';

const ChatContent = ({ chat }) => {
  return (
    <div className={styles.chat}>
      <div><span className={styles.nickname}>{chat.from}</span>{' '}<span className={styles.createdAt}>{chat.createdAt}</span></div>
      <div className={styles.content}>{chat.content}</div>
      <br />
    </div>
  );
};

ChatContent.propTypes = {
  chat: PropTypes.object.isRequired,
};

export default ChatContent;
