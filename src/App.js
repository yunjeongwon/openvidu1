import React, { useEffect, useState } from "react";
import axios from "axios";
import { OpenVidu } from "openvidu-browser";

import UserVideoComponent from "./UserVideoComponent";

const OPENVIDU_SERVER_URL = "https://" + window.location.hostname + ":4443";
const OPENVIDU_SERVER_SECRET = "MY_SECRET";

let OV = null;

const App = () => {
  const [mySessionId, setMySessionId] = useState("sessionA");
  const [myUserName, setMyUserName] = useState("jw");
  const [session, setSession] = useState(undefined);
  const [mainStreamManager, setMainStreamManager] = useState(undefined);
  const [publisher, setPublisher] = useState(undefined);
  const [subscribers, setSubscribers] = useState([]);

  const [currentVideoDevice, setCurrentVideoDevice] = useState("");

  const onChnageMyUserName = (e) => {
    setMyUserName(e.target.value);
  };

  const onChnageMySessionId = (e) => {
    setMySessionId(e.target.value);
  };

  const createSession = (sessionId) => {
    return new Promise((resolve, reject) => {
      const data = JSON.stringify({ customSessionId: sessionId });
      axios
        .post(OPENVIDU_SERVER_URL + "/openvidu/api/sessions", data, {
          headers: {
            Authorization:
              "Basic " + btoa("OPENVIDUAPP:" + OPENVIDU_SERVER_SECRET),
            "Content-Type": "application/json",
          },
        })
        .then((response) => {
          console.log("CREATE SESSION", response);
          resolve(response.data.id);
        })
        .catch((response) => {
          const error = Object.assign({}, response);
          if (error.response && error.response.status === 409) {
            resolve(sessionId);
          } else {
            console.log(error);
            console.warn(
              "No connection to OpenVidu Server. This may be a certificate error at " +
                OPENVIDU_SERVER_URL
            );
            if (
              window.confirm(
                'No connection to OpenVidu Server. This may be a certificate error at "' +
                  OPENVIDU_SERVER_URL +
                  '"\n\nClick OK to navigate and accept it. ' +
                  'If no certificate warning is shown, then check that your OpenVidu Server is up and running at "' +
                  OPENVIDU_SERVER_URL +
                  '"'
              )
            ) {
              window.location.assign(
                OPENVIDU_SERVER_URL + "/accept-certificate"
              );
            }
          }
        });
    });
  };

  const createToken = (sessionId) => {
    return new Promise((resolve, reject) => {
      const data = {};
      axios
        .post(
          OPENVIDU_SERVER_URL +
            "/openvidu/api/sessions/" +
            sessionId +
            "/connection",
          data,
          {
            headers: {
              Authorization:
                "Basic " + btoa("OPENVIDUAPP:" + OPENVIDU_SERVER_SECRET),
              "Content-Type": "application/json",
            },
          }
        )
        .then((response) => {
          console.log("TOKEN", response);
          resolve(response.data.token);
        })
        .catch((error) => reject(error));
    });
  };

  const getToken = () => createSession(mySessionId).then((sessionId) => createToken(sessionId));

  const handleMainVideoStream = (stream) => {
    if (mainStreamManager !== stream) {
      setMainStreamManager(stream);
    }
  };

  const leaveSession = () => {
    if (session) {
      session.disconnect();
    }
    OV = null;
    setSession(undefined);
    setSubscribers([]);
    setMySessionId("sessionA");
    setMyUserName("jw");
    setMainStreamManager(undefined);
    setPublisher(undefined);
  };

  useEffect(() => {
    window.addEventListener("beforeunload", leaveSession);
    return () => {
      window.removeEventListener("beforeunload", leaveSession);
    };
  }, []);

  const deleteSubscriber = (streamManager) => {
    const subscribersCopy = [...subscribers];
    const index = subscribersCopy.indexOf(streamManager, 0);
    if (index > -1) {
      subscribersCopy.splice(index, 1);
      setSubscribers(subscribersCopy);
    }
  };

  const joinSession = () => {
    OV = new OpenVidu();
    setSession(OV.initSession());
  };

  useEffect(() => {
    if (session === undefined) {
      return;
    }
    const mySession = session;
    mySession.on("streamCreated", (event) => {
      const subscriber = mySession.subscribe(event.stream, undefined);
      setSubscribers([...subscribers, subscriber]);
    });
    mySession.on("streamDestroyed", (event) => {
      deleteSubscriber(event.stream.streamManager);
    });
    mySession.on("exception", (exception) => {
      console.warn(exception);
    });
    getToken().then((token) => {
      mySession
        .connect(token, { clientData: myUserName })
        .then(async () => {
          const devices = await OV.getDevices();
          const videoDevices = devices.filter(
            (device) => device.kind === "videoinput"
          );
          const publisher = OV.initPublisher(undefined, {
            audioSource: undefined, // The source of audio. If undefined default microphone
            videoSource: videoDevices[0].deviceId, // The source of video. If undefined default webcam
            publishAudio: true, // Whether you want to start publishing with your audio unmuted or not
            publishVideo: true, // Whether you want to start publishing with your video enabled or not
            resolution: "640x480", // The resolution of your video
            frameRate: 30, // The frame rate of your video
            insertMode: "APPEND", // How the video is inserted in the target element 'video-container'
            mirror: false, // Whether to mirror your local video or not
          });
          mySession.publish(publisher);
          setCurrentVideoDevice(videoDevices[0]);
          setMainStreamManager(publisher);
          setPublisher(publisher);
        })
        .catch((error) => {
          console.log(
            "There was an error connecting to the session:",
            error.code,
            error.message
          );
        });
      });
  }, [session]);

  const switchCamera = async () => {
    try {
      const devices = await OV.getDevices();
      const videoDevices = devices.filter(
        (device) => device.kind === "videoinput"
      );
      if (videoDevices && videoDevices.length > 1) {
        const newVideoDevice = videoDevices.filter(
          (device) => device.deviceId !== currentVideoDevice.deviceId
        );
        if (newVideoDevice.length > 0) {
          const newPublisher = OV.initPublisher(undefined, {
            videoSource: newVideoDevice[0].deviceId,
            publishAudio: true,
            publishVideo: true,
            mirror: true,
          });
          await session.unpublish(mainStreamManager);
          await session.publish(newPublisher);
          setCurrentVideoDevice(newVideoDevice);
          setMainStreamManager(newPublisher);
          setPublisher(newPublisher);
        }
      }
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="container">
      {session === undefined ? (
        <div>
          <h1> Join a video session </h1>
          <form onSubmit={joinSession}>
            <p>
              <label htmlFor="userName">참가 이름: </label>
              <input
                id="userName"
                value={myUserName}
                onChange={onChnageMyUserName}
              />
            </p>
            <p>
              <label htmlFor="sessionId">방 세션: </label>
              <input
                id="sessionId"
                value={mySessionId}
                onChange={onChnageMySessionId}
              />
            </p>
            <p>
              <button>참가하기</button>
            </p>
          </form>
        </div>
      ) : null}

      {session !== undefined ? (
        <div id="session">
          <button onClick={leaveSession}>Leave session</button>

          {mainStreamManager !== undefined ? (
            <div id="main-video">
              <UserVideoComponent streamManager={mainStreamManager} />
              <button onClick={switchCamera}>Switch Camera</button>
            </div>
          ) : null}

          <div id="video-container">
            {publisher !== undefined ? (
              <div className="stream-container" onClick={() => handleMainVideoStream(publisher)}>
                <UserVideoComponent streamManager={publisher} />
              </div>
            ) : null}

            {subscribers.map((sub, i) => (
              <div key={i} className="stream-container" onClick={() => handleMainVideoStream(sub)}>
                <UserVideoComponent streamManager={sub} />
              </div>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
};

export default App;
