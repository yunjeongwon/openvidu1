import React, { useEffect, useRef } from 'react';

import styles from './OvVideo.module.css';

const OvVideo = ({ streamManager }) => {
  const videoRef = useRef();

  useEffect(() => {
    if (videoRef) {
      streamManager.addVideoElement(videoRef.current);
    }
  }, [streamManager]);
  
  return (
    <video className={styles.video} ref={videoRef} autoPlay />
  );
};

export default OvVideo;
