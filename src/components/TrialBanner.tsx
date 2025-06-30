import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Clock, Gift, Zap } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";

interface TrialInfo {
  is_trial: boolean;
  trial_end_date: string | null;
  subscription_tier: string;
}

const TrialBanner = () => {
  const [trialInfo, setTrialInfo] = useState<TrialInfo | null>(null);
  const [daysLeft, setDaysLeft] = useState<number>(0);
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (user) {
      fetchTrialInfo();
    }
  }, [user]);

  const fetchTrialInfo = async () => {
    if (!user) return;

    try {
      // First, check if the user exists in the users table
      const { data, error } = await supabase
        .from('users')
        .select('is_trial, trial_end_date, subscription_tier')
        .eq('id', user.id);

      if (error) {
        console.error('Error fetching trial info:', error);
        return;
      }

      // If no user data found, call fix-user-data function to set up the user
      if (!data || data.length === 0) {
        console.log('No user data found, attempting to fix user data...');
        
        try {
          const { data: fixResult, error: fixError } = await supabase.functions.invoke('fix-user-data');
          
          if (fixError) {
            console.error('Error fixing user data:', fixError);
            return;
          }
          
          console.log('User data fixed successfully:', fixResult);
          
          // Retry fetching user data after fix
          const { data: retryData, error: retryError } = await supabase
            .from('users')
            .select('is_trial, trial_end_date, subscription_tier')
            .eq('id', user.id);
            
          if (retryError || !retryData || retryData.length === 0) {
            console.error('Still no user data after fix attempt');
            return;
          }
          
          const userData = retryData[0];
          setTrialInfo(userData);

          if (userData.is_trial && userData.trial_end_date) {
            const endDate = new Date(userData.trial_end_date);
            const now = new Date();
            const diffTime = endDate.getTime() - now.getTime();
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
            setDaysLeft(Math.max(0, diffDays));
          }
          
        } catch (fixError) {
          console.error('Error calling fix-user-data function:', fixError);
          return;
        }
      } else {
        const userData = data[0];
        setTrialInfo(userData);

        if (userData.is_trial && userData.trial_end_date) {
          const endDate = new Date(userData.trial_end_date);
          const now = new Date();
          const diffTime = endDate.getTime() - now.getTime();
          const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
          setDaysLeft(Math.max(0, diffDays));
        }
      }
    } catch (error) {
      console.error('Error fetching trial info:', error);
    }
  };

  if (!trialInfo || !trialInfo.is_trial || daysLeft <= 0) {
    return null;
  }

  return (
    <Card className="bg-gradient-to-r from-green-50 to-blue-50 border-green-200 mb-6">
      <div className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-100 rounded-full">
              <Gift className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <h3 className="font-semibold text-green-800">
                🎉 Your 7-Day Free Trial is Active!
              </h3>
              <div className="flex items-center gap-2 text-sm text-green-700">
                <Clock className="h-4 w-4" />
                <span>
                  {daysLeft === 1 
                    ? "Last day of your trial" 
                    : `${daysLeft} days remaining`
                  }
                </span>
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <div className="text-right">
              <div className="flex items-center gap-1 text-sm font-medium text-green-800">
                <Zap className="h-4 w-4" />
                <span>Weekly Plan Features Unlocked</span>
              </div>
              <p className="text-xs text-green-600">
                Enjoying unlimited invoices & advanced features
              </p>
            </div>
            
            <Button
              onClick={() => navigate('/pricing')}
              className="bg-gradient-to-r from-green-600 to-blue-500 hover:from-green-700 hover:to-blue-600 text-white"
              size="sm"
            >
              Upgrade Now
            </Button>
          </div>
        </div>
        
        {daysLeft <= 2 && (
          <div className="mt-3 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
            <p className="text-sm text-yellow-800">
              <strong>Trial ending soon!</strong> Upgrade to continue enjoying all features. 
              Don't lose access to your professional invoicing and advanced reporting.
            </p>
          </div>
        )}
      </div>
    </Card>
  );
};

export default TrialBanner;

