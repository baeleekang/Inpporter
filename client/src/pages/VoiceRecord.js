import React from "react";import { useRef, useState } from "react";
import { useNavigate } from "react-router-dom";

import "../styles/VoiceRecord.css";

// react wordcloud
import SpeechRecognition, {
  useSpeechRecognition,
} from "react-speech-recognition";

// tensorflow library (iris)
import * as tf from "@tensorflow/tfjs-core";
import "@tensorflow/tfjs-backend-webgl";
import * as blazeface from "@tensorflow-models/blazeface";
import * as faceDetection from "@tensorflow-models/face-detection";

// react face-api.js
// import * as faceapi from "face-api.js"; 
import * as faceapi from '@vladmandic/face-api';


const words = [];

// 홍채 인식
const g_var = {};
let detector;
let left_eye_list = [];
let right_eye_list = [];

// 표정 인식
let angry = 0;
let disgusted = 0;
let fearful = 0;
let happy = 0;
let neutral = 0;
let sad = 0;
let surprised = 0;
let sum = 0;

const AudioRecord = () => {
  const navigate = useNavigate();
  const [playing, setPlaying] = useState(true);
  const [timer, setTimer] = useState(undefined);

  const videoRef = useRef(null);
  const canvasRef = useRef(null);

  const {
    transcript,
    listening,
    // resetTranscript,
    // browserSupportsSpeechRecognition,
  } = useSpeechRecognition();

  const a = transcript.split(" ");
  const [name, setName] = useState();

  // const [videoBtn, setVideoBtn] = useState("화면 보기");
  // const [onVideo, setOnVideo] = useState(true);

  // css
  const Styles = {
    // video css
    Video: {
      width: "80%",
      height: "85%",
      background: "rgba(245, 240, 215, 0.5)",
    },
    // canvas css
    Canvas: {
      width: "30vw",
      background: "rgba(0,0,0,0)",
      border: "1px solid green",
    },
    None: { display: "none" },
  };
  

  // 웹캠 띄우기
  const getWebcam = (callback) => {
    videoRef && loadModels(); // 웹캠 출력 시 videoref 및 표정인식 모델 불러오기
    try {
      const constraints = {
        video: true,
      };
      navigator.mediaDevices.getUserMedia(constraints).then(callback);
    } catch (err) {
      console.log(err);
      return undefined;
    }
  };

  // 표정 인식 모델 초기화
  const loadModels = () => {
    Promise.all([
      faceapi.nets.tinyFaceDetector.loadFromUri("/models"),
      faceapi.nets.faceLandmark68Net.loadFromUri("/models"),
      faceapi.nets.faceRecognitionNet.loadFromUri("/models"),
      faceapi.nets.faceExpressionNet.loadFromUri("/models"),
    ]).then(() => {
      // faceDetection();
    });
  };

  // 모델 초기화
  // 아래와 같은 useEffect 구문은 componentDidMount()와 같아서 단 최초 1회만 실행 됨
  React.useEffect(() => {
    const initFD = async () => {
      // tf.setBackend()와 blazeface.load()를 await를 사용해서 순차적으로 호출
      // require("@tensorflow/tfjs-node");
      // var tf = require("@tensorflow/tfjs");
      // tf.setBackend("tensorflow");
      await tf.setBackend("webgl");

      // 전역 변수 g_var.model에 초기화된 모델을 저장
      g_var.model = await blazeface.load();

      // 웹 캠 열기
      getWebcam((stream) => {
        videoRef.current.srcObject = stream;
      });

      createDetector();
    };;
    initFD();
  }, []);

  const createDetector = async () => {
    const model = faceDetection.SupportedModels.MediaPipeFaceDetector;
    const detectorConfig = {
      runtime: "tfjs", // or 'tfjs'
    };
    detector = await faceDetection.createDetector(model, detectorConfig);
  };

  // 비디오 재생되는 동안 홍채 좌표 저장하는 함수
  const drawToIris = async () => {
    try {
      const ctx = canvasRef.current.getContext("2d");

      // canvas의 넓이/높이를 입력 비디오 넓이/높이에 맞추는 과정
      canvasRef.current.width = videoRef.current.videoWidth;
      canvasRef.current.height = videoRef.current.videoHeight;

      if (ctx && ctx !== null) {
        if (videoRef.current) {
          // 화면을 좌우 대칭으로 그리기
          ctx.translate(canvasRef.current.width, 0);
          ctx.scale(-1, 1);

          // drawImage(입력, 시작점 x좌표, 시작점 y좌표, 넓이, 높이)
          // 입력 비디오 사이즈와 같아진 canvas 넓이/높이만큼 그려주기
          ctx.drawImage(
            videoRef.current,
            0,
            0,
            canvasRef.current.width,
            canvasRef.current.height
          );
          ctx.setTransform(1, 0, 0, 1, 0, 0);
        }

        // const preds = await await g_var.model.estimateFaces(canvasRef.current, false);
        const faces = await detector.estimateFaces(canvasRef.current);
        console.log("-----faces", faces);

        left_eye_list.push(faces[0].keypoints[0]);
        right_eye_list.push(faces[0].keypoints[1]);
      }
    } catch (err) {
      console.log(err);
    }
  };

  // 표정 인식 함수
  const EmotionDetection = async () => {
    console.log("잘되는중")
    const detections = await faceapi
      .detectAllFaces(videoRef.current, new faceapi.TinyFaceDetectorOptions())
      .withFaceLandmarks()
      .withFaceExpressions();

    angry += detections[0].expressions.angry;
    disgusted += detections[0].expressions.disgusted;
    fearful += detections[0].expressions.fearful;
    happy += detections[0].expressions.happy;
    neutral += detections[0].expressions.neutral;
    sad += detections[0].expressions.sad;
    surprised += detections[0].expressions.surprised;

    canvasRef.current.innerHtml = faceapi.createCanvasFromMedia(
      videoRef.current
    );
    faceapi.matchDimensions(canvasRef.current, {
      width: videoRef.current.videoWidth,
      height: videoRef.current.videoHeight,
    });

    const resizedResults = faceapi.resizeResults(detections, {
      width: videoRef.current.videoWidth,
      height: videoRef.current.videoHeight,
    });

    faceapi.draw.drawDetections(canvasRef.current, resizedResults); //얼굴네모출력
    // faceapi.draw.drawFaceLandmarks(canvasRef.current, resizedResults) //얼굴라인출력
    faceapi.draw.drawFaceExpressions(canvasRef.current, resizedResults); //감정출력

    console.log("화가나다",angry);
  };

  // const startOrStop = () => {
  //   if (playing) {
  //     const s = videoRef.current.srcObject;
  //     s.getTracks().forEach((track) => {
  //       setPlaying(false);
  //       track.stop();
  //     });
  //   } else {
  //     getWebcam((stream1) => {
  //       setPlaying(true);
  //       videoRef.current.srcObject = stream1;
  //     });
  //   }
  // };

  const recognitions = () =>{
    drawToIris()
    EmotionDetection()
  };

  // 반복적으로 그려주는 함수
  // setTimeout(expired(),TIME) : TIME 시간이 지난 뒤 expired()를 호출
  // setInterval(expired(),TIME) : TIME 간격으로, expired()를 반복 호출
  const startOrStop = () => {
    if (!timer) {
      const t = setInterval(() => recognitions(), 200);
      setTimer(t);
    } else {
      clearInterval(timer);
      setTimer(undefined);
    }
  };

  const checkResult = () => {
    // wordcloud code
    console.log(transcript);
    words.push({ text: "hi", value: 1 });

    // 표정인식 결과 퍼센트계산
    sum = angry + happy + disgusted + neutral + sad + surprised + fearful;
    
    angry = (angry / sum) * 100;
    happy = (happy / sum) * 100;
    disgusted = (disgusted / sum) * 100;
    neutral = (neutral / sum) * 100;
    sad = (sad / sum) * 100;
    surprised = (surprised / sum) * 100;
    fearful = (fearful / sum) * 100;

    //동작 여부를 보기 위해 값을 넣어놓음
    for (let i = 0; i < a.length; i++) {
      if (words.findIndex((v) => v.text === a[i]) !== -1) {
        console.log(words.findIndex((v) => v.text === a[i]));
        words[words.findIndex((v) => v.text === a[i])].value++;
      } else {
        words.push({ text: a[i], value: 1 });
      }
    }
    setName("hi");

    if (playing) {
      const s = videoRef.current.srcObject;
      s.getTracks().forEach((track) => {
        setPlaying(false);
        track.stop();
      });
    }
    navigate("/result", {
      state: {
        word: words,
        left_eye: left_eye_list,
        right_eye: right_eye_list,

        angryvalue: angry,
        happyvalue: happy,
        disgustedvalue: disgusted,
        neutralvalue: neutral,
        sadvalue: sad,
        surprisedvalue: surprised,
        fearfulvalue:fearful
      },
    });
  };

  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        backgroundImage: "url(./background-img.jpg)",
        backgroundRepeat: "no-repeat",
      }}
    >
      <div id="recordArea">
        <div id="videoArea">
          <div id="recordTitle">
            {" "}
            <h1> PRACTICE THE INTERVIEW </h1>
          </div>

          <video
            ref={videoRef}
            autoPlay
            style={Styles.Video}
            id="videoScreen"
          ></video>
        </div>
        <div id="btnArea">
          <button id="videoPlayBtn" onClick={startOrStop}>
            {timer ? "화면 중지" : "화면 시작"}
          </button>
          {listening ? (
            <button id="audioRecBtn" onClick={SpeechRecognition.stopListening}>
              녹음 종료
            </button>
          ) : (
            <button
              id="audioRecBtn"
              onClick={() =>
                SpeechRecognition.startListening({
                  continuous: true,
                  language: "ko",
                })
              }
            >
              녹음 시작
            </button>
          )}
          <button id="checkResultBtn" onClick={checkResult}>
            결과 확인
          </button>
        </div>
        <div style={{ display: "none" }}>
          {" "}
          <canvas ref={canvasRef} style={Styles.Canvas} />
        </div>
      </div>
    </div>
  );
};

export default AudioRecord;
