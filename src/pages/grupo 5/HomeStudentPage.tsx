import type React from "react";
import LayoutAplication from "@/layouts/LayoutAplication";
import Review from "@/components/grupo 5/Review";
import Scoreboard from "@/components/grupo 5/Scoreboard";

const HomeStudentPage: React.FC = () => {
  return (
    <LayoutAplication breadcrumbs={[]}>
        <div className="flex flex-col gap-4">
            <Review />
            <Scoreboard />
        </div>
    </LayoutAplication>
  );
};

export default HomeStudentPage;
