import { useState } from "react";
import { useNavigate } from "react-router";
import AuthForm from "../components/AuthForm";
import { registerUser } from "../services/auth";

export default function Register() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  function handleSubmit(event) {
    event.preventDefault();
    const result = registerUser(email, password);

    if (!result.success) {
      setError(result.error);
      return;
    }

    navigate("/");
  }

  return (
    <AuthForm
      email={email}
      password={password}
      error={error}
      onEmailChange={setEmail}
      onPasswordChange={setPassword}
      onSubmit={handleSubmit}
    />
  );
}
