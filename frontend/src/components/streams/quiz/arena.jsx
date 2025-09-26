import React, { useState, useEffect } from "react";
import { useStreamStore } from '../../../store/useStreamStore'; 
import { Link } from 'react-router-dom';
import { MoveLeft } from 'lucide-react';
import { axiosInstance } from "../../../lib/axios";
import { useChatStore } from "../../../store/useChatStore";
 

const Quiz = () => { 
  const { setPdfScroll, pdfCheck, pdfScrollTop, setStreamData, setStartStreaming,getStream , endStream, streamData } = useStreamStore()
  const { selectedUser } = useChatStore()

  const [currentQ, setCurrentQ] = useState(0);
  const [selected, setSelected] = useState(null);
  const [showAnswer, setShowAnswer] = useState(false);
  const [score, setScore] = useState(0);
const [leaderboard, setLeaderboard] = useState(null)
const [quizData, setQuizData] = useState(null) 

const currentQuestion = quizData?.quiz[currentQ];

useEffect(() => {
  setQuizData(streamData.streamInfo?.quizData ? JSON.parse(streamData.streamInfo?.quizData) : null)
  if(streamData.streamInfo?.leaderboard)
  setLeaderboard(JSON.parse(streamData.streamInfo?.leaderboard))
  }, [streamData])
  

  const handleAnswerClick = (index) => {
    if (showAnswer) return; // prevent changing after selection
    setSelected(index);
    setShowAnswer(true);
    if (index === currentQuestion.answer.index) setScore(score + 1);
  };

  const handleNext = async() => {
    setSelected(null);
    setShowAnswer(false);

    if (currentQ >= quizData?.quiz.length -1) {
      const x = await axiosInstance.get(
        `/stream/update-stream/${streamData._id}/${score*10}`
      );
      console.log(x)
      setLeaderboard(JSON.parse(x.data?.streamInfo?.leaderboard))
      setStreamData(x)
      setTimeout(() => {
        console.log(JSON.parse(x.data?.streamInfo?.leaderboard))
        setCurrentQ(currentQ + 1);
        console.log(leaderboard)
      }, 1000);
    }
    else
    setCurrentQ(currentQ + 1);

  };

  return (
    <>
      <div className="w-full p-8 justify-end flex">
        <Link className="btn" to='/stream'><MoveLeft /> </Link>
      </div>
      <div className="p-6 text-base-content rounded-2xl w-full max-w-2xl m-auto">
        {currentQ < quizData?.quiz.length ? (
          <div>
            <h2 className="text-xl font-bold mb-4">
              Question {currentQ + 1} of {quizData?.quiz.length}
            </h2>

            <p className="font-medium   text-primary mb-4">{currentQuestion.question}</p>

            {currentQuestion.options.map((opt, i) => {
              let bgClass = "bg-base-200 hover:bg-base-300";
              if (showAnswer) {
                if (i === currentQuestion.answer.index) bgClass = "bg-green-500 text-white";
                else if (i === selected && i !== currentQuestion.answer.index) bgClass = "bg-red-600 text-white";
              }
              return (
                <button
                  key={i}
                  onClick={() => handleAnswerClick(i)}
                  className={`w-full text-left px-4 py-2 mb-2 rounded-lg transition ${bgClass}`}
                >
                  {opt.title}
                </button>
              );
            })}

            {showAnswer && (
              <div className="mt-3 p-3 bg-base-300 rounded">
                <strong>Answer:</strong> {currentQuestion.answer.title}
                <p>{currentQuestion.answer.description}</p>
              </div>
            )}

            {showAnswer && (
              <button
                onClick={handleNext}
                className="mt-4 px-4 py-2 bg-primary text-white rounded hover:bg-primary-focus"
              >
                Next
              </button>
            )}
          </div>
        ) : (
          <div className="text-center">
            <h2 className="text-2xl font-bold">🎉 Quiz Completed!</h2>
            <p className="mt-2 text-lg">
              Your Score: {score}/{quizData?.quiz.length}
              <br />
              Points: {score * 10}
            </p>

            {/* Badge */}
            <div className="mt-3">
              {score === quizData?.quiz.length ? (
                <p className="text-xl">🏆 Gold Badge</p>
              ) : score >= quizData?.quiz.length * 0.7 ? (
                <p className="text-xl">🥈 Silver Badge</p>
              ) : score >= quizData?.quiz.length * 0.4 ? (
                <p className="text-xl">🥉 Bronze Badge</p>
              ) : (
                <p className="text-xl">📖 Keep Learning Badge</p>
              )}
            </div>

            {/* Leaderboard */}
            <div className="mt-6">
              <h3 className="text-lg font-bold mb-3">🏅 Leaderboard</h3>
              <table className="w-full border-collapse border border-base-300">
                <thead>
                  <tr className="bg-base-400">
                    <th className="border border-base-300 px-3 py-1">Rank</th>
                    <th className="border border-base-300 px-3 py-1">Name</th>
                    <th className="border border-base-300 px-3 py-1">Points</th>
                    <th className="border border-base-300 px-3 py-1">Badge</th>
                  </tr>
                </thead>
                <tbody>
                  {leaderboard?.map((entry, index) => (
                    <tr key={index}>
                      <td className="border border-base-300 px-3 py-1">{index + 1}</td>
                      <td className="border border-base-300 px-3 py-1">{entry.name}</td>
                      <td className="border border-base-300 px-3 py-1">{entry.points}</td>
                      <td className="border border-base-300 px-3 py-1">{entry.badge}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </>
  );
};

export default Quiz;
