import { createClient } from "@supabase/supabase-js";
const supabaseUrl = "https://xzycksgsiymjgempvqli.supabase.co";
const supabaseKey =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh6eWNrc2dzaXltamdlbXB2cWxpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDU4MDQ4NTMsImV4cCI6MjA2MTM4MDg1M30.ziNnuZyMd6VjHtEX0PUkXDjCntzyVubNHliisacY1vA";
export const supabase = createClient(supabaseUrl, supabaseKey);
