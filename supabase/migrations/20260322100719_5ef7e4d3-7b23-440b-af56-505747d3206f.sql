
-- Timestamp update function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Projects table
CREATE TABLE public.projects (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL DEFAULT 'My Building',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Projects are publicly readable" ON public.projects FOR SELECT USING (true);
CREATE POLICY "Anyone can insert projects" ON public.projects FOR INSERT WITH CHECK (true);

CREATE TRIGGER update_projects_updated_at BEFORE UPDATE ON public.projects FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Building profiles
CREATE TABLE public.building_profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE NOT NULL,
  size_sqm NUMERIC,
  heating_type TEXT,
  postcode TEXT,
  climate_zone TEXT,
  building_year INTEGER,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);
ALTER TABLE public.building_profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Building profiles are publicly readable" ON public.building_profiles FOR SELECT USING (true);
CREATE POLICY "Anyone can insert building profiles" ON public.building_profiles FOR INSERT WITH CHECK (true);

CREATE TRIGGER update_building_profiles_updated_at BEFORE UPDATE ON public.building_profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Energy bills
CREATE TABLE public.bills (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE NOT NULL,
  file_name TEXT,
  file_url TEXT,
  extracted_kwh NUMERIC,
  extracted_cost_sek NUMERIC,
  extraction_json JSONB,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);
ALTER TABLE public.bills ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Bills are publicly readable" ON public.bills FOR SELECT USING (true);
CREATE POLICY "Anyone can insert bills" ON public.bills FOR INSERT WITH CHECK (true);

-- Recommendations (AI output)
CREATE TABLE public.recommendations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE NOT NULL,
  actions JSONB NOT NULL DEFAULT '[]',
  clauses JSONB DEFAULT '[]',
  total_savings_sek NUMERIC,
  total_co2_kg NUMERIC,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);
ALTER TABLE public.recommendations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Recommendations are publicly readable" ON public.recommendations FOR SELECT USING (true);
CREATE POLICY "Anyone can insert recommendations" ON public.recommendations FOR INSERT WITH CHECK (true);

-- Salvage items (materials circularity)
CREATE TABLE public.salvage_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  condition TEXT CHECK (condition IN ('excellent', 'good', 'fair', 'poor')),
  photo_url TEXT,
  estimated_value_sek NUMERIC,
  co2_saved_kg NUMERIC,
  status TEXT NOT NULL DEFAULT 'listed' CHECK (status IN ('listed', 'reserved', 'picked_up', 'disposed')),
  listing_text TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);
ALTER TABLE public.salvage_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Salvage items are publicly readable" ON public.salvage_items FOR SELECT USING (true);
CREATE POLICY "Anyone can insert salvage items" ON public.salvage_items FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can update salvage items" ON public.salvage_items FOR UPDATE USING (true);

CREATE TRIGGER update_salvage_items_updated_at BEFORE UPDATE ON public.salvage_items FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
