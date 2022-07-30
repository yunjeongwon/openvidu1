import React, { useEffect, useRef } from 'react';

const OpenViduVideoComponent = ({ streamManager }) => {
  const videoRef = useRef();

  useEffect(() => {
    if (videoRef) {
      streamManager.addVideoElement(videoRef.current);
    }
  }, [streamManager]);
  
  return <video ref={videoRef} autoPlay />;
};

export default OpenViduVideoComponent;
