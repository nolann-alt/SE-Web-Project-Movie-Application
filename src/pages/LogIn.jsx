import { useState } from "react";
import { useNavigate } from "react-router";
import AuthForm from "../components/AuthForm";
import { loginUser } from "../services/auth";

export default function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  function handleSubmit(event) {
    event.preventDefault();
    const result = loginUser(email, password);

    if (!result.success) {
      setError(result.error);
      return;
    }

    navigate("/");
  }

  return (
    <AuthForm
      isLogin
      email={email}
      password={password}
      error={error}
      onEmailChange={setEmail}
      onPasswordChange={setPassword}
      onSubmit={handleSubmit}
    />
  );
}