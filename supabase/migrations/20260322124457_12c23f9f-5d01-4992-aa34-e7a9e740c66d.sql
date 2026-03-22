
-- Enable pgvector extension
CREATE EXTENSION IF NOT EXISTS vector WITH SCHEMA extensions;

-- Regulation embeddings table for RAG
CREATE TABLE public.regulation_embeddings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  content text NOT NULL,
  category text NOT NULL DEFAULT 'general',
  source text,
  embedding vector(1536),
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Index for fast similarity search
CREATE INDEX ON public.regulation_embeddings USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);

-- RLS: publicly readable (regulations are reference data)
ALTER TABLE public.regulation_embeddings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Regulations are publicly readable"
  ON public.regulation_embeddings
  FOR SELECT
  TO public
  USING (true);

-- Analysis sessions table for memory across sessions
CREATE TABLE public.analysis_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid REFERENCES public.projects(id) ON DELETE CASCADE NOT NULL,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  building_profile jsonb,
  bill_summary jsonb,
  recommendations jsonb,
  agent_steps jsonb DEFAULT '[]'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.analysis_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can insert analysis sessions"
  ON public.analysis_sessions
  FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Anyone can create analysis sessions"
  ON public.analysis_sessions
  FOR INSERT
  TO public
  WITH CHECK (true);

-- Match function for similarity search
CREATE OR REPLACE FUNCTION public.match_regulations(
  query_embedding vector(1536),
  match_threshold float DEFAULT 0.7,
  match_count int DEFAULT 5,
  filter_category text DEFAULT NULL
)
RETURNS TABLE (
  id uuid,
  title text,
  content text,
  category text,
  source text,
  similarity float
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT
    re.id,
    re.title,
    re.content,
    re.category,
    re.source,
    1 - (re.embedding <=> query_embedding) AS similarity
  FROM public.regulation_embeddings re
  WHERE
    1 - (re.embedding <=> query_embedding) > match_threshold
    AND (filter_category IS NULL OR re.category = filter_category)
  ORDER BY re.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;
