import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { OpenVidu } from 'openvidu-browser';

import UserVideoComponent from './UserVideoComponent';
import styles from './App.module.css';
import Chat from './Chat';
import Controller from './Controller';
import ParticipantList from './ParticipantList';
import ParticipantListItem from './ParticipantListItem';

const OPENVIDU_SERVER_URL = 'https://' + window.location.hostname + ':4443';
const OPENVIDU_SERVER_SECRET = 'MY_SECRET';

let OV;

const App = () => {
  const [_, setEmpty] = useState(0);
  const [session, setSession] = useState(null);
  const [sessionId, setSessionId] = useState('roomname');
  const [userName, setUserName] = useState('nickname');
  const [mainStreamManager, setMainStreamManager] = useState(null);
  const [publisher, setPublisher] = useState(null);
  const [subscribers, setSubscribers] = useState([]);
  const [currentVideoDevice, setCurrentVideoDevice] = useState(null);

  const reqCameraAndAudio = async () => {
    try {
      await navigator.mediaDevices.getUserMedia({ audio: true, video: { facingMode: 'user' } });
    } catch (err) {
      if (err.message === 'Permission denied') {
        window.alert('마이크, 오디오 권한을 재설정 해주세요!');
      }
    } 
  };

  useEffect(() => {
    reqCameraAndAudio();
  }, []);

  if (publisher) {
    publisher.on('streamPropertyChanged', () => {
      setEmpty((prev) => prev + 1);
    });
  }

  if (subscribers.length > 0) {
    subscribers.forEach((sub) => {
      sub.on('streamPropertyChanged', () => {
        setEmpty((prev) => prev + 1);
      });
    });
  }

  const onChangeUserName = (event) => {
    setUserName(event.target.value);
  };

  const onChangeSessionId = (event) => {
    setSessionId(event.target.value);
  };

  const createSession = (sessionId) => {
    return new Promise((resolve, _) => {
      const data = JSON.stringify({ customSessionId: sessionId });
      axios.post(OPENVIDU_SERVER_URL + '/openvidu/api/sessions', data, {
          headers: {
            Authorization:
            'Basic ' + btoa('OPENVIDUAPP:' + OPENVIDU_SERVER_SECRET),
            'Content-Type': 'application/json',
          },
        })
        .then((response) => {
          console.log('CREATE SESSION', response);
          resolve(response.data.id);
        })
        .catch((response) => {
          const error = Object.assign({}, response);
          if (error.response && error.response.status === 409) {
            resolve(sessionId);
          } else {
            console.log(error);
            console.warn(
              'No connection to OpenVidu Server. This may be a certificate error at ' +
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
                OPENVIDU_SERVER_URL + '/accept-certificate'
              );
            }
          }
        });
    });
  };

  const createToken = (sessionId) => {
    return new Promise((resolve, reject) => {
      const data = {};
      axios.post(
          OPENVIDU_SERVER_URL +
            '/openvidu/api/sessions/' +
            sessionId +
            '/connection',
          data,
          {
            headers: {
              Authorization:
                'Basic ' + btoa('OPENVIDUAPP:' + OPENVIDU_SERVER_SECRET),
              'Content-Type': 'application/json',
            },
          }
        )
        .then((response) => {
          console.log('TOKEN', response);
          resolve(response.data.token);
        })
        .catch((error) => reject(error));
    });
  };

  const getToken = () =>
    createSession(sessionId).then((sessionId) => createToken(sessionId));

  const handleMainVideoStream = (stream) => {
    if (mainStreamManager === stream) return;
    setMainStreamManager(stream);
  };

  const leaveSession = () => {
    if (!window.confirm('방을 나가시겠습니까?')) {
      return;
    }
    if (session) session.disconnect();

    OV = null;
    setSession(null); 
    setSubscribers([]);
    setSessionId('roomname'); // for test use not null value
    setUserName('nickname'); 
    setMainStreamManager(null);
    setPublisher(null);
    setCurrentVideoDevice(null);
  };

  const listener = (e) => {
    e.preventDefault();
    e.returnValue = '';
  };

  useEffect(() => {
    window.addEventListener('beforeunload', listener);
    return () => window.removeEventListener('beforeunload', listener);
  });

  useEffect(() => {
    window.addEventListener('unload', leaveSession);
    return () => window.removeEventListener('unload', leaveSession);
  });

  const joinSession = (event) => {
    event.preventDefault();
    OV = new OpenVidu();
    setSession(OV.initSession());
  };

  const connectCamera = async () => {
    const devices = await OV.getDevices();
    const videoDevices = devices.filter((device) => device.kind === 'videoinput');
    const tmpPublisher = OV.initPublisher(undefined, {
      audioSource: undefined, 
      videoSource: videoDevices[0].deviceId, 
      publishAudio: true, 
      publishVideo: true, 
      resolution: '640x480', 
      frameRate: 30, 
      insertMode: 'APPEND', 
      mirror: false, 
    });
    session.publish(tmpPublisher);
    setCurrentVideoDevice(videoDevices[0]);
    console.log('tmpPublisher', tmpPublisher, typeof tmpPublisher);
    setMainStreamManager(tmpPublisher);
    setPublisher(tmpPublisher);
  };

  useEffect(() => {
    if (!session) return;

    session.on('streamCreated', (event) => {
      const subscriber = session.subscribe(event.stream, undefined);
      setSubscribers((prevSubscribers) => [...prevSubscribers, subscriber]);
    });

    session.on('streamDestroyed', (event) => {
      setSubscribers((prevSubscribers) => prevSubscribers.filter((stream) => stream !== event.stream.streamManager))
    });

    session.on('exception', (exception) => {
      console.warn(exception);
    });

    getToken().then((token) => {
      session.connect(token, { clientData: userName })
        .then(() => {
          connectCamera();
        })
        .catch((error) => {
          console.log(
            'There was an error connecting to the session:',
            error.code,
            error.message
          );
        });
    });
  }, [session]);

  const switchCamera = async () => {
    try {
      const devices = await OV.getDevices();
      const videoDevices = devices.filter((device) => device.kind === 'videoinput');

      if (videoDevices?.length > 1) {
        const newVideoDevice = videoDevices.filter((device) => {
          return device.deviceId !== currentVideoDevice.deviceId
        });

        if (newVideoDevice.length) {
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
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <div className="container" style={{ height: '100vh' }}>
      {!session && (
        <div>
          <h1> Join a video session </h1>
          <form onSubmit={(event) => joinSession(event)}>
            <p>
              <label htmlFor="userName">참가 이름: </label>
              <input
                id="userName"
                value={userName}
                onChange={onChangeUserName}
              />
            </p>
            <p>
              <label htmlFor="sessionId">방 세션: </label>
              <input
                id="sessionId"
                value={sessionId}
                onChange={onChangeSessionId}
              />
            </p>
            <p>
              <button>참가하기</button>
            </p>
          </form>
        </div>
      )}
      {session && (
        <div className={styles.wrapper}>
          {mainStreamManager && (
            <div className={styles.videoWrapper}>
              <div className={styles.videoContainer}>
                mainStreamManager
                <UserVideoComponent streamManager={mainStreamManager} />
                <button
                  // onClick={switchCamera}
                >Switch Camera</button>
              </div>
            </div>
          )}
          {/* {publisher && (
            <div className={styles.videoWrapper} onClick={() => handleMainVideoStream(publisher)}>
              <div className={styles.videoContainer}>
                Publisher
                <UserVideoComponent streamManager={publisher} />
              </div>
            </div>
          )} */}

          {subscribers.length > 0 &&
            subscribers.map((sub, idx) => (
            <div className={styles.videoWrapper} key={idx}>
              <div
                className={styles.videoContainer}
                // onClick={() => handleMainVideoStream(sub)}
              >
                  Remote
                <UserVideoComponent streamManager={sub} />
              </div>
            </div>
          ))}
          {publisher && <Controller publisher={publisher} leaveSession={leaveSession} getToken={getToken} session={session} />}
        </div>
      )}

      <h4>참가자</h4>
      {session && publisher && <ParticipantListItem publisher={publisher} session={session} />}
      {session && subscribers && <ParticipantList subscribers={subscribers} session={session} />}

      {session && <Chat session={session} leaveSession={leaveSession} />}
    </div>
  );
};

export default App;
