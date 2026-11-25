import { useState } from "react";
import { useNavigate } from "react-router";
import AuthForm from "../components/AuthForm";
import { registerUser } from "../services/auth";

export default function Register() {
  const navigate = useNavigate();
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");
    setMessage("");
    setIsSubmitting(true);
    const result = await registerUser(email, password, username);
    setIsSubmitting(false);

    if (!result.success) {
      setError(result.error);
      return;
    }

    if (result.needsEmailConfirmation) {
      setMessage("Check your email to confirm your account, then log in.");
      return;
    }

    navigate("/");
  }

  return (
    <AuthForm
      email={email}
      username={username}
      password={password}
      error={error}
      message={message}
      isSubmitting={isSubmitting}
      onEmailChange={setEmail}
      onUsernameChange={setUsername}
      onPasswordChange={setPassword}
      onSubmit={handleSubmit}
    />
  );
}
