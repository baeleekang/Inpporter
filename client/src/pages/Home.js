import React from "react";
import { Link } from "react-router-dom";
import "../styles/Home.css";
import { useSelector } from "react-redux";

function Home() {
  const login = useSelector((state) => state.User.login);
  return (
    <div
      className="home"
      style={{ backgroundImage: "url(./background-img.jpg)" }}
    >
      <div className="leftSide">
        <h1>
          최고의 인터뷰를 위한<br></br>서포터, 인포터
        </h1>
        <p>AI 분석을 통한 면접 연습으로 꿈의 회사에 한걸음 더 다가가세요!</p>
        {login ? (
          <Link to="selectquestion">
            <button>바로 시작하기</button>
          </Link>
        ) : (
          <Link to="signin">
            <button>바로 시작하기</button>
          </Link>
        )}
      </div>
      <div
        className="rightSide"
        style={{ backgroundImage: "url(./mainimage.jpg)" }}
      ></div>
    </div>
  );
}

export default Home;
