import { useState } from "react";
import { useNavigate } from "react-router";
import AuthForm from "../components/AuthForm";
import { registerUser } from "../services/auth";

export default function Register() {
  const navigate = useNavigate();
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
    const result = await registerUser(email, password);
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
      password={password}
      error={error}
      message={message}
      isSubmitting={isSubmitting}
      onEmailChange={setEmail}
      onPasswordChange={setPassword}
      onSubmit={handleSubmit}
    />
  );
}
