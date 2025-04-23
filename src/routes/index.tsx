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

export const Routes = () => {
  const { user, loading, isInRecoveryFlow } = useAuthContext();

  if (loading) return <Loading />;

  return (
    <BrowserRouter>
      <Switch>
        {user && !isInRecoveryFlow ? (
          <>
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
