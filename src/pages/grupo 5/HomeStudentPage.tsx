import type React from "react";
import Review from "@/components/grupo 5/Review";
import Scoreboard from "@/components/grupo 5/Scoreboard";

const HomeStudentPage: React.FC = () => {
  return (
    <div className="flex flex-col gap-4">
      <Review />
      <Scoreboard />
    </div>
  );
};

export default HomeStudentPage;
