import React, { useEffect, useState } from "react";
import styled from "styled-components";
import { counts } from "../utils/data";
import CountsCard from "../components/cards/CountsCard";
import WeeklyStatCard from "../components/cards/WeeklyStatCard";
import CategoryChart from "../components/cards/CategoryChart";
import AddWorkout from "../components/AddWorkout";
import WorkoutCard from "../components/cards/WorkoutCard";
import { addWorkout, getDashboardDetails, getWorkouts } from "../api";
import plans from "../../public/plans.json";

const Container = styled.div`
  flex: 1;
  height: 100%;
  display: flex;
  justify-content: center;
  padding: 22px 0px;
  overflow-y: scroll;
`;
const Wrapper = styled.div`
  flex: 1;
  max-width: 1400px;
  display: flex;
  flex-direction: column;
  gap: 22px;
  @media (max-width: 600px) {
    gap: 12px;
  }
`;
const Title = styled.div`
  padding: 0px 16px;
  font-size: 22px;
  color: ${({ theme }) => theme.text_primary};
  font-weight: 500;
`;
const FlexWrap = styled.div`
  display: flex;
  flex-wrap: wrap;
  justify-content: space-between;
  gap: 22px;
  padding: 0px 16px;
  @media (max-width: 600px) {
    gap: 12px;
  }
`;
const Section = styled.div`
  display: flex;
  flex-direction: column;
  padding: 0px 16px;
  gap: 22px;
  padding: 0px 16px;
  @media (max-width: 600px) {
    gap: 12px;
  }
`;
const CardWrapper = styled.div`
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 20px;
  margin-bottom: 100px;
  @media (max-width: 600px) {
    gap: 12px;
  }
`;

const Dashboard = () => {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState();
  const [buttonLoading, setButtonLoading] = useState(false);
  const [todaysWorkouts, setTodaysWorkouts] = useState([]);
  const [workout, setWorkout] = useState(`#Legs
-Back Squat
-5 setsX15 reps
-30 kg
-10 min`);

  const dashboardData = async () => {
    setLoading(true);
    const token = localStorage.getItem("fittrack-app-token");
    await getDashboardDetails(token).then((res) => {
      setData(res.data);
      console.log(res.data);
      setLoading(false);
    });
  };
  const getTodaysWorkout = async () => {
    setLoading(true);
    const token = localStorage.getItem("fittrack-app-token");
    await getWorkouts(token, "").then((res) => {
      console.log("HI", res)
      setTodaysWorkouts(res?.data?.todaysWorkouts);
      console.log(res.data);
      setLoading(false);
    });
  };

  const addNewWorkout = async () => {
    setButtonLoading(true);
    const token = localStorage.getItem("fittrack-app-token");
    await addWorkout(token, { workoutString: workout })
      .then((res) => {
        dashboardData();
        getTodaysWorkout();
        setButtonLoading(false);
      })
      .catch((err) => {
        alert(err);
      });
  };

  useEffect(() => {
    dashboardData();
    getTodaysWorkout();
  }, []);
  return (
    <Container>
      <Wrapper>
        <Title>Dashboard</Title>
        <FlexWrap>
          {counts.map((item, index) => (
            <CountsCard key={index} item={item} data={data} />
          ))}
        </FlexWrap>

        <FlexWrap className="bg-primary/50">
          <WeeklyStatCard data={data} />
          <CategoryChart data={data} />
          <AddWorkout
            workout={workout}
            setWorkout={setWorkout}
            addNewWorkout={addNewWorkout}
            buttonLoading={buttonLoading}
          />
        </FlexWrap>

        <Title>Todays Workouts</Title>
        <Section className=" ">
        <div className="flex mx-16 flex-wrap gap-28 justify-center items-center">
         
          <div>
             <a
            href="/workout"
            className="flex items-center self-end justify-center cursor-pointer w-[18rem] h-[24rem] transition-all ease-in-out hover:scale-105 bg-gray-200 rounded shadow-md bg-cover bg-center"
            style={{
              backgroundImage:
                "url('https://images.unsplash.com/photo-1581009146145-b5ef050c2e1e?q=80&w=2070&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D')",
            }}
          >
          Bulk
          </a>
          </div>
          <div>
             <a
            href="/workout"
            className="flex items-center self-end justify-center cursor-pointer w-[18rem] h-[24rem] transition-all ease-in-out hover:scale-105 bg-gray-200 rounded shadow-md bg-cover bg-center"
            style={{
              backgroundImage:
                "url('https://images.unsplash.com/photo-1581009146145-b5ef050c2e1e?q=80&w=2070&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D')",
            }}
          >
          strength
          </a>
          </div>
          <div>
             <a
            href="/workout"
            className="flex items-center self-end justify-center cursor-pointer w-[18rem] h-[24rem] transition-all ease-in-out hover:scale-105 bg-gray-200 rounded shadow-md bg-cover bg-center"
            style={{
              backgroundImage:
                "url('https://images.unsplash.com/photo-1581009146145-b5ef050c2e1e?q=80&w=2070&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D')",
            }}
          >
          cardio
          </a>
          </div>
          <div>
             <a
            href="/workout"
            className="flex items-center self-end justify-center cursor-pointer w-[18rem] h-[24rem] transition-all ease-in-out hover:scale-105 bg-gray-200 rounded shadow-md bg-cover bg-center"
            style={{
              backgroundImage:
                "url('https://images.unsplash.com/photo-1581009146145-b5ef050c2e1e?q=80&w=2070&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D')",
            }}
          >
          cardio
          </a>
          </div>
          <div>
             <a
            href="/workout"
            className="flex items-center self-end justify-center cursor-pointer w-[18rem] h-[24rem] transition-all ease-in-out hover:scale-105 bg-gray-200 rounded shadow-md bg-cover bg-center"
            style={{
              backgroundImage:
                "url('https://images.unsplash.com/photo-1581009146145-b5ef050c2e1e?q=80&w=2070&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D')",
            }}
          >
          Muscle Endurance
          </a>
          </div>
          <div>
             <a
            href="/workout"
            className="flex items-center self-end justify-center cursor-pointer w-[18rem] h-[24rem] transition-all ease-in-out hover:scale-105 bg-gray-200 rounded shadow-md bg-cover bg-center"
            style={{
              backgroundImage:
                "url('https://images.unsplash.com/photo-1581009146145-b5ef050c2e1e?q=80&w=2070&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D')",
            }}
          >
          Maintenance
          </a>
          </div>
          </div>

        </Section>
      </Wrapper>
    </Container>
  );
};

export default Dashboard;