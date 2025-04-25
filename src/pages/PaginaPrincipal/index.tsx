import React from "react";
import { Button } from "../../components/ui/button";
import { useAuthContext } from "../../context/AuthContext";
import { Link } from "react-router-dom";

export const PaginaPrincipal: React.FC = () => {
  const { user } = useAuthContext();
  return (
    <div>
      {user ? (
        <Link to="/dashboard">
          {" "}
          <Button>hola</Button>{" "}
        </Link>
      ) : (
        <Link to="/log-in">
          <Button>Chao</Button>
        </Link>
      )}
    </div>
  );
};
