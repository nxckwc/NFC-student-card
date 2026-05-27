import { useState, useTransition } from "react";

export function useLoginForm() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [isPending, startTransition] = useTransition();

  const isBusy = isSubmitting || isPending || isSuccess;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isBusy) return;

    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      // TODO: llamada a la API aquí
    } catch {
      setErrorMessage("Invalid username or password");
    } finally {
      setIsSubmitting(false);
    }
  };

  return {
    username, setUsername,
    password, setPassword,
    rememberMe, setRememberMe,
    showPassword, setShowPassword,
    errorMessage,
    isBusy,
    isSuccess,
    handleSubmit,
  };
}