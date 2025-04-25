import {
  BrowserRouter,
  Routes as Switch,
  Route,
  Navigate,
} from "react-router-dom";
import { Dashboard } from "../pages/Dashboard";
import { ResetPassword } from "../pages/ResetPassword";
import { useAuthContext } from "../context/AuthContext";
import { Loading } from "../components/loading";
import LogIn from "../pages/Login";
import { Materias } from "../pages/Materias";
import { NRCS } from "../pages/NRC";
import { Jurados } from "../pages/Jurados";
import { Profesores } from "../pages/Profesores";
import { Estadisticas } from "../pages/Estadisticas";
import { Criterios } from "../pages/Criterios";

export const Routes = () => {
  const { user, loading, isInRecoveryFlow } = useAuthContext();

  if (loading) return <Loading />;

  return (
    <BrowserRouter>
      <Switch>
        {user && !isInRecoveryFlow ? (
          <>
            <Route path="/criterios" element={<Criterios />} />
            <Route path="/jurados" element={<Jurados />} />
            <Route path="/profesores" element={<Profesores />} />
            <Route path="/estadisticas" element={<Estadisticas />} />
            <Route path="/nrcs" element={<NRCS />} />
            <Route path="/materias" element={<Materias />} />
            <Route path="/" element={<Dashboard />} />
            <Route path="*" element={<Navigate to="/" />} />
          </>
        ) : (
          <>
            <Route path="/log-in" element={<LogIn />} />
            <Route path="/reset-password" element={<ResetPassword />} />
            <Route path="*" element={<Navigate to="/log-in" />} />
          </>
        )}
      </Switch>
    </BrowserRouter>
  );
};
