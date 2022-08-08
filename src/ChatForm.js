import { useRef, useState } from 'react';
import { FiSend } from 'react-icons/fi';
import PropTypes from 'prop-types';

import styles from './ChatForm.module.css';

const ChatForm = ({ session }) => {
  const input = useRef();
  const [myMsg, setMyMsg] = useState('');

  const onChangeMsg = (e) => {
    setMyMsg(e.target.value);
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    if (myMsg.trim() === '') {
      return;
    }
    try {
      await session.signal({ type: 'chat', data: myMsg });
      // console.log('Msg successfully sent');
      setMyMsg('');
      if (input && input.current) {
        input.current.focus();
      }
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <form onSubmit={onSubmit} className={styles.form}>
      <input className={styles.chatInput} ref={input} value={myMsg} onChange={onChangeMsg} />
      <span className={styles.placeholder}>채팅을 입력해주세요.</span>
      <button className={styles.chatBtn} type="submit">
        <FiSend size="20" />
      </button>
    </form>
  );
};

ChatForm.propTypes = {
  session: PropTypes.object.isRequired,
};

export default ChatForm;
