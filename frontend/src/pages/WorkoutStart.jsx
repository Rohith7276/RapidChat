import React, { useState } from 'react';
import WorkoutSteps from '../components/WorkoutSteps';

const WorkoutStart = () => {
  const workout = localStorage.getItem('workout')
    ? JSON.parse(localStorage.getItem('workout'))
    : null;

  const [selectedExercise, setSelectedExercise] = useState(null);

  const handleCardClick = (exercise) => {
    setSelectedExercise(exercise);
  };

  const handleCloseVideo = () => {
    setSelectedExercise(null);
  };

  return (
    <div className="bg-base-100  min-h-screen pt-20 px-4 text-white">
        <h1 className='text-5xl font-semibold text-center mb-5'>Workout Exercise</h1>
      {workout?.exercises?.length > 0 && (
        <div className="flex flex-wrap gap-24 h-[30vh] items-center justify-center">
          {workout.exercises.map((exercise, index) => (
            <div
              key={index}
              onClick={() => handleCardClick(exercise)}
              className="bg-white h-[20vh] text-gray-800 rounded-xl p-5 w-72 cursor-pointer shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1"
            >
              <h3 className="text-xl font-semibold">{exercise.name}</h3>
              <p className="text-sm mt-2 text-gray-600">{exercise.description}</p>
            </div>
          ))}
        </div>
      )}
        <h1 className='text-5xl font-semibold text-center mb-8'>Food to Eat</h1>

      {workout?.food_plan?.length > 0 && (
        <div className="flex flex- w-screen gap-24 items-center justify-center">
          {workout.food_plan.map((food, index) => (
            <div
            
              key={index} 
              className="bg-white h-fit text-gray-800 rounded-xl p-5 w-72 cursor-pointer shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1"
            >
                <div className='h-[10rem] w-[15rem]' style={{backgroundImage: `url(${food.image})`, backgroundSize: 'cover', backgroundPosition: 'center'}}>.</div>
              <h3 className="text-xl font-semibold">{food.name}</h3>
              <p className="text-sm mt-2 text-gray-600">{food.description}</p>
              <p className="text-xl font-bold mt-2 text-gray-600">{food.calories}</p>
              <p className="text-xl mt-2 text-gray-600">{food.quantity}</p>
            </div>
          ))}
        </div>
      )}

      {selectedExercise && (
        <div className="fixed inset-0 bg-black bg-opacity-80 backdrop-blur-sm flex justify-center items-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-2xl shadow-2xl relative text-gray-800">
            <h2 className="text-2xl font-bold">{selectedExercise.name}</h2>
            <p className="text-sm text-gray-600 mt-2">{selectedExercise.description}</p>

<WorkoutSteps id={selectedExercise} />
            {/* <video
              src={selectedExercise.video_link}
              controls
              className="mt-4 rounded-lg w-full aspect-video"
            /> */}

            <button
              onClick={handleCloseVideo}
              className="absolute top-3 right-3 text-gray-600 hover:text-red-600 text-xl"
            >
              ✕
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default WorkoutStart;
