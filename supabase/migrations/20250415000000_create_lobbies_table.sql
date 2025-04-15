-- Create lobbies table
CREATE TABLE IF NOT EXISTS public.lobbies (
    id SERIAL PRIMARY KEY,
    code VARCHAR(10) NOT NULL UNIQUE,
    host_id VARCHAR(255) NOT NULL,
    creator_name VARCHAR(255),
    opponent_id VARCHAR(255),
    opponent_name VARCHAR(255),
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    status VARCHAR(50) DEFAULT 'waiting' NOT NULL,
    
    CONSTRAINT status_check CHECK (status IN ('waiting', 'ready', 'starting', 'cancelled'))
);

-- Add RLS (Row Level Security) policies
ALTER TABLE public.lobbies ENABLE ROW LEVEL SECURITY;

-- Create policy for reading lobbies - anyone can read lobbies
CREATE POLICY "Anyone can read lobbies" ON public.lobbies
    FOR SELECT USING (true);

-- Create policy for inserting lobbies - anyone can create a lobby
CREATE POLICY "Anyone can create lobbies" ON public.lobbies
    FOR INSERT WITH CHECK (true);

-- Create policy for updating lobbies - only host can update their lobby or opponent their own fields
CREATE POLICY "Hosts can update their lobbies" ON public.lobbies
    FOR UPDATE USING (
        auth.uid()::text = host_id OR 
        auth.uid()::text = opponent_id
    );

-- Create policy for deleting lobbies - only the host can delete their lobby
CREATE POLICY "Hosts can delete their lobbies" ON public.lobbies
    FOR DELETE USING (auth.uid()::text = host_id);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS lobbies_code_idx ON public.lobbies (code);
CREATE INDEX IF NOT EXISTS lobbies_host_id_idx ON public.lobbies (host_id);
CREATE INDEX IF NOT EXISTS lobbies_opponent_id_idx ON public.lobbies (opponent_id);
CREATE INDEX IF NOT EXISTS lobbies_status_idx ON public.lobbies (status); 