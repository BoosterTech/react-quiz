import { useEffect, useReducer } from "react";
import Header from "./components/Header/index";
import Main from "./components/Main";
import Loader from "./components/Loader/Loader";
import Error from "./components/Error";
import StartScreen from "./components/StartScreen";
import Question from "./components/Question";
import NextButton from "./components/NextButton";
import ProgressBar from "./components/ProgressBar";
import FinishScreen from "./components/FinishScreen";
import Timer from "./components/Timer";
import Footer from "./components/Footer";

const SECS_PER_QUESTION = 30;

const initialState = {
  questions: [],

  //'loading, 'error', 'ready', 'active', 'finished'
  status: "loading",
  index: 0,
  answer: null,
  points: 0,
  highscore: 0,
  timeRemaining: null,
};

function reducer(state, action) {
  switch (action.type) {
    case "dataReceived":
      return {
        ...state,
        questions: action.payload,
        status: "ready",
      };
    case "dataFailed":
      return {
        ...state,
        status: "Error",
      };
    case "start":
      return {
        ...state,
        status: "active",
        timeRemaining: state.questions.length * SECS_PER_QUESTION,
      };
    case "newAnswer":
      const question = state.questions.at(state.index);

      return {
        ...state,
        answer: action.payload,
        points:
          action.payload === question.correctOption
            ? state.points + question.points
            : state.points,
      };
    case "nextQuestion":
      return { ...state, index: state.index + 1, answer: null };
    case "finished":
      return {
        ...state,
        status: "finished",
        highscore:
          state.points > state.highscore ? state.points : state.highscore,
        timeRemaining: 5,
      };
    case "restart":
      return {
        ...initialState,
        questions: state.questions,
        highscore: state.highscore,
        status: "ready",
      };
    case "tick":
      return {
        ...state,
        timeRemaining: state.timeRemaining === 0 ? 5 : state.timeRemaining - 1,
        status: state.timeRemaining === 0 ? "finished" : state.status,
      };
    default:
      throw new Error("Action unknown");
  }
}

function App() {
  const [
    { questions, status, index, answer, points, highscore, timeRemaining },
    dispatch,
  ] = useReducer(reducer, initialState);
  const numQuestions = questions.length;
  const maxPossiblePoints = questions.reduce(
    (prev, curr) => prev + curr.points,
    0
  );

  useEffect(function () {
    fetch("https://boostertech.github.io/react-quiz/questions.json")
      .then((res) => res.json())
      .then((data) => {
        console.log("data", data);
        dispatch({ type: "dataReceived", payload: data });
      })
      .catch(() => dispatch({ type: "dataFailed" }));
  }, []);

  return (
    <>
      <Header />
      <Main>
        {status === "loading" && <Loader />}
        {status === "Error" && <Error />}
        {status === "ready" && (
          <StartScreen numQuestions={numQuestions} dispatch={dispatch} />
        )}
        {status === "active" && (
          <>
            <ProgressBar
              index={index}
              numQuestions={numQuestions}
              points={points}
              maxPossiblePoints={maxPossiblePoints}
              answer={answer}
            />
            <Question
              question={questions[index]}
              dispatch={dispatch}
              answer={answer}
            />
            <Footer>
              <Timer dispatch={dispatch} timeRemaining={timeRemaining} />
              <NextButton
                answer={answer}
                dispatch={dispatch}
                index={index}
                numQuestions={numQuestions}
              />
            </Footer>
          </>
        )}
        {status === "finished" && (
          <FinishScreen
            points={points}
            maxPossiblePoints={maxPossiblePoints}
            highscore={highscore}
            dispatch={dispatch}
          />
        )}
      </Main>
    </>
  );
}

export default App;
