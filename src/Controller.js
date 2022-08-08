import { useEffect, useState, useRef } from 'react';
import { AiOutlineAudioMuted, AiOutlineAudio } from "react-icons/ai";
import { BiExit, BiBell, BiBellOff } from "react-icons/bi";
import { FiShare, FiVideo, FiVideoOff } from "react-icons/fi";
import PropTypes from 'prop-types';
import { OpenVidu } from 'openvidu-browser';
import music from './voice-elephant.mp3';

import styles from './Controller.module.css';
import useAudio from './useAudio';

let OV;

const Controller = ({ publisher, leaveSession, getToken, session }) => {
  const audioBtn = useRef();
  const [audioActive, setAudioActive] = useState(true);
  const [videoActive, setVideoActive] = useState(true);
  const [bellActive, setBellActice] = useState(true);
  const [_, toggle] = useAudio(music);

  useEffect(() => {
    if (!session) {
      return;
    }
    session.on('signal:bell', () => {
      audioBtn.current.click();
    });
    return () => {
      session.off('signal:bell', () => {});
    };
  }, [session, bellActive]);

  const handleMuteClick = () => {
    const state = !publisher.stream.audioActive;
    publisher.publishAudio(state);
    setAudioActive(state);
  };

  const handelCameraClick = () => {
    const state = !publisher.stream.videoActive;
    publisher.publishVideo(state);
    setVideoActive(state);
  };

  const handleShareClick = () => {
    OV = new OpenVidu();
    const sessionScreen = OV.initSession();
    getToken().then((token) => {
      sessionScreen.connect(token).then(() => {
        const newPublisher = OV.initPublisher('html-element-id', { videoSource: 'screen' });
        newPublisher.once('accessAllowed', () => {
          newPublisher.stream.getMediaStream().getVideoTracks()[0].addEventListener('ended', () => {
            console.log('User pressed the "Stop sharing" button');
            sessionScreen.disconnect();
          });
          sessionScreen.publish(newPublisher);
        });
        newPublisher.once('accessDenied', () => {
          console.warn('ScreenShare: Access Denied');
        });
      }).catch(((error) => {
        console.warn('There was an error connecting to the session:', error.code, error.message);
      }));
    });
  };

  const handleBellClick = () => {
    setBellActice((prev) => !prev);
    console.log(bellActive);
  };

  return (
    <div className={styles.buttonGroup}>
      <div className={styles.hidden}><button ref={audioBtn} onClick={toggle}></button></div>
      <div className={styles.button} onClick={handleMuteClick}>
        {audioActive ? <AiOutlineAudio size="24" /> : <div className={styles.colorRed}><AiOutlineAudioMuted size="24" /></div>}
      </div>
      <div className={styles.button} onClick={handelCameraClick}>
        {videoActive ? <FiVideo size="24" /> : <div className={styles.colorRed}><FiVideoOff size="24" /></div>}
      </div>
      <div className={styles.button} onClick={handleBellClick}>
        {bellActive ? <BiBell size="24" /> : <div className={styles.colorRed}><BiBellOff size="24" /></div>}
      </div>
      <div className={styles.button} onClick={handleShareClick}><FiShare size="24" /></div>
      <div className={`${styles.button} ${styles.exitButton}`} onClick={leaveSession}><BiExit size="24" /></div>
    </div>
  );
};

Controller.propTypes = {
  publisher: PropTypes.object.isRequired,
  leaveSession: PropTypes.func.isRequired,
  getToken: PropTypes.func.isRequired,
  session: PropTypes.object.isRequired,
};

export default Controller;
