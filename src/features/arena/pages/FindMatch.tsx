import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@features/auth/AuthContext';
import { useAdmin } from '@shared/context/AdminContext';
import { Button } from '@ui/button';
import { Input } from '@ui/form/input';
import { Card } from '@ui/data/card';
import { Badge } from '@ui/data/badge';
import LandingHeader from '@shared/components/LandingHeader';
import PremiumHeader from '@shared/components/PremiumHeader';
import UserHeader from '@shared/components/UserHeader';
import GuestHeader from '@shared/components/GuestHeader';
import LandingFooter from '@shared/components/LandingFooter';
import { Search, Trophy, LogIn, UserPlus, Crown, Shield, Copy } from 'lucide-react';
import { useToast } from '@shared/hooks/ui/use-toast';
// Supabase import
import { supabase } from '@shared/config/supabase';

export default function FindMatch() {
  const { isAuthenticated, user } = useAuth();
  const { isAdmin } = useAdmin();
  const [isPremium, setIsPremium] = useState(() => {
    const userProfile = localStorage.getItem('userProfile');
    if (userProfile) {
      const profile = JSON.parse(userProfile);
      return profile.isPremium || isAdmin;
    }
    return false;
  });
  const navigate = useNavigate();
  const { toast } = useToast();

  const [lobbyMode, setLobbyMode] = useState<'create' | 'join' | null>(null);
  const [lobbyCodeInput, setLobbyCodeInput] = useState('');
  const [createdLobbyCode, setCreatedLobbyCode] = useState<string | null>(null);
  const [isCreatingLobby, setIsCreatingLobby] = useState(false);
  const [isJoiningLobby, setIsJoiningLobby] = useState(false);

  const generateLobbyCode = () => {
    return Math.random().toString(36).substring(2, 8).toUpperCase();
  };

  const handleCreateLobby = async () => {
    setIsCreatingLobby(true);
    setLobbyMode('create');
    setCreatedLobbyCode(null);
    setLobbyCodeInput('');

    const newCode = generateLobbyCode();
    console.log("Creating lobby with new code:", newCode, "and host ID:", user?.uid || `guest_${Date.now()}`);

    try {
      // First, check if lobbies table exists by trying to retrieve its structure
      const { error: tableCheckError } = await supabase
        .from('lobbies')
        .select('id', { count: 'exact', head: true });
      
      if (tableCheckError) {
        console.error("Error checking lobbies table:", tableCheckError);
        throw new Error(`Table error: ${tableCheckError.message}`);
      }
      
      // Now proceed with insert
      const { error } = await supabase
        .from('lobbies')
        .insert({
          code: newCode,
          host_id: user?.uid || `guest_${Date.now()}`, // Use Firebase UID or fallback to guest ID
          creator_name: user?.displayName || user?.email || 'Anonymous Host', // Use actual user info
          status: 'waiting',
        });

      if (error) throw error;

      setCreatedLobbyCode(newCode);
      toast({ title: "Lobby Created!", description: `Share the code: ${newCode}` });
      console.log(`Navigating host to lobby: /lobby/${newCode}`);
      navigate(`/lobby/${newCode}`);

    } catch (error: any) {
      console.error("Error creating Supabase lobby: ", error);
      
      // Handle different types of error objects
      const supabaseError = error?.error || error;
      const errorMessage = supabaseError?.message || error?.message || "Unknown error";
      const errorDetails = supabaseError?.details || error?.details || "";
      const errorHint = supabaseError?.hint || error?.hint || "";
      const errorCode = supabaseError?.code || error?.code || "";
      const errorStatus = supabaseError?.status || error?.status || "";
      
      console.error("Error details:", {
        message: errorMessage,
        details: errorDetails,
        hint: errorHint,
        code: errorCode,
        status: errorStatus
      });

      let userMessage = "Failed to create lobby. Please try again.";
      if (errorMessage.includes('duplicate key value violates unique constraint')) {
          userMessage = "Failed to create lobby. Generated code already exists. Please try again.";
      } else if (errorMessage.includes('check constraint')) {
          userMessage = "Failed to create lobby due to invalid data.";
      } else if (errorDetails.includes('violates row-level security policy')) {
          userMessage = "You do not have permission to create a lobby.";
      } else if (errorMessage.includes('Table error')) {
          userMessage = "Lobby system not available. Please try again later.";
      } else if (errorMessage.includes('404') || errorStatus === 404) {
          userMessage = "Lobby system is being set up. Please refresh and try again.";
      } else if (errorMessage) {
          userMessage = `Failed to create lobby: ${errorMessage}`;
      }
      
      toast({ title: "Error Creating Lobby", description: userMessage, variant: "destructive" });
      setLobbyMode(null);
    } finally {
      setIsCreatingLobby(false);
    }
  };

  const handleInitiateJoin = () => {
    setLobbyMode('join');
    setCreatedLobbyCode(null);
    setLobbyCodeInput('');
  };

  const handleJoinLobby = async () => {
    const codeToJoin = lobbyCodeInput.toUpperCase().trim();
    if (!codeToJoin || codeToJoin.length !== 6) {
       toast({ title: "Invalid Code", description: "Please enter a 6-character lobby code.", variant: "destructive" });
      return;
    }
    setIsJoiningLobby(true);
    console.log("Attempting to join lobby with code:", codeToJoin);

    try {
      const { data: lobbyData, error: selectError } = await supabase
        .from('lobbies')
        .select('*')
        .eq('code', codeToJoin)
        .maybeSingle();

      if (selectError) throw new Error("Failed to check lobby status.");
      if (!lobbyData) throw new Error(`Lobby ${codeToJoin} does not exist.`);

      if (lobbyData.status !== 'waiting' || lobbyData.opponent_id) {
        throw new Error(`Lobby ${codeToJoin} is not available to join.`);
      }

      console.log(`Found lobby to join:`, lobbyData);
      console.log(`Updating lobby with opponent details and setting status to 'ready'`);
      
      // Prepare update payload
      const updatePayload = {
        opponent_id: user?.uid || `guest_${Date.now()}`, // Use Firebase UID or fallback
        opponent_name: user?.displayName || user?.email || 'Anonymous Player', // Use actual user info
        status: 'ready'
      };
      
      console.log(`Update payload:`, updatePayload);

      const { data: updatedData, error: updateError } = await supabase
        .from('lobbies')
        .update(updatePayload)
        .eq('code', codeToJoin)
        .select();

      if (updateError) throw new Error("Failed to join the lobby.");
      
      console.log(`Lobby successfully updated:`, updatedData);

      toast({ title: "Joining Lobby...", description: `Connecting to lobby ${codeToJoin}` });
      navigate(`/lobby/${codeToJoin}`);

    } catch (error: any) {
      console.error("Error joining Supabase lobby: ", error);
      toast({ title: "Error Joining Lobby", description: error.message || "Please check the code and try again.", variant: "destructive" });
      setIsJoiningLobby(false);
    }
  };

  const copyToClipboard = (text: string) => {
    if (!text) return;
    navigator.clipboard.writeText(text).then(() => {
      toast({ title: "Lobby Code Copied!", description: "Share it with your friend." });
    }, (err) => {
      console.error('Failed to copy lobby code: ', err);
      toast({ title: "Copy Failed", description: "Could not copy code to clipboard.", variant: "destructive" });
    });
  };

  const renderHeader = () => {
    if (!isAuthenticated) return <GuestHeader />;
    if (isPremium) return <PremiumHeader />;
    return <UserHeader />;
  };

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-background to-muted/40">
      {renderHeader()}
      
      <main className="flex-grow container mx-auto py-8 px-4">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold mb-1">Multiplayer Lobby</h1>
            <p className="text-muted-foreground">Create a private lobby or join a friend's.</p>
          </div>
          
          <div className="flex items-center gap-3 mt-4 sm:mt-0">
            {isAuthenticated && isPremium && (
              <Badge className="bg-green-500/80 hover:bg-green-600/80 text-white px-3 py-1.5 text-sm cursor-default">
                 {isAdmin ? (
                  <>
                    <Shield className="h-5 w-5 mr-1.5" />
                    Admin Access
                  </>
                ) : (
                  <>
                    <Crown className="h-4 w-4 mr-1" />
                    Premium Active
                  </>
                )}
              </Badge>
            )}
          </div>
        </div>
        
        <div className="max-w-md mx-auto">
          <Card className="p-6 shadow-lg">
            <div className="space-y-5">
              {!lobbyMode && !createdLobbyCode && (
                <Button
                  className="w-full bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white transition-all duration-300 ease-in-out transform hover:scale-105"
                  size="lg"
                  onClick={handleCreateLobby}
                  disabled={isCreatingLobby}
                >
                  {isCreatingLobby ? (
                    <>
                      <Search className="mr-2 h-4 w-4 animate-spin" />
                      Creating Lobby...
                    </>
                  ) : (
                     'Create Private Lobby'
                  )}
                </Button>
              )}

              {createdLobbyCode && lobbyMode === 'create' && (
                <div className="text-center p-4 border border-dashed rounded-lg bg-muted/50">
                  <p className="text-sm text-muted-foreground mb-2">Your Lobby is Ready!</p>
                  <p className="text-xs text-muted-foreground mb-3">Share this code with your friend:</p>
                  <div className="flex items-center justify-center gap-2 bg-background p-3 rounded-md">
                    <span className="text-2xl font-bold tracking-widest font-mono select-all text-primary">{createdLobbyCode}</span>
                    <Button variant="ghost" size="icon" onClick={() => copyToClipboard(createdLobbyCode)} aria-label="Copy lobby code">
                      <Copy className="h-5 w-5 text-muted-foreground hover:text-primary" />
                    </Button>
                  </div>
                   <p className="text-xs text-muted-foreground mt-3 animate-pulse">Waiting for opponent to join...</p>
                   <Button variant="link" size="sm" onClick={() => { setCreatedLobbyCode(null); setLobbyMode(null); /* TODO: Delete lobby in Supabase */ }} className="mt-2 text-destructive hover:text-destructive/80">Cancel Lobby</Button>
                </div>
              )}

              {!createdLobbyCode && !lobbyMode && (
                 <div className="relative my-4">
                   <div className="absolute inset-0 flex items-center">
                     <span className="w-full border-t" />
                   </div>
                   <div className="relative flex justify-center text-xs uppercase">
                     <span className="bg-card px-2 text-muted-foreground">
                       Or
                     </span>
                   </div>
                 </div>
               )}

               {!lobbyMode && !createdLobbyCode && (
                <Button
                  className="w-full"
                  variant="outline"
                  size="lg"
                  onClick={handleInitiateJoin}
                  disabled={isJoiningLobby || isCreatingLobby}
                >
                  Join Lobby with Code
                </Button>
              )}

               {lobbyMode === 'join' && (
                <div className="space-y-3">
                   <p className="text-sm text-center text-muted-foreground">Enter the 6-character code shared by your friend.</p>
                   <div className="flex flex-col sm:flex-row gap-2">
                    <Input
                      id="lobby-code-input"
                      placeholder="ABCDEF"
                      value={lobbyCodeInput}
                      onChange={(e) => setLobbyCodeInput(e.target.value.toUpperCase().trim())}
                      className="flex-grow text-center sm:text-left font-mono tracking-widest"
                      maxLength={6}
                      autoFocus
                      aria-label="Lobby Code Input"
                    />
                    <Button
                       onClick={handleJoinLobby}
                       disabled={isJoiningLobby || !lobbyCodeInput || lobbyCodeInput.length !== 6}
                       className="w-full sm:w-auto"
                       aria-controls="lobby-code-input"
                    >
                      {isJoiningLobby ? (
                        <>
                          <Search className="mr-2 h-4 w-4 animate-spin" />
                          Joining...
                        </>
                      ) : (
                        'Join'
                      )}
                    </Button>
                  </div>
                   <Button variant="link" size="sm" onClick={() => setLobbyMode(null)} className="w-full text-muted-foreground hover:text-foreground/80">Back</Button>
                </div>
              )}
            </div>
          </Card>
        </div>
      </main>
      <LandingFooter />
    </div>
  );
} 