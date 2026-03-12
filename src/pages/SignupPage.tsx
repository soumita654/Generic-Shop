import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Layout } from "@/components/layout/Layout";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function SignupPage() {
  const { signUp, signInWithGoogle } = useAuth();
  const navigate = useNavigate();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (password.length < 6) { setError("Password must be at least 6 characters"); return; }
    setLoading(true);
    const { error } = await signUp(email, password, fullName);
    setLoading(false);
    if (error) setError(error.message);
    else navigate("/");
  };

  const handleGoogleSignIn = async () => {
    setError("");
    setGoogleLoading(true);
    const { error } = await signInWithGoogle();
    if (error) {
      setError(error.message);
      setGoogleLoading(false);
    }
  };

  return (
    <Layout>
      <div className="container py-16 max-w-md mx-auto animate-fade-in">
        <div className="section-shell p-6 md:p-8">
        <h1 className="font-heading text-2xl font-bold text-center mb-6">Create Account</h1>
        <Button type="button" variant="outline" className="w-full mb-4" onClick={handleGoogleSignIn} disabled={googleLoading || loading}>
          {googleLoading ? (
            "Redirecting to Google..."
          ) : (
            <span className="inline-flex items-center gap-2">
              <svg aria-hidden="true" viewBox="0 0 24 24" className="h-4 w-4" role="img">
                <path
                  fill="#EA4335"
                  d="M12 10.2v3.9h5.5c-.2 1.2-1.4 3.5-5.5 3.5-3.3 0-6-2.7-6-6s2.7-6 6-6c1.9 0 3.1.8 3.8 1.5l2.6-2.5C16.8 3 14.6 2 12 2a10 10 0 1 0 0 20c5.8 0 9.7-4.1 9.7-9.9 0-.7-.1-1.3-.2-1.9H12z"
                />
                <path
                  fill="#34A853"
                  d="M3.8 7.4l3.2 2.3C7.8 8.1 9.7 6.6 12 6.6c1.9 0 3.1.8 3.8 1.5l2.6-2.5C16.8 3 14.6 2 12 2 8.2 2 5 4.2 3.8 7.4z"
                />
                <path
                  fill="#FBBC05"
                  d="M12 22c2.6 0 4.8-.9 6.4-2.4l-3-2.4c-.8.6-1.9 1-3.4 1-2.5 0-4.5-1.7-5.2-3.9l-3.2 2.5C4.9 19.8 8.2 22 12 22z"
                />
                <path
                  fill="#4285F4"
                  d="M21.7 12.1c0-.7-.1-1.3-.2-1.9H12v3.9h5.5c-.3 1.4-1.1 2.5-2.1 3.1l3 2.4c1.7-1.6 3.3-4 3.3-7.5z"
                />
              </svg>
              Continue with Google
            </span>
          )}
        </Button>
        <div className="relative mb-4">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-background px-2 text-muted-foreground">or sign up with email</span>
          </div>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label>Full Name</Label>
            <Input value={fullName} onChange={(e) => setFullName(e.target.value)} required />
          </div>
          <div>
            <Label>Email</Label>
            <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
          </div>
          <div>
            <Label>Password</Label>
            <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
          </div>
          {error && <p className="text-sm text-destructive">{error}</p>}
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "Creating account..." : "Sign Up"}
          </Button>
        </form>
        <p className="text-sm text-center mt-4 text-muted-foreground">
          Already have an account?{" "}
          <Link to="/login" className="text-primary font-medium hover:underline">Login</Link>
        </p>
        </div>
      </div>
    </Layout>
  );
}
