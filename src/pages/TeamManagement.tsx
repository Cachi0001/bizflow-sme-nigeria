
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { 
  Users, 
  UserPlus, 
  UserCheck, 
  UserX, 
  ArrowLeft,
  Trash2
} from "lucide-react";
import { useNavigate } from "react-router-dom";

interface TeamMember {
  id: string;
  name: string;
  email: string;
  is_active: boolean;
  created_at: string;
  salesperson_id: string;
}

const TeamManagement = () => {
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [addingMember, setAddingMember] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: ""
  });
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    if (user) {
      loadTeamMembers();
    }
  }, [user]);

  const loadTeamMembers = async () => {
    try {
      const { data, error } = await supabase
        .from('team_members')
        .select('*')
        .eq('owner_id', user?.id);

      if (error) throw error;
      setTeamMembers(data || []);
    } catch (error) {
      console.error('Error loading team members:', error);
      toast({
        title: "Error loading team members",
        description: "Please try again later.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const addTeamMember = async (e: React.FormEvent) => {
    e.preventDefault();
    setAddingMember(true);

    try {
      // First create the salesperson user account
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          data: {
            role: 'Salesperson',
            business_name: formData.name
          }
        }
      });

      if (authError) throw authError;

      if (authData.user) {
        // Add to team_members table
        const { error: teamError } = await supabase
          .from('team_members')
          .insert({
            owner_id: user?.id,
            salesperson_id: authData.user.id,
            name: formData.name,
            email: formData.email,
            is_active: true
          });

        if (teamError) throw teamError;

        toast({
          title: "Team member added successfully!",
          description: `${formData.name} has been added to your team.`
        });

        setFormData({ name: "", email: "", password: "" });
        loadTeamMembers();
      }
    } catch (error: any) {
      console.error('Error adding team member:', error);
      toast({
        title: "Error adding team member",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setAddingMember(false);
    }
  };

  const toggleMemberStatus = async (memberId: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from('team_members')
        .update({ is_active: !currentStatus })
        .eq('id', memberId);

      if (error) throw error;

      toast({
        title: `Team member ${!currentStatus ? 'activated' : 'deactivated'}`,
        description: "Changes have been saved."
      });

      loadTeamMembers();
    } catch (error) {
      console.error('Error updating team member status:', error);
      toast({
        title: "Error updating status",
        description: "Please try again.",
        variant: "destructive"
      });
    }
  };

  const removeMember = async (memberId: string, memberName: string) => {
    if (!confirm(`Are you sure you want to remove ${memberName} from your team? This action cannot be undone.`)) {
      return;
    }

    try {
      const { error } = await supabase
        .from('team_members')
        .delete()
        .eq('id', memberId);

      if (error) throw error;

      toast({
        title: "Team member removed",
        description: `${memberName} has been removed from your team.`
      });

      loadTeamMembers();
    } catch (error) {
      console.error('Error removing team member:', error);
      toast({
        title: "Error removing team member",
        description: "Please try again.",
        variant: "destructive"
      });
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-blue-50">
      {/* Header */}
      <header className="bg-white border-b px-4 py-3">
        <div className="flex items-center justify-between max-w-7xl mx-auto">
          <div className="flex items-center space-x-4">
            <Button variant="ghost" onClick={() => navigate('/dashboard')}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Dashboard
            </Button>
            <div className="flex items-center space-x-2">
              <Users className="h-6 w-6 text-green-600" />
              <h1 className="text-xl font-bold text-gray-900">Team Management</h1>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto p-4 space-y-6">
        {/* Add Team Member Form */}
        <Card className="bg-gradient-to-br from-green-50 to-blue-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <UserPlus className="h-5 w-5" />
              Add New Salesperson
            </CardTitle>
            <CardDescription>
              Add team members who can create invoices and expenses on your behalf
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={addTeamMember} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="name">Full Name</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    placeholder="John Doe"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="email">Email Address</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({...formData, email: e.target.value})}
                    placeholder="john@example.com"
                    required
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="password">Temporary Password</Label>
                <Input
                  id="password"
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData({...formData, password: e.target.value})}
                  placeholder="Minimum 6 characters"
                  minLength={6}
                  required
                />
                <p className="text-xs text-gray-500 mt-1">
                  They can change this password after first login
                </p>
              </div>
              <Button 
                type="submit" 
                disabled={addingMember}
                className="bg-gradient-to-r from-green-600 to-blue-500 hover:from-green-700 hover:to-blue-600"
              >
                {addingMember ? "Adding..." : "Add Team Member"}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Team Members List */}
        <Card className="bg-gradient-to-br from-green-50 to-blue-50">
          <CardHeader>
            <CardTitle>Your Team ({teamMembers.length})</CardTitle>
            <CardDescription>
              Manage your salespeople and their access permissions
            </CardDescription>
          </CardHeader>
          <CardContent>
            {teamMembers.length === 0 ? (
              <div className="text-center py-8">
                <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">No team members yet. Add your first salesperson above.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {teamMembers.map((member) => (
                  <div key={member.id} className="flex items-center justify-between p-4 bg-white rounded-lg border">
                    <div className="flex items-center space-x-4">
                      <div className={`p-2 rounded-full ${member.is_active ? 'bg-green-100' : 'bg-gray-100'}`}>
                        {member.is_active ? (
                          <UserCheck className="h-4 w-4 text-green-600" />
                        ) : (
                          <UserX className="h-4 w-4 text-gray-400" />
                        )}
                      </div>
                      <div>
                        <h3 className="font-medium">{member.name}</h3>
                        <p className="text-sm text-gray-500">{member.email}</p>
                        <p className="text-xs text-gray-400">
                          Added {new Date(member.created_at).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Badge variant={member.is_active ? "default" : "secondary"}>
                        {member.is_active ? "Active" : "Inactive"}
                      </Badge>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => toggleMemberStatus(member.id, member.is_active)}
                      >
                        {member.is_active ? "Deactivate" : "Activate"}
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => removeMember(member.id, member.name)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Permissions Info */}
        <Card className="bg-gradient-to-br from-green-50 to-blue-50">
          <CardHeader>
            <CardTitle>Salesperson Permissions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <h4 className="font-medium text-green-600">✅ Can Do:</h4>
                <ul className="text-sm space-y-1 text-gray-600">
                  <li>• Create new invoices</li>
                  <li>• Create new expenses</li>
                  <li>• View all invoices and expenses</li>
                  <li>• Edit invoices and expenses</li>
                  <li>• Manage clients</li>
                </ul>
              </div>
              <div className="space-y-2">
                <h4 className="font-medium text-red-600">❌ Cannot Do:</h4>
                <ul className="text-sm space-y-1 text-gray-600">
                  <li>• Delete invoices or expenses</li>
                  <li>• View financial reports</li>
                  <li>• Manage team members</li>
                  <li>• Change subscription plans</li>
                  <li>• Access referral system</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default TeamManagement;
