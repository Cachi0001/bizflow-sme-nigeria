import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Clock, Crown } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface TrialInfo {
  is_trial: boolean;
  trial_end_date: string | null;
  days_left: number;
  subscription_tier: string;
}

const TrialBanner = () => {
  const [trialInfo, setTrialInfo] = useState<TrialInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (user) {
      fetchTrialInfo();
    }
  }, [user]);

  const fetchTrialInfo = async () => {
    try {
      setLoading(true);
      
      // Call the ensure-user-setup function which handles all the data setup
      const { data, error } = await supabase.functions.invoke('ensure-user-setup');
      
      if (error) {
        console.error('Error fetching trial info:', error);
        return;
      }
      
      if (data?.trial_info) {
        setTrialInfo(data.trial_info);
      }
      
    } catch (error) {
      console.error('Error fetching trial info:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Card className="bg-gradient-to-r from-green-50 to-blue-50 border-green-200">
        <CardContent className="p-4">
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-green-600"></div>
            <span className="ml-2 text-sm text-gray-600">Loading trial information...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!trialInfo?.is_trial) {
    return null; // Don't show banner if not on trial
  }

  const isExpiringSoon = trialInfo.days_left <= 2;

  return (
    <Card className={`border-2 ${isExpiringSoon ? 'bg-gradient-to-r from-orange-50 to-red-50 border-orange-200' : 'bg-gradient-to-r from-green-50 to-blue-50 border-green-200'}`}>
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className={`p-2 rounded-full ${isExpiringSoon ? 'bg-orange-100' : 'bg-green-100'}`}>
              {isExpiringSoon ? (
                <Clock className={`h-5 w-5 ${isExpiringSoon ? 'text-orange-600' : 'text-green-600'}`} />
              ) : (
                <Crown className="h-5 w-5 text-green-600" />
              )}
            </div>
            <div>
              <h3 className={`font-semibold ${isExpiringSoon ? 'text-orange-800' : 'text-green-800'}`}>
                {isExpiringSoon ? 'Trial Ending Soon!' : '7-Day Free Trial Active'}
              </h3>
              <p className={`text-sm ${isExpiringSoon ? 'text-orange-600' : 'text-green-600'}`}>
                {trialInfo.days_left > 0 
                  ? `${trialInfo.days_left} day${trialInfo.days_left === 1 ? '' : 's'} remaining on your ${trialInfo.subscription_tier} plan trial`
                  : 'Your trial has expired'
                }
              </p>
            </div>
          </div>
          <div className="flex space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate('/pricing')}
              className={`${isExpiringSoon ? 'border-orange-300 text-orange-700 hover:bg-orange-50' : 'border-green-300 text-green-700 hover:bg-green-50'}`}
            >
              View Plans
            </Button>
            <Button
              size="sm"
              onClick={() => navigate('/pricing')}
              className={`${isExpiringSoon ? 'bg-orange-600 hover:bg-orange-700' : 'bg-green-600 hover:bg-green-700'} text-white`}
            >
              Upgrade Now
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default TrialBanner;

