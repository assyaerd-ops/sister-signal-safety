import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Heart, ArrowRight, ArrowLeft, Upload, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";

const steps = ["Profile", "Verification", "Done"];

const Onboarding = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);

  // Profile fields
  const [firstName, setFirstName] = useState("");
  const [phone, setPhone] = useState("");
  const [city, setCity] = useState("");

  // Verification files
  const [idFile, setIdFile] = useState<File | null>(null);
  const [selfieFile, setSelfieFile] = useState<File | null>(null);

  const handleProfileSubmit = async () => {
    if (!firstName.trim()) {
      toast.error("First name is required");
      return;
    }
    setLoading(true);
    const { error } = await supabase
      .from("profiles")
      .update({
        first_name: firstName.trim(),
        phone: phone.trim() || null,
        city: city.trim() || null,
      })
      .eq("id", user!.id);
    setLoading(false);
    if (error) {
      toast.error("Failed to update profile");
    } else {
      setStep(1);
    }
  };

  const uploadFile = async (file: File, folder: string) => {
    const ext = file.name.split(".").pop();
    const path = `${user!.id}/${folder}.${ext}`;
    const { error } = await supabase.storage
      .from("verification-docs")
      .upload(path, file, { upsert: true });
    if (error) throw error;
    const { data } = supabase.storage
      .from("verification-docs")
      .getPublicUrl(path);
    return data.publicUrl;
  };

  const handleVerificationSubmit = async () => {
    if (!idFile || !selfieFile) {
      toast.error("Please upload both your ID and a selfie");
      return;
    }
    setLoading(true);
    try {
      const [idUrl, selfieUrl] = await Promise.all([
        uploadFile(idFile, "id-doc"),
        uploadFile(selfieFile, "selfie"),
      ]);
      await supabase
        .from("profiles")
        .update({
          id_doc_url: idUrl,
          selfie_url: selfieUrl,
          verification_status: "pending" as const,
        })
        .eq("id", user!.id);
      setStep(2);
    } catch {
      toast.error("Upload failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4 py-12">
      <div className="w-full max-w-lg space-y-8">
        {/* Header */}
        <div className="text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-primary/10">
            <Heart className="h-7 w-7 text-primary" fill="currentColor" />
          </div>
          <h1 className="font-display text-3xl font-bold text-foreground">Set Up Your Profile</h1>
        </div>

        {/* Step indicators */}
        <div className="flex items-center justify-center gap-2">
          {steps.map((s, i) => (
            <div key={s} className="flex items-center gap-2">
              <div
                className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-semibold transition-colors ${
                  i <= step
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground"
                }`}
              >
                {i < step ? <CheckCircle2 className="h-4 w-4" /> : i + 1}
              </div>
              {i < steps.length - 1 && (
                <div className={`h-0.5 w-8 transition-colors ${i < step ? "bg-primary" : "bg-muted"}`} />
              )}
            </div>
          ))}
        </div>

        {/* Steps */}
        <AnimatePresence mode="wait">
          {step === 0 && (
            <motion.div
              key="profile"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-4"
            >
              <div>
                <Label htmlFor="firstName">First Name *</Label>
                <Input id="firstName" value={firstName} onChange={(e) => setFirstName(e.target.value)} placeholder="How sisters will see you" />
              </div>
              <div>
                <Label htmlFor="phone">Phone Number (optional)</Label>
                <Input id="phone" type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+1 (555) 000-0000" />
              </div>
              <div>
                <Label htmlFor="city">City (optional)</Label>
                <Input id="city" value={city} onChange={(e) => setCity(e.target.value)} placeholder="Your city" />
              </div>
              <Button onClick={handleProfileSubmit} className="w-full" disabled={loading}>
                {loading ? "Saving…" : "Continue"}
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </motion.div>
          )}

          {step === 1 && (
            <motion.div
              key="verification"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-6"
            >
              <p className="text-sm text-muted-foreground text-center">
                Upload a photo of your government-issued ID and a selfie. This helps us keep the community safe and verified.
              </p>

              <div className="space-y-2">
                <Label>Government ID</Label>
                <label className="flex cursor-pointer items-center justify-center gap-3 rounded-xl border-2 border-dashed border-border p-6 transition-colors hover:border-primary/40 hover:bg-secondary/50">
                  <Upload className="h-5 w-5 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">
                    {idFile ? idFile.name : "Click to upload ID"}
                  </span>
                  <input type="file" className="hidden" accept="image/*,.pdf" onChange={(e) => setIdFile(e.target.files?.[0] || null)} />
                </label>
              </div>

              <div className="space-y-2">
                <Label>Selfie</Label>
                <label className="flex cursor-pointer items-center justify-center gap-3 rounded-xl border-2 border-dashed border-border p-6 transition-colors hover:border-primary/40 hover:bg-secondary/50">
                  <Upload className="h-5 w-5 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">
                    {selfieFile ? selfieFile.name : "Click to upload selfie"}
                  </span>
                  <input type="file" className="hidden" accept="image/*" onChange={(e) => setSelfieFile(e.target.files?.[0] || null)} />
                </label>
              </div>

              <div className="flex gap-3">
                <Button variant="outline" onClick={() => setStep(0)} className="flex-1">
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Back
                </Button>
                <Button onClick={handleVerificationSubmit} className="flex-1" disabled={loading}>
                  {loading ? "Uploading…" : "Submit for Review"}
                </Button>
              </div>

              <button onClick={() => setStep(2)} className="block w-full text-center text-xs text-muted-foreground hover:underline">
                Skip for now — you can verify later
              </button>
            </motion.div>
          )}

          {step === 2 && (
            <motion.div
              key="done"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="space-y-6 text-center"
            >
              <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-sister-sage/20">
                <CheckCircle2 className="h-10 w-10 text-sister-sage" />
              </div>
              <h2 className="font-display text-2xl font-bold text-foreground">You're All Set!</h2>
              <p className="text-muted-foreground">
                Your profile is ready. Once verified, you'll be able to request help and respond to sisters in need.
              </p>
              <Button onClick={() => navigate("/home")} className="w-full" size="lg">
                Go to Home
              </Button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default Onboarding;
