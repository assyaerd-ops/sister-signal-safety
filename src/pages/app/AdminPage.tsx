import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import AppLayout from "@/components/AppLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CheckCircle2, XCircle, Shield, AlertTriangle, Loader2 } from "lucide-react";
import { toast } from "sonner";
import type { Database } from "@/integrations/supabase/types";

type VerificationStatus = Database["public"]["Enums"]["verification_status"];

const AdminPage = () => {
  const { user } = useAuth();
  const qc = useQueryClient();

  // Check admin role
  const { data: isAdmin, isLoading: roleLoading } = useQuery({
    queryKey: ["is-admin", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user!.id)
        .eq("role", "admin");
      if (error) throw error;
      return data.length > 0;
    },
    enabled: !!user,
  });

  // Pending verifications
  const { data: pendingProfiles } = useQuery({
    queryKey: ["pending-verifications"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("verification_status", "pending")
        .not("id_doc_url", "is", null)
        .order("created_at", { ascending: true });
      if (error) throw error;
      return data;
    },
    enabled: !!isAdmin,
  });

  // Reports
  const { data: reports } = useQuery({
    queryKey: ["admin-reports"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("reports")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(50);
      if (error) throw error;
      return data;
    },
    enabled: !!isAdmin,
  });

  const updateVerification = useMutation({
    mutationFn: async ({ profileId, status }: { profileId: string; status: VerificationStatus }) => {
      const { error } = await supabase
        .from("profiles")
        .update({ verification_status: status })
        .eq("id", profileId);
      if (error) throw error;
    },
    onSuccess: (_, vars) => {
      toast.success(`User ${vars.status === "verified" ? "approved" : "rejected"}`);
      qc.invalidateQueries({ queryKey: ["pending-verifications"] });
    },
    onError: () => toast.error("Failed to update verification"),
  });

  if (roleLoading) {
    return (
      <AppLayout>
        <div className="flex justify-center py-20">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        </div>
      </AppLayout>
    );
  }

  if (!isAdmin) {
    return (
      <AppLayout>
        <div className="container mx-auto px-4 py-16 text-center">
          <Shield className="mx-auto h-12 w-12 text-muted-foreground/30" />
          <p className="mt-4 text-muted-foreground">You don't have admin access.</p>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="container mx-auto px-4 py-6 space-y-6">
        <h1 className="font-display text-2xl font-bold text-foreground">Admin Panel</h1>

        <Tabs defaultValue="verifications">
          <TabsList>
            <TabsTrigger value="verifications">
              Verifications
              {pendingProfiles && pendingProfiles.length > 0 && (
                <Badge className="ml-2 h-5 w-5 rounded-full p-0 text-xs">{pendingProfiles.length}</Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="reports">Reports</TabsTrigger>
          </TabsList>

          <TabsContent value="verifications" className="mt-4 space-y-3">
            {pendingProfiles && pendingProfiles.length > 0 ? (
              pendingProfiles.map((p) => (
                <Card key={p.id}>
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="space-y-1">
                        <p className="font-medium text-foreground">{p.first_name}</p>
                        <p className="text-xs text-muted-foreground">
                          {p.city || "No city"} · Joined {new Date(p.created_at).toLocaleDateString()}
                        </p>
                        <div className="flex gap-2 mt-2">
                          {p.id_doc_url && (
                            <a href={p.id_doc_url} target="_blank" rel="noopener noreferrer" className="text-xs text-primary underline">
                              View ID
                            </a>
                          )}
                          {p.selfie_url && (
                            <a href={p.selfie_url} target="_blank" rel="noopener noreferrer" className="text-xs text-primary underline">
                              View Selfie
                            </a>
                          )}
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          onClick={() => updateVerification.mutate({ profileId: p.id, status: "verified" })}
                          disabled={updateVerification.isPending}
                        >
                          <CheckCircle2 className="mr-1 h-3 w-3" /> Approve
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => updateVerification.mutate({ profileId: p.id, status: "rejected" })}
                          disabled={updateVerification.isPending}
                        >
                          <XCircle className="mr-1 h-3 w-3" /> Reject
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            ) : (
              <div className="py-12 text-center text-muted-foreground">
                <CheckCircle2 className="mx-auto h-10 w-10 text-sister-sage/40" />
                <p className="mt-3">No pending verifications</p>
              </div>
            )}
          </TabsContent>

          <TabsContent value="reports" className="mt-4 space-y-3">
            {reports && reports.length > 0 ? (
              reports.map((r) => (
                <Card key={r.id}>
                  <CardContent className="p-4 space-y-1">
                    <div className="flex items-center gap-2">
                      <AlertTriangle className="h-4 w-4 text-accent" />
                      <p className="font-medium text-foreground">{r.reason}</p>
                    </div>
                    {r.details && <p className="text-sm text-muted-foreground">{r.details}</p>}
                    <p className="text-xs text-muted-foreground">
                      {new Date(r.created_at).toLocaleString()}
                    </p>
                  </CardContent>
                </Card>
              ))
            ) : (
              <div className="py-12 text-center text-muted-foreground">No reports yet.</div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
};

export default AdminPage;
