import { createClient } from "@supabase/supabase-js";
const supabaseUrl = "https://fklqaiubrzqmueupfbim.supabase.co";
const supabaseKey =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZrbHFhaXVicnpxbXVldXBmYmltIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDQ5ODQ0OTQsImV4cCI6MjA2MDU2MDQ5NH0.Sjai4s7WOP_HkTDcc1-BXg5WJmj77hsZODL3i8XmUYY";
export const supabase = createClient(supabaseUrl, supabaseKey);
