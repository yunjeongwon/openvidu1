import React, { useEffect, useRef } from "react";

const OpenViduVideoComponent = ({ streamManager }) => {
  const videoRef = useRef();
  useEffect(() => {
    if (videoRef) {
      streamManager.addVideoElement(videoRef.current);
    }
  }, [videoRef]);
  useEffect(() => {
    if (videoRef) {
      streamManager.addVideoElement(videoRef.current);
    }
  }, []);
  return <video autoPlay={true} ref={videoRef} />;
};

export default OpenViduVideoComponent;
