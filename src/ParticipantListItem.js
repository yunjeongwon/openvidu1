/* eslint-disable react/prop-types */
import PropTypes from 'prop-types';
import { AiOutlineAudioMuted, AiOutlineAudio } from 'react-icons/ai';
import { FiVideo, FiVideoOff } from 'react-icons/fi';
import { BiBellOff, BiBell } from "react-icons/bi";

import styles from './ParticipantListItem.module.css';

const ParticipantListItem = ({ publisher, subscriber, session }) => {
  const onClickBell = (target) => {
    session.signal({
      to: [target],
      type: 'bell',
    }).then(() => {
      console.log('bell successfully sent');
    }).catch(error => {
        console.error(error);
    });
  };
  if (publisher?.session?.connection) {
    return (
      <div className={styles.wrapper}>
        <div className={styles.nickname}>{publisher.session.connection.connectionId}</div>
        <div className={styles.buttons}>
          {publisher.session.connection.stream?.audioActive
            ? (
              <div className={styles.yes}><AiOutlineAudio /></div>
            ) : (
              <div className={styles.no}><AiOutlineAudioMuted /></div>
            )}
          {publisher.session.connection.stream?.videoActive
            ? (
              <div className={styles.yes}><FiVideo /></div>
            ) : (
              <div className={styles.no}><FiVideoOff /></div>
            )}
        </div>
      </div>
    );
  }
  if (subscriber?.stream) {
    return (
      <div className={styles.wrapper}>
        {subscriber.stream.connection
        && <div className={styles.nickname}>{subscriber.stream.connection.connectionId}</div>}
        <div className={styles.buttons}>
          {subscriber.stream.audioActive
            ? (
              <div className={styles.yes}><AiOutlineAudio /></div>
            ) : (
              <div className={styles.no}><AiOutlineAudioMuted /></div>
            )}
          {subscriber.stream.videoActive
            ? (
              <div className={styles.yes}><FiVideo /></div>
            ) : (
              <div className={styles.no}><FiVideoOff /></div>
            )}
          <div className={styles.yes} onClick={() => onClickBell(subscriber.stream.connection)}><BiBell /></div>
        </div>
      </div>
    );
  }
  return null;
};

ParticipantListItem.propTypes = {
  session: PropTypes.object.isRequired,
};

export default ParticipantListItem;
