
import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";

const TrialBanner = () => {
  const [trialInfo, setTrialInfo] = useState<{
    isActive: boolean;
    daysLeft: number;
    planTier: string;
  } | null>(null);
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (user) {
      fetchTrialInfo();
    }
  }, [user]);

  const fetchTrialInfo = async () => {
    try {
      const { data: userData, error } = await supabase
        .from("users")
        .select("is_trial, trial_end_date, subscription_tier")
        .eq("id", user?.id)
        .single();

      if (error || !userData) return;

      // Check if user is on trial
      if (userData.is_trial && userData.trial_end_date) {
        const endDate = new Date(userData.trial_end_date);
        const now = new Date();
        const diffTime = endDate.getTime() - now.getTime();
        const daysLeft = Math.max(0, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));

        setTrialInfo({
          isActive: daysLeft > 0,
          daysLeft,
          planTier: userData.subscription_tier || "Weekly Plan Features",
        });
      }
    } catch (error) {
      console.error("Error fetching trial info:", error);
    }
  };

  if (!trialInfo?.isActive) return null;

  return (
    <Card className="bg-gradient-to-r from-green-500 to-blue-500 text-white border-none">
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Badge variant="secondary" className="bg-white text-green-600">
              7-Day Trial
            </Badge>
            <div>
              <h3 className="font-semibold">
                {trialInfo.daysLeft} days left in your free trial
              </h3>
              <p className="text-sm opacity-90">
                Enjoying {trialInfo.planTier}? Upgrade to continue after trial ends.
              </p>
            </div>
          </div>
          <Button
            variant="secondary"
            className="bg-white text-green-600 hover:bg-gray-100"
            onClick={() => navigate("/pricing")}
          >
            Upgrade Now
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default TrialBanner;
