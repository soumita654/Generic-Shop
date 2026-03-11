import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Layout } from "@/components/layout/Layout";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

export default function ProfilePage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!user) { navigate("/login"); return; }
    supabase
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .single()
      .then(({ data }) => {
        if (data) {
          setFullName(data.full_name ?? "");
          setPhone(data.phone ?? "");
        }
      });
  }, [user, navigate]);

  const handleSave = async () => {
    if (!user) return;
    setLoading(true);
    const { error } = await supabase
      .from("profiles")
      .update({ full_name: fullName, phone, updated_at: new Date().toISOString() })
      .eq("id", user.id);
    setLoading(false);
    if (error) toast.error("Failed to update profile");
    else toast.success("Profile updated!");
  };

  return (
    <Layout>
      <div className="container py-8 max-w-md mx-auto animate-fade-in">
        <h1 className="font-heading text-2xl font-bold mb-6">My Profile</h1>
        <div className="space-y-4">
          <div>
            <Label>Email</Label>
            <Input value={user?.email ?? ""} disabled className="bg-muted" />
          </div>
          <div>
            <Label>Full Name</Label>
            <Input value={fullName} onChange={(e) => setFullName(e.target.value)} />
          </div>
          <div>
            <Label>Phone</Label>
            <Input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+91 98765 43210" />
          </div>
          <Button onClick={handleSave} disabled={loading} className="w-full">
            {loading ? "Saving..." : "Save Changes"}
          </Button>
        </div>
      </div>
    </Layout>
  );
}
